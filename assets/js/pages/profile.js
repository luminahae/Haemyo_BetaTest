import { el, clear, toast, icon } from "../utils/dom.js";
import { getProfiles, getActiveId, getActiveProfile, setActive, ensureProfile, createProfile, deleteProfile, hasPin, verifyPin } from "../auth.js";
import { getResults, exportBackup, importBackup } from "../state.js";
import { grantOnce, grantDailyLogin } from "../wallet.js";
import { isCloudEnabled, getUser as getCloudUser, loginKakao, loginNaver, logout as cloudLogout, pullResults, pushAll } from "../cloud.js";
import { personSwitch } from "./people.js";
import { pageHeader, backLink, noticeBox } from "./_shared.js";
function refreshHeader() { window.dispatchEvent(new Event("profilechange")); }

export function renderProfile({ navigate }) {
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("PROFILE", "로그인 · 프로필",
    "이 브라우저 안에서만 쓰는 로컬 프로필입니다. 프로필마다 저장한 결과가 따로 보관됩니다."));

  root.append(personSwitch(navigate, { title: "나 / 내 사람 — 누구 기준으로 볼까?" }));
  const body = el("div", { class: "wrap section-gap" });
  root.append(body);
  render();

  function render() {
    clear(body);

    // 클라우드(카카오/네이버) 로그인·동기화 패널
    const cloudBox = el("div", {});
    body.append(cloudBox);
    updateCloud(cloudBox);

    const active = getActiveProfile();
    const activeId = getActiveId();

    // 현재 상태
    body.append(el("div", { class: "panel panel-gold section-gap" }, [
      el("div", { style: "display:flex; align-items:center; gap:12px;" }, [
        el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon("users")]),
        el("div", { style: "flex:1;" }, [
          el("p", { class: "tiny muted", text: "현재 로그인" }),
          el("p", { style: "font-weight:700; font-size:1.1rem;", text: active ? active.name : "게스트 (로그인 안 함)" }),
        ]),
        el("span", { class: "tiny muted", text: `저장 ${getResults().length}건` }),
      ]),
      active ? el("button", { class: "btn btn-ghost btn-sm", onclick: () => { setActive(null); refreshHeader(); toast("게스트로 전환했어요."); render(); } },
        [icon("back"), el("span", { text: "게스트로 전환 (로그아웃)" })]) : null,
    ].filter(Boolean)));

    // 프로필 목록
    const profiles = getProfiles();
    if (profiles.length) {
      body.append(el("div", { class: "section-gap" }, [
        el("h3", { text: "프로필 선택" }),
        ...profiles.map((p) => profileRow(p, activeId === p.id, render)),
      ]));
    }

    // 회원 가입 (게스트일 때만)
    if (!active) body.append(signupBox(render));

    // 사람 추가하기
    body.append(el("button", { class: "btn btn-ghost btn-block", onclick: () => navigate("/people") },
      [icon("users"), el("span", { text: "사람(친구) 추가하기" })]));

    // 백업 (기기 이동용)
    body.append(backupPanel());

    body.append(noticeBox("privacy",
      "서버 없는 로컬 로그인입니다. 다른 기기로 옮기려면 ‘백업 내보내기’를 쓰세요. 카카오·네이버 로그인은 설정 시 기기 간 동기화됩니다."));
  }

  function profileRow(p, isActive, rerender) {
    const pinArea = el("div", {});
    const row = el("div", { class: "panel", style: "display:flex; align-items:center; gap:12px; flex-wrap:wrap;" }, [
      el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon(hasPin(p.id) ? "shield" : "users")]),
      el("div", { style: "flex:1; min-width:0;" }, [
        el("p", { style: "font-weight:600;", text: p.name + (isActive ? " · 사용 중" : "") }),
        el("p", { class: "tiny muted", text: hasPin(p.id) ? "PIN 잠금" : "잠금 없음" }),
      ]),
      isActive
        ? el("span", { class: "tiny gold", text: "현재 프로필" })
        : el("button", { class: "btn btn-primary btn-sm", onclick: () => login(p, pinArea, rerender) }, [el("span", { text: "로그인" })]),
      el("button", { class: "btn btn-ghost btn-sm", "aria-label": "삭제", onclick: () => del(p, rerender) }, [icon("trash")]),
    ]);
    return el("div", { class: "section-gap" }, [row, pinArea]);
  }

  function login(p, pinArea, rerender) {
    if (!hasPin(p.id)) { setActive(p.id); refreshHeader(); toast(`${p.name}(으)로 로그인했어요.`); rerender(); return; }
    clear(pinArea);
    const pin = el("input", { class: "input", type: "password", inputmode: "numeric", maxlength: "8", placeholder: "PIN 입력", "aria-label": "PIN" });
    const msg = el("p", { class: "field-error" });
    const go = () => {
      if (verifyPin(p.id, pin.value)) { setActive(p.id); refreshHeader(); toast(`${p.name}(으)로 로그인했어요.`); rerender(); }
      else { msg.textContent = "PIN이 올바르지 않습니다."; }
    };
    pin.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    pinArea.append(el("div", { class: "panel section-gap" }, [
      el("p", { class: "tiny muted", text: `${p.name} — PIN을 입력하세요` }),
      pin, msg,
      el("button", { class: "btn btn-primary btn-sm", onclick: go }, [el("span", { text: "확인" })]),
    ]));
    pin.focus();
  }

  function del(p, rerender) {
    if (p._c) { deleteProfile(p.id); refreshHeader(); toast("프로필을 삭제했어요. (저장 결과는 남아 있어요)"); rerender(); }
    else { p._c = true; toast("한 번 더 누르면 삭제됩니다."); setTimeout(() => { p._c = false; }, 2600); }
  }

  function signupBox(rerender) {
    const nameI = el("input", { class: "input", type: "text", maxlength: "20", placeholder: "이름 또는 닉네임" });
    const go = () => {
      if (!nameI.value.trim()) { toast("이름을 입력해 주세요."); return; }
      const prof = createProfile(nameI.value.trim(), null);
      setActive(prof.id);
      const b = grantOnce("signup:" + prof.id, 5);
      refreshHeader(); toast(b.ok ? `${prof.name} 가입 완료! 축하 코인 +5 🎁` : `${prof.name}(으)로 로그인했어요.`); rerender();
    };
    nameI.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    return el("div", { class: "panel section-gap" }, [
      el("h3", { text: "회원 가입하기" }),
      el("p", { class: "tiny muted", text: "이름만 정하면 끝! 가입하면 축하 코인 5개를 드려요." }),
      el("div", { class: "field" }, [nameI]),
      el("button", { class: "btn btn-primary btn-block", onclick: go }, [el("span", { text: "가입하고 시작 · 코인 +5" })]),
    ]);
  }

  function backupPanel() {
    const fileI = el("input", { type: "file", accept: "application/json,.json", style: "display:none;" });
    fileI.addEventListener("change", () => {
      const f = fileI.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const res = importBackup(data, "merge");
          if (res.ok) { toast(`가져오기 완료 — ${res.added}건 추가.`); render(); }
          else toast(res.message);
        } catch { toast("파일을 읽을 수 없습니다."); }
      };
      reader.readAsText(f);
    });
    return el("div", { class: "panel section-gap" }, [
      el("h3", { text: "백업 · 기기 이동" }),
      el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "모든 프로필과 저장 결과를 파일로 내보내고, 다른 기기·브라우저에서 가져올 수 있습니다." }),
      el("div", { class: "btn-row" }, [
        el("button", { class: "btn btn-ghost btn-sm", onclick: doExport }, [icon("download"), el("span", { text: "백업 내보내기" })]),
        el("button", { class: "btn btn-ghost btn-sm", onclick: () => fileI.click() }, [icon("copy"), el("span", { text: "백업 가져오기" })]),
      ]),
      fileI,
    ]);
  }

  async function updateCloud(box) {
    clear(box);
    if (!isCloudEnabled()) {
      box.append(noticeBox("info", "카카오·네이버 로그인(=무료 본인인증)과 기기 동기화를 켜려면 SETUP.md 안내대로 Supabase(무료 티어)·카카오를 설정한 뒤 assets/js/config.js에 키를 넣으세요. 통신사 유료 인증 없이, 소셜 로그인이 본인확인을 대신합니다. (설정 전에는 아래 ‘로컬 프로필’만 동작합니다.)"));
      return;
    }
    let user = null;
    try { user = await getCloudUser(); } catch { /* ignore */ }
    if (user) {
      const uid = "cloud_" + user.id;
      const meta = user.user_metadata || {};
      const name = meta.name || meta.nickname || meta.full_name || user.email || "클라우드 계정";
      ensureProfile(uid, name);
      if (getActiveId() !== uid) { setActive(uid); refreshHeader(); }
      const sb = grantOnce("social:" + uid, 5);       // 카카오/네이버 연동 축하 코인
      if (sb.ok) toast("계정 연동 완료! 축하 코인 +5");
      box.append(el("div", { class: "panel panel-gold section-gap" }, [
        el("div", { style: "display:flex; align-items:center; gap:12px;" }, [
          el("span", { style: "color:var(--c-gold); display:inline-flex;" }, [icon("shield")]),
          el("div", { style: "flex:1;" }, [el("p", { class: "tiny muted", text: "클라우드 로그인됨 · 기기 동기화 켜짐" }), el("p", { style: "font-weight:700;", text: name })]),
        ]),
        el("div", { class: "btn-row" }, [
          el("button", { class: "btn btn-ghost btn-sm", onclick: async () => {
            const pulled = await pullResults(); const active = getActiveId();
            pulled.forEach((r) => { r.profileId = active; });
            const res = importBackup({ app: "saju-tarot-report", version: 1, results: pulled }, "merge");
            toast(`클라우드에서 ${res.added || 0}건 불러왔어요.`); render();
          } }, [icon("download"), el("span", { text: "클라우드에서 불러오기" })]),
          el("button", { class: "btn btn-ghost btn-sm", onclick: async () => { await pushAll(getResults()); toast("클라우드에 올렸어요."); } }, [icon("share"), el("span", { text: "클라우드에 올리기" })]),
          el("button", { class: "btn btn-quiet btn-sm", onclick: async () => { await cloudLogout(); setActive(null); refreshHeader(); toast("클라우드 로그아웃했어요."); render(); } }, [el("span", { text: "로그아웃" })]),
        ]),
      ]));
    } else {
      box.append(el("div", { class: "panel section-gap" }, [
        el("h3", { text: "카카오·네이버 로그인 = 무료 본인인증" }),
        el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "따로 돈 드는 통신사 인증 없이, 카카오·네이버 계정으로 로그인하면 그게 곧 본인확인이에요. 결과가 클라우드에 저장돼 다른 기기에서도 보이고, 연동 시 축하 코인 +5도 드려요." }),
        el("div", { class: "btn-row" }, [
          el("button", { class: "btn kakao-btn", onclick: () => loginKakao() }, [el("span", { text: "카카오로 본인인증·로그인" })]),
          el("button", { class: "btn naver-btn", onclick: async () => { const r = await loginNaver(); if (r && r.error) toast(r.error); } }, [el("span", { text: "네이버로 본인인증·로그인" })]),
        ]),
        el("p", { class: "muted tiny", text: "관리자 인증 등 민감한 기능은 이 로그인(본인확인)을 마친 계정에서만 열려요." }),
      ]));
    }
  }

  function doExport() {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: "saju-tarot-backup.json" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("백업 파일을 저장했어요.");
  }

  return root;
}
