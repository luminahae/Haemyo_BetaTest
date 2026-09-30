import { el, $$, validateBirthInput, icon } from "../utils/dom.js";
import { saveDraft, getDraft, stash, saveMyBirth, getMyBirth } from "../state.js";
import { personSwitch } from "./people.js";
import { sijinPicker } from "./manseView.js";
import { pageHeader, backLink, noticeBox, loadDisclaimer } from "./_shared.js";
const FOCUS = [
  { id: "personality", label: "기본 성격" },
  { id: "relationship", label: "인간관계" },
  { id: "love", label: "연애" },
  { id: "marriage", label: "결혼" },
  { id: "money", label: "재물" },
  { id: "career", label: "직업" },
  { id: "timeline", label: "가까운 시기의 흐름" },
  { id: "habits", label: "개선해야 할 습관" },
];

const TIMEZONES = [
  { id: "Asia/Seoul", label: "대한민국 (Asia/Seoul, UTC+9)" },
  { id: "Asia/Tokyo", label: "일본 (Asia/Tokyo, UTC+9)" },
  { id: "Asia/Shanghai", label: "중국 (Asia/Shanghai, UTC+8)" },
  { id: "America/Los_Angeles", label: "미국 서부 (UTC-8/-7)" },
  { id: "America/New_York", label: "미국 동부 (UTC-5/-4)" },
  { id: "Europe/London", label: "영국 (UTC+0/+1)" },
  { id: "other", label: "기타 / 잘 모름" },
];

export function renderSajuInput({ navigate, mode = "saju" }) {
  loadDisclaimer();
  // 저장된 '내 정보'가 있으면 폼을 자동으로 채운다 (다시 안 묻기)
  const draft = getMyBirth() || getDraft() || {};
  const isZiwei = mode === "ziwei";

  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(isZiwei
    ? pageHeader("자미두수", "출생 정보 입력", "자미두수 명반은 출생 ‘시(時)’가 특히 중요합니다. 모든 계산은 이 브라우저 안에서만 이뤄집니다.")
    : pageHeader("STEP 1", "사주 정보 입력", "정확한 생년월일을 입력할수록 성향 분석이 또렷해집니다. 모든 계산은 이 브라우저 안에서만 이뤄집니다."));
  root.append(personSwitch(navigate, { title: "누구의 사주를 볼까? (고르면 아래 정보가 바로 채워져요)" }));

  const form = el("form", { class: "wrap section-gap", novalidate: true });

  // 이름/닉네임
  form.append(field({
    id: "name", label: "이름 또는 닉네임 (선택)",
    hint: "결과와 공유 이미지에 표시됩니다. 실명이 아니어도 됩니다.",
    control: el("input", { class: "input", id: "name", type: "text", value: draft.name || "",
      maxlength: "20", autocomplete: "off", placeholder: "예: 초승달" }),
  }));

  // 생년월일
  form.append(field({
    id: "birthDate", label: "생년월일", required: true,
    control: el("input", { class: "input", id: "birthDate", type: "date", value: draft.birthDate || "",
      max: todayStr(), required: true }),
    errorId: "err-birthDate",
  }));

  // 양력/음력 + 윤달
  const calSeg = seg("calendarType", [
    { v: "solar", label: "양력" },
    { v: "lunar", label: "음력" },
  ], draft.calendarType || "solar");
  const leapChk = el("input", { type: "checkbox", id: "leapMonth", checked: !!draft.leapMonth });
  const leapWrap = el("label", { class: "chip", id: "leap-wrap",
    style: "width:fit-content; margin-top:10px;" + (((draft.calendarType || "solar") === "lunar") ? "" : "display:none;") }, [
    leapChk, el("span", { class: "check" }, [icon("check")]), el("span", { text: "윤달(閏月)로 입력" }),
  ]);
  calSeg.addEventListener("change", () => {
    const lunar = calSeg.querySelector('input[value="lunar"]').checked;
    leapWrap.style.display = lunar ? "" : "none";
  });
  form.append(fieldset({
    legend: "달력 기준",
    control: el("div", {}, [calSeg, leapWrap]),
    hint: "음력 생일은 자동으로 양력으로 변환해 계산합니다. 윤달에 태어났다면 ‘윤달’을 함께 선택하세요.",
  }));

  // 출생 시간 + 모름
  const timeInput = el("input", { class: "input", id: "birthTime", type: "time", value: draft.birthTime || "" });
  const unknownChk = el("input", { type: "checkbox", id: "timeUnknown", checked: !!draft.timeUnknown });
  unknownChk.addEventListener("change", () => {
    timeInput.disabled = unknownChk.checked;
    timeInput.style.opacity = unknownChk.checked ? "0.5" : "1";
  });
  timeInput.disabled = unknownChk.checked;
  timeInput.style.opacity = unknownChk.checked ? "0.5" : "1";
  const sijin = sijinPicker(timeInput, () => ({
    birthDate: form.querySelector("#birthDate")?.value || "", birthTime: timeInput.value, timeUnknown: unknownChk.checked,
    calendarType: form.querySelector('input[name="calendarType"]:checked')?.value || "solar",
    leapMonth: form.querySelector("#leapMonth")?.checked || false, timezone: form.querySelector("#timezone")?.value || "Asia/Seoul",
  }));
  unknownChk.addEventListener("change", () => sijin.refresh());
  form.addEventListener("change", () => sijin.refresh());

  form.append(field({
    id: "birthTime", label: "출생 시간",
    control: el("div", { class: "section-gap" }, [
      timeInput,
      el("label", { class: "chip", style: "width:fit-content;" }, [
        unknownChk, el("span", { class: "check" }, [icon("check")]), el("span", { text: "출생 시간을 모름" }),
      ]),
      sijin,
    ]),
    hint: "시간을 모르면 시주(時柱)를 제외하고 분석합니다. 결과 상단에 안내가 표시됩니다.",
    errorId: "err-birthTime",
  }));

  // 성별 (사주 대운은 성별로 방향이 갈려 남/여 중 하나가 필요)
  form.append(fieldset({
    legend: "성별", required: true,
    control: seg("gender", [
      { v: "female", label: "여성" },
      { v: "male", label: "남성" },
    ], draft.gender || ""),
    hint: "대운(운의 흐름)은 성별에 따라 순행·역행이 달라지므로 남/여 중 하나가 필요합니다.",
    errorId: "err-gender",
  }));

  // 지역/시간대
  form.append(field({
    id: "timezone", label: "출생 지역 / 표준 시간대",
    control: el("select", { class: "select", id: "timezone" },
      TIMEZONES.map((t) => el("option", { value: t.id, text: t.label, selected: (draft.timezone || "Asia/Seoul") === t.id }))
    ),
    hint: "시간대와 대표 경도로 진태양시를 보정해 시주(時柱)를 계산합니다.",
  }));

  // 집중 분야 (복수 선택)
  const focusSelected = new Set(draft.focus || ["personality"]);
  const focusGrid = el("div", { class: "chip-grid", role: "group", "aria-label": "집중 분야 (복수 선택 가능)" },
    FOCUS.map((f) => focusChip(f, focusSelected))
  );
  form.append(fieldset({
    legend: "집중해서 보고 싶은 분야 (복수 선택)", required: true,
    control: focusGrid,
    hint: "선택한 분야를 결과 상단에 우선 배치합니다.",
    errorId: "err-focus",
  }));

  // 개인정보 안내
  form.append(noticeBox("privacy",
    "생년월일과 출생 시간은 민감정보입니다. 입력값은 서버로 전송되지 않고 브라우저 안에서만 계산에 쓰이며, ‘결과 저장’을 누르기 전에는 기기에 남지 않습니다."));

  // 계산 방식 안내
  form.append(noticeBox("info",
    "절기(태양 황경)와 삭(음력 월경계)을 천문 계산으로 구해 실제 사주팔자(년·월·일·시주)와 오행 분포를 산출합니다. 해석은 이 명식을 바탕으로 한 성향 참고 자료입니다."));

  // 제출
  form.append(el("div", { style: "margin-top: var(--sp-4);" }, [
    el("button", { type: "submit", class: "btn btn-primary btn-block" },
      [el("span", { text: isZiwei ? "명반 보기" : "분석 시작하기" }), icon("arrowRight")]),
  ]));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = collect(form, focusSelected);
    const { ok, errors } = validateBirthInput(input);
    showErrors(form, errors);
    if (!ok) {
      const first = form.querySelector('[aria-invalid="true"], .field-error:not(:empty)');
      (first || form).scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    saveDraft(input);
    saveMyBirth(input); // 내 정보 기억 — 다음부턴 자동으로 채워짐
    if (isZiwei) {
      stash("ziwei:input", input);
      navigate("/ziwei/result");
    } else {
      stash("saju:input", input);
      navigate("/saju/loading");
    }
  });

  root.append(form);
  return root;
}

/* ---- helpers ---- */
function field({ id, label, hint, control, required, errorId }) {
  return el("div", { class: "field" }, [
    el("label", { for: id, html: label + (required ? ' <span class="gold" aria-hidden="true">*</span>' : "") }),
    control,
    hint ? el("p", { class: "hint", text: hint }) : null,
    errorId ? el("p", { class: "field-error", id: errorId, "aria-live": "polite" }) : null,
  ].filter(Boolean));
}

function fieldset({ legend, hint, control, required, errorId }) {
  return el("fieldset", { class: "field" }, [
    el("legend", { class: "fieldset-label", html: legend + (required ? ' <span class="gold" aria-hidden="true">*</span>' : "") }),
    control,
    hint ? el("p", { class: "hint", text: hint }) : null,
    errorId ? el("p", { class: "field-error", id: errorId, "aria-live": "polite" }) : null,
  ].filter(Boolean));
}

function seg(name, options, current) {
  return el("div", { class: "seg", role: "radiogroup" },
    options.map((o) => el("label", { class: "seg-opt" }, [
      el("input", { type: "radio", name, value: o.v, checked: current === o.v }),
      el("span", { text: o.label }),
    ]))
  );
}

function focusChip(f, selectedSet) {
  const input = el("input", { type: "checkbox", value: f.id, checked: selectedSet.has(f.id),
    "aria-label": f.label });
  const chip = el("label", { class: "chip" + (selectedSet.has(f.id) ? " is-selected" : "") }, [
    input, el("span", { class: "check" }, [icon("check")]), el("span", { text: f.label }),
  ]);
  input.addEventListener("change", () => {
    if (input.checked) selectedSet.add(f.id); else selectedSet.delete(f.id);
    chip.classList.toggle("is-selected", input.checked);
  });
  return chip;
}

function collect(form, focusSelected) {
  const val = (id) => (form.querySelector("#" + id) || {}).value || "";
  const radio = (name) => { const c = form.querySelector(`input[name="${name}"]:checked`); return c ? c.value : ""; };
  return {
    name: val("name").trim(),
    birthDate: val("birthDate"),
    birthTime: form.querySelector("#birthTime").value,
    timeUnknown: form.querySelector("#timeUnknown").checked,
    calendarType: radio("calendarType") || "solar",
    leapMonth: form.querySelector("#leapMonth").checked,
    gender: radio("gender"),
    timezone: val("timezone") || "Asia/Seoul",
    focus: [...focusSelected],
  };
}

function showErrors(form, errors) {
  const map = { birthDate: "err-birthDate", birthTime: "err-birthTime", gender: "err-gender", focus: "err-focus" };
  for (const [k, elId] of Object.entries(map)) {
    const node = form.querySelector("#" + elId);
    if (node) node.textContent = errors[k] || "";
  }
  const bd = form.querySelector("#birthDate");
  if (bd) bd.setAttribute("aria-invalid", errors.birthDate ? "true" : "false");
}

function todayStr() {
  const d = new Date(); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
