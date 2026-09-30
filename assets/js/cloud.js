/* =========================================================
   클라우드 계정 · 동기화 (Supabase) — 선택 기능.
   config.js가 비어 있으면 모든 함수가 조용히 no-op → 앱은 로컬로 정상 동작.
   - 카카오 로그인: Supabase 기본 OAuth 사용(권장).
   - 네이버 로그인: Supabase 기본 미지원 → 엣지 함수 필요(SETUP.md).
   - 저장 동기화: results 테이블에 사용자별 upsert / pull.
   PKCE 플로우를 써서 해시 라우팅과 충돌하지 않도록 한다.
   ========================================================= */

import { getConfig, isCloudEnabled } from "./config.js";

let _client = null;

export { isCloudEnabled };

async function client() {
  if (_client) return _client;
  const c = getConfig();
  if (!c.supabaseUrl || !c.supabaseAnonKey) return null;
  const { createClient } = await import(/* @vite-ignore */ c.supabaseEsm);
  _client = createClient(c.supabaseUrl, c.supabaseAnonKey, {
    auth: { flowType: "pkce", detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
  });
  return _client;
}

/** 로그인 리다이렉트 복귀 처리(?code=...) — 앱 시작 시 1회 호출 */
export async function handleRedirect() {
  if (!isCloudEnabled()) return null;
  const url = new URL(location.href);
  const code = url.searchParams.get("code");
  if (!code) return null;
  const sb = await client();
  try {
    await sb.auth.exchangeCodeForSession(code);
  } catch { /* ignore */ }
  // code 파라미터 제거(해시 라우팅 유지)
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  history.replaceState({}, "", url.pathname + url.search + (location.hash || "#/profile"));
  return getUser();
}

export async function getUser() {
  if (!isCloudEnabled()) return null;
  const sb = await client();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data ? data.user : null;
}

export async function loginKakao() {
  const sb = await client();
  if (!sb) return { error: "클라우드 설정이 필요합니다." };
  return sb.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: redirectBase() },
  });
}

/** 네이버 — Supabase 커스텀(엣지 함수) 설정이 되어 있을 때만 */
export async function loginNaver() {
  const c = getConfig();
  if (!c.naverEnabled) return { error: "네이버 로그인은 추가 설정(엣지 함수)이 필요합니다. SETUP.md 참고." };
  // 네이버는 프로젝트별 커스텀 구현이라, 여기서는 설정 안내만 반환.
  return { error: "네이버 로그인 설정을 완료한 뒤 이 함수를 프로젝트에 맞게 연결하세요(SETUP.md)." };
}

export async function logout() {
  const sb = await client();
  if (sb) await sb.auth.signOut();
}

function redirectBase() {
  // 해시 제외한 현재 URL (돌아온 뒤 #/profile 로 이동)
  return location.href.split("#")[0].split("?")[0];
}

/* ---- 데이터 동기화 ---- */
export async function pullResults() {
  const u = await getUser();
  if (!u) return [];
  const sb = await client();
  const { data, error } = await sb.from("results").select("payload").eq("user_id", u.id);
  if (error) return [];
  return (data || []).map((r) => r.payload).filter(Boolean);
}

export async function pushResult(result) {
  const u = await getUser();
  if (!u) return;
  const sb = await client();
  try {
    await sb.from("results").upsert({
      id: result.id, user_id: u.id, payload: result, updated_at: new Date().toISOString(),
    });
  } catch { /* ignore (offline 등) */ }
}

export async function pushAll(results) {
  const u = await getUser();
  if (!u || !results.length) return;
  const sb = await client();
  const rows = results.map((r) => ({ id: r.id, user_id: u.id, payload: r, updated_at: new Date().toISOString() }));
  try { await sb.from("results").upsert(rows); } catch { /* ignore */ }
}

export async function deleteCloud(id) {
  const u = await getUser();
  if (!u) return;
  const sb = await client();
  try { await sb.from("results").delete().eq("id", id).eq("user_id", u.id); } catch { /* ignore */ }
}
