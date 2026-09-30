import { jdFromLocal, jdFromUT, jdnFromDate, sunLongitude, solarTermJD, localDateFromJD, lunarToSolar, solarToLunar } from "./astro.js";
/* =========================================================
   만세력(사주팔자) 계산 엔진 — 실제 계산.
   - 년주: 입춘(태양황경 315°) 경계로 결정
   - 월주: 12절기(15°+30k) 기준, 오호둔(五虎遁)으로 월간
   - 일주: 지역 양력 날짜의 율리우스적일 기반 육십갑자 (검증됨: 2000-01-01=戊午)
   - 시주: 진태양시(경도 보정) 시각 + 오서둔(五鼠遁)
   - 오행 분포: 여덟 글자(시 미상이면 여섯 글자)의 오행 개수
   - 대운: 양남음녀 순행/음남양녀 역행, 절입까지 일수/3
   기준일 경계는 자정(양력) 기준(간명한 조자시/야자시 처리). 진태양시는
   시간대 대표 경도로 근사한다.
   ========================================================= */


const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEM_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCH_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const STEM_ELEM = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
// 자축인묘진사오미신유술해
const BRANCH_ELEM = ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"];

// 시간대 → { offset(시간), 대표경도(동경+) }
const TZ = {
  "Asia/Seoul": { off: 9, lon: 126.98 },
  "Asia/Tokyo": { off: 9, lon: 139.69 },
  "Asia/Shanghai": { off: 8, lon: 121.47 },
  "America/Los_Angeles": { off: -8, lon: -118.24 },
  "America/New_York": { off: -5, lon: -74.0 },
  "Europe/London": { off: 0, lon: -0.13 },
  other: { off: 9, lon: 135 },
};

const mod = (n, m) => ((n % m) + m) % m;

function pillar(stemIdx, branchIdx) {
  return {
    stem: STEMS[stemIdx], branch: BRANCHES[branchIdx],
    gz: STEMS[stemIdx] + BRANCHES[branchIdx],
    hanja: STEM_H[stemIdx] + BRANCH_H[branchIdx],
    stemIdx, branchIdx,
  };
}

/** 간지 인덱스(0~59)로 월주 스텝용 */
function gzFromMonthStep(baseStemIdx, baseBranchIdx, step) {
  return pillar(mod(baseStemIdx + step, 10), mod(baseBranchIdx + step, 12));
}

/**
 * @param {object} input - {calendarType, birthDate:'YYYY-MM-DD', birthTime:'HH:MM',
 *   timeUnknown, gender:'male'|'female', timezone, leapMonth?}
 */
export function computeSaju(input) {
  const tz = TZ[input.timezone] || TZ.other;
  const off = tz.off;

  // 1) 입력 날짜 → 양력 (음력이면 변환)
  const [iy, im, idd] = input.birthDate.split("-").map(Number);
  let solar = { Y: iy, M: im, D: idd };
  let lunar = null;
  if (input.calendarType === "lunar") {
    const conv = lunarToSolar(iy, im, !!input.leapMonth, idd, 9);
    if (conv) { lunar = { year: iy, month: im, isLeap: !!input.leapMonth, day: idd }; solar = conv; }
  } else {
    lunar = solarToLunar(solar.Y, solar.M, solar.D, 9);
  }

  // 시각(미상이면 정오 가정, 시주 계산 제외)
  const hh = input.timeUnknown ? 12 : Number((input.birthTime || "12:00").split(":")[0]);
  const mm = input.timeUnknown ? 0 : Number((input.birthTime || "12:00").split(":")[1]);
  const birthJD = jdFromLocal(solar.Y, solar.M, solar.D, hh, mm, off);

  // 2) 년주 — 입춘 경계
  const ipchun = solarTermJD(315, jdFromUT(solar.Y, 2, 4, 0));
  const saJuYear = birthJD >= ipchun ? solar.Y : solar.Y - 1;
  const yStem = mod(saJuYear - 1984, 10);
  const yBranch = mod(saJuYear - 1984, 12);
  const yearP = pillar(yStem, yBranch);

  // 3) 월주 — 태양황경으로 절기월 결정
  const lon = sunLongitude(birthJD);
  const monthOrder = Math.floor(mod(lon - 315, 360) / 30); // 0=寅
  const monthBranchIdx = mod(monthOrder + 2, 12); // 寅=index2
  const tigerStem = mod(yStem * 2 + 2, 10); // 오호둔: 寅월 천간
  const monthStemIdx = mod(tigerStem + monthOrder, 10);
  const monthP = pillar(monthStemIdx, monthBranchIdx);

  // 4) 일주 — 지역 양력 날짜의 육십갑자
  const jdn = jdnFromDate(solar.Y, solar.M, solar.D);
  const dayIdx = mod(jdn + 49, 60);
  const dayP = pillar(dayIdx % 10, dayIdx % 12);

  // 5) 시주 — 진태양시
  let hourP = null;
  let solarFix = null;
  if (!input.timeUnknown) {
    const stdMeridian = off * 15;
    const lonCorr = (tz.lon - stdMeridian) * 4; // 분
    const eot = equationOfTime(birthJD); // 분
    const tstMin = mod(hh * 60 + mm + lonCorr + eot, 1440);
    solarFix = { lonCorr: Math.round(lonCorr), eot: Math.round(eot), total: Math.round(lonCorr + eot),
      trueTime: `${String(Math.floor(tstMin / 60)).padStart(2, "0")}:${String(Math.floor(tstMin % 60)).padStart(2, "0")}` };
    const hourBranchIdx = Math.floor(mod(tstMin + 60, 1440) / 120); // 0=子
    const ratStem = mod(dayP.stemIdx * 2, 10); // 오서둔: 子시 천간
    const hourStemIdx = mod(ratStem + hourBranchIdx, 10);
    hourP = pillar(hourStemIdx, hourBranchIdx);
  }

  // 6) 오행 분포
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const pillars = [yearP, monthP, dayP, hourP].filter(Boolean);
  for (const p of pillars) {
    counts[STEM_ELEM[p.stemIdx]]++;
    counts[BRANCH_ELEM[p.branchIdx]]++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const elements = {};
  for (const k of Object.keys(counts)) elements[k] = Math.round((counts[k] / total) * 100);
  fixTo100(elements);
  const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1]).map(([key, value]) => ({ key, value }));

  // 7) 대운
  const daeun = computeDaeun({ birthJD, yStem, monthP, gender: input.gender, monthOrder, off });
  // 절입(이 달이 시작된 절기 시각)
  const jeolipJD = solarTermJD(mod(315 + monthOrder * 30, 360), birthJD - 29);
  const JIE_NAMES = ["입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설", "소한"];
  const jeolip = { name: JIE_NAMES[monthOrder], ...dtFromJD(jeolipJD, off) };

  return {
    pillars: {
      year: yearP, month: monthP, day: dayP, hour: hourP,
    },
    elements, elementCounts: counts, dominant,
    confidence: input.timeUnknown ? "limited" : "standard",
    isDemo: false,
    dayMaster: dayP.stem, dayMasterElem: STEM_ELEM[dayP.stemIdx],
    daeun, solar, lunar, saJuYear,
    meta: { solarFix, jeolip, tz: input.timezone || "Asia/Seoul", sunLon: lon, timeKnown: !input.timeUnknown },
  };
}

/** JD → 현지 날짜·시각 */
function dtFromJD(jd, off) {
  const d = localDateFromJD(jd, off);
  const loc = jd + 0.5 + off / 24;
  const mins = Math.round((loc - Math.floor(loc)) * 1440) % 1440;
  return { ...d, h: Math.floor(mins / 60), m: mins % 60 };
}

function computeDaeun({ birthJD, yStem, monthP, gender, monthOrder, off = 9 }) {
  const yangYear = yStem % 2 === 0;
  const forward = (yangYear && gender === "male") || (!yangYear && gender === "female");
  // 절입까지 일수
  const sectorStart = mod(315 + monthOrder * 30, 360);
  const nextJie = solarTermJD(mod(sectorStart + 30, 360), birthJD + 1);
  const prevJie = solarTermJD(sectorStart, birthJD - 29);
  const days = forward ? nextJie - birthJD : birthJD - prevJie;
  const startAge = Math.max(1, Math.round(days / 3));
  // 3일 = 1년 → 첫 대운 시작 날짜
  const startJD = birthJD + (days / 3) * 365.2422;
  const startDate = dtFromJD(startJD, off);
  const list = [];
  for (let i = 1; i <= 10; i++) {
    const step = forward ? i : -i;
    const p = gzFromMonthStep(monthP.stemIdx, monthP.branchIdx, step);
    list.push({ age: startAge + (i - 1) * 10, gz: p.gz, hanja: p.hanja, stemIdx: p.stemIdx, branchIdx: p.branchIdx,
      startYear: startDate.Y + (i - 1) * 10 });
  }
  return { forward, startAge, startDate, list };
}

/** 균시차(분) — 근사. Meeus 저정밀. */
function equationOfTime(jd) {
  const T = (jd - 2451545.0) / 36525;
  const D2R = Math.PI / 180;
  const L0 = mod(280.46646 + 36000.76983 * T, 360);
  const M = (357.52911 + 35999.05029 * T) * D2R;
  const e = 0.016708634 - 0.000042037 * T;
  const y = Math.tan((23.439 - 0.013 * T) / 2 * D2R) ** 2;
  const L0r = L0 * D2R;
  const E = y * Math.sin(2 * L0r) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * L0r)
    - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * M);
  return (E * 180 / Math.PI) * 4; // 라디안→도→분
}

function fixTo100(elements) {
  const keys = Object.keys(elements);
  let diff = 100 - keys.reduce((a, k) => a + elements[k], 0);
  keys.sort((a, b) => elements[b] - elements[a]);
  let i = 0;
  while (diff !== 0 && i < 100) {
    const k = keys[i % keys.length];
    const step = diff > 0 ? 1 : -1;
    if (elements[k] + step >= 0) { elements[k] += step; diff -= step; }
    i++;
  }
}

export const ELEMENT_OF_STEM = STEM_ELEM;
