/* =========================================================
   운세 카테고리 해석 — 십신(十神) 구조 기반.
   연애/재회/이별/재물/학업/문서 = 명식의 해당 십신 강약으로,
   오늘/평일/주말 = 일진(todayFortune)으로 생성.
   톤: 좋은 말만 X, 조심할 점·개선을 함께. 미래 확정·공포 금지.
   ========================================================= */

import { todayFortune } from "./fortune.js";

const GEN = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };
const CTRL = { wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" };
const CTRL_BY = { wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth" };
const RESOURCE = { wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal" };
const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
const ELEM_COLOR = { wood: "초록", fire: "빨강·주황", earth: "노랑·베이지", metal: "흰색·골드", water: "검정·네이비" };

/** 십신 그룹별 글자 수 (일간 기준) */
function sip(profile) {
  const e = profile.dayMasterElem, c = profile.elementCounts || {};
  return {
    peer: c[e] || 0,                 // 비겁
    output: c[GEN[e]] || 0,          // 식상
    wealth: c[CTRL[e]] || 0,         // 재성
    officer: c[CTRL_BY[e]] || 0,     // 관성
    resource: c[RESOURCE[e]] || 0,   // 인성
  };
}
function level(n, total) {
  const r = total ? n / total : 0;
  return r >= 0.30 ? "강" : r >= 0.12 ? "중" : "약";
}
// 명식+토픽 고정 해시 → 점수 변주(항상 같은 값이 나오도록)
function jitter(profile, id) {
  const s = (profile.pillars.day.gz || "") + (profile.pillars.year.gz || "") + id;
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h % 9; // 0~8
}
function scoreFor(lv, profile, id) {
  const base = lv === "강" ? 74 : lv === "중" ? 60 : 46;
  return base + jitter(profile, id) - 2; // ±
}

/* 각 토픽 콘텐츠 — anchor 십신 + 강/중/약 */
const C = {
  love: {
    anchor: (s, gender) => (gender === "female" ? s.officer : s.wealth),
    other: "배우자성(남자는 재성, 여자는 관성)",
    강: {
      summary: "이성을 끌어들이는 기운이 뚜렷해요. 인연의 기회 자체는 잘 열립니다.",
      pros: ["매력·인기의 기운이 강해 만남의 폭이 넓어요.", "감정을 표현하는 데 주저함이 적어 관계 진전이 빨라요."],
      cons: ["끌림이 강한 만큼 여러 인연이 겹쳐 흔들리기 쉬워요.", "속도가 빨라 상대의 속도를 놓칠 수 있어요."],
      advice: "선택지가 많을수록 ‘한 사람에게 집중’이 관건이에요. 설렘과 진심을 구분해 보세요.",
    },
    중: {
      summary: "무난한 연애 기운이에요. 큰 굴곡 없이 노력한 만큼 관계가 만들어져요.",
      pros: ["안정적으로 관계를 쌓아가는 데 어울려요.", "상대를 배려하는 균형 감각이 있어요."],
      cons: ["먼저 다가가는 적극성이 약하면 기회를 놓치기도 해요.", "익숙함에 표현이 줄기 쉬워요."],
      advice: "기다리기보다 한 발 먼저 표현해 보세요. 작은 신호가 인연을 살립니다.",
    },
    약: {
      summary: "지금은 인연의 기운이 조용한 편이에요. 조급함이 오히려 방해가 돼요.",
      pros: ["나를 돌보고 매력을 다듬기 좋은 시기예요.", "가벼운 만남보다 깊은 관계에 어울려요."],
      cons: ["‘없다’는 조급함이 잘못된 선택으로 이어지기 쉬워요.", "혼자 마음을 키우다 지칠 수 있어요."],
      advice: "인연을 좇기보다 나의 리듬을 채우세요. 준비된 매력이 때를 만듭니다.",
    },
  },
  reunion: {
    anchor: (s, gender) => (gender === "female" ? s.officer : s.wealth),
    강: {
      summary: "다시 이어질 기운은 살아 있어요. 다만 ‘왜 헤어졌는지’를 넘어야 진짜 재회예요.",
      pros: ["서로를 다시 끌어당기는 기운이 있어요.", "연락·계기가 자연스럽게 생기기 쉬워요."],
      cons: ["끌림만으로 돌아가면 같은 이유로 또 멀어져요.", "미련과 사랑을 혼동하기 쉬워요."],
      advice: "돌아가기 전에 헤어진 원인이 ‘바뀌었는지’부터 확인하세요. 감정보다 변화가 핵심.",
    },
    중: {
      summary: "재회 가능성은 반반이에요. 두 사람의 선택이 운보다 크게 작용해요.",
      pros: ["시간이 지나 감정이 정리되면 대화의 여지가 열려요."],
      cons: ["어정쩡한 연락은 서로를 더 지치게 해요."],
      advice: "재회를 원한다면 ‘무엇이 달라질지’를 먼저 정리해 제안하세요.",
    },
    약: {
      summary: "지금은 되돌리는 기운이 약해요. 붙잡기보다 나를 회복할 시기예요.",
      pros: ["관계를 객관적으로 돌아보며 성장할 수 있어요."],
      cons: ["집착은 나를 소모시키고 상대를 더 멀어지게 해요."],
      advice: "매달리는 대신 나의 일상을 채우세요. 회복이 다음 인연의 바탕이 됩니다.",
    },
  },
  breakup: {
    anchor: (s) => s.officer + s.wealth,     // 관계성 십신 손상/과다
    강: {
      summary: "관계의 긴장이 커지기 쉬운 흐름이에요. 감정이 앞서면 후회할 말이 나와요.",
      pros: ["문제를 정면으로 마주해 정리할 힘은 있어요."],
      cons: ["욱하는 이별·통보는 관계를 회복 불가로 만들어요.", "책임을 상대 탓으로만 돌리기 쉬워요."],
      advice: "결정은 감정이 가라앉은 뒤에. 헤어짐도 ‘대화’로 마무리해야 상처가 얕아요.",
    },
    중: {
      summary: "권태·소통 부족이 쌓이기 쉬운 시기예요. 방치하면 거리가 벌어져요.",
      pros: ["작은 노력으로도 관계를 다시 데울 수 있어요."],
      cons: ["‘알아주겠지’ 하는 침묵이 오해를 키워요."],
      advice: "불만을 참기보다 부드럽게 꺼내 보세요. 표현이 이별을 막습니다.",
    },
    약: {
      summary: "지금은 관계가 비교적 안정적이에요. 큰 위기 요소는 적어요.",
      pros: ["편안함이 오래가는 관계의 바탕이 돼요."],
      cons: ["안정에 기대 표현이 줄면 서서히 식을 수 있어요."],
      advice: "안정할수록 작은 표현을 챙기세요. 익숙함이 무심함이 되지 않게.",
    },
  },
  wealth: {
    anchor: (s) => s.wealth,
    강: {
      summary: "돈을 끌어오는 기운이 강해요. 기회를 현실 수익으로 바꾸는 감각이 좋아요.",
      pros: ["수입원·거래 기회가 잘 보여요.", "실속을 챙기는 현실 감각이 있어요."],
      cons: ["욕심이 커지면 무리한 투자로 새어나가요.", "돈 문제로 인간관계가 얽히기 쉬워요."],
      advice: "버는 것보다 ‘지키는 구조’가 관건. 감당 가능한 규모로만 벌리세요.",
    },
    중: {
      summary: "노력한 만큼 벌리는 무난한 재물 기운이에요. 한 방보다 꾸준함이 맞아요.",
      pros: ["성실하게 모으는 데 어울려요."],
      cons: ["큰 욕심·투기는 오히려 손실로 이어져요."],
      advice: "고정 수입을 지키며 작은 파이프라인을 늘리세요.",
    },
    약: {
      summary: "지금은 재물의 흐름이 조용해요. 확장보다 관리·절약의 시기예요.",
      pros: ["지출을 정리하고 체력을 비축하기 좋아요."],
      cons: ["무리한 대출·투자는 특히 조심해야 해요."],
      advice: "새로 벌이기보다 새는 곳을 막으세요. 지키는 것이 버는 것.",
    },
  },
  study: {
    anchor: (s) => s.resource + s.output * 0.5,   // 인성(학문)+식상(표현)
    강: {
      summary: "배우고 정리하는 기운이 좋아요. 집중과 흡수력이 살아나는 시기예요.",
      pros: ["장기 공부·자격·시험 준비에 유리해요.", "핵심을 정리하고 기억하는 힘이 좋아요."],
      cons: ["완벽주의로 시작이 늦어지기 쉬워요.", "인풋만 늘고 아웃풋(문제풀이·표현)이 밀릴 수 있어요."],
      advice: "‘완벽한 계획’보다 오늘의 한 챕터. 배운 걸 바로 써먹으세요.",
    },
    중: {
      summary: "무난한 학업 기운이에요. 루틴을 잡으면 성과가 안정적으로 쌓여요.",
      pros: ["꾸준히 하면 결과가 따라와요."],
      cons: ["집중이 흩어질 때 관리가 필요해요."],
      advice: "짧고 규칙적인 학습 블록을 정하세요. 리듬이 실력을 만듭니다.",
    },
    약: {
      summary: "지금은 집중이 흩어지기 쉬운 시기예요. 분량보다 방법이 중요해요.",
      pros: ["가볍게 기초를 다지고 흥미를 붙이기 좋아요."],
      cons: ["장시간 몰입은 쉽게 지쳐요."],
      advice: "짧게 자주, 환경부터 정리하세요. 작은 성취로 흐름을 만드세요.",
    },
  },
  document: {
    anchor: (s) => s.resource,       // 인성 = 문서·계약·부동산·자격
    강: {
      summary: "계약·문서·부동산·자격 등 ‘도장 찍는 일’에 기운이 붙어요.",
      pros: ["합격·승인·계약 성사의 기운이 있어요.", "자격·인증 취득에 유리해요."],
      cons: ["기운이 좋을수록 조건을 꼼꼼히 안 보고 서명하기 쉬워요.", "보증·명의 관련은 특히 신중해야 해요."],
      advice: "잘 풀릴 때일수록 계약서 조항을 두 번 확인. 명의·보증은 거리 두기.",
    },
    중: {
      summary: "무난한 문서 기운이에요. 준비를 갖추면 원하는 결과에 다가가요.",
      pros: ["서류·절차를 차근차근 밟기 좋아요."],
      cons: ["급하게 처리하면 실수·누락이 생겨요."],
      advice: "마감 전 여유를 두고 서류를 점검하세요.",
    },
    약: {
      summary: "지금은 문서·계약 운이 조용해요. 큰 서명은 때를 고르는 게 좋아요.",
      pros: ["준비·자료 정리에 집중하기 좋아요."],
      cons: ["서두른 계약·보증은 분쟁의 씨앗이 되기 쉬워요."],
      advice: "중요한 계약은 급하게 결정하지 말고 검토 시간을 확보하세요.",
    },
  },
};

/* 사업운 anchor 추가 */
C.business = {
  anchor: (s) => s.officer + s.wealth * 0.8 + s.output * 0.6,   // 관(직위)+재(수익)+식상(추진)
  강: {
    summary: "사업·확장의 기운이 강해요. 벌이고 키우는 데 운이 붙어요.",
    pros: ["새 사업·거래·확장에 유리해요.", "추진력과 수완이 성과로 이어져요."],
    cons: ["욕심이 커지면 무리한 확장으로 위험해져요.", "동업·자금 관리에서 갈등이 생기기 쉬워요."],
    advice: "벌이되 리스크를 나누세요. 계약·자금은 문서로 명확히.",
  },
  중: {
    summary: "무난한 사업 기운이에요. 기반을 다지며 한 걸음씩 키우기 좋아요.",
    pros: ["실무·거래를 착실히 쌓는 데 어울려요."],
    cons: ["큰 베팅보다 검증된 방식이 안전해요."],
    advice: "작게 시작해 데이터를 보고 키우세요.",
  },
  약: {
    summary: "지금은 확장보다 관리·준비의 시기예요. 무리한 시작은 조심.",
    pros: ["체력·자금을 비축하고 준비하기 좋아요."],
    cons: ["빚내서 벌이는 확장은 특히 위험해요."],
    advice: "지금은 지키고 배우는 때. 다음 기회를 위해 내실을 다지세요.",
  },
};
C.yearlove = C.love;   // 올해의 연애운 = 연애 십신 콘텐츠 재사용

/* 기간(월/년) 운세용 십신 그룹 테마 */
const GROUP_THEME = {
  비겁: { theme: "주도적으로 밀고 나가기 좋아요. 스스로 결정할수록 흐름이 붙어요.", love: "먼저 다가가기 좋지만 고집은 금물.", work: "주도권을 잡되 협업에선 공을 나눠요.", money: "지출·투자 욕구가 커요. 큰 결정은 미루기.", advice: "‘내가 한다’는 힘이 강해요. 주변과 보조를 맞추세요." },
  식상: { theme: "표현·활동·새 시도에 운이 따라요. 아이디어가 통합니다.", love: "매력 발산에 좋아요. 솔직한 표현이 통해요.", work: "기획·발표·콘텐츠에 유리해요.", money: "재능이 돈으로 이어질 기회.", advice: "떠오른 걸 실행에 옮기되 말실수는 조심." },
  재성: { theme: "돈·실속·인연에 기회가 열려요. 현실 감각이 살아나요.", love: "새 인연·설레는 만남이 생기기 쉬워요.", work: "성과·거래·실무에 유리해요.", money: "수입 기회가 보여요. 욕심만 눌러요.", advice: "기회를 잡되 감당 가능한 규모로." },
  관성: { theme: "책임·인정·중요한 일이 들어와요. 무게감이 커져요.", love: "진지한 관계·약속에 어울려요.", work: "승진·평가·중책에 좋아요.", money: "고정·의무 지출이 늘기 쉬워요.", advice: "책임 범위를 분명히 하고 압박은 나눠 지세요." },
  인성: { theme: "배우고 정리하고 회복하기 좋아요. 귀인의 도움도.", love: "안정적이고 편안한 교감에 어울려요.", work: "공부·문서·자격·준비에 유리해요.", money: "확장보다 지키고 관리하기 좋아요.", advice: "서두르지 말고 배움·휴식을 챙기되 실행은 미루지 마세요." },
};
const BRANCH_ELEM = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];
// 양력 월 → 월지 index (자0..해11): 절기 근사(참고용)
const MONTH_BRANCH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];
function sipOfElement(dayElem, el2) {
  if (el2 === dayElem) return "비겁";
  if (GEN[dayElem] === el2) return "식상";
  if (CTRL[dayElem] === el2) return "재성";
  if (CTRL_BY[dayElem] === el2) return "관성";
  return "인성";
}
function monthGroup(profile, month) { // month 1~12
  const br = MONTH_BRANCH[month - 1];
  return sipOfElement(profile.dayMasterElem, BRANCH_ELEM[br]);
}
// 그 달이 일간에게 얼마나 유리한지(행운의 달 계산용)
function monthFavor(profile, month, yong) {
  const br = MONTH_BRANCH[month - 1];
  const e = BRANCH_ELEM[br];
  let s = 50;
  if (yong.includes(e)) s += 22;                 // 용신 달
  if (RESOURCE[profile.dayMasterElem] === e) s += 10; // 인성
  if (CTRL_BY[profile.dayMasterElem] === e) s -= 8;   // 관성 압박
  return s + (month % 3) * 2;
}

/** 카탈로그 메타 */
export const TOPICS = [
  // 시간대별 종합
  { id: "today", name: "오늘의 운세", cost: 1, kind: "daily", blurb: "오늘 하루의 흐름·연애·일·돈·행운" },
  { id: "tomorrow", name: "내일의 운세", cost: 1, kind: "daily", blurb: "내일 하루 미리 보기" },
  { id: "weekday", name: "이번 평일 운세", cost: 1, kind: "daily", blurb: "이번 주 평일의 전반 흐름" },
  { id: "weekend", name: "이번 주말 운세", cost: 1, kind: "daily", blurb: "다가오는 주말의 기운" },
  { id: "month", name: "이달의 운세", cost: 2, kind: "period", blurb: "이번 달 전반의 흐름" },
  { id: "nextmonth", name: "다음달 운세", cost: 2, kind: "period", blurb: "다음 달 미리 보기" },
  { id: "year", name: "올해의 운세", cost: 3, kind: "period", blurb: "이번 해 전체 흐름" },
  // 연애운 — 시간대별
  { id: "todaylove", name: "오늘의 연애운", cost: 1, kind: "lovetime", blurb: "오늘 연애·인연의 기운" },
  { id: "tomorrowlove", name: "내일의 연애운", cost: 1, kind: "lovetime", blurb: "내일 연애·인연의 기운" },
  { id: "daylove", name: "지정일 연애운", cost: 2, kind: "lovetime", blurb: "데이트·고백할 날의 연애운" },
  { id: "monthlove", name: "이달의 연애운", cost: 2, kind: "lovetime", blurb: "이번 달 연애·인연 흐름" },
  { id: "yearlove", name: "올해의 연애운", cost: 3, kind: "saju", blurb: "올해 인연·매력·관계의 전반 흐름" },
  // 명식 기반 카테고리
  { id: "reunion", name: "재회운", cost: 3, kind: "saju", blurb: "다시 이어질 가능성과 조건" },
  { id: "breakup", name: "이별운", cost: 3, kind: "saju", blurb: "관계의 위기 신호와 지키는 법" },
  { id: "wealth", name: "재물운", cost: 2, kind: "saju", blurb: "돈의 흐름·기회·관리 포인트" },
  { id: "business", name: "사업운", cost: 2, kind: "saju", blurb: "확장·거래·자금의 기운" },
  { id: "study", name: "학업운", cost: 2, kind: "saju", blurb: "집중·시험·자격의 기운" },
  { id: "document", name: "문서운", cost: 2, kind: "saju", blurb: "계약·합격·부동산·자격" },
  // 행운의 달
  { id: "h1lucky", name: "상반기 행운의 달", cost: 2, kind: "lucky", blurb: "1~6월 중 기운 좋은 달" },
  { id: "h2lucky", name: "하반기 행운의 달", cost: 2, kind: "lucky", blurb: "7~12월 중 기운 좋은 달" },
];
export function topicMeta(id) { return TOPICS.find((t) => t.id === id); }

/** 카테고리 해석 생성 */
export function readTopic(profile, id, today = new Date()) {
  const meta = topicMeta(id);
  if (!meta) return null;
  if (meta.kind === "daily") return readDaily(profile, id, today);
  if (meta.kind === "period") return readPeriod(profile, id, today);
  if (meta.kind === "lovetime") return readLoveTime(profile, id, today);
  if (meta.kind === "lucky") return readLucky(profile, id, today);

  const s = sip(profile);
  const def = C[id];
  const total = s.peer + s.output + s.wealth + s.officer + s.resource || 1;
  const raw = def.anchor(s, profile.gender || profile.sex);
  const lv = level(raw, total);
  const body = def[lv];
  const luckyElem = RESOURCE[profile.dayMasterElem];
  return {
    kind: "saju", id, name: meta.name, emoji: meta.emoji,
    score: Math.max(20, Math.min(92, scoreFor(lv, profile, id))),
    level: lv,
    summary: body.summary, pros: body.pros, cons: body.cons, advice: body.advice,
    luckyColor: ELEM_COLOR[luckyElem], luckyElem: ELEM_KR[luckyElem],
  };
}

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function readPeriod(profile, id, today) {
  const meta = topicMeta(id);
  const luckyElem = RESOURCE[profile.dayMasterElem];
  if (id === "year") {
    const yr = today.getFullYear();
    const g = monthGroup(profile, ((yr % 12) || 12)); // 근사 연 십신
    const t = GROUP_THEME[g];
    const months = luckyTop(profile, 1, 12, 3);
    return {
      kind: "period", id, name: meta.name, label: `${yr}년`,
      group: g, score: 52 + (yr % 5) * 4,
      theme: t.theme, love: t.love, work: t.work, money: t.money, advice: t.advice,
      goodMonths: months,
      luckyColor: ELEM_COLOR[luckyElem], luckyElem: ELEM_KR[luckyElem],
    };
  }
  // month / nextmonth
  const d = new Date(today);
  if (id === "nextmonth") d.setMonth(d.getMonth() + 1);
  const m = d.getMonth() + 1;
  const g = monthGroup(profile, m);
  const t = GROUP_THEME[g];
  return {
    kind: "period", id, name: meta.name, label: `${d.getFullYear()}년 ${MONTH_NAMES[m - 1]}`,
    group: g, score: monthFavor(profile, m, [luckyElem]) + 4,
    theme: t.theme, love: t.love, work: t.work, money: t.money, advice: t.advice,
    luckyColor: ELEM_COLOR[luckyElem], luckyElem: ELEM_KR[luckyElem],
  };
}

function readLoveTime(profile, id, today) {
  const meta = topicMeta(id);
  const luckyElem = RESOURCE[profile.dayMasterElem];
  if (id === "todaylove" || id === "tomorrowlove" || id === "daylove") {
    const target = new Date(today);
    if (id === "tomorrowlove") target.setDate(target.getDate() + 1);
    const f = todayFortune(profile, target);
    const label = id === "todaylove" ? "오늘" : id === "tomorrowlove" ? "내일" : `${target.getMonth() + 1}월 ${target.getDate()}일`;
    return {
      kind: "lovetime", id, name: meta.name, label, date: f.date, iljin: f.iljin,
      score: 50 + (target.getDate() % 40),
      headline: f.love,
      love: f.love,
      tip: `${label}은 ` + (/\b매력|먼저|솔직/.test(f.love) ? "먼저 표현해도 좋은 날" : "무리하지 말고 편안하게 다가가는 날") + "이에요.",
      luckyColor: f.luckyColor, luckyElem: f.luckyElem,
    };
  }
  // monthlove
  const d = new Date(today);
  const m = d.getMonth() + 1;
  const g = monthGroup(profile, m);
  const t = GROUP_THEME[g];
  return {
    kind: "lovetime", id, name: meta.name, label: `${MONTH_NAMES[m - 1]}`,
    score: monthFavor(profile, m, [luckyElem]) + (m % 4) * 2,
    headline: t.love,
    love: t.love,
    tip: `이번 달은 ${g} 기운이 도드라져요. ${g === "재성" ? "새 인연·설렘의 기회가 늘어요." : g === "관성" ? "진지한 관계로 나아가기 좋아요." : g === "인성" ? "편안하고 안정적인 교감에 어울려요." : g === "식상" ? "매력을 드러내기 좋아요." : "먼저 다가가되 고집은 조심."}`,
    luckyColor: ELEM_COLOR[luckyElem], luckyElem: ELEM_KR[luckyElem],
  };
}

function luckyTop(profile, from, to, n) {
  const yong = [RESOURCE[profile.dayMasterElem], profile.dayMasterElem];
  const arr = [];
  for (let m = from; m <= to; m++) arr.push({ m, s: monthFavor(profile, m, yong) });
  arr.sort((a, b) => b.s - a.s);
  return arr.slice(0, n).map((x) => x.m).sort((a, b) => a - b);
}

function readLucky(profile, id, today) {
  const meta = topicMeta(id);
  const half = id === "h1lucky" ? [1, 6] : [7, 12];
  const yong = [RESOURCE[profile.dayMasterElem], profile.dayMasterElem];
  const scored = [];
  for (let m = half[0]; m <= half[1]; m++) scored.push({ m, s: monthFavor(profile, m, yong) });
  scored.sort((a, b) => b.s - a.s);
  const best = scored.slice(0, 2).map((x) => x.m).sort((a, b) => a - b);
  const luckyElem = RESOURCE[profile.dayMasterElem];
  return {
    kind: "lucky", id, name: meta.name, label: id === "h1lucky" ? "상반기(1~6월)" : "하반기(7~12월)",
    bestMonths: best,
    detail: scored.sort((a, b) => a.m - b.m).map((x) => ({ month: x.m, level: x.s >= 68 ? "좋음" : x.s >= 55 ? "무난" : "조용" })),
    advice: `${best.map((m) => MONTH_NAMES[m - 1]).join("·")}에 중요한 일·시작·만남을 배치하면 기운이 받쳐 줘요. 반대로 조용한 달엔 무리한 확장보다 준비를 권해요.`,
    luckyColor: ELEM_COLOR[luckyElem], luckyElem: ELEM_KR[luckyElem],
  };
}

function readDaily(profile, id, today) {
  const target = new Date(today);
  if (id === "tomorrow") target.setDate(target.getDate() + 1);
  else if (id === "weekday") { // 다음 평일
    do { target.setDate(target.getDate() + (target.getDay() === 5 ? 3 : target.getDay() === 6 ? 2 : 1)); } while (target.getDay() === 0 || target.getDay() === 6);
  } else if (id === "weekend") { // 다가오는 토요일
    const add = (6 - target.getDay() + 7) % 7 || 7;
    target.setDate(target.getDate() + (target.getDay() === 6 ? 0 : add));
  }
  const f = todayFortune(profile, target);
  const meta = topicMeta(id);
  const label = id === "today" ? "오늘" : id === "tomorrow" ? "내일" : id === "weekday" ? "이번 평일" : "이번 주말";
  return {
    kind: "daily", id, name: meta.name, emoji: meta.emoji, label,
    date: f.date, iljin: f.iljin, iljinH: f.iljinH,
    theme: f.theme, love: f.love, work: f.work, money: f.money, advice: f.advice,
    luckyColor: f.luckyColor, luckyElem: f.luckyElem,
  };
}
