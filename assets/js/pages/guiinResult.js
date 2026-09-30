import { el, toast, copyText, icon } from "../utils/dom.js";
import { unstash } from "../state.js";
import { computeSaju } from "../saju/manse.js";
import { benefactorCheck } from "../saju/guiin.js";
import { backLink, noticeBox, loadDisclaimer } from "./_shared.js";
import { renderShareCard, downloadBlob, shareImage } from "../utils/shareImage.js";
import { isUnlocked, unlock, getCoins, costOf } from "../wallet.js";
const TIER_COLOR = {
  "귀인": "#5bbf7a", "좋은 인연": "#7fbf8a", "무난한 사이": "#c8a45c", "조심할 인연": "#d98a5b",
};

export function renderGuiinResult({ navigate }) {
  loadDisclaimer();
  const input = unstash("guiin:input");
  if (!input || !input.me || !input.other) { navigate("/people"); return el("div"); }

  const meName = input.me.name || "나";
  const otName = input.other.name || "상대";
  const itemId = `guiin:${input.me.birthDate || "?"}_${input.other.birthDate || "?"}`;
  const cost = costOf("guiin");
  const ghost = el("div", {});
  function gpaint() {
    while (ghost.firstChild) ghost.removeChild(ghost.firstChild);
    if (!isUnlocked(itemId)) { ghost.append(guiinLock({ navigate, meName, otName, cost, itemId, repaint: gpaint })); return; }
    ghost.append(buildGuiin());
  }

  let dir = "toMe"; // toMe: 상대가 나에게 귀인? / toOther: 내가 상대에게 귀인?
  function buildGuiin() {
  const pme = computeSaju(input.me);
  const poth = computeSaju(input.other);
  // 방향별로 각자의 용신 기준으로 판정 (귀인은 방향이 있다)
  const resToMe = benefactorCheck(pme, poth, { me: meName, other: otName });   // 상대가 나에게
  const resToOther = benefactorCheck(poth, pme, { me: otName, other: meName }); // 내가 상대에게

  const isGood = (v) => v === "귀인" || v === "좋은 인연";
  const aG = isGood(resToMe.verdict), bG = isGood(resToOther.verdict);
  const mutual = aG && bG
    ? "서로에게 힘이 되는 ‘상호 귀인’ 사이예요. 아끼며 오래 갈 인연이에요. 🤝"
    : aG ? `${otName}은(는) 나에게 귀인이지만, 나는 ${otName}에게는 조금 더 무난한 편이에요. 내가 먼저 배려하면 균형이 맞아요.`
      : bG ? `나는 ${otName}에게 힘이 되는 사람이에요. 다만 ${otName}이(가) 나에게 주는 도움은 조금 더 담백한 편이에요.`
        : "서로 크게 기대기보다 무난하게 어울리는 사이예요. 관계는 기운보다 노력으로 만들어져요.";

  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/people", "내 사람들")]));

  // 상호 요약 배너
  root.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel report-head", style: "text-align:center;" }, [
      el("span", { class: "eyebrow", text: "귀인 체크 · 양방향" }),
      el("h1", { class: "serif", style: "margin-top:6px; font-size:1.35rem;", text: `${meName} ↔ ${otName}` }),
      el("div", { class: "guiin-mini", style: "display:flex; gap:8px; justify-content:center; margin-top:12px;" }, [
        miniVerdict(`${otName} → 나`, resToMe.verdict, resToMe.score),
        miniVerdict(`나 → ${otName}`, resToOther.verdict, resToOther.score),
      ]),
      el("p", { class: "insight", style: "margin-top:14px; text-align:left;", text: mutual }),
    ]),
  ]));

  // 방향 탭
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "method-tabs" }, [
      el("button", { class: "method-tab" + (dir === "toMe" ? " on" : ""), onclick: () => { dir = "toMe"; gpaint(); } }, [el("span", { text: `${otName}이(가) 나에게` })]),
      el("button", { class: "method-tab" + (dir === "toOther" ? " on" : ""), onclick: () => { dir = "toOther"; gpaint(); } }, [el("span", { text: `내가 ${otName}에게` })]),
    ]),
  ]));

  const res = dir === "toMe" ? resToMe : resToOther;
  const subject = dir === "toMe" ? otName : meName; // 판정 대상(누가 귀인인지)
  const basis = dir === "toMe" ? meName : otName;   // 누구 기준(용신)
  const color = TIER_COLOR[res.verdict] || "#c8a45c";

  // 헤더 판정 (현재 방향)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-3);" }, [
    el("div", { class: "panel report-head", style: "text-align:center;" }, [
      el("h2", { class: "serif", style: "font-size:1.15rem;", text: `${subject} 은(는)…` }),
      el("p", { class: "serif", style: `font-size:2rem; font-weight:700; color:${color}; margin-top:8px;`, text: res.verdict }),
      el("p", { class: "muted", style: "margin-top:2px;", text: `${basis} 기준 · 귀인 지수 ${res.score}점` }),
      gauge(res.score, color),
      el("div", { style: "display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:12px;" }, [
        chip(`${basis} 일간 ${res.dayMasters.me}`), chip(`${subject} 일간 ${res.dayMasters.other}`),
        chip(`${basis} 용신 ${res.yongsinKr.join("·")}`),
      ]),
    ]),
  ]));

  // 왜 도움 / 주의 (현재 방향)
  root.append(el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-4);" }, [
    block(dir === "toMe" ? "이 사람이 나에게 힘이 되는 이유" : `내가 ${otName}에게 힘이 되는 이유`, "heart", res.pros, "rgba(91,191,122,0.10)", "#5bbf7a"),
    block("조심하거나 거리 조절이 필요한 부분", "alert", res.cons, "rgba(217,138,91,0.10)", "#d98a5b"),
    el("div", { class: "insight", text: res.advice }),
  ]));

  // 안내 + 액션
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
    noticeBox("info", "귀인은 방향이 있어요 — 각자의 용신(가장 힘이 되는 기운)이 다르기 때문이에요. ‘귀인/악연’은 사람을 좋고 나쁨으로 나누는 게 아니라 기운의 맞물림을 보는 참고이고, 실제 관계는 서로의 태도와 노력으로 달라집니다."),
  ]));

  root.classList.add("has-action-bar");
  root.append(el("div", { class: "action-bar" }, [
    el("button", { class: "btn btn-primary", onclick: () => shareGuiin(res, basis, subject) }, [icon("share"), el("span", { text: "공유" })]),
    el("button", { class: "btn btn-ghost", "aria-label": "결과 복사", onclick: async () => {
      const ok = await copyText(guiinText(res, basis, subject));
      toast(ok ? "결과를 복사했어요." : "복사에 실패했어요.");
    } }, [icon("copy")]),
  ]));

  return root;
  }

  gpaint();
  return ghost;
}

function guiinLock({ navigate, meName, otName, cost, itemId, repaint }) {
  const wrap = el("div", {});
  wrap.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/people", "내 사람들")]));
  wrap.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel report-head", style: "text-align:center;" }, [
      el("span", { class: "eyebrow", style: "justify-content:center;", text: "귀인 체크" }),
      el("h1", { class: "serif", style: "margin-top:6px;", text: `${otName} 은(는)…` }),
    ]),
  ]));
  const coins = getCoins();
  const box = el("div", { class: "panel premium-lock", style: "margin-top: var(--sp-4);" }, [
    el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
    el("h3", { class: "serif", style: "margin-top:10px;", text: `${otName}이(가) 나에게 귀인일까?` }),
    el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "용신·천을귀인·합충으로 귀인 지수와 이유, 조심할 부분까지 풀어 드려요. 한 번 열면 다시 볼 땐 무료예요." }),
  ]);
  if (coins >= cost) {
    box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
      const r = unlock(itemId, cost);
      if (r.ok) { toast(r.reason === "spent" ? "귀인 체크를 열었어요" : "이미 열어 둔 결과예요."); repaint(); }
      else { toast("코인이 부족해요."); navigate("/store"); }
    } }, [el("span", { text: `코인 ${cost}개로 열기 · 보유 ${coins}개` })]));
  } else {
    box.append(el("p", { class: "muted tiny", style: "margin-top:8px;", text: `보유 코인 ${coins}개 · ${cost}개 필요해요.` }));
    box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-3);", onclick: () => navigate("/store") }, [el("span", { text: "코인 받으러 가기" })]));
  }
  wrap.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [box]));
  return wrap;
}

function miniVerdict(label, verdict, score) {
  const color = TIER_COLOR[verdict] || "#c8a45c";
  return el("div", { class: "gv-mini", style: `flex:1; max-width:180px; border:1px solid ${color}55; background:${color}14; border-radius:14px; padding:10px 8px;` }, [
    el("p", { class: "muted tiny", style: "margin-bottom:4px;", text: label }),
    el("p", { class: "serif", style: `font-weight:700; color:${color}; font-size:1.05rem;`, text: verdict }),
    el("p", { class: "muted tiny", style: "margin-top:2px;", text: `${score}점` }),
  ]);
}

function gauge(score, color) {
  return el("div", { style: "margin: 14px auto 0; max-width:280px;" }, [
    el("div", { style: "height:10px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden;" }, [
      el("div", { style: `height:100%; width:${score}%; border-radius:999px; background:${color}; transition:width .5s ease;` }),
    ]),
    el("div", { class: "muted tiny", style: "display:flex; justify-content:space-between; margin-top:4px;" }, [
      el("span", { text: "조심할 인연" }), el("span", { text: "귀인" }),
    ]),
  ]);
}

function block(title, ic, items, bg, accent) {
  return el("div", { class: "panel", style: `background:${bg};` }, [
    el("p", { style: `font-weight:700; display:flex; align-items:center; gap:8px; color:${accent};` }, [icon(ic), el("span", { text: title })]),
    el("ul", { style: "margin-top:8px; padding-left:2px; list-style:none; display:flex; flex-direction:column; gap:8px;" },
      items.map((t) => el("li", { style: "display:flex; gap:8px;", html: `<span style="color:${accent};">•</span><span>${escapeHtml(t)}</span>` }))),
  ]);
}

function chip(text) {
  return el("span", { style: "font-size:0.78rem; color:var(--c-gold); border:1px solid var(--c-gold-line); border-radius:999px; padding:3px 10px;", text });
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

async function shareGuiin(res, meName, otName) {
  toast("공유 이미지를 만드는 중…", 1200);
  const blob = await renderShareCard({
    kind: "guiin", eyebrow: "BENEFACTOR CHECK",
    title: `${otName}은(는) ${meName}에게 ‘${res.verdict}’`,
    summary: `귀인 지수 ${res.score}점. ${res.pros[0]}`,
    tags: [`귀인지수 ${res.score}`, res.verdict, `용신 ${res.yongsinKr.join("·")}`],
    profileLabel: "귀인 체크 · 참고 콘텐츠",
  });
  const shared = await shareImage(blob, { title: "귀인 체크", text: guiinText(res, meName, otName) });
  if (!shared) { downloadBlob(blob, "guiin.png"); toast("이미지를 저장했어요."); }
}

function guiinText(res, meName, otName) {
  return `[귀인 체크] ${otName}은(는) ${meName}에게 → ${res.verdict} (귀인 지수 ${res.score}점)\n\n` +
    `힘이 되는 이유:\n- ${res.pros.join("\n- ")}\n\n조심할 부분:\n- ${res.cons.join("\n- ")}\n\n${res.advice}\n\n` +
    `※ 사람을 좋고 나쁨으로 나누는 게 아니라 기운의 맞물림을 보는 참고 콘텐츠예요.`;
}
