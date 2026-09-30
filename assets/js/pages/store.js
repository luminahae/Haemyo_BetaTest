import { el, clear, toast } from "../utils/dom.js";
import { pageHeader, backLink, noticeBox } from "./_shared.js";
import { openModal as _openModal } from "./_shared.js";
import { getPaymentConfig, isPaymentReady } from "../config.js";
import { getCoins, checkInStatus, claimCheckIn, redeemLicense, creditPaidReturn, COIN_PRICE_KRW, PRICE_TABLE, redeemCode, isAdmin, setAdmin, isFamily, setFamily, monthlyCodes, MONTHLY_CODES, isDayPass, dayPassStatus, DAYPASS_MAX, applyDayPass, dayPassScopeName } from "../wallet.js";

export function renderStore({ navigate }) {
  const root = el("div", {});

  // 결제 성공 후 리다이렉트로 돌아온 경우 → 코인 자동 충전 (키 입력 없이)
  handlePaidReturn();
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("코인 충전소", "코인으로 더 깊게 보기",
    "깊이 있는 해석은 코인으로 열어요. 매일 출석하면 무료 코인도 받을 수 있어요."));

  // 코인 잔액
  root.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel panel-gold", style: "display:flex; align-items:center; gap:14px;" }, [
      coinMark("lg"),
      el("div", { style: "flex:1;" }, [
        el("p", { class: "muted tiny", text: "내 코인" }),
        el("p", { id: "coin-balance", class: "serif", style: "font-size:2rem; font-weight:800; color:var(--c-gold-soft); line-height:1;", text: String(getCoins()) }),
      ]),
      el("span", { class: "muted tiny", text: `코인 1개 = 해석 1회` }),
    ]),
  ]));

  // 출석체크
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [checkInCard()]));

  // 충전 패키지
  root.append(el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-5);" }, [
    el("h2", { style: "font-size:1.1rem;", text: "코인 충전" }),
    chargeArea(),
  ]));

  // 결제=자동 충전 안내 (+ 안 들어왔을 때만 쓰는 수동 키 입력)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [topupInfoCard()]));

  // 쿠폰 · 관리자 코드
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [codeBox()]));

  // 코인 사용 안내 + 정직한 고지
  root.append(el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel" }, [
      el("p", { style: "font-weight:700; margin-bottom:10px;", text: "가격표" }),
      ...PRICE_TABLE.map((g) => el("div", { style: "margin-bottom: var(--sp-3);" }, [
        el("p", { class: "eyebrow", style: "margin-bottom:6px;", text: g.group }),
        el("div", { class: "price-rows" }, g.items.map(([name, cost]) => el("div", { class: "price-row" }, [
          el("span", { text: name }),
          el("span", { class: "price-coin" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: String(cost) })]),
        ]))),
      ])),
      el("p", { class: "muted tiny", style: "margin-top:6px;", text: "한 번 연 해석은 다시 볼 때 무료예요. (오늘·평일·주말 운세는 날짜가 바뀌면 새로) 기본 명식·타로 뽑기·오라클은 무료." }),
    ]),
    noticeBox("privacy", "충전 결제는 외부 결제사(예: Lemon Squeezy·Gumroad)의 보안 페이지에서 처리됩니다. 카드번호는 이 앱에 저장되지 않아요."),
    noticeBox("info", "코인 잔액은 이 브라우저에 저장돼요(정적 사이트). 기기를 바꾸면 로그인/백업으로 옮기거나, 충전 키로 다시 받을 수 있어요."),
  ]));

  return root;
}

function refreshBalance() {
  const n = document.getElementById("coin-balance");
  if (n) n.textContent = String(getCoins());
}

/* 결제 성공 리다이렉트 처리 — URL의 pack·order 파라미터로 코인 자동 지급 후 파라미터 제거 */
function handlePaidReturn() {
  let params = {};
  try {
    const hash = location.hash || "";
    const qi = hash.indexOf("?");
    if (qi >= 0) params = Object.fromEntries(new URLSearchParams(hash.slice(qi + 1)));
    // 일부 결제사는 해시가 아닌 실제 쿼리스트링으로 되돌려줌
    if (!params.order && !params.order_id && location.search) {
      params = Object.assign(Object.fromEntries(new URLSearchParams(location.search)), params);
    }
  } catch { /* ignore */ }
  if (!(params.pack || params.coins || params.paid)) return;
  const res = creditPaidReturn(params);
  // 파라미터 정리(새로고침 중복 방지 표시)
  try { history.replaceState(null, "", location.pathname + location.search + "#/store"); } catch { /* ignore */ }
  if (res.ok) {
    setTimeout(() => showPopup(`코인 ${res.added}개가 충전됐어요!`, "결제 완료 · 바로 사용 가능"), 60);
  } else if (res.reason === "dup") {
    setTimeout(() => toast("이미 충전된 결제예요."), 60);
  }
}

function checkInCard() {
  const wrap = el("div", { class: "panel" });
  function render() {
    clear(wrap);
    const s = checkInStatus();
    wrap.append(
      el("div", { style: "display:flex; align-items:center; gap:10px;" }, [
        coinMark(),
        el("div", { style: "flex:1;" }, [
          el("p", { style: "font-weight:700;", text: "매일 출석 체크" }),
          el("p", { class: "muted tiny", text: s.streak ? `연속 ${s.streak}일째 · 7일마다 보너스 +${3}` : "출석하면 무료 코인을 드려요 · 7일 연속 보너스" }),
        ]),
      ]),
      el("div", { class: "streak-dots", style: "display:flex; gap:6px; margin:12px 0;" },
        (() => {
          const cyc = s.streak % 7;
          const filled = (s.streak > 0 && cyc === 0) ? 7 : cyc;
          return Array.from({ length: 7 }, (_, i) => el("span", { class: "streak-dot" + (i < filled ? " on" : "") + (i === 6 ? " bonus" : "") }));
        })()),
      s.claimedToday
        ? el("button", { class: "btn btn-ghost btn-block", disabled: true }, [el("span", { text: "오늘 출석 완료" })])
        : el("button", { class: "btn btn-primary btn-block", onclick: () => {
            const r = claimCheckIn();
            if (r.ok) {
              toast(`출석 완료 · 코인 +${r.reward}${r.bonus ? " (연속 보너스 포함)" : ""}`);
              refreshBalance(); render();
            }
          } }, [el("span", { text: `출석하고 코인 받기 · +${s.reward}` })]),
    );
  }
  render();
  return wrap;
}

function chargeArea() {
  const cfg = getPaymentConfig();
  if (!isPaymentReady()) {
    return el("div", { class: "panel", style: "text-align:center;" }, [
      el("p", { style: "font-weight:700;", text: "충전 준비 중" }),
      el("p", { class: "muted tiny", style: "margin-top:6px;", text: "결제 연결이 아직 설정되지 않았어요. 지금은 출석 코인으로 이용해 보세요. (운영자: SETUP.md)" }),
    ]);
  }
  const grid = el("div", { class: "coin-packs" });
  cfg.packages.filter((p) => p && p.checkoutUrl).forEach((p) => {
    grid.append(el("button", { class: "panel coin-pack", onclick: () => { window.open(p.checkoutUrl, "_blank", "noopener"); toast("결제 페이지를 새 탭에서 열었어요. 결제 후 받은 키를 입력해 충전하세요."); } }, [
      p.badge ? el("span", { class: "pack-badge", text: p.badge }) : null,
      el("span", { class: "pack-coins" }, [coinMark(), el("span", { text: String(p.coins) })]),
      el("span", { class: "pack-price", text: p.priceLabel || "" }),
    ].filter(Boolean)));
  });
  return grid;
}

/* 결제=자동충전 안내 카드 (수동 키 입력 창은 제거) */
function topupInfoCard() {
  return el("div", { class: "panel" }, [
    el("div", { style: "display:flex; align-items:center; gap:10px;" }, [
      coinMark(),
      el("div", { style: "flex:1;" }, [
        el("p", { style: "font-weight:700;", text: "결제하면 코인이 자동 충전돼요" }),
        el("p", { class: "muted tiny", style: "margin-top:4px;", text: "충전 패키지를 결제하면 완료 후 자동으로 코인이 쌓여요. 따로 키를 입력할 필요가 없어요." }),
      ]),
    ]),
  ]);
}

function redeemBox(bare) {
  const input = el("input", { class: "input", type: "text", placeholder: "결제 후 받은 충전 키", autocomplete: "off", spellcheck: "false" });
  const msg = el("p", { class: "field-error", "aria-live": "polite", style: "margin-top:6px;" });
  const btn = el("button", { class: "btn btn-ghost btn-block", style: "margin-top:10px;" }, [el("span", { text: "충전 키로 코인 받기" })]);
  btn.addEventListener("click", async () => {
    msg.style.color = ""; msg.textContent = "";
    btn.disabled = true; clear(btn); btn.append(el("span", { text: "확인 중…" }));
    const res = await redeemLicense(input.value);
    if (res.ok) {
      toast(`코인 ${res.added}개 충전 완료`);
      refreshBalance(); input.value = "";
      btn.disabled = false; clear(btn); btn.append(el("span", { text: "충전 키로 코인 받기" }));
    } else {
      msg.style.color = "var(--c-danger)"; msg.textContent = res.message;
      btn.disabled = false; clear(btn); btn.append(el("span", { text: "충전 키로 코인 받기" }));
    }
  });
  return el("div", { class: "panel" }, [
    el("p", { style: "font-weight:700; margin-bottom:8px;", text: "이미 결제하셨나요?" }),
    el("p", { class: "muted tiny", style: "margin-bottom:8px;", text: "결제 후 이메일로 받은 키를 입력하면 코인이 충전돼요." }),
    input, btn, msg,
  ]);
}

function codeBox() {
  const wrap = el("div", { class: "panel" });
  function render() {
    clear(wrap);
    if (isAdmin()) {
      wrap.append(
        el("p", { style: "font-weight:700; color:var(--c-gold-soft);", text: "관리자 모드 · 무제한 이용 중" }),
        el("p", { class: "muted tiny", style: "margin:6px 0 10px;", text: "모든 해석이 코인 없이 열려요. (내 코인 ∞)" }),
        el("button", { class: "btn btn-quiet btn-sm", onclick: () => { setAdmin(false); toast("관리자 모드를 껐어요."); render(); } }, [el("span", { text: "관리자 모드 끄기" })]),
      );
      return;
    }
    if (isFamily()) {
      wrap.append(
        el("p", { style: "font-weight:700; color:var(--c-gold-soft);", text: "엄마 모드 · 무제한 이용 중 💗" }),
        el("p", { class: "muted tiny", style: "margin:6px 0 10px;", text: "모든 해석을 코인 없이 볼 수 있어요. (내 코인 ∞)" }),
        el("button", { class: "btn btn-quiet btn-sm", onclick: () => { setFamily(false); toast("엄마 모드를 껐어요."); render(); } }, [el("span", { text: "엄마 모드 끄기" })]),
      );
      return;
    }
    const input = el("input", { class: "input", type: "text", placeholder: "쿠폰 또는 코드 입력", autocomplete: "off", spellcheck: "false" });
    const msg = el("p", { class: "field-error", "aria-live": "polite", style: "margin-top:6px;" });
    const btn = el("button", { class: "btn btn-ghost btn-block", style: "margin-top:10px;" }, [el("span", { text: "코드 적용" })]);
    btn.addEventListener("click", () => {
      const res = redeemCode(input.value);
      if (res.ok && res.kind === "daypass-choose") {
        const m = _openModal([
          el("p", { class: "muted", style: "margin-bottom:10px;", text: "오늘 하루 무엇을 무제한으로 볼까요? 하나를 골라 주세요. (이 코드는 한 사람당 3번까지)" }),
          el("div", { class: "dp-opts" }, res.options.map((o) => el("button", { class: "dp-opt", type: "button", onclick: () => {
            const r2 = applyDayPass(res.id, o.id); m.close();
            if (r2.ok) { showPopup(r2.popup, r2.popupSub, r2.emoji); refreshBalance(); input.value = ""; render(); }
            else { msg.style.color = "var(--c-danger)"; msg.textContent = r2.message; }
          } }, [el("b", { text: o.name }), el("span", { class: "tiny muted", text: o.desc })]))),
        ], { title: `${res.emoji} ${res.name}` });
        return;
      }
      if (res.ok) {
        if (res.popup) showPopup(res.popup, res.popupSub || `코인 +${res.coins} 🎁`, res.emoji || "☀️");
        else toast(res.message);
        if (res.kind === "coupon" || res.kind === "daypass") refreshBalance();
        input.value = ""; render();
      } else { msg.style.color = "var(--c-danger)"; msg.textContent = res.message; }
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });
    wrap.append(
      el("p", { style: "font-weight:700; margin-bottom:4px;", text: "쿠폰 · 코드" }),
      el("p", { class: "muted tiny", style: "margin-bottom:8px;", text: "이벤트 쿠폰이나 관리자 코드를 입력하세요. 하루 무제한 코드는 코드마다 한 사람당 3번까지 쓸 수 있어요." }),
      input, btn, msg,
    );
    if (isDayPass()) wrap.append(el("p", { class: "tiny", style: "margin-top:8px; color:#c6f0d8; font-weight:800;", text: `🌈 오늘 하루 ${dayPassScopeName()} 무제한 이용 중 · 자정까지 열려요` }));
    const usedDP = dayPassStatus().filter((c) => c.used > 0);
    if (usedDP.length) wrap.append(el("p", { class: "tiny muted", style: "margin-top:6px;", text: "하루 무제한 코드 남은 횟수 · " + usedDP.map((c) => `${c.emoji} ${c.name} ${c.left}/${DAYPASS_MAX}`).join(" · ") }));
    const d = new Date(); const nm = d.getMonth() === 11 ? 1 : d.getMonth() + 2;
    monthlyCodes().forEach((id) => {
      const mc = MONTHLY_CODES.find((m) => m.id === id); if (!mc) return;
      wrap.append(el("p", { class: "tiny", style: "margin-top:8px; color:var(--c-gold-soft); font-weight:700;", text: `${mc.emoji} ${mc.name} 등록됨 · 다음 코인 ${mc.coins}개는 ${nm}월 1일에 들어와요` }));
    });
  }
  render();
  return wrap;
}

function bullet(text) {
  return el("p", { style: "display:flex; gap:8px; align-items:flex-start; font-size:var(--fs-sm);" }, [
    el("span", { style: "color:var(--c-gold);", text: "•" }), el("span", { class: "muted", text }),
  ]);
}

/* 코인 마크 — 이모지 대신 CSS 골드 디스크 */
function coinMark(size) {
  return el("span", { class: "coin-mark" + (size === "lg" ? " lg" : size === "sm" ? " sm" : ""), "aria-hidden": "true" });
}

/* 특별 쿠폰 팝업 */
function showPopup(title, sub, emoji = "☀️") {
  const ov = el("div", { class: "popup-ov", onclick: (e) => { if (e.target === ov) ov.remove(); } }, [
    el("div", { class: "popup-card" }, [
      el("div", { class: "popup-sun", "aria-hidden": "true", text: emoji }),
      el("p", { class: "serif", style: "font-size:1.35rem; font-weight:700; line-height:1.4;", text: title }),
      sub ? el("p", { style: "margin-top:8px; font-weight:800; color:var(--c-gold-soft);", text: sub }) : null,
      el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => ov.remove() }, [el("span", { text: "고마워, 해묘 🐈" })]),
    ].filter(Boolean)),
  ]);
  document.body.appendChild(ov);
}
