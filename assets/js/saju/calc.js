/* =========================================================
   사주 오행 분포 — 데모(샘플) 계산
   ---------------------------------------------------------
   ⚠️ 중요: 이 모듈은 실제 만세력 계산이 아닙니다.
   음력 변환, 절기 기준 월주, 정확한 일주/시주, 출생지 시간대,
   자정 경계 처리는 구현되어 있지 않습니다.
   생년월일을 seed로 삼아 '결정론적으로' 오행 비율을 만들어,
   같은 입력이면 같은 결과가 나오도록 한 데모 로직입니다.
   화면과 코드 모두에 데모임을 명시합니다.

   실제 계산을 구현할 경우 아래 기준을 문서화해야 합니다:
   - 음력→양력(또는 그 반대) 변환 기준과 윤달 처리
   - 절기(節氣)를 기준으로 한 월주 산정
   - 일주 계산의 기준일(갑자일) 및 자정/야자시 경계
   - 시주 계산을 위한 진태양시(출생지 경도) 보정
   ========================================================= */

import { seedFromString, mulberry32 } from "../utils/dom.js";

const ELEMENT_KEYS = ["wood", "fire", "earth", "metal", "water"];

// 표시용(데모) — 실제 간지가 아님을 이름에서 드러냄
const DEMO_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const DEMO_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

/**
 * @param {import('./types').BirthInput} input
 * @returns {import('./types').SajuProfile}
 */
export function computeSajuProfileDemo(input) {
  const key = [
    input.calendarType,
    input.birthDate,
    input.timeUnknown ? "no-time" : input.birthTime || "",
    input.gender,
    input.timezone || "",
  ].join("|");

  const seed = seedFromString(key);
  const rand = mulberry32(seed);

  // 오행 가중치 — 데모: seed 기반 난수로 5개 원소에 가중치 배분
  const raw = ELEMENT_KEYS.map(() => 0.4 + rand() * 1.6);

  // 날짜 숫자를 약간 반영해 값이 고르게 퍼지지 않도록(데모용 변주)
  const digits = input.birthDate.replace(/\D/g, "");
  for (let i = 0; i < digits.length; i++) {
    raw[i % 5] += (Number(digits[i]) % 5) * 0.12;
  }

  const sum = raw.reduce((a, b) => a + b, 0);
  const elements = {};
  ELEMENT_KEYS.forEach((k, i) => {
    elements[k] = Math.round((raw[i] / sum) * 100);
  });
  // 반올림 보정 → 합 100
  fixTo100(elements);

  // 데모 사주 기둥(간지처럼 보이지만 실제 계산 아님)
  const pillars = makeDemoPillars(rand, input.timeUnknown);

  return {
    pillars,
    elements,
    confidence: input.timeUnknown ? "limited" : "standard",
    isDemo: true, // 항상 데모임을 표시
    dominant: dominantElements(elements),
  };
}

function fixTo100(elements) {
  const keys = Object.keys(elements);
  let diff = 100 - keys.reduce((a, k) => a + elements[k], 0);
  // 가장 큰 값에 차이를 더해 합을 100으로
  keys.sort((a, b) => elements[b] - elements[a]);
  let i = 0;
  while (diff !== 0) {
    const k = keys[i % keys.length];
    const step = diff > 0 ? 1 : -1;
    if (elements[k] + step >= 0) {
      elements[k] += step;
      diff -= step;
    }
    i++;
  }
}

function makeDemoPillars(rand, timeUnknown) {
  const p = (arr) => arr[Math.floor(rand() * arr.length)];
  const pillar = () => p(DEMO_STEMS) + p(DEMO_BRANCHES);
  const pillars = { year: pillar(), month: pillar(), day: pillar() };
  if (!timeUnknown) pillars.hour = pillar();
  return pillars;
}

/** 지배 오행 상위 2개 반환 */
export function dominantElements(elements) {
  return Object.entries(elements)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, value: v }));
}
