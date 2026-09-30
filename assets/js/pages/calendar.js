import { el, clear } from "../utils/dom.js";
import { pageHeader, backLink, noticeBox, loadDisclaimer } from "./_shared.js";
import { getMyBirth } from "../state.js";
import { computeSaju } from "../saju/manse.js";
import { monthScores, taegilMonth, TAEGIL_PURPOSES } from "../saju/extras.js";
import { todayFortune } from "../saju/fortune.js";
import { isUnlocked, unlock, getCoins, costOf, getViewedDays, dayPreviewCost, buyDayPreview } from "../wallet.js";
import { toast } from "../utils/dom.js";

const WD = ["일", "월", "화", "수", "목", "금", "토"];
const scoreColor = (s) => s >= 78 ? "#9fd3b7" : s >= 60 ? "#e0b878" : s >= 45 ? "#d7c4c8" : "#e2919a";

export function renderCalendar({ navigate }) {
  loadDisclaimer();
  const my = getMyBirth();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("운세 캘린더", "날짜별 운세 한눈에", "‘오늘의 운세’를 연 날이 캘린더에 쌓여요. 한 달 전체를 한 번에 열려면 코인 30개!"));
  if (!my) {
    root.append(el("section", { class: "wrap section-gap" }, [
      noticeBox("info", "생년월일이 필요해요."),
      el("button", { class: "btn btn-primary", onclick: () => navigate("/saju") }, [el("span", { text: "내 정보 입력하고 시작" })]),
    ]));
    return root;
  }
  const profile = computeSaju(my);
  const now = new Date();
  let year = now.getFullYear(), month = now.getMonth() + 1;
  const cost = costOf("calendar");

  const host = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  root.append(host);

  function itemId() { return `calendar:${my.birthDate}:${year}-${month}`; }
  let mode = "fortune";
  let taegilPurpose = "meet";

  function paint() {
    clear(host);
    // 모드 탭
    host.append(el("div", { class: "method-tabs", style: "margin-bottom: var(--sp-3);" }, [
      el("button", { class: "method-tab" + (mode === "fortune" ? " on" : ""), onclick: () => { mode = "fortune"; paint(); } }, [el("span", { text: "운세 캘린더" })]),
      el("button", { class: "method-tab" + (mode === "taegil" ? " on" : ""), onclick: () => { mode = "taegil"; paint(); } }, [el("span", { text: "택일 (좋은 날)" })]),
    ]));
    // 월 네비
    host.append(el("div", { class: "cal-nav" }, [
      el("button", { class: "cal-arrow", "aria-label": "이전 달", onclick: () => { month--; if (month < 1) { month = 12; year--; } paint(); } }, [el("span", { text: "‹" })]),
      el("span", { class: "serif", style: "font-size:1.2rem;", text: `${year}년 ${month}월` }),
      el("button", { class: "cal-arrow", "aria-label": "다음 달", onclick: () => { month++; if (month > 12) { month = 1; year++; } paint(); } }, [el("span", { text: "›" })]),
    ]));

    if (mode === "taegil") { paintTaegil(); return; }

    const allUnlocked = isUnlocked(itemId());
    const viewed = new Set(getViewedDays());
    const scores = monthScores(profile, year, month);
    const byDay = {}; scores.forEach((s) => { byDay[s.day] = s; });
    const first = new Date(year, month - 1, 1).getDay();
    const dim = new Date(year, month, 0).getDate();
    const isThisMonth = (year === now.getFullYear() && month === now.getMonth() + 1);
    const isOpen = (d) => allUnlocked || viewed.has(`${year}-${month}-${d}`);

    // 한 번에 보기 (열어본 날 비율만큼 할인)
    if (!allUnlocked) {
      const coins = getCoins();
      const openedInMonth = [...viewed].filter((k) => k.startsWith(`${year}-${month}-`)).length;
      const discPct = Math.round((openedInMonth / dim) * 100);
      const payCost = Math.max(1, Math.round(cost * (1 - openedInMonth / dim)));
      host.append(el("button", { class: "btn btn-primary btn-block", style: "margin-bottom:6px;", onclick: () => {
        if (coins >= payCost) { const r = unlock(itemId(), payCost); if (r.ok) { toast(`${month}월 전체를 열었어요`); paint(); } else { toast("코인이 부족해요."); navigate("/store"); } }
        else { toast(`한 번에 보기는 코인 ${payCost}개가 필요해요.`); navigate("/store"); }
      } }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `이 달 한 번에 보기 · 코인 ${payCost}개` })]));
      host.append(el("p", { class: "muted tiny", style: "text-align:center; margin-bottom: 6px;",
        text: discPct > 0 ? `이 달에 ${openedInMonth}일 열어봐서 ${discPct}% 할인! (원가 ${cost}코인)` : `날마다 ‘오늘의 운세’를 열면 열어본 만큼 할인돼요 (원가 ${cost}코인)` }));
      const pcv = dayPreviewCost();
      host.append(el("p", { class: "muted tiny", style: "text-align:center; margin-bottom: var(--sp-3);",
        text: pcv.discounted ? `‘?’ 날짜를 눌러 미리보기 · 지금 코인 ${pcv.cost}개 (24시간 할인 중!)` : "‘?’ 날짜를 눌러 그날만 미리보기 · 코인 2개 (한 번 열면 24시간 동안 다른 날은 1코인)" }));
    }

    const grid = el("div", { class: "cal-grid" });
    WD.forEach((w, i) => grid.append(el("span", { class: "cal-wd" + (i === 0 ? " sun" : i === 6 ? " sat" : ""), text: w })));
    for (let i = 0; i < first; i++) grid.append(el("span", {}));
    for (let d = 1; d <= dim; d++) {
      const sc = byDay[d];
      const isToday = isThisMonth && d === now.getDate();
      if (isOpen(d)) {
        grid.append(el("button", { class: "cal-day" + (isToday ? " today" : ""), onclick: () => showDay(d, sc) }, [
          el("span", { class: "cal-d", text: String(d) }),
          el("span", { class: "cal-score", style: `color:${scoreColor(sc.score)};`, text: String(sc.score) }),
        ]));
      } else {
        grid.append(el("button", { class: "cal-day cal-locked" + (isToday ? " today" : ""), onclick: () => previewDay(d) }, [
          el("span", { class: "cal-d", text: String(d) }),
          el("span", { class: "cal-score", style: "color:var(--c-text-faint);", text: "?" }),
        ]));
      }
    }
    host.append(grid);
    const detail = el("div", { id: "cal-detail", style: "margin-top: var(--sp-4);" });
    host.append(detail);
    host.append(noticeBox("info", "점수는 그날의 일진과 내 사주의 관계로 낸 참고 지표예요. 낮다고 나쁜 날이 아니라 페이스 조절이 필요한 날이에요."));
    const openDays = [];
    for (let d = 1; d <= dim; d++) if (isOpen(d)) openDays.push(d);
    const showFirst = (isThisMonth && isOpen(now.getDate())) ? now.getDate() : openDays[0];
    if (showFirst) showDay(showFirst, byDay[showFirst]);
    else detail.append(el("p", { class: "muted center tiny", text: "아직 이 달에 연 날이 없어요. ‘오늘의 운세’를 열거나 한 번에 보기로 확인하세요." }));

    function showDay(d, sc) {
      const box = host.querySelector("#cal-detail"); if (!box) return;
      const f = todayFortune(profile, new Date(year, month - 1, d));
      clear(box);
      box.append(el("div", { class: "panel section-gap" }, [
        el("div", { style: "display:flex; align-items:center; gap:10px;" }, [
          el("span", { class: "cal-detail-score serif", style: `color:${scoreColor(sc.score)};`, text: String(sc.score) }),
          el("div", {}, [
            el("p", { style: "font-weight:700;", text: `${month}월 ${d}일` }),
            el("p", { class: "muted tiny", text: `일진 ${sc.iljin} · ${sc.god}` }),
          ]),
        ]),
        el("p", { style: "font-weight:600;", text: f.theme }),
        el("div", { class: "cal-mini" }, [mini("연애", f.love), mini("일", f.work), mini("돈", f.money)]),
        el("div", { class: "insight", text: f.advice }),
      ]));
    }
    function mini(l, t) { return el("div", { class: "cal-mini-cell" }, [el("b", { text: l }), el("span", { class: "muted", text: t })]); }

    // 지정일 미리보기 — 2코인 (구매 후 24h 내 다른 날은 1코인). 네이티브 confirm 대신 인라인 프롬프트.
    function previewDay(d) {
      const dateStr = `${year}-${month}-${d}`;
      const pc = dayPreviewCost();
      const coins = getCoins();
      const box = host.querySelector("#cal-detail"); if (!box) return;
      clear(box);
      const card = el("div", { class: "panel section-gap" }, [
        el("p", { style: "font-weight:700;", text: `${month}월 ${d}일 미리보기` }),
        el("p", { class: "muted tiny", text: pc.discounted
          ? `24시간 할인 적용 중! 코인 ${pc.cost}개로 열 수 있어요. (보유 ${coins}개)`
          : `코인 ${pc.cost}개로 이 날을 열어요. 지금 열면 24시간 동안 다른 날은 1코인! (보유 ${coins}개)` }),
      ]);
      if (coins >= pc.cost) {
        card.append(el("button", { class: "btn btn-primary btn-block", onclick: () => {
          const r = buyDayPreview(dateStr);
          if (r.ok) { toast(`${month}월 ${d}일을 열었어요${r.discounted ? " · 할인 적용" : " · 24시간 동안 다른 날 1코인"}`); paint(); }
          else { toast("코인이 부족해요."); navigate("/store"); }
        } }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${pc.cost}개로 열기` })]));
      } else {
        card.append(el("button", { class: "btn btn-primary btn-block", onclick: () => navigate("/store") }, [el("span", { text: "코인 받으러 가기" })]));
      }
      box.append(card);
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function taegilItemId() { return `taegil:${my.birthDate}:${year}-${month}:${taegilPurpose}`; }
  function paintTaegil() {
    // 목적 선택 칩
    host.append(el("p", { class: "muted tiny", style: "text-align:center; margin-bottom:8px;", text: "무슨 날을 잡을까요?" }));
    host.append(el("div", { class: "chip-grid", style: "justify-content:center;" }, TAEGIL_PURPOSES.map((p) =>
      el("button", { class: "chip" + (p.id === taegilPurpose ? " is-selected" : ""), type: "button", onclick: () => { taegilPurpose = p.id; paint(); } }, [el("span", { text: p.name })]))));

    const cost = costOf("taegil");
    const box = el("div", { style: "margin-top: var(--sp-4);" });
    host.append(box);
    if (!isUnlocked(taegilItemId())) {
      const coins = getCoins();
      const lock = el("div", { class: "panel premium-lock" }, [
        el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
        el("h3", { class: "serif", style: "margin-top:10px;", text: `${year}년 ${month}월 · ${TAEGIL_PURPOSES.find((p) => p.id === taegilPurpose).name} 좋은 날` }),
        el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "이 달의 좋은 날·조심할 날을 골라 드려요. 한 번 열면 다시 볼 땐 무료예요." }),
      ]);
      if (coins >= cost) {
        lock.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => { const r = unlock(taegilItemId(), cost); if (r.ok) { toast("택일을 열었어요"); paint(); } else { toast("코인이 부족해요."); navigate("/store"); } } }, [el("span", { text: `코인 ${cost}개로 좋은 날 보기 · 보유 ${coins}개` })]));
      } else {
        lock.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => navigate("/store") }, [el("span", { text: "코인 받으러 가기" })]));
      }
      box.append(lock);
      return;
    }
    const r = taegilMonth(profile, year, month, taegilPurpose);
    const dayChip = (o, good) => el("span", { class: "taegil-day " + (good ? "good" : "bad") }, [el("b", { text: o.day + "일" }), el("span", { class: "tiny", text: o.score + "점" })]);
    box.append(el("div", { class: "section-gap" }, [
      el("div", { class: "panel" }, [
        el("p", { class: "eyebrow", text: `${r.purpose.name} · 좋은 날` }),
        el("div", { class: "taegil-days", style: "margin-top:10px;" }, r.best.map((o) => dayChip(o, true))),
      ]),
      el("div", { class: "panel" }, [
        el("p", { class: "eyebrow", text: "피하면 좋은 날" }),
        el("div", { class: "taegil-days", style: "margin-top:10px;" }, r.caution.map((o) => dayChip(o, false))),
      ]),
      el("div", { class: "insight", text: r.tip }),
      noticeBox("info", "내 사주와 그날 일진의 관계로 낸 참고 지표예요. 실제 일정은 상황·상대와 함께 정하세요."),
    ]));
  }

  paint();
  return root;
}
