# 해묘 解猫 (사주·타로·운세)

> 묘묘사주타로 + 사주·타로 자기분석 리포트를 하나로 합친 앱입니다. 작성: HAE


좋은 말만 들려주는 운세가 아니라, **성격·인간관계·연애·결혼·직업·금전 습관을 현실적으로 돌아보는 자기이해형 웹 앱**입니다. 다음 기능을 제공합니다.

- **사주 행동 패턴 리포트** — 천문 계산 기반의 **실제 만세력**(사주팔자 명식 + 오행 분포 + 대운)
- **타로 리딩** — 78장 덱(메이저 22장 고양이 카드 + 마이너 56장), 배열법 23가지
- **남자가 집착하는 사주** — 일간·매력 신살로 보는 끌림 타입 (#/pull)
- **자미두수 명반** — 12궁에 14주성을 배치한 명반 + 명궁 해석
- **궁합** — 두 사람의 사주로 보는 성향 조화도 + 합·충(일지 육합/삼합/충/형/해) + 재회 흐름
- **대운·세운 흐름**과 **연애 타이밍**(사귄 날·헤어진 날로 만남/이별 분석, 재회 월단위)
- **로그인·저장** — 로컬 프로필(PIN) + 백업 내보내기/가져오기. (선택) 카카오/네이버 + Supabase 클라우드 동기화 → [SETUP.md](SETUP.md)

- **정적 웹앱** — 빌드 도구·프레임워크·백엔드 없이 순수 HTML/CSS/JS(ES Modules)로 동작합니다.
- **개인정보 서버 미전송** — 생년월일·출생 시간은 브라우저 안에서만 계산에 사용되며, 결과 저장은 사용자가 직접 누를 때만 로컬 저장소에 보관됩니다.
- **모바일 우선 / 반응형** — 360px 폭부터 정상 동작하며 태블릿·데스크톱으로 자연스럽게 확장됩니다.
- **해시 라우팅** — GitHub Pages에서 새로고침해도 404가 나지 않습니다.

> ⚠️ 이 서비스의 사주·타로 해석은 자기이해와 오락을 위한 **참고 콘텐츠**입니다. 미래를 확정하지 않으며, 의료·법률·금융·심리 상담을 대신하지 않습니다.

---

## 1. 로컬에서 실행하기

ES Modules와 `fetch`(JSON 로딩)를 사용하므로 `file://` 직접 열기로는 동작하지 않습니다. **간단한 정적 서버**로 실행하세요. 설치할 의존성은 없습니다.

아무 방법이나 하나를 쓰면 됩니다:

```bash
# Python 3 (별도 설치 불필요한 경우가 많음)
python -m http.server 5173
```

```bash
# Node.js가 있다면 (전역 설치 없이 1회 실행)
npx serve .
```

```bash
# PHP가 있다면
php -S localhost:5173
```

그다음 브라우저에서 `http://localhost:5173/` 접속.

> VS Code를 쓴다면 **Live Server** 확장으로 `index.html`을 열어도 됩니다.

## 2. 빌드

**빌드 단계가 없습니다.** 트랜스파일·번들링 없이 소스 그대로 배포됩니다. `npm install`도 필요 없습니다.

## 3. GitHub Pages 배포

1. 이 폴더(`saju-tarot-report`)의 내용을 저장소 루트로 푸시합니다.
   ```bash
   git init
   git add .
   git commit -m "init: saju-tarot-report"
   git branch -M main
   git remote add origin https://github.com/<사용자>/<저장소>.git
   git push -u origin main
   ```
2. GitHub 저장소 → **Settings → Pages** → *Build and deployment* → Source를 **Deploy from a branch**로, 브랜치를 **main / (root)** 으로 설정합니다.
3. 잠시 후 `https://<사용자>.github.io/<저장소>/` 에서 열립니다.

포함된 파일:
- `.nojekyll` — Jekyll 처리를 끄고 `assets/` 등을 그대로 제공합니다.
- `404.html` — 사용자가 실제 경로를 직접 입력해 404가 나더라도 앱 루트(`#/`)로 되돌립니다. (평상시엔 해시 라우팅이라 새로고침 404가 없습니다.)

프로젝트 페이지(`/<저장소>/`)든 사용자 페이지(`<사용자>.github.io`)든 base 경로를 자동 계산하므로 별도 설정이 필요 없습니다.

## 4. 데이터 수정 방법

콘텐츠(카드·해석·문구)는 화면 코드와 분리되어 있어 쉽게 추가·수정할 수 있습니다.

| 파일 | 내용 |
| --- | --- |
| `assets/haemyo-data.json` → `cards` | 타로 카드 22장. 카드별 핵심 상징·키워드·정방향/역방향 해석·성찰 질문. `art` 값은 카드 그림(SVG) 장면 id입니다. |
| `assets/haemyo-data.json` → `questions` | 질문 분야(연애·금전 등)와 배열(원/쓰리/관계) 정의, 분야별 해석 관점(lens). |
| `assets/haemyo-data.json` → `sections` | 사주 결과 리포트의 **섹션 정의**와 집중 분야·오행 메타. |
| `assets/haemyo-data.json` → `disclaimer` | 면책·개인정보·데모 안내 문구. |
| `assets/js/saju/traits.js` | 오행별 성향 해석 문구(성격/관계/연애/재물/직업 등). 사주 리포트 본문 콘텐츠. |
| `assets/js/saju/ziwei.js` (뒷부분) | 자미두수 14주성 해석·12궁 의미. |
| `assets/js/saju/compat.js` | 궁합 관계 유형별(상생/상극/비화) 해석 문구. |

### 타로 카드 그림 교체
카드 앞면은 이미지 파일을 씁니다: `assets/img/card-major-0.png ~ major-21.png` (파일명 번호 = 카드 번호 0~21). **덱을 통째로 바꾸려면 이 폴더의 22개 이미지만 갈아끼우면 됩니다(코드 수정 불필요).** 세로 카드(약 2:3) 권장, 최소 500×860px. 현재 덱은 귀여운 고양이 일러스트입니다.
- 카드 뒷면은 SVG(`assets/js/tarot/cardArt.js`의 `cardBackSVG`)로 그려집니다.

### 타로 해석 문구 수정
`tarot-cards.json`의 `cards` 배열에서 문구를 고치면 즉시 반영됩니다.

### 사주 해석 문구 수정
`assets/js/saju/traits.js`에서 오행(`wood/fire/earth/metal/water`)별 문구를 수정합니다. 섹션 구성/순서는 `report.js`가 조립합니다.

## 5. 만세력·자미두수 계산 방식 (실제 천문 계산)

오행 분포와 명식은 **천문 계산 기반의 실제 만세력**입니다. 큰 변환표를 옮겨 쓰지 않고 태양·달의 위치를 직접 계산합니다.

- `assets/js/saju/astro.js` — 태양/달 겉보기 황경(Meeus 저정밀), 절기(태양 황경 15° 배수 크로싱), 삭(달-태양 이각 0), 율리우스적일(JDN).
- `assets/js/saju/astro.js`(뒷부분, 음력) — 음↔양 변환. 삭과 中氣(태양 황경 30° 배수)로 월을 구성하고, 중기 없는 달을 윤달로(无中氣置閏). 한국표준시(KST) 자정 기준.
- `assets/js/saju/manse.js` — 사주팔자. **년주**=입춘(315°) 경계, **월주**=태양 황경 절기월 + 오호둔, **일주**=`(JDN+49)%60`(2000-01-01=戊午로 검증), **시주**=진태양시(경도·균시차 보정) + 오서둔. 오행 분포·대운 포함.
- `assets/js/saju/ziwei.js` — 자미두수. 명궁/신궁 → 오행국(명궁 납음) → 자미성 안성 → 14주성/보조성/사화(中州派).

**검증 결과**: 일주(2000-01-01=戊午 등), 절기(입춘·춘분·하지·동지), 설날 7/7, 윤달 11/12(2033년만 예외 — 알려진 계산 논쟁), 자미성 안성(예제 22일·목3국→亥) 모두 일치.

**근사 처리(문서화)**: ΔT는 수십 초 수준이라 날짜 판정에서 무시. 진태양시는 시간대 대표 경도로 근사. 자미두수 윤달생은 해당 월 번호로 처리. 2033년 음력은 알려진 경계 논쟁으로 윤달이 다를 수 있음.

인터페이스 정의: `assets/js/saju/types.d.ts`. (구버전 데모 `calc.js`는 미사용으로 남겨둠.)

## 6. 폴더 구조 (GitHub 웹 업로드 100개 제한에 맞춰 파일·폴더 수를 줄인 구조)

```
해묘/
├─ index.html            # 진입점 (style.css 링크 + 앱 모듈 로드)
├─ 404.html              # GitHub Pages 안전장치(해시 라우팅 보조)
├─ .nojekyll             # GitHub Pages가 파일을 그대로 쓰게
├─ README.md · SETUP.md · 변경사항.txt
└─ assets/
   ├─ style.css          # 모든 스타일 (변수·기본·컴포넌트·카드·리포트를 한 파일로)
   ├─ haemyo-data.json   # 타로 카드·질문/배열·사주 섹션·면책 문구 (한 파일)
   ├─ img/               # haemyo.webp(마스코트) · card-*.webp(타로 카드) · face-*.webp(초상화)
   └─ js/
      ├─ app.js          # 셸 + 라우터 + 라우트 등록
      ├─ state.js        # 저장(내 정보·사람·결과·후기)
      ├─ wallet.js       # 코인·쿠폰·코드
      ├─ utils/          # dom(요소·아이콘·검증) · shareImage(PDF/이미지) · faceapi(관상)
      ├─ saju/           # 만세력·사주·자미두수·토정비결 계산
      ├─ tarot/          # 카드 덱·그림·해석·물어보기
      └─ pages/          # 화면들
```

**업로드 방법:** 버전 폴더(예: 2026-10-01_v10)를 열고 안의 파일·폴더를 전부 선택해 GitHub 저장소에 한 번에 끌어다 놓으면 됩니다. 저장소 Settings → Pages에서 브랜치를 main / (root)로 두면 `https://아이디.github.io/저장소이름/` 에서 바로 열려요. 모든 경로가 상대 경로라 어느 주소에서도 동작합니다.

## 7. 접근성 · 반응형 체크리스트

- 모든 입력 필드에 `label` 연결, 오류 메시지는 필드 근처에 표시
- 카드 선택은 **키보드(Tab/Enter/Space)와 터치** 모두 지원, 선택 상태는 색상 외 텍스트로도 안내
- `prefers-reduced-motion` 존중(애니메이션 최소화)
- 최소 44px 터치 영역, 본문 16px 이상
- 360px 폭부터 레이아웃 유지, 결과 카드는 모바일 1열·데스크톱 2열

## 8. 첫 버전에서 제외한 것

결제, 소셜 로그인, 커뮤니티, 채팅 상담, 푸시 알림은 구현하지 않았습니다. 핵심 기능은 로그인 없이 이용할 수 있습니다.


---

## 부록: 초상화 사진 만들기 안내

```
해묘 초상화 실사 이미지 만들기

이미지 AI(예: ChatGPT 이미지 생성)로 사진을 만들어 채팅에 올려 주면,
성별마다 이미지 시트 한 장(female.webp / male.webp, 5열 × 3행)으로 묶어서 넣어요.
(파일 수를 100개 미만으로 유지하려고 사진 30장을 2장으로 합침)
- 형식: .webp 권장 (png/jpg면 webp로 바꾸거나, 말해 주면 변환해 줌)
- 비율: 세로 3:4, 가로 600px 정도면 충분
- 없는 파일은 자동으로 일러스트로 대신 보여 줌 → 전부 한 번에 안 만들어도 됨
- 최소한 '-1' 파일(10장)만 있어도 세 초상 모두 사진으로 나옴
- 주의: 연예인·실제 인물 사진은 초상권 문제가 있어서 쓰면 안 돼요. 꼭 AI로 새로 만든 가상 인물로!

==================== 한 번에 격자로 만들기 (추천) ====================
격자(콜라주) 한 장으로 만들어서 보내 주면, 제가 잘라서 파일 이름 붙여 넣어 드려요.
칸 아래에 '목 · 연애할 사람' 같은 라벨이 있으면 어느 칸인지 알 수 있어서 좋아요.
★ 칸마다 '서로 다른 사람'이 나오게 해 달라고 꼭 적기 (안 그러면 같은 얼굴이 반복돼요)

[남성 15칸 — 5열 × 3행]
Create a 5-column by 3-row grid of photorealistic upper-body portrait photos of 15 DIFFERENT fictional Korean men in their late 20s. Every cell must be a clearly different person with a different face shape, eyes, nose, hairstyle and hair color.
Columns (left to right): Wood = tall and slender, soft gentle eyes, fresh; Fire = vivid features, sparkling eyes, charming bright smile; Earth = round soft face, warm friendly eyes, sturdy build; Metal = sharp jawline, high nose bridge, neat and chic; Water = deep calm eyes, clear fair skin, mysterious and intelligent.
Rows (top to bottom): Row 1 "연애할 사람" = warm smile, casual date outfit, cozy cafe; Row 2 "결혼할 배우자" = calm trustworthy smile, neat shirt or knit, bright bookstore; Row 3 "만나면 안 될 사람" = cool aloof confident look, dark stylish outfit, night city bokeh.
Add a small Korean label at the bottom of each cell like "목 · 연애할 사람". Natural light, 85mm, shallow depth of field. All fictional people, not resembling any celebrity.

[여성 수(水) 3칸 — 1열 × 3행]
Create a 1-column by 3-row grid of photorealistic upper-body portrait photos of 3 DIFFERENT fictional Korean women in their late 20s with deep calm eyes, clear fair skin, mysterious and intelligent vibe. Row 1 "수 · 연애할 사람" = warm smile, casual date outfit, cozy cafe; Row 2 "수 · 결혼할 배우자" = calm soft smile, neat blouse or knit, bright bookstore; Row 3 "수 · 만나면 안 될 사람" = cool aloof look, dark outfit, night city bokeh. Small Korean label at the bottom of each cell. All fictional, not resembling any celebrity.

==================== 여성 ====================
[female-wood-1.webp] 여성 · 목(木) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, tall and slender, straight posture, clear open forehead, soft gentle eyes, kind, growth-minded, fresh vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing soft green or beige tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-wood-2.webp] 여성 · 목(木) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, tall and slender, straight posture, clear open forehead, soft gentle eyes, kind, growth-minded, fresh vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing soft green or beige tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-wood-3.webp] 여성 · 목(木) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, tall and slender, straight posture, clear open forehead, soft gentle eyes, kind, growth-minded, fresh vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing soft green or beige tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-fire-1.webp] 여성 · 화(火) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, vivid well-defined features, bright sparkling eyes, charming smile, bright, expressive, radiant vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing coral, warm red or white tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-fire-2.webp] 여성 · 화(火) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, vivid well-defined features, bright sparkling eyes, charming smile, bright, expressive, radiant vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing coral, warm red or white tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-fire-3.webp] 여성 · 화(火) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, vivid well-defined features, bright sparkling eyes, charming smile, bright, expressive, radiant vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing coral, warm red or white tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-earth-1.webp] 여성 · 토(土) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, round soft face, warm friendly eyes, sturdy reassuring build, trustworthy, warm, comforting vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing camel, cream or brown tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-earth-2.webp] 여성 · 토(土) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, round soft face, warm friendly eyes, sturdy reassuring build, trustworthy, warm, comforting vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing camel, cream or brown tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-earth-3.webp] 여성 · 토(土) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, round soft face, warm friendly eyes, sturdy reassuring build, trustworthy, warm, comforting vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing camel, cream or brown tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-metal-1.webp] 여성 · 금(金) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, sharp clean jawline, high straight nose bridge, neat well-groomed look, polished, disciplined, chic vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing white, gray or navy tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-metal-2.webp] 여성 · 금(金) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, sharp clean jawline, high straight nose bridge, neat well-groomed look, polished, disciplined, chic vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing white, gray or navy tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-metal-3.webp] 여성 · 금(金) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, sharp clean jawline, high straight nose bridge, neat well-groomed look, polished, disciplined, chic vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing white, gray or navy tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-water-1.webp] 여성 · 수(水) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, deep calm eyes, clear fair skin, soft flowing silhouette, intelligent, mysterious, calm vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing navy, deep blue or black tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-water-2.webp] 여성 · 수(水) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, deep calm eyes, clear fair skin, soft flowing silhouette, intelligent, mysterious, calm vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing navy, deep blue or black tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[female-water-3.webp] 여성 · 수(水) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean woman in her late 20s, deep calm eyes, clear fair skin, soft flowing silhouette, intelligent, mysterious, calm vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing navy, deep blue or black tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

==================== 남성 ====================
[male-wood-1.webp] 남성 · 목(木) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, tall and slender, straight posture, clear open forehead, soft gentle eyes, kind, growth-minded, fresh vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing soft green or beige tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-wood-2.webp] 남성 · 목(木) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, tall and slender, straight posture, clear open forehead, soft gentle eyes, kind, growth-minded, fresh vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing soft green or beige tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-wood-3.webp] 남성 · 목(木) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, tall and slender, straight posture, clear open forehead, soft gentle eyes, kind, growth-minded, fresh vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing soft green or beige tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-fire-1.webp] 남성 · 화(火) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, vivid well-defined features, bright sparkling eyes, charming smile, bright, expressive, radiant vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing coral, warm red or white tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-fire-2.webp] 남성 · 화(火) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, vivid well-defined features, bright sparkling eyes, charming smile, bright, expressive, radiant vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing coral, warm red or white tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-fire-3.webp] 남성 · 화(火) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, vivid well-defined features, bright sparkling eyes, charming smile, bright, expressive, radiant vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing coral, warm red or white tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-earth-1.webp] 남성 · 토(土) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, round soft face, warm friendly eyes, sturdy reassuring build, trustworthy, warm, comforting vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing camel, cream or brown tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-earth-2.webp] 남성 · 토(土) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, round soft face, warm friendly eyes, sturdy reassuring build, trustworthy, warm, comforting vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing camel, cream or brown tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-earth-3.webp] 남성 · 토(土) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, round soft face, warm friendly eyes, sturdy reassuring build, trustworthy, warm, comforting vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing camel, cream or brown tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-metal-1.webp] 남성 · 금(金) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, sharp clean jawline, high straight nose bridge, neat well-groomed look, polished, disciplined, chic vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing white, gray or navy tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-metal-2.webp] 남성 · 금(金) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, sharp clean jawline, high straight nose bridge, neat well-groomed look, polished, disciplined, chic vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing white, gray or navy tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-metal-3.webp] 남성 · 금(金) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, sharp clean jawline, high straight nose bridge, neat well-groomed look, polished, disciplined, chic vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing white, gray or navy tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-water-1.webp] 남성 · 수(水) · 연애할 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, deep calm eyes, clear fair skin, soft flowing silhouette, intelligent, mysterious, calm vibe, a gentle warm smile, casual date outfit, cozy cafe background with soft bokeh, wearing navy, deep blue or black tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-water-2.webp] 남성 · 수(水) · 결혼할 배우자
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, deep calm eyes, clear fair skin, soft flowing silhouette, intelligent, mysterious, calm vibe, a calm trustworthy soft smile, neat shirt or knit cardigan, bright home or bookstore background, wearing navy, deep blue or black tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

[male-water-3.webp] 남성 · 수(水) · 만나면 안 될 사람
Photorealistic upper-body portrait photo of a fictional Korean man in his late 20s, deep calm eyes, clear fair skin, soft flowing silhouette, intelligent, mysterious, calm vibe, a cool, slightly aloof confident expression, dark stylish outfit, moody evening city background, wearing navy, deep blue or black tones, natural soft lighting, shallow depth of field, shot on 85mm lens, looking at the camera, vertical 3:4. Must be an entirely fictional person, not resembling any celebrity or real person. No text, no watermark.

```
