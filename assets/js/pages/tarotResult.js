import { el, clear, toast, copyText, icon } from "../utils/dom.js";
import { unstash, saveResult, makeId } from "../state.js";
import { loadTarotData, getTopic, cardFrontHTML, cardBackHTML } from "../tarot/cardArt.js";
import { buildReading, needsSpeculationNote } from "../tarot/reading.js";
import { backLink, noticeBox, insight, loadDisclaimer, pageHeader } from "./_shared.js";
import { renderShareCard, downloadBlob, shareImage } from "../utils/shareImage.js";
import { isUnlocked, unlock, getCoins, costOf } from "../wallet.js";
export function renderTarotResult({ navigate }) {
  const picks = unstash("tarot:picks");
  const root = el("div", {});
  if (!picks || !Array.isArray(picks.slots)) { navigate("/tarot"); return root; }

  const cost = costOf("tarot");
  // 이 뽑기 1회 단위 결제 — 같은 결과 재열람/저장은 무료
  const sessionId = "tarot:" + tarotSig(picks);

  const host = el("div", {});
  root.append(host);
  function paint() {
    clear(host);
    if (!isUnlocked(sessionId)) { host.append(tarotLock({ navigate, cost, sessionId, repaint: paint })); return; }
    host.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
    host.append(el("div", { class: "wrap" }, [el("h1", { text: "해묘의 타로 리딩" })]));
    const body = el("div", {});
    host.append(body);
    loadTarotData().then(() => {
      const reading = buildReading(picks);
      clear(host);
      host.append(buildTarotReadingNode(reading, { navigate, saved: false }));
    });
  }
  paint();
  return root;
}

function tarotSig(picks) {
  try { return JSON.stringify(picks).length + "_" + (picks.topicId || "t"); } catch { return "t"; }
}

function tarotLock({ navigate, cost, sessionId, repaint }) {
  const wrap = el("div", {});
  wrap.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/tarot/select", "카드 선택")]));
  wrap.append(pageHeader("해묘의 타로", "카드를 펼쳤어", "해묘가 골라준 카드를 풀어줄게. 준비됐어?"));
  const coins = getCoins();
  const box = el("div", { class: "wrap" }, [el("div", { class: "panel premium-lock" }, [
    el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
    el("h3", { class: "serif", style: "margin-top:10px;", text: "해묘가 풀어줄게" }),
    el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "뽑은 카드로 지금의 흐름과 조언을 종합해 풀어 드려요. 열면 저장·재열람은 무료예요." }),
    coins >= cost
      ? btnPrimary(`코인 ${cost}개로 풀이 보기 · 보유 ${coins}개`, () => { const r = unlock(sessionId, cost); if (r.ok) repaint(); })
      : (() => { const b = el("div", {}, [el("p", { class: "muted tiny", style: "margin:8px 0;", text: `보유 코인 ${coins}개 · ${cost}개 필요해요.` }), btnPrimary("코인 받으러 가기", () => navigate("/store"))]); return b; })(),
  ])]);
  wrap.append(box);
  return wrap;
}
function btnPrimary(text, onClick) {
  return el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: onClick }, [el("span", { text })]);
}

/** 공통 렌더 (미저장/저장 모두). reading = buildReading() 결과 */
export function buildTarotReadingNode(reading, { navigate, saved = false, savedId = null } = {}) {
  loadDisclaimer();
  const topic = reading.topic || getTopic(reading.topicId);
  const root = el("div", {});

  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [
    backLink(navigate, saved ? "/saved" : "/", saved ? "저장함" : "홈"),
  ]));

  // 헤더
  root.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel report-head" }, [
      el("span", { class: "eyebrow", text: "타로 리딩" }),
      el("h1", { class: "serif", style: "margin-top:6px;", text: `${topic.label} · ${reading.spread.label}` }),
      el("p", { class: "muted", style: "margin-top:8px;", text: reading.summary }),
    ]),
  ]));

  // 한 줄 결론 (두괄식)
  if (reading.conclusion) {
    const c = reading.conclusion;
    root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
      el("div", { class: `panel conclusion conclusion-${reading.verdict}` }, [
        el("span", { class: "conclusion-tag", text: `결론 · ${c.label}` }),
        el("p", { class: "conclusion-head", text: c.headline }),
        el("p", { class: "conclusion-sub", text: c.sub }),
      ]),
    ]));
  }

  // 뽑은 카드 시각화 (확대 보기 가능)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [
    el("div", { class: "picked-row" }, reading.items.map((it) => revealedCard(it))),
  ]));

  // 질문에 대한 답
  if (reading.answer) {
    const a = reading.answer;
    root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [
      el("div", { class: "panel panel-gold section-gap" }, [
        el("p", { class: "muted", style: "text-align:center;", text: `“${a.question}”` }),
        el("div", { class: `verdict verdict-${a.verdict}` }, [el("span", { class: "verdict-emoji", text: a.emoji }), el("span", { class: "verdict-label", text: a.label })]),
        el("p", { style: "text-align:center; font-weight:600;", text: a.tone }),
        a.evidence && a.evidence.length ? el("div", { class: "block tag-read" }, [
          el("span", { class: "block-label" }, [el("span", { text: "카드 근거" })]),
          ...a.evidence.map((t) => el("p", { text: t })),
        ]) : null,
      ].filter(Boolean)),
      a.flirt ? el("div", { class: "panel section-gap", style: "margin-top: var(--sp-3);" }, [
        el("p", { class: "eyebrow", text: "해묘의 연애 코치" }),
        el("h3", { class: "serif", style: "font-size:1.15rem;", text: "이렇게 다가가 봐 💘" }),
        el("div", { class: "overall-flow" }, a.flirt.map((t, i) => el("div", { class: "overall-step" }, [el("span", { class: "overall-dot", text: String(i + 1) }), el("p", { text: t })]))),
      ]) : null,
    ].filter(Boolean)));
  }

  // 종합 해석
  if (reading.overall) {
    root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [overallPanel(reading.overall, topic)]));
  }

  // 추론 주의 안내(상대 마음/재회 등)
  if (needsSpeculationNote(topic.id)) {
    root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
      noticeBox("warn", "상대방의 속마음이나 앞으로의 행동은 사실로 확정할 수 없습니다. 아래 해석은 카드의 상징을 바탕으로 추론한 ‘가능성’이며, 확인은 실제 대화를 통해 하시길 권합니다."),
    ]));
  }

  // 각 카드 해석
  const cards = el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-5);" });
  reading.items.forEach((it, i) => cards.append(readingCard(it, i + 1)));
  root.append(cards);

  // 마무리 면책
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [
    noticeBox("info", "타로 해석은 자기이해와 오락을 위한 참고 콘텐츠입니다. 부정적으로 보이는 카드도 대응 방법과 함께 읽어 주세요. 중요한 결정은 실제 상황과 신뢰할 수 있는 정보를 함께 검토하세요."),
  ]));

  root.classList.add("has-action-bar");
  root.append(buildActionBar({ reading, navigate, saved, savedId, topic }));
  return root;
}

/* ---- 종합 해석 ---- */
function overallPanel(overall, topic) {
  return el("div", { class: "panel panel-gold section-gap" }, [
    el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("sparkle")]), el("span", { text: "종합 해석" })]),
    el("div", { class: "overall-flow" }, overall.narrative.map((t, i) =>
      el("div", { class: "overall-step" }, [
        el("span", { class: "overall-dot", text: String(i + 1) }),
        el("p", { text: t }),
      ]))),
    insight(overall.close),
    el("p", { class: "tiny muted", text: "카드의 상징을 이어 읽은 참고 해석입니다. 미래를 확정하지 않으며, 마지막 판단은 당신의 몫이에요." }),
  ]);
}

/* ---- 조각 ---- */
function revealedCard(it) {
  const cardEl = el("div", { class: "tcard is-flipped" + (it.reversed ? " is-reversed" : ""), style: "--card-w:120px; --card-h:204px;" }, [
    el("div", { class: "tcard-inner" }, [
      el("div", { class: "tcard-face tcard-back", html: cardBackHTML() }),
      el("div", { class: "tcard-face tcard-front", html: cardFrontHTML(cardData(it)) }),
    ]),
  ]);
  const btn = el("button", {
    class: "picked-item", style: "background:none; border:0; cursor:zoom-in;",
    onclick: () => openLightbox(it), "aria-label": `${it.cardName} 확대 보기`,
  }, [
    it.position ? el("span", { class: "pos-label", text: it.position.label }) : null,
    cardEl,
    el("span", { class: "card-name", text: it.cardName }),
    el("span", { class: "card-dir", text: it.reversed ? "역방향" : "정방향" }),
  ].filter(Boolean));
  return btn;
}

function cardData(it) {
  return { number: it.cardNumber, name: it.cardName, art: it.art };
}

function readingCard(it, index) {
  const details = el("details", { class: "panel report-card", open: true });
  details.append(
    el("summary", {}, [
      el("span", { class: "rc-index", text: String(index) }),
      el("span", { class: "rc-title" }, [
        document.createTextNode(`${it.cardName}${it.reversed ? " (역방향)" : ""}`),
        el("span", { class: "rc-sub", text: (it.position ? it.position.label + " · " : "") + it.keywords.join(" · ") }),
      ]),
      el("span", { class: "rc-chevron" }, [icon("chevronDown")]),
    ]),
    el("div", { class: "rc-body" }, [
      block("summary", "카드의 핵심 상징", "sparkle", it.symbol),
      block("read", "질문과 연결한 해석", "info", it.blocks.connect),
      block("good", "긍정적인 가능성", "check", it.blocks.positive),
      block("warn", "현실적인 장애물", "alert", it.blocks.obstacle),
      block("case", "놓치고 있는 부분", "compass", it.blocks.blindspot),
      block("action", "가까운 시기에 취할 행동", "lightbulb", it.blocks.action),
      block("warn", "하지 말아야 할 행동", "x", it.blocks.avoid),
      el("div", { class: "block" }, [
        el("span", { class: "block-label", style: "color:var(--c-gold-soft);" }, [
          el("span", { class: "ic" }, [icon("info")]), el("span", { text: "스스로 생각해 볼 질문" }),
        ]),
        el("ul", { class: "reflect" }, [el("li", { text: it.reflect })]),
      ]),
    ])
  );
  return details;
}

function block(tag, label, ic, text) {
  return el("div", { class: `block tag-${tag}` }, [
    el("span", { class: "block-label" }, [el("span", { class: "ic" }, [icon(ic)]), el("span", { text: label })]),
    el("p", { text }),
  ]);
}

/* 카드 확대 라이트박스 */
function openLightbox(it) {
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  const closeBtn = el("button", { class: "btn btn-ghost lb-close", "aria-label": "닫기" }, [icon("x")]);
  closeBtn.addEventListener("click", close);
  const card = el("div", { class: "tcard is-flipped" + (it.reversed ? " is-reversed" : "") }, [
    el("div", { class: "tcard-inner" }, [
      el("div", { class: "tcard-face tcard-back", html: cardBackHTML() }),
      el("div", { class: "tcard-face tcard-front", html: cardFrontHTML(cardData(it)) }),
    ]),
  ]);
  const box = el("div", { class: "lightbox", role: "dialog", "aria-modal": "true", "aria-label": `${it.cardName} 카드` },
    [closeBtn, card]);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(box);
  closeBtn.focus();
}

/* 액션바 */
function buildActionBar({ reading, navigate, saved, savedId, topic }) {
  const saveBtn = el("button", { class: "btn btn-primary", style: "flex:1;" },
    saved ? [icon("check"), el("span", { text: "저장됨" })] : [icon("bookmark"), el("span", { text: "결과 저장" })]);
  if (saved) saveBtn.disabled = true;
  saveBtn.addEventListener("click", () => {
    const id = savedId || makeId("tarot");
    const title = `${topic.label} · ${reading.spread.label} 타로`;
    saveResult({ id, type: "tarot", title, createdAt: Date.now(), reading });
    toast("결과를 이 브라우저에 저장했어요.");
    saveBtn.disabled = true;
    clear(saveBtn); saveBtn.append(icon("check"), el("span", { text: "저장됨" }));
  });

  const shareBtn = el("button", { class: "btn btn-ghost" }, [icon("share"), el("span", { text: "공유" })]);
  shareBtn.addEventListener("click", () => shareReading(reading, topic));

  const copyBtn = el("button", { class: "btn btn-ghost", "aria-label": "결과 복사" }, [icon("copy")]);
  copyBtn.addEventListener("click", async () => {
    const ok = await copyText(tarotText(reading, topic));
    toast(ok ? "결과를 복사했어요." : "복사에 실패했어요.");
  });

  return el("div", { class: "action-bar" }, [saveBtn, shareBtn, copyBtn]);
}

async function shareReading(reading, topic) {
  const tags = reading.items.map((it) => `${it.cardName}${it.reversed ? "(역)" : ""}`);
  toast("공유 이미지를 만드는 중…", 1200);
  const blob = await renderShareCard({
    kind: "tarot", eyebrow: "TAROT READING",
    title: `${topic.label} · ${reading.spread.label}`,
    summary: reading.summary, tags,
    profileLabel: "타로 자기분석 리딩",
  });
  const shared = await shareImage(blob, { title: "타로 리딩 결과", text: tarotText(reading, topic) });
  if (!shared) { downloadBlob(blob, "tarot-reading.png"); toast("이미지를 저장했어요. (공유 미지원 환경)"); }
}

function tarotText(reading, topic) {
  let s = `[타로 리딩] ${topic.label} · ${reading.spread.label}\n${reading.summary}\n\n`;
  reading.items.forEach((it) => {
    s += `▸ ${it.position ? it.position.label + " - " : ""}${it.cardName}${it.reversed ? "(역)" : ""}\n`;
    s += `  해석: ${it.blocks.connect}\n  행동: ${it.blocks.action}\n\n`;
  });
  s += "※ 카드의 상징을 바탕으로 한 참고 해석입니다. 미래를 확정하지 않습니다.";
  return s;
}
