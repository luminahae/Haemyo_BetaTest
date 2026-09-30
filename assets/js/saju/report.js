/* =========================================================
   사주 리포트 생성기
   프로필(오행 분포) + 입력(집중분야)을 받아, 화면이 그릴 수 있는
   구조화된 리포트 데이터를 만든다. (렌더링은 sajuResult.js가 담당)
   각 카드 블록은 요청된 구조를 따른다:
   핵심요약 · 구체적 해석 · 실제 상황 · 주의할 점 · 현실적 행동 제안
   ========================================================= */

import { ELEMENT_TRAITS, ELEMENT_LABEL } from "./traits.js";

const ELEMENT_META = {
  wood: { label: "목(木)", keyword: "성장·확장" },
  fire: { label: "화(火)", keyword: "표현·열정" },
  earth: { label: "토(土)", keyword: "안정·중재" },
  metal: { label: "금(金)", keyword: "원칙·결단" },
  water: { label: "수(水)", keyword: "사고·유연" },
};

// 블록 헬퍼
const B = (tag, label, icon, body) => ({ tag, label, icon, body });

export function buildSajuReport(profile, input, sectionsDef) {
  const sorted = Object.entries(profile.elements).sort((a, b) => b[1] - a[1]);
  const domKey = sorted[0][0];
  const subKey = sorted[1][0];
  const t = ELEMENT_TRAITS[domKey];
  const t2 = ELEMENT_TRAITS[subKey];

  const dominant = sorted.map(([key, value]) => ({
    key, value, label: ELEMENT_META[key].label, keyword: ELEMENT_META[key].keyword,
  }));

  const meters = sorted.map(([key, value]) => ({
    key, value, label: ELEMENT_META[key].label, keyword: ELEMENT_META[key].keyword,
  }));

  const dmElem = profile.dayMasterElem ? ELEMENT_META[profile.dayMasterElem] : null;
  const dmLine = profile.dayMaster && dmElem
    ? `일간(日干)은 ${profile.dayMaster}(${dmElem.label}), 곧 당신을 상징하는 오행은 ${dmElem.label}입니다. `
    : "";
  const summaryLead =
    dmLine +
    `여덟 글자 전체로 보면 ${ELEMENT_META[domKey].label} 기운(${ELEMENT_META[domKey].keyword})이 가장 두드러지고, ` +
    `${ELEMENT_META[subKey].label} 기운(${ELEMENT_META[subKey].keyword})이 이를 보조합니다. ` +
    `‘${ELEMENT_LABEL[domKey]}’ 성향이 강점이자 동시에 조심할 지점이 됩니다. ` +
    `아래는 좋은 말만 늘어놓기보다, 강점이 과해졌을 때의 부작용과 현실적인 갈등 지점까지 함께 짚은 리포트입니다.`;

  // 섹션별 블록 구성
  const builders = {
    personality: () => personalitySection(t),
    relationship: () => relationshipSection(t),
    love: () => loveSection(t),
    marriage: () => marriageSection(domKey, t),
    money: () => moneySection(t),
    career: () => careerSection(t),
    timeline: () => timelineSection(domKey, input),
    habits: () => null, // habits는 별도 처리
    loveflow: () => loveflowSection(domKey, t),
  };

  const focus = new Set(input.focus || []);
  const sections = [];
  for (const def of sectionsDef.sections) {
    if (def.id === "habits") continue;
    const blocks = builders[def.id] ? builders[def.id]() : null;
    if (!blocks) continue;
    sections.push({
      id: def.id, title: def.title, sub: def.sub, icon: def.icon,
      focused: focus.has(def.focus) || def.always === true,
      blocks,
    });
  }
  // 집중 분야 우선 정렬 (선택 분야를 앞으로, always 섹션은 유지)
  sections.sort((a, b) => (b.focused === true) - (a.focused === true));

  const habits = habitsSection(domKey, subKey);

  return {
    dominant, meters, summaryLead, sections, habits,
    domKey, subKey,
  };
}

/* ---------- 각 섹션 빌더 ---------- */

function personalitySection(t) {
  return [
    B("summary", "핵심 요약", "compass", [`${t.persona.surface} 하지만 ${t.persona.inner}`]),
    B("read", "구체적 해석", "info", { ul: [
      `겉으로 보이는 모습 — ${t.persona.surface}`,
      `실제 내면 성향 — ${t.persona.inner}`,
      `이미지와 내면의 차이 — ${t.persona.gap}`,
    ]}),
    B("case", "스트레스를 받을 때", "alert", [t.persona.stress]),
    B("warn", "주의할 점", "alert", ["강점(추진·표현·안정 등)이 과해지면 오히려 관계와 판단을 흐릴 수 있습니다. 자신의 기본값을 ‘항상 옳은 것’으로 여기지 않는 태도가 중요합니다."]),
    B("action", "현실적인 행동 제안", "lightbulb", ["하루를 마칠 때, 오늘 나의 반응 중 ‘성향이 과했던 순간’ 하나만 돌아보세요. 자책이 아니라 관찰이 목적입니다."]),
  ];
}

function relationshipSection(t) {
  return [
    B("summary", "핵심 요약", "users", [t.relationship.problem]),
    B("read", "구체적 해석", "info", { ul: [
      `반복되는 문제 — ${t.relationship.problem}`,
      `같은 문제가 반복되는 원인 — ${t.relationship.cause}`,
      `가까운 사람에게 보이는 태도 — ${t.relationship.closeAttitude}`,
      `갈등이 생겼을 때의 반응 — ${t.relationship.conflictReaction}`,
    ]}),
    B("case", "실제로 나타나는 상황", "clock", ["예: 상대는 그냥 공감을 원했는데 당신은 해결책부터 꺼내, 대화가 서로 어긋난 채 끝난 경험이 있을 수 있습니다."]),
    B("warn", "주의할 점", "alert", ["관계 문제를 상대 탓으로만 돌리면 같은 패턴이 다음 관계에서도 반복됩니다."]),
    B("action", "관계를 편하게 만드는 법", "lightbulb", [t.relationship.fix]),
  ];
}

function loveSection(t) {
  return [
    B("summary", "핵심 요약", "heart", [`${t.love.start} ${t.love.express}`]),
    B("read", "구체적 해석", "info", { ul: [
      `연애를 시작하는 방식 — ${t.love.start}`,
      `호감을 표현하는 방식 — ${t.love.express}`,
      `연애 중 불안을 느끼는 지점 — ${t.love.anxiety}`,
    ]}),
    B("good", "잘 맞는 사람", "heart", [t.love.match]),
    B("warn", "잘 맞지 않는 사람", "alert", [t.love.mismatch]),
    B("warn", "이별로 이어지기 쉬운 패턴", "alert", [t.love.breakup]),
    B("action", "현실적인 행동 제안", "lightbulb", ["불안이 커질 때 혼자 결론 내리기 전에, 상대에게 사실을 확인하는 한 문장을 먼저 건네 보세요."]),
  ];
}

function marriageSection(domKey, t) {
  const values = {
    wood: "함께 성장하고 서로의 목표를 응원하는 관계를 중요하게 여깁니다.",
    fire: "감정 표현이 오가고 서로 반응해 주는 따뜻한 관계를 중요하게 여깁니다.",
    earth: "안정적이고 예측 가능한 일상, 서로에 대한 신뢰를 중요하게 여깁니다.",
    metal: "약속과 책임이 지켜지는, 서로 존중하는 명확한 관계를 중요하게 여깁니다.",
    water: "서로를 이해하려 노력하고 대화가 통하는 관계를 중요하게 여깁니다.",
  }[domKey];
  return [
    B("summary", "핵심 요약", "users", [values]),
    B("read", "생활·돈에서 생길 수 있는 갈등", "info", [t.money.type + " 배우자와 소비·저축의 기준이 다르면 반복적인 마찰이 생길 수 있습니다."]),
    B("case", "가족·집안일·감정 표현", "clock", { ul: [
      "역할 분담을 ‘말하지 않아도 알겠지’로 넘기면 서운함이 쌓입니다.",
      "감정 표현 방식(직접/간접)의 차이가 오해로 이어질 수 있습니다.",
    ]}),
    B("read", "배우자에게 기대하는 역할", "info", [t.love.match]),
    B("action", "결혼 전 반드시 조율할 것", "lightbulb", { ul: [
      "돈 관리 방식(공동/분리)과 큰 지출 결정 기준",
      "집안일·양가 관계에서의 역할과 경계",
      "갈등이 생겼을 때 서로가 원하는 대화 방식",
    ]}),
    B("warn", "주의", "alert", ["결혼 시기·상대는 확정된 예언이 아닙니다. 위 조건들이 얼마나 맞춰지는지가 관계의 안정에 더 큰 영향을 줍니다."]),
  ];
}

function moneySection(t) {
  return [
    B("summary", "핵심 요약", "coins", [t.money.type]),
    B("read", "구체적 해석", "info", { ul: [
      `축적 유형 — ${t.money.type}`,
      `돈을 잃기 쉬운 습관 — ${t.money.losing}`,
      `잘 맞는 수입 구조 — ${t.money.structure}`,
    ]}),
    B("case", "실제로 나타나는 상황", "clock", ["예: ‘이번 한 번쯤’ 하는 지출이 쌓여, 월말에 계획과 실제가 어긋나는 일이 반복될 수 있습니다."]),
    B("warn", "투자·소비에서 조심할 점", "alert", [t.money.caution]),
    B("action", "현실적인 행동 제안", "lightbulb", ["큰 지출은 ‘24시간 규칙’(하루 두고 다시 판단)을 적용하고, 저축은 자동이체로 먼저 떼어 두세요."]),
  ];
}

function careerSection(t) {
  return [
    B("summary", "핵심 요약", "briefcase", [t.career.recognized]),
    B("read", "구체적 해석", "info", { ul: [
      `인정받는 방식 — ${t.career.recognized}`,
      `성과를 내기 쉬운 환경 — ${t.career.goodEnv}`,
      `힘들어지는 조직 문화 — ${t.career.hardEnv}`,
      `상사·동료와 부딪히는 지점 — ${t.career.conflict}`,
    ]}),
    B("good", "잘 맞는 업무 방식", "check", [t.career.style]),
    B("read", "성향 유형", "info", [t.career.type]),
    B("action", "현실적인 행동 제안", "lightbulb", ["지금 환경이 당신의 강점을 쓰게 하는지 점검하고, 아니라면 강점을 살릴 작은 역할부터 요청해 보세요."]),
  ];
}

function timelineSection(domKey, input) {
  return [
    B("summary", "핵심 요약", "clock", ["아래는 특정 사건을 확정하는 예언이 아니라, ‘가능성이 커지는 흐름’과 그때 취할 수 있는 현실적 행동입니다."]),
    B("read", "앞으로 1년", "info", ["익숙한 방식을 점검하고 기반을 다지기 좋은 시기입니다. 크게 벌이기보다 정리와 준비에 무게를 두면 이후 흐름이 수월해집니다."]),
    B("read", "2년 차 — 기회가 커질 수 있는 영역", "info", ["그동안 준비한 것이 결과로 이어질 가능성이 커집니다. 다만 기회가 온다고 무리하게 판을 키우지 말고, 감당 가능한 범위에서 확장하세요."]),
    B("warn", "3년 차 — 조심할 변화", "alert", ["관계나 환경의 변화가 겹칠 수 있습니다. 중요한 결정을 한꺼번에 몰아서 하지 말고 시차를 두세요."]),
    B("case", "영역별 흐름", "clock", { ul: [
      "연애 — 조급한 확인보다 관계의 속도를 맞추는 것이 흐름을 좋게 합니다.",
      "직업 — 새 시도는 작게 시작해 검증한 뒤 키우는 편이 안전합니다.",
      "금전 — 큰 결정은 서두르지 말고, 정보가 충분히 모인 뒤 판단하세요.",
    ]}),
    B("action", "결정을 서두르지 말아야 할 때", "lightbulb", ["마음이 급해질수록 하루 이상 두고 다시 보는 습관이, 이 시기의 가장 좋은 안전장치입니다."]),
  ];
}

function loveflowSection(domKey, t) {
  return [
    B("summary", "핵심 요약", "heart", [`${t.love.start} 이 성향은 연애의 시작과 지속 방식 모두에 영향을 줍니다.`]),
    B("read", "인생 전반의 연애 성향", "info", [`${t.love.express} ${t.love.anxiety}`]),
    B("read", "앞으로의 연애 흐름", "info", ["당신이 관계에서 반복하는 패턴을 인식할수록, 다음 관계의 흐름이 달라집니다. 흐름은 정해진 것이 아니라 당신의 선택으로 바뀝니다."]),
    B("good", "만날 가능성이 높은 상대", "heart", [t.love.match + " 이런 사람과는 관계가 시작되고 유지되기 쉽습니다."]),
    B("read", "관계가 시작되기 쉬운 환경", "info", ["자연스럽게 반복해 마주치고, 편하게 대화가 이어지는 환경에서 관계가 열립니다. 조급하게 결과를 재촉하는 자리에서는 오히려 어긋납니다."]),
    B("warn", "연애가 깨지기 쉬운 원인", "alert", [t.love.breakup]),
    B("action", "결혼을 고려하기 좋은 조건", "lightbulb", { ul: [
      "돈·생활 방식의 기준을 서로 솔직히 확인했는가",
      "갈등이 생겼을 때 대화가 되는가",
      "서로의 가족·미래에 대한 생각이 크게 어긋나지 않는가",
    ]}),
    B("warn", "안내", "info", ["결혼 상대와 시기를 단정적으로 예언하지 않습니다. 위 조건이 맞춰질수록 관계가 안정될 가능성이 높아진다는 의미로 읽어 주세요."]),
  ];
}

function habitsSection(domKey, subKey) {
  const bank = {
    wood: {
      title: "검증 전에 먼저 일을 벌이는 습관",
      reason: "성장과 속도를 중시해, 확인보다 시작이 앞서기 때문입니다.",
      example: "‘될 것 같아서’ 자원이나 시간을 먼저 투입했다가, 나중에 조건이 안 맞아 되돌리는 일이 반복됩니다.",
      action: "시작 전 ‘되돌릴 수 없는 것’만 미리 점검하는 체크리스트를 만드세요.",
      task: "이번 주에 새로 시작하려는 일 하나에 대해, 최악의 경우 잃는 것을 종이에 적어 보기.",
    },
    fire: {
      title: "감정이 오를 때 바로 말해 버리는 습관",
      reason: "그 순간의 감정을 표현해야 풀리는 성향 때문입니다.",
      example: "욱해서 던진 한마디가 관계를 식게 만들고, 뒤늦게 후회하는 일이 반복됩니다.",
      action: "감정이 격해지면 ‘10분 뒤에 말하기’ 규칙을 두세요.",
      task: "이번 주, 화가 난 순간 바로 답하지 않고 한 번 심호흡 후 반응하기(하루 1회 기록).",
    },
    earth: {
      title: "불편을 참고 넘기다 한계에서 정리하는 습관",
      reason: "관계의 평화를 위해 자기 필요를 뒤로 미루기 때문입니다.",
      example: "싫은 소리를 못 하다가, 어느 날 갑자기 지쳐 관계를 끊어 상대가 영문을 모릅니다.",
      action: "작은 불편을 그때그때 가볍게 말하는 연습을 하세요.",
      task: "이번 주, 사소한 부탁 하나를 정중히 거절하거나 원하는 것을 한 번 표현하기.",
    },
    metal: {
      title: "옳음을 먼저 증명하려는 습관",
      reason: "명확함과 기준을 중시해, 감정보다 논리가 앞서기 때문입니다.",
      example: "맞는 말을 했는데 상대가 상처받아, 정작 관계가 멀어지는 일이 생깁니다.",
      action: "지적하기 전에 상대의 감정을 먼저 인정하는 한마디를 붙이세요.",
      task: "이번 주, 누군가와 의견이 다를 때 ‘네 입장도 이해돼’를 먼저 말해 보기.",
    },
    water: {
      title: "확인 대신 혼자 추측하는 습관",
      reason: "신호를 예민하게 읽는 만큼, 해석을 사실처럼 믿기 때문입니다.",
      example: "상대의 짧은 답을 나쁜 뜻으로 해석해, 혼자 서운해하고 거리를 둡니다.",
      action: "추측이 들면 ‘사실인지 물어보기’를 기본 절차로 삼으세요.",
      task: "이번 주, 혼자 결론 내리기 전에 상대에게 직접 확인하는 질문 한 번 해 보기.",
    },
  };
  // 지배·보조 오행 + 공통 하나로 3가지 구성
  const third = {
    title: "중요한 결정을 운세·기분에 기대는 습관",
    reason: "불안할 때 빠르게 마음을 정리하고 싶은 마음 때문입니다.",
    example: "충분히 알아보기 전에 감이나 그날의 기분으로 큰 선택을 해, 나중에 근거가 부족했음을 느낍니다.",
    action: "중요한 결정은 사실 정보·주변 의견·필요하면 전문가 조언을 함께 검토하세요.",
    task: "이번 주, 앞둔 결정 하나에 대해 근거 세 가지를 적고, 부족한 정보를 하나 채우기.",
  };
  const list = [bank[domKey]];
  if (subKey !== domKey && bank[subKey]) list.push(bank[subKey]);
  list.push(third);
  return list.slice(0, 3);
}
