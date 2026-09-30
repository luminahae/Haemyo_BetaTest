/* =========================================================
   클라우드(선택) 설정.
   여기를 채우면 카카오/네이버 로그인 + 클라우드 저장(기기 동기화)이 켜집니다.
   비워 두면 앱은 지금처럼 '로컬 프로필'로만 동작합니다(서버 없이).

   설정 방법은 SETUP.md 참고.
   ⚠️ 여기 들어가는 값은 '공개(anon) 키'입니다. Supabase anon key와
   카카오/네이버의 JS/Client ID는 클라이언트에 노출되어도 되는 공개 값이며,
   보안은 Supabase의 RLS(행 수준 보안)와 각 콘솔의 도메인 제한으로 지킵니다.
   비밀 키(service_role, REST secret)는 절대 여기에 넣지 마세요.
   ========================================================= */

export const CONFIG = {
  // Supabase 프로젝트 (Settings → API)
  supabaseUrl: "",        // 예: "https://abcdxyz.supabase.co"
  supabaseAnonKey: "",    // 예: "eyJhbGciOi..."(anon public)

  // 네이버 (선택) — 네이버는 Supabase 기본 제공이 아니라 별도 설정 필요
  naverClientId: "",      // 네이버 개발자센터 애플리케이션 Client ID
  naverEnabled: false,    // 네이버 엣지 함수까지 설정했다면 true

  // Supabase JS SDK 로드 URL (ESM). 필요 시 버전 고정/자체호스팅 가능.
  supabaseEsm: "https://esm.sh/@supabase/supabase-js@2",

  /* ---- 코인 충전(소액결제) 설정 — 점신/포스텔러식 ----
     해석 1회 = 1코인(기본 500원). 충전은 외부 결제사의 안전한(PCI) 페이지에서 처리하고,
     결제 후 받은 '라이선스 키'를 입력하면 해당 패키지만큼 코인이 충전됩니다.
     이 앱은 카드정보를 절대 받지 않습니다. 설정 방법은 SETUP.md 참고.
     비워 두면 '충전 준비 중'으로 표시됩니다(출석 무료코인·둘러보기는 그대로 동작). */
  payment: {
    enabled: false,               // true로 켜면 충전 UI 노출
    provider: "lemonsqueezy",     // "lemonsqueezy" | "gumroad"
    manageUrl: "",                // 영수증/환불/문의 링크(선택)
    // 충전 패키지 — 각 상품의 호스티드 체크아웃 URL + 지급 코인 수
    // variantId/productId: 결제 후 라이선스 검증 응답과 매칭해 올바른 코인 지급
    packages: [
      // { coins: 3,  priceLabel: "₩1,500", checkoutUrl: "", variantId: "", productId: "", badge: "" },
      // { coins: 11, priceLabel: "₩5,000", checkoutUrl: "", variantId: "", productId: "", badge: "인기" },
      // { coins: 24, priceLabel: "₩10,000", checkoutUrl: "", variantId: "", productId: "", badge: "이득" },
    ],
  },
};

export function getConfig() {
  // window.__SAJU_CONFIG 로 배포 시 덮어쓸 수도 있음(선택)
  return Object.assign({}, CONFIG, (typeof window !== "undefined" && window.__SAJU_CONFIG) || {});
}

export function isCloudEnabled() {
  const c = getConfig();
  return !!(c.supabaseUrl && c.supabaseAnonKey);
}

export function getPaymentConfig() {
  const p = getConfig().payment || { enabled: false };
  return { packages: [], ...p };
}
/** 충전이 실제로 켜져 있는지(설정 완료 + 패키지 1개 이상 + 체크아웃 URL) */
export function isPaymentReady() {
  const p = getPaymentConfig();
  return !!(p.enabled && p.packages.some((pk) => pk && pk.checkoutUrl));
}
