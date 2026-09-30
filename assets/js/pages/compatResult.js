import { el, clear, toast, copyText, icon } from "../utils/dom.js";
import { unstash, saveResult, makeId } from "../state.js";
import { computeSaju } from "../saju/manse.js";
import { analyzeCompat } from "../saju/compat.js";
import { analyzeStrength } from "../saju/strength.js";
import { analyzeStart, analyzeBreakup, reunionTiming } from "../saju/relationship.js";
import { backLink, noticeBox, insight, loadDisclaimer } from "./_shared.js";
import { renderShareCard, downloadBlob, shareImage } from "../utils/shareImage.js";
import { isUnlocked, unlock, getCoins, costOf } from "../wallet.js";
export function renderCompatResult({ navigate }) {
  const input = unstash("compat:input");
  if (!input) { navigate("/compat"); return el("div"); }
  const nameA = input.a.name || "나";
  const nameB = input.b.name || "상대";
  const itemId = `compat:${input.a.birthDate || "?"}_${input.b.birthDate || "?"}`;
  const cost = costOf("compat");

  const host = el("div", {});
  function paint() {
    clear(host);
    if (!isUnlocked(itemId)) { host.append(compatLock({ navigate, nameA, nameB, cost, itemId, repaint: paint })); return; }
    const pa = computeSaju(input.a);
    const pb = computeSaju(input.b);
    const result = analyzeCompat(pa, pb, { a: nameA, b: nameB });
    const reunionSection = input.reunion && input.reunion.want
      ? reunionDeepSection({ navigate, pa, genderA: input.a.gender, reunion: input.reunion, nameA, itemId, repaint: paint })
      : null;
    host.append(buildCompatNode({ result, nameA, nameB, pa, pb, genderA: input.a.gender, genderB: input.b.gender, reunionSection }, { navigate, saved: false }));
  }
  paint();
  return host;
}

function compatLock({ navigate, nameA, nameB, cost, itemId, repaint }) {
  const wrap = el("div", {});
  wrap.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  wrap.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel report-head", style: "text-align:center;" }, [
      el("span", { class: "eyebrow", style: "justify-content:center;", text: "성향 궁합" }),
      el("h1", { class: "serif", style: "margin-top:6px;", text: `${nameA} × ${nameB}` }),
    ]),
  ]));
  const coins = getCoins();
  const box = el("div", { class: "panel premium-lock", style: "margin-top: var(--sp-4);" }, [
    el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
    el("h3", { class: "serif", style: "margin-top:10px;", text: "두 사람 궁합 열어 보기" }),
    el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "조화 강도, 잘 맞는 지점·부딪히는 지점, 합·충 궁합, 재회운까지 종합으로 풀어 드려요. 한 번 열면 저장·재열람은 무료예요." }),
  ]);
  if (coins >= cost) {
    box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
      const r = unlock(itemId, cost);
      if (r.ok) { toast(r.reason === "spent" ? "궁합을 열었어요" : "이미 열어 둔 궁합이에요."); repaint(); }
      else { toast("코인이 부족해요."); navigate("/store"); }
    } }, [el("span", { text: `코인 ${cost}개로 열기 · 보유 ${coins}개` })]));
  } else {
    box.append(el("p", { class: "muted tiny", style: "margin-top:8px;", text: `보유 코인 ${coins}개 · ${cost}개 필요해요.` }));
    box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-3);", onclick: () => navigate("/store") }, [el("span", { text: "코인 받으러 가기" })]));
  }
  wrap.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [box]));
  return wrap;
}

export function buildCompatNode(data, { navigate, saved = false, savedId = null } = {}) {
  loadDisclaimer();
  const { result, nameA, nameB, pa, genderA } = data;
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [
    backLink(navigate, saved ? "/saved" : "/", saved ? "저장함" : "홈"),
  ]));

  // 헤더 + 두 사람 일간
  root.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel report-head" }, [
      el("span", { class: "eyebrow", text: "성향 궁합 리포트" }),
      el("h1", { class: "serif", style: "margin-top:6px;", text: `${nameA} × ${nameB}` }),
      el("div", { class: "compat-pair" }, [
        person(nameA, result.dayMasters.a, result.aElemKr),
        el("span", { class: "compat-x", text: "×" }),
        person(nameB, result.dayMasters.b, result.bElemKr),
      ]),
    ]),
  ]));

  // 조화 강도
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
    el("div", { class: "panel summary-card section-gap" }, [
      el("h2", { text: result.title }),
      el("div", { class: "compat-score" }, [
        el("div", { class: "cs-track" }, [el("div", { class: "cs-fill", style: `width:${result.score}%` })]),
        el("div", { class: "cs-num" }, [el("b", { text: result.score }), el("span", { text: "%" })]),
      ]),
      el("p", { class: "tiny muted", text: "※ ‘성향 조화 강도’는 운명적 길흉이 아니라 두 성향이 얼마나 자연스럽게 맞물리는지를 나타내는 보조 수치입니다. 낮다고 나쁜 관계가 아니라 노력의 방향이 다를 뿐입니다." }),
      el("p", { class: "summary-lead", text: result.summary }),
    ]),
  ]));

  // 블록: 잘 맞는 지점 / 부딪히는 지점 / 조언
  const cards = el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-4);" }, [
    blockCard("good", "잘 맞는 지점", "heart", result.good),
    blockCard("warn", "부딪히기 쉬운 지점", "alert", result.friction),
    blockCard("action", "관계를 편하게 만드는 법", "lightbulb", result.advice),
    el("div", { class: "panel section-gap" }, [
      el("h3", { text: "오행으로 본 두 사람" }),
      el("p", { class: "muted", text: result.complement }),
      result.missing.length
        ? noticeBox("info", `두 사람 모두 ${result.missing.join(", ")} 기운이 약합니다. 이 부분은 서로 채워주기 어려우니, 관계 밖의 활동이나 습관으로 함께 보완하면 좋습니다.`)
        : null,
    ].filter(Boolean)),
  ]);
  root.append(cards);

  // 합·충 궁합
  if (result.harmony) {
    const h = result.harmony;
    root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
      el("div", { class: "panel section-gap" }, [
        el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("sparkle")]), el("span", { text: "합·충 궁합 (일간·일지)" })]),
        el("div", { class: "hap-tags" }, [
          h.ganhap ? el("span", { class: "hap-tag hap-good", text: "천간합" }) : null,
          el("span", { class: "hap-tag " + (["충", "형", "해", "자형"].includes(h.dayRel) ? "hap-warn" : "hap-good"), text: "일지 " + h.dayRel }),
          h.yearRel !== "무관" ? el("span", { class: "hap-tag", text: "띠 " + h.yearRel }) : null,
        ].filter(Boolean)),
        el("ul", {}, h.reasons.map((t) => el("li", { text: t }))),
        result.harmony ? insight(result.harmony.reunionHint) : null,
      ].filter(Boolean)),
    ]));
  }

  // 오행 궁합 + 신강·신약 궁합
  if (data.pa && data.pb) {
    root.append(el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-4);" }, [
      ohaengCompat(data.pa, data.pb, nameA, nameB),
      strengthCompat(data.pa, data.pb, nameA, nameB),
    ]));
  }

  // 재회 심화 (선택 결제) — 있으면 여기에 끼워 넣음
  if (data.reunionSection) root.append(data.reunionSection);

  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [
    noticeBox("info", "궁합 해석은 자기이해와 관계를 돌아보기 위한 참고 콘텐츠입니다. 두 사람의 관계는 사주보다 서로의 노력과 대화로 더 크게 달라집니다. 재회는 운보다 두 사람의 변화가 크게 좌우합니다."),
  ]));

  root.classList.add("has-action-bar");
  root.append(buildBar({ data, navigate, saved, savedId }));
  return root;
}

/* 재회 심화 섹션 — 별도 5코인 게이트. 사귄/헤어진 날짜의 운을 내 사주와 대조. */
function reunionDeepSection({ navigate, pa, genderA, reunion, nameA, repaint }) {
  const gender = genderA === "male" ? "male" : "female";
  const cost = costOf("reuniondeep");
  const rid = `reuniondeep:${pa && pa.solar ? `${pa.solar.Y}${pa.solar.M}${pa.solar.D}` : "?"}_${reunion.breakupDate || "?"}`;
  const sec = el("section", { class: "wrap", style: "margin-top: var(--sp-4);" });

  if (!isUnlocked(rid)) {
    const coins = getCoins();
    const box = el("div", { class: "panel premium-lock" }, [
      el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
      el("h3", { class: "serif", style: "margin-top:10px;", text: "재회 심화 — 왜 헤어졌고, 언제 다시?" }),
      el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "사귄·헤어진 날의 운을 내 사주와 대조해 만남·이별의 이유를 읽고, 앞으로 18개월 중 재회의 문이 열리는 시기를 짚어 드려요. 한 번 열면 재열람은 무료예요." }),
    ]);
    if (coins >= cost) {
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
        const r = unlock(rid, cost);
        if (r.ok) { toast("재회 심화를 열었어요"); repaint(); } else { toast("코인이 부족해요."); navigate("/store"); }
      } }, [el("span", { text: `코인 ${cost}개로 재회 시기 보기 · 보유 ${coins}개` })]));
    } else {
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => navigate("/store") }, [el("span", { text: "코인 받으러 가기" })]));
    }
    sec.append(box);
    return sec;
  }

  const now = new Date();
  const start = reunion.startDate ? analyzeStart(pa, reunion.startDate, gender) : null;
  const bd = new Date(reunion.breakupDate);
  const breakup = analyzeBreakup(pa, reunion.breakupDate, gender);
  // 재회 시기: 헤어진 달(또는 오늘 중 더 이른 미래시점)부터 18개월 스캔
  const fromY = Math.max(bd.getFullYear(), now.getFullYear());
  const fromM = fromY === now.getFullYear() ? now.getMonth() + 1 : 1;
  const timing = reunionTiming(pa, gender, fromY, fromM, 18);

  const block = (title, ic, data) => el("div", { class: "panel section-gap" }, [
    el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon(ic)]), el("span", { text: title })]),
    el("p", { class: "muted tiny", text: `${data.when} · ${data.daeunGz ? "대운 " + data.daeunGz + " · " : ""}${data.yearGZ}년운` }),
    el("ul", {}, data.reasons.map((t) => el("li", { text: t }))),
    el("p", { class: "tiny muted", style: "margin-top:6px;", text: data.note }),
  ]);

  const inner = el("div", { class: "section-gap" }, [
    el("div", { class: "panel report-head", style: "text-align:center;" }, [
      el("span", { class: "eyebrow", style: "justify-content:center;", text: "재회 심화" }),
      el("h2", { class: "serif", style: "margin-top:4px;", text: "왜 헤어졌고, 언제 다시 만날까" }),
    ]),
    start ? block("왜 사귀게 되었을까", "heart", start) : null,
    block("왜 헤어지게 되었을까", "alert", breakup),
    el("div", { class: "panel section-gap" }, [
      el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("clock")]), el("span", { text: "재회의 문이 열리는 시기" })]),
      timing.best.length
        ? el("div", { class: "reunion-windows" }, timing.best.map((w, i) => el("div", { class: "rw-item" + (i === 0 ? " rw-top" : "") }, [
            el("div", { class: "rw-when" }, [el("b", { text: w.label }), i === 0 ? el("span", { class: "dt-now", text: "가장 유리" }) : null].filter(Boolean)),
            el("p", { class: "rw-note", text: w.note }),
          ])))
        : el("p", { class: "muted", text: "앞으로 18개월은 재회를 밀어붙이기보다 스스로를 정비하기 좋은 흐름이에요." }),
      insight(timing.summary),
    ]),
    noticeBox("info", `${nameA} 기준으로 본 흐름이에요. 재회는 운보다 두 사람이 그동안 무엇을 바꿨는지가 훨씬 크게 좌우합니다. 시기는 ‘계기가 생기기 쉬운 때’일 뿐, 확정 예언이 아니에요.`),
  ].filter(Boolean));
  sec.append(inner);
  return sec;
}

/* 오행 궁합 */
const ELEM_KR2 = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
const GEN = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CTRL = { wood: "earth", fire: "metal", earth: "water", metal: "wood", water: "fire" };
function ohaengCompat(pa, pb, nameA, nameB) {
  const a = pa.dayMasterElem, b = pb.dayMasterElem;
  let tag, cls, line;
  if (a === b) { tag = "비화(比和)"; cls = "hap-good"; line = `둘 다 ${ELEM_KR2[a]} 일간이라 말이 잘 통하고 편해요. 다만 닮은 만큼 같은 약점·고집도 공유해, 한쪽이 양보하는 지혜가 필요합니다.`; }
  else if (GEN[a] === b) { tag = "상생"; cls = "hap-good"; line = `${nameA}(${ELEM_KR2[a]})이(가) ${nameB}(${ELEM_KR2[b]})을(를) 살려 주는 상생 관계예요. ${nameA}가 베풀고 ${nameB}가 힘을 받는 흐름이에요.`; }
  else if (GEN[b] === a) { tag = "상생"; cls = "hap-good"; line = `${nameB}(${ELEM_KR2[b]})이(가) ${nameA}(${ELEM_KR2[a]})을(를) 살려 주는 상생 관계예요. ${nameB}가 베풀고 ${nameA}가 힘을 받는 흐름이에요.`; }
  else if (CTRL[a] === b) { tag = "상극"; cls = "hap-warn"; line = `${nameA}(${ELEM_KR2[a]})이(가) ${nameB}(${ELEM_KR2[b]})을(를) 누르는 상극이에요. ${nameA}가 주도권을 쥐기 쉽지만, 과하면 ${nameB}가 눌려요. 존중이 관건.`; }
  else if (CTRL[b] === a) { tag = "상극"; cls = "hap-warn"; line = `${nameB}(${ELEM_KR2[b]})이(가) ${nameA}(${ELEM_KR2[a]})을(를) 누르는 상극이에요. ${nameB}가 주도하기 쉬우니, 서로의 속도를 맞추면 팽팽함이 매력이 돼요.`; }
  else { tag = "무난"; cls = ""; line = `두 오행이 직접 살리거나 누르지 않는 무난한 결이에요. 그만큼 노력한 만큼 관계가 만들어져요.`; }
  return el("div", { class: "panel section-gap" }, [
    el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("sparkle")]), el("span", { text: "오행 궁합" })]),
    el("div", { class: "hap-tags" }, [
      el("span", { class: "hap-tag", text: `${nameA} ${ELEM_KR2[a]}` }),
      el("span", { class: "hap-tag", text: `${nameB} ${ELEM_KR2[b]}` }),
      el("span", { class: "hap-tag " + cls, text: tag }),
    ]),
    el("p", { class: "muted", style: "margin-top:8px;", text: line }),
  ]);
}

/* 신강·신약 궁합 */
function strengthCompat(pa, pb, nameA, nameB) {
  const sa = analyzeStrength(pa).strength, sb = analyzeStrength(pb).strength;
  const key = [sa, sb].sort().join("+");
  let line;
  if (sa === "신강" && sb === "신강") line = "둘 다 기운이 강한 신강+신강 조합이에요. 주도권 다툼이 생기기 쉬우니, 각자의 영역을 나누면 강력한 팀이 됩니다.";
  else if (sa === "신약" && sb === "신약") line = "둘 다 신약인 조합이에요. 서로 기대며 편하지만, 힘든 순간 함께 지치기 쉬워요. 관계 밖의 활동·사람으로 에너지를 채우면 좋아요.";
  else if ((sa === "신강" && sb === "신약") || (sa === "신약" && sb === "신강")) {
    const strong = sa === "신강" ? nameA : nameB, weak = sa === "신강" ? nameB : nameA;
    line = `${strong}(신강)이(가) ${weak}(신약)을(를) 이끌고 지켜 주는 보완형이에요. ${strong}가 너무 밀어붙이지만 않으면, 안정적인 균형이 됩니다.`;
  } else line = "한쪽이 중화(균형)라 완충 역할을 해요. 큰 충돌 없이 서로의 페이스를 맞추기 좋은 조합이에요.";
  return el("div", { class: "panel section-gap" }, [
    el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("compass")]), el("span", { text: "신강·신약 궁합" })]),
    el("div", { class: "hap-tags" }, [
      el("span", { class: "hap-tag", text: `${nameA} ${sa}` }),
      el("span", { class: "hap-tag", text: `${nameB} ${sb}` }),
    ]),
    el("p", { class: "muted", style: "margin-top:8px;", text: line }),
  ]);
}

function person(name, dm, elemKr) {
  return el("div", { class: "compat-person" }, [
    el("span", { class: "cp-name", text: name }),
    el("span", { class: "cp-dm", text: dm }),
    el("span", { class: "cp-elem tiny muted", text: "일간 " + elemKr }),
  ]);
}

function blockCard(tag, label, ic, items) {
  return el("div", { class: "panel" }, [
    el("div", { class: `block tag-${tag}`, style: "border:0; background:none; padding:0;" }, [
      el("span", { class: "block-label" }, [el("span", { class: "ic" }, [icon(ic)]), el("span", { text: label })]),
      el("ul", {}, items.map((t) => el("li", { text: t }))),
    ]),
  ]);
}

function buildBar({ data, navigate, saved, savedId }) {
  const saveBtn = el("button", { class: "btn btn-primary", style: "flex:1;" },
    saved ? [icon("check"), el("span", { text: "저장됨" })] : [icon("bookmark"), el("span", { text: "결과 저장" })]);
  if (saved) saveBtn.disabled = true;
  saveBtn.addEventListener("click", () => {
    const id = savedId || makeId("compat");
    saveResult({
      id, type: "compat", title: `${data.nameA} × ${data.nameB} 궁합`, createdAt: Date.now(),
      result: data.result, nameA: data.nameA, nameB: data.nameB,
      pa: data.pa, pb: data.pb, genderA: data.genderA, genderB: data.genderB,
    });
    toast("결과를 이 브라우저에 저장했어요.");
    saveBtn.disabled = true; clear(saveBtn); saveBtn.append(icon("check"), el("span", { text: "저장됨" }));
  });
  const shareBtn = el("button", { class: "btn btn-ghost" }, [icon("share"), el("span", { text: "공유" })]);
  shareBtn.addEventListener("click", () => shareCompat(data.result, data.nameA, data.nameB));
  const copyBtn = el("button", { class: "btn btn-ghost", "aria-label": "결과 복사" }, [icon("copy")]);
  copyBtn.addEventListener("click", async () => {
    const ok = await copyText(compatText(data.result, data.nameA, data.nameB));
    toast(ok ? "결과를 복사했어요." : "복사에 실패했어요.");
  });
  return el("div", { class: "action-bar" }, [saveBtn, shareBtn, copyBtn]);
}

async function shareCompat(result, nameA, nameB) {
  toast("공유 이미지를 만드는 중…", 1200);
  const blob = await renderShareCard({
    kind: "compat", eyebrow: "COMPATIBILITY",
    title: `${nameA} × ${nameB}`,
    summary: result.summary,
    tags: [`조화 ${result.score}%`, result.aElemKr, result.bElemKr],
    profileLabel: "성향 궁합 리포트",
  });
  const shared = await shareImage(blob, { title: "성향 궁합", text: compatText(result, nameA, nameB) });
  if (!shared) { downloadBlob(blob, "compat.png"); toast("이미지를 저장했어요."); }
}

function compatText(result, nameA, nameB) {
  return `[성향 궁합] ${nameA} × ${nameB}\n${result.title} · 조화 강도 ${result.score}%\n\n${result.summary}\n\n` +
    `잘 맞는 지점:\n- ${result.good.join("\n- ")}\n\n부딪히기 쉬운 지점:\n- ${result.friction.join("\n- ")}\n\n` +
    `조언:\n- ${result.advice.join("\n- ")}\n\n※ 참고 콘텐츠이며, 관계는 서로의 노력으로 달라집니다.`;
}
