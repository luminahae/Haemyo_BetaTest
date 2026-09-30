import { el, icon } from "../utils/dom.js";
/* 페이지 간 공용 UI 조각 */

let _disclaimer = null;
export async function loadDisclaimer() {
  if (_disclaimer) return _disclaimer;
  _disclaimer = await fetch(new URL("../../haemyo-data.json", import.meta.url)).then((r) => r.json()).then((d) => d.disclaimer);
  return _disclaimer;
}
export function getDisclaimerSync() { return _disclaimer; }

export function pageHeader(eyebrow, title, sub) {
  return el("header", { class: "wrap section-gap", style: "margin-bottom: var(--sp-5);" }, [
    eyebrow ? el("span", { class: "eyebrow", text: eyebrow }) : null,
    el("h1", { text: title }),
    sub ? el("p", { class: "muted", text: sub }) : null,
  ].filter(Boolean));
}

export function backLink(navigate, to, label = "이전으로") {
  return el("button", {
    class: "btn btn-quiet btn-sm", onclick: () => navigate(to),
    style: "padding-left:8px;",
  }, [icon("back"), el("span", { text: label })]);
}

export function noticeBox(kind, text, iconName) {
  const cls = kind === "warn" ? "notice notice-warn" : kind === "privacy" ? "notice notice-privacy" : "notice";
  return el("div", { class: cls, role: "note" }, [
    icon(iconName || (kind === "warn" ? "alert" : kind === "privacy" ? "shield" : "info")),
    el("p", { text }),
  ]);
}

export function shortDisclaimer(text) {
  return el("p", { class: "tiny muted", style: "margin-top: var(--sp-4);", text });
}

export const TYPE_META = {
  saju: { icon: "saju", label: "사주 리포트" },
  tarot: { icon: "cards", label: "타로 리딩" },
  compat: { icon: "users", label: "성향 궁합" },
  ziwei: { icon: "sparkle", label: "자미두수 명반" },
};

/** 저장된 결과 미리보기 카드 */
export function recentCard(r, navigate) {
  const meta = TYPE_META[r.type] || TYPE_META.saju;
  const date = formatDate(r.createdAt);
  return el("button", {
    class: "panel", style: "text-align:left; width:100%; cursor:pointer; display:flex; gap:14px; align-items:center;",
    onclick: () => navigate("/result/" + r.id),
    "aria-label": `${r.title} 결과 열기`,
  }, [
    el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon(meta.icon)]),
    el("div", { style: "flex:1; min-width:0;" }, [
      el("p", { style: "font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;", text: r.title }),
      el("p", { class: "muted tiny", text: `${meta.label} · ${date}` }),
    ]),
    icon("arrowRight"),
  ]);
}

export function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

/** 하단 고정 액션바 */
export function actionBar(children) {
  return el("div", { class: "action-bar" }, children);
}

/** 인사이트 강조 박스 */
export function insight(text) {
  return el("div", { class: "insight", text });
}

/** 블록(요약/해석/사례/주의/행동) 렌더 */
export function renderBlock(b) {
  const body = Array.isArray(b.body)
    ? b.body.map((t) => el("p", { text: t }))
    : b.body.ul
      ? [el("ul", {}, b.body.ul.map((t) => el("li", { text: t })))]
      : [el("p", { text: String(b.body) })];

  const label = el("span", { class: "block-label" }, [
    el("span", { class: "ic" }, [icon(b.icon || "info")]),
    el("span", { text: b.label }),
  ]);
  return el("div", { class: `block tag-${b.tag}` }, [label, ...body]);
}

/** 가운데 팝업 창 — children 넣고 {close} 반환. 바깥 누르기·✕·페이지 이동 시 닫힘 */
export function openModal(children, { title = "", onClose } = {}) {
  const close = () => { if (!ov.isConnected) return; ov.remove(); window.removeEventListener("hashchange", close); document.removeEventListener("keydown", onKey); if (onClose) onClose(); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  const card = el("div", { class: "popup-card modal-card", role: "dialog", "aria-modal": "true", "aria-label": title || "팝업" }, [
    el("div", { class: "modal-head" }, [
      el("p", { class: "serif modal-title", text: title }),
      el("button", { class: "modal-x", type: "button", "aria-label": "닫기", onclick: () => close() }, [el("span", { text: "✕" })]),
    ]),
    el("div", { class: "modal-body" }, (Array.isArray(children) ? children : [children]).filter(Boolean)),
  ]);
  const ov = el("div", { class: "popup-ov", onclick: (e) => { if (e.target === ov) close(); } }, [card]);
  document.body.appendChild(ov);
  window.addEventListener("hashchange", close);
  document.addEventListener("keydown", onKey);
  return { close, card, body: card.querySelector(".modal-body") };
}
