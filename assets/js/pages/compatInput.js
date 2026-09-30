import { el, validateBirthInput, icon } from "../utils/dom.js";
import { sijinPicker } from "./manseView.js";
import { stash, unstash, getResults } from "../state.js";
import { pageHeader, backLink, noticeBox } from "./_shared.js";
const TIMEZONES = [
  { id: "Asia/Seoul", label: "대한민국 (UTC+9)" },
  { id: "Asia/Tokyo", label: "일본 (UTC+9)" },
  { id: "Asia/Shanghai", label: "중국 (UTC+8)" },
  { id: "America/Los_Angeles", label: "미국 서부" },
  { id: "America/New_York", label: "미국 동부" },
  { id: "Europe/London", label: "영국" },
  { id: "other", label: "기타 / 모름" },
];

export function renderCompatInput({ navigate }) {
  const prev = unstash("compat:input") || {};
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("궁합", "두 사람의 성향 궁합",
    "두 사람의 사주로 성향이 어떻게 맞물리고 어디서 부딪히는지 봅니다. 운명적 길흉 판정이 아니라 관계를 돌아보는 참고 자료입니다."));

  const form = el("form", { class: "wrap section-gap", novalidate: true });
  const pa = personBlock("a", "나", prev.a);
  const pb = personBlock("b", "상대", prev.b);
  form.append(pa.node, pb.node);

  // 재회 심화 (선택) — 사귄/헤어진 날짜로 재회 가능 시기까지
  const reunion = reunionBlock(prev.reunion);
  form.append(reunion.node);

  form.append(noticeBox("privacy",
    "두 사람의 생년월일은 민감정보입니다. 서버로 전송되지 않고 브라우저 안에서만 계산에 쓰입니다. 상대의 정보를 입력할 때는 동의를 받아 주세요."));

  const errBox = el("p", { class: "field-error", style: "text-align:center;", "aria-live": "polite" });
  form.append(errBox);
  form.append(el("button", { type: "submit", class: "btn btn-primary btn-block" },
    [el("span", { text: "궁합 보기" }), icon("arrowRight")]));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const a = pa.collect(), b = pb.collect();
    const va = validateBirthInput(a), vb = validateBirthInput(b);
    pa.showErrors(va.errors); pb.showErrors(vb.errors);
    if (!va.ok || !vb.ok) {
      errBox.textContent = "두 사람의 정보를 모두 올바르게 입력해 주세요.";
      const first = form.querySelector('.field-error:not(:empty)');
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const rc = reunion.collect();
    if (rc.want && !rc.valid) {
      errBox.textContent = "재회 심화를 켜면 헤어진 날짜를 입력해 주세요. (사귄 날짜는 선택)";
      reunion.node.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    errBox.textContent = "";
    stash("compat:input", { a, b, reunion: rc.want ? rc : null });
    navigate("/compat/result");
  });

  root.append(form);
  return root;
}

export function personBlock(prefix, title, draft = {}) {
  const id = (s) => `${prefix}-${s}`;
  const nameI = el("input", { class: "input", id: id("name"), type: "text", maxlength: "20", placeholder: title, value: draft.name || "" });
  const dateI = el("input", { class: "input", id: id("date"), type: "date", max: todayStr(), value: draft.birthDate || "", required: true });
  const timeI = el("input", { class: "input", id: id("time"), type: "time", value: draft.birthTime || "" });
  const unknownI = el("input", { type: "checkbox", id: id("unk"), checked: !!draft.timeUnknown });
  unknownI.addEventListener("change", () => { timeI.disabled = unknownI.checked; timeI.style.opacity = unknownI.checked ? "0.5" : "1"; });
  timeI.disabled = unknownI.checked; timeI.style.opacity = unknownI.checked ? "0.5" : "1";

  const calSeg = seg(id("cal"), [{ v: "solar", label: "양력" }, { v: "lunar", label: "음력" }], draft.calendarType || "solar");
  const leapI = el("input", { type: "checkbox", id: id("leap"), checked: !!draft.leapMonth });
  const leapWrap = el("label", { class: "chip", style: "margin-top:8px;" + ((draft.calendarType || "solar") === "lunar" ? "" : "display:none;") },
    [leapI, el("span", { class: "check" }, [icon("check")]), el("span", { text: "윤달" })]);
  calSeg.addEventListener("change", () => { leapWrap.style.display = calSeg.querySelector('input[value="lunar"]').checked ? "" : "none"; });

  const genderSeg = seg(id("gender"), [{ v: "female", label: "여성" }, { v: "male", label: "남성" }], draft.gender || "");
  const tzSel = el("select", { class: "select", id: id("tz") }, TIMEZONES.map((t) => el("option", { value: t.id, text: t.label, selected: (draft.timezone || "Asia/Seoul") === t.id })));

  const err = (k) => el("p", { class: "field-error", id: id("err-" + k), "aria-live": "polite" });
  const sijin = sijinPicker(timeI, () => ({ birthDate: dateI.value, birthTime: timeI.value, timeUnknown: unknownI.checked,
    calendarType: calSeg.querySelector("input:checked")?.value || "solar", leapMonth: leapI.checked, timezone: tzSel.value }));
  [unknownI, dateI, calSeg, leapI, tzSel].forEach((x) => x.addEventListener("change", () => sijin.refresh()));

  // 저장한 사주/명반 불러오기
  const fillFrom = (inp) => {
    nameI.value = inp.name || "";
    dateI.value = inp.birthDate || "";
    timeI.value = inp.birthTime || "";
    unknownI.checked = !!inp.timeUnknown; timeI.disabled = unknownI.checked; timeI.style.opacity = unknownI.checked ? "0.5" : "1";
    const calR = calSeg.querySelector(`input[value="${inp.calendarType || "solar"}"]`); if (calR) calR.checked = true;
    leapI.checked = !!inp.leapMonth;
    leapWrap.style.display = inp.calendarType === "lunar" ? "" : "none";
    const gR = genderSeg.querySelector(`input[value="${inp.gender}"]`); if (gR) gR.checked = true;
    if (inp.timezone) tzSel.value = inp.timezone;
    sijin.refresh();
  };
  const saved = getResults().filter((r) => r.input && r.input.birthDate && r.input.gender);
  let loaderField = null;
  if (saved.length) {
    const loader = el("select", { class: "select", "aria-label": title + " 저장된 사주 불러오기" }, [
      el("option", { value: "", text: "저장함에서 불러오기…" }),
      ...saved.map((r) => el("option", { value: r.id, text: `${r.input.name || r.title} · ${r.input.birthDate}` })),
    ]);
    loader.addEventListener("change", () => { const r = saved.find((x) => x.id === loader.value); if (r) fillFrom(r.input); });
    loaderField = el("div", { class: "field" }, [el("label", { text: "저장된 사주 불러오기" }), loader]);
  }

  const node = el("div", { class: "panel section-gap" }, [
    el("div", { style: "display:flex; align-items:center; gap:8px;" }, [
      el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon("users")]),
      el("h3", { text: title }),
    ]),
    loaderField,
    fieldRow(id("name"), "이름/닉네임 (선택)", nameI),
    fieldRow(id("date"), "생년월일", dateI, err("birthDate")),
    fieldLabel("달력 기준", el("div", {}, [calSeg, leapWrap])),
    fieldRow(id("time"), "출생 시간", el("div", { class: "section-gap" }, [timeI,
      el("label", { class: "chip", style: "width:fit-content;" }, [unknownI, el("span", { class: "check" }, [icon("check")]), el("span", { text: "시간 모름" })]), sijin]), err("birthTime")),
    fieldLabel("성별", genderSeg, err("gender")),
    fieldRow(id("tz"), "출생 지역/시간대", tzSel),
  ]);

  const radioVal = (name) => { const c = node.querySelector(`input[name="${name}"]:checked`); return c ? c.value : ""; };
  const collect = () => ({
    name: nameI.value.trim(),
    birthDate: dateI.value,
    birthTime: timeI.value,
    timeUnknown: unknownI.checked,
    calendarType: radioVal(id("cal")) || "solar",
    leapMonth: leapI.checked,
    gender: radioVal(id("gender")),
    timezone: tzSel.value || "Asia/Seoul",
    focus: ["personality"],
  });
  const showErrors = (errors) => {
    for (const k of ["birthDate", "birthTime", "gender"]) {
      const n = node.querySelector("#" + id("err-" + k));
      if (n) n.textContent = errors[k] || "";
    }
    dateI.setAttribute("aria-invalid", errors.birthDate ? "true" : "false");
  };
  return { node, collect, showErrors };
}

/* ---- 재회 심화 옵션 (선택 · +5코인) ---- */
function reunionBlock(draft = {}) {
  const wantI = el("input", { type: "checkbox", id: "re-want", checked: !!(draft && draft.want) });
  const startI = el("input", { class: "input", id: "re-start", type: "date", max: todayStr(), value: (draft && draft.startDate) || "" });
  const breakI = el("input", { class: "input", id: "re-break", type: "date", max: todayStr(), value: (draft && draft.breakupDate) || "" });
  const err = el("p", { class: "field-error", "aria-live": "polite" });

  const fields = el("div", { class: "section-gap", style: "margin-top:12px;" + ((draft && draft.want) ? "" : "display:none;") }, [
    fieldRow("re-start", "사귀기 시작한 날 (선택)", startI),
    fieldRow("re-break", "헤어진 날", breakI, err),
    el("p", { class: "muted tiny", text: "이 날짜의 ‘운(運)’을 내 사주와 대조해, 왜 만나고 왜 헤어졌는지와 앞으로 18개월 중 재회의 문이 열리는 시기를 짚어 드려요." }),
  ]);
  wantI.addEventListener("change", () => { fields.style.display = wantI.checked ? "" : "none"; });

  const node = el("div", { class: "panel section-gap", style: "border:1px solid var(--c-gold-line, rgba(211,170,120,.28));" }, [
    el("label", { class: "chip", style: "width:fit-content;" }, [
      wantI, el("span", { class: "check" }, [icon("check")]),
      el("span", { text: "재회 심화 분석 켜기" }),
      el("span", { class: "price-coin", style: "margin-left:6px;" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: "+5" })]),
    ]),
    el("p", { class: "muted tiny", style: "margin-top:2px;", text: "궁합(5코인)과 별개로, 켜면 재회 시기 분석이 결과에서 5코인에 열려요." }),
    fields,
  ]);

  const collect = () => {
    const want = wantI.checked;
    const startDate = startI.value || "";
    const breakupDate = breakI.value || "";
    return { want, startDate, breakupDate, valid: !!breakupDate };
  };
  return { node, collect };
}

/* ---- small helpers ---- */
function fieldRow(forId, label, control, errNode) {
  return el("div", { class: "field" }, [el("label", { for: forId, text: label }), control, errNode].filter(Boolean));
}
function fieldLabel(label, control, errNode) {
  return el("fieldset", { class: "field" }, [el("legend", { class: "fieldset-label", text: label }), control, errNode].filter(Boolean));
}
function seg(name, options, current) {
  return el("div", { class: "seg", role: "radiogroup" },
    options.map((o) => el("label", { class: "seg-opt" }, [
      el("input", { type: "radio", name, value: o.v, checked: current === o.v }),
      el("span", { text: o.label }),
    ])));
}
function todayStr() { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
