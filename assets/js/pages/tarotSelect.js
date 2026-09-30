import { el, prefersReducedMotion, icon } from "../utils/dom.js";
import { loadTarotData, buildDeckSlots, getCard, cardFrontHTML, cardBackHTML } from "../tarot/cardArt.js";
import { stash, unstash } from "../state.js";
import { pageHeader, backLink } from "./_shared.js";
export function renderTarotSelect({ navigate }) {
  const topic = unstash("tarot:topic");
  const spread = unstash("tarot:spread");
  if (!topic || !spread) { navigate("/tarot"); return el("div"); }
  const deck = unstash("tarot:deck") || "major";
  let method = unstash("tarot:method") || "fan";

  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/tarot/spread", "배열 선택")]));
  root.append(pageHeader("STEP 3", "카드를 선택하세요",
    (unstash("tarot:question") ? `“${unstash("tarot:question")}” — 이 질문을 마음속으로 떠올리며 ${spread.count}장을 고르세요.` : `마음속으로 ‘${topic.label}’에 대한 질문을 떠올리며 ${spread.count}장을 고르세요.`) + " 선택하기 전에는 카드 앞면이 보이지 않습니다."));

  const counter = el("p", { class: "pick-counter", "aria-live": "polite" }, [
    el("b", { text: "0" }), document.createTextNode(` / ${spread.count}장 선택`),
  ]);
  root.append(el("div", { class: "wrap" }, [counter]));

  const methodHost = el("div", { class: "wrap" });
  root.append(methodHost);
  const spreadEl = el("div", { class: "spread", role: "group", "aria-label": "타로 카드 뭉치 (뒷면)" });
  root.append(spreadEl);

  const pickedRow = el("div", { class: "wrap picked-row", style: "margin-top: var(--sp-4);" });
  root.append(pickedRow);

  const bar = el("div", { class: "action-bar" });
  root.classList.add("has-action-bar");
  root.append(bar);

  loadTarotData().then(() => {
    const paintMethods = () => methodHost.replaceChildren(methodPicker(method, (m) => {
      method = m; stash("tarot:method", m); paintMethods(); start();
    }));
    paintMethods();
    let state;
    const start = () => { build(newRound()); shuffleAnim(spreadEl).then(() => { if (method === "auto") autoPick(); }); };
    start();
    window.addEventListener("resize", () => layoutSpread(spreadEl, method));

    function newRound() {
      const slots = buildDeckSlots(poolFor(method, deck, spread.count), spread.count, null, deck); // 무작위(암호학적) 셔플
      return { slots, picked: [] };
    }
    /* 섞어서 자동 — 필요한 장수만큼 차례로 뒤집기 */
    function autoPick() {
      const cards = Array.from(spreadEl.querySelectorAll(".spread-slot .tcard"));
      const order = cards.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, spread.count);
      order.forEach((idx, k) => setTimeout(() => cards[idx] && cards[idx].click(), 350 * (k + 1)));
    }

    function build(st) {
      state = st;
      spreadEl.replaceChildren();
      pickedRow.replaceChildren();
      counter.firstChild.textContent = "0";
      st.slots.forEach((slot, i) => spreadEl.append(makeCard(slot, i, st)));
      layoutSpread(spreadEl, method);
      renderBar(st);
    }

    function makeCard(slot, i, st) {
      const inner = el("div", { class: "tcard-inner" }, [
        el("div", { class: "tcard-face tcard-back", html: cardBackHTML() }),
        el("div", { class: "tcard-face tcard-front" }), // 앞면은 선택 시 주입(미리 안 보이게)
      ]);
      const card = el("button", {
        class: "tcard", type: "button", "data-tilt": "",
        "aria-label": "뒷면 카드, 선택하려면 누르세요", "aria-pressed": "false",
      }, [inner]);

      const slotWrap = el("div", { class: "spread-slot" }, [card]);
      addTilt(card);

      card.addEventListener("click", () => {
        if (card.classList.contains("is-flipped")) return; // 이미 선택됨
        if (st.picked.length >= spread.count) return;
        // 앞면 주입 후 뒤집기
        const c = getCard(slot.cardIndex);
        inner.querySelector(".tcard-front").innerHTML = cardFrontHTML(c);
        card.classList.toggle("is-reversed", slot.reversed);
        card.classList.add("is-flipped");
        slotWrap.classList.add("is-picked");
        card.setAttribute("aria-pressed", "true");
        card.setAttribute("aria-label",
          `${c.name}${slot.reversed ? " 역방향" : " 정방향"} 선택됨`);

        const posIndex = st.picked.length;
        st.picked.push(slot);
        counter.firstChild.textContent = String(st.picked.length);
        addPickedThumb(c, slot, spread.positions[posIndex]);
        renderBar(st);

        if (st.picked.length >= spread.count) lockRest();
      });

      return slotWrap;
    }

    function lockRest() {
      spreadEl.querySelectorAll(".spread-slot").forEach((s) => {
        const b = s.querySelector(".tcard");
        if (!b.classList.contains("is-flipped")) {
          s.classList.add("is-dimmed");
          b.setAttribute("aria-disabled", "true");
        }
      });
    }

    function addPickedThumb(card, slot, pos) {
      pickedRow.append(el("div", { class: "picked-item" }, [
        pos ? el("span", { class: "pos-label", text: pos.label }) : null,
        el("span", { class: "card-name", text: card.name }),
        el("span", { class: "card-dir", text: slot.reversed ? "역방향" : "정방향" }),
      ].filter(Boolean)));
    }

    function renderBar(st) {
      bar.replaceChildren();
      const reshuffle = el("button", { class: "btn btn-ghost" }, [icon("sparkle"), el("span", { text: "다시 섞기" })]);
      reshuffle.addEventListener("click", () => start());
      bar.append(reshuffle);

      if (st.picked.length >= spread.count) {
        const go = el("button", { class: "btn btn-primary", style: "flex:1;" },
          [el("span", { text: "결과 보기" }), icon("arrowRight")]);
        go.addEventListener("click", () => {
          stash("tarot:picks", { topicId: topic.id, spreadId: spread.id, deck, slots: st.picked, question: unstash("tarot:question") || "" });
          navigate("/tarot/result");
        });
        bar.append(go);
      } else {
        bar.append(el("span", { class: "muted", style: "flex:1; text-align:center; align-self:center; font-size:var(--fs-sm);",
          text: `${spread.count - st.picked.length}장 더 선택하세요` }));
      }
    }
  });

  return root;
}

/* ---------- 카드 고르는 방식 (타로·물어보기 공용) ---------- */
export const PICK_METHODS = [
  { id: "fan", label: "부채꼴", desc: "부채처럼 펼쳐서" },
  { id: "row", label: "가로로 넘기기", desc: "한 줄로 넘기며" },
  { id: "grid", label: "전부 펼치기", desc: "덱 전체를 깔아 놓고" },
  { id: "auto", label: "섞어서 자동", desc: "해묘가 섞어서 뽑기" },
];
/** 방식별로 펼칠 카드 수 — 너무 적지 않게 */
export function poolFor(method, deck, need) {
  const all = deck === "full" ? 78 : 22;
  if (method === "row" || method === "grid") return all;
  return Math.max(need + 6, deck === "full" ? 30 : 22);
}
/** 방식 고르는 칩 */
export function methodPicker(current, onChange) {
  return el("div", { class: "pick-methods", role: "radiogroup", "aria-label": "카드 고르는 방식" },
    PICK_METHODS.map((m) => el("button", {
      class: "pm-chip" + (m.id === current ? " on" : ""), type: "button", role: "radio", "aria-checked": String(m.id === current),
      onclick: () => { if (m.id !== current) onChange(m.id); },
    }, [el("b", { text: m.label }), el("span", { text: m.desc })])));
}
/** 섞는 애니메이션 */
export function shuffleAnim(spreadEl) {
  if (prefersReducedMotion()) return Promise.resolve();
  spreadEl.classList.remove("shuffling"); void spreadEl.offsetWidth;
  spreadEl.classList.add("shuffling");
  return new Promise((r) => setTimeout(() => { spreadEl.classList.remove("shuffling"); r(); }, 900));
}
/** 방식별 배치 */
export function layoutSpread(spreadEl, method = "fan") {
  const slots = Array.from(spreadEl.querySelectorAll(".spread-slot"));
  const n = slots.length;
  spreadEl.classList.remove("scrolling", "grid", "fan");
  slots.forEach((s, i) => { s.style.transform = ""; s.style.left = ""; s.style.marginLeft = ""; s.style.zIndex = ""; s.style.setProperty("--i", i); });
  if (method === "row") { spreadEl.classList.add("scrolling"); return; }
  if (method === "grid") { spreadEl.classList.add("grid"); return; }
  spreadEl.classList.add("fan");
  const width = (spreadEl.clientWidth || 360) - 24;
  const cs = getComputedStyle(slots[0] || spreadEl);
  const cardW = parseFloat(cs.getPropertyValue("--card-w")) || 96;
  const cardH = parseFloat(cs.getPropertyValue("--card-h")) || 163;
  const spanDeg = Math.min(width < 600 ? 34 : 54, n * 2.4);
  const spill = cardH * Math.sin((spanDeg / 2) * Math.PI / 180); // 기울어진 끝 카드가 옆으로 삐져나오는 폭
  const overlapX = n > 1 ? Math.max(4, Math.min(42, (width - cardW - spill) / (n - 1))) : 0;
  const step = n > 1 ? spanDeg / (n - 1) : 0;
  slots.forEach((s, i) => {
    const ang = -spanDeg / 2 + step * i;
    const x = (i - (n - 1) / 2) * overlapX;
    const lift = Math.abs(ang) * 0.9; // 가장자리는 살짝 내려가 부채 모양
    s.style.left = "50%";
    s.style.marginLeft = "calc(var(--card-w) / -2)";
    s.style.transform = `translate(${x}px, ${lift}px) rotate(${ang}deg)`;
    s.style.zIndex = String(i);
  });
}
function layoutFan(spreadEl) { layoutSpread(spreadEl, "fan"); }

/* 미세 기울기 효과 (마우스). reduced-motion / 터치에서는 비활성 */
function addTilt(card) {
  if (prefersReducedMotion()) return;
  if (window.matchMedia("(hover: none)").matches) return;
  card.addEventListener("pointermove", (e) => {
    if (card.classList.contains("is-flipped")) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--ry", `${px * 8}deg`);
    card.style.setProperty("--rx", `${-py * 8}deg`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--rx", "0deg");
  });
}
