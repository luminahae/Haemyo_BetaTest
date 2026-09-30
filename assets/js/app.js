import { el, $, clear, icon, toast as _toast } from "./utils/dom.js";
import { renderHome } from "./pages/home.js";
import { renderSajuInput } from "./pages/sajuInput.js";
import { renderSajuLoading, renderSajuResult } from "./pages/sajuResult.js";
import { renderTarotQuestion, renderTarotSpread } from "./pages/tarotQuestion.js";
import { renderTarotSelect } from "./pages/tarotSelect.js";
import { renderTarotResult } from "./pages/tarotResult.js";
import { renderCompatInput } from "./pages/compatInput.js";
import { renderCompatResult } from "./pages/compatResult.js";
import { renderZiweiResult } from "./pages/ziweiResult.js";
import { renderOracle } from "./pages/oracle.js";
import { renderPeople } from "./pages/people.js";
import { renderGuiinResult } from "./pages/guiinResult.js";
import { renderStore } from "./pages/store.js";
import { renderFortuneHub, renderTopicReading } from "./pages/fortuneHub.js";
import { renderTojeong } from "./pages/tojeong.js";
import { renderInvite, renderAddFriend } from "./pages/invite.js";
import { renderZodiac, renderStar, renderBiorhythm, renderCharm, renderLuckyCard, renderPull, renderPullPair } from "./pages/extras.js";
import { renderInyeon } from "./pages/inyeon.js";
import { renderExplore, renderThemeReading } from "./pages/explore.js";
import { renderDream } from "./pages/dream.js";
import { renderCalendar } from "./pages/calendar.js";
import { renderGwansang } from "./pages/gwansang.js";
import { renderSaved, renderResultById } from "./pages/saved.js";
import { renderAbout, renderPrivacy, renderNotFound, renderReviews } from "./pages/about.js";
import { renderProfile } from "./pages/profile.js";
import { renderManse, startHanjaObserver } from "./pages/manseView.js";
import { renderStudy } from "./pages/study.js";
import { getActiveProfile } from "./auth.js";
import { getViewAs, setViewAs } from "./state.js";
import { downloadPanel } from "./utils/shareImage.js";
import { getCoins, isUnlimited, grantDailyLogin, grantMonthly } from "./wallet.js";
import { isCloudEnabled, handleRedirect } from "./cloud.js";
/* ===== (합침) router.js ===== */
/* 해시 기반 라우터.
   GitHub Pages 정적 배포에서 새로고침 404가 나지 않도록 해시 라우팅을 사용한다.
   경로 예: #/, #/saju, #/saju/result, #/tarot, #/result/:id */

const routes = [];
let notFoundHandler = null;
let currentCleanup = null;

export function route(pattern, handler) {
  // pattern: "/saju/result" 또는 "/result/:id"
  const keys = [];
  const rx = new RegExp(
    "^" +
      pattern
        .replace(/\/+$/, "")
        .replace(/:[^/]+/g, (m) => {
          keys.push(m.slice(1));
          return "([^/]+)";
        })
        .replace(/\//g, "\\/") +
      "\\/?$"
  );
  routes.push({ rx, keys, handler });
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path) {
  if (("#" + path) === location.hash) {
    // 동일 경로면 강제 재렌더
    handleRoute();
  } else {
    location.hash = path;
  }
}

function parseHash() {
  let h = location.hash.replace(/^#/, "");
  if (!h) h = "/";
  const [pathPart, queryPart] = h.split("?");
  const path = pathPart.replace(/\/+$/, "") || "/";
  const query = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => (query[k] = v));
  }
  return { path, query };
}

async function handleRoute() {
  const { path, query } = parseHash();

  // 이전 페이지 정리 훅
  if (typeof currentCleanup === "function") {
    try { currentCleanup(); } catch { /* ignore */ }
    currentCleanup = null;
  }

  for (const r of routes) {
    const m = r.rx.exec(path);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      window.scrollTo(0, 0);
      const cleanup = await r.handler({ params, query, path });
      if (typeof cleanup === "function") currentCleanup = cleanup;
      return;
    }
  }

  if (notFoundHandler) {
    window.scrollTo(0, 0);
    notFoundHandler({ path });
  }
}

export function startRouter() {
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

export function currentPath() {
  return parseHash().path;
}

/* ===== (원래) ===== */
/* 앱 진입점 — 셸(헤더/뷰) 구성 + 라우트 등록 + 라우터 시작 */


const NAV = [
  { path: "/store", label: "충전소" },
  { path: "/saved", label: "저장함" },
  { path: "/about", label: "이용 안내" },
  { path: "/privacy", label: "개인정보" },
];

function buildShell() {
  const app = $("#app");
  clear(app);

  const brandMark = icon("moon");
  brandMark.classList.add("mark");
  const brand = el("a", { class: "brand", href: "#/", "aria-label": "홈으로" }, [
    brandMark,
    el("span", { html: '해묘 <span style="opacity:.6;font-size:.85em;">解猫</span>' }),
  ]);

  // 로그인/프로필 칩
  const loginChip = el("a", { class: "login-chip", href: "#/profile", "data-nav": "/profile", "aria-label": "로그인/프로필" });
  const refreshChip = () => {
    clear(loginChip);
    const p = getActiveProfile();
    loginChip.append(icon(p ? "users" : "moon"), el("span", { text: p ? p.name : "로그인" }));
  };
  refreshChip();
  window.addEventListener("profilechange", refreshChip);

  // 코인 칩 (로그인 옆) — 잔액 표시 + 충전소로
  const coinChip = el("a", { class: "coin-chip", href: "#/store", "data-nav": "/store", "aria-label": "코인 충전소" });
  const refreshCoin = () => { clear(coinChip); coinChip.append(el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: isUnlimited() ? "∞" : String(getCoins()) })); };
  refreshCoin();
  window.addEventListener("walletchange", refreshCoin);
  window.addEventListener("hashchange", refreshCoin);

  const header = el("header", { class: "app-header" }, [brand, el("div", { class: "header-right" }, [coinChip, loginChip])]);
  // 시점 전환 배너 — 다른 사람 시점으로 보는 중일 때만
  const viewBar = el("div", { class: "viewas-bar", role: "status" });
  const refreshViewBar = () => {
    clear(viewBar);
    const va = getViewAs();
    viewBar.hidden = !va;
    if (!va) return;
    viewBar.append(
      el("span", { html: `<b>${(va.name || "그 사람").replace(/[<>&]/g, "")}</b> 님 시점으로 보는 중` }),
      el("button", { class: "viewas-back", type: "button", onclick: () => { setViewAs(null); } }, [el("span", { text: "내 시점으로" })]),
    );
  };
  refreshViewBar();
  window.addEventListener("viewaschange", () => { refreshViewBar(); navigate(currentPath() || "/"); });
  const view = el("div", { id: "view" });
  const main = el("main", { id: "main", class: "app-main", tabindex: "-1" }, [view]);

  app.append(header, viewBar, main, buildTabBar());
  try { startHanjaObserver(document.body); } catch { /* 병기 실패해도 앱은 계속 */ }
  return view;
}

const TABS = [
  { path: "/", label: "홈", icon: "home" },
  { path: "/tarot", label: "타로", icon: "cards" },
  { path: "/fortune", label: "운세", icon: "sparkle", center: true },
  { path: "/people", label: "내 사람", icon: "heart" },
  { path: "/profile", label: "마이", icon: "users" },
];
function buildTabBar() {
  return el("nav", { class: "tab-bar", "aria-label": "하단 메뉴" },
    TABS.map((t) => el("a", {
      class: "tab" + (t.center ? " tab-center" : ""), href: "#" + t.path, "data-nav": t.path, "aria-label": t.label,
    }, [
      el("span", { class: "tab-ic" }, [icon(t.icon)]),
      el("span", { class: "tab-label", text: t.label }),
    ]))
  );
}

let viewEl;

/* 결과 화면마다 'PDF·이미지로 받기' 패널을 붙인다 */
const DOWNLOADABLE = [
  [/^\/saju\/result/, "해묘-사주리포트"], [/^\/tarot\/result/, "해묘-타로"], [/^\/ziwei\/result/, "해묘-자미두수"],
  [/^\/compat\/result/, "해묘-궁합"], [/^\/guiin\/result/, "해묘-귀인"], [/^\/result\//, "해묘-저장결과"],
  [/^\/fortune\/.+/, "해묘-운세"], [/^\/pull\/pair/, "해묘-끌림궁합"], [/^\/pull$/, "해묘-내매력사주"], [/^\/theme\//, "해묘-테마운세"],
  [/^\/inyeon/, "해묘-나의인연"], [/^\/tojeong/, "해묘-토정비결"], [/^\/charm/, "해묘-매력지수"],
  [/^\/zodiac/, "해묘-띠운세"], [/^\/star/, "해묘-별자리"], [/^\/biorhythm/, "해묘-바이오리듬"],
  [/^\/luckycard/, "해묘-행운카드"], [/^\/gwansang/, "해묘-관상"], [/^\/dream/, "해묘-꿈해몽"],
  [/^\/oracle/, "해묘-물어보기"], [/^\/calendar/, "해묘-운세캘린더"], [/^\/manse/, "해묘-만세력"],
];
function mount(node, opts = {}) {
  clear(viewEl);
  const dl = DOWNLOADABLE.find(([rx]) => rx.test(currentPath()));
  if (dl) {
    node.appendChild(downloadPanel(node, dl[1])); // 오른쪽에 떠 있는 저장 버튼
  }
  viewEl.appendChild(node);
  highlightNav();
  // 포커스 관리(접근성): 새 화면 진입 시 제목으로 포커스
  const h = node.querySelector("h1");
  if (h && !opts.noFocus) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  updateToTop();
}

function highlightNav() {
  const p = currentPath();
  $("#app").querySelectorAll("[data-nav]").forEach((a) => {
    const path = a.getAttribute("data-nav");
    const on = path === "/" ? (p === "/" || p === "") : p.startsWith(path);
    a.classList.toggle("is-current", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

/* ---- Back-to-top 버튼 ---- */
let toTopBtn;
function setupToTop() {
  toTopBtn = el("button", {
    class: "to-top", type: "button", "aria-label": "맨 위로 이동",
    onclick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
  }, [icon("arrowUp")]);
  document.body.appendChild(toTopBtn);
  window.addEventListener("scroll", updateToTop, { passive: true });
}
function updateToTop() {
  if (!toTopBtn) return;
  toTopBtn.classList.toggle("show", window.scrollY > 400);
}

/* ---- 라우트 정의 ---- */
function registerRoutes() {
  route("/", () => mount(renderHome({ navigate })));
  route("/saju", () => mount(renderSajuInput({ navigate })));
  route("/saju/loading", () => renderSajuLoading({ navigate, mount }));
  route("/saju/result", () => mount(renderSajuResult({ navigate })));
  route("/tarot", () => mount(renderTarotQuestion({ navigate })));
  route("/tarot/spread", () => mount(renderTarotSpread({ navigate })));
  route("/tarot/select", () => mount(renderTarotSelect({ navigate })));
  route("/tarot/result", () => mount(renderTarotResult({ navigate })));
  route("/oracle", () => mount(renderOracle({ navigate })));
  route("/tojeong", () => mount(renderTojeong({ navigate })));
  route("/gwansang", () => mount(renderGwansang({ navigate })));
  route("/zodiac", () => mount(renderZodiac({ navigate })));
  route("/star", () => mount(renderStar({ navigate })));
  route("/biorhythm", () => mount(renderBiorhythm({ navigate })));
  route("/dream", () => mount(renderDream({ navigate })));
  route("/charm", () => mount(renderCharm({ navigate })));
  route("/pull", () => mount(renderPull({ navigate })));
  route("/pull/pair", () => mount(renderPullPair({ navigate })));
  route("/luckycard", () => mount(renderLuckyCard({ navigate })));
  route("/inyeon", () => mount(renderInyeon({ navigate })));
  route("/explore", () => mount(renderExplore({ navigate })));
  route("/theme/:id", ({ params }) => mount(renderThemeReading({ navigate, id: params.id })));
  route("/manse", () => mount(renderManse({ navigate })));
  route("/study", () => mount(renderStudy({ navigate })));
  route("/study/:id", ({ params }) => mount(renderStudy({ navigate, id: params.id })));
  route("/calendar", () => mount(renderCalendar({ navigate })));
  route("/fortune", () => mount(renderFortuneHub({ navigate })));
  route("/fortune/:method/:id", ({ params }) => mount(renderTopicReading({ navigate, method: params.method, id: params.id })));
  route("/fortune/:id", ({ params }) => mount(renderTopicReading({ navigate, method: "saju", id: params.id })));
  route("/store", () => mount(renderStore({ navigate })));
  route("/premium", () => mount(renderStore({ navigate }))); // 이전 경로 호환
  route("/people", () => mount(renderPeople({ navigate })));
  route("/invite", () => mount(renderInvite({ navigate })));
  route("/invite/:data", ({ params }) => mount(renderInvite({ navigate, data: params.data })));
  route("/addfriend/:data", ({ params }) => mount(renderAddFriend({ navigate, data: params.data })));
  route("/guiin/result", () => mount(renderGuiinResult({ navigate })));
  route("/compat", () => mount(renderCompatInput({ navigate })));
  route("/compat/result", () => mount(renderCompatResult({ navigate })));
  route("/ziwei", () => mount(renderSajuInput({ navigate, mode: "ziwei" })));
  route("/ziwei/result", () => mount(renderZiweiResult({ navigate })));
  route("/saved", () => mount(renderSaved({ navigate })));
  route("/about", () => mount(renderAbout({ navigate })));
  route("/privacy", () => mount(renderPrivacy({ navigate })));
  route("/profile", () => mount(renderProfile({ navigate })));
  route("/reviews", () => mount(renderReviews({ navigate })));
  route("/result/:id", ({ params }) => mount(renderResultById({ navigate, id: params.id })));
  setNotFound(() => mount(renderNotFound({ navigate })));
}

function init() {
  viewEl = buildShell();
  setupToTop();
  registerRoutes();
  try { grantDailyLogin(); } catch { /* ignore */ }   // 로그인 사용자 매일 1코인
  try { grantMonthly().forEach((m, i) => setTimeout(() => _toast(`${m.emoji} ${m.name} — 이달의 선물, 코인 +${m.coins}`, 3200), 800 + i * 3400)); } catch { /* ignore */ }
  window.addEventListener("profilechange", () => { try { grantDailyLogin(); } catch { /* ignore */ } });
  // 클라우드 OAuth 복귀 처리(설정된 경우) 후 라우터 시작
  if (isCloudEnabled()) {
    handleRedirect().catch(() => {}).finally(() => { window.dispatchEvent(new Event("profilechange")); startRouter(); });
  } else {
    startRouter();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else init();

export { mount };
