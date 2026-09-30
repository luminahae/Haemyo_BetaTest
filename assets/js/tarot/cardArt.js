import { mulberry32 } from "../utils/dom.js";
/* =========================================================
   타로 카드 SVG 아트 생성기
   - 카드마다 고유한 상징 장면을 그린다(색만 바꾼 재사용 금지).
   - 스타일: 아이보리 배경, 얇은 금색 선화, 절제된 신비로움.
   - viewBox 300x510 (카드 비율 ≈ 1:1.7)
   ========================================================= */

const W = 300, H = 510;
const INK = "#2a2418", GOLD = "#a9822f", GOLD2 = "#c9a24c";
const IVORY = "#f4ecd8", IVORY2 = "#efe4cb", NIGHT = "#1a2740";

/* 공용 장식 프레임 + 카드명/번호 */
function frame(inner, { name, roman }) {
  return `
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fbf5e6"/>
        <stop offset="1" stop-color="#efe3c8"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="55%">
        <stop offset="0" stop-color="#fff6e0"/>
        <stop offset="1" stop-color="#f0e4c7"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" rx="16" fill="url(#sky)"/>
    <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="10" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
    <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="7" fill="none" stroke="${GOLD2}" stroke-width="0.7" opacity="0.7"/>
    ${cornerFlourishes()}
    <g transform="translate(0,26)">
      <text x="${W / 2}" y="0" text-anchor="middle" fill="${GOLD}" font-family="Georgia, serif" font-size="15" letter-spacing="3">${roman}</text>
    </g>
    <g transform="translate(0,4)">${inner}</g>
    <g transform="translate(0,-2)">
      <line x1="52" y1="${H - 52}" x2="${W - 52}" y2="${H - 52}" stroke="${GOLD}" stroke-width="0.8" opacity="0.7"/>
      <text x="${W / 2}" y="${H - 30}" text-anchor="middle" fill="${INK}" font-family="Georgia, 'Nanum Myeongjo', serif" font-size="18" letter-spacing="2">${name}</text>
    </g>
  </svg>`;
}

function cornerFlourishes() {
  const c = (x, y, sx, sy) =>
    `<g transform="translate(${x},${y}) scale(${sx},${sy})" fill="none" stroke="${GOLD2}" stroke-width="0.9" opacity="0.8">
      <path d="M0 22 C0 8 8 0 22 0"/>
      <circle cx="7" cy="7" r="1.6" fill="${GOLD2}" stroke="none"/>
    </g>`;
  return c(22, 22, 1, 1) + c(W - 22, 22, -1, 1) + c(22, H - 22, 1, -1) + c(W - 22, H - 22, -1, -1);
}

/* ---- 공통 심볼 헬퍼 ---- */
const stroke = (extra = "") => `fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}`;
const gline = (extra = "") => `fill="none" stroke="${GOLD}" stroke-width="1.3" ${extra}`;

function stars(list) {
  return list.map(([x, y, r]) => star(x, y, r)).join("");
}
function star(cx, cy, r = 4) {
  let pts = "";
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const rr = i % 2 ? r * 0.42 : r;
    pts += `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr} `;
  }
  return `<polygon points="${pts}" fill="${GOLD2}" opacity="0.9"/>`;
}
function sunRays(cx, cy, r, n = 12) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    const x1 = cx + Math.cos(a) * (r + 6), y1 = cy + Math.sin(a) * (r + 6);
    const x2 = cx + Math.cos(a) * (r + (i % 2 ? 26 : 16)), y2 = cy + Math.sin(a) * (r + (i % 2 ? 26 : 16));
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${gline()}/>`;
  }
  return s;
}
function human(x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})" ${stroke()}>
    <circle cx="0" cy="0" r="9"/>
    <path d="M0 9 L0 40 M0 16 L-14 30 M0 16 L14 30 M0 40 L-11 66 M0 40 L11 66"/>
  </g>`;
}
const mountains = (y) => `<path d="M0 ${y} L70 ${y - 46} L120 ${y - 10} L180 ${y - 60} L240 ${y - 14} L300 ${y - 40} L300 ${y + 40} L0 ${y + 40} Z" fill="${INK}" opacity="0.14"/>`;

/* ---- 카드별 장면 ---- */
const SCENES = {
  fool: () => `${stars([[60,120,4],[240,90,3],[210,150,3]])}
    <circle cx="150" cy="150" r="58" fill="url(#glow)" opacity="0.6"/>
    ${sunRays(150,150,42,10)}
    ${human(150,150,1.1)}
    <path d="M120 250 L300 250" stroke="${INK}" stroke-width="0" />
    <path d="M96 320 C120 300 150 300 168 322 L300 322" ${stroke()} opacity="0.5"/>
    <path d="M96 320 L96 260 L60 300 Z" fill="${INK}" opacity="0.16"/>
    <circle cx="120" cy="238" r="7" ${gline()}/>
    <text x="150" y="360" text-anchor="middle" fill="${GOLD}" font-size="26" font-family="serif">✦</text>`,

  magician: () => `${stars([[62,96,3],[236,96,3]])}
    <path d="M150 92 a10 6 0 1 0 0.1 0 M138 92 a10 6 0 1 0 0.1 0" ${gline()}/>
    ${human(150,150,1.05)}
    <path d="M150 120 L150 78" ${stroke()}/>
    <rect x="96" y="250" width="108" height="10" rx="3" fill="${INK}" opacity="0.16"/>
    <g ${gline()}>
      <circle cx="112" cy="238" r="7"/>
      <rect x="135" y="231" width="14" height="14"/>
      <path d="M170 245 l7 -14 7 14 z"/>
      <path d="M196 231 q7 7 0 14 q-7 -7 0 -14"/>
    </g>`,

  priestess: () => `${stars([[70,90,3],[230,90,3],[150,70,4]])}
    <rect x="70" y="96" width="16" height="150" fill="${INK}" opacity="0.16"/>
    <rect x="214" y="96" width="16" height="150" fill="${INK}" opacity="0.16"/>
    <path d="M96 110 Q150 96 204 110 L204 250 L96 250 Z" fill="${IVORY}" stroke="${GOLD}" stroke-width="1"/>
    <path d="M150 120 a18 26 0 1 0 0.1 0" ${gline()}/>
    ${human(150,170,0.9)}
    <path d="M96 300 q54 -20 108 0" ${gline()}/>
    <circle cx="150" cy="150" r="6" ${gline()}/>`,

  empress: () => `${stars([[60,90,3],[240,90,3]])}
    <path d="M150 96 l6 12 12 2 -9 9 3 12 -12 -6 -12 6 3 -12 -9 -9 12 -2 z" fill="${GOLD2}"/>
    ${human(150,160,1.05)}
    <path d="M60 330 q90 -50 180 0" ${gline()}/>
    <g ${gline()}>
      <path d="M90 300 v-26 M110 300 v-34 M130 300 v-26 M170 300 v-30 M190 300 v-24 M210 300 v-32"/>
    </g>
    <path d="M140 250 q10 -14 20 0 q-10 8 -20 0" fill="${INK}" opacity="0.12"/>`,

  emperor: () => `${mountains(300)}
    <path d="M108 130 h84 v18 h-84 z" ${stroke()}/>
    <path d="M118 130 l6 -14 6 14 M138 130 l6 -14 6 14 M158 130 l6 -14 6 14 M178 130 l6 -14 6 14" ${stroke()}/>
    ${human(150,200,1.15)}
    <rect x="104" y="248" width="92" height="60" rx="6" fill="${INK}" opacity="0.15"/>
    <path d="M150 168 l0 -24" ${gline()}/><circle cx="150" cy="140" r="5" ${gline()}/>`,

  hierophant: () => `<rect x="78" y="110" width="14" height="150" fill="${INK}" opacity="0.15"/>
    <rect x="208" y="110" width="14" height="150" fill="${INK}" opacity="0.15"/>
    ${human(150,160,1.05)}
    <path d="M150 118 l0 -22 8 8 M150 96 l-8 8" ${gline()}/>
    <g ${gline()} transform="translate(150,300)">
      <path d="M-16 0 l32 0 M0 -16 l0 32" transform="rotate(30)"/>
      <path d="M-16 0 l32 0 M0 -16 l0 32" transform="rotate(-30)"/>
    </g>
    ${human(116,300,0.5)}${human(184,300,0.5)}`,

  lovers: () => `<path d="M150 96 q14 14 0 24 q-14 -10 0 -24" ${gline()}/>
    ${sunRays(150,150,20,8)}
    <circle cx="150" cy="150" r="18" fill="url(#glow)"/>
    ${human(112,220,0.95)}${human(188,220,0.95)}
    <path d="M96 300 q10 -40 0 -70" ${gline()}/>
    <path d="M204 300 q-10 -40 0 -70" ${gline()}/>
    <path d="M150 300 q-30 -10 -54 0 M150 300 q30 -10 54 0" ${stroke()} opacity="0.5"/>`,

  chariot: () => `${stars([[80,86,3],[150,70,4],[220,86,3]])}
    <path d="M104 150 h92 l-10 60 h-72 z" ${stroke()}/>
    <path d="M104 150 q46 -30 92 0" ${gline()}/>
    ${human(150,120,0.9)}
    <circle cx="120" cy="245" r="22" ${stroke()}/><circle cx="180" cy="245" r="22" ${stroke()}/>
    <circle cx="120" cy="245" r="4" fill="${GOLD2}"/><circle cx="180" cy="245" r="4" fill="${GOLD2}"/>
    ${star(150,175,7)}`,

  strength: () => `<path d="M150 96 a10 6 0 1 0 0.1 0 M138 96 a10 6 0 1 0 0.1 0" ${gline()}/>
    ${human(126,150,1)}
    <g ${stroke()} transform="translate(175,215)">
      <circle cx="0" cy="0" r="22"/>
      <path d="M-22 0 q-16 -4 -30 4 M22 0 q16 -4 30 4" opacity="0.6"/>
      <circle cx="-7" cy="-4" r="2" fill="${INK}"/><circle cx="7" cy="-4" r="2" fill="${INK}"/>
      <path d="M-8 8 q8 6 16 0"/>
    </g>
    <path d="M96 300 q54 -16 108 0" ${gline()} opacity="0.6"/>`,

  hermit: () => `${stars([[70,80,3],[150,64,4],[228,88,3]])}
    ${mountains(330)}
    ${human(150,160,1.1)}
    <path d="M188 190 l0 90" ${stroke()}/>
    <g transform="translate(120,175)">
      <path d="M-12 -12 h24 v24 h-24 z" ${gline()}/>
      ${star(0,0,6)}
    </g>`,

  wheel: () => `${stars([[64,80,3],[236,80,3],[64,240,3],[236,240,3]])}
    <circle cx="150" cy="185" r="66" ${stroke()}/>
    <circle cx="150" cy="185" r="40" ${gline()}/>
    <circle cx="150" cy="185" r="8" fill="${GOLD2}"/>
    <g ${gline()}>
      <path d="M150 119 v132 M84 185 h132 M103 138 l94 94 M197 138 l-94 94"/>
    </g>
    <text x="150" y="120" text-anchor="middle" fill="${GOLD}" font-size="14">✦</text>`,

  justice: () => `<rect x="82" y="118" width="12" height="140" fill="${INK}" opacity="0.14"/>
    <rect x="206" y="118" width="12" height="140" fill="${INK}" opacity="0.14"/>
    ${human(150,170,1)}
    <path d="M150 150 l0 -34" ${stroke()}/>
    <g ${stroke()} transform="translate(150,210)">
      <path d="M-46 0 h92 M0 -6 v18"/>
      <path d="M-46 0 l-10 20 h20 z M46 0 l-10 20 h20 z" fill="none"/>
    </g>`,

  hanged: () => `<path d="M70 96 h120 M96 96 v40" ${stroke()}/>
    <g transform="translate(96,196) rotate(180)">
      ${human(0,0,1.05)}
    </g>
    <circle cx="96" cy="120" r="26" fill="url(#glow)" opacity="0.5"/>
    ${sunRays(96,120,22,10)}
    <path d="M96 136 l0 24" ${stroke()}/>`,

  death: () => `${mountains(340)}
    <path d="M150 320 a34 34 0 1 0 0.1 0" ${stroke()}/>
    <path d="M136 316 a6 7 0 1 0 0.1 0 M164 316 a6 7 0 1 0 0.1 0" ${stroke()}/>
    <path d="M138 340 h24 M142 348 v10 M150 348 v10 M158 348 v10" ${stroke()}/>
    <circle cx="150" cy="150" r="34" fill="url(#glow)" opacity="0.55"/>
    ${sunRays(150,150,30,12)}
    <path d="M60 250 q90 30 180 0" ${gline()} opacity="0.6"/>`,

  temperance: () => `<path d="M150 96 a10 6 0 1 0 0.1 0 M138 96 a10 6 0 1 0 0.1 0" ${gline()}/>
    ${human(150,150,1.05)}
    <g ${gline()}>
      <path d="M112 210 q-6 -18 0 -30 l16 0 q6 12 0 30 z"/>
      <path d="M172 232 q-6 -18 0 -30 l16 0 q6 12 0 30 z"/>
      <path d="M126 208 q22 8 44 22" stroke-dasharray="2 5"/>
    </g>
    <path d="M96 300 h108" ${stroke()} opacity="0.4"/>
    <path d="M150 300 l0 -14" ${gline()}/>`,

  devil: () => `<path d="M124 118 l-14 -22 M176 118 l14 -22" ${stroke()}/>
    <path d="M110 130 a40 30 0 0 1 80 0 z" ${stroke()}/>
    <circle cx="132" cy="126" r="4" fill="${INK}"/><circle cx="168" cy="126" r="4" fill="${INK}"/>
    ${human(118,240,0.85)}${human(182,240,0.85)}
    <path d="M118 268 q32 24 64 0" ${gline()} stroke-dasharray="2 4"/>
    <circle cx="150" cy="180" r="6" ${gline()}/>`,

  tower: () => `${stars([[70,90,3],[230,90,3]])}
    <path d="M126 300 l6 -150 h36 l6 150 z" ${stroke()}/>
    <path d="M120 150 h60 l-6 -20 h-48 z" ${stroke()}/>
    <path d="M150 60 l-16 60 32 0 z" fill="${GOLD2}"/>
    <path d="M150 96 l-40 -30 M150 96 l40 -30" ${gline()}/>
    <path d="M110 240 l-24 20 M190 250 l24 18" ${stroke()} opacity="0.6"/>`,

  star: () => `${star(150,120,26)}
    ${stars([[86,150,7],[214,150,7],[100,200,5],[200,200,5],[150,220,6],[70,110,4],[230,110,4]])}
    ${human(150,270,0.8)}
    <path d="M96 330 q54 -14 108 0" ${gline()}/>
    <g ${gline()}><path d="M120 300 q6 12 -4 20 M180 300 q-6 12 4 20"/></g>`,

  moon: () => `<path d="M170 110 a40 40 0 1 1 -18 -34 a30 30 0 1 0 18 34 z" fill="${GOLD2}" opacity="0.85"/>
    <path d="M96 120 v70 M204 120 v70" ${stroke()}/>
    <path d="M96 120 l-6 -16 h12 z M204 120 l-6 -16 h12 z" fill="${INK}" opacity="0.4"/>
    <path d="M150 300 q-8 -60 0 -120 q8 60 0 120" ${gline()} stroke-dasharray="3 5"/>
    <path d="M112 300 q10 -20 4 -40 M188 300 q-10 -20 -4 -40" ${stroke()} opacity="0.5"/>
    ${stars([[70,180,3],[230,180,3]])}`,

  sun: () => `<circle cx="150" cy="140" r="46" fill="url(#glow)"/>
    ${sunRays(150,140,46,16)}
    <path d="M135 138 a5 5 0 1 0 0.1 0 M160 138 a5 5 0 1 0 0.1 0" ${stroke()}/>
    <path d="M138 152 q12 8 24 0" ${stroke()}/>
    <path d="M70 300 h160" ${gline()}/>
    <g ${gline()}><path d="M90 300 v-22 M110 300 v-30 M190 300 v-30 M210 300 v-22"/></g>
    ${human(150,250,0.7)}`,

  judgement: () => `${mountains(340)}
    <path d="M150 96 a10 6 0 1 0 0.1 0 M138 96 a10 6 0 1 0 0.1 0" ${gline()}/>
    ${human(150,150,1)}
    <path d="M170 150 l40 -20 -6 16 z" ${gline()}/>
    <g ${stroke()} opacity="0.7">
      ${human(112,300,0.55)}${human(150,300,0.55)}${human(188,300,0.55)}
    </g>`,

  world: () => `<ellipse cx="150" cy="185" rx="58" ry="82" ${gline()}/>
    ${human(150,185,0.95)}
    ${star(72,110,7)}${star(228,110,7)}
    <path d="M64 250 q8 12 16 0 M236 250 q-8 12 -16 0" ${stroke()}/>
    <path d="M92 130 q58 -24 116 0 M92 240 q58 24 116 0" ${gline()} opacity="0.5"/>`,
};

const ROMAN = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];

/** 카드 앞면 SVG 문자열 (폴백용) */
export function cardFrontSVG(card) {
  const scene = (SCENES[card.art] || SCENES.star)();
  return frame(scene, { name: card.name, roman: ROMAN[card.number] ?? card.number });
}

/** 메이저 카드 22장은 이미지 시트 한 장(11열 × 2행)에 모여 있다 — 파일 수 줄이기 */
export function majorBgStyle(n) {
  const i = Math.max(0, Math.min(21, Number(n) || 0));
  const x = ((i % 11) / 10) * 100, y = Math.floor(i / 11) * 100;
  return `background-image:url('assets/img/card-major.webp');background-repeat:no-repeat;background-size:1100% 200%;background-position:${x.toFixed(4)}% ${y}%;`;
}

/** 카드 앞면 — 고양이 타로 일러스트(직접 생성). */
export function cardFrontHTML(card) {
  const alt = `${card.name}${card.nameEn ? " (" + card.nameEn + ")" : ""}`;
  // 마이너 아르카나 — 슈트별 이미지 시트(14장 가로 배열)에서 잘라 보여 준다
  const m = /^(wands|cups|swords|pentacles)-(\d+)$/.exec(card.art || "");
  if (m) {
    const x = ((Number(m[2]) - 1) / 13) * 100;
    return `<span class="tcard-img tcard-sprite" role="img" aria-label="${alt}" style="background-image:url('assets/img/card-${m[1]}.webp');background-position:${x.toFixed(4)}% 0;"></span>`;
  }
  return `<span class="tcard-img tcard-sprite" role="img" aria-label="${alt}" style="${majorBgStyle(card.number)}"></span>`;
}

/** 카드 뒷면 — 고양이 만다라(점대칭이라 역방향 구분 안 됨). */
export function cardBackHTML() {
  return `<img class="tcard-img" src="assets/img/card-back.webp" alt="카드 뒷면" draggable="false">`;
}

/** 카드 뒷면 SVG — 중앙 대칭, 별/달/궤도 문양, 얇은 금선 */
export function cardBackSVG() {
  return `
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="카드 뒷면">
    <defs>
      <linearGradient id="bk" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#16294a"/>
        <stop offset="0.5" stop-color="#0f1e3a"/>
        <stop offset="1" stop-color="#16294a"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" rx="16" fill="url(#bk)"/>
    <rect x="10" y="10" width="${W-20}" height="${H-20}" rx="10" fill="none" stroke="${GOLD2}" stroke-width="1" opacity="0.7"/>
    <rect x="16" y="16" width="${W-32}" height="${H-32}" rx="7" fill="none" stroke="${GOLD}" stroke-width="0.6" opacity="0.5"/>
    <g stroke="${GOLD2}" fill="none" stroke-width="0.9" opacity="0.85" transform="translate(150,255)">
      <circle r="86"/><circle r="64" opacity="0.6"/><circle r="40" stroke-dasharray="2 6"/>
      <path d="M0 -100 a10 6 0 1 0 0.1 0 M-12 -100 a10 6 0 1 0 0.1 0"/>
      ${orbitStars()}
      <g stroke-width="0.7">
        <path d="M0 -40 L6 -12 34 -12 12 6 20 34 0 16 -20 34 -12 6 -34 -12 -6 -12 Z" opacity="0.9"/>
      </g>
      <circle r="5" fill="${GOLD2}" stroke="none"/>
      ${petals()}
    </g>
  </svg>`;
}
function orbitStars() {
  let s = "";
  for (let i = 0; i < 8; i++) {
    const a = (2 * Math.PI * i) / 8;
    const x = Math.cos(a) * 64, y = Math.sin(a) * 64;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="${GOLD2}" stroke="none"/>`;
  }
  return s;
}
function petals() {
  let s = "";
  for (let i = 0; i < 12; i++) {
    s += `<path d="M0 -86 q6 8 0 18 q-6 -10 0 -18" transform="rotate(${i * 30})" opacity="0.55"/>`;
  }
  return s;
}

/* ===== (합침) deck.js ===== */
/* 타로 덱 로딩 + 셔플/뽑기 로직 */

let _cards = null;
let _questions = null;

export async function loadTarotData() {
  if (_cards && _questions) return { cards: _cards, questions: _questions };
  const [c, q] = await Promise.all([
    fetch(new URL("../../haemyo-data.json", import.meta.url)).then((r) => r.json()).then((d) => d.cards),
    fetch(new URL("../../haemyo-data.json", import.meta.url)).then((r) => r.json()).then((d) => d.questions),
  ]);
  _cards = c.cards;
  _questions = q;
  return { cards: _cards, questions: _questions };
}

export function getTopics() { return _questions ? _questions.topics : []; }
export function getSpreads() { return _questions ? _questions.spreads : []; }
export function getSpreadGroups() { return (_questions && _questions.spreadGroups) || ["기본"]; }
export function getTopic(id) { return getTopics().find((t) => t.id === id) || null; }
export function getSpread(id) { return getSpreads().find((s) => s.id === id) || null; }

/**
 * 화면에 펼칠 카드 뭉치를 만든다.
 * 사용자가 '어느 위치'를 고를지 모르게 하기 위해, 각 슬롯에 미리
 * (셔플된) 카드와 정/역방향을 숨겨 배정한다. 선택 전에는 앞면이 보이지 않는다.
 * seed가 없으면 진짜 무작위(암호학적)로 섞는다.
 */
export function buildDeckSlots(cardCount, spreadCount, seed, mode = "major") {
  const rand = seed != null ? mulberry32(seed) : cryptoRand();
  // mode: "major" = 메이저 22장(고양이 카드) / "full" = 78장 전체
  const pool = [..._cards.keys()].filter((i) => mode === "full" || !_cards[i].suit || _cards[i].suit === "major");
  const indices = shuffle(pool, rand).slice(0, cardCount);
  return indices.map((idx) => ({
    cardIndex: idx,
    reversed: rand() < 0.42, // 역방향 확률(약 42%)
  }));
}

function cryptoRand() {
  return function () {
    const buf = new Uint32Array(1);
    (self.crypto || window.crypto).getRandomValues(buf);
    return buf[0] / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getCard(index) { return _cards[index]; }
