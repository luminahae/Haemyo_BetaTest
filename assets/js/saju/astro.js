
/* =========================================================
   천문 계산 — 절기(태양 황경)와 삭(신월) 계산의 기초.
   Meeus, "Astronomical Algorithms" 저정밀 공식 사용.
   - 절기: 태양 겉보기 황경이 15°의 배수를 지나는 순간.
   - 일주: 율리우스적일(JDN) 기반 육십갑자.
   - 삭(신월): 달-태양 이각(elongation)이 0이 되는 순간(음력 월경계).
   ΔT(TT-UT)는 1900~2100 범위에서 수십 초 수준이라 날짜 판정에 영향이
   거의 없어 근사(무시)한다. 시각 표기는 분 단위 오차가 있을 수 있다.
   ========================================================= */

const D2R = Math.PI / 180;
const rev = (x) => ((x % 360) + 360) % 360;

/** 그레고리력 날짜(정오 기준) → 율리우스적일 정수 (일주 계산용) */
export function jdnFromDate(Y, M, D) {
  const a = Math.floor((14 - M) / 12);
  const y = Y + 4800 - a;
  const m = M + 12 * a - 3;
  return D + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/** 그레고리력 날짜/시각(UT) → 율리우스일(JD, 소수) */
export function jdFromUT(Y, M, D, hours = 0) {
  let y = Y, m = M;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) +
    D + B - 1524.5 + hours / 24;
}

/** 지역 시각(로컬) → UT JD (tzOffset 시간 단위, 예: KST=+9) */
export function jdFromLocal(Y, M, D, hh, mm, tzOffset) {
  return jdFromUT(Y, M, D, hh + mm / 60 - tzOffset);
}

/** 태양 겉보기 황경(도, 0~360). jd는 TT로 간주(ΔT 근사 무시). */
export function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = M * D2R;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * D2R);
  return rev(lambda);
}

/** 달 겉보기 황경(도). Meeus Ch.47 주요항 truncated (정밀도 ~수 분각). */
export function moonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
  const d = D * D2R, m = M * D2R, mp = Mp * D2R, f = F * D2R;
  // 주요 주기항(1e-6 도 단위 계수) — Meeus 표47.A 상위항
  let s = 0;
  s += 6288774 * Math.sin(mp);
  s += 1274027 * Math.sin(2 * d - mp);
  s += 658314 * Math.sin(2 * d);
  s += 213618 * Math.sin(2 * mp);
  s += -185116 * Math.sin(m);
  s += -114332 * Math.sin(2 * f);
  s += 58793 * Math.sin(2 * d - 2 * mp);
  s += 57066 * Math.sin(2 * d - m - mp);
  s += 53322 * Math.sin(2 * d + mp);
  s += 45758 * Math.sin(2 * d - m);
  s += -40923 * Math.sin(m - mp);
  s += -34720 * Math.sin(d);
  s += -30383 * Math.sin(m + mp);
  s += 15327 * Math.sin(2 * d - 2 * f);
  s += -12528 * Math.sin(mp + 2 * f);
  s += 10980 * Math.sin(mp - 2 * f);
  s += 10675 * Math.sin(4 * d - mp);
  s += 10034 * Math.sin(3 * mp);
  s += 8548 * Math.sin(4 * d - 2 * mp);
  s += -7888 * Math.sin(2 * d + m - mp);
  s += -6766 * Math.sin(2 * d + m);
  s += -5163 * Math.sin(d - mp);
  s += 4987 * Math.sin(d + m);
  s += 4036 * Math.sin(2 * d - m + mp);
  s += 3994 * Math.sin(2 * d + 2 * mp);
  s += 3861 * Math.sin(4 * d);
  s += 3665 * Math.sin(2 * d - 3 * mp);
  return rev(Lp + s / 1000000);
}

/** 달-태양 이각(도, -180~180). 0이면 삭(신월). */
function elongation(jd) {
  let e = moonLongitude(jd) - sunLongitude(jd);
  e = rev(e);
  return e > 180 ? e - 360 : e;
}

/**
 * 목표 태양황경(targetDeg, 0~360)을 지나는 순간의 JD를 구한다.
 * guessJD 근처에서 이분법으로 탐색. (절기 계산)
 */
export function solarTermJD(targetDeg, guessJD) {
  // 목표 부근으로 이동: 태양은 하루 ~0.9856°. 초기 보정.
  let jd = guessJD;
  for (let i = 0; i < 4; i++) {
    let diff = ((targetDeg - sunLongitude(jd) + 540) % 360) - 180;
    jd += diff / 0.9856;
  }
  // 이분법 정밀화
  let lo = jd - 2, hi = jd + 2;
  const f = (x) => ((sunLongitude(x) - targetDeg + 540) % 360) - 180;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/**
 * guessJD 이전(또는 근처)의 신월(삭) JD를 구한다.
 * 평균 삭망월 29.53일 기준으로 탐색.
 */
export function newMoonJD(guessJD) {
  let jd = guessJD;
  // 이각을 0으로: 달-태양 상대속도 ~12.19°/일
  for (let i = 0; i < 5; i++) {
    jd -= elongation(jd) / 12.19;
  }
  // 이분법 정밀화
  let lo = jd - 1, hi = jd + 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (elongation(lo) * elongation(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/** JD(UT) → 지역 날짜 {Y,M,D} (tzOffset 적용). 자정 경계 판정용. */
export function localDateFromJD(jd, tzOffset) {
  const z = Math.floor(jd + 0.5 + tzOffset / 24);
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { Y: year, M: month, D: day };
}

/* ===== (합침) lunar.js ===== */
/* =========================================================
   음력(태음태양력) ↔ 양력 변환.
   달력 데이터 테이블을 통째로 옮겨 적는 대신, 천문 계산(삭·중기)으로
   직접 월을 구성한다. (无中氣置閏: 중기가 없는 달을 윤달로)
   한국 민간 음력은 한국표준시(KST, +9) 기준으로 날짜 경계를 정한다.
   ========================================================= */


const KST = 9;
const localJDN = (jd, tz) => {
  const d = localDateFromJD(jd, tz);
  return jdnFromDate(d.Y, d.M, d.D);
};

/** 월 구간에 중기(태양황경 30°의 배수)가 포함되는가.
   중기의 '민간 날짜(KST 자정 기준)'가 그 달의 초하루~다음 초하루 이전에
   들면 포함으로 본다. (중기가 삭과 같은 날이면 그날이 초하루인 새 달에 속함) */
function hasMajorTerm(aJD, bJD, tz) {
  const startJDN = localJDN(aJD, tz);
  const endJDN = localJDN(bJD, tz);
  const lonA = solarLonAt(aJD);
  // 시작 시점 부근의 두 후보 중기(직전·다음 30° 배수)를 날짜로 검사
  for (const base of [Math.floor(lonA / 30) * 30, Math.floor(lonA / 30) * 30 + 30]) {
    const deg = ((base % 360) + 360) % 360;
    const t = solarTermJD(deg, aJD);
    const tJDN = localJDN(t, tz);
    if (tJDN >= startJDN && tJDN < endJDN) return true;
  }
  return false;
}
const solarLonAt = (jd) => sunLongitude(jd);

/**
 * 음력 해(lunarYear)의 12(또는 13)개월을 구성.
 * 반환: [{ startJDN, number(1~12), leap(bool) }, ...]  (정월=1 … 12월)
 */
export function buildLunarYear(lunarYear, tz = KST) {
  // 동지(태양황경 270°)를 포함하는 달이 11월
  const dzPrev = solarTermJD(270, jdFromUT(lunarYear - 1, 12, 22, 0));
  const dzThis = solarTermJD(270, jdFromUT(lunarYear, 12, 22, 0));

  const m11a = monthStartOf(dzPrev, tz); // (lunarYear-1)의 11월 삭
  const m11b = monthStartOf(dzThis, tz); // (lunarYear)의 11월 삭

  // m11a 부터 삭들을 순서대로 수집 (m11b+1개월까지)
  const starts = [m11a];
  let cur = m11a;
  for (let i = 0; i < 15; i++) {
    cur = newMoonJD(cur + 29.53);
    starts.push(cur);
    if (localJDN(cur, tz) > localJDN(m11b, tz)) break; // m11b를 지나면 하나 더 담고 종료
  }

  // m11a~m11b 사이 달 수 (13이면 윤달 있음)
  const idx11b = starts.findIndex((s) => localJDN(s, tz) === localJDN(m11b, tz));
  const isLeapYear = idx11b === 13;

  // 윤달 위치: 중기 없는 첫 달 (m11a 다음부터 m11b 이전까지)
  let leapIndex = -1;
  if (isLeapYear) {
    for (let i = 1; i < idx11b; i++) {
      if (!hasMajorTerm(starts[i], starts[i + 1], tz)) { leapIndex = i; break; }
    }
  }

  // 번호 매기기: idx0 = 11월
  const months = [];
  let num = 11;
  for (let i = 0; i < starts.length; i++) {
    let leap = false;
    if (i === leapIndex) {
      leap = true; // 윤달: 앞 달과 같은 번호
    } else {
      if (i > 0) num = (num % 12) + 1;
    }
    months.push({ startJDN: localJDN(starts[i], tz), number: num, leap });
  }
  // 정월(첫 번호 1)부터 그 해 12월까지 = index 2 ~ (12 또는 13개)
  const start = months.findIndex((m) => m.number === 1 && !m.leap);
  return months.slice(start, start + (isLeapYear ? 13 : 12));
}

function monthStartOf(termJD, tz) {
  // 해당 절기 시점을 포함하는 달의 삭(그 이전 가장 가까운 신월).
  // 이전 달로 넘어갈 때는 한 삭망월(~29.5일)만큼 물러나야 한다.
  let nm = newMoonJD(termJD + 1);
  while (localJDN(nm, tz) > localJDN(termJD, tz)) nm = newMoonJD(nm - 29.53);
  return nm;
}

/** 음력(윤달 포함) → 양력 {Y,M,D} */
export function lunarToSolar(lunarYear, month, isLeap, day, tz = KST) {
  const year = buildLunarYear(lunarYear, tz);
  const m = year.find((x) => x.number === month && x.leap === !!isLeap)
        || year.find((x) => x.number === month && !x.leap);
  if (!m) return null;
  const jdn = m.startJDN + (day - 1);
  return jdnToDate(jdn);
}

/** 양력 → 음력 { year, month, isLeap, day } */
export function solarToLunar(Y, M, D, tz = KST) {
  const targetJDN = jdnFromDate(Y, M, D);
  for (const ly of [Y, Y - 1, Y + 1]) {
    const year = buildLunarYear(ly, tz);
    for (let i = 0; i < year.length; i++) {
      const start = year[i].startJDN;
      const end = i + 1 < year.length ? year[i + 1].startJDN : start + 30;
      if (targetJDN >= start && targetJDN < end) {
        return { year: ly, month: year[i].number, isLeap: year[i].leap, day: targetJDN - start + 1 };
      }
    }
  }
  return null;
}

/** JDN(정수) → 그레고리력 날짜 */
function jdnToDate(jdn) {
  let a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { Y: year, M: month, D: day };
}

export { jdnToDate };
