import { el, clear, toast } from "../utils/dom.js";
import { pageHeader, backLink, noticeBox, loadDisclaimer } from "./_shared.js";
import { getMyBirth, stash } from "../state.js";
import { personSwitch } from "./people.js";
import { themes as sajuThemes, banner as themeBanner } from "./explore.js";
import { computeSaju } from "../saju/manse.js";
import { TOPICS, topicMeta, readTopic } from "../saju/topics.js";
import { methodReading, METHODS } from "../saju/methods.js";
import { radarScores, radarSvg } from "../saju/extras.js";
import { getCoins, isUnlocked, unlock, grant, costOf, markDayViewed, COIN_PRICE_KRW, isUnlimited } from "../wallet.js";
/* 매일 무료로 열리는 조합 — 오늘의 운세 타로 */
function isFreeCombo(method, id) { return method === "tarot" && id === "today"; }

/* 카테고리별 파스텔 면(배경 tint) + 코너 악센트(부드러운 오브) — 아이콘/이모지 대신 색으로 구분 */
const TINT = {
  today: "linear-gradient(155deg, rgba(255,214,190,.26), rgba(255,190,170,.08))",
  weekday: "linear-gradient(155deg, rgba(214,226,255,.24), rgba(190,205,255,.07))",
  weekend: "linear-gradient(155deg, rgba(255,224,236,.26), rgba(255,196,222,.08))",
  love: "linear-gradient(155deg, rgba(255,196,214,.30), rgba(249,168,196,.10))",
  reunion: "linear-gradient(155deg, rgba(224,196,246,.26), rgba(200,168,236,.08))",
  breakup: "linear-gradient(155deg, rgba(210,196,220,.22), rgba(190,170,200,.07))",
  wealth: "linear-gradient(155deg, rgba(255,224,180,.26), rgba(240,200,150,.08))",
  study: "linear-gradient(155deg, rgba(196,232,220,.26), rgba(170,220,205,.08))",
  document: "linear-gradient(155deg, rgba(214,222,236,.24), rgba(190,205,225,.07))",
};
const ACCENT = {
  today: "#ffd0b0", tomorrow: "#ffe0c4", tomorrowlove: "#ffcadb", daylove: "#f7b6d0", weekday: "#cdd8ff", weekend: "#ffcfe4",
  month: "#ffe0b0", nextmonth: "#c9e0d0", year: "#e8cff0",
  todaylove: "#ffc2d4", monthlove: "#ffb8cf",
  love: "#ffbfd2", yearlove: "#ffb0c8", reunion: "#d9c4f2", breakup: "#d2c4dc",
  wealth: "#ffdca6", business: "#e0d0b0", study: "#c4e8dc", document: "#cdd6ec",
  h1lucky: "#ffe2b0", h2lucky: "#c4dcec",
};
const tint = (id) => `linear-gradient(155deg, ${hexA(ACCENT[id] || "#ecabb0", .26)}, transparent)`;
function hexA(hex, a) {
  const h = hex.replace("#", ""); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function dateKey(id) {
  const d = new Date(); const p = (n) => String(n).padStart(2, "0");
  if (id === "today") return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  // 주 단위(연도-주차)
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}W${week}`;
}
/* 지정일 연애운의 날짜 (기본: 내일) */
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate() + 1); return ymd(d); }
function dayLoveDate() { return window.__dayLoveDate || tomorrowStr(); }
function itemIdFor(method, id, input) {
  if (id === "tomorrow" || id === "tomorrowlove") return `${method}:${id}:${tomorrowStr()}`;
  if (id === "daylove") return `${method}:${id}:${dayLoveDate()}`;
  const meta = topicMeta(id);
  const d = new Date(); const ym = `${d.getFullYear()}-${d.getMonth() + 1}`;
  const sig = `${input.birthDate || ""}_${input.timeUnknown ? "x" : (input.birthTime || "-")}`;
  const p = `${method}:${id}`;
  if (meta && meta.kind === "daily") return `${p}:${dateKey(id)}`;
  if (id === "todaylove") return `${p}:${dateKey("today")}`;
  if (id === "month" || id === "monthlove") return `${p}:${ym}`;
  if (id === "nextmonth") return `${p}:${d.getFullYear()}-${d.getMonth() + 2}`;
  if (id === "year" || id === "h1lucky" || id === "h2lucky") return `${p}:${d.getFullYear()}`;
  return `${p}:${sig}`;
}
const METHOD_DESC = {
  saju: "실제 만세력 명식(십신)으로 풀어요.",
  tarot: "해묘가 카드 한 장을 펼쳐 풀어요.",
  ziwei: "자미두수 명반의 관련 궁으로 봐요.",
  tojeong: "올해의 괘(토정비결)로 봐요.",
};
/* 카테고리 그룹 — 17개 토픽을 보기 좋게 묶음 */
const GROUPS = [
  { label: "오늘 · 내일 · 이번 주", ids: ["today", "tomorrow", "weekday", "weekend"] },
  { label: "이달 · 올해", ids: ["month", "nextmonth", "year"] },
  { label: "연애 · 인연", ids: ["todaylove", "tomorrowlove", "daylove", "monthlove", "yearlove", "reunion", "breakup"] },
  { label: "재물 · 일 · 공부", ids: ["wealth", "business", "study", "document"] },
  { label: "행운의 달", ids: ["h1lucky", "h2lucky"] },
];

/* ---------------- 카탈로그 ---------------- */
export function renderFortuneHub({ navigate }) {
  loadDisclaimer();
  const my = getMyBirth();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("운세", "어떤 방식으로 볼까?",
    "사주·타로·자미두수·토정비결 중에 골라, 궁금한 운세를 봐요. 방법마다 관점이 달라요."));
  root.append(personSwitch(navigate, { title: "누구의 운세를 볼까?" }));

  // 코인 잔액
  root.append(el("section", { class: "wrap" }, [
    el("button", { class: "coin-strip", onclick: () => navigate("/store") }, [
      coinMark(),
      el("span", { style: "font-weight:800; color:var(--c-gold-soft);", text: isUnlimited() ? "∞" : `${getCoins()}` }),
      el("span", { class: "muted tiny", text: "코인 · 충전 · 출석" }),
      el("span", { class: "coin-strip-go muted tiny", text: "›" }),
    ]),
  ]));

  // 사주 테마 운세 — 가로로 넘기는 배너
  const themeList = sajuThemes().filter((t) => !t.cats.includes("타로") || t.id === "tarot");
  const carousel = el("div", { class: "fh-carousel" }, themeList.map((t) => el("div", { class: "fh-slide" }, [themeBanner(t, () => {
    if (t.theme) return navigate(`/theme/${t.id}`);
    navigate(t.to);
  })])));
  const dots = el("div", { class: "fh-dots" }, themeList.map((_, i) => el("span", { class: "fh-dot" + (i === 0 ? " on" : "") })));
  carousel.addEventListener("scroll", () => {
    const i = Math.round(carousel.scrollLeft / Math.max(1, carousel.firstChild.clientWidth + 12));
    [...dots.children].forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "fh-head" }, [
      el("div", {}, [el("h2", { class: "serif", style: "font-size:1.25rem;", text: "사주 테마 운세" }), el("p", { class: "muted tiny", text: "내 만세력으로 푸는 결혼 시기·솔로 탈출·재물·직업" })]),
      el("button", { class: "fh-all", onclick: () => navigate("/explore") }, [el("span", { text: "전체 보기 ›" })]),
    ]),
    carousel, dots,
    el("button", { class: "fh-tarot", onclick: () => navigate("/tarot") }, [
      el("span", { class: "fh-tarot-ic", "aria-hidden": "true", text: "🃏" }),
      el("div", { style: "flex:1; text-align:left;" }, [el("b", { text: "그 사람 속마음·재회·썸은 타로에서" }), el("p", { class: "muted tiny", text: "테마 타로 17가지 · 누르면 바로 카드 뽑기" })]),
      el("span", { class: "wide-arrow", text: "→" }),
    ]),
  ]));

  if (!my) {
    root.append(el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-4);" }, [
      noticeBox("info", "맞춤 운세를 보려면 먼저 내 생년월일이 필요해요. 한 번 입력하면 자동으로 저장됩니다."),
      el("button", { class: "btn btn-primary", onclick: () => navigate("/saju") }, [el("span", { text: "내 정보 입력하고 시작" })]),
    ]));
    return root;
  }

  // 운세 캘린더 진입
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-3);" }, [
    el("button", { class: "wide-card", style: "--accent:#c4e8dc; margin-top:0;", onclick: () => navigate("/calendar") }, [
      el("div", { style: "flex:1;" }, [
        el("h4", { class: "serif", style: "font-size:1.1rem;", text: "운세 캘린더" }),
        el("p", { class: "muted", style: "font-size:var(--fs-sm); margin-top:2px;", text: "날짜별 운세 점수를 한눈에 · 날짜를 누르면 그날 운세" }),
      ]),
      el("span", { class: "wide-arrow", text: "→" }),
    ]),
  ]));

  let method = window.__fortuneMethod || "saju";
  const tabsHost = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  const gridHost = el("section", { class: "wrap", style: "margin-top: var(--sp-4);" });
  root.append(tabsHost, gridHost);

  function paintTabs() {
    clear(tabsHost);
    tabsHost.append(el("div", { class: "method-tabs" }, METHODS.map((m) =>
      el("button", { class: "method-tab" + (m.id === method ? " on" : ""), onclick: () => { method = m.id; window.__fortuneMethod = m.id; paintTabs(); paintGrid(); } }, [el("span", { text: m.name })]))));
    tabsHost.append(el("p", { class: "muted tiny", style: "text-align:center; margin-top:8px;", text: METHOD_DESC[method] }));
  }
  function tileFor(id) {
    const t = topicMeta(id);
    if (!t) return null;
    const owned = isUnlocked(itemIdFor(method, id, my));
    return el("button", {
      class: "topic-tile", style: `--tint:${tint(id)}; --accent:${ACCENT[id] || "#ecabb0"};`,
      onclick: () => navigate(`/fortune/${method}/${id}`),
    }, [
      el("span", { class: "topic-name serif", text: t.name }),
      el("span", { class: "topic-blurb muted", text: t.blurb }),
      isFreeCombo(method, id)
        ? el("span", { class: "topic-cost free", text: "무료" })
        : owned
          ? el("span", { class: "topic-cost owned", text: "열람함" })
          : el("span", { class: "topic-cost" }, [coinMark("sm"), el("span", { text: String(t.cost) })]),
    ]);
  }
  function paintGrid() {
    clear(gridHost);
    GROUPS.forEach((g) => {
      gridHost.append(el("p", { class: "fg-group", text: g.label }));
      gridHost.append(el("div", { class: "topic-grid" }, g.ids.map(tileFor).filter(Boolean)));
    });
    gridHost.append(el("p", { class: "tiny muted", style: "text-align:center; margin-top: var(--sp-5);", text: "방법마다 따로 코인이 들어요 · 한 번 연 건 다시 볼 때 무료(날짜형은 기간마다 갱신) · 참고용 콘텐츠" }));
  }
  paintTabs(); paintGrid();
  return root;
}

/* ---------------- 카테고리 리딩 (방법별) ---------------- */
export function renderTopicReading({ navigate, method = "saju", id }) {
  loadDisclaimer();
  const meta = topicMeta(id);
  const my = getMyBirth();
  const mName = (METHODS.find((m) => m.id === method) || {}).name || "사주";
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/fortune", "운세")]));
  if (!meta || !METHODS.some((m) => m.id === method)) { root.append(noticeBox("warn", "알 수 없는 운세예요.")); return root; }
  if (!my) { navigate("/fortune"); return root; }

  const profile = computeSaju(my);
  let itemId = itemIdFor(method, id, my);
  const cost = costOf(id);

  const host = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  root.append(host);

  function paint() {
    clear(host);
    // 헤더 (방법 + 토픽)
    host.append(el("div", { class: "topic-head", style: `--tint:${tint(id)}; --accent:${ACCENT[id] || "#ecabb0"};` }, [
      el("p", { class: "eyebrow", text: `${mName}로 보는` }),
      el("h1", { class: "serif", style: "font-size:1.8rem; margin-top:2px;", text: meta.name }),
    ]));

    // 방법 전환 탭 — 각 방법은 따로 결제(다른 페이지로)
    host.append(el("div", { class: "method-tabs" }, METHODS.map((m) =>
      el("button", { class: "method-tab" + (m.id === method ? " on" : ""), onclick: () => { if (m.id !== method) navigate(`/fortune/${m.id}/${id}`); } },
        [el("span", { text: m.name }), isUnlocked(itemIdFor(m.id, id, my)) ? el("span", { class: "mt-dot", "aria-label": "열람함" }) : null].filter(Boolean)))));

    // 지정일 연애운 — 날짜 고르기
    if (id === "daylove") {
      const di = el("input", { class: "input", type: "date", value: dayLoveDate(), min: ymd(new Date()), "aria-label": "연애운 볼 날짜" });
      di.addEventListener("change", () => { if (!di.value) return; window.__dayLoveDate = di.value; itemId = itemIdFor(method, id, my); paint(); });
      host.append(el("div", { class: "panel", style: "margin-top: var(--sp-3);" }, [
        el("p", { style: "font-weight:700; margin-bottom:6px;", text: "어느 날의 연애운을 볼까?" }),
        el("p", { class: "muted tiny", style: "margin-bottom:8px;", text: "데이트·고백·기념일처럼 궁금한 날짜를 골라요. 날짜마다 따로 열려요." }),
        di,
      ]));
    }
    const free = isFreeCombo(method, id);   // 오늘의 운세 타로 = 매일 무료
    if (free && !isUnlocked(itemId)) grant(itemId);
    if (!isUnlocked(itemId)) { host.append(lockCard(free)); return; }

    // 오늘의 운세를 열면 캘린더에 그날이 기록됨
    if (id === "today") { const d = new Date(); markDayViewed(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`); }

    if (free) host.append(el("p", { class: "free-badge", text: "🎁 오늘의 무료 타로" }));

    let view;
    if (method === "saju") {
      const r = readTopic(profile, id, id === "daylove" ? new Date(dayLoveDate() + "T12:00:00") : new Date());
      view = r.kind === "daily" ? dailyView(r)
        : r.kind === "period" ? periodView(r)
          : r.kind === "lovetime" ? loveTimeView(r)
            : r.kind === "lucky" ? luckyView(r)
              : sajuView(r);
    } else {
      view = methodView(methodReading(profile, id, method, id === "daylove" ? { ...my, targetDate: dayLoveDate() + "T12:00:00" } : my));
    }
    host.append(view);
    // 오늘의 운세(사주)엔 5분야 레이더
    if (method === "saju" && id === "today") {
      host.append(el("div", { class: "panel", style: "margin-top: var(--sp-4);" }, [
        el("p", { class: "eyebrow", style: "justify-content:center; text-align:center;", text: "오늘의 운세 흐름" }),
        el("div", { class: "radar-wrap", html: radarSvg(radarScores(profile)) }),
      ]));
    }
    host.append(noticeBox("info", "참고용 콘텐츠예요. 방법마다 관점이 달라요. 좋은 말만 하지 않되 미래를 확정하지 않아요."));
  }

  function lockCard() {
    const coins = getCoins();
    const box = el("div", { class: "panel premium-lock", style: "margin-top: var(--sp-4);" }, [
      el("span", { class: "lock-badge" }, [coinMark("sm"), el("span", { text: `코인 ${cost}개` })]),
      el("h3", { class: "serif", style: "margin-top:10px;", text: `${mName}로 ${meta.name} 보기` }),
      el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: `${METHOD_DESC[method]} 한 번 열면 다시 볼 땐 무료예요. (다른 방법은 따로 코인이 들어요)` }),
    ]);
    if (coins >= cost) {
      const btn = el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);" },
        [el("span", { text: `코인 ${cost}개로 열기 · 보유 ${coins}개` })]);
      btn.addEventListener("click", () => {
        const res = unlock(itemId, cost);
        if (res.ok) { toast(res.reason === "spent" ? `${mName}로 ${meta.name}을(를) 열었어요` : "이미 열어 둔 운세예요."); paint(); }
        else { toast("코인이 부족해요."); navigate("/store"); }
      });
      box.append(btn);
    } else {
      box.append(el("p", { class: "muted tiny", style: "margin-top:8px;", text: `보유 코인 ${coins}개 · ${cost}개 필요해요. 출석·충전으로 코인을 받을 수 있어요.` }));
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-3);", onclick: () => navigate("/store") },
        [el("span", { text: "코인 받으러 가기" })]));
    }
    return box;
  }

  paint();
  return root;
}

/* ---- 뷰 ---- */
function scoreRing(score) {
  const deg = Math.round(score * 3.6);
  return el("div", { class: "score-ring", style: `--deg:${deg}deg;` }, [
    el("div", { class: "score-ring-in" }, [
      el("span", { class: "score-n", text: String(score) }),
      el("span", { class: "score-u", text: "점" }),
    ]),
  ]);
}
function block(label, items, tag) {
  return el("div", { class: `block tag-${tag}` }, [
    el("span", { class: "block-label" }, [el("span", { text: label })]),
    ...items.map((t) => el("p", { text: t })),
  ]);
}
function luckyRow(r) {
  return el("div", { class: "lucky-row" }, [
    el("span", { class: "lucky-chip" }, [el("b", { text: "행운색 " }), el("span", { text: r.luckyColor })]),
    el("span", { class: "lucky-chip" }, [el("b", { text: "행운 기운 " }), el("span", { text: r.luckyElem })]),
  ]);
}

function sajuView(r) {
  return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel", style: "display:flex; gap:16px; align-items:center;" }, [
      scoreRing(r.score),
      el("div", { style: "flex:1;" }, [
        el("p", { class: "eyebrow", text: `${r.name} · 기운 ${r.level}` }),
        el("p", { style: "font-weight:600; margin-top:4px;", text: r.summary }),
      ]),
    ]),
    block("잘 풀리는 지점", r.pros, "good"),
    block("조심할 지점", r.cons, "warn"),
    el("div", { class: "insight", text: r.advice }),
    luckyRow(r),
  ]);
}

function dailyView(r) {
  return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel", style: "text-align:center;" }, [
      el("p", { class: "muted tiny", text: `${r.label} · ${r.date} · 일진 ${r.iljin}(${r.iljinH})` }),
      el("p", { class: "serif", style: "font-size:1.15rem; margin-top:8px;", text: r.theme }),
    ]),
    el("div", { class: "daily-grid" }, [
      dailyCell("연애", r.love, "#ffbfd2"), dailyCell("일", r.work, "#cdd8ff"), dailyCell("돈", r.money, "#ffdca6"),
    ]),
    el("div", { class: "insight", text: r.advice }),
    luckyRow(r),
  ]);
}
function dailyCell(label, text, accent) {
  return el("div", { class: "panel daily-cell", style: `--accent:${accent};` }, [
    el("span", { class: "daily-label", text: label }),
    el("p", { class: "muted", style: "font-size:var(--fs-sm);", text }),
  ]);
}

function periodView(r) {
  return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel", style: "display:flex; gap:16px; align-items:center;" }, [
      scoreRing(Math.max(20, Math.min(92, r.score))),
      el("div", { style: "flex:1;" }, [
        el("p", { class: "eyebrow", text: `${r.label} · ${r.group} 기운` }),
        el("p", { style: "font-weight:600; margin-top:4px;", text: r.theme }),
      ]),
    ]),
    el("div", { class: "daily-grid" }, [
      dailyCell("연애", r.love, "#ffbfd2"), dailyCell("일", r.work, "#cdd8ff"), dailyCell("돈", r.money, "#ffdca6"),
    ]),
    r.goodMonths ? el("div", { class: "panel", style: "text-align:center;" }, [
      el("p", { class: "muted tiny", text: "흐름이 좋은 달" }),
      el("p", { class: "serif", style: "font-size:1.2rem; margin-top:4px;", text: r.goodMonths.map((m) => m + "월").join(" · ") }),
    ]) : null,
    el("div", { class: "insight", text: r.advice }),
    luckyRow(r),
  ].filter(Boolean));
}

function loveTimeView(r) {
  return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel", style: "display:flex; gap:16px; align-items:center;" }, [
      scoreRing(Math.max(20, Math.min(95, r.score))),
      el("div", { style: "flex:1;" }, [
        el("p", { class: "eyebrow", text: `${r.label} 연애운` }),
        el("p", { style: "font-weight:600; margin-top:4px;", text: r.headline }),
      ]),
    ]),
    el("div", { class: "insight", text: r.tip }),
    luckyRow(r),
  ]);
}

function luckyView(r) {
  return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel", style: "text-align:center;" }, [
      el("p", { class: "eyebrow", style: "justify-content:center;", text: r.label }),
      el("p", { class: "serif", style: "font-size:1.6rem; margin-top:8px; color:var(--c-gold-soft);", text: r.bestMonths.map((m) => m + "월").join(" · ") }),
      el("p", { class: "muted tiny", style: "margin-top:4px;", text: "가장 기운이 좋은 달" }),
    ]),
    el("div", { class: "panel" }, [
      el("p", { style: "font-weight:700; margin-bottom:8px;", text: "달별 흐름" }),
      el("div", { class: "month-rows" }, r.detail.map((d) => el("div", { class: "month-row" }, [
        el("span", { text: d.month + "월" }),
        el("span", { class: "month-lv lv-" + d.level, text: d.level }),
      ]))),
    ]),
    el("div", { class: "insight", text: r.advice }),
    luckyRow(r),
  ]);
}

function methodView(r) {
  if (!r) return el("div");
  const head = el("div", { class: "panel", style: "display:flex; gap:14px; align-items:center;" }, [
    r.mediaStyle ? el("span", { class: "method-card", style: r.mediaStyle }) : null,
    el("div", { style: "flex:1;" }, [
      el("p", { class: "eyebrow", text: r.methodName }),
      el("p", { class: "serif", style: "font-size:1.2rem; margin-top:4px;", text: r.title }),
    ]),
  ].filter(Boolean));
  const lead = el("div", { class: "panel", style: "font-style:italic;" }, [el("p", { class: "muted", text: r.lead })]);
  const points = r.points.map((p) => el("div", { class: "panel" }, [
    el("p", { class: "eyebrow", style: "margin-bottom:6px;", text: p.label }),
    el("p", { text: p.text }),
  ]));
  const extra = [];
  if (r.goodMonths) extra.push(el("div", { class: "panel", style: "text-align:center;" }, [
    el("p", { class: "muted tiny", text: "흐름이 좋은 달" }),
    el("p", { class: "serif", style: "font-size:1.2rem; margin-top:4px;", text: r.goodMonths.map((m) => m + "월").join(" · ") }),
  ]));
  return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [head, lead, ...points, ...extra, el("div", { class: "insight", text: r.advice })]);
}

/* 코인 마크 — 이모지 대신 CSS 골드 디스크 */
function coinMark(size) {
  return el("span", { class: "coin-mark" + (size === "sm" ? " sm" : ""), "aria-hidden": "true" });
}
