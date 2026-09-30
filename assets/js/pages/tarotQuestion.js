import { el, clear, icon } from "../utils/dom.js";
import { loadTarotData, getTopics, getSpreads, getSpreadGroups } from "../tarot/cardArt.js";
import { stash, unstash } from "../state.js";
import { pageHeader, backLink, noticeBox } from "./_shared.js";
import { banner } from "./explore.js";
import { costOf } from "../wallet.js";
/* =========================================================
   타로 첫 화면 — 테마 타로 배너(바로 뽑기) + 직접 질문·분야 고르기
   테마를 누르면 분야·질문·배열이 자동으로 정해져 카드 뽑기로 바로 간다.
   ========================================================= */
const CATS = ["전체", "NEW", "연애", "속마음", "썸", "재회", "솔로", "커플·결혼", "일·돈", "선택", "마음", "오늘"];

function tarotThemes() {
  const m = new Date().getMonth() + 1, ny = new Date().getFullYear() + 1;
  return [
    { id: "no-contact", cats: ["NEW", "연애", "속마음"], eyebrow: "해묘 타로의 속삭임", title: "그 사람이 연락을\n못 하는 진짜 이유", sub: "그 사람 속사정 + 지금 내가 할 일", bg: "night", art: "phone", topic: "their_mind", spread: "their-heart-3", q: "그 사람은 왜 연락을 안 할까?" },
    { id: "new-crush", cats: ["NEW", "썸", "속마음"], eyebrow: "해묘 타로", title: "알게 된 지 얼마 안 된 그 사람,\n나한테 흔들리고 있을까?", sub: "그 사람 마음 + 다가가는 법", bg: "rose", art: "cat", topic: "their_mind", spread: "their-heart-5", q: "알게 된 지 얼마 안 된 그 사람, 나한테 마음이 있을까?" },
    { id: "some-mind", cats: ["썸", "속마음", "연애"], eyebrow: "썸 타로", title: "썸, 그 사람도\n나랑 같은 마음일까", sub: "마음의 온도 · 관계가 나아갈 방향", bg: "peach", art: "hearts", topic: "their_mind", spread: "their-heart-3", q: "그 사람도 나랑 같은 마음일까?" },
    { id: "want-me", cats: ["NEW", "속마음", "연애"], eyebrow: "속마음 타로", title: "이 남자, 나랑\n뭘 어쩌고 싶은 걸까", sub: "그 사람이 원하는 관계 · 진심의 크기", bg: "dusk", art: "cards", topic: "their_mind", spread: "their-heart-5", q: "이 사람은 나랑 뭘 어쩌고 싶을까?" },
    { id: "reunion", cats: ["재회", "연애"], eyebrow: "재회 타로", title: "그 사람,\n다시 돌아올까", sub: "헤어진 이유 · 그 사람 지금 마음 · 재회 가능성", bg: "night", art: "moon", topic: "reunion", spread: "reunion-7", q: "그 사람과 다시 이어질 수 있을까?" },
    { id: "solo", cats: ["솔로", "연애"], eyebrow: `${ny} 인연 타로`, title: "나에게 올 인연,\n언제 어떤 사람일까", sub: "인연이 오는 때 · 그 사람의 모습 · 만나는 곳", bg: "peach", art: "hearts", topic: "new_love", spread: "solo-love", q: "새로운 인연은 언제, 어떤 사람으로 올까?" },
    { id: "month-love", cats: ["NEW", "연애", "솔로"], eyebrow: `${m}월의 시크릿`, title: `${m}월,\n나의 연애 타로`, sub: "이달 연애 흐름 · 설레는 순간 · 조심할 점", bg: "lilac", art: "moon", topic: "love", spread: "ppfa", q: `${m}월 나의 연애운은 어떨까?` },
    { id: "couple", cats: ["커플·결혼", "연애"], eyebrow: "커플 타로", title: "우리 관계,\n앞으로 어떻게 될까", sub: "서로의 마음 · 부딪히는 지점 · 관계의 미래", bg: "rose", art: "ring", topic: "love", spread: "couple-love", q: "우리 관계는 앞으로 어떻게 될까?" },
    { id: "marry", cats: ["커플·결혼"], eyebrow: "결혼 타로", title: "이 사람과\n결혼해도 될까?", sub: "결혼 후 모습 · 가족 · 준비할 것", bg: "gold", art: "ring", topic: "love", spread: "marriage", q: "이 사람과 결혼해도 괜찮을까?" },
    { id: "work", cats: ["일·돈", "선택"], eyebrow: "일 타로", title: "지금 이 일,\n계속해도 될까?", sub: "지금 상황 · 걸림돌 · 조언", bg: "mint", art: "sun", topic: "work", spread: "situation-obstacle-advice", q: "지금 일을 계속해야 할까, 옮겨야 할까?" },
    { id: "money", cats: ["일·돈"], eyebrow: "금전 타로", title: "돈 흐름,\n언제 좋아질까", sub: "돈이 새는 곳 · 들어오는 길 · 타이밍", bg: "gold", art: "coin", topic: "money", spread: "problem-solve-4", q: "돈 흐름은 언제 좋아질까?" },
    { id: "choice", cats: ["선택", "마음"], eyebrow: "선택 타로", title: "A냐 B냐,\n뭘 골라야 할까", sub: "두 길의 결과를 나란히 비교", bg: "lilac", art: "star", topic: "choice", spread: "decision-five", q: "두 가지 중 무엇을 선택해야 할까?" },
    { id: "anxious", cats: ["마음"], eyebrow: "마음 타로", title: "요즘 마음이\n불안한 이유", sub: "불안의 뿌리 · 놓아줄 것 · 나를 달래는 법", bg: "night", art: "cat", topic: "now", spread: "anxious-mind", q: "요즘 왜 이렇게 마음이 불안할까?" },
    { id: "stuck", cats: ["마음", "일·돈"], eyebrow: "막힐 때 타로", title: "일이 안 풀릴 때,\n뭐가 막고 있을까", sub: "막힌 원인 · 풀리는 열쇠", bg: "dusk", art: "wheel", topic: "now", spread: "stuck", q: "요즘 일이 잘 안 풀리는 이유가 뭘까?" },
    { id: "celtic", cats: ["마음", "선택"], eyebrow: "깊이 보기 · 10장", title: "켈틱 크로스로\n내 상황 깊게 보기", sub: "과거·현재·미래·속마음·결과까지 10장", bg: "night", art: "wheel", topic: "now", spread: "celtic-cross", q: "" },
    { id: "today", cats: ["오늘"], eyebrow: "오늘의 카드", title: "오늘 나에게\n필요한 한 마디", sub: "카드 한 장 · 오늘의 조언", bg: "rose", art: "cards", topic: "today", spread: "daily-card", q: "오늘 나에게 필요한 메시지는?" },
    { id: "oracle", cats: ["오늘", "마음"], eyebrow: "쓸데없는 고민", title: "라면 먹을까?\n예·아니오로 물어봐", sub: "고양이 카드 한 장 · 예/아니오/글쎄", bg: "peach", art: "cat", to: "/oracle", cost: 1 },
  ];
}

export function renderTarotQuestion({ navigate }) {
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("해묘 타로", "오늘은 뭐가 궁금해?", "직접 물어보거나, 테마를 눌러 질문·배열이 정해진 채로 바로 카드를 뽑아요."));

  let cat = window.__tarotCat || "전체";
  const chipsHost = el("section", { class: "wrap" });
  const listHost = el("section", { class: "wrap theme-list", style: "margin-top: var(--sp-3);" });
  root.append(chipsHost, listHost);

  const cost = costOf("tarot");
  function go(t) {
    if (t.to) return navigate(t.to);
    const topic = getTopics().find((x) => x.id === t.topic);
    const spread = getSpreads().find((x) => x.id === t.spread);
    if (!topic || !spread) return navigate("/tarot");
    stash("tarot:topic", topic); stash("tarot:spread", spread); stash("tarot:question", t.q || "");
    if (!unstash("tarot:deck")) stash("tarot:deck", "full");
    navigate("/tarot/select");
  }
  // 직접 질문 (칩 상자 안 위쪽에)
  const qArea = el("textarea", { class: "input tq-input", rows: "1", maxlength: "120", placeholder: "직접 물어보기 (예: 연락 올까?)", "aria-label": "구체적인 질문" });
  qArea.value = unstash("tarot:question") || "";
  const topicRow = el("div", { class: "tq-topics" });
  const qBox = el("div", { class: "tq-box" }, [
    el("div", { class: "tq-top" }, [
      el("img", { class: "tq-cat", src: "assets/img/haemyo.webp", alt: "", "aria-hidden": "true" }),
      el("div", { style: "flex:1; min-width:0;" }, [qArea]),
    ]),
    el("p", { class: "tq-hint tiny", text: "질문을 적고 분야를 누르면 배열(23가지)과 덱을 직접 골라요. 테마로 바로 뽑으려면 아래 배너를 눌러요." }),
    topicRow,
  ]);
  qArea.addEventListener("input", () => { stash("tarot:question", qArea.value); qArea.style.height = "auto"; qArea.style.height = qArea.scrollHeight + "px"; });

  function paint() {
    clear(chipsHost); clear(listHost);
    chipsHost.append(el("div", { class: "theme-chips tq-panel" }, [
      qBox,
      el("div", { class: "tq-sep" }, [el("span", { text: "테마로 바로 뽑기" })]),
      ...CATS.map((c) =>
        el("button", { class: "theme-chip" + (c === cat ? " on" : ""), type: "button", onclick: () => { cat = c; window.__tarotCat = c; paint(); } }, [el("span", { text: c })])),
    ]));
    tarotThemes().filter((t) => cat === "전체" || t.cats.includes(cat)).forEach((t) => {
      const sp = getSpreads().find((x) => x.id === t.spread);
      const b = banner({ ...t, cost: t.cost != null ? t.cost : cost, sub: t.sub + (sp ? ` · ${sp.count}장` : "") }, () => go(t));
      listHost.append(b);
    });
  }

  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [
    noticeBox("info", "타로는 미래를 확정하는 도구가 아니라, 지금의 마음과 상황을 다른 각도에서 돌아보게 하는 참고 콘텐츠입니다."),
  ]));

  loadTarotData().then(() => {
    const selected = unstash("tarot:topic");
    topicRow.replaceChildren(...getTopics().map((t) => topicCard(t, navigate, selected && selected.id === t.id)));
    paint();
  });
  return root;
}

function topicCard(t, navigate, isSel) {
  return el("button", {
    class: "tq-topic" + (isSel ? " on" : ""), type: "button",
    onclick: () => { stash("tarot:topic", t); navigate("/tarot/spread"); },
    "aria-label": t.label + " 선택",
  }, [
    el("span", { class: "tb-ic" }, [icon(t.icon)]),
    el("span", { text: t.label }),
  ]);
}

/* ===== (합침) tarotSpread.js ===== */
/* 덱 종류 — 메이저 22장(고양이 카드) / 78장 전체(마이너 56장 포함) */
const DECKS = [
  { id: "major", label: "메이저 22장", desc: "해묘 고양이 카드로 굵직한 흐름을" },
  { id: "full", label: "78장 전체", desc: "마이너 56장까지 넣어 일상의 디테일까지" },
];

export function renderTarotSpread({ navigate }) {
  const topic = unstash("tarot:topic");
  if (!topic) { navigate("/tarot"); return el("div"); }

  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/tarot", "질문 선택")]));
  root.append(pageHeader("STEP 2", "카드 배열 선택", `‘${topic.label}’ 질문을 어떤 방식으로 볼까요?`));

  // 덱 선택
  let deck = unstash("tarot:deck") || "major";
  const deckHost = el("section", { class: "wrap" });
  function paintDeck() {
    deckHost.replaceChildren(
      el("p", { class: "muted tiny", style: "margin-bottom:8px;", text: "어떤 카드로 볼까요?" }),
      el("div", { class: "deck-toggle", role: "radiogroup", "aria-label": "카드 덱 선택" }, DECKS.map((d) =>
        el("button", {
          class: "deck-opt" + (d.id === deck ? " on" : ""), role: "radio", "aria-checked": String(d.id === deck),
          onclick: () => { deck = d.id; stash("tarot:deck", deck); paintDeck(); },
        }, [el("b", { text: d.label }), el("span", { text: d.desc })]))),
    );
  }
  stash("tarot:deck", deck);
  paintDeck();
  root.append(deckHost);

  const list = el("div", { class: "wrap" }, [el("p", { class: "muted", text: "불러오는 중…" })]);
  root.append(list);

  loadTarotData().then(() => {
    const spreads = getSpreads();
    const nodes = [];
    for (const g of getSpreadGroups()) {
      const inGroup = spreads.filter((s) => (s.group || "기본") === g);
      if (!inGroup.length) continue;
      nodes.push(el("h2", { class: "spread-group-title", text: g }));
      nodes.push(el("div", { class: "section-gap" }, inGroup.map((s) => spreadCard(s, navigate))));
    }
    list.replaceChildren(...nodes);
  });

  return root;
}

function spreadCard(s, navigate) {
  const dots = el("div", { style: "display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;" },
    Array.from({ length: s.count }).map(() =>
      el("span", { style: "width:20px; height:32px; border-radius:4px; border:1px solid var(--c-gold-line); background:var(--c-gold-glow);" })
    )
  );
  return el("button", {
    class: "panel", style: "display:block; width:100%; text-align:left; cursor:pointer;",
    onclick: () => { stash("tarot:spread", s); navigate("/tarot/select"); },
    "aria-label": `${s.label} 선택`,
  }, [
    el("div", { style: "display:flex; align-items:center; justify-content:space-between; gap:12px;" }, [
      el("div", {}, [
        el("h3", { text: `${s.label} · ${s.count}장` }),
        el("p", { class: "muted", style: "font-size:var(--fs-sm); margin-top:4px;", text: s.desc }),
        dots,
      ]),
      el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon("arrowRight")]),
    ]),
  ]);
}
