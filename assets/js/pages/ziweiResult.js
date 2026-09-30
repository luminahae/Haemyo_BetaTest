import { el, clear, toast, copyText, icon } from "../utils/dom.js";
import { unstash, saveResult, makeId } from "../state.js";
import { computeZiwei, STAR_MEANING, PALACE_MEANING, BUREAU_DESC } from "../saju/ziwei.js";
import { analyzeZiweiDeep, STAR_DEEP, AUX_DEEP } from "../saju/ziweiAnalysis.js";
import { backLink, noticeBox, loadDisclaimer } from "./_shared.js";
import { renderShareCard, downloadBlob, shareImage, maskedProfileLabel } from "../utils/shareImage.js";
import { isUnlocked, unlock, getCoins, chartItemId, costOf } from "../wallet.js";
const MAIN_STARS = new Set(["자미", "천기", "태양", "무곡", "천동", "염정", "천부", "태음", "탐랑", "거문", "천상", "천량", "칠살", "파군"]);
const SIHUA_TIP = {
  록: "화록 — 재물·인연·복이 붙는 자리",
  권: "화권 — 권력·추진력·성취가 강해지는 자리",
  과: "화과 — 명예·시험·평판이 오르는 자리",
  기: "화기 — 집착·과제·장애가 생겨 균형이 필요한 자리",
};
// 별 이름 → 마우스오버 한 줄 뜻 (주성은 태그+성향, 보조성은 AUX_DEEP)
function starTip(name) {
  const m = STAR_MEANING[name];
  if (m) return `${m.tag} — ${m.persona}`;
  return AUX_DEEP[name] || name;
}
// 지지 index → 명반 그리드 [row, col]
const BRANCH_POS = { 5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4], 9: [2, 4], 10: [3, 4], 11: [4, 4], 0: [4, 3], 1: [4, 2], 2: [4, 1], 3: [3, 1], 4: [2, 1] };
const BRANCH_IDX = { 자: 0, 축: 1, 인: 2, 묘: 3, 진: 4, 사: 5, 오: 6, 미: 7, 신: 8, 유: 9, 술: 10, 해: 11 };

export function renderZiweiResult({ navigate }) {
  const input = unstash("ziwei:input") || unstash("saju:input");
  if (!input) { navigate("/ziwei"); return el("div"); }
  const z = computeZiwei(input);
  return buildZiweiNode({ z, input }, { navigate, saved: false });
}

export function buildZiweiNode(data, { navigate, saved = false, savedId = null } = {}) {
  loadDisclaimer();
  const { z, input } = data;
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [
    backLink(navigate, saved ? "/saved" : "/", saved ? "저장함" : "홈"),
  ]));

  // 헤더
  root.append(el("section", { class: "wrap" }, [
    el("div", { class: "panel report-head" }, [
      el("span", { class: "eyebrow", text: "자미두수 명반" }),
      el("h1", { class: "serif", style: "margin-top:6px;", text: (input.name ? input.name + "님의 " : "") + "명반(命盤)" }),
      el("div", { class: "report-meta" }, [
        meta("년간지", z.yearGZH),
        meta("명궁", z.mingBranch + "궁"),
        meta("신궁", z.shenBranch + "궁"),
        meta("오행국", z.bureauName),
      ]),
    ]),
  ]));

  if (z.timeUnknown) {
    root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
      noticeBox("warn", "출생 시간을 몰라 午시(정오)로 가정했습니다. 자미두수는 시(時)로 명궁·신궁·문창·문곡이 정해지므로, 시간을 모르면 명반이 크게 달라질 수 있습니다. 참고로만 봐 주세요.", "clock"),
    ]));
  }

  // 명반 차트
  root.append(el("section", { class: "wrap wrap-wide", style: "margin-top: var(--sp-4);" }, [chart(z)]));

  // 명궁 해석 (요약)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [mingReading(z)]));

  // 전문 심화 해석 (8단계) — 코인 언락
  const deepHost = el("section", { class: "wrap", style: "margin-top: var(--sp-4);" });
  const deepId = chartItemId("ziwei-deep", input);
  const paintDeep = () => { clear(deepHost); deepHost.append(deepSection(z, { itemId: deepId, navigate, repaint: paintDeep })); };
  paintDeep();
  root.append(deepHost);

  // 12궁 요약
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [palaceList(z)]));

  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [
    noticeBox("info", "자미두수 명반은 표준 안성법으로 계산했습니다. 해석은 명궁 주성 중심의 성향 참고 자료이며, 미래를 확정하지 않습니다. 중요한 결정은 실제 정보와 함께 검토하세요."),
  ]));

  root.classList.add("has-action-bar");
  root.append(buildBar({ z, input, navigate, saved, savedId }));
  return root;
}

/* ---- 명반 차트 ---- */
function chart(z) {
  const grid = el("div", { class: "ziwei-chart", role: "table", "aria-label": "자미두수 명반" });
  z.palaces.forEach((p) => {
    const [r, c] = BRANCH_POS[BRANCH_IDX[p.branch]];
    const cell = el("div", {
      class: "zw-cell" + (p.isMing ? " zw-ming" : ""),
      style: `grid-row:${r}; grid-column:${c};`, role: "cell",
      "aria-label": `${p.name} ${p.branch}궁 ${p.stars.map((s) => s.name).join(" ") || "공궁"}`,
    }, [
      el("div", { class: "zw-stars" }, p.stars.length
        ? p.stars.map((s) => el("span", {
            class: "zw-star zw-tip" + (MAIN_STARS.has(s.name) ? " zw-main" : " zw-aux") + (s.sihua ? " zw-hua" : ""),
            title: starTip(s.name) + (s.sihua ? ` · ${s.sihua} — ${SIHUA_TIP[s.sihua[1]] || ""}` : ""), tabindex: "0",
          }, [el("span", { text: s.name }), s.sihua ? el("sup", { class: "zw-hua-badge", text: s.sihua[1] }) : null].filter(Boolean)))
        : [el("span", { class: "zw-empty", text: "공궁" })]),
      el("div", { class: "zw-foot" }, [
        el("span", { class: "zw-name zw-tip", title: PALACE_MEANING[p.name] || p.name, tabindex: "0", text: p.name }),
        el("span", { class: "zw-branch", text: p.branchH }),
      ]),
      (p.isMing || p.isShen) ? el("span", { class: "zw-mark", text: p.isMing ? "命" : "身" }) : null,
    ].filter(Boolean));
    grid.append(cell);
  });
  // 중앙 정보
  grid.append(el("div", { class: "zw-center", style: "grid-row:2/4; grid-column:2/4;" }, [
    el("span", { class: "eyebrow", text: "命盤" }),
    el("p", { class: "zwc-line", html: `<b>${z.yearGZH}</b>년생` }),
    el("p", { class: "zwc-line", text: `${z.bureauName}` }),
    el("p", { class: "zwc-line muted tiny", text: `명궁 ${z.mingBranch} · 신궁 ${z.shenBranch}` }),
    el("p", { class: "zwc-line muted tiny", text: `음력 ${z.lunar.year}.${z.lunar.month}.${z.lunar.day}${z.lunar.isLeap ? "(윤)" : ""}` }),
  ]));
  return el("div", { class: "panel", style: "padding: var(--sp-3);" }, [grid]);
}

/* ---- 명궁 해석 ---- */
function mingReading(z) {
  const stars = z.mingStars.filter((s) => MAIN_STARS.has(s));
  const empty = stars.length === 0;
  const useStars = empty ? z.oppStars.filter((s) => MAIN_STARS.has(s)) : stars;

  const cards = useStars.map((name) => {
    const m = STAR_MEANING[name];
    if (!m) return null;
    return el("div", { class: "panel section-gap star-card" }, [
      el("div", { style: "display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;" }, [
        el("h3", { text: name }), el("span", { class: "tiny gold", text: m.tag }),
      ]),
      block("summary", "성향", "compass", m.persona),
      block("good", "강점", "check", m.strength),
      block("warn", "과할 때·그림자", "alert", m.shadow),
      block("action", "현실적인 조언", "lightbulb", m.advice),
    ]);
  }).filter(Boolean);

  return el("div", {}, [
    el("h2", { class: "serif", style: "margin-bottom: var(--sp-3);", text: `명궁 해석 — ${z.mingBranch}궁` }),
    empty ? noticeBox("info", "명궁에 주성이 없는 ‘공궁(空宮)’입니다. 이 경우 맞은편 천이궁의 별(대궁 차성)을 빌려 성향을 봅니다. 공궁은 그만큼 환경·관계의 영향을 크게 받는다는 뜻이기도 합니다.") : null,
    el("p", { class: "muted", style: "margin-bottom: var(--sp-3);", text: BUREAU_DESC[z.bureau] }),
    ...cards,
  ].filter(Boolean));
}

function starList(p) {
  if (!p) return "공궁";
  const m = p.stars.filter((s) => MAIN_STARS.has(s.name)).map((s) => s.name);
  return m.length ? m.join("·") : "공궁";
}

/* ---- 전문 심화 해석 (8단계 + 최종 요약) ---- */
function deepSection(z, ctx = {}) {
  const a = analyzeZiweiDeep(z);
  const stepH = (n, title) => el("h4", { class: "flow-h step-h" }, [el("span", { class: "step-n", text: n }), el("span", { text: title })]);
  const jobChips = (list) => el("div", { class: "job-chips" }, list.map((j) => el("span", { class: "job-chip", text: j })));
  const abcd = (icon2, label, text) => el("div", { class: "abcd" }, [el("span", { class: "abcd-l", text: label }), el("span", { class: "abcd-t", text })]);

  const body = el("div", { class: "rc-body section-gap" });

  // STEP 1 — 각 궁 주성 (명궁 중심, ①②③④)
  body.append(stepH("1", `주성 해석 — 명궁(${z.mingBranch}궁)${a.empty ? " · 공궁 → 대궁 차성" : ""}`));
  a.useMing.forEach((s) => {
    const d = STAR_DEEP[s.name];
    if (!d) return;
    body.append(el("div", { class: "panel deep-star" }, [
      el("div", { style: "display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;" }, [
        el("h3", { text: s.name }), s.sihua ? el("span", { class: "tiny gold", text: s.sihua }) : null,
      ].filter(Boolean)),
      abcd("", "① 전통", d.trad),
      abcd("", "② 현대", d.modern),
      abcd("", "③ 사례", d.example),
      abcd("", "④ 주의", d.caution),
      jobChips(d.jobs),
    ]));
  });
  // 삼방 궁 주성 요약
  body.append(el("p", { class: "muted", style: "font-size:var(--fs-sm);" }, [
    el("b", { text: "삼방 요약 — " }),
    document.createTextNode(`재백궁 ${starList(a.wealth)} · 관록궁 ${starList(a.career)} · 부처궁 ${starList(a.spouse)}`),
  ]));

  // STEP 2 — 보조성
  const auxAll = [];
  [a.ming, a.wealth, a.career, a.travel].forEach((p) => (p ? p.stars : []).forEach((s) => {
    if (AUX_DEEP[s.name] && !auxAll.find((x) => x.name === s.name)) auxAll.push(s);
  }));
  body.append(stepH("2", "보조성의 영향"));
  body.append(auxAll.length
    ? el("ul", {}, auxAll.map((s) => el("li", {}, [el("b", { text: s.name + " — " }), document.createTextNode(AUX_DEEP[s.name])])))
    : el("p", { class: "muted", text: "명궁·삼방에 두드러진 보조성이 없습니다. 주성의 기운이 비교적 순수하게 드러납니다." }));

  // STEP 3 — 생년사화
  body.append(stepH("3", "생년사화(祿·權·科·忌)의 영향"));
  body.append(el("div", { class: "section-gap" }, a.sihuaHits.map((h) =>
    el("div", { class: "block tag-" + (h.label.includes("忌") ? "warn" : "good") }, [
      el("span", { class: "block-label" }, [el("span", { text: `${h.label} · ${h.star} (${h.palace})` })]),
      el("p", { text: h.effect }),
    ]))));

  // STEP 4 — 삼방사정
  body.append(stepH("4", "삼방사정(三方四正) 종합"));
  body.append(el("p", {}, [
    document.createTextNode(`명궁이 재백·관록·천이궁과 함께 이루는 핵심 축입니다. 이 네 궁의 주성 — `),
    el("b", { text: a.trineStars.join(", ") || "공궁 중심" }),
    document.createTextNode(` — 이 인생의 큰 흐름을 만듭니다. 명궁만이 아니라 이 세 궁을 함께 봐야 성패의 방향이 보입니다.`),
  ]));

  // STEP 5 — 대궁 충돌
  body.append(stepH("5", "대궁(천이궁) 충돌 여부"));
  body.append(el("p", {}, [
    document.createTextNode(`명궁의 대궁은 천이궁(${a.travel ? a.travel.branch : "-"}궁, ${a.daegung.stars.join("·") || "공궁"})입니다. `),
    document.createTextNode(
      a.daegung.hasKi ? "화기가 대궁에 있어 밖에서의 견제·환경 변화가 잦습니다. 안에서 중심을 잡는 게 중요합니다."
      : a.daegung.hasSha ? "살성이 대궁에 있어 경쟁·자극이 밖에서 들어옵니다. 부딪힘을 전문성으로 승화하면 좋습니다."
      : a.daegung.lucky.length ? `길성(${a.daegung.lucky.join("·")})이 대궁에 있어 밖에서 귀인·기회가 따릅니다.`
      : "큰 충 없이 무난합니다. 바깥 환경보다 스스로의 방향 설정이 관건입니다."),
  ]));

  // STEP 6 — 격국
  body.append(stepH("6", "격국(格局) 판단"));
  body.append(el("div", { class: "panel panel-gold section-gap" }, [
    el("h3", { class: "gold", text: a.gekguk.name }),
    abcd("", "① 전통", a.gekguk.trad),
    abcd("", "② 현대", a.gekguk.modern),
    abcd("", "④ 주의", a.gekguk.caution),
    jobChips(a.gekguk.jobs),
  ]));

  // STEP 7 — 좋은/나쁜 조합
  body.append(stepH("7", "좋은 조합 · 나쁜 조합"));
  body.append(el("div", { class: "grid-2" }, [
    el("div", { class: "block tag-good" }, [el("span", { class: "block-label" }, [el("span", { class: "ic" }, [icon("check")]), el("span", { text: "좋은 조합" })]), el("ul", {}, a.good.map((t) => el("li", { text: t })))]),
    el("div", { class: "block tag-warn" }, [el("span", { class: "block-label" }, [el("span", { class: "ic" }, [icon("alert")]), el("span", { text: "주의할 조합" })]), el("ul", {}, a.bad.map((t) => el("li", { text: t })))]),
  ]));

  // STEP 8 — 현대적 해석
  body.append(stepH("8", "현대적 해석 — 잘 맞는 길"));
  body.append(el("p", { class: "muted", text: "위 주성·격국을 현대 직업으로 연결하면, 특히 다음 영역에서 강점이 발휘되기 쉽습니다." }));
  body.append(jobChips(a.jobs));

  // 최종 요약
  body.append(el("hr", { class: "divider" }));
  body.append(el("h3", { class: "serif", text: "총평 요약" }));
  const S = a.summary;
  const dl = el("dl", { class: "summary-dl" });
  [["성격", S.성격], ["연애", S.연애], ["결혼", S.결혼], ["직업", S.직업], ["재물", S.재물], ["성공 가능성", S.성공], ["인생 조언", S.조언]]
    .forEach(([k, v]) => { dl.append(el("dt", { text: k }), el("dd", { text: v })); });
  body.append(dl);

  // 코인 게이팅 — 무료는 STEP 1 첫 주성까지 맛보기, 나머지는 코인으로 언락
  const unlocked = ctx.itemId ? isUnlocked(ctx.itemId) : true;
  if (!unlocked) {
    const kids = [...body.children];
    kids.slice(2).forEach((n) => n.remove());   // 헤더 + 첫 주성만 남김
    const last = body.querySelector(".deep-star");
    if (last) last.classList.add("locked-fade");
    body.append(coinLock(ctx));
  }

  const details = el("details", { class: "panel report-card", open: true, id: "sec-ziwei-deep" });
  details.append(
    el("summary", {}, [
      el("span", { class: "rc-index" }, [icon("compass")]),
      el("span", { class: "rc-title" }, [
        document.createTextNode("전문 심화 해석"),
        el("span", { class: "rc-sub", text: unlocked ? "8단계 · 삼방사정·격국·현대 직업·총평 요약" : `8단계 심화 · 코인 ${costOf("ziwei-deep")}개` }),
      ]),
      el("span", { class: "rc-chevron" }, [icon("chevronDown")]),
    ]),
    body
  );
  return details;
}

function coinLock(ctx) {
  const coins = getCoins();
  const cost = costOf("ziwei-deep");
  const box = el("div", { class: "panel premium-lock" }, [
    el("span", { class: "lock-badge" }, [icon("sparkle"), el("span", { text: `🪙 코인 ${cost}개` })]),
    el("h3", { style: "margin-top:8px;", text: "8단계 완전 심화 열기" }),
    el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "각 궁 주성의 전통·현대·사례·주의, 격국 판정, 삼방사정, 사화 효과, 총평 요약까지 전부 펼쳐 봐요. 한 번 열면 다시 볼 땐 무료예요." }),
  ]);
  if (coins >= cost) {
    const btn = el("button", { class: "btn btn-primary", style: "margin-top: var(--sp-4);" },
      [icon("sparkle"), el("span", { text: `코인 ${cost}개로 열기 (보유 ${coins}개)` })]);
    btn.addEventListener("click", () => {
      const r = unlock(ctx.itemId, cost);
      if (r.ok) { toast(r.reason === "spent" ? `코인 ${cost}개로 심화를 열었어요! 🪙` : "이미 열어 둔 해석이에요."); ctx.repaint && ctx.repaint(); }
      else { toast("코인이 부족해요. 충전소로 이동할게요."); ctx.navigate && ctx.navigate("/store"); }
    });
    box.append(btn);
  } else {
    box.append(el("p", { class: "muted tiny", style: "margin-top:6px;", text: "보유 코인이 없어요. 출석 체크로 무료 코인을 받거나 충전할 수 있어요." }));
    box.append(el("a", { href: "#/store", class: "btn btn-primary", style: "margin-top: var(--sp-3);" },
      [el("span", { class: "coin-emoji", text: "🪙" }), el("span", { text: "코인 받으러 가기" })]));
  }
  return box;
}

function palaceList(z) {
  return el("details", { class: "panel report-card" }, [
    el("summary", {}, [
      el("span", { class: "rc-index" }, [icon("saju")]),
      el("span", { class: "rc-title" }, [document.createTextNode("12궁 한눈에 보기"), el("span", { class: "rc-sub", text: "각 궁의 주성과 의미" })]),
      el("span", { class: "rc-chevron" }, [icon("chevronDown")]),
    ]),
    el("div", { class: "rc-body" }, z.palaces.slice().sort((a, b) => nameOrder(a.name) - nameOrder(b.name)).map((p) =>
      el("div", { class: "block", style: "border-top:1px solid var(--c-line); padding:10px 0;" }, [
        el("p", {}, [
          el("b", { text: p.name }),
          el("span", { class: "tiny muted", text: ` · ${p.branch}궁` }),
          p.isMing ? el("span", { class: "tiny gold", text: " ★명궁" }) : null,
          p.isShen ? el("span", { class: "tiny gold", text: " ☆신궁" }) : null,
        ].filter(Boolean)),
        el("p", { class: "tiny muted", text: PALACE_MEANING[p.name] || "" }),
        el("p", { style: "font-size:var(--fs-sm);", text: p.stars.map((s) => s.name + (s.sihua ? `(${s.sihua[1]})` : "")).join(" · ") || "공궁" }),
      ])
    )),
  ]);
}
const NAME_ORDER = ["명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁", "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁"];
const nameOrder = (n) => NAME_ORDER.indexOf(n);

function block(tag, label, ic, text) {
  return el("div", { class: `block tag-${tag}` }, [
    el("span", { class: "block-label" }, [el("span", { class: "ic" }, [icon(ic)]), el("span", { text: label })]),
    el("p", { text }),
  ]);
}
function meta(k, v) { return el("span", {}, [document.createTextNode(k + " "), el("b", { text: v })]); }

/* ---- 액션바 ---- */
function buildBar({ z, input, navigate, saved, savedId }) {
  const saveBtn = el("button", { class: "btn btn-primary", style: "flex:1;" },
    saved ? [icon("check"), el("span", { text: "저장됨" })] : [icon("bookmark"), el("span", { text: "결과 저장" })]);
  if (saved) saveBtn.disabled = true;
  saveBtn.addEventListener("click", () => {
    const id = savedId || makeId("ziwei");
    saveResult({ id, type: "ziwei", title: (input.name ? input.name + "님 · " : "") + "자미두수 명반", createdAt: Date.now(), z, input });
    toast("결과를 이 브라우저에 저장했어요.");
    saveBtn.disabled = true; clear(saveBtn); saveBtn.append(icon("check"), el("span", { text: "저장됨" }));
  });
  const shareBtn = el("button", { class: "btn btn-ghost" }, [icon("share"), el("span", { text: "공유" })]);
  shareBtn.addEventListener("click", () => shareZiwei(z, input));
  const copyBtn = el("button", { class: "btn btn-ghost", "aria-label": "결과 복사" }, [icon("copy")]);
  copyBtn.addEventListener("click", async () => {
    const ok = await copyText(ziweiText(z, input));
    toast(ok ? "결과를 복사했어요." : "복사에 실패했어요.");
  });
  return el("div", { class: "action-bar" }, [saveBtn, shareBtn, copyBtn]);
}

async function shareZiwei(z, input) {
  toast("공유 이미지를 만드는 중…", 1200);
  const stars = (z.mingStars.length ? z.mingStars : z.oppStars).filter((s) => MAIN_STARS.has(s));
  const blob = await renderShareCard({
    kind: "ziwei", eyebrow: "ZIWEI DOUSHU",
    title: (input.name ? input.name + "님의 " : "") + "자미두수 명반",
    summary: `명궁 ${z.mingBranch}궁 · ${z.bureauName}. 명궁 주성 ${stars.join(", ") || "공궁"}.`,
    tags: [z.bureauName.split("(")[0], ...stars.slice(0, 2)],
    profileLabel: maskedProfileLabel({ nickname: input.name, birthYear: (input.birthDate || "").slice(0, 4), timeUnknown: input.timeUnknown }),
  });
  const shared = await shareImage(blob, { title: "자미두수 명반", text: ziweiText(z, input) });
  if (!shared) { downloadBlob(blob, "ziwei.png"); toast("이미지를 저장했어요."); }
}

function ziweiText(z, input) {
  const stars = (z.mingStars.length ? z.mingStars : z.oppStars).filter((s) => MAIN_STARS.has(s));
  return `[자미두수 명반] ${input.name ? input.name + "님 · " : ""}${z.yearGZ}년생\n명궁 ${z.mingBranch}궁 · ${z.bureauName} · 명궁 주성 ${stars.join(", ") || "공궁"}\n사화: ${z.sihua.map((s) => s.label + " " + s.star).join(" / ")}\n\n※ 표준 안성법으로 계산한 참고 자료입니다. 미래를 확정하지 않습니다.`;
}
