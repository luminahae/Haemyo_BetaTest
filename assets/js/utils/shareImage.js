/* 공유용 결과 카드 이미지 생성 (Canvas) + Web Share / 다운로드.
   개인정보 보호: 생년월일 전체 대신 'YYYY년생', 시간 미공개, 닉네임만 노출. */

const CW = 1080, CH = 1350; // 4:5 세로 카드

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(/(\s+)/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW && line) {
      lines.push(line.trimEnd());
      line = w.trimStart();
    } else line += w;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

/** 안전한 프로필 라벨 (민감정보 마스킹) */
export function maskedProfileLabel(meta) {
  const parts = [];
  if (meta.nickname) parts.push(meta.nickname);
  if (meta.birthYear) parts.push(`${meta.birthYear}년생`);
  parts.push(meta.timeUnknown ? "출생 시간 미공개" : "출생 시간 비공개");
  return parts.join(" · ");
}

/**
 * @param {object} opts { kind:'saju'|'tarot', eyebrow, title, summary, tags:[], profileLabel }
 * @returns {Promise<Blob>}
 */
export function renderShareCard(opts) {
  const canvas = document.createElement("canvas");
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext("2d");

  // 배경 (핑크 오로라 밤)
  const g = ctx.createLinearGradient(0, 0, CW, CH);
  g.addColorStop(0, "#2a1030");
  g.addColorStop(1, "#150a1a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);

  // 은은한 로즈 광
  const rg = ctx.createRadialGradient(CW * 0.8, CH * 0.1, 50, CW * 0.8, CH * 0.1, 760);
  rg.addColorStop(0, "rgba(236,131,190,0.24)");
  rg.addColorStop(1, "rgba(236,131,190,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, CW, CH);
  // 라벤더 광 (반대쪽)
  const rg2 = ctx.createRadialGradient(CW * 0.15, CH * 0.9, 40, CW * 0.15, CH * 0.9, 640);
  rg2.addColorStop(0, "rgba(184,132,216,0.18)");
  rg2.addColorStop(1, "rgba(184,132,216,0)");
  ctx.fillStyle = rg2;
  ctx.fillRect(0, 0, CW, CH);

  // 별
  ctx.fillStyle = "rgba(245,220,235,0.75)";
  const starSeed = [[120,180,3],[900,240,2],[820,120,2],[200,300,2],[980,520,3],[80,620,2],[1000,900,2],[140,1000,2]];
  for (const [x, y, r] of starSeed) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }

  // 프레임
  ctx.strokeStyle = "rgba(228,131,187,0.5)";
  ctx.lineWidth = 2;
  roundRect(ctx, 48, 48, CW - 96, CH - 96, 28);
  ctx.stroke();

  const padX = 110, maxW = CW - padX * 2;
  let y = 210;

  // eyebrow
  ctx.fillStyle = "#f2b0d6";
  ctx.font = "600 34px 'Pretendard', 'Apple SD Gothic Neo', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText((opts.eyebrow || "").toUpperCase(), padX, y);
  y += 70;

  // title (serif)
  ctx.fillStyle = "#f4ecd8";
  ctx.font = "600 76px Georgia, 'Nanum Myeongjo', serif";
  for (const line of wrapLines(ctx, opts.title, maxW)) {
    ctx.fillText(line, padX, y);
    y += 92;
  }
  y += 16;

  // divider
  ctx.strokeStyle = "rgba(228,131,187,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(padX + 120, y); ctx.stroke();
  y += 60;

  // summary body
  ctx.fillStyle = "#f4e9f1";
  ctx.font = "400 40px 'Pretendard', 'Apple SD Gothic Neo', sans-serif";
  const bodyLines = wrapLines(ctx, opts.summary, maxW).slice(0, 9);
  for (const line of bodyLines) {
    ctx.fillText(line, padX, y);
    y += 62;
  }

  // tags
  if (opts.tags && opts.tags.length) {
    y += 30;
    let tx = padX;
    ctx.font = "500 32px 'Pretendard', sans-serif";
    for (const tag of opts.tags.slice(0, 4)) {
      const tw = ctx.measureText(tag).width + 44;
      if (tx + tw > CW - padX) break;
      ctx.strokeStyle = "rgba(228,131,187,0.5)";
      roundRect(ctx, tx, y - 34, tw, 52, 26);
      ctx.stroke();
      ctx.fillStyle = "#f2b0d6";
      ctx.fillText(tag, tx + 22, y);
      tx += tw + 18;
    }
  }

  // footer: 프로필(마스킹) + 서비스명
  ctx.textAlign = "left";
  ctx.fillStyle = "#cfb4cd";
  ctx.font = "400 30px 'Pretendard', sans-serif";
  ctx.fillText(opts.profileLabel || "", padX, CH - 150);

  ctx.fillStyle = "#e483bb";
  ctx.font = "600 30px 'Pretendard', sans-serif";
  ctx.fillText("해묘 解猫 · 인생이 묘할 때, 해묘", padX, CH - 100);

  ctx.fillStyle = "#9d83a3";
  ctx.font = "400 26px 'Pretendard', sans-serif";
  ctx.fillText("자기이해를 위한 참고 콘텐츠 · 미래를 확정하지 않습니다", padX, CH - 62);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}

/** 이미지 다운로드 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Web Share API로 공유(가능하면 파일 포함), 아니면 false 반환 */
export async function shareImage(blob, { title, text }) {
  const file = new File([blob], "saju-tarot-result.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title, text, files: [file] });
      return true;
    } catch (e) {
      if (e && e.name === "AbortError") return true; // 사용자가 취소
      return false;
    }
  }
  return false;
}

/** 텍스트만 공유(파일 미지원 환경) */
export async function shareText({ title, text }) {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return true; }
    catch (e) { return e && e.name === "AbortError"; }
  }
  return false;
}

/* =========================================================
   리포트 통째로 저장 — 이미지(PNG) / PDF
   html2canvas·jsPDF는 처음 누를 때만 CDN(jsDelivr)에서 받아 온다.
   ========================================================= */
const LIB = () => window.__LIB_BASE || "https://cdn.jsdelivr.net/npm";
function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => (window[globalName] ? res(window[globalName]) : rej(new Error("load")));
    s.onerror = () => rej(new Error("load"));
    document.head.appendChild(s);
  });
}
const loadH2C = () => loadScript(`${LIB()}/html2canvas@1.4.1/dist/html2canvas.min.js`, "html2canvas");
const loadPDF = () => loadScript(`${LIB()}/jspdf@4.2.1/dist/jspdf.umd.min.js`, "jspdf");

/** 화면의 한 부분을 캔버스로 — 접힌 섹션은 펼치고, 버튼·메뉴는 빼고 찍는다 */
async function captureNode(node) {
  const h2c = await loadH2C();
  const opened = [];
  node.querySelectorAll("details:not([open])").forEach((d) => { d.open = true; opened.push(d); });
  document.body.classList.add("is-capturing");
  await new Promise((r) => setTimeout(r, 120));
  try {
    const h = node.scrollHeight;
    const scale = Math.max(1, Math.min(2, 14000 / Math.max(1, h)));
    return await h2c(node, {
      backgroundColor: "#8a5d86", scale, useCORS: true, logging: false,
      ignoreElements: (el) => !!(el.hasAttribute && (el.hasAttribute("data-nocapture") || (el.classList && (el.classList.contains("action-bar") || el.classList.contains("person-switch") || el.classList.contains("to-top"))))),
      windowWidth: Math.max(390, node.scrollWidth),
    });
  } finally {
    document.body.classList.remove("is-capturing");
    opened.forEach((d) => { d.open = false; });
  }
}

export async function exportNodeAsImage(node, filename = "haemyo-report.png") {
  const canvas = await captureNode(node);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  downloadBlob(blob, filename);
}

export async function exportNodeAsPdf(node, filename = "haemyo-report.pdf") {
  const [canvas, lib] = await Promise.all([captureNode(node), loadPDF()]);
  const { jsPDF } = lib;
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = 210, pageH = 297, margin = 8;
  const imgW = pageW - margin * 2;
  const pxPerMm = canvas.width / imgW;
  const sliceH = Math.floor((pageH - margin * 2) * pxPerMm);
  for (let y = 0, i = 0; y < canvas.height; y += sliceH, i++) {
    const h = Math.min(sliceH, canvas.height - y);
    const part = document.createElement("canvas");
    part.width = canvas.width; part.height = h;
    const ctx = part.getContext("2d");
    ctx.fillStyle = "#8a5d86"; ctx.fillRect(0, 0, part.width, h);
    ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    if (i > 0) pdf.addPage();
    pdf.setFillColor(138, 93, 134); pdf.rect(0, 0, pageW, pageH, "F");
    pdf.addImage(part.toDataURL("image/jpeg", 0.9), "JPEG", margin, margin, imgW, h / pxPerMm);
  }
  downloadBlob(pdf.output("blob"), filename);
}

/* 결과 화면 공통 — 오른쪽에 떠 있는 '저장' 버튼 → 눌러서 PDF / 이미지 고르기 */
export function downloadPanel(root, baseName = "해묘-리포트") {
  const mk = (tag, attrs = {}, kids = []) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === "text") e.textContent = v; else if (k === "class") e.className = v; else e.setAttribute(k, v); } kids.forEach((k) => e.appendChild(k)); return e; };
  const status = mk("p", { class: "dl-status", "aria-live": "polite" });
  const pop = mk("div", { class: "dl-pop", role: "dialog", "aria-label": "결과 저장", hidden: "" });
  const fab = mk("button", { class: "dl-fab", type: "button", "aria-label": "결과를 파일로 저장", "aria-expanded": "false" }, [mk("span", { class: "dl-fab-ic", text: "💾" }), mk("span", { class: "dl-fab-tx", text: "저장" })]);
  const toggle = (open) => { const o = open ?? pop.hasAttribute("hidden"); if (o) pop.removeAttribute("hidden"); else pop.setAttribute("hidden", ""); fab.setAttribute("aria-expanded", String(o)); };
  fab.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) toggle(false); });
  const run = async (btn, kind) => {
    if (btn.disabled) return;
    btn.disabled = true;
    status.textContent = kind === "pdf" ? "PDF 만드는 중…" : "이미지 만드는 중…";
    const stamp = new Date(); const ds = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, "0")}${String(stamp.getDate()).padStart(2, "0")}`;
    try {
      if (kind === "pdf") await exportNodeAsPdf(root, `${baseName}-${ds}.pdf`);
      else await exportNodeAsImage(root, `${baseName}-${ds}.png`);
      status.textContent = kind === "pdf" ? "PDF를 저장했어요 ✓" : "이미지를 저장했어요 ✓";
    } catch (e) {
      status.textContent = "저장 도구를 못 불러왔어요. 인터넷 연결 확인 후 다시!";
    } finally { btn.disabled = false; }
  };
  const pdfBtn = mk("button", { class: "dl-opt", type: "button" }, [mk("span", { text: "📄" }), mk("span", { text: "PDF로 받기" })]);
  const imgBtn = mk("button", { class: "dl-opt", type: "button" }, [mk("span", { text: "🖼️" }), mk("span", { text: "이미지로 받기" })]);
  pdfBtn.addEventListener("click", () => run(pdfBtn, "pdf"));
  imgBtn.addEventListener("click", () => run(imgBtn, "img"));
  pop.append(mk("p", { class: "dl-title", text: "결과 파일로 저장" }), mk("p", { class: "dl-sub", text: "접힌 부분까지 펼쳐서 한 파일로" }), pdfBtn, imgBtn, status);
  const wrap = mk("div", { class: "dl-float", "data-nocapture": "" }, [pop, fab]);
  return wrap;
}
