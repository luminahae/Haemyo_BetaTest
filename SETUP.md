# 해묘 설정 안내 (백엔드 · 클라우드 로그인 · 결제)

# 서버리스 백엔드 — 본인인증 · 코인 보안 설계 (Supabase)

정적 사이트(GitHub Pages)만으론 **코인 잔액이 브라우저에 있어 조작 가능**하고, **진짜 본인인증**도 안 돼요.
이 문서는 **Supabase**(이미 `cloud.js`가 쓰는 스택)로 그 두 가지를 서버에서 지키는 방법이에요.
클라이언트는 그대로 두고, "돈이 걸린 판정"만 서버로 옮기는 게 핵심이에요.

> 원칙: **잔액·차감·결제확인·관리자 권한은 전부 서버가 최종 판정.** 브라우저는 표시만.

---

## 0. 큰 그림

```
[브라우저]  ──(JWT 로그인 토큰)──▶  [Supabase Edge Function]  ──▶  [Postgres(RLS)]
  해묘 앱                              spend / grant / redeem            wallets, unlocks
                                       verify-payment                    transactions
```

- **로그인/본인인증**: Supabase Auth (카카오 OAuth) = 1차 본인확인.
  더 강한 **휴대폰 본인인증(PASS)**이 필요하면 NICE·다날 같은 인증대행(유료, 사업자 필요)을
  Edge Function에서 호출해 `verified_phone`을 채워요.
- **코인**: 잔액은 Postgres에만. 앱은 "이거 열어줘"라고 요청 → 서버가 잔액 확인 후 차감하고 결과만 반환.

---

## 1. 데이터베이스 (SQL)

Supabase → SQL Editor에 붙여넣기:

```sql
-- 지갑
create table wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins int not null default 0,
  is_admin boolean not null default false,
  verified_phone boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 열어본 해석 (재열람 무료)
create table unlocks (
  user_id uuid references auth.users(id) on delete cascade,
  item_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- 코인 변동 내역(감사)
create table transactions (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null,      -- 'checkin' | 'signup' | 'social' | 'coupon' | 'topup' | 'spend'
  ref text,
  created_at timestamptz not null default now()
);

-- 1회성 지급/사용 방지(가입보너스·쿠폰·라이선스 등)
create table redemptions (
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,         -- 'signup' | 'coupon:myonyang' | license key ...
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- RLS: 본인 행만 읽기, 쓰기는 함수(service_role)만
alter table wallets enable row level security;
alter table unlocks enable row level security;
alter table transactions enable row level security;
create policy "read own wallet" on wallets for select using (auth.uid() = user_id);
create policy "read own unlocks" on unlocks for select using (auth.uid() = user_id);
create policy "read own tx" on transactions for select using (auth.uid() = user_id);
-- INSERT/UPDATE 정책은 만들지 않음 → 오직 Edge Function(service_role)만 변경 가능
```

---

## 2. Edge Function — 코인 차감 (핵심)

`supabase/functions/spend/index.ts` (Deno):

```ts
import { createClient } from "npm:@supabase/supabase-js@2";

// 가격표는 서버에도 둔다(클라 값을 믿지 않음)
const COST: Record<string, number> = {
  today:1, weekday:1, weekend:1, oracle:1, todaylove:1,
  study:2, wealth:2, document:2, guiin:2, gwansang:2, month:2, nextmonth:2, monthlove:2, business:2, h1lucky:2, h2lucky:2,
  yearlove:3, reunion:3, breakup:3, "ziwei-deep":3, tojeong:3, tarot:3, year:3,
  compat:5,
};

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // 토큰으로 사용자 확인
  const { data: { user } } = await admin.auth.getUser(auth.replace("Bearer ", ""));
  if (!user) return json(401, { error: "unauthorized" });

  const { itemId, kind } = await req.json();       // 예: itemId="saju:yearlove:...", kind="yearlove"
  const cost = COST[kind] ?? 1;

  // 이미 열었으면 무료
  const { data: had } = await admin.from("unlocks").select("item_id").eq("user_id", user.id).eq("item_id", itemId).maybeSingle();
  if (had) return json(200, { ok: true, reason: "already" });

  // 지갑 조회
  const { data: w } = await admin.from("wallets").select("coins,is_admin").eq("user_id", user.id).maybeSingle();
  if (w?.is_admin) { await unlock(admin, user.id, itemId); return json(200, { ok: true, reason: "admin" }); }
  if (!w || w.coins < cost) return json(200, { ok: false, reason: "insufficient", coins: w?.coins ?? 0 });

  // 차감 + 언락 + 내역 (원자적으로: RPC로 감싸면 더 안전)
  await admin.from("wallets").update({ coins: w.coins - cost, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  await unlock(admin, user.id, itemId);
  await admin.from("transactions").insert({ user_id: user.id, delta: -cost, reason: "spend", ref: itemId });
  return json(200, { ok: true, reason: "spent", coins: w.coins - cost });
});

async function unlock(a: any, uid: string, itemId: string) {
  await a.from("unlocks").insert({ user_id: uid, item_id: itemId }).select();
}
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
```

같은 패턴으로:
- `grant`(출석/가입/소셜 보너스 — `redemptions`로 1회 제한),
- `redeem`(쿠폰/라이선스 — 서버에서 코드 검증 후 코인 지급),
- `verify-payment`(Lemon Squeezy/Toss 웹훅 또는 서명 검증 후 충전),
- `set-admin`(허용된 이메일만 관리자 승격 — 아래).

---

## 3. 관리자 · 본인인증

- **관리자**: 코드(`lumina_hae`)를 클라에 두지 말고, Edge Function `set-admin`에서
  `if (user.email === Deno.env.get("OWNER_EMAIL"))` 일 때만 `wallets.is_admin = true`.
  → 오너 이메일로 **로그인(본인인증)** 한 사람만 관리자. 코드 노출 문제 사라짐.
- **휴대폰 본인인증(선택, 강함)**: 사업자등록 후 NICE평가정보/다날 본인인증 연동.
  인증 성공 콜백을 Edge Function이 받아 `wallets.verified_phone = true`. 성인/실명 필요한 기능에 사용.

---

## 4. 클라이언트 연결 (config 스위치)

`config.js`에 백엔드 URL을 넣으면 앱이 서버 모드로:

```js
backend: { enabled: true, functionsUrl: "https://<프로젝트>.functions.supabase.co" }
```

- `wallet.js`의 `unlock/isUnlocked/getCoins`를 **서버 우선**으로: 로그인 상태면 서버에 물어보고,
  아니면 지금처럼 로컬(게스트 체험). 서버 응답이 최종.
- 지금 코드가 `getCoins()/unlock()`를 이미 한 곳에서 부르니, 그 함수만 서버 호출로 바꾸면 전체가 따라와요.
  (동기→비동기 전환이 필요하니, 결과 페이지의 결제 버튼 핸들러를 async로.)

---

## 5. 마이그레이션 순서 (안 깨지게)

1. 지금(로컬 지갑)으로 **출시** — 체험·바이럴 먼저.
2. Supabase 프로젝트 + 위 SQL + `spend`/`grant`/`redeem` 함수 배포.
3. 로그인 사용자만 서버 지갑 사용(게스트는 로컬 체험 유지).
4. 결제 웹훅(`verify-payment`) 붙여 충전을 서버 확정.
5. 관리자·본인인증을 서버로 이관(코드 상수 제거).

> 요점: **한 번에 다 바꾸지 말고**, "돈 걸린 판정"부터 서버로. 로컬은 게스트 체험용으로 남겨요.

## 절대 하면 안 되는 것
- `service_role` 키를 **클라이언트/config.js에 넣지 마세요.** Edge Function 환경변수에만.
- 가격·잔액·관리자 여부를 **클라 값으로 신뢰하지 마세요.** 항상 서버가 재확인.


---

# 클라우드 로그인·동기화 설정 (카카오/네이버 + Supabase)

> 이 설정은 **선택**입니다. 하지 않으면 앱은 지금처럼 **로컬 프로필 + 백업 파일**로 잘 동작합니다.
> 설정하면 카카오(권장)/네이버로 로그인하고, 사주·타로·자미두수·궁합 결과가 **클라우드에 저장되어 다른 기기에서도** 보입니다.

정적 사이트(GitHub Pages)에는 서버가 없으므로, 서버 역할을 **Supabase**(무료 티어)가 대신합니다. 아래 값들은 모두 **공개(anon) 키**라 클라이언트에 노출되어도 됩니다. 실제 보안은 **RLS(행 수준 보안)** 로 지킵니다. `service_role` 같은 비밀 키는 절대 넣지 마세요.

콘솔 가입·키 발급은 **본인 계정으로 직접** 해야 합니다(대리 불가). 순서대로 따라오시면 됩니다.

---

## 1) Supabase 프로젝트 만들기
1. https://supabase.com 가입 → **New project** 생성.
2. **Settings → API** 에서 두 값 복사:
   - `Project URL` (예: `https://abcdxyz.supabase.co`)
   - `anon public` key

## 2) 결과 저장 테이블 + 보안(RLS) 만들기
Supabase → **SQL Editor** 에 아래를 붙여 실행:

```sql
create table if not exists public.results (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz default now()
);
alter table public.results enable row level security;

create policy "own rows - select" on public.results
  for select using (auth.uid() = user_id);
create policy "own rows - insert" on public.results
  for insert with check (auth.uid() = user_id);
create policy "own rows - update" on public.results
  for update using (auth.uid() = user_id);
create policy "own rows - delete" on public.results
  for delete using (auth.uid() = user_id);
```

이러면 **본인 데이터만** 읽고 쓸 수 있습니다.

## 3) 로그인 후 돌아올 주소 등록
Supabase → **Authentication → URL Configuration**:
- **Site URL**: 배포 주소 (예: `https://<사용자>.github.io/<저장소>/`)
- **Redirect URLs**: 위와 같은 주소를 추가 (로컬 테스트용 `http://localhost:5173/` 도 함께 추가하면 편함)

## 4) 카카오 로그인 연결 (권장)
1. https://developers.kakao.com → **내 애플리케이션 → 애플리케이션 추가**.
2. **앱 키**에서 `REST API 키` 확인.
3. **카카오 로그인 → 활성화 ON**.
4. **카카오 로그인 → Redirect URI** 에 Supabase 콜백 추가:
   `https://<프로젝트>.supabase.co/auth/v1/callback`
5. **동의 항목**에서 닉네임(profile_nickname) 등 필요한 항목 동의 설정.
6. **보안 → Client Secret** 발급(ON).
7. Supabase → **Authentication → Providers → Kakao** 활성화 후:
   - `REST API 키` → **Client ID**
   - `Client Secret` → **Client Secret**
8. 카카오 **앱 → 플랫폼 → Web** 에 배포 도메인(`https://<사용자>.github.io`) 등록.

## 5) config.js 채우기
`assets/js/config.js` 를 열어 값을 넣습니다:

```js
export const CONFIG = {
  supabaseUrl: "https://abcdxyz.supabase.co",
  supabaseAnonKey: "eyJhbGciOi...(anon public)",
  naverClientId: "",
  naverEnabled: false,
  supabaseEsm: "https://esm.sh/@supabase/supabase-js@2",
};
```

이제 배포(또는 로컬 서버)에서 **프로필 화면**에 “카카오로 시작하기” 버튼이 나타납니다. 로그인하면 이후 저장하는 결과가 자동으로 클라우드에 올라가고, 다른 기기에서 로그인하면 **‘클라우드에서 불러오기’** 로 가져올 수 있습니다.

---

## 6) 네이버 로그인 (선택 · 고급)
네이버는 Supabase 기본 제공 공급자가 **아닙니다.** 두 가지 방법이 있습니다.

**A. 간단(로컬만):** 네이버 JS SDK로 로그인해 닉네임만 받아 **로컬 프로필**로 쓰는 방식 — 기기 동기화는 안 됨. (원하시면 이 방식으로 연결해 드릴 수 있어요.)

**B. 완전(동기화까지):** Supabase **Edge Function**으로 네이버 토큰을 검증해 세션을 발급하는 커스텀 연동이 필요합니다. 개요:
1. 네이버 개발자센터에서 앱 등록 → `Client ID`/`Secret`, Callback URL 설정.
2. `supabase functions new naver-auth` 로 엣지 함수 생성 →
   - 프런트에서 받은 네이버 access token을 네이버 `/v1/nid/me` 로 검증,
   - `supabase.auth.admin.createUser`(또는 기존 유저 조회) 후 커스텀 세션/JWT 발급.
3. `assets/js/config.js` 의 `naverClientId` 입력 + `naverEnabled: true`,
4. `assets/js/cloud.js` 의 `loginNaver()` 를 이 엣지 함수 호출로 연결.

B는 프로젝트별 구현 편차가 커서, 필요하시면 회원님 Supabase 프로젝트 기준으로 함께 붙여 드리겠습니다.

---

## 자주 묻는 것
- **anon 키가 노출돼도 되나요?** 네. 공개용 키이며, 데이터 보호는 RLS가 합니다. 비밀 키만 조심하세요.
- **비용?** 개인 사용 규모는 Supabase 무료 티어로 충분합니다.
- **설정 안 하면?** 앱은 로컬 프로필 + 백업 내보내기/가져오기로 그대로 동작합니다.
- **로그인해도 기기 동기화가 안 돼요:** 3)의 Redirect URL, 4)의 카카오 Redirect URI(Supabase 콜백), 2)의 RLS 정책을 다시 확인하세요.


---

# 코인(소액결제)으로 수익 내기 — 설정 가이드

점신·포스텔러식 모델이에요. **해석 1회 = 코인 1개(기본 ₩500)**.
사용자는 코인을 **충전**해 두고 쓰거나, **매일 출석 체크로 무료 코인**을 받습니다.

이 앱은 **서버가 없는 정적 사이트**라, 충전 결제는 **외부 결제사의 안전한(PCI) 페이지**에서
처리하고, 결제 후 발급된 **키**를 입력하면 코인이 충전됩니다. (카드번호는 이 앱이 절대 받지 않아요.)

> 왜 건당 ₩500 직접결제가 아니라 코인 충전일까요?
> 건당 ₩500 카드결제는 수수료(₩15~30)보다 **사업자등록 + PG 가맹계약 + 결제 승인 서버**가 필요해서
> 정적 사이트만으론 불가능해요. 충전제는 서버 없이 바로 시작할 수 있고, 결제 횟수가 줄어 고정비도 아껴요.
> (나중에 사업자·PG·서버리스 함수를 갖추면 ‘건당 ₩500 직접결제’도 추가할 수 있어요 — 아래 참고.)

---

## 지금 바로 시작 — Lemon Squeezy (추천) 또는 Gumroad

두 곳 다 카드·페이팔을 받고, **라이선스 키를 자동 발급**하며 브라우저에서 키를 검증할 수 있어
서버가 필요 없습니다.

1. 계정 생성 후 Store 만들기 (수익금 받을 계좌·세금 정보 입력)
2. **충전 패키지마다 상품(Product)을 하나씩** 만든다. 예:
   - `코인 3개` — ₩1,500
   - `코인 11개` — ₩5,000 (인기)
   - `코인 24개` — ₩10,000 (이득)
3. 각 상품에서 **License keys** 발급을 켠다.
4. 각 상품의 **Checkout URL**과 **variant/product id**를 복사한다.
   - Lemon Squeezy: 라이선스 검증 응답의 `meta.variant_id`(또는 `product_id`)
   - Gumroad: 상품의 `product_id`(또는 permalink)
5. `assets/js/config.js`의 `payment`를 채운다:

```js
payment: {
  enabled: true,
  provider: "lemonsqueezy",          // 또는 "gumroad"
  manageUrl: "",                     // (선택) 영수증/문의 링크
  packages: [
    { coins: 3,  priceLabel: "₩1,500",  checkoutUrl: "https://…", variantId: "111111" },
    { coins: 11, priceLabel: "₩5,000",  checkoutUrl: "https://…", variantId: "222222", badge: "인기" },
    { coins: 24, priceLabel: "₩10,000", checkoutUrl: "https://…", variantId: "333333", badge: "이득" },
  ],
}
```

- Gumroad면 `variantId` 대신 `productId`를 넣습니다.
- 사용자는 결제 후 받은 키를 **충전소**에서 입력 → 해당 패키지만큼 코인이 충전됩니다.
  (같은 키로는 중복 충전이 안 되게 막아 두었습니다.)

---

## 코인 경제(밸런스) 튜닝

- 해석 1회 가격: `assets/js/wallet.js`의 `COIN_PRICE_KRW`(표시용) — 실제 코인 차감은 1개.
- 출석 보상: `wallet.js`의 `DAILY_REWARD`(기본 1), `STREAK_BONUS`(7일 연속 시 +3).
  무료를 너무 후하게 주면 결제가 줄어드니, 매일 1개 + 심화 해석은 여러 코인으로 조정하는 것도 방법이에요.
  (여러 코인을 받게 하려면 각 해석의 `unlock(itemId, cost)`에서 `cost`를 올리세요.)

---

## 나중에 — 건당 ₩500 직접결제(토스페이먼츠·카카오페이) 추가하기

국내 사용자에게 “딱 500원” 결제를 주려면 아래가 필요해요:

1. **사업자등록** + 토스페이먼츠/카카오페이 **가맹 계약**
2. **서버리스 함수**(Cloudflare Workers·Vercel·Supabase Edge Functions)로
   - 결제 요청 → 결제사 리다이렉트
   - 결제 승인(confirm) 검증
   - 검증되면 해당 해석 unlock 토큰 발급
3. 이 앱은 그 “해석별 결제 시작 URL”을 열고, 승인 콜백에서 `unlock(itemId)`를 호출

지금 구조(`wallet.unlock(itemId)` / `config.payment`)를 그대로 두고, 결제 성공 시 unlock만
호출하면 되도록 만들어 두었습니다.

---

## 정직한 한계 (꼭 읽어 주세요)

- **정적 사이트에서 코인 잔액은 브라우저(localStorage)에 있어 기술적으로 조작이 가능합니다.**
  라이선스 키 충전은 ‘실제 구매자에게만 키가 발급’되므로 단순 조작보다 안전하지만,
  잔액 자체를 늘리는 조작까지 막으려면 **서버리스 함수에서 잔액·차감을 관리**해야 합니다.
- 시작(MVP)은 이 방식으로 충분하고, 매출이 늘면 서버리스 검증을 추가하세요.

## 절대 하면 안 되는 것

- `config.js`에 **비밀 키(secret/API key)** 를 넣지 마세요. 이 파일은 브라우저에 공개됩니다.
  체크아웃 URL·공개 variant/product id만 넣습니다.
- 앱 안에서 카드번호를 직접 입력받는 폼을 만들지 마세요. 결제는 결제사 페이지에서만.
