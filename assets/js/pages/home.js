import { el, icon } from "../utils/dom.js";
import { getRecent, getMyBirth, stash } from "../state.js";
import { recentCard } from "./_shared.js";
import { getCoins, checkInStatus } from "../wallet.js";
import { computeSaju } from "../saju/manse.js";
import { biorhythm, bioSvg } from "../saju/extras.js";
import { sijinLabel } from "./manseView.js";
/* 기능 타일 — 아이콘/이모지 없이 색면 + 세리프 타이포 */
const FEATURES = [
  { id: "saju", name: "사주 리포트", blurb: "실제 만세력 명식·성향", tint: "rgba(255,196,214,.26)", accent: "#ffbfd2", to: "/saju", myShortcut: "saju" },
  { id: "ziwei", name: "자미두수", blurb: "12궁 14주성 명반", tint: "rgba(224,196,246,.26)", accent: "#d9c4f2", to: "/ziwei", myShortcut: "ziwei" },
  { id: "tarot", name: "타로", blurb: "고양이 카드 · 78장 덱", tint: "rgba(255,214,190,.26)", accent: "#ffd0b0", to: "/tarot" },
  { id: "compat", name: "궁합", blurb: "두 사람 성향의 맞물림", tint: "rgba(255,224,180,.26)", accent: "#ffdca6", to: "/compat" },
  { id: "pull", name: "내 매력 사주", blurb: "이성이 빠져드는 나의 매력 포인트", tint: "rgba(255,190,210,.30)", accent: "#ffa8c4", to: "/pull" },
  { id: "inyeon", name: "나의 인연 알아보기", blurb: "이상형·초상화·바람기 지수", tint: "rgba(255,196,214,.30)", accent: "#ffb3c8", to: "/inyeon" },
  { id: "explore", name: "테마 운세", blurb: "애정운·솔로·썸·결혼·재물 주제별로", tint: "rgba(214,226,255,.26)", accent: "#cdd8ff", to: "/explore" },
  { id: "gwansang", name: "관상", blurb: "얼굴로 보는 성향", tint: "rgba(196,232,220,.26)", accent: "#c4e8dc", to: "/gwansang" },
  { id: "tojeong", name: "토정비결", blurb: "올해의 운세 흐름", tint: "rgba(214,222,236,.26)", accent: "#cdd6ec", to: "/tojeong", myShortcut: "tojeong" },
  { id: "zodiac", name: "띠 운세", blurb: "60간지·오늘의 띠운", tint: "rgba(255,224,180,.26)", accent: "#ffdca6", to: "/zodiac" },
  { id: "star", name: "별자리", blurb: "생일로 보는 별자리", tint: "rgba(214,226,255,.26)", accent: "#cdd8ff", to: "/star" },
  { id: "biorhythm", name: "바이오리듬", blurb: "신체·감성·지성 주기", tint: "rgba(255,196,214,.26)", accent: "#ffbfd2", to: "/biorhythm" },
  { id: "dream", name: "꿈해몽", blurb: "무슨 꿈 꿨어?", tint: "rgba(214,222,236,.26)", accent: "#cdd6ec", to: "/dream" },
  { id: "charm", name: "매력 지수", blurb: "오늘·이달의 매력 온도", tint: "rgba(255,196,214,.26)", accent: "#ffbfd2", to: "/charm" },
  { id: "luckycard", name: "행운 카드", blurb: "오늘의 럭키 타로 한 장", tint: "rgba(255,224,180,.26)", accent: "#ffdca6", to: "/luckycard" },
];

export function renderHome({ navigate }) {
  const my = getMyBirth();
  const root = el("div", {});

  // 해묘 히어로 — "오늘, 무슨 일이 묘해?"
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-3);" }, [haemyoHero(navigate)]));

  // 만세력 바로 보기 (내 정보 입력 전에도)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
    wideCard({ name: "📚 사주 공부방", blurb: "만세력 보는 법·대운 원리·합형충파해·용어 사전·60일주까지 한글로 쉽게", accent: "#d9c4f2", onClick: () => navigate("/study") }),
  ]));
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-3);" }, [
    wideCard({ name: "📜 만세력 보기", blurb: my ? "생년월일만 넣으면 사주 명식을 바로 · 저장 없이도 OK" : "내 정보 입력 전에도 생년월일만 넣으면 바로 사주 명식 확인", accent: "#ffc3d1", onClick: () => navigate("/manse") }),
  ]));

  // 출석 무료코인 미니 배너
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [coinEventBanner(navigate)]));

  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-3);" }, [
    wideCard({ name: "후기 남기고 코인 10개 받기", blurb: "해묘를 이용한 느낌을 들려주고 다른 후기도 확인해요", accent: "#c9a6e6", onClick: () => navigate("/reviews") }),
  ]));

  // 저장된 내 정보 → 바로 보기
  if (my) root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [myShortcutRow(navigate, my)]));

  // 주요 기능 그리드
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [
    sectionTitle("무엇이 묘해?", "해묘가 풀어줄게"),
    el("div", { class: "feature-grid" }, FEATURES.map((f) => featureTile(f, navigate, my))),
  ]));

  // 운세 카탈로그 (와이드)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
    wideCard({
      name: "내 사람들 · 귀인 체크", blurb: "친구·연인을 저장하고, 나에게 귀인인지 확인", accent: "#d9c4f2",
      onClick: () => navigate("/people"),
    }),
  ]));

  // 바이오리듬 위젯 (홈에 바로 보이게)
  if (my) root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [bioWidget(navigate, my)]));

  // 해묘의 오늘 추천 (큐레이션 리스트)
  if (my) root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [recoList(navigate)]));

  // 오늘의 타로 (피처 카드)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-5);" }, [todayTarot(navigate)]));

  // 쓸데없는 고민 오라클 (와이드)
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-4);" }, [
    wideCard({ name: "쓸데없는 고민, 물어봐", blurb: "라면 먹을까 말까? 고양이 카드 한 장으로 예·아니오·글쎄", accent: "#ffd0b0", onClick: () => navigate("/oracle") }),
  ]));

  // 최근 본 결과
  const recent = getRecent(3);
  if (recent.length) {
    root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-6);" }, [
      el("div", { style: "display:flex; align-items:center; justify-content:space-between;" }, [
        el("h2", { style: "font-size:1.1rem;", text: "최근 본 결과" }),
        el("a", { href: "#/saved", class: "btn btn-quiet btn-sm", text: "저장함" }),
      ]),
      el("div", { class: "section-gap", style: "margin-top: var(--sp-3);" }, recent.map((r) => recentCard(r, navigate))),
    ]));
  }

  // 원칙 안내
  root.append(el("section", { class: "wrap", style: "margin-top: var(--sp-6);" }, [
    el("div", { class: "panel" }, [
      el("span", { class: "eyebrow", text: "이 서비스는" }),
      feature("좋은 말만 반복하지 않아요", "장점과 함께 단점·갈등 가능성·조심할 행동을 구체적으로 짚어요."),
      feature("성향과 행동 패턴을 봐요", "막연한 운세 대신 반복되는 선택과 반응의 원인을 살펴봐요."),
      feature("참고용 콘텐츠예요", "미래를 확정하지 않아요. 중요한 결정은 실제 정보·전문가와 함께 검토하세요."),
    ]),
  ]));

  root.append(el("section", { class: "wrap center", style: "margin-top: var(--sp-5);" }, [
    el("p", { class: "tiny muted", text: "로그인 없이 이용할 수 있고, 입력 정보는 브라우저 안에서만 처리돼요." }),
    el("div", { class: "btn-row", style: "justify-content:center; margin-top: var(--sp-2);" }, [
      el("a", { href: "#/about", class: "btn btn-quiet btn-sm", text: "이용 안내·면책" }),
      el("a", { href: "#/privacy", class: "btn btn-quiet btn-sm", text: "개인정보" }),
    ]),
  ]));

  return root;
}

/* ---- 조각들 ---- */
function sectionTitle(title, sub) {
  return el("div", { style: "display:flex; align-items:baseline; gap:10px; margin-bottom: var(--sp-3);" }, [
    el("h2", { style: "font-size:1.15rem;", text: title }),
    sub ? el("span", { class: "muted tiny", text: sub }) : null,
  ].filter(Boolean));
}

const HOOKS = ["일이 잘 안 풀릴 때", "연애가 이상하게 꼬일 때", "미래가 궁금할 때", "이유 없이 마음이 복잡할 때"];

function haemyoHero(navigate) {
  const input = el("input", { class: "haemyo-input", type: "text", maxlength: "60",
    placeholder: "예: 그 사람은 나를 어떻게 생각할까?", "aria-label": "해묘에게 물어볼 질문" });
  const ask = () => {
    const q = input.value.trim();
    if (q) stash("oracle:question", q);
    navigate("/oracle");
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") ask(); });

  return el("div", { class: "haemyo-hero" }, [
    el("div", { class: "haemyo-orb", "aria-hidden": "true" }),
    el("div", { class: "haemyo-brand" }, [
      el("span", { class: "haemyo-cat", "aria-hidden": "true" }),
      el("div", {}, [
        el("h1", { class: "serif brand-title", html: '해묘 <span class="brand-en">解猫</span>' }),
        el("p", { class: "muted tiny", text: "인생이 묘할 때, 해묘" }),
      ]),
    ]),
    el("h2", { class: "serif haemyo-ask", text: "오늘, 무슨 일이 묘해?" }),
    el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "무엇이든 물어봐. 해묘가 카드를 펼쳐서 풀어줄게." }),
    el("div", { class: "haemyo-inputrow" }, [
      input,
      el("button", { class: "holo-btn haemyo-go", onclick: ask }, [el("span", { text: "물어보기" })]),
    ]),
    el("p", { class: "haemyo-hooks tiny muted", text: HOOKS.join(" · ") }),
  ]);
}

function coinEventBanner(navigate) {
  const canClaim = !checkInStatus().claimedToday;
  return el("button", { class: "coin-event", onclick: () => navigate("/store") }, [
    el("span", { class: "coin-mark lg", "aria-hidden": "true" }),
    el("div", { style: "flex:1; text-align:left;" }, [
      el("p", { style: "font-weight:700;", text: canClaim ? "출석하면 무료 코인!" : "코인 충전소" }),
      el("p", { class: "muted tiny", text: canClaim ? "매일 출석 · 7일 연속 보너스까지" : "코인으로 깊은 해석을 열어요" }),
    ]),
    el("span", { class: "wide-arrow", text: "→" }),
  ]);
}

function myShortcutRow(navigate, my) {
  return el("div", { class: "panel panel-gold", style: "display:flex; align-items:center; gap:12px; flex-wrap:wrap;" }, [
    el("div", { style: "flex:1; min-width:150px;" }, [
      el("p", { style: "font-weight:700;", text: (my.name ? my.name + "님, " : "") + "저장된 정보로 바로 보기" }),
      el("p", { class: "muted tiny", text: `${my.birthDate}${my.timeUnknown ? " · 시간 모름" : (my.birthTime ? " · " + sijinLabel(my) : "")}` }),
    ]),
    el("div", { class: "btn-row" }, [
      el("button", { class: "btn btn-primary btn-sm", onclick: () => { stash("saju:input", my); navigate("/saju/loading"); } }, [el("span", { text: "사주 리포트" })]),
      el("button", { class: "btn btn-quiet btn-sm", onclick: () => navigate("/saju") }, [el("span", { text: "정보 수정" })]),
    ]),
  ]);
}

function featureTile(f, navigate, my) {
  return el("button", {
    class: "topic-tile feature-tile", style: `--tint:linear-gradient(155deg, ${f.tint}, transparent); --accent:${f.accent};`,
    onclick: () => {
      if (my && f.myShortcut === "saju") { stash("saju:input", my); navigate("/saju/loading"); }
      else if (my && f.myShortcut === "ziwei") { stash("ziwei:input", my); navigate("/ziwei/result"); }
      else navigate(f.to);
    },
  }, [
    el("span", { class: "topic-name serif", text: f.name }),
    el("span", { class: "topic-blurb muted", text: f.blurb }),
  ]);
}

function wideCard({ name, blurb, accent, onClick }) {
  return el("button", { class: "wide-card", style: `--accent:${accent};`, onclick: onClick }, [
    el("div", { style: "flex:1;" }, [
      el("h3", { class: "serif", style: "font-size:1.1rem;", text: name }),
      el("p", { class: "muted", style: "font-size:var(--fs-sm); margin-top:2px;", text: blurb }),
    ]),
    el("span", { class: "wide-arrow", text: "→" }),
  ]);
}

/* 해묘의 오늘 추천 — 방법×토픽 큐레이션 (포스텔러/점신식 리스트를 해묘 톤으로) */
const RECO = [
  { to: "/fortune/tarot/today", mLabel: "무료 타로", name: "오늘 나에게 필요한 한 마디", tag: "luck" },
  { to: "/fortune/saju/yearlove", mLabel: "사주", name: "올해, 내 사랑은 어떻게 흘러갈까?", tag: "love" },
  { to: "/fortune/tarot/todaylove", mLabel: "타로", name: "오늘 그 사람 마음, 카드로 엿보기", tag: "love" },
  { to: "/ziwei", mLabel: "자미두수", name: "내 명반과 8단계 심화 풀이", tag: "wealth" },
  { to: "/fortune/saju/business", mLabel: "사주", name: "나에게 맞는 직업·사업의 길", tag: "work" },
  { to: "/tojeong", mLabel: "토정비결", name: "올해의 괘로 보는 한 해 흐름", tag: "luck" },
];
const TAG_COLOR = { love: "#eda9ca", wealth: "#e0b878", work: "#9fbfe0", luck: "#c9a6e6" };

function bioWidget(navigate, my) {
  let b;
  try { b = biorhythm(computeSaju(my)); } catch { return el("div"); }
  const stat = (o, color, label) => el("span", { class: "bio-stat" }, [
    el("span", { class: "bio-dot", style: `background:${color};` }),
    el("span", { class: "bio-stat-lb muted", text: label }),
    el("b", { style: `color:${color};`, text: `${o.v > 0 ? "+" : ""}${o.v}%` }),
  ]);
  return el("button", { class: "panel bio-widget", style: "width:100%; text-align:left; cursor:pointer;", onclick: () => navigate("/biorhythm") }, [
    el("div", { style: "display:flex; align-items:baseline; justify-content:space-between;" }, [
      el("span", { class: "eyebrow", text: "오늘의 바이오리듬" }),
      el("span", { class: "muted tiny", text: "자세히 →" }),
    ]),
    el("div", { class: "bio-chart", style: "margin-top:6px;", html: bioSvg(b, 130) }),
    el("div", { class: "bio-stats" }, [stat(b.physical, "#ffa3b5", "신체"), stat(b.emotional, "#dcb6ff", "감성"), stat(b.intellectual, "#ffd39a", "지성")]),
  ]);
}

function recoList(navigate) {
  return el("div", {}, [
    sectionTitle("해묘의 오늘 추천", "이런 게 궁금하지 않아?"),
    el("div", { class: "reco-list" }, RECO.map((r) =>
      el("button", { class: "reco-row", onclick: () => navigate(r.to) }, [
        el("span", { class: "reco-tag", style: `--c:${TAG_COLOR[r.tag] || "#eda9ca"};`, text: r.mLabel }),
        el("span", { class: "reco-name", text: r.name }),
        el("span", { class: "reco-arrow", text: "›" }),
      ]))),
  ]);
}

function todayTarot(navigate) {
  const cards = el("div", { class: "tt-cards", "aria-hidden": "true" },
    ["major-17", "major-0", "major-19"].map((n, i) =>
      el("span", { class: `tt-card tt-${i}`, style: `background-image:url("assets/img/card-back.webp");` })));
  return el("div", { class: "today-tarot" }, [
    el("span", { class: "eyebrow", text: "오늘의 타로" }),
    cards,
    el("h2", { class: "serif", style: "font-size:1.5rem; text-align:center; margin-top: var(--sp-3);", text: "카드가 당신을 기다리고 있어요" }),
    el("p", { class: "muted", style: "text-align:center; margin-top:4px;", text: "카드 3장으로 오늘의 흐름을 알아봐요" }),
    el("button", { class: "holo-btn holo-lg", style: "margin: var(--sp-4) auto 0;", onclick: () => navigate("/tarot") }, [
      el("span", { text: "무료로 카드 뽑기" }),
    ]),
  ]);
}

function feature(title, desc) {
  return el("div", { style: "display:flex; gap:10px; align-items:flex-start; margin-top: var(--sp-3);" }, [
    el("span", { class: "feat-dot", "aria-hidden": "true" }),
    el("div", {}, [
      el("p", { style: "font-weight:700;", text: title }),
      el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: desc }),
    ]),
  ]);
}
