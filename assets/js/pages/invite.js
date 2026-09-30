import { el, clear, toast, copyText, validateBirthInput, icon } from "../utils/dom.js";
import { sijinPicker, sijinLabel } from "./manseView.js";
import { savePerson, makeId, getMyBirth, getOwnBirth, getPeople, saveMyBirth, stash } from "../state.js";
import { grantFriendBundle } from "../wallet.js";
import { pageHeader, backLink, noticeBox, loadDisclaimer, openModal } from "./_shared.js";
/* 생일 정보를 링크에 담기 위한 base64url 인코딩 */
function enc(obj) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  catch { return ""; }
}
function dec(str) {
  try {
    const b = str.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  } catch { return null; }
}
function baseUrl() { return location.href.split("#")[0]; }

/* 입력값에서 링크용 필드만 남기기 */
function pack(inp) {
  const { name, birthDate, birthTime, timeUnknown, calendarType, leapMonth, gender, timezone } = inp || {};
  return { name, birthDate, birthTime, timeUnknown, calendarType, leapMonth, gender, timezone };
}
/** 내 정보를 담은 초대 링크 (받은 친구가 자기 정보 입력하면 서로 친구 추가) */
export function inviteLinkFor(myInput) {
  return myInput && myInput.birthDate ? `${baseUrl()}#/invite/${enc(pack(myInput))}` : `${baseUrl()}#/invite`;
}
/* 같은 사람(이름+생일) 이미 있으면 새로 안 넣음 */
function addPersonOnce(input) {
  const name = input.name || "이름 미상";
  const dup = getPeople().find((p) => p.input && p.input.birthDate === input.birthDate && (p.name || "") === name);
  if (dup) return { person: dup, added: false };
  const person = savePerson({ id: makeId("p"), name, input: { ...pack(input), name, focus: ["personality"] }, createdAt: Date.now() });
  return { person, added: true };
}
function personLine(input) {
  return `${input.birthDate}${input.timeUnknown ? " · 시간 모름" : (input.birthTime ? " · " + sijinLabel(input) : "")}${input.calendarType === "lunar" ? " · 음력" : ""} · ${input.gender === "female" ? "여성" : input.gender === "male" ? "남성" : ""}`;
}

/* ---------------- 친구가 자기 정보를 입력하는 초대 페이지 ----------------
   #/invite/<초대한 사람 정보>  → 입력 완료 시: 초대한 사람을 내 친구에 자동 추가 + 내 정보 링크를 돌려보냄(서로 추가) */
export function renderInvite({ navigate, data }) {
  loadDisclaimer();
  const from = data ? dec(data) : null;
  const inviter = from && from.birthDate ? from : null;
  const fromName = inviter ? (inviter.name || "친구") : "";
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(inviter
    ? pageHeader("해묘 톡 · 친구 초대", `${fromName}님이 해묘 친구 초대를 보냈어요 💌`,
        `${fromName}님이 자기 생일 정보를 같이 보냈어요. 너도 생일만 입력하면 서로의 친구 목록에 추가되고, 둘 다 궁합·귀인을 무료로 볼 수 있어!`)
    : pageHeader("친구 초대", "해묘가 궁합을 봐줄게",
        "생년월일만 알려주면, 초대한 친구가 너와의 궁합·귀인 여부를 볼 수 있어. (정보는 이 브라우저에서만 처리돼요.)"));

  if (inviter) {
    root.append(el("section", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [
      el("div", { class: "panel panel-gold", style: "display:flex; gap:12px; align-items:center;" }, [
        el("span", { style: "font-size:1.8rem;", "aria-hidden": "true", text: "🐈" }),
        el("div", { style: "flex:1;" }, [
          el("p", { style: "font-weight:700;", text: `${fromName}님의 정보` }),
          el("p", { class: "muted tiny", text: personLine(inviter) }),
        ]),
      ]),
    ]));
  }

  const host = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  root.append(host);

  const mine = getOwnBirth();
  const form = buildBirthForm((input, saveAsMine) => {
    if (saveAsMine) saveMyBirth(input);
    const reply = { ...pack(input), _m: inviter ? 1 : 0 }; // _m: 이미 서로 교환한 링크
    const link = `${baseUrl()}#/addfriend/${enc(reply)}`;
    let addedTxt = "";
    if (inviter) {
      const { added } = addPersonOnce(inviter);
      grantFriendBundle(input, inviter);
      addedTxt = added ? `${fromName}님을 내 친구에 추가했어요!` : `${fromName}님은 이미 내 친구예요.`;
    }
    const resultNodes = [el("div", { class: "section-gap" }, [
      el("p", { style: "font-weight:700;", text: (input.name ? input.name + "님, " : "") + "정보 입력 완료!" }),
      addedTxt ? el("p", { style: "font-weight:700; color:var(--c-gold-soft);", text: "💗 " + addedTxt }) : null,
      el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: inviter
        ? `이제 아래 버튼으로 ${fromName}님에게 내 정보를 보내면, ${fromName}님 목록에도 내가 추가돼요. (서로 친구 완성!)`
        : "아래 버튼으로 나를 초대한 친구에게 이 링크를 보내면, 친구 목록에 자동으로 추가돼요." }),
      el("button", { class: "btn btn-primary btn-block", onclick: () => shareLink(link, input.name, inviter ? `${fromName}! 나도 해묘에 생일 입력했어. 이 링크 누르면 나도 네 친구로 추가돼 🐈\n` : null) }, [icon("share"), el("span", { text: inviter ? `${fromName}님에게 내 정보 보내기` : "친구에게 내 정보 보내기" })]),
      el("button", { class: "btn btn-ghost btn-block", onclick: async () => { const ok = await copyText(link); toast(ok ? "링크를 복사했어요. 카톡에 붙여넣어 보내세요." : "복사 실패"); } }, [icon("copy"), el("span", { text: "링크 복사" })]),
      inviter ? el("button", { class: "btn btn-quiet btn-block", onclick: () => { stash("compat:input", { a: pack(input), b: pack(inviter) }); navigate("/compat"); } }, [el("span", { text: `${fromName}님과 궁합 바로 보기 →` })]) : null,
      inviter ? el("button", { class: "btn btn-quiet btn-block", onclick: () => navigate("/people") }, [el("span", { text: "내 사람들 보기 →" })]) : null,
    ].filter(Boolean)), noticeBox("info", "이 링크에는 생년월일 정보가 담겨 있어요. 서로 친구 할 사람에게만 보내세요.")];
    openModal(resultNodes, { title: inviter ? "서로 친구 되기 💌" : "정보 입력 완료 🐈" });
    // 창을 닫아도 다시 열 수 있게
    if (!host.querySelector(".reopen")) host.prepend(el("button", { class: "btn btn-ghost btn-block reopen", style: "margin-bottom: var(--sp-3);", onclick: () => openModal(resultNodes, { title: inviter ? "서로 친구 되기 💌" : "정보 입력 완료 🐈" }) }, [el("span", { text: "보내기 창 다시 열기" })]));
  }, mine);
  host.append(form);
  return root;
}

/* ---------------- 받은 링크로 친구를 추가하는 페이지 ---------------- */
export function renderAddFriend({ navigate, data }) {
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/people", "내 사람들")]));
  const raw = dec(data || "");
  if (!raw || !raw.birthDate) {
    root.append(pageHeader("친구 추가", "링크가 올바르지 않아요", "친구에게 다시 받아 주세요."));
    root.append(el("section", { class: "wrap" }, [el("button", { class: "btn btn-primary", onclick: () => navigate("/people") }, [el("span", { text: "내 사람들로" })])]));
    return root;
  }
  const mutual = !!raw._m;
  const input = pack(raw);
  const name = input.name || "이름 미상";
  const mine = getOwnBirth();
  root.append(pageHeader("친구 추가", `${name}님을 추가할까요?`, mutual
    ? `${name}님은 이미 너를 친구로 추가했어요. 너도 추가하면 서로 친구 완성!`
    : "카톡으로 받은 친구 정보예요. 추가하면 사주·궁합·귀인 체크에 바로 쓸 수 있어요."));
  const box = el("div", { class: "panel section-gap" });
  root.append(el("section", { class: "wrap" }, [box]));

  const done = (added) => {
    clear(box);
    box.append(el("p", { style: "font-weight:700;", text: `✓ ${name}님 추가 완료` }),
      el("button", { class: "btn btn-quiet btn-block", onclick: () => navigate("/people") }, [el("span", { text: "내 사람들 보기 →" })]));
    openModal([

      el("p", { style: "font-weight:700;", text: added ? `💗 ${name}님을 친구로 추가했어요 · 궁합·귀인 무료!` : `${name}님은 이미 내 친구예요.` }),
      mutual ? el("p", { class: "muted tiny", text: "서로 친구 완성! 이제 둘 다 궁합·귀인을 볼 수 있어요." }) : null,
      // 상대가 내 정보를 아직 모르면 → 나도 공유
      !mutual && mine ? el("div", { class: "section-gap" }, [
        el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: `${name}님도 나를 친구로 추가할 수 있게 내 정보도 보낼까요?` }),
        el("button", { class: "btn btn-primary btn-block", onclick: () => shareLink(`${baseUrl()}#/addfriend/${enc({ ...pack(mine), _m: 1 })}`, mine.name, `${name}! 나도 추가해줘~ 해묘에서 서로 친구 하자 🐈\n`) }, [icon("share"), el("span", { text: `${name}님에게 내 정보도 보내기` })]),
      ]) : null,
      el("button", { class: "btn btn-quiet btn-block", onclick: () => { if (mine) stash("compat:input", { a: pack(mine), b: input }); navigate("/compat"); } }, [el("span", { text: `${name}님과 궁합 보기 →` })]),
      el("button", { class: "btn btn-quiet btn-block", onclick: () => navigate("/people") }, [el("span", { text: "내 사람들 보기 →" })]),
    ].filter(Boolean), { title: "친구 추가 완료 💗" });
  };

  box.append(
    el("p", { style: "font-weight:700;", text: name }),
    el("p", { class: "muted tiny", text: personLine(input) }),
    el("button", { class: "btn btn-primary btn-block", onclick: () => {
      grantFriendBundle(getMyBirth(), input); // 카톡 초대 추가는 무료 + 궁합·귀인 무료 열람
      const { added } = addPersonOnce(input);
      toast(added ? `${name}님을 친구로 추가했어요 · 궁합·귀인 무료!` : `${name}님은 이미 친구예요.`);
      done(added);
    } }, [icon("plus"), el("span", { text: "친구로 추가 · 무료" })]),
    el("button", { class: "btn btn-quiet btn-block", onclick: () => navigate("/people") }, [el("span", { text: "취소" })]),
  );
  return root;
}

/* 초대 링크를 카톡/문자 등으로 공유 (Web Share → 카톡 포함, 미지원 시 복사) */
export async function shareLink(link, name, customText) {
  const text = customText || `해묘에서 궁합 보려고 해! 아래 링크 눌러서 생일만 입력해줘 🐈\n`;
  if (navigator.share) {
    try { await navigator.share({ title: "해묘 친구 초대", text, url: link }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  const ok = await copyText(link);
  toast(ok ? "링크를 복사했어요. 카톡에 붙여넣어 보내세요." : "공유에 실패했어요.");
}

/* ---- 간단 생일 입력 폼 ---- */
function buildBirthForm(onSubmit, pre) {
  const d = pre || {};
  const form = el("form", { class: "panel section-gap", novalidate: true });
  const nameI = el("input", { class: "input", type: "text", maxlength: "20", placeholder: "이름 / 닉네임", value: d.name || "" });
  const dateI = el("input", { class: "input", type: "date", max: todayStr(), required: true, value: d.birthDate || "" });
  const timeI = el("input", { class: "input", type: "time", value: d.birthTime || "" });
  const unknownC = el("input", { type: "checkbox", checked: !!d.timeUnknown });
  const syncT = () => { timeI.disabled = unknownC.checked; timeI.style.opacity = unknownC.checked ? "0.5" : "1"; };
  unknownC.addEventListener("change", syncT); syncT();
  const calSeg = seg("i-cal", [{ v: "solar", label: "양력" }, { v: "lunar", label: "음력" }], d.calendarType || "solar");
  const genSeg = seg("i-gen", [{ v: "female", label: "여성" }, { v: "male", label: "남성" }], d.gender || "");
  const saveC = el("input", { type: "checkbox", checked: !pre });
  const err = el("p", { class: "field-error", "aria-live": "polite" });
  const sijin = sijinPicker(timeI, () => ({ birthDate: dateI.value, birthTime: timeI.value, timeUnknown: unknownC.checked,
    calendarType: calSeg.querySelector("input:checked")?.value || "solar" }));
  [unknownC, dateI, calSeg].forEach((x) => x.addEventListener("change", () => sijin.refresh()));

  form.append(...[
    pre ? el("p", { class: "muted tiny", text: "저장된 내 정보로 채웠어요. 맞으면 바로 ‘입력 완료’!" }) : null,
    fld("이름", nameI),
    fld("생년월일", dateI, true),
    fld("달력", calSeg),
    fld("출생 시간", el("div", { class: "section-gap" }, [timeI, el("label", { class: "chip", style: "width:fit-content;" }, [unknownC, el("span", { class: "check" }, [icon("check")]), el("span", { text: "시간 모름" })]), sijin])),
    fld("성별", genSeg, true),
    pre ? null : el("label", { class: "chip", style: "width:fit-content;" }, [saveC, el("span", { class: "check" }, [icon("check")]), el("span", { text: "이 정보를 내 정보로도 저장" })]),
    err,
    el("button", { type: "submit", class: "btn btn-primary btn-block", style: "margin-top: var(--sp-3);" }, [el("span", { text: "입력 완료" })]),
  ].filter(Boolean));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = {
      name: nameI.value.trim(), birthDate: dateI.value, birthTime: timeI.value, timeUnknown: unknownC.checked,
      calendarType: calSeg.querySelector("input:checked")?.value || "solar", leapMonth: false,
      gender: genSeg.querySelector("input:checked")?.value || "", timezone: "Asia/Seoul", focus: ["personality"],
    };
    const { ok, errors } = validateBirthInput(input);
    if (!ok) { err.textContent = errors.birthDate || errors.birthTime || errors.gender || "입력을 확인해 주세요."; return; }
    onSubmit(input, !pre && saveC.checked);
  });
  return form;
}
function fld(label, control, req) {
  return el("div", { class: "field" }, [el("label", { html: label + (req ? ' <span class="gold">*</span>' : "") }), control]);
}
function seg(name, options, cur) {
  return el("div", { class: "seg", role: "radiogroup" }, options.map((o) => el("label", { class: "seg-opt" }, [el("input", { type: "radio", name, value: o.v, checked: cur === o.v }), el("span", { text: o.label })])));
}
function todayStr() { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
