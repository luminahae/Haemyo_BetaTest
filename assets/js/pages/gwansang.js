import { el, clear, toast } from "../utils/dom.js";
import { backLink, pageHeader, noticeBox, loadDisclaimer } from "./_shared.js";
import { isUnlocked, unlock, getCoins, costOf } from "../wallet.js";

/* 얼굴 특징 → 성향 스니펫. 직접 고른 특징 기반의 재미용 해석(실제 관상은 전문 영역). */
const GROUPS = [
  { id: "face", label: "얼굴형", opts: [
    { v: "round", t: "둥근형", p: "정이 많고 원만해요. 사람을 편하게 해요.", m: "재물이 붙는 편이나 정에 약해 새기 쉬워요." },
    { v: "square", t: "각진형", p: "의지가 강하고 추진력이 있어요.", m: "노력형 재물운, 고집이 손해를 부르기도." },
    { v: "long", t: "긴형", p: "신중하고 계획적이에요.", m: "차곡차곡 모으는 안정형이에요." },
    { v: "oval", t: "계란형", p: "균형감이 좋고 세련됐어요.", m: "인연과 기회로 재물이 들어와요." },
  ] },
  { id: "brow", label: "이마", opts: [
    { v: "wide", t: "넓은 이마", p: "머리가 트이고 통이 커요.", m: "초년보다 중년 이후 크게 열려요." },
    { v: "narrow", t: "좁은 이마", p: "집중력과 현실 감각이 좋아요.", m: "실속을 챙기는 알뜰형이에요." },
  ] },
  { id: "eye", label: "눈", opts: [
    { v: "big", t: "큰 눈", p: "감정이 풍부하고 표현이 솔직해요.", m: "인연·매력으로 기회가 생겨요." },
    { v: "small", t: "작은 눈", p: "속이 깊고 신중해요.", m: "한 번 잡은 건 오래 지켜요." },
    { v: "up", t: "올라간 눈", p: "당차고 승부욕이 있어요.", m: "도전으로 재물을 만들어요." },
    { v: "down", t: "처진 눈", p: "부드럽고 배려심이 깊어요.", m: "사람 덕에 복이 들어와요." },
  ] },
  { id: "nose", label: "코", opts: [
    { v: "high", t: "오뚝한 코", p: "자존심과 주관이 뚜렷해요.", m: "재물 그릇이 커요(코=재물궁)." },
    { v: "low", t: "낮은 코", p: "겸손하고 무던해요.", m: "욕심내기보다 관리로 모아요." },
    { v: "big", t: "큰 코", p: "추진력과 재물 욕구가 강해요.", m: "벌이도 크고 씀씀이도 커요." },
  ] },
  { id: "mouth", label: "입", opts: [
    { v: "big", t: "큰 입", p: "적극적이고 사회성이 좋아요.", m: "활동으로 재물을 넓혀요." },
    { v: "small", t: "작은 입", p: "섬세하고 절제력이 있어요.", m: "지키고 아끼는 힘이 커요." },
    { v: "full", t: "도톰한 입술", p: "정이 많고 애정 표현이 풍부해요.", m: "인복이 재물로 이어져요." },
  ] },
];

/* ---------- 사진으로 얼굴 특징 읽기 ----------
   얼굴 랜드마크 68점(@vladmandic/face-api)을 브라우저 안에서 계산 — 사진은 어디에도 보내지 않는다.
   라이브러리·모델은 처음 쓸 때 CDN에서 한 번만 받아 온다. */
// 라이브러리와 모델을 앱 안(assets/js/utils/faceapi.js)에 넣어 둬서, 외부 사이트 차단과 상관없이 동작
let faPromise = null;
function b64ToBuf(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function loadFaceApi() {
  if (!faPromise) {
    faPromise = import("../utils/faceapi.js").then(async (faceapi) => {
      const M = faceapi.HAEMYO_MODELS;
      const map = (k) => faceapi.tf.io.decodeWeights(b64ToBuf(M[k].b64), M[k].specs);
      await faceapi.nets.tinyFaceDetector.loadFromWeightMap(map("tiny_face_detector_model"));
      await faceapi.nets.faceLandmark68Net.loadFromWeightMap(map("face_landmark_68_model"));
      return faceapi;
    }).catch((e) => { faPromise = null; throw e; });
  }
  return faPromise;
}
const D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/** 랜드마크 → 관상 선택지 */
function featuresFrom(pts, box) {
  const P = (i) => pts[i];
  const faceW = D(P(0), P(16));
  const browY = Math.min(P(19).y, P(24).y);
  const faceH = P(8).y - browY;
  const ratio = faceH / faceW;
  const jaw = D(P(5), P(11)) / faceW;
  // 기준값은 정면 사진 여러 장으로 맞춘 대략치
  let face = "oval";
  if (ratio > 1.0) face = "long";
  else if (jaw > 0.72) face = ratio < 0.92 ? "round" : "square";
  else if (ratio < 0.9) face = "round";
  const foreRatio = (browY - box.y) / box.height;
  const brow = foreRatio > 0.1 ? "wide" : "narrow";
  const eyeW = (D(P(36), P(39)) + D(P(42), P(45))) / 2;
  const tilt = ((P(39).y - P(36).y) + (P(42).y - P(45).y)) / 2 / eyeW; // +면 눈꼬리가 올라감
  const eyeSize = eyeW / faceW;
  const eye = tilt > 0.09 ? "up" : tilt < 0.035 ? "down" : eyeSize > 0.176 ? "big" : "small";
  const noseW = D(P(31), P(35)) / faceW;
  const noseL = D(P(27), P(33)) / faceH;
  const nose = noseW > 0.2 ? "big" : noseL > 0.333 ? "high" : "low";
  const mouthW = D(P(48), P(54)) / faceW;
  const lips = (D(P(51), P(62)) + D(P(66), P(57))) / D(P(48), P(54));
  const mouth = lips > 0.3 ? "full" : mouthW > 0.385 ? "big" : "small";
  return { face, brow, eye, nose, mouth };
}
function fileToImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => res({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("이미지를 열 수 없어요")); };
    img.src = url;
  });
}

export function renderGwansang({ navigate }) {
  loadDisclaimer();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("관상", "얼굴로 보는 성향", "얼굴 사진을 찍거나 앨범에서 고르면, 해묘가 눈·코·입·얼굴형을 읽어 줘요. 직접 골라도 돼요."));

  const sel = {};
  let fromPhoto = false;

  // 사진 입력 — 카메라 / 앨범
  const camIn = el("input", { type: "file", accept: "image/*", capture: "user", hidden: true });
  const albIn = el("input", { type: "file", accept: "image/*", hidden: true });
  const photoBox = el("div", { class: "gs-photo" });
  const status = el("p", { class: "muted tiny", "aria-live": "polite", style: "text-align:center; margin-top:8px;" });
  const photoPanel = el("section", { class: "wrap" }, [
    el("div", { class: "panel panel-gold" }, [
      el("p", { style: "font-weight:700;", text: "사진으로 관상 보기" }),
      el("p", { class: "muted tiny", style: "margin-top:4px;", text: "정면·밝은 곳·앞머리 없이 찍으면 더 정확해요. 사진은 이 기기 안에서만 분석하고 어디에도 저장·전송하지 않아요." }),
      el("div", { class: "btn-row", style: "margin-top: var(--sp-3); gap:8px;" }, [
        el("button", { class: "btn btn-primary", type: "button", style: "flex:1;", onclick: () => camIn.click() }, [el("span", { text: "📷 카메라로 찍기" })]),
        el("button", { class: "btn btn-ghost", type: "button", style: "flex:1;", onclick: () => albIn.click() }, [el("span", { text: "🖼️ 앨범에서 고르기" })]),
      ]),
      camIn, albIn, photoBox, status,
    ]),
  ]);
  root.append(photoPanel);

  async function onFile(file) {
    if (!file) return;
    clear(photoBox);
    status.textContent = "사진을 불러오는 중…";
    let loaded;
    try { loaded = await fileToImage(file); } catch (e) { status.textContent = e.message; return; }
    const { img, url } = loaded;
    const canvas = el("canvas", { class: "gs-canvas" });
    const scale = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    photoBox.append(canvas);
    status.textContent = "얼굴을 읽는 중… (처음 한 번은 조금 걸려요)";
    try {
      const faceapi = await loadFaceApi();
      const det = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })).withFaceLandmarks();
      if (!det) { status.textContent = "얼굴을 찾지 못했어요. 정면으로 밝게 다시 찍어 주세요. (아래에서 직접 골라도 돼요)"; return; }
      const pts = det.landmarks.positions;
      ctx.fillStyle = "rgba(255,200,220,.9)";
      pts.forEach((pt) => { ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(1.5, canvas.width / 260), 0, Math.PI * 2); ctx.fill(); });
      const f = featuresFrom(pts, det.detection.box);
      Object.assign(sel, f); fromPhoto = true;
      status.textContent = "사진에서 특징을 읽었어요! 아래 선택이 자동으로 채워졌어요. 다르면 눌러서 고쳐 주세요.";
      paintForm();
    } catch (e) {
      status.textContent = "얼굴 분석 중 문제가 생겼어요. 다른 사진으로 다시 해 보거나, 아래에서 직접 골라 주세요."; console.error("FA", e && e.message);
    }
  }
  camIn.addEventListener("change", () => onFile(camIn.files[0]));
  albIn.addEventListener("change", () => onFile(albIn.files[0]));
  const host = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  root.append(host);

  function itemId() { return "gwansang:" + GROUPS.map((g) => sel[g.id] || "-").join(""); }
  const cost = costOf("gwansang");

  function paintForm() {
    clear(host);
    host.append(el("p", { class: "muted tiny", style: "margin: var(--sp-4) 0 var(--sp-2);", text: fromPhoto ? "사진에서 읽은 특징 · 다르면 눌러서 고쳐요" : "또는 직접 골라 보세요" }));
    GROUPS.forEach((g) => {
      host.append(el("div", { class: "field" }, [
        el("label", { text: g.label }),
        el("div", { class: "chip-grid" }, g.opts.map((o) => {
          const chip = el("button", { class: "chip" + (sel[g.id] === o.v ? " is-selected" : ""), type: "button",
            onclick: () => { sel[g.id] = o.v; paintForm(); } }, [el("span", { text: o.t })]);
          return chip;
        })),
      ]));
    });
    const done = GROUPS.every((g) => sel[g.id]);
    const cta = el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", disabled: !done, onclick: () => {
      if (isUnlocked(itemId())) { paintReading(); return; }
      const coins = getCoins();
      if (coins >= cost) {
        const r = unlock(itemId(), cost);
        if (r.ok) { toast(r.reason === "spent" ? "관상 풀이를 열었어요" : "이미 열어 둔 풀이예요."); paintReading(); }
      } else { toast("코인이 부족해요."); navigate("/store"); }
    } }, [el("span", { text: done ? (isUnlocked(itemId()) ? "관상 풀이 보기" : `코인 ${cost}개로 풀이 보기`) : "특징을 모두 골라 주세요" })]);
    host.append(cta);
  }

  function paintReading() {
    clear(host);
    const picks = GROUPS.map((g) => g.opts.find((o) => o.v === sel[g.id]));
    const score = 58 + (picks.reduce((a, o) => a + o.t.length, 0) % 30);
    host.append(el("div", { class: "section-gap" }, [
      el("div", { class: "panel", style: "display:flex; gap:8px; flex-wrap:wrap;" }, picks.map((o) => el("span", { class: "lucky-chip", text: o.t }))),
      fromPhoto ? el("p", { class: "muted tiny", text: "※ 사진 속 눈·코·입·턱의 비율을 재서 고른 특징이에요. 각도·조명·표정에 따라 달라질 수 있어요." }) : null,
      block("성격·기질", picks.map((o) => o.p)),
      block("재물·복", picks.map((o) => o.m)),
      el("div", { class: "insight", text: "관상은 타고난 인상일 뿐, 표정과 태도가 인상을 바꿔요. 잘 웃고 눈을 맞추는 습관이 가장 좋은 관상입니다." }),
      noticeBox("info", "얼굴 특징에 기반한 재미용 해석이에요. 실제 관상은 전체 균형을 보는 전문 영역이며, 외모로 사람을 판단하지 않아요."),
      el("button", { class: "btn btn-ghost btn-block", onclick: paintForm }, [el("span", { text: "특징 다시 고르기" })]),
    ].filter(Boolean)));
  }

  paintForm();
  return root;
}

function block(label, items) {
  return el("div", { class: "panel" }, [
    el("p", { style: "font-weight:700; margin-bottom:6px;", text: label }),
    ...items.map((t) => el("p", { class: "muted", style: "font-size:var(--fs-sm); margin-top:4px;", text: t })),
  ]);
}
