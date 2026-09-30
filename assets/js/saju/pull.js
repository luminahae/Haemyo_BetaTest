/* =========================================================
   내 매력 사주 — '끌림' 해석 (재미·참고용)
   일간 오행으로 끌림 타입을, 도화·홍염·화개와 십신 균형으로
   '빠져드는 지수'와 매력 포인트를 그린다.
   원칙: 상대를 조종하는 기술이 아니라, 내가 가진 매력을 알고
   건강하게 드러내는 법을 알려 준다. 미래를 확정하지 않는다.
   ========================================================= */

import { charmSpirits, dayNightStyle, godTally, idealType } from "./spouse.js";

const STEM_ELEM = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
const STEM_KR = ["갑목", "을목", "병화", "정화", "무토", "기토", "경금", "신금", "임수", "계수"];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* 일간 오행별 끌림 타입 */
const TYPE = {
  wood: {
    name: "곁에 두고 싶은 새싹형",
    hook: "함께 있으면 나까지 자라는 느낌을 주는 사람이에요. 상대는 당신 옆에서 ‘더 괜찮은 사람’이 된 기분을 잊지 못해요.",
    points: ["곧고 솔직한 태도 — 계산 없는 말이 오히려 오래 남아요.", "상대의 꿈을 진심으로 응원해 주는 따뜻함", "같이 무언가를 시작하고 싶게 만드는 생기"],
    weak: "든든하고 책임감 있는 사람, 당신을 지켜 주고 싶어 하는 타입이 특히 깊게 빠져요.",
    fade: "상대를 바꾸려고 가르치듯 말하기 시작하면 매력이 잔소리로 바뀌어요.",
  },
  fire: {
    name: "잊히지 않는 햇살형",
    hook: "당신이 있는 자리는 공기부터 달라요. 헤어지고 나서도 그 밝은 온도가 그리워지는 사람이에요.",
    points: ["감정을 숨기지 않는 표정과 리액션", "처음 만난 사람도 편하게 만드는 분위기", "좋아하는 걸 말할 때 반짝이는 눈빛"],
    weak: "차분하고 속이 깊은 사람, 평소 감정 표현이 서툰 타입이 당신의 온기에 오래 머물러요.",
    fade: "기분에 따라 온도가 너무 크게 오르내리면 상대가 지치기 쉬워요.",
  },
  earth: {
    name: "돌아가고 싶은 안식처형",
    hook: "화려하게 붙잡지 않아도, 지친 날 가장 먼저 떠오르는 사람이에요. 편안함이 곧 중독이 되는 타입이에요.",
    points: ["말없이 챙겨 주는 세심함", "쉽게 흔들리지 않는 안정감", "약속을 지키는 믿음직함"],
    weak: "바쁘고 경쟁이 심한 곳에서 사는 사람, 늘 긴장하며 사는 타입이 당신 곁에서 쉬고 싶어 해요.",
    fade: "다 받아 주기만 하면 당연해져요. 서운한 건 서운하다고 말해야 존재감이 살아요.",
  },
  metal: {
    name: "쉽게 가질 수 없는 보석형",
    hook: "기준이 분명하고 선이 또렷해서, 상대가 ‘더 알고 싶다’고 느끼게 되는 사람이에요. 다가갈수록 새로운 면이 보여요.",
    points: ["자기 취향과 기준이 확실한 세련됨", "빈말하지 않는 담백함", "필요할 땐 단호하게 끊어 내는 결단력"],
    weak: "자유롭고 즉흥적인 사람, 쉽게 사람을 사귀는 인기형이 오히려 당신 앞에서 진지해져요.",
    fade: "완벽함을 요구하는 말투가 쌓이면 상대가 평가받는 기분을 느껴요.",
  },
  water: {
    name: "알수록 깊어지는 호수형",
    hook: "한 번에 다 보여 주지 않는 깊이가 있어요. 대화할수록 더 궁금해져서 자꾸 생각나는 사람이에요.",
    points: ["상대 마음을 먼저 읽어 주는 공감력", "대화가 끊기지 않는 센스와 유연함", "은근하게 풍기는 분위기와 여운"],
    weak: "열정적이고 직진하는 사람, 에너지가 넘치는 타입이 당신의 차분함에 빠져들어요.",
    fade: "속마음을 너무 오래 숨기면, 상대는 당신이 자기에게 관심 없다고 오해해요.",
  },
};

/* 반전 스타일별 한 줄 */
const STYLE_TIP = {
  "겉바속바": "좋아하는 마음을 숨기지 않는 솔직함이 무기예요. 대신 속도는 상대와 맞춰 가세요.",
  "낮져밤이": "처음엔 차분한데 가까워질수록 드러나는 반전이, 상대가 당신을 잊지 못하는 이유예요.",
  "낮이밤이": "관계를 이끄는 힘이 커요. 가끔은 상대에게 리드를 맡기면 상대가 더 깊이 들어와요.",
  "낮져밤져": "천천히 스며드는 타입이라, 한번 마음을 연 뒤의 깊이가 상대를 붙잡아요.",
};

/** 끌림 해석 */
export function pullReading(profile) {
  const stem = profile.pillars.day.stemIdx;
  const elem = STEM_ELEM[stem];
  const type = TYPE[elem];
  const charm = charmSpirits(profile);
  const style = dayNightStyle(profile);
  const { group } = godTally(profile);

  // 빠져드는 지수 — 매력 신살 + 표현(식상) + 교류(재성) + 안정(인성)
  let s = 48;
  if (charm.dohwa) s += 14;
  if (charm.hongyeom) s += 12;
  if (charm.hwagae) s += 6;
  s += clamp(group.식상, 0, 3) * 5;
  s += clamp(group.재성, 0, 3) * 3;
  s += clamp(group.인성, 0, 2) * 3;
  s -= clamp(group.비겁 - 3, 0, 3) * 3;
  const score = clamp(Math.round(s), 35, 97);
  const grade = score >= 85 ? "헤어나올 수 없음" : score >= 72 ? "자꾸 생각남" : score >= 58 ? "은근히 스며듦" : "천천히 깊어짐";

  const badges = charm.items.filter((it) => it.on).map((it) => it.key);
  const secret = [];
  if (charm.dohwa) secret.push("도화살이 있어 처음 본 순간부터 눈길을 끄는 힘이 있어요.");
  if (charm.hongyeom) secret.push("홍염살이 있어 가만히 있어도 분위기로 끌어당겨요. 꾸미지 않은 모습이 오히려 치명적이에요.");
  if (charm.hwagae) secret.push("화개살이 있어 남들과 다른 취향과 깊이가 있어요. ‘이런 사람은 처음’이라는 인상을 남겨요.");
  if (group.식상 >= 2) secret.push("표현의 기운(식상)이 강해, 말투와 리액션이 기억에 오래 남아요.");
  if (group.재성 >= 2) secret.push("사람과 주고받는 감각(재성)이 좋아, 함께 있는 시간이 즐겁다는 느낌을 줘요.");
  if (group.인성 >= 2) secret.push("품어 주는 기운(인성)이 있어, 상대가 약한 모습까지 꺼내 보이게 만들어요.");
  if (!secret.length) secret.push("눈에 띄는 한 방보다, 함께할수록 편해지는 은근한 매력이 강해요. 시간이 당신 편이에요.");

  // 자꾸 생각나게 만드는 법 — 조종이 아니라 매력을 드러내는 방법
  const moves = [
    `당신의 무기는 ‘${type.points[0].split(" — ")[0]}’. 이걸 숨기지 말고 자연스럽게 보여 주세요.`,
    "내 일상과 취미를 꽉 채워 두세요. 자기 세계가 있는 사람은 상대가 먼저 궁금해해요.",
    "좋았던 순간엔 ‘오늘 좋았어’라고 짧게 말해 주세요. 구체적인 칭찬 한 마디가 가장 오래 남아요.",
    STYLE_TIP[style.key] || "나만의 속도를 지키세요.",
  ];

  return {
    stemKr: STEM_KR[stem],
    type, score, grade, badges, secret, moves,
    style,
    healthy: "진짜 끌림은 상대를 불안하게 만드는 게 아니라, 곁에 있을 때 편하고 떨어져 있을 때 보고 싶게 만드는 거예요. 연락을 일부러 끊거나 질투를 유발하는 방식은 잠깐은 통해도 관계를 빨리 지치게 해요.",
  };
}

/* =========================================================
   두 사람 끌림 분석 — 나와 그 사람의 사주를 함께 넣어,
   그 사람이 왜·얼마나 나에게 빠질 수 있는지와
   그 사람 사주에 맞는 다가가는 법을 푼다.
   ========================================================= */
import { harmonyBetween, monthlyFlow } from "./relationship.js";

const ELEM_KR = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
const GEN = { wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" };   // 생
const CTRL = { wood: "earth", fire: "metal", earth: "water", metal: "wood", water: "fire" };  // 극
const CTRL_BY = { wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth" };

/* 그 사람의 일간 오행별 — 무엇에 빠지는 사람인가 */
const PARTNER_KEY = {
  wood: {
    core: "자기를 알아봐 주고 성장을 응원해 주는 사람에게 깊이 빠져요.",
    do: ["그 사람의 목표나 요즘 하는 일을 기억해 두었다가 먼저 물어봐 주세요.", "새로운 걸 같이 시작해 보자고 제안하세요. 함께 자라는 느낌이 곧 애정이 돼요.", "잘한 점을 구체적으로 인정해 주세요. ‘그거 진짜 잘했다’ 한마디가 오래 남아요."],
    avoid: ["가르치듯 말하거나 방식을 바꾸라고 몰아붙이기", "그 사람의 계획을 가볍게 넘기기"],
  },
  fire: {
    core: "함께 있을 때 즐겁고, 자기 이야기에 크게 반응해 주는 사람에게 빠져요.",
    do: ["그 사람 이야기에 표정과 리액션으로 확실히 반응해 주세요.", "평범한 날을 특별하게 만드는 작은 이벤트가 잘 통해요.", "칭찬은 아끼지 말고, 사람들 앞에서 살짝 세워 주세요."],
    avoid: ["무반응, 시큰둥한 답장", "그 사람의 열정을 식히는 냉정한 평가"],
  },
  earth: {
    core: "한결같고 믿을 수 있는 사람, 곁에 있으면 편한 사람에게 빠져요.",
    do: ["작은 약속부터 꼭 지키세요. 신뢰가 쌓일수록 마음이 깊어져요.", "일상을 자연스럽게 공유하세요. 매일의 작은 연락이 큰 이벤트보다 강해요.", "그 사람이 챙겨 줄 때 고마움을 꼭 말로 표현하세요."],
    avoid: ["기분에 따라 태도가 확 바뀌는 변덕", "갑작스러운 변화나 결정을 몰아붙이기"],
  },
  metal: {
    core: "자기 기준과 자존감이 분명한 사람, 쉽게 가질 수 없는 사람에게 빠져요.",
    do: ["내 의견과 취향을 분명하게 말하세요. 다 맞춰 주는 사람보다 기준 있는 사람에게 끌려요.", "자기 관리와 내 일에 집중하는 모습을 보여 주세요.", "약속과 시간 약속은 칼같이 지키세요."],
    avoid: ["매달리거나 감정적으로 떼쓰기", "애매한 태도로 계속 떠보기"],
  },
  water: {
    core: "깊은 대화가 되고, 알수록 새로운 면이 보이는 사람에게 빠져요.",
    do: ["늦은 밤 긴 대화처럼 속 이야기를 나눌 시간을 만드세요.", "그 사람의 말을 끝까지 들어 주고, 감정을 먼저 알아봐 주세요.", "한 번에 다 보여 주기보다 조금씩 나를 드러내며 여운을 남기세요."],
    avoid: ["답을 재촉하거나 몰아붙이기", "속마음을 억지로 캐묻기"],
  },
};

/* 그 사람 일간별 — 단계별로 빠지게 만드는 법 */
const STEPS = {
  wood: [
    "관심 끌기 — 그 사람이 요즘 빠져 있는 일이나 목표를 먼저 물어보세요. ‘그거 어떻게 돼 가?’ 한마디로 ‘나를 알아봐 주는 사람’이 돼요.",
    "가까워지기 — 같이 새로운 걸 해 보자고 하세요. 처음 가 보는 동네, 같이 배우는 취미처럼 ‘함께 시작하는 경험’이 쌓일수록 당신이 특별해져요.",
    "깊이 빠지게 하기 — 그 사람이 힘들 때 해결책보다 ‘너라면 할 수 있어’라는 믿음을 주세요. 자기를 믿어 주는 사람은 목(木) 일간이 절대 못 놓아요.",
  ],
  fire: [
    "관심 끌기 — 그 사람 말에 크게 웃고 확실하게 반응해 주세요. 불(火) 일간은 자기 이야기가 즐겁게 받아들여질 때 바로 마음이 움직여요.",
    "가까워지기 — 평범한 날을 이벤트처럼 만드세요. 즉흥 드라이브, 사진 남기기, 작은 서프라이즈가 잘 통해요.",
    "깊이 빠지게 하기 — 사람들 앞에서 그 사람을 은근히 세워 주고, 둘만 있을 땐 솔직한 칭찬을 해 주세요. ‘이 사람 앞에서 내가 제일 빛난다’는 느낌이 곧 중독이에요.",
  ],
  earth: [
    "관심 끌기 — 작은 약속부터 정확히 지키세요. 토(土) 일간은 말보다 ‘믿을 만한 사람인가’를 먼저 봐요.",
    "가까워지기 — 매일 짧게라도 일상을 나누세요. 밥 먹었는지, 오늘 어땠는지 같은 꾸준한 연락이 큰 이벤트보다 강해요.",
    "깊이 빠지게 하기 — 그 사람이 챙겨 줄 때 고맙다고 꼭 말로 표현하고, 가끔은 당신이 먼저 챙겨 주세요. ‘이 사람 곁이 제일 편하다’가 되면 떠나지 못해요.",
  ],
  metal: [
    "관심 끌기 — 다 맞춰 주지 말고 내 취향과 의견을 분명히 말하세요. 금(金) 일간은 기준이 있는 사람에게 먼저 호기심을 느껴요.",
    "가까워지기 — 약속 시간, 말한 것은 칼같이 지키고, 내 일과 자기 관리에 집중하는 모습을 보여 주세요. ‘쉽게 가질 수 없는 사람’이라는 인상이 끌림을 키워요.",
    "깊이 빠지게 하기 — 그 사람이 흔들릴 때 감정이 아니라 차분한 정리로 도와주세요. 자기보다 단단한 면을 본 순간, 금 일간은 깊게 기대요.",
  ],
  water: [
    "관심 끌기 — 가벼운 대화 중에 한 번씩 깊은 질문을 던지세요. ‘요즘 제일 고민되는 게 뭐야?’ 같은 질문이 수(水) 일간의 마음 문을 열어요.",
    "가까워지기 — 늦은 밤 통화나 조용한 카페처럼 긴 대화를 나눌 시간을 만드세요. 말을 끝까지 들어 주고 감정을 먼저 알아봐 주세요.",
    "깊이 빠지게 하기 — 한 번에 다 보여 주지 말고 조금씩 새로운 면을 꺼내세요. 알수록 더 궁금한 사람이 되면, 수 일간은 계속 당신을 생각해요.",
  ],
};
/* 그 사람에게 부족한 오행을 채워 주는 행동 */
const FILL = {
  wood: "새로운 계획이나 성장 이야기를 자주 꺼내고, 산책처럼 자연 속에서 만나세요.",
  fire: "밝게 웃고 리액션을 크게 해 주세요. 활동적인 데이트가 그 사람의 빈 곳을 채워요.",
  earth: "밥을 챙기고 일정한 연락 리듬을 지켜 주세요. 안정감 자체가 선물이에요.",
  metal: "고민을 깔끔하게 정리해 주고, 결정이 필요할 때 분명하게 말해 주세요.",
  water: "감정을 들어 주는 깊은 대화, 조용한 밤 데이트가 그 사람을 채워요.",
};
const FLOW_TIP = {
  same: "둘이 너무 비슷해 설렘이 금방 식을 수 있어요. 가끔은 그 사람이 모르는 나의 다른 면을 보여 주세요.",
  nourish: "당신이 줄수록 그 사람이 기대는 구조예요. 다 주지 말고, 그 사람이 당신을 위해 무언가 할 기회도 남겨 두세요.",
  receive: "그 사람은 줄수록 마음이 깊어지는 타입이에요. 부탁을 하고, 받은 것에 크게 고마워해 주세요.",
  lead: "당신이 주도권을 쥐는 조합이에요. 가끔 결정을 그 사람에게 맡기면 긴장감과 애정이 함께 커져요.",
  led: "그 사람이 리드하고 싶어 해요. 따라가 주되, 중요한 순간엔 당신의 기준을 분명히 보여 주세요.",
};

/* 나→그 사람 오행 관계 */
function flowBetween(me, you) {
  if (me === you) return { key: "same", bonus: 4, line: "두 사람의 일간 오행이 같아, 말하지 않아도 통하는 친구 같은 편안함이 있어요. 설렘을 만들려면 서로 다른 면을 보여 주는 게 중요해요." };
  if (GEN[me] === you) return { key: "nourish", bonus: 10, line: "당신의 기운이 그 사람을 살려 주는(생하는) 관계예요. 그 사람은 당신 곁에서 힘을 얻고 편안해져, 점점 당신에게 기대게 돼요." };
  if (GEN[you] === me) return { key: "receive", bonus: 7, line: "그 사람의 기운이 당신을 살려 주는 관계예요. 그 사람은 당신에게 무언가를 해 주고 싶어 하고, 줄수록 마음이 깊어지는 타입이에요." };
  if (CTRL[me] === you) return { key: "lead", bonus: 6, line: "당신이 그 사람을 이끄는(극하는) 관계예요. 그 사람에게 당신은 긴장되면서도 끌리는 존재예요. 너무 누르면 지치니 강약 조절이 필요해요." };
  return { key: "led", bonus: 3, line: "그 사람이 당신을 이끄는 관계예요. 그 사람이 주도권을 쥐었다고 느낄 때 마음을 열기 쉬워요. 대신 당신이 끌려가기만 하면 긴장감이 사라져요." };
}

/**
 * @param me       computeSaju 결과(나)
 * @param you      computeSaju 결과(그 사람)
 * @param youInput 그 사람 입력(성별·이름)
 */
export function pullPair(me, you, youInput) {
  const myElem = STEM_ELEM[me.pillars.day.stemIdx];
  const yElem = STEM_ELEM[you.pillars.day.stemIdx];
  const yName = (youInput && youInput.name) || "그 사람";
  const ySex = youInput && youInput.gender === "male" ? "male" : "female";

  let s = 50;
  const reasons = [];
  const cautions = [];

  // 1) 그 사람 사주 속 '연인의 별' 오행 = 내 일간인가
  const yIdeal = ySex === "male" ? CTRL[yElem] : CTRL_BY[yElem];
  if (yIdeal === myElem) {
    s += 16;
    reasons.push(`${yName}의 사주에서 연인을 뜻하는 오행이 ${ELEM_KR[yIdeal]}인데, 당신의 일간이 바로 ${ELEM_KR[myElem]}이에요. 본능적으로 ‘내 사람’이라고 느끼기 쉬운 조합이에요.`);
  } else if ((you.elementCounts[yIdeal] || 0) === 0 && (me.elementCounts[yIdeal] || 0) >= 2) {
    s += 10;
    reasons.push(`${yName}의 사주에는 연인의 별(${ELEM_KR[yIdeal]})이 비어 있는데, 당신에게 그 기운이 넉넉해요. 그 사람이 평소 느끼지 못한 설렘을 당신에게서 느낄 수 있어요.`);
  }

  // 2) 그 사람에게 부족한 오행을 내가 채워 주는가
  const lack = Object.entries(you.elementCounts).sort((a, b) => a[1] - b[1])[0][0];
  const myHas = me.elementCounts[lack] || 0;
  if (myHas >= 2) {
    s += you.elementCounts[lack] === 0 ? 12 : 8;
    reasons.push(`${yName}에게 가장 부족한 기운은 ${ELEM_KR[lack]}인데, 당신은 이 기운을 ${myHas}개나 갖고 있어요. 곁에 있으면 빈 곳이 채워지는 느낌이라, 자꾸 찾게 되는 ‘중독성’이 생겨요.`);
  }

  // 3) 오행 흐름
  const flow = flowBetween(myElem, yElem);
  s += flow.bonus;

  // 4) 합·충
  const h = harmonyBetween(me, you, { a: "당신", b: yName });
  if (h.ganhap) { s += 14; reasons.push("두 사람의 일간이 천간합이에요. 만나면 서로 묶이는 힘이 강해, 쉽게 끊어 내기 어려운 인연이에요."); }
  if (h.dayRel === "육합") { s += 10; reasons.push("배우자 자리(일지)가 육합이에요. 함께 있을 때 몸과 마음이 편하게 맞물려요."); }
  else if (h.dayRel === "삼합") { s += 7; reasons.push("배우자 자리(일지)가 삼합이에요. 같은 방향을 볼 때 끌림이 커져요."); }
  else if (h.dayRel === "충") { s -= 4; cautions.push("배우자 자리(일지)가 충이에요. 끌림은 강렬하지만 부딪힘도 커요. 다툰 날엔 바로 결론 내지 말고 하루 두세요."); }
  else if (h.dayRel === "형" || h.dayRel === "해") { s -= 3; cautions.push(`배우자 자리(일지)가 ${h.dayRel}이에요. 사소한 말투에서 서운함이 쌓이기 쉬우니, 서운한 건 그날그날 짧게 풀어 주세요.`); }

  // 5) 그 사람의 매력 신살·연애 스타일
  const yCharm = charmSpirits(you);
  const yStyle = dayNightStyle(you);
  if (yCharm.dohwa) cautions.push(`${yName}은(는) 도화 기운이 있어 인기가 많은 편이에요. 불안해서 확인하려 들기보다, 당신만 줄 수 있는 편안함으로 차별화하세요.`);

  if (!reasons.length) reasons.push("눈에 띄는 운명적 코드보다, 함께 보내는 시간이 쌓일수록 깊어지는 조합이에요. 첫 끌림보다 꾸준함이 무기예요.");

  const score = clamp(Math.round(s), 32, 97);
  const grade = score >= 85 ? "헤어나올 수 없는 조합" : score >= 72 ? "자꾸 생각나는 조합" : score >= 58 ? "천천히 스며드는 조합" : "노력으로 깊어지는 조합";
  const key = PARTNER_KEY[yElem];

  // 빠지게 만드는 법 — 단계 + 두 사람 맞춤 팁
  const steps = STEPS[yElem].slice();
  const custom = [];
  if (myHas >= 1) custom.push(`${yName}에게 부족한 ${ELEM_KR[lack]} 기운을 채워 주세요 — ${FILL[lack]}`);
  else custom.push(`${yName}에게 부족한 ${ELEM_KR[lack]} 기운을 채워 주면 효과가 커요 — ${FILL[lack]}`);
  custom.push(FLOW_TIP[flow.key]);
  if (h.ganhap || h.dayRel === "육합" || h.dayRel === "삼합") custom.push("두 사람은 합이 있어 자주 볼수록 끌림이 커지는 조합이에요. 짧게라도 자주 만나는 게 길게 가끔 만나는 것보다 훨씬 효과적이에요.");
  if (h.dayRel === "충") custom.push("충이 있어 밀고 당길수록 오히려 멀어질 수 있어요. 이 조합은 솔직하고 편안한 태도가 가장 강한 무기예요.");

  // 그 사람 마음이 열리기 쉬운 달 (앞으로 6개월)
  const now = new Date();
  let timing = [];
  try {
    timing = monthlyFlow(you, ySex, now.getFullYear(), now.getMonth() + 1, 6).filter((m) => m.favorable).map((m) => `${m.y}년 ${m.m}월`);
  } catch { timing = []; }
  const timingLine = timing.length
    ? `${yName}의 연애 기운이 살아나는 달은 ${timing.slice(0, 3).join(", ")}이에요. 고백이나 중요한 데이트는 이때 잡아 보세요.`
    : `앞으로 6개월 동안 ${yName}의 연애 기운이 크게 튀는 달은 없어요. 서두르지 말고 꾸준히 거리를 좁혀 가세요.`;

  return {
    yName, myElemKr: ELEM_KR[myElem], yElemKr: ELEM_KR[yElem],
    score, grade, reasons, flow: flow.line,
    style: { title: yStyle.title, line: yStyle.line },
    core: key.core, doList: key.do, avoidList: key.avoid,
    steps, custom, timingLine,
    ideal: (() => {
      const it = idealType(you, ySex);
      const match = it.elem === myElem ? "딱 맞아요" : (GEN[it.elem] === myElem || GEN[myElem] === it.elem) ? "가까워요" : "거리가 있어요";
      const tip = it.elem === myElem
        ? "당신은 이미 그 사람의 이상형 오행을 타고났어요. 있는 그대로의 모습을 자주 보여 주는 것만으로 충분해요."
        : `그 사람의 이상형은 ${ELEM_KR[it.elem]} 기운이에요. ${FILL[it.elem]}`;
      return { line: it.line, look: it.look, elemKr: it.elemKr, match, tip };
    })(),
    yCount: loveCount(you, ySex),
    cautions,
    healthy: "상대를 불안하게 만들어 붙잡는 방식(연락 끊기, 질투 유발, 떠보기)은 잠깐은 통해도 관계를 빨리 지치게 해요. 그 사람이 당신 곁에서 편하고 즐거울수록, 떨어져 있을 때 더 생각나요.",
  };
}

/* ---------- 사주로 보는 연애 횟수 (재미용) ----------
   배우자성(남=재성, 여=관성) 개수 + 편재·편관(다양한 인연) + 도화·홍염 + 비겁 과다로 추정 */
export function loveCount(profile, gender) {
  const { group, each } = godTally(profile);
  const charm = charmSpirits(profile);
  const star = gender === "male" ? group.재성 : group.관성;
  const side = gender === "male" ? (each.편재 || 0) : (each.편관 || 0);
  let n = 2 + Math.min(star, 3) + Math.min(side, 2) * 0.5;
  if (charm.dohwa) n += 1;
  if (charm.hongyeom) n += 0.5;
  if (group.비겁 >= 3) n += 0.5;           // 경쟁·분산
  if (star === 0) n -= 0.5;               // 인연이 늦게·드물게
  const lo = Math.max(1, Math.round(n - 0.5)), hi = Math.min(9, lo + (n % 1 >= 0.5 ? 2 : 1));
  const line = lo <= 2
    ? "연애 횟수는 적은 편이에요. 쉽게 시작하지 않지만, 한 번 시작하면 오래 가는 타입이에요."
    : lo <= 4
      ? "평균적인 편이에요. 몇 번의 연애를 거치며 자기에게 맞는 사람을 알아 가는 타입이에요."
      : "연애 기회가 많은 편이에요. 인연이 자주 들어오는 만큼, 진짜 내 사람을 고르는 눈이 중요해요.";
  const why = [];
  why.push(star === 0 ? `사주에 ${gender === "male" ? "재성" : "관성"}(연인의 별)이 드러나 있지 않아 인연이 늦거나 드물게 와요.` : `사주에 연인의 별(${gender === "male" ? "재성" : "관성"})이 ${star}개 있어요.`);
  if (side) why.push(`${gender === "male" ? "편재" : "편관"}이 있어 다양한 유형의 인연과 엮이기 쉬워요.`);
  if (charm.dohwa) why.push("도화살이 있어 이성에게 인기가 많아요.");
  return { lo, hi, label: lo === hi ? `${lo}번` : `${lo}~${hi}번`, line, why };
}
