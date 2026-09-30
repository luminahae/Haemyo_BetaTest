import { el, clear, toast, validateBirthInput } from "../utils/dom.js";
import { backLink, pageHeader, noticeBox, loadDisclaimer } from "./_shared.js";
import { getMyBirth, getPeople, stash, unstash } from "../state.js";
import { computeSaju } from "../saju/manse.js";
import { zodiacFortune, starSign, biorhythm, bioSvg, charmIndex, luckyCard, charmStyle } from "../saju/extras.js";
import { isUnlocked, unlock, getCoins, costOf } from "../wallet.js";
import { pullReading, pullPair, loveCount } from "../saju/pull.js";
import { personSwitch } from "./people.js";
import { personBlock } from "./compatInput.js";
/* 공용: 로그인 없으면 안내, 코인 게이트 후 render(profile) 실행 */
function gatedPage({ navigate, id, eyebrow, title, sub, itemSuffix, buildView, backTo = "/", backLabel = "홈" }) {
  loadDisclaimer();
  const my = getMyBirth();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, backTo, backLabel)]));
  root.append(pageHeader(eyebrow, title, sub));
  if (id !== "pullpair") root.append(personSwitch(navigate));
  if (!my) {
    root.append(el("section", { class: "wrap section-gap" }, [
      noticeBox("info", "생년월일이 필요해요. 한 번 입력하면 저장됩니다."),
      el("button", { class: "btn btn-primary", onclick: () => navigate("/saju") }, [el("span", { text: "내 정보 입력하고 시작" })]),
    ]));
    return root;
  }
  const profile = computeSaju(my);
  const cost = costOf(id);
  const itemId = `${id}:${my.birthDate}${itemSuffix ? ":" + itemSuffix : ""}`;
  const host = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  root.append(host);
  function paint() {
    clear(host);
    if (!isUnlocked(itemId)) { host.append(lock()); return; }
    host.append(buildView(profile));
    host.append(noticeBox("info", "재미·참고용 콘텐츠예요. 미래를 확정하지 않아요."));
  }
  function lock() {
    const coins = getCoins();
    const box = el("div", { class: "panel premium-lock", style: "margin-top: var(--sp-4);" }, [
      el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
      el("h3", { class: "serif", style: "margin-top:10px;", text: title + " 열어 보기" }),
      el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "한 번 열면 다시 볼 땐 무료예요." }),
    ]);
    if (coins >= cost) {
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
        const r = unlock(itemId, cost); if (r.ok) { toast(`${title}을(를) 열었어요`); paint(); } else { toast("코인이 부족해요."); navigate("/store"); }
      } }, [el("span", { text: `코인 ${cost}개로 열기 · 보유 ${coins}개` })]));
    } else {
      box.append(el("p", { class: "muted tiny", style: "margin-top:8px;", text: `보유 코인 ${coins}개 · ${cost}개 필요해요.` }));
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-3);", onclick: () => navigate("/store") }, [el("span", { text: "코인 받으러 가기" })]));
    }
    return box;
  }
  paint();
  return root;
}
const block = (label, items, tag) => el("div", { class: `block tag-${tag}` }, [el("span", { class: "block-label" }, [el("span", { text: label })]), ...(Array.isArray(items) ? items : [items]).map((t) => el("p", { text: t }))]);
const ring = (score) => el("div", { class: "score-ring", style: `--deg:${Math.round(Math.max(0, Math.min(100, score)) * 3.6)}deg;` }, [el("div", { class: "score-ring-in" }, [el("span", { class: "score-n", text: String(score) }), el("span", { class: "score-u", text: "점" })])]);

/* ---- 띠 운세 ---- */
export function renderZodiac({ navigate }) {
  const d = new Date();
  return gatedPage({
    navigate, id: "zodiac", eyebrow: "띠 운세", title: "내 띠와 오늘의 띠운", sub: "태어난 해의 띠(60간지)로 보는 성향과 오늘의 흐름이에요.",
    itemSuffix: `${d.getFullYear()}${d.getMonth()}${d.getDate()}`,
    buildView: (profile) => {
      const z = zodiacFortune(profile);
      return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
        el("div", { class: "panel", style: "text-align:center;" }, [
          el("p", { class: "serif", style: "font-size:1.8rem;", text: z.name }),
          el("p", { class: "muted tiny", text: z.gapja }),
          el("p", { style: "margin-top:8px; font-weight:600;", text: z.persona }),
        ]),
        block("강점", z.strength, "good"),
        block("조심할 점", z.caution, "warn"),
        el("div", { class: "panel", style: "display:flex; gap:14px; align-items:center;" }, [
          ring(z.score),
          el("div", { style: "flex:1;" }, [
            el("p", { class: "eyebrow", text: `오늘은 ${z.todayZodiac}날 · 내 띠와 ‘${z.todayRel}’` }),
            el("p", { style: "font-weight:600; margin-top:4px;", text: z.todayLine }),
          ]),
        ]),
      ]);
    },
  });
}

/* ---- 별자리 운세 ---- */
export function renderStar({ navigate }) {
  return gatedPage({
    navigate, id: "star", eyebrow: "별자리", title: "나의 별자리", sub: "양력 생일로 보는 별자리 성향이에요.",
    buildView: (profile) => {
      const s = starSign(profile);
      return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
        el("div", { class: "panel", style: "text-align:center;" }, [
          el("p", { class: "serif", style: "font-size:1.8rem;", text: s.name }),
          el("p", { class: "muted tiny", text: s.date }),
        ]),
        block("성향", s.persona, "good"),
        block("연애 스타일", s.love, "action"),
      ]);
    },
  });
}

/* ---- 바이오리듬 ---- */
export function renderBiorhythm({ navigate }) {
  const d = new Date();
  return gatedPage({
    navigate, id: "biorhythm", eyebrow: "바이오리듬", title: "오늘의 바이오리듬", sub: "생년월일만으로 계산하는 신체·감성·지성 주기예요.",
    itemSuffix: `${d.getFullYear()}${d.getMonth()}${d.getDate()}`,
    buildView: (profile) => {
      const b = biorhythm(profile);
      const stat = (o, color) => el("div", { class: "bio-stat" }, [
        el("span", { class: "bio-dot", style: `background:${color};` }),
        el("span", { class: "bio-stat-lb muted", text: o.desc.split("·")[0] }),
        el("b", { style: `color:${color};`, text: `${o.v > 0 ? "+" : ""}${o.v}%` }),
      ]);
      return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
        el("div", { class: "panel" }, [
          el("p", { class: "muted tiny", text: `태어난 지 ${b.days.toLocaleString()}일째 · 오늘 기준 ±15일` }),
          el("div", { class: "bio-chart", html: bioSvg(b, 160) }),
          el("div", { class: "bio-stats" }, [stat(b.physical, "#ffa3b5"), stat(b.emotional, "#dcb6ff"), stat(b.intellectual, "#ffd39a")]),
          el("p", { class: "muted tiny", style: "margin-top:10px;", text: "곡선이 가운데 ‘0 선’을 지나는 날이 전환일이에요 — 그 무렵엔 컨디션이 불안정해요." }),
        ]),
        el("div", { class: "insight", text: b.tip }),
        noticeBox("info", "바이오리듬은 사주·타로·자미두수와 무관한, 20세기 초 서양에서 나온 이론이에요. 생년월일만으로 신체(23일)·감성(28일)·지성(33일) 주기를 그린 재미용 참고 자료입니다."),
      ]);
    },
  });
}

/* ---- 매력 지수 (오늘/이달) ---- */
export function renderCharm({ navigate }) {
  const d = new Date();
  return gatedPage({
    navigate, id: "charmtoday", eyebrow: "매력 지수", title: "오늘의 매력 온도", sub: "사주의 도화·표현 기운으로 보는 오늘·이달의 매력이에요.",
    itemSuffix: `${d.getFullYear()}${d.getMonth()}${d.getDate()}`,
    buildView: (profile) => {
      const t = charmIndex(profile, "today"), m = charmIndex(profile, "month");
      const card = (c) => el("div", { class: "panel", style: "display:flex; gap:16px; align-items:center;" }, [
        ring(c.score),
        el("div", { style: "flex:1;" }, [
          el("p", { class: "eyebrow", text: `${c.label} 매력 · 등급 ${c.grade}` }),
          el("p", { style: "font-weight:600; margin-top:4px;", text: c.line }),
        ]),
      ]);
      const st = charmStyle(profile);
      return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
        card(t), card(m), el("div", { class: "insight", text: t.tip }),
        el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: st.extra }),
        block("이런 말투가 매력 포인트", st.talk, "good"),
        block("추천 스타일 · 색 · 헤어 · 향", st.look, "action"),
      ]);
    },
  });
}

/* ---- 행운 카드 (오늘의 럭키 타로) ---- */
export function renderLuckyCard({ navigate }) {
  const d = new Date();
  return gatedPage({
    navigate, id: "luckycard", eyebrow: "행운 카드", title: "오늘의 행운 카드", sub: "해묘가 오늘 너를 지켜줄 카드 한 장을 골라뒀어.",
    itemSuffix: `${d.getFullYear()}${d.getMonth()}${d.getDate()}`,
    buildView: (profile) => {
      const c = luckyCard(profile);
      return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
        el("div", { class: "panel", style: "text-align:center;" }, [
          el("div", { class: "lucky-card-img", style: c.bgStyle }),
          el("p", { class: "serif", style: "font-size:1.4rem; margin-top:12px;", text: c.name }),
          el("p", { style: "font-weight:600; margin-top:6px;", text: `“${c.message}”` }),
          el("p", { class: "muted tiny", style: "margin-top:8px;", text: `오늘의 행운색 · ${c.luckyColor}` }),
        ]),
      ]);
    },
  });
}

/* 단계 패널 — 1·2·3 단계 */
function stepsPanel(title, steps) {
  return el("div", { class: "panel panel-gold section-gap" }, [
    el("p", { class: "eyebrow", text: "단계별 공략" }),
    el("h3", { class: "serif", style: "font-size:1.2rem;", text: title }),
    el("div", { class: "overall-flow" }, steps.map((t, i) => {
      const [head, ...rest] = t.split(" — ");
      return el("div", { class: "overall-step" }, [
        el("span", { class: "overall-dot", text: String(i + 1) }),
        el("p", {}, [el("b", { text: head }), document.createTextNode(rest.length ? " — " + rest.join(" — ") : "")]),
      ]);
    })),
  ]);
}

/* 받침에 따라 이/가 */
const iga = (w) => { const c = (w || "").charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? w + "이" : w + "가"; };

/* ---- 내 매력 사주 (끌림 타입 + 그 사람과 끌림 궁합) ---- */
export function renderPull({ navigate }) {
  const root = gatedPage({
    navigate, id: "pull", eyebrow: "내 매력 사주", title: "사주로 보는 내 매력", sub: "타고난 매력 포인트, 이성이 빠져드는 이유, 나다운 연애 스타일까지 해묘가 풀어 줄게.",
    buildView: (profile) => {
      const r = pullReading(profile);
      return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
        el("div", { class: "panel", style: "display:flex; gap:16px; align-items:center;" }, [
          ring(r.score),
          el("div", { style: "flex:1;" }, [
            el("p", { class: "eyebrow", text: `일간 ${r.stemKr} · 빠져드는 지수` }),
            el("p", { class: "serif", style: "font-size:1.35rem; margin-top:4px;", text: r.type.name }),
            el("p", { class: "muted tiny", style: "margin-top:4px;", text: `등급: ${r.grade}${r.badges.length ? " · " + r.badges.join("·") : ""}` }),
          ]),
        ]),
        el("div", { class: "insight", text: r.type.hook }),
        block("상대가 빠져드는 포인트", r.type.points, "good"),
        block("사주 속 끌림의 비밀", r.secret, "action"),
        block(`연애 반전 스타일 · ${r.style.title}`, r.style.line, "good"),
        block("특히 깊게 빠지는 사람", r.type.weak, "action"),
        (() => { const g = getMyBirth().gender === "male" ? "male" : "female"; const c = loveCount(profile, g); return block(`사주로 보는 내 연애 횟수 · ${c.label}`, [c.line, ...c.why], "good"); })(),
        block("자꾸 생각나게 만드는 법", r.moves, "good"),
        block("매력이 식는 순간", r.type.fade, "warn"),
        noticeBox("info", r.healthy),
      ]);
    },
  });
  if (getMyBirth()) root.append(pairForm(navigate));
  return root;
}

/* 그 사람 정보 입력 */
function pairForm(navigate) {
  const prev = unstash("pull:partner") || {};
  const sec = el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-6, 40px);" });
  sec.append(el("div", { class: "panel panel-gold" }, [
    el("p", { class: "eyebrow", text: "그 사람과 끌림 궁합" }),
    el("h2", { class: "serif", style: "margin-top:6px;", text: "그 사람도 넣어 볼래?" }),
    el("p", { class: "muted", style: "font-size:var(--fs-sm); margin-top:6px;", text: "내 사주와 그 사람 사주를 함께 보고, 그 사람이 나에게 빠질 이유와 그 사람에게 맞는 다가가는 법을 알려 줄게." }),
  ]));

  let blockRef = personBlock("pp", "그 사람", prev);
  const blockHost = el("div", {}, [blockRef.node]);

  const people = getPeople().filter((p) => p.input && p.input.birthDate);
  if (people.length) {
    const sel = el("select", { class: "select", "aria-label": "내 사람에서 불러오기" }, [
      el("option", { value: "", text: "내 사람에서 불러오기…" }),
      ...people.map((p) => el("option", { value: p.id, text: `${p.name} · ${p.input.birthDate}` })),
    ]);
    sel.addEventListener("change", () => {
      const p = people.find((x) => x.id === sel.value); if (!p) return;
      blockRef = personBlock("pp", "그 사람", Object.assign({ name: p.name }, p.input));
      blockHost.replaceChildren(blockRef.node);
    });
    sec.append(el("div", { class: "field" }, [sel]));
  }
  sec.append(blockHost);

  const err = el("p", { class: "field-error", style: "text-align:center;", "aria-live": "polite" });
  const go = el("button", { class: "btn btn-primary btn-block" }, [el("span", { text: `그 사람과 끌림 궁합 보기 · 코인 ${costOf("pullpair")}개` })]);
  go.addEventListener("click", () => {
    const input = blockRef.collect();
    const v = validateBirthInput(input);
    blockRef.showErrors(v.errors);
    if (!v.ok) { err.textContent = "그 사람의 생년월일과 성별을 입력해 주세요."; return; }
    err.textContent = "";
    stash("pull:partner", input);
    navigate("/pull/pair");
  });
  sec.append(noticeBox("privacy", "입력한 정보는 서버로 보내지 않고 이 브라우저 안에서만 계산해요."), err, go);
  return sec;
}

/* 두 사람 결과 */
export function renderPullPair({ navigate }) {
  const partner = unstash("pull:partner");
  if (!partner) { navigate("/pull"); return el("div"); }
  const who = partner.name || "그 사람";
  const root = gatedPage({
    navigate, id: "pullpair", eyebrow: "그 사람과 끌림 궁합", title: `${iga(who)} 나에게 빠지는 법`,
    sub: "두 사람의 사주로 본 끌림의 이유와, 그 사람에게 맞는 다가가는 법이에요.", backTo: "/pull", backLabel: "내 매력 사주",
    itemSuffix: `${partner.birthDate}_${partner.birthTime || "x"}_${partner.gender}`,
    buildView: (profile) => {
      const you = computeSaju(partner);
      const r = pullPair(profile, you, partner);
      return el("div", { class: "section-gap", style: "margin-top: var(--sp-4);" }, [
        el("div", { class: "panel", style: "display:flex; gap:16px; align-items:center;" }, [
          ring(r.score),
          el("div", { style: "flex:1;" }, [
            el("p", { class: "eyebrow", text: `나 ${r.myElemKr} × ${r.yName} ${r.yElemKr}` }),
            el("p", { class: "serif", style: "font-size:1.3rem; margin-top:4px;", text: r.grade }),
            el("p", { class: "muted tiny", style: "margin-top:4px;", text: "빠져들 가능성 지수" }),
          ]),
        ]),
        el("div", { class: "insight", text: r.core }),
        stepsPanel(`${iga(r.yName)} 나에게 푹 빠지게 만드는 법`, r.steps),
        block("두 사람 맞춤 공략", r.custom, "action"),
        block("타이밍", r.timingLine, "good"),
        block(`${r.yName}의 사주 속 이상형 · ${r.ideal.elemKr}`, [r.ideal.line, r.ideal.look, `나와의 일치도: ${r.ideal.match}`, r.ideal.tip], "action"),
        block(`${r.yName}의 연애 횟수 · ${r.yCount.label}`, [r.yCount.line, ...r.yCount.why], "good"),
        block(`${iga(r.yName)} 당신에게 빠지는 이유`, r.reasons, "good"),
        block("두 사람의 기운 흐름", r.flow, "action"),
        block(`${r.yName}의 연애 스타일 · ${r.style.title}`, r.style.line, "good"),
        block("평소에 이렇게 해 주세요", r.doList, "good"),
        block("이것만은 피하세요", r.avoidList, "warn"),
        r.cautions.length ? block("두 사람이 조심할 점", r.cautions, "warn") : null,
        noticeBox("info", r.healthy),
      ].filter(Boolean));
    },
  });
  return root;
}
