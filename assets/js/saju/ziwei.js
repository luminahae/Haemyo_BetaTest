import { solarToLunar } from "./astro.js";
/* =========================================================
   자미두수(紫微斗數) 명반 계산 엔진.
   - 음력 월·일·시 기반. (사주와 달리 입춘이 아니라 음력 정월/설날 기준의
     년간지를 사용한다.)
   - 명궁/신궁 → 오행국(납음) → 자미성 안성 → 14주성 배치 → 12궁 → 보조성 → 사화.
   - 궁 index 기준: 0=寅, 1=卯 … 순행. palaceBranch(i) = (i+2)%12 (자=0).
   - 자미성 안성법은 iztro(오픈소스)와 검색 예제(22일·목3국→亥)로 검증한 표준식.
   ========================================================= */


const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCH_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEM_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

// 12궁 이름 (명궁부터 역행)
const PALACE_NAMES = ["명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁",
  "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁"];

// 납음 오행 (60갑자 30쌍) → 국
const NAYIN_ELEM = [
  "금", "화", "목", "토", "금", "화", "수", "토", "금", "목",
  "수", "토", "화", "목", "수", "금", "화", "목", "토", "금",
  "화", "수", "토", "금", "목", "수", "토", "화", "목", "수",
];
const ELEM_TO_BUREAU = { 수: 2, 목: 3, 금: 4, 토: 5, 화: 6 };
const BUREAU_NAME = { 2: "수이국(水二局)", 3: "목삼국(木三局)", 4: "금사국(金四局)", 5: "토오국(土五局)", 6: "화육국(火六局)" };

const mod = (n, m) => ((n % m) + m) % m;
const fix = (i) => mod(i, 12);
const palaceBranch = (idx) => (idx + 2) % 12; // 궁 index → 지지 index(자=0)

// 사화표: 년간 → [화록, 화권, 화과, 화기] (中州派 표준)
const SIHUA = {
  갑: ["염정", "파군", "무곡", "태양"],
  을: ["천기", "천량", "자미", "태음"],
  병: ["천동", "천기", "문창", "염정"],
  정: ["태음", "천동", "천기", "거문"],
  무: ["탐랑", "태음", "우필", "천기"],
  기: ["무곡", "탐랑", "천량", "문곡"],
  경: ["태양", "무곡", "태음", "천동"],
  신: ["거문", "태양", "문곡", "문창"],
  임: ["천량", "자미", "좌보", "무곡"],
  계: ["파군", "거문", "태음", "탐랑"],
};
const SIHUA_LABEL = ["화록(祿)", "화권(權)", "화과(科)", "화기(忌)"];

// 녹존 지지 (년간)
const LU_BRANCH = { 갑: "인", 을: "묘", 병: "사", 정: "오", 무: "사", 기: "오", 경: "신", 신: "유", 임: "해", 계: "자" };

export function computeZiwei(input) {
  // 1) 음력 월·일 + 윤달 + 시지
  let lunar;
  if (input.calendarType === "lunar") {
    const [y, m, d] = input.birthDate.split("-").map(Number);
    lunar = { year: y, month: m, day: d, isLeap: !!input.leapMonth };
  } else {
    const [y, m, d] = input.birthDate.split("-").map(Number);
    lunar = solarToLunar(y, m, d, 9);
  }
  const month = lunar.month;
  const day = lunar.day;

  // 시지: 미상이면 午시(정오) 가정 + 플래그
  const timeUnknown = !!input.timeUnknown;
  const hh = timeUnknown ? 12 : Number((input.birthTime || "12:00").split(":")[0]);
  const mm = timeUnknown ? 0 : Number((input.birthTime || "12:00").split(":")[1]);
  const hourIndex = mod(Math.floor((hh * 60 + mm + 60) / 120), 12); // 子=0

  // 2) 년간지 (음력 정월 기준)
  const yStem = mod(lunar.year - 1984, 10);
  const yBranch = mod(lunar.year - 1984, 12);
  const yearStemKr = STEMS[yStem];

  // 3) 명궁·신궁 (index 0=寅)
  const mingIndex = fix((month - 1) - hourIndex);
  const shenIndex = fix((month - 1) + hourIndex);

  // 4) 명궁 천간 → 오행국(납음)
  const tigerStem = mod(yStem * 2 + 2, 10); // 五虎遁: 寅궁 천간
  const mingBranch = palaceBranch(mingIndex);
  const stepsFromYin = mod(mingBranch - 2, 12);
  const mingStem = mod(tigerStem + stepsFromYin, 10);
  const k = sexagenary(mingStem, mingBranch);
  const bureau = ELEM_TO_BUREAU[NAYIN_ELEM[Math.floor(k / 2)]];

  // 5) 자미성 안성
  const ziweiIndex = ziweiStart(bureau, day);
  const tianfuIndex = fix(12 - ziweiIndex);

  // 6) 14주성 배치
  const stars = {}; // palaceIndex → [{name, sihua}]
  const put = (name, idx) => { (stars[idx] = stars[idx] || []).push({ name }); };
  // 자미계열 (역행)
  put("자미", fix(ziweiIndex));
  put("천기", fix(ziweiIndex - 1));
  put("태양", fix(ziweiIndex - 3));
  put("무곡", fix(ziweiIndex - 4));
  put("천동", fix(ziweiIndex - 5));
  put("염정", fix(ziweiIndex - 8));
  // 천부계열 (순행)
  put("천부", fix(tianfuIndex));
  put("태음", fix(tianfuIndex + 1));
  put("탐랑", fix(tianfuIndex + 2));
  put("거문", fix(tianfuIndex + 3));
  put("천상", fix(tianfuIndex + 4));
  put("천량", fix(tianfuIndex + 5));
  put("칠살", fix(tianfuIndex + 6));
  put("파군", fix(tianfuIndex + 10));

  // 7) 주요 보조성
  put("좌보", fix(2 + (month - 1)));
  put("우필", fix(8 - (month - 1)));
  put("문창", fix(8 - hourIndex));
  put("문곡", fix(2 + hourIndex));
  const luBranch = BRANCHES.indexOf(LU_BRANCH[yearStemKr]);
  const luIdx = fix(luBranch - 2);
  put("녹존", luIdx);
  put("경양", fix(luIdx + 1));
  put("타라", fix(luIdx - 1));

  // 8) 사화 부여
  const sihuaMap = {}; // starName → label
  const sh = SIHUA[yearStemKr];
  sh.forEach((starName, i) => { sihuaMap[starName] = SIHUA_LABEL[i]; });
  for (const idx of Object.keys(stars)) {
    for (const s of stars[idx]) if (sihuaMap[s.name]) s.sihua = sihuaMap[s.name];
  }

  // 9) 12궁 조립
  const palaces = [];
  for (let i = 0; i < 12; i++) {
    palaces.push({
      index: i,
      branch: BRANCHES[palaceBranch(i)],
      branchH: BRANCH_H[palaceBranch(i)],
      name: PALACE_NAMES[fix(mingIndex - i)],
      isMing: i === mingIndex,
      isShen: i === shenIndex,
      stars: (stars[i] || []),
    });
  }

  // 명궁 주성 (없으면 공궁 → 대궁 차성)
  const mingStars = (stars[mingIndex] || []).map((s) => s.name);
  const oppStars = (stars[fix(mingIndex + 6)] || []).map((s) => s.name);

  return {
    isZiwei: true,
    lunar, hourIndex,
    yearGZ: STEMS[yStem] + BRANCHES[yBranch],
    yearGZH: STEM_H[yStem] + BRANCH_H[yBranch],
    mingIndex, shenIndex,
    mingBranch: BRANCHES[palaceBranch(mingIndex)],
    shenBranch: BRANCHES[palaceBranch(shenIndex)],
    bureau, bureauName: BUREAU_NAME[bureau],
    ziweiBranch: BRANCHES[palaceBranch(ziweiIndex)],
    palaces,
    mingStars, oppStars,
    sihua: sh.map((star, i) => ({ label: SIHUA_LABEL[i], star })),
    timeUnknown,
  };
}

/* 자미성 시작 궁 index (iztro 검증식) */
function ziweiStart(bureau, day) {
  let remainder = -1, offset = -1, quotient = 0;
  do {
    offset++;
    const divisor = day + offset;
    quotient = Math.floor(divisor / bureau);
    remainder = divisor % bureau;
  } while (remainder !== 0);
  quotient %= 12;
  let idx = quotient - 1;
  idx += offset % 2 === 0 ? offset : -offset;
  return fix(idx);
}

/* 천간(0-9)·지지(0-11) → 60갑자 index(0-59) */
function sexagenary(stem, branch) {
  for (let t = 0; t < 6; t++) {
    const kk = stem + 10 * t;
    if (kk % 12 === branch) return kk;
  }
  return 0;
}

/* ===== (합침) ziweiData.js ===== */
/* 자미두수 해석 콘텐츠 — 명궁 주성별 성향 + 12궁 의미.
   톤: 장점의 부작용과 그림자를 함께, 확정적 예언 금지, 참고 자료. */

export const STAR_MEANING = {
  자미: {
    tag: "제왕성 (帝王星)",
    persona: "중심에 서서 방향을 잡으려는 리더 기질입니다. 존중받고 싶어 하고, 품위와 체면을 중요하게 여깁니다.",
    strength: "위기에서 침착하게 판을 정리하고, 사람을 아우르는 무게감이 있습니다.",
    shadow: "인정 욕구가 과하면 고집·자존심으로 비치고, 주변의 조언을 흘려듣기 쉽습니다. 보좌(좌보·우필)가 없으면 외로운 리더가 되기도 합니다.",
    advice: "권위를 세우기보다 신뢰를 쌓는 데 힘을 쓰고, 곁의 사람에게 실제 권한을 나눠 주세요.",
  },
  천기: {
    tag: "지혜성 (智慧星)",
    persona: "머리 회전이 빠르고 기획·분석에 강합니다. 변화를 읽고 대안을 잘 떠올립니다.",
    strength: "복잡한 상황을 구조화하고, 임기응변과 학습이 빠릅니다.",
    shadow: "생각이 너무 많아 결정을 미루거나, 걱정과 잔머리로 에너지를 소모하기 쉽습니다. 관심이 자주 바뀌어 한 우물을 놓칠 수 있습니다.",
    advice: "생각을 실행으로 옮기는 마감 기한을 정하고, 벌인 일을 끝맺는 훈련을 하세요.",
  },
  태양: {
    tag: "광명성 (光明星)",
    persona: "밝고 베푸는 기질로, 앞에 나서 이끌고 책임지려 합니다. 공적인 일과 명분에 끌립니다.",
    strength: "적극적이고 헌신적이며, 사람들에게 힘과 방향을 줍니다.",
    shadow: "다 짊어지려다 소진되고, 인정이 돌아오지 않으면 서운함이 큽니다. 지나치면 참견·과시로 보일 수 있습니다.",
    advice: "베푸는 만큼 자신을 돌보고, 도움은 요청받을 때 주는 연습을 하세요.",
  },
  무곡: {
    tag: "재성·장군성 (財星)",
    persona: "결단력 있고 실행이 빠른 현실주의자입니다. 목표와 성과, 돈에 대한 감각이 뚜렷합니다.",
    strength: "추진력과 책임감이 강해 맡은 일을 끝까지 해냅니다.",
    shadow: "강직함이 과하면 융통성이 부족하고, 감정 표현이 서툴러 차갑게 느껴질 수 있습니다.",
    advice: "성과만큼 관계의 온도도 챙기고, 결정 전에 상대의 감정을 한 번 확인하세요.",
  },
  천동: {
    tag: "복성 (福星)",
    persona: "온화하고 낙천적이며 사람을 편하게 합니다. 즐거움과 정서적 안정감을 중시합니다.",
    strength: "적응력이 좋고 관계가 부드러우며, 위기에도 여유를 잃지 않습니다.",
    shadow: "편안함을 좇다 미루거나 안주하기 쉽고, 갈등을 피하려다 결정을 남에게 넘길 수 있습니다.",
    advice: "작은 목표와 마감을 두어 추진력을 보완하고, 불편한 대화를 미루지 마세요.",
  },
  염정: {
    tag: "차성·수성 (囚星)",
    persona: "원칙과 개성이 뚜렷하고 몰입이 강합니다. 겉은 절제돼 보여도 속엔 열정이 큽니다.",
    strength: "집중력과 승부욕이 있어 전문 분야에서 깊이를 냅니다.",
    shadow: "감정의 기복과 집착이 크고, 옳고 그름을 강하게 따져 관계가 날카로워질 수 있습니다.",
    advice: "몰입의 대상을 건강하게 고르고, 감정이 격할 때 한 박자 쉬어 표현하세요.",
  },
  천부: {
    tag: "고성·재고성 (財庫)",
    persona: "안정과 균형을 추구하는 관리형입니다. 신중하고 포용력이 있어 사람들이 기댑니다.",
    strength: "risk를 관리하며 꾸준히 쌓아가고, 조직에서 신뢰를 얻습니다.",
    shadow: "안정을 지나치게 좇으면 도전을 피하고 보수적으로 굳을 수 있습니다.",
    advice: "지킬 것과 시도할 것을 나눠, 감당 가능한 범위의 도전을 정기적으로 넣으세요.",
  },
  태음: {
    tag: "부성 (富星)",
    persona: "섬세하고 정서가 풍부하며 배려심이 깊습니다. 내면과 관계의 결을 잘 읽습니다.",
    strength: "세심한 돌봄과 미적 감각, 꾸준한 축적에 강합니다.",
    shadow: "예민함이 과하면 혼자 상처받고, 속마음을 삼키다 관계에서 오해가 쌓입니다.",
    advice: "추측 대신 확인하는 습관을 들이고, 원하는 것을 말로 표현하세요.",
  },
  탐랑: {
    tag: "욕망·재예성 (慾星)",
    persona: "다재다능하고 사교적이며 호기심과 욕구가 큽니다. 사람과 기회를 끌어당깁니다.",
    strength: "적응력과 매력, 다방면의 재능으로 새 기회를 잘 만듭니다.",
    shadow: "욕심이 여러 갈래로 퍼지면 집중이 흐려지고, 즉흥·과욕으로 무리할 수 있습니다.",
    advice: "관심사를 한두 개로 좁혀 깊이를 만들고, 유혹적인 선택은 하루 두고 판단하세요.",
  },
  거문: {
    tag: "암성·구설성 (暗星)",
    persona: "분석적이고 말·논리에 강합니다. 파고들어 본질을 밝히는 힘이 있습니다.",
    strength: "탐구력과 표현력이 뛰어나 전문·언변 분야에서 두각을 냅니다.",
    shadow: "의심과 따짐이 과하면 구설·오해를 부르고, 말이 날카로워 관계가 상할 수 있습니다.",
    advice: "지적보다 질문으로 대화하고, 확인되지 않은 의심을 사실처럼 말하지 마세요.",
  },
  천상: {
    tag: "인성·보좌성 (印星)",
    persona: "온건하고 신의가 있으며 조율과 보좌에 강합니다. 품위와 균형을 중시합니다.",
    strength: "중재와 조정에 능하고, 곁에서 사람을 든든하게 받쳐 줍니다.",
    shadow: "남의 뜻에 맞추다 자기 주장을 못 내고, 우유부단해 보일 수 있습니다.",
    advice: "조율하되 자기 기준을 분명히 하고, 결정해야 할 때는 미루지 마세요.",
  },
  천량: {
    tag: "음성·수성 (蔭星)",
    persona: "원칙과 책임감이 강하고 어른스럽습니다. 남을 돕고 바로잡으려는 기질이 있습니다.",
    strength: "위기에 강하고 신뢰를 주며, 문제를 해결하고 사람을 보호합니다.",
    shadow: "옳음을 앞세우면 잔소리·간섭으로 비치고, 홀로 짐을 지려다 지칠 수 있습니다.",
    advice: "바로잡기 전에 상대의 선택을 존중하고, 도움과 간섭의 경계를 지키세요.",
  },
  칠살: {
    tag: "장군·숙살성 (將星)",
    persona: "과감하고 독립적이며 추진력이 강합니다. 스스로 개척하려는 승부사 기질입니다.",
    strength: "결단과 돌파력이 뛰어나 어려운 국면을 정면으로 뚫습니다.",
    shadow: "급하고 강경해 부딪히기 쉽고, 기복이 커 관계·건강을 소모할 수 있습니다.",
    advice: "속도 전에 방향을 점검하고, 혼자 밀어붙이기보다 함께할 사람을 두세요.",
  },
  파군: {
    tag: "소모·개척성 (耗星)",
    persona: "낡은 것을 깨고 새로 만드는 개혁가 기질입니다. 변화를 두려워하지 않습니다.",
    strength: "판을 바꾸는 추진력과 개척 정신으로 새 길을 엽니다.",
    shadow: "파괴 뒤 수습이 약하면 소모가 크고, 기복과 즉흥으로 안정이 흔들릴 수 있습니다.",
    advice: "깨뜨린 다음의 마무리 계획을 함께 세우고, 변화의 규모를 감당 가능하게 나누세요.",
  },
};

export const PALACE_MEANING = {
  명궁: "타고난 성향과 인생의 중심 — 나를 나타내는 가장 중요한 궁",
  형제궁: "형제·동료·가까운 인간관계의 결",
  부처궁: "배우자·연애 상대와의 관계 방식",
  자녀궁: "자녀·후배, 그리고 창조적 결과물",
  재백궁: "돈을 벌고 쓰는 방식, 재물의 흐름",
  질액궁: "건강과 체질, 스트레스가 쌓이는 지점",
  천이궁: "바깥 활동·이동, 사회에서 비치는 모습",
  노복궁: "친구·부하·협력자와의 관계",
  관록궁: "일·직업·사회적 성취의 방향",
  전택궁: "집·부동산·가정의 안정",
  복덕궁: "내면의 만족·취향, 정신적 복",
  부모궁: "부모·윗사람과의 관계, 받은 환경",
};

export const BUREAU_DESC = {
  2: "수(水)의 기운으로, 사고가 유연하고 적응이 빠른 흐름입니다.",
  3: "목(木)의 기운으로, 성장과 확장을 지향하는 흐름입니다.",
  4: "금(金)의 기운으로, 원칙과 결단이 분명한 흐름입니다.",
  5: "토(土)의 기운으로, 안정과 축적을 중시하는 흐름입니다.",
  6: "화(火)의 기운으로, 표현과 추진이 활발한 흐름입니다.",
};
