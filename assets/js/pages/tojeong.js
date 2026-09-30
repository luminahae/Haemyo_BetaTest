import { el, clear, toast } from "../utils/dom.js";
import { backLink, pageHeader, noticeBox, loadDisclaimer } from "./_shared.js";
import { getMyBirth } from "../state.js";
import { computeSaju } from "../saju/manse.js";
import { tojeongYear, tojeongLife } from "../saju/tojeong.js";
import { isUnlocked, unlock, getCoins, costOf, isUnlimited } from "../wallet.js";

export function renderTojeong({ navigate }) {
  loadDisclaimer();
  const my = getMyBirth();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("토정비결", "한 해 운세 · 인생 흐름", "음력 생월·생일과 그해 태세로 괘를 세워 한 해 흐름을 봅니다. 연도를 바꿔 지난해·내년도 볼 수 있고, 초년·중년·장년·노년과 10년 단위 흐름도 볼 수 있어요."));

  if (!my) {
    root.append(el("section", { class: "wrap section-gap" }, [
      noticeBox("info", "토정비결을 보려면 먼저 생년월일이 필요해요. 한 번 입력하면 저장됩니다."),
      el("button", { class: "btn btn-primary", onclick: () => navigate("/saju") }, [el("span", { text: "내 정보 입력하고 시작" })]),
    ]));
    return root;
  }

  const profile = computeSaju(my);
  const nowY = new Date().getFullYear();
  const birthY = profile.solar ? profile.solar.Y : nowY - 30;
  let year = nowY;
  const cost = costOf("tojeong");
  const lifeCost = costOf("tojeonglife");

  // 연도 고르기
  const yInput = el("input", { class: "input tj-yinput", type: "number", min: String(birthY), max: String(birthY + 100), value: String(year), inputmode: "numeric", "aria-label": "볼 연도" });
  const ageTag = el("span", { class: "tj-age tiny muted" });
  const setYear = (y) => {
    y = Math.max(birthY, Math.min(birthY + 100, Number(y) || nowY));
    year = y; yInput.value = String(y);
    ageTag.textContent = `${y - birthY + 1}세(세는나이)`;
    chips.forEach((c) => c.classList.toggle("on", Number(c.dataset.y) === y));
    paintYear();
  };
  yInput.addEventListener("change", () => setYear(yInput.value));
  yInput.addEventListener("keydown", (e) => { if (e.key === "Enter") setYear(yInput.value); });
  const chips = [[nowY - 1, "작년"], [nowY, "올해"], [nowY + 1, "내년"], [nowY + 2, "내후년"]].map(([y, t]) =>
    el("button", { type: "button", class: "tj-chip", "data-y": String(y), onclick: () => setYear(y) }, [el("span", { text: `${t} ${y}` })]));
  root.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel tj-picker" }, [
      el("p", { style: "font-weight:700;", text: "몇 년도 운세를 볼까?" }),
      el("div", { class: "tj-yrow" }, [
        el("button", { type: "button", class: "tj-step", "aria-label": "이전 해", onclick: () => setYear(year - 1) }, [el("span", { text: "‹" })]),
        yInput, el("span", { class: "tj-yu", text: "년" }),
        el("button", { type: "button", class: "tj-step", "aria-label": "다음 해", onclick: () => setYear(year + 1) }, [el("span", { text: "›" })]),
        ageTag,
      ]),
      el("div", { class: "tj-chips" }, chips),
    ]),
  ]));

  const host = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  const lifeHost = el("section", { class: "wrap", style: "margin-top: var(--sp-6);" });
  root.append(host, lifeHost);

  function paintYear() {
    clear(host);
    const itemId = `tojeong:${my.birthDate}:${year}`;
    if (!isUnlocked(itemId)) {
      host.append(lockCard({ title: `${year}년 토정비결 열어 보기`, desc: "그해의 괘와 전체 흐름, 흐름 좋은 달, 조언을 풀어 드려요. 한 번 연 해는 다시 볼 때 무료예요.", cost, onOpen: () => unlock(itemId, cost), after: paintYear }));
      return;
    }
    host.append(view(tojeongYear(profile, year)));
  }

  function paintLife() {
    clear(lifeHost);
    const lifeId = `tojeonglife:${my.birthDate}`;
    lifeHost.append(el("h2", { class: "serif", style: "font-size:1.3rem;", text: "인생 흐름 · 초년 중년 장년 노년" }),
      el("p", { class: "muted tiny", style: "margin:4px 0 12px;", text: "나이마다 세운 토정 괘와 10년마다 바뀌는 대운(나에게 맞는 기운인지)을 함께 모아 본 흐름이에요." }));
    if (!isUnlocked(lifeId)) {
      lifeHost.append(lockCard({ title: "내 인생 흐름 열어 보기", desc: "초년·중년·장년·노년 4단계와 10년 단위 흐름(좋은 해·조심할 해·대운)까지 한 번에 보여 드려요.", cost: lifeCost, onOpen: () => unlock(lifeId, lifeCost), after: paintLife }));
      return;
    }
    lifeHost.append(lifeView(tojeongLife(profile), (y) => { setYear(y); window.scrollTo({ top: 0, behavior: "smooth" }); }));
  }

  function lockCard({ title, desc, cost: c, onOpen, after }) {
    const coins = getCoins();
    const box = el("div", { class: "panel premium-lock", style: "margin-top: var(--sp-4);" }, [
      el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${c}개` })]),
      el("h3", { class: "serif", style: "margin-top:10px;", text: title }),
      el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: desc }),
    ]);
    if (coins >= c || isUnlimited()) {
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
        const res = onOpen();
        if (res.ok) { toast("열었어요"); after(); } else { toast("코인이 부족해요."); navigate("/store"); }
      } }, [el("span", { text: isUnlimited() ? "무제한으로 열기" : `코인 ${c}개로 열기 · 보유 ${coins}개` })]));
    } else {
      box.append(el("p", { class: "muted tiny", style: "margin-top:8px;", text: `보유 코인 ${coins}개 · ${c}개 필요해요.` }));
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-3);", onclick: () => navigate("/store") }, [el("span", { text: "코인 받으러 가기" })]));
    }
    return box;
  }
  setYear(nowY);
  paintLife();
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [noticeBox("info", "참고용 콘텐츠예요. 미래를 확정하지 않으며, 중요한 결정은 실제 정보와 함께 검토하세요.")]));
  return root;
}

const BAND_CLS = { 순풍: "b-top", 상승: "b-up", 굴곡: "b-mid", 인내: "b-low" };
function lifeView(L, pickYear) {
  const stageCards = el("div", { class: "tj-stages" }, L.stages.map((st) =>
    el("div", { class: `tj-stage ${BAND_CLS[st.band]}` + (st.isNow ? " is-now" : "") }, [
      el("div", { class: "tj-st-top" }, [
        el("b", { class: "serif", text: st.name }),
        st.isNow ? el("span", { class: "dt-now", text: "지금" }) : null,
        el("span", { class: "tj-band", text: st.band }),
      ].filter(Boolean)),
      el("p", { class: "tiny muted", text: `${st.from}~${st.to}세 · ${st.years}` }),
      el("div", { class: "tj-bar" }, [el("i", { style: `width:${st.score}%` })]),
      el("p", { class: "tiny", style: "font-weight:700;", text: `${st.score}점 · ${st.theme}` }),
      el("p", { class: "tiny", text: st.line + " " + st.tip }),
      el("p", { class: "tiny muted", text: `주된 괘 ${st.pal.name} ${st.pal.sym} — ${st.pal.summary}` }),
    ])));
  const maxS = Math.max(...L.decades.map((d) => d.score)), minS = Math.min(...L.decades.map((d) => d.score));
  const chart = el("div", { class: "tj-chart", "aria-hidden": "true" }, L.decades.map((d) =>
    el("div", { class: "tj-col" + (d.isNow ? " is-now" : "") }, [
      el("span", { class: "tj-cv tiny", text: String(d.score) }),
      el("div", { class: `tj-cb ${BAND_CLS[d.band]}`, style: `height:${20 + Math.round(((d.score - minS) / Math.max(1, maxS - minS)) * 80)}%` }),
      el("span", { class: "tj-cl tiny muted", text: `${d.from}` }),
    ])));
  const rows = el("div", { class: "tj-decades" }, L.decades.map((d) =>
    el("div", { class: `tj-dec ${BAND_CLS[d.band]}` + (d.isNow ? " is-now" : "") }, [
      el("div", { class: "tj-dec-h" }, [
        el("b", { text: `${d.from}–${d.to}세` }),
        el("span", { class: "tiny muted", text: d.years }),
        d.isNow ? el("span", { class: "dt-now", text: "지금" }) : null,
        el("span", { class: "tj-band", text: `${d.band} ${d.score}` }),
        d.trend ? el("span", { class: "tiny " + (d.trend > 0 ? "tj-upc" : "tj-dnc"), text: d.trend > 0 ? `▲${d.trend}` : `▼${-d.trend}` }) : null,
      ].filter(Boolean)),
      el("p", { class: "tiny", text: d.line + " " + d.luckNote }),
      el("p", { class: "tiny muted", text: `대운 ${d.daeun.length ? d.daeun.join("→") : "시작 전"} · 주된 괘 ${d.pal.name} ${d.pal.sym}` }),
      el("div", { class: "tj-yrs" }, [
        el("button", { type: "button", class: "tj-ybtn good", onclick: () => pickYear(d.best.year) }, [el("span", { text: `좋은 해 ${d.best.year}` })]),
        el("button", { type: "button", class: "tj-ybtn warn", onclick: () => pickYear(d.worst.year) }, [el("span", { text: `조심할 해 ${d.worst.year}` })]),
      ]),
    ])));
  return el("div", { class: "section-gap" }, [
    stageCards,
    el("h3", { class: "serif", style: "margin-top: var(--sp-5); font-size:1.1rem;", text: "10년 단위 흐름" }),
    el("p", { class: "muted tiny", text: "막대가 높을수록 순탄한 10년이에요. ‘좋은 해/조심할 해’를 누르면 그해 토정비결로 이동해요." }),
    chart, rows,
  ]);
}

function view(r) {
  const ring = el("div", { class: "score-ring", style: `--deg:${Math.round(r.score * 3.6)}deg;` }, [
    el("div", { class: "score-ring-in" }, [el("span", { class: "score-n", text: String(r.score) }), el("span", { class: "score-u", text: "점" })]),
  ]);
  return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel", style: "text-align:center;" }, [
      el("p", { class: "eyebrow", style: "justify-content:center;", text: `${r.year}년 · 제 ${r.gwaeNo}괘` }),
      el("p", { class: "serif", style: "font-size:1.5rem; margin-top:8px;", text: `${r.palName} · ${r.palSym}` }),
      el("p", { class: "muted", style: "font-style:italic; margin-top:6px;", text: `“${r.verse}”` }),
      el("div", { style: "margin-top: var(--sp-4); display:flex; justify-content:center;" }, [ring]),
    ]),
    el("div", { class: "panel" }, [el("p", { style: "font-weight:600;", text: r.summary })]),
    block("이 해 잘 풀리는 것", r.pros, "good"),
    block("이 해 조심할 것", r.cons, "warn"),
    el("div", { class: "panel", style: "text-align:center;" }, [
      el("p", { class: "muted tiny", text: "흐름이 좋은 달" }),
      el("p", { class: "serif", style: "font-size:1.2rem; margin-top:4px;", text: r.goodMonths.map((m) => m + "월").join(" · ") }),
    ]),
    el("div", { class: "insight", text: r.advice }),
    el("div", { class: "lucky-row" }, [
      el("span", { class: "lucky-chip" }, [el("b", { text: "행운색 " }), el("span", { text: r.luckyColor })]),
      el("span", { class: "lucky-chip" }, [el("b", { text: "행운 기운 " }), el("span", { text: r.luckyElem })]),
    ]),
  ]);
}
function block(label, items, tag) {
  return el("div", { class: `block tag-${tag}` }, [el("span", { class: "block-label" }, [el("span", { text: label })]), ...items.map((t) => el("p", { text: t }))]);
}
