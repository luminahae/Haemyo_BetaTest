import { el, clear, toast, copyText, validateBirthInput, icon } from "../utils/dom.js";
import { sijinPicker, sijinLabel } from "./manseView.js";
import { inviteLinkFor } from "./invite.js";
import { getPeople, savePerson, deletePerson, getOwnBirth as getMyBirth, makeId, stash, getViewAs, setViewAs, getOwnBirth } from "../state.js";
import { pageHeader, backLink, noticeBox, loadDisclaimer, openModal } from "./_shared.js";
import { spend, getCoins, costOf, grantFriendBundle, isUnlocked, unlock } from "../wallet.js";
import { computeSaju } from "../saju/manse.js";
import { benefactorCheck } from "../saju/guiin.js";
import { analyzeCompat } from "../saju/compat.js";
import { charmSpirits } from "../saju/spouse.js";
export function renderPeople({ navigate }) {
  loadDisclaimer();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("사람 · 친구", "내 사람들",
    "친구·가족·연인의 사주를 저장해 두면, 언제든 그 사람의 리포트를 보고 나와의 궁합·귀인 여부까지 바로 확인할 수 있어요."));

  const listWrap = el("section", { class: "wrap section-gap" });
  root.append(listWrap);

  function refresh() {
    clear(listWrap);
    const my = getMyBirth();

    // 내 정보 카드 (없으면 안내)
    if (my) {
      listWrap.append(personCard({
        name: (my.name || "나"), input: my, isMe: true, navigate, refresh,
      }));
    } else {
      listWrap.append(noticeBox("info",
        "‘나와 궁합·귀인 체크’를 하려면 먼저 내 출생 정보가 필요해요. 사주 정보를 한 번 입력하면 자동으로 저장됩니다."));
      listWrap.append(el("div", { style: "margin: var(--sp-3) 0;" }, [
        el("button", { class: "btn btn-primary btn-sm", onclick: () => navigate("/saju") },
          [icon("saju"), el("span", { text: "내 정보 먼저 입력" })]),
      ]));
    }

    // 친구 목록
    const people = getPeople();
    if (people.length) {
      listWrap.append(el("h2", { style: "margin-top: var(--sp-5); font-size:1.05rem;", text: `저장한 친구 ${people.length}명` }));
      people.forEach((p) => listWrap.append(personCard({
        name: p.name, input: p.input, id: p.id, navigate, refresh, hasMe: !!my,
      })));
    } else {
      listWrap.append(el("p", { class: "muted tiny", style: "margin-top: var(--sp-4);", text: "아직 저장한 친구가 없어요. 아래에서 추가해 보세요." }));
    }

    // 테마 (셔플릿식 큐레이션) — 친구 2명 이상 + 내 정보 있을 때
    if (my && people.length >= 1) listWrap.append(themesSection(my, people, navigate, refresh));

    // 친구 추가
    listWrap.append(addSection(refresh, navigate));
  }

  refresh();
  return root;
}

/* ---- 테마 큐레이션 — 저장한 친구들을 사주로 랭킹 ---- */
function themesSection(my, people, navigate, refresh) {
  const mp = computeSaju(my);
  const scored = people.map((p) => {
    const fp = computeSaju(p.input);
    const charm = charmSpirits(fp);
    return {
      name: p.name || "친구", id: p.id, input: p.input,
      guiinToMe: benefactorCheck(mp, fp).score,          // 친구가 나에게
      guiinToThem: benefactorCheck(fp, mp).score,        // 내가 친구에게
      compat: analyzeCompat(mp, fp, { a: "나", b: p.name || "친구" }).score,
      charmScore: (charm.dohwa ? 2 : 0) + (charm.hongyeom ? 2 : 0) + (charm.hwagae ? 1 : 0),
      charm,
    };
  });
  const top = (key, n = 3) => [...scored].sort((a, b) => b[key] - a[key]).slice(0, n);

  const wrap = el("div", { style: "margin-top: var(--sp-6);" });
  wrap.append(el("div", { style: "display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom: var(--sp-3);" }, [
    el("h2", { class: "serif", style: "font-size:1.15rem;", text: "테마 — 내 사람 랭킹" }),
    el("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => { refresh(); toast("순위를 새로 계산했어요."); } }, [el("span", { text: "🔄 순위 새로고침" })]),
  ]));
  wrap.append(el("p", { class: "muted tiny", style: "margin-bottom: var(--sp-2);", text: `랭킹마다 코인 ${costOf("rank")}개로 한 번 열면, 사람을 더 추가해도 계속 무료로 업데이트돼요.` }));

  // 잠금 — 랭킹별로 한 번만 결제 (내 정보 기준, 사람 수와 무관)
  const gate = (key, eyebrow, title, ic, buildRows) => {
    const itemId = `rank:${key}:${my.birthDate}`;
    if (isUnlocked(itemId)) return themeCard(eyebrow, title, ic, buildRows());
    const cost = costOf("rank");
    const card = el("div", { class: "panel theme-card", style: "margin-top: var(--sp-3);" }, [
      el("p", { class: "eyebrow", text: eyebrow }),
      el("div", { style: "display:flex; align-items:center; gap:8px; margin:2px 0 10px;" }, [
        el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon(ic)]),
        el("h3", { class: "serif", text: title }),
      ]),
      el("div", { class: "rank-blur", "aria-hidden": "true" }, [
        el("div", { class: "rank-row" }, [el("span", { class: "rank-medal gold", text: "①" }), el("span", { class: "rank-name", text: "??? " }), el("span", { class: "rank-meta muted tiny", text: "잠겨 있어요" })]),
        el("div", { class: "rank-row" }, [el("span", { class: "rank-medal", text: "②" }), el("span", { class: "rank-name", text: "??? " }), el("span", { class: "rank-meta muted tiny", text: "잠겨 있어요" })]),
      ]),
      el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-3);", type: "button", onclick: () => {
        const r = unlock(itemId, cost);
        if (r.ok) { toast(`${title}을(를) 열었어요 · 앞으로 사람을 추가해도 무료로 업데이트돼요`); refresh(); }
        else { toast("코인이 부족해요."); navigate("/store"); }
      } }, [el("span", { text: `코인 ${cost}개로 열기 · 보유 ${getCoins()}개` })]),
    ]);
    return card;
  };

  // 귀인 친구 찾기
  wrap.append(gate("guiin", "평생 꽉 잡아야 될", "귀인 친구 찾기", "compass",
    () => top("guiinToMe").map((s, i) => rankRow(i, s.name, `귀인지수 ${s.guiinToMe}`, navigate, s.id))));

  // 결혼운 (궁합 TOP)
  wrap.append(gate("marry", "결혼까지 간다면", "결혼운 TOP 3", "heart",
    () => top("compat").map((s, i) => rankRow(i, s.name, `궁합 ${s.compat}%`, navigate, s.id))));

  // 도화살 TOP 3
  wrap.append(gate("dohwa", "만나면 설레는", "도화살 TOP 3", "sparkle",
    () => top("charmScore").map((s, i) => rankRow(i, s.name,
      [s.charm.dohwa ? "도화" : null, s.charm.hongyeom ? "홍염" : null, s.charm.hwagae ? "화개" : null].filter(Boolean).join("·") || "은은한 매력",
      navigate, s.id))));

  // 우정의 작대기 (양방향)
  const cupidId = `rank:cupid:${my.birthDate}`;
  if (!isUnlocked(cupidId)) {
    wrap.append(gate("cupid", "나 → 너  vs  너 → 나", "우정의 작대기", "users", () => []));
    return wrap;
  }
  wrap.append(el("div", { class: "panel theme-card", style: "margin-top: var(--sp-3);" }, [
    el("p", { class: "eyebrow", text: "나 → 너  vs  너 → 나" }),
    el("h3", { class: "serif", style: "margin:2px 0 12px;", text: "우정의 작대기" }),
    el("div", { class: "section-gap" }, scored.map((s) =>
      el("div", { class: "cupid-row" }, [
        el("span", { class: "cupid-name", text: s.name }),
        el("span", { class: "cupid-arrows" }, [
          el("span", { class: "cupid-a", title: "내가 그 친구에게 힘이 되는 정도", text: `나→ ${s.guiinToThem}` }),
          el("span", { class: "cupid-mid", text: s.guiinToMe > s.guiinToThem + 8 ? "←❤" : s.guiinToThem > s.guiinToMe + 8 ? "❤→" : "❤" }),
          el("span", { class: "cupid-b", title: "그 친구가 나에게 힘이 되는 정도", text: `${s.guiinToMe} ←너` }),
        ]),
      ]))),
    el("p", { class: "muted tiny", style: "margin-top:8px;", text: "화살표는 ‘누가 더 힘이 되어 주는지’ 방향이에요. 재미로 봐 주세요." }),
  ]));

  return wrap;
}

function themeCard(eyebrow, title, ic, rows) {
  return el("div", { class: "panel theme-card", style: "margin-top: var(--sp-3);" }, [
    el("p", { class: "eyebrow", text: eyebrow }),
    el("div", { style: "display:flex; align-items:center; gap:8px; margin:2px 0 10px;" }, [
      el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon(ic)]),
      el("h3", { class: "serif", text: title }),
    ]),
    rows.length ? el("div", { class: "section-gap" }, rows) : el("p", { class: "muted tiny", text: "친구를 더 추가하면 랭킹이 채워져요." }),
  ]);
}

function rankRow(i, name, meta, navigate, id) {
  const medal = ["①", "②", "③"][i] || `${i + 1}`;
  return el("div", { class: "rank-row" }, [
    el("span", { class: "rank-medal" + (i === 0 ? " gold" : ""), text: medal }),
    el("span", { class: "rank-name", text: name }),
    el("span", { class: "rank-meta muted tiny", text: meta }),
  ]);
}

/* ---- 사람 카드 ---- */
function personCard({ name, input, id, isMe, hasMe, navigate, refresh }) {
  const summary = `${input.birthDate || "생일 미입력"}${input.timeUnknown ? " · 시간 모름" : (input.birthTime ? " · " + sijinLabel(input) : "")}` +
    (input.calendarType === "lunar" ? " · 음력" : "");
  const gLabel = input.gender === "female" ? "여성" : input.gender === "male" ? "남성" : "";

  const btns = [
    actBtn("saju", "사주", "primary", () => { stash("saju:input", input); navigate("/saju/loading"); }),
    actBtn("sparkle", "자미두수", "ghost", () => { stash("ziwei:input", input); navigate("/ziwei/result"); }),
  ];
  if (!isMe && id) {
    const viewing = (getViewAs() || {}).id === id;
    btns.unshift(actBtn("eye", viewing ? "이 사람 시점 보는 중 · 해제" : "이 사람 시점으로 보기", viewing ? "quiet" : "primary", () => {
      setViewAs(viewing ? null : id);
      toast(viewing ? "내 시점으로 돌아왔어요." : `이제 ${name} 님 시점으로 모든 운세를 봐요.`);
      if (!viewing) navigate("/"); else refresh();
    }));
  }
  if (!isMe) {
    btns.push(actBtn("users", "나와 궁합", "ghost", () => {
      const my = getMyBirth();
      if (!my) { toast("먼저 내 정보를 입력해 주세요."); return; }
      stash("compat:input", { a: my, b: input }); navigate("/compat/result");
    }));
    btns.push(actBtn("compass", "나에게 귀인?", "gold", () => {
      const my = getMyBirth();
      if (!my) { toast("먼저 내 정보를 입력해 주세요."); return; }
      stash("guiin:input", { me: my, other: input }); navigate("/guiin/result");
    }));
  } else {
    btns.push(actBtn("info", "정보 수정", "quiet", () => navigate("/saju")));
  }

  const head = el("div", { style: "display:flex; align-items:center; gap:10px;" }, [
    el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon(isMe ? "saju" : "users")]),
    el("div", { style: "flex:1; min-width:0;" }, [
      el("p", { style: "font-weight:700; display:flex; align-items:center; gap:6px;" }, [
        el("span", { text: name }),
        isMe ? el("span", { style: "font-size:0.68rem; font-weight:700; color:var(--c-gold); border:1px solid var(--c-gold-line); border-radius:999px; padding:1px 8px;", text: "나" }) : null,
        gLabel ? el("span", { class: "muted tiny", text: gLabel }) : null,
      ].filter(Boolean)),
      el("p", { class: "muted tiny", text: summary }),
    ]),
    id ? delBtn(name, id, refresh) : null,
  ].filter(Boolean));

  return el("div", { class: "panel", style: "margin-top: var(--sp-3);" }, [
    head,
    el("div", { class: "btn-row", style: "margin-top:12px; flex-wrap:wrap; gap:8px;" }, btns),
  ]);
}

/* 삭제 — 네이티브 confirm 없이 2탭 확인 (일부 환경에서 confirm이 막혀 삭제가 안 되던 문제 수정) */
function delBtn(name, id, refresh) {
  let armed = false, timer = null;
  const btn = el("button", { class: "btn btn-quiet btn-sm", "aria-label": name + " 삭제" }, [icon("trash")]);
  btn.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      clear(btn); btn.append(el("span", { style: "color:var(--c-danger); font-weight:700;", text: "삭제?" }));
      timer = setTimeout(() => { armed = false; clear(btn); btn.append(icon("trash")); }, 3000);
      return;
    }
    if (timer) clearTimeout(timer);
    deletePerson(id);
    toast(`'${name}' 님을 삭제했어요.`);
    refresh();
  });
  return btn;
}

function actBtn(ic, label, kind, onClick) {
  const cls = kind === "primary" ? "btn btn-primary btn-sm"
    : kind === "quiet" ? "btn btn-quiet btn-sm" : "btn btn-ghost btn-sm";
  const attrs = { class: cls, onclick: onClick };
  if (kind === "gold") attrs.style = "color:var(--c-gold); border-color:var(--c-gold-line);";
  return el("button", attrs, [icon(ic), el("span", { text: label })]);
}

/* ---- 친구 추가 폼 (접었다 펴기) ---- */
function addSection(refresh, navigate) {
  const wrap = el("div", { style: "margin-top: var(--sp-6); display:flex; flex-direction:column; gap: var(--sp-3);" });
  const addCost = costOf("friendadd");
  const toggle = el("button", { class: "btn btn-ghost btn-block" }, [icon("plus"), el("span", { text: `직접 친구 추가 · 코인 ${addCost}` })]);
  const kakao = el("button", { class: "btn btn-primary btn-block", onclick: () => inviteFriend() }, [icon("share"), el("span", { text: "카톡으로 초대해서 추가 · 무료" })]);
  const hint = el("p", { class: "muted tiny", style: "text-align:center; margin-top:8px;", text: "카톡으로 초대하면 내 정보도 같이 가서 서로 친구로 추가돼요 · 무료! 어느 방식이든 추가하면 그 친구의 사주·나와의 궁합·자미두수·귀인 여부를 무료로 볼 수 있어요." });
  toggle.addEventListener("click", () => {
    const m = openModal([], { title: "직접 친구 추가" });
    m.body.append(buildAddForm(() => { m.close(); refresh(); }, navigate));
  });
  wrap.append(kakao, toggle, hint);
  return wrap;
}

async function inviteFriend() {
  const mine = getMyBirth();
  const link = inviteLinkFor(mine);
  const text = mine
    ? "해묘에서 서로 친구 하자! 내 생일은 링크에 같이 넣었어. 너도 생일만 입력하면 서로 친구 추가되고 궁합도 볼 수 있어 🐈\n"
    : "해묘에서 너랑 궁합 보려고! 아래 링크 눌러서 생일만 입력하고 다시 보내줘 🐈\n";
  if (navigator.share) {
    try { await navigator.share({ title: "해묘 친구 초대", text, url: link }); return; }
    catch (e) { if (e && e.name === "AbortError") return; }
  }
  const ok = await copyText(link);
  toast(ok ? "초대 링크를 복사했어요. 카톡으로 친구에게 보내세요." : "복사에 실패했어요.");
}

export function buildAddForm(onSaved, navigate) {
  const form = el("form", { class: "panel section-gap", novalidate: true });

  const nameI = el("input", { class: "input", type: "text", maxlength: "20", placeholder: "예: 지민 / 엄마 / 그 사람" });
  const dateI = el("input", { class: "input", type: "date", max: todayStr(), required: true });
  const timeI = el("input", { class: "input", type: "time" });
  const unknownC = el("input", { type: "checkbox" });
  unknownC.addEventListener("change", () => { timeI.disabled = unknownC.checked; timeI.style.opacity = unknownC.checked ? "0.5" : "1"; });

  const calSeg = seg("p-cal", [{ v: "solar", label: "양력" }, { v: "lunar", label: "음력" }], "solar");
  const leapC = el("input", { type: "checkbox" });
  const leapWrap = el("label", { class: "chip", style: "width:fit-content; margin-top:8px; display:none;" }, [
    leapC, el("span", { class: "check" }, [icon("check")]), el("span", { text: "윤달(閏月)" }),
  ]);
  calSeg.addEventListener("change", () => { leapWrap.style.display = calSeg.querySelector('input[value="lunar"]').checked ? "" : "none"; });

  const genSeg = seg("p-gender", [{ v: "female", label: "여성" }, { v: "male", label: "남성" }], "");
  const errBox = el("p", { class: "field-error", "aria-live": "polite" });
  const sijin = sijinPicker(timeI, () => ({ birthDate: dateI.value, birthTime: timeI.value, timeUnknown: unknownC.checked,
    calendarType: calSeg.querySelector("input:checked")?.value || "solar", leapMonth: leapC.checked }));
  [unknownC, dateI, calSeg, leapC].forEach((x) => x.addEventListener("change", () => sijin.refresh()));

  form.append(
    fld("이름 / 호칭", nameI, "실명이 아니어도 돼요. 목록에 표시됩니다."),
    fld("생년월일", dateI, null, true),
    fld("달력 기준", el("div", {}, [calSeg, leapWrap]), "음력이면 자동으로 양력 변환해 계산해요."),
    fld("출생 시간", el("div", { class: "section-gap" }, [
      timeI,
      el("label", { class: "chip", style: "width:fit-content;" }, [unknownC, el("span", { class: "check" }, [icon("check")]), el("span", { text: "시간 모름" })]),
      sijin,
    ]), "모르면 시주를 빼고 봅니다."),
    fld("성별", genSeg, "대운 방향 계산에 필요해요.", true),
    errBox,
    el("div", { class: "btn-row", style: "margin-top: var(--sp-3);" }, [
      el("button", { type: "submit", class: "btn btn-primary btn-sm" }, [icon("check"), el("span", { text: "저장" })]),
    ]),
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = {
      name: nameI.value.trim(),
      birthDate: dateI.value,
      birthTime: timeI.value,
      timeUnknown: unknownC.checked,
      calendarType: calSeg.querySelector("input:checked")?.value || "solar",
      leapMonth: leapC.checked,
      gender: genSeg.querySelector("input:checked")?.value || "",
      timezone: "Asia/Seoul",
      focus: ["personality", "relationship", "love"],
    };
    const { ok, errors } = validateBirthInput(input);
    if (!ok) { errBox.textContent = errors.birthDate || errors.gender || errors.birthTime || "입력을 확인해 주세요."; return; }
    // 직접 입력 추가는 코인 10개
    const addCost = costOf("friendadd");
    const r = spend(addCost, { kind: "friendadd" });
    if (!r.ok) {
      errBox.textContent = `직접 추가는 코인 ${addCost}개가 필요해요. (보유 ${getCoins()}개) · 카톡 초대로 추가하면 무료예요.`;
      if (navigate) navigate("/store");
      return;
    }
    grantFriendBundle(getMyBirth(), input); // 사주·궁합·자미·귀인 무료 열람
    savePerson({ id: makeId("p"), name: input.name || "이름없음", input, createdAt: Date.now() });
    toast(`친구를 저장했어요 · 코인 ${addCost} 차감 · 이 친구의 궁합·귀인은 무료!`);
    onSaved();
  });

  return form;
}

/* ---- 작은 헬퍼 ---- */
function fld(label, control, hint, required) {
  return el("div", { class: "field" }, [
    el("label", { html: label + (required ? ' <span class="gold">*</span>' : "") }),
    control,
    hint ? el("p", { class: "hint", text: hint }) : null,
  ].filter(Boolean));
}
function seg(name, options, current) {
  return el("div", { class: "seg", role: "radiogroup" },
    options.map((o) => el("label", { class: "seg-opt" }, [
      el("input", { type: "radio", name, value: o.v, checked: current === o.v }),
      el("span", { text: o.label }),
    ])));
}
function todayStr() {
  const d = new Date(); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ===== (합침) personSwitch.js ===== */
/* 누구 기준으로 볼까? — 나 / 내가 추가한 사람 칩 + 바로 추가하기.
   선택하면 앱 전체 '시점'이 그 사람으로 바뀐다(state.setViewAs). */

export function personSwitch(navigate, { title = "누구 기준으로 볼까?" } = {}) {
  const box = el("section", { class: "wrap person-switch" });
  function paint() {
    clear(box);
    const cur = getViewAs();
    const people = getPeople().filter((p) => p.input && p.input.birthDate);
    const own = getOwnBirth();
    const chip = (label, on, onClick, extra = "") =>
      el("button", { class: "ps-chip" + (on ? " on" : "") + extra, type: "button", "aria-pressed": String(on), onclick: onClick }, [el("span", { text: label })]);
    const chips = [
      chip(own && own.name ? `나 (${own.name})` : "나", !cur, () => { if (cur) setViewAs(null); }),
      ...people.map((p) => chip(p.name || "이름없음", cur && cur.id === p.id, () => { if (!cur || cur.id !== p.id) setViewAs(p.id); })),
      el("button", { class: "ps-chip ps-add", type: "button", onclick: () => openAdd() }, [icon("plus"), el("span", { text: "사람 추가" })]),
    ];
    box.append(
      el("p", { class: "ps-title", text: title }),
      el("div", { class: "ps-row", role: "group", "aria-label": title }, chips),
    );
  }
  function openAdd() {
    const m = openModal([el("p", { class: "muted tiny", style: "margin-bottom:8px;", text: "추가하면 바로 그 사람 기준으로 볼 수 있어요. (내 사람 목록에도 저장돼요)" })], { title: "사람 추가" });
    m.body.append(buildAddForm(() => {
      m.close();
      const list = getPeople();
      if (list[0]) setViewAs(list[0].id); // 방금 추가한 사람 시점으로 바로 전환
      else paint();
    }, navigate));
  }
  paint();
  return box;
}
