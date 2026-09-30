import { el, clear, toast } from "../utils/dom.js";
import { pageHeader, backLink, loadDisclaimer, noticeBox } from "./_shared.js";
import { getMyBirth, stash } from "../state.js";
import { computeSaju } from "../saju/manse.js";
import { readTopic } from "../saju/topics.js";
import { taegilMonth } from "../saju/extras.js";
import { monthlyFlow } from "../saju/relationship.js";
import { tenGod } from "../saju/fortune.js";
import { datePortrait, idealType, charmSpirits } from "../saju/spouse.js";
import { isUnlocked, unlock, getCoins, costOf } from "../wallet.js";
import { personSwitch } from "./people.js";
/* =========================================================
   테마 운세 — 큰 주제(카테고리) 칩 + 배너 카드 목록
   배너 그림은 이미지 파일 없이 CSS 그라데이션 + 작은 SVG 장식으로 그린다.
   ========================================================= */

const NOW = () => new Date();
const Y = () => NOW().getFullYear();
const M = () => NOW().getMonth() + 1;

const CATS = ["전체", "NEW", "애정운", "솔로", "썸", "커플", "재회운", "결혼", "궁합", "사주", "타로", "신년운세", "월운", "재물운", "직업운", "학업운", "건강운", "대인관계", "성향", "행운", "고민", "별자리", "인생총운"];

/* 배너 장식 SVG */
export const ART = {
  moon: `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="34" fill="rgba(255,244,230,.92)"/><circle cx="74" cy="50" r="30" fill="currentColor"/><g fill="rgba(255,255,255,.9)"><circle cx="18" cy="22" r="1.8"/><circle cx="100" cy="98" r="1.4"/><circle cx="104" cy="24" r="2"/><circle cx="26" cy="96" r="1.2"/></g></svg>`,
  ring: `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="70" r="30" fill="none" stroke="rgba(255,236,210,.95)" stroke-width="7"/><path d="M50 38 L60 24 L70 38 Z" fill="rgba(255,255,255,.95)"/><g fill="rgba(255,255,255,.9)"><circle cx="20" cy="30" r="2"/><circle cx="98" cy="26" r="1.6"/><circle cx="102" cy="96" r="1.4"/></g></svg>`,
  hearts: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 96 C20 70 24 38 44 36 C54 35 60 44 60 48 C60 44 66 35 76 36 C96 38 100 70 60 96Z" fill="rgba(255,236,242,.95)"/><path d="M22 40 C10 32 12 20 20 20 C24 20 26 24 26 25 C26 24 28 20 32 20 C40 20 42 32 30 40Z" fill="rgba(255,255,255,.75)"/><path d="M96 30 C88 25 89 17 94 17 C96 17 98 19 98 20 C98 19 100 17 102 17 C107 17 108 25 100 30Z" fill="rgba(255,255,255,.7)"/></svg>`,
  cards: `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="30" y="26" width="40" height="64" rx="6" fill="rgba(255,244,236,.9)" transform="rotate(-12 50 58)"/><rect x="50" y="26" width="40" height="64" rx="6" fill="rgba(255,255,255,.95)" transform="rotate(10 70 58)"/><circle cx="70" cy="58" r="8" fill="currentColor" opacity=".55"/></svg>`,
  sun: `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="64" r="24" fill="rgba(255,236,200,.95)"/><g stroke="rgba(255,240,210,.9)" stroke-width="4" stroke-linecap="round"><path d="M60 22v12M60 94v12M18 64h12M90 64h12M30 34l8 8M82 86l8 8M90 34l-8 8M38 86l-8 8"/></g></svg>`,
  coin: `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="78" rx="34" ry="12" fill="rgba(255,226,170,.85)"/><ellipse cx="60" cy="66" rx="34" ry="12" fill="rgba(255,236,190,.95)"/><ellipse cx="60" cy="54" rx="34" ry="12" fill="rgba(255,244,210,1)"/><text x="60" y="59" text-anchor="middle" font-size="14" font-weight="800" fill="rgba(160,100,60,.8)">福</text></svg>`,
  star: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M60 22 L69 50 L98 50 L74 67 L83 95 L60 78 L37 95 L46 67 L22 50 L51 50 Z" fill="rgba(255,244,230,.95)"/><g fill="rgba(255,255,255,.9)"><circle cx="20" cy="24" r="2"/><circle cx="100" cy="100" r="1.6"/></g></svg>`,
  cat: `<img class="tb-cat" src="assets/img/haemyo.webp" alt="" aria-hidden="true">`,
  phone: `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="40" y="18" width="40" height="80" rx="9" fill="rgba(255,244,240,.95)"/><rect x="46" y="28" width="28" height="52" rx="3" fill="currentColor" opacity=".35"/><circle cx="60" cy="89" r="3" fill="currentColor" opacity=".5"/><path d="M86 30 q10 8 0 16 M92 24 q16 14 0 28" stroke="rgba(255,255,255,.85)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  wheel: `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="38" fill="none" stroke="rgba(255,244,230,.95)" stroke-width="2.5"/><circle cx="60" cy="60" r="26" fill="none" stroke="rgba(255,244,230,.8)" stroke-width="1.5"/><g fill="rgba(255,250,240,.95)"><circle cx="60" cy="22" r="4"/><circle cx="98" cy="60" r="4"/><circle cx="60" cy="98" r="4"/><circle cx="22" cy="60" r="4"/></g><path d="M60 22 V98 M22 60 H98" stroke="rgba(255,244,230,.6)" stroke-width="1"/></svg>`,
};

/* 배너 색 (노을 톤온톤 계열) */
export const BG = {
  dusk: "linear-gradient(135deg, #5b4478 0%, #8b5a8c 55%, #d08c98 100%)",
  rose: "linear-gradient(135deg, #f7c6d2 0%, #eaa3be 50%, #c982a8 100%)",
  peach: "linear-gradient(135deg, #ffe0cf 0%, #ffbfb3 50%, #e79aa9 100%)",
  lilac: "linear-gradient(135deg, #e7d2f3 0%, #c9a9e6 50%, #9d7bc4 100%)",
  night: "linear-gradient(135deg, #3f3560 0%, #6b4a7a 60%, #a86c8a 100%)",
  gold: "linear-gradient(135deg, #ffe9c7 0%, #f6c99e 50%, #e1a07e 100%)",
  mint: "linear-gradient(135deg, #e2f3ea 0%, #bfe1d1 50%, #8fbfae 100%)",
};

/* 테마 목록 — to: 기존 화면으로 이동 / theme: 이 파일의 테마 리딩 / q: 물어보기 질문 미리 채우기 */
export function themes() {
  const y = Y(), m = M(), ny = y + 1;
  return [
    { id: "year-12", cats: ["NEW", "신년운세", "사주", "월운"], eyebrow: "열두 달 미리 보기", title: `${ny}년에 일어날\n12가지 결정적 순간`, sub: "달마다 한 가지 — 사랑·일·돈·사람", bg: "gold", art: "wheel", cost: 5, theme: true },
    { id: "marry-when", cats: ["NEW", "결혼", "애정운", "사주"], eyebrow: "사주로 보는 결혼 시기", title: "나는 언제쯤\n결혼하게 될까?", sub: "결혼운이 열리는 해 · 배우자상 · 결혼 전 준비", bg: "night", art: "ring", cost: 5, theme: true },
    { id: "solo-month", cats: ["NEW", "솔로", "애정운", "월운"], eyebrow: `${m}월의 시크릿`, title: `${m}월,\n솔로의 애정운`, sub: "이달 연애 기운 · 설레는 날 · 만남 팁", bg: "dusk", art: "moon", cost: 3, theme: true },
    { id: "solo-escape", cats: ["NEW", "솔로", "애정운", "신년운세"], eyebrow: "#언제 #누구와 #어떻게", title: `${ny} 솔로 탈출,\n이런 사람과 해요`, sub: "인연이 오는 달 · 만날 사람 · 만나는 곳", bg: "peach", art: "hearts", cost: 5, theme: true },
    { id: "some-date", cats: ["썸", "커플", "애정운"], eyebrow: "택일", title: "데이트·고백하기\n좋은 날", sub: "이번 달 설렘이 커지는 날짜", bg: "lilac", art: "hearts", cost: 1, to: "/calendar" },
    { id: "charm", cats: ["애정운", "성향", "솔로"], eyebrow: "내 매력 사주", title: "이성이 빠져드는\n나의 매력 포인트", sub: "끌림 타입 · 빠져드는 지수 · 그 사람과 끌림 궁합", bg: "rose", art: "star", cost: 3, to: "/pull" },
    { id: "couple", cats: ["커플", "궁합"], eyebrow: "두 사람 궁합", title: "우리, 오래\n함께할 수 있을까", sub: "성향 조화 · 합과 충 · 부딪히는 지점", bg: "peach", art: "hearts", cost: 5, to: "/compat" },
    { id: "reunion", cats: ["재회운", "애정운"], eyebrow: "재회운", title: "그 사람,\n다시 돌아올까", sub: "다시 이어질 가능성과 조건", bg: "night", art: "moon", cost: 3, to: "/fortune/saju/reunion" },
    { id: "inyeon", cats: ["애정운", "결혼", "사주"], eyebrow: "나의 인연", title: "연애할 사람,\n결혼할 사람 얼굴은?", sub: "이상형 · 초상화 · 만나면 안 될 사람", bg: "lilac", art: "ring", cost: 5, to: "/inyeon" },
    { id: "month", cats: ["월운", "사주"], eyebrow: `${y}년 ${m}월`, title: `${m}월 한 달\n운세 가이드`, sub: "연애 · 일 · 돈의 흐름", bg: "gold", art: "moon", cost: 2, to: "/fortune/saju/month" },
    { id: "newyear", cats: ["신년운세"], eyebrow: `${ny}년 미리 보기`, title: `${ny} 토정비결`, sub: "올해의 괘로 보는 한 해 흐름", bg: "dusk", art: "sun", cost: 3, to: "/tojeong" },
    { id: "wealth", cats: ["재물운", "사주"], eyebrow: "재물운", title: "돈은 언제,\n어떻게 들어올까", sub: "돈의 흐름 · 기회 · 새는 곳", bg: "gold", art: "coin", cost: 2, to: "/fortune/saju/wealth" },
    { id: "career", cats: ["직업운", "사주"], eyebrow: "직업·사업운", title: "나한테 맞는 일,\n커리어의 길", sub: "확장 · 거래 · 자금의 기운", bg: "mint", art: "sun", cost: 2, to: "/fortune/saju/business" },
    { id: "study", cats: ["학업운"], eyebrow: "학업·합격운", title: "시험, 붙을 수\n있을까?", sub: "집중 · 시험 · 자격의 기운", bg: "mint", art: "star", cost: 2, to: "/fortune/saju/study" },
    { id: "health", cats: ["건강운"], eyebrow: "바이오리듬", title: "몸과 마음\n컨디션 체크", sub: "신체 · 감성 · 지성 주기", bg: "peach", art: "sun", cost: 1, to: "/biorhythm" },
    { id: "people", cats: ["대인관계", "궁합"], eyebrow: "내 사람 랭킹", title: "평생 잡아야 할\n귀인은 누구?", sub: "귀인 · 결혼운 · 도화살 · 우정의 작대기", bg: "lilac", art: "cat", cost: 5, to: "/people" },
    { id: "saju", cats: ["성향", "사주"], eyebrow: "사주 리포트", title: "나는 어떤\n사람일까?", sub: "실제 만세력 명식 · 성향 · 반복 패턴", bg: "dusk", art: "cat", cost: 0, to: "/saju" },
    { id: "gwansang", cats: ["성향"], eyebrow: "관상", title: "사진으로 보는\n내 얼굴 관상", sub: "카메라 · 앨범 사진으로", bg: "rose", art: "cat", cost: 2, to: "/gwansang" },
    { id: "lucky", cats: ["행운"], eyebrow: "오늘의 행운", title: "오늘 나를 지켜줄\n행운 카드", sub: "행운 카드 · 행운색", bg: "gold", art: "cards", cost: 1, to: "/luckycard" },
    { id: "dream", cats: ["고민"], eyebrow: "꿈해몽", title: "어젯밤 그 꿈,\n무슨 뜻일까?", sub: "무료 꿈풀이", bg: "lilac", art: "moon", cost: 0, to: "/dream" },
    { id: "star", cats: ["별자리"], eyebrow: "별자리 · 띠", title: "별자리로 보는\n나의 성향", sub: "서양 점성 · 60간지 띠운", bg: "night", art: "star", cost: 2, to: "/star" },
    { id: "life", cats: ["인생총운", "사주"], eyebrow: "자미두수", title: "12궁으로 보는\n인생 총운", sub: "명반 · 8단계 심화 풀이", bg: "dusk", art: "star", cost: 3, to: "/ziwei" },
    { id: "tarot", cats: ["NEW", "타로", "애정운", "썸", "재회운", "고민"], eyebrow: "타로 테마는 여기로 이사했어요", title: "그 사람 속마음·재회·썸\n타로 테마 모아 보기", sub: "연락 없는 이유 · 흔들리는 마음 · 선택 고민", bg: "rose", art: "cards", cost: 0, to: "/tarot" },
  ];
}

export function banner(t, onClick) {
  return el("button", { class: `theme-banner bg-${t.bg}`, type: "button", style: `--bg:${BG[t.bg] || BG.dusk};`, onclick: onClick, "aria-label": t.title.replace(/\n/g, " ") }, [
    el("div", { class: "tb-art", html: ART[t.art] || "" }),
    el("div", { class: "tb-text" }, [
      el("span", { class: "tb-eyebrow", text: t.eyebrow }),
      el("span", { class: "tb-title", text: t.title }),
    ]),
    el("div", { class: "tb-foot" }, [
      el("span", { class: "tb-sub", text: t.sub }),
      el("span", { class: "tb-cost" + (t.cost ? "" : " free") }, t.cost ? [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: String(t.cost) })] : [el("span", { text: "무료" })]),
    ]),
    t.cats.includes("NEW") ? el("span", { class: "tb-new", text: "NEW" }) : null,
  ].filter(Boolean));
}

export function renderExplore({ navigate }) {
  loadDisclaimer();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("사주 테마 운세", "내 사주로 보는 테마 운세", "결혼 시기·솔로 탈출·재물·직업까지 — 실제 만세력으로 풀어요. 그 사람 속마음·재회 같은 타로 테마는 타로에 있어요."));

  let cat = window.__themeCat || "전체";
  const chipsHost = el("section", { class: "wrap" });
  const listHost = el("section", { class: "wrap theme-list", style: "margin-top: var(--sp-3);" });
  root.append(chipsHost, listHost);

  function paint() {
    clear(chipsHost); clear(listHost);
    chipsHost.append(el("div", { class: "theme-chips" }, CATS.map((c) =>
      el("button", { class: "theme-chip" + (c === cat ? " on" : ""), type: "button", onclick: () => { cat = c; window.__themeCat = c; paint(); } }, [el("span", { text: c })]))));
    const list = themes().filter((t) => cat === "전체" || t.cats.includes(cat));
    if (!list.length) { listHost.append(el("p", { class: "muted", text: "곧 새로운 테마가 올라와요." })); return; }
    list.forEach((t) => listHost.append(banner(t, () => {
      if (t.theme) return navigate(`/theme/${t.id}`);
      if (t.q) stash("oracle:question", t.q);
      navigate(t.to);
    })));
  }
  paint();
  return root;
}

/* ---------------- 테마 리딩 (새 조합 콘텐츠) ---------------- */
const SPOUSE = { male: ["정재", "편재"], female: ["정관", "편관"] };
const HAP6 = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const isHap = (a, b) => HAP6.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
const MEET = {
  wood: "스터디·운동 모임·새로 시작하는 배움의 자리", fire: "공연·전시·파티·SNS처럼 밝고 사람 많은 곳",
  earth: "지인 소개·동네 단골집·오래 다닌 모임", metal: "직장·전문 분야 모임·일로 엮인 자리",
  water: "여행·온라인·늦은 밤 긴 대화가 오가는 자리",
};
/* 십신별 '그 달에 일어나기 쉬운 결정적 순간' */
const MOMENT = {
  비견: ["🤝 사람", "뜻이 맞는 동료·친구가 나타나요. 함께 시작하는 일이 힘을 받아요."],
  겁재: ["⚔️ 경쟁", "경쟁자나 라이벌이 등장해요. 내 몫을 분명히 챙겨야 하는 순간이 와요."],
  식신: ["🎨 표현", "재능과 아이디어가 빛을 봐요. 작은 결과물이 칭찬으로 돌아와요."],
  상관: ["🔥 변화", "틀을 깨고 싶어져요. 이직·도전·과감한 말 한마디가 판을 바꿔요."],
  편재: ["💸 기회", "뜻밖의 돈·기회가 들어와요. 새로운 사람과의 인연도 활발해요."],
  정재: ["💰 안정", "꾸준히 쌓은 게 보상으로 와요. 현실적인 계획이 결실을 맺어요."],
  편관: ["⚡ 도전", "갑작스러운 일·책임이 몰려와요. 버티면 한 단계 성장하는 달이에요."],
  정관: ["🏅 인정", "승진·합격·인정받을 일이 생겨요. 진지한 관계로 발전하기도 좋아요."],
  편인: ["🔮 직감", "새로운 공부·취미에 빠져요. 혼자만의 시간에 중요한 깨달음이 와요."],
  정인: ["📜 도움", "귀인·윗사람의 도움이 들어와요. 문서·계약·자격 일이 잘 풀려요."],
};

function yearInfo(profile, gender, year) {
  const t = computeSaju({ calendarType: "solar", birthDate: `${year}-06-15`, birthTime: "12:00", timeUnknown: true, gender: "male", timezone: "Asia/Seoul" });
  const god = tenGod(profile.pillars.day.stemIdx, t.pillars.year.stemIdx);
  let s = 50;
  const spouse = (SPOUSE[gender] || SPOUSE.female).includes(god);
  if (spouse) s += 26;
  if (isHap(profile.pillars.day.branchIdx, t.pillars.year.branchIdx)) s += 16;
  if (Math.abs(profile.pillars.day.branchIdx - t.pillars.year.branchIdx) === 6) s += 8; // 충 — 변화의 해
  if (god === "정인" || god === "식신") s += 6;
  return { year, gz: t.pillars.year.gz, god, spouse, score: s };
}

const THEME_VIEW = {
  "year-12": {
    title: `${Y() + 1}년에 일어날 12가지 결정적 순간`,
    build(profile, gender) {
      const ny = Y() + 1;
      let flow = [];
      try { flow = monthlyFlow(profile, gender, ny, 1, 12); } catch { flow = []; }
      const rows = flow.map((f) => { const mo = MOMENT[f.god] || MOMENT.비견; return { m: f.m, gz: f.gz, tag: mo[0], text: mo[1], love: f.favorable }; });
      const loveMonths = rows.filter((r) => r.love).map((r) => `${r.m}월`);
      const big = rows.filter((r) => /변화|도전|기회|인정/.test(r.tag)).map((r) => `${r.m}월`);
      return [
        headline(`${ny}년의 큰 전환점은 ${big.slice(0, 3).join(" · ") || "상반기"}이에요.`,
          loveMonths.length ? `연애·인연 기운이 살아나는 달은 ${loveMonths.slice(0, 4).join(" · ")}이에요.` : "인연은 한 해 동안 조용히 이어지는 흐름이에요."),
        list("달마다 한 가지, 결정적 순간", rows.map((r) => `${r.m}월 (${r.gz}) ${r.tag} — ${r.text}${r.love ? " 💗 인연 기운" : ""}`)),
        list("한 해를 잘 쓰는 법", ["전환점 달에는 큰 결정을 미루지 말고, 한 달 전부터 준비해 두세요.", "인연 기운이 있는 달엔 약속을 늘리고 새로운 모임에 나가 보세요.", "각 달 운세는 ‘이달의 운세’에서 더 자세히 볼 수 있어요."]),
      ];
    },
  },
  "marry-when": {
    title: "나는 언제쯤 결혼하게 될까?",
    build(profile, gender) {
      const y0 = Y();
      const years = Array.from({ length: 10 }, (_, i) => yearInfo(profile, gender, y0 + i));
      const top = [...years].sort((a, b) => b.score - a.score).slice(0, 3).sort((a, b) => a.year - b.year);
      const first = top[0];
      const ideal = idealType(profile, gender);
      return [
        headline(`결혼운이 가장 강하게 열리는 해는 ${top.map((t) => t.year + "년").join(" · ")}이에요.`,
          `그중 가장 가까운 ${first.year}년(${first.gz})은 ${first.spouse ? `배우자를 뜻하는 기운(${first.god})이 들어오는 해라, 진지한 인연이나 결혼 이야기가 오가기 쉬워요.` : "관계가 한 단계 정리·확정되기 쉬운 흐름이에요."}`),
        list("앞으로 10년 결혼운 흐름", years.map((t) => `${t.year}년 ${t.gz} — ${t.score >= 80 ? "💍 결혼운 강함" : t.score >= 64 ? "💗 좋은 인연·진전" : "· 내실을 다지는 해"}`)),
        list("이런 사람과 결혼할 가능성이 커요", [ideal.line, ideal.look]),
        list("결혼운을 살리는 법", [
          `${first.year - 1}년 하반기부터 만남의 폭을 넓혀 두세요. 인연은 결혼운이 오기 한두 해 전에 시작되는 경우가 많아요.`,
          "결혼 조건(사는 곳·일·돈·아이)을 미리 한 번 적어 보세요. 좋은 해에 결정을 빨리 내릴 수 있어요.",
          "더 자세한 배우자 얼굴·이상형은 ‘나의 인연’에서 볼 수 있어요.",
        ]),
      ];
    },
  },
  "solo-month": {
    title: `${M()}월, 솔로의 애정운`,
    build(profile) {
      const r = readTopic(profile, "monthlove", NOW());
      const tg = taegilMonth(profile, Y(), M(), "date");
      const good = tg.best.map((d) => `${M()}월 ${d.day}일`);
      return [
        headline(r.headline, r.tip),
        list("이달 설렘이 커지는 날", [good.join(" · "), "이 날들엔 약속을 잡거나 새 모임에 나가 보세요."]),
        list("이달 조심할 날", [tg.caution.map((d) => `${M()}월 ${d.day}일`).join(" · ") + " — 오해나 엇갈림이 생기기 쉬워요. 중요한 고백은 피하세요."]),
        list("솔로 탈출 한 수", ["평소 안 가던 곳 한 군데 가 보기", "연락이 뜸했던 지인에게 먼저 안부 보내기 — 소개로 이어지기 쉬운 달이에요", `이달 행운색 ${r.luckyColor}을 옷이나 소품에 한 가지`]),
      ];
    },
  },
  "solo-escape": {
    title: `${Y() + 1} 솔로 탈출, 이런 사람과 해요`,
    build(profile, gender) {
      const ny = Y() + 1;
      let flow = [];
      try { flow = monthlyFlow(profile, gender, ny, 1, 12); } catch { flow = []; }
      const good = flow.filter((m) => m.favorable).map((m) => `${m.m}월`);
      const who = datePortrait(profile, gender);
      const charm = charmSpirits(profile);
      return [
        headline(good.length ? `${ny}년, 인연이 들어오는 달은 ${good.slice(0, 4).join(" · ")}이에요.` : `${ny}년은 조용히 스며드는 인연의 해예요.`,
          good.length ? `특히 ${good[0]}은 연애 기운이 살아나는 첫 달이에요. 이때 새 만남을 적극적으로 만들어 보세요.` : "눈에 띄는 한 달보다, 꾸준히 만나는 사람과 천천히 깊어지는 흐름이에요."),
        list("이런 사람과 이어질 가능성이 커요", [who.summary, ...who.traits]),
        list("어디서 만날까?", [MEET[who.elem] || MEET.earth, charm.dohwa ? "도화 기운이 있어 사람 많은 곳에서 먼저 눈에 띄어요. 모임·행사에 자주 얼굴을 비추세요." : "첫눈에 반하는 인연보다, 자주 보며 편해진 사람과 이어지기 쉬워요."]),
        list("솔로 탈출 전략", ["인연 달 한두 달 전부터 머리·옷 스타일을 한 번 바꿔 보세요.", "마음에 드는 사람에겐 구체적인 약속(날짜·장소)으로 먼저 제안하기.", "더 자세한 초상화는 ‘나의 인연’에서 볼 수 있어요."]),
      ];
    },
  },
};

function headline(head, sub) {
  return el("div", { class: "panel conclusion" }, [
    el("span", { class: "conclusion-tag", text: "결론" }),
    el("p", { class: "conclusion-head", text: head }),
    sub ? el("p", { class: "conclusion-sub", text: sub }) : null,
  ].filter(Boolean));
}
function list(label, items) {
  return el("div", { class: "block tag-good" }, [
    el("span", { class: "block-label" }, [el("span", { text: label })]),
    ...items.filter(Boolean).map((t) => el("p", { text: t })),
  ]);
}

export function renderThemeReading({ navigate, id }) {
  loadDisclaimer();
  const meta = themes().find((t) => t.id === id);
  const view = THEME_VIEW[id];
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/explore", "테마 운세")]));
  if (!meta || !view) { root.append(el("section", { class: "wrap" }, [noticeBox("warn", "알 수 없는 테마예요.")])); return root; }
  root.append(el("section", { class: "wrap" }, [banner(meta, () => {})]));
  root.append(personSwitch(navigate));
  const my = getMyBirth();
  const host = el("section", { class: "wrap section-gap", style: "margin-top: var(--sp-3);" });
  root.append(host);
  if (!my) {
    host.append(noticeBox("info", "생년월일이 필요해요. 한 번 입력하면 저장됩니다."),
      el("button", { class: "btn btn-primary", onclick: () => navigate("/saju") }, [el("span", { text: "내 정보 입력하고 시작" })]));
    return root;
  }
  const itemId = `theme:${id}:${my.birthDate}:${id === "solo-month" ? `${Y()}-${M()}` : Y()}`;
  const cost = meta.cost || costOf(id);
  function paint() {
    clear(host);
    if (!isUnlocked(itemId)) {
      const coins = getCoins();
      host.append(el("div", { class: "panel premium-lock" }, [
        el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
        el("h3", { class: "serif", style: "margin-top:10px;", text: view.title }),
        el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: meta.sub + " — 한 번 열면 다시 볼 땐 무료예요." }),
        el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
          const r = unlock(itemId, cost);
          if (r.ok) { toast(`${view.title}을(를) 열었어요`); paint(); } else { toast("코인이 부족해요."); navigate("/store"); }
        } }, [el("span", { text: coins >= cost ? `코인 ${cost}개로 열기 · 보유 ${coins}개` : "코인 받으러 가기" })]),
      ]));
      return;
    }
    const profile = computeSaju(my);
    const gender = my.gender === "male" ? "male" : "female";
    view.build(profile, gender).forEach((n) => host.append(n));
    host.append(noticeBox("info", "사주 흐름으로 본 재미·참고용 풀이예요. 미래를 확정하지 않아요."));
  }
  paint();
  return root;
}
