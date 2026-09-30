import { el, clear, toast, copyText, icon } from "../utils/dom.js";
import { loadTarotData, buildDeckSlots, getCard, cardFrontHTML, cardBackHTML } from "../tarot/cardArt.js";
import { buildOracle } from "../tarot/oracle.js";
import { pageHeader, backLink, noticeBox, insight } from "./_shared.js";
import { unstash, stash } from "../state.js";
import { methodPicker, layoutSpread, shuffleAnim, poolFor } from "./tarotSelect.js";
import { isUnlocked, unlock, getCoins, costOf } from "../wallet.js";
const EXAMPLES = ["지금 라면 먹을까?", "이 카톡 답장할까?", "걔는 왜 연락이 없을까?", "연락 올까?", "어떻게 해야 친해질까?", "언제쯤 좋은 소식 올까?"];

export function renderOracle({ navigate }) {
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("해묘에게 물어봐", "무슨 일이 묘해?",
    "아무리 사소한 고민이라도 좋아. 마음속으로 질문을 떠올리면 해묘가 카드 한 장을 펼쳐 풀어줄게."));

  const prefill = unstash("oracle:question") || "";
  const ex = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
  const qInput = el("input", { class: "input", type: "text", maxlength: "60", value: prefill, placeholder: `예: ${ex}`, "aria-label": "고민 질문" });
  root.append(el("div", { class: "wrap field" }, [
    el("label", { for: "", text: "고민을 적어보세요 (선택)" }), qInput,
  ]));

  const hint = el("p", { class: "wrap muted tiny", style: "text-align:center;", text: "카드를 한 장 톡 누르면 해묘가 풀어줄게" });
  const spreadEl = el("div", { class: "spread", role: "group", "aria-label": "카드 뭉치 (뒷면)" });
  const result = el("div", { class: "wrap section-gap", style: "margin-top: var(--sp-4);", "aria-live": "polite" });
  const bar = el("div", { class: "action-bar" });

  // 코인 게이트 — 해묘가 카드를 펼치기 전 결제
  const cost = costOf("oracle");
  const gate = el("div", { class: "wrap", style: "margin-top: var(--sp-3);" });
  root.append(gate);

  function itemId() { const q = (qInput.value.trim() || "random"); return `oracle:${q}:${dayStr()}`; }
  let method = unstash("tarot:method") || "fan";
  const methodHost = el("div", { class: "wrap" });
  const paintMethods = () => methodHost.replaceChildren(methodPicker(method, (m) => { method = m; stash("tarot:method", m); paintMethods(); delete spreadEl.dataset.picked; build(); }));
  function startDeck() {
    clear(gate);
    paintMethods();
    root.append(methodHost, hint, spreadEl, result, bar);
    window.addEventListener("resize", () => layoutSpread(spreadEl, method));
    root.classList.add("has-action-bar");
    loadTarotData().then(() => build());
  }
  function paintGate() {
    clear(gate);
    const coins = getCoins();
    if (isUnlocked(itemId())) { startDeck(); return; }
    const btn = el("button", { class: "btn btn-primary btn-block" },
      [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `해묘에게 물어보기 · 코인 ${cost}개` })]);
    btn.addEventListener("click", () => {
      if (coins >= cost) {
        const r = unlock(itemId(), cost);
        if (r.ok) startDeck();
      } else { toast("코인이 부족해요."); navigate("/store"); }
    });
    gate.append(btn, el("p", { class: "muted tiny", style: "text-align:center; margin-top:8px;", text: coins >= cost ? `보유 코인 ${coins}개 · 한 번 물으면 코인 ${cost}개` : `보유 코인 ${coins}개 · ${cost}개 필요` }));
  }
  paintGate();

  function build() {
    clear(result);
    spreadEl.replaceChildren();
    hint.style.display = "";
    const slots = buildDeckSlots(poolFor(method, "major", 1), 1);
    slots.forEach((slot) => spreadEl.append(makeCard(slot)));
    layoutSpread(spreadEl, method);
    renderBar(false);
    shuffleAnim(spreadEl).then(() => {
      if (method === "auto") { const cs = spreadEl.querySelectorAll(".spread-slot .tcard"); const c = cs[Math.floor(Math.random() * cs.length)]; if (c) setTimeout(() => c.click(), 300); }
    });
  }

  function makeCard(slot) {
    const inner = el("div", { class: "tcard-inner" }, [
      el("div", { class: "tcard-face tcard-back", html: cardBackHTML() }),
      el("div", { class: "tcard-face tcard-front" }),
    ]);
    const card = el("button", { class: "tcard", type: "button", "aria-label": "카드 선택" }, [inner]);
    const slotWrap = el("div", { class: "spread-slot" }, [card]);
    card.addEventListener("click", () => {
      if (spreadEl.dataset.picked) return;
      spreadEl.dataset.picked = "1";
      const c = getCard(slot.cardIndex);
      inner.querySelector(".tcard-front").innerHTML = cardFrontHTML(c);
      card.classList.toggle("is-reversed", slot.reversed);
      card.classList.add("is-flipped");
      slotWrap.classList.add("is-picked");
      // 나머지 흐리게
      spreadEl.querySelectorAll(".spread-slot").forEach((s) => { if (s !== slotWrap) s.classList.add("is-dimmed"); });
      hint.style.display = "none";
      showResult(buildOracle(slot.cardIndex, slot.reversed, qInput.value));
      renderBar(true);
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return slotWrap;
  }

  function showResult(o) {
    clear(result);
    result.append(el("div", { class: "panel panel-gold section-gap" }, [
      o.question ? el("p", { class: "muted", style: "text-align:center;", text: `“${o.question}”` }) : null,
      el("div", { class: `verdict verdict-${o.verdict}` }, [
        el("span", { class: "verdict-emoji", text: o.emoji }),
        el("span", { class: "verdict-label", text: o.verdictLabel }),
      ]),
      el("p", { class: "center muted", text: o.tone }),
      el("div", { class: "center", style: "margin-top:4px;" }, [
        el("span", { class: "tiny gold", text: `${o.cardName}${o.reversed ? "(역방향)" : ""} · ${o.keywords.join(" · ")}` }),
      ]),
      insight(o.playful),
    ].filter(Boolean)));

    // 그 사람 속사정 + 그럼 어떻게? — 결론을 구체적으로
    if (o.insideStory) {
      result.append(el("div", { class: "panel section-gap" }, [
        el("div", { class: "block tag-read" }, [
          el("span", { class: "block-label" }, [el("span", { text: `카드로 본 그 사람 속사정 · ${o.cardLine}` })]),
          el("p", { text: o.insideStory }),
          o.whyNote ? el("p", { class: "muted", style: "font-size:var(--fs-sm); margin-top:6px;", text: o.whyNote }) : null,
        ].filter(Boolean)),
        o.nextStep ? el("div", { class: "block tag-action" }, [
          el("span", { class: "block-label" }, [el("span", { text: "그럼 나는 이렇게" })]),
          el("p", { text: o.nextStep }),
        ]) : null,
      ].filter(Boolean)));
    }

    // 사람이 나오는 질문이면 — 꼬시는 법
    if (o.flirt) {
      result.append(el("div", { class: "panel section-gap", style: "border-color: var(--c-gold-line);" }, [
        el("p", { class: "eyebrow", text: "해묘의 연애 코치" }),
        el("h3", { class: "serif", style: "font-size:1.2rem;", text: "이렇게 꼬셔 봐 💘" }),
        el("div", { class: "overall-flow" }, o.flirt.map((t, i) => el("div", { class: "overall-step" }, [
          el("span", { class: "overall-dot", text: String(i + 1) }), el("p", { text: t }),
        ]))),
        el("p", { class: "muted tiny", text: "질투 유발·연락 끊기 같은 밀당보다, 편하고 즐거운 사람이 되는 게 제일 오래 가요." }),
      ]));
    }

    // 진짜 리딩처럼 — 카드가 말하는 것
    result.append(el("details", { class: "panel report-card", open: true }, [
      el("summary", {}, [
        el("span", { class: "rc-index" }, [icon("sparkle")]),
        el("span", { class: "rc-title" }, [document.createTextNode("카드가 말하는 것"), el("span", { class: "rc-sub", text: o.symbol })]),
        el("span", { class: "rc-chevron" }, [icon("chevronDown")]),
      ]),
      el("div", { class: "rc-body" }, [
        block("read", "지금의 흐름", "info", o.reason),
        block("good", "긍정적인 가능성", "check", o.positive),
        block("warn", "현실적인 장애물", "alert", o.caution),
        block("case", "놓치고 있는 부분", "compass", o.blindspot),
        block("action", "이렇게 해봐", "lightbulb", o.action),
        block("warn", "하지 말아야 할 것", "x", o.avoid),
        el("div", { class: "block" }, [
          el("span", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("info")]), el("span", { text: "스스로 물어볼 질문" })]),
          el("ul", { class: "reflect" }, [el("li", { text: o.reflect })]),
        ]),
      ]),
    ]));

    result.append(noticeBox("info", "재미로 보는 참고예요. 카드가 답을 정해주는 게 아니라, 지금 내 마음이 어느 쪽으로 기우는지 비춰 보는 거울이에요. 진짜 결정은 당신 몫! 🐱"));
  }

  function block(tag, label, ic, text) {
    return el("div", { class: `block tag-${tag}` }, [
      el("span", { class: "block-label" }, [el("span", { class: "ic" }, [icon(ic)]), el("span", { text: label })]),
      el("p", { text }),
    ]);
  }

  function renderBar(picked) {
    bar.replaceChildren();
    const again = el("button", { class: "btn " + (picked ? "btn-primary" : "btn-ghost"), style: picked ? "flex:1;" : "" },
      [icon("sparkle"), el("span", { text: picked ? "다른 고민 물어보기" : "카드 다시 섞기" })]);
    again.addEventListener("click", () => { delete spreadEl.dataset.picked; if (picked) qInput.value = ""; build(); qInput.focus(); });
    bar.append(again);
    if (picked) {
      const copyBtn = el("button", { class: "btn btn-ghost", "aria-label": "결과 복사" }, [icon("copy")]);
      copyBtn.addEventListener("click", async () => {
        const o = result.querySelector(".verdict-label")?.textContent || "";
        const card = result.querySelector(".gold")?.textContent || "";
        const q = qInput.value ? `[${qInput.value}] ` : "";
        const ok = await copyText(`${q}오라클: ${o} (${card})\n${result.querySelector(".insight")?.textContent || ""}`);
        toast(ok ? "복사했어요." : "복사 실패");
      });
      bar.append(copyBtn);
    }
  }

  return root;
}

function dayStr() {
  const d = new Date(); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
