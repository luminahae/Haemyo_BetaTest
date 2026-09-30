


/* ===== (합침) ziweiDeep.js ===== */
/* =========================================================
   자미두수 심화 해석 데이터 (30년 경력 명리학자 관점)
   각 주성: ①전통 ②현대 ③실제 사례 ④주의점 + 현대 직업 태그.
   격국·보조성·사화 효과 포함. 톤: 확정·공포 금지, 참고 자료.
   ========================================================= */

export const STAR_DEEP = {
  자미: {
    trad: "제왕성. 존귀·통솔·중심. 뭇별을 아우르는 리더의 별.",
    modern: "조직의 방향을 세우고 사람을 통솔하는 관리자·경영자형. 큰 그림 설계에 강합니다.",
    example: "대기업 임원·본부장, 공공기관 관리자, ‘판을 세우는’ 스타트업 대표. 실무보다 총괄·의사결정에서 빛납니다.",
    caution: "좌보·우필 같은 보좌성이 없으면 고독한 리더가 되고, 자존심·독단으로 흐르기 쉽습니다.",
    jobs: ["대기업 임원", "공공기관 관리", "스타트업 대표", "브랜드 총괄"],
  },
  천기: {
    trad: "지혜·참모·기변(機變)의 별. 책사(策士)의 지혜.",
    modern: "기획·전략·분석의 두뇌. 빠른 학습과 시스템적 사고로 구조를 설계합니다.",
    example: "IT 기획자·PM, AI·데이터 분석가, 전략 컨설턴트, 알고리즘 설계 개발자. 변화를 읽는 자리에 어울립니다.",
    caution: "생각이 많아 결정을 미루거나, 관심이 자주 바뀌어 마무리가 약할 수 있습니다.",
    jobs: ["기획/PM", "AI·데이터", "개발자", "컨설팅", "연구"],
  },
  태양: {
    trad: "광명·명예·귀(貴)의 별. 만인을 비추는 공적인 빛.",
    modern: "앞에 나서 이끌고 알리는 공적 영향력. 베풂과 헌신의 리더십.",
    example: "공무원·공기업, 교육자, 마케팅·홍보 총괄, 영업 리더, 대외 활동가. 이름을 내거는 일에 강합니다.",
    caution: "다 짊어지려다 과로·소진되고, 인정이 없으면 서운함이 큽니다. (남성 차트에서 특히 왕성)",
    jobs: ["공무원", "교육", "마케팅/홍보", "영업 총괄", "공공"],
  },
  무곡: {
    trad: "재성·장군의 별. 결단·실행·재물.",
    modern: "숫자와 성과 중심의 실행가. 재무 감각과 추진력이 강합니다.",
    example: "금융·재무·회계, 투자·트레이딩, 엔지니어, 군·경. 목표를 끝까지 밀어붙입니다.",
    caution: "융통성이 부족하고 감정 표현이 서툴러 관계에서 차갑게 비칠 수 있습니다.",
    jobs: ["금융/재무", "투자", "회계", "엔지니어", "군경"],
  },
  천동: {
    trad: "복성(福星). 향유·온화·조화.",
    modern: "사람을 편하게 만드는 서비스·조율형. 삶의 질과 정서를 중시합니다.",
    example: "서비스·CS·상담, HR, UX/사용자경험 기획, 복지. 안정적인 환경에서 힘을 냅니다.",
    caution: "편안함을 좇다 안주하고, 추진력이 약해 결정을 미룰 수 있습니다.",
    jobs: ["서비스/CS", "HR", "UX/기획", "복지/상담", "공무원"],
  },
  염정: {
    trad: "차성·수성(囚星). 절제된 열정·규율·개성.",
    modern: "몰입형 전문가. 원칙과 개성으로 한 분야를 깊게 팝니다.",
    example: "개발자·엔지니어, 디자인, 법무·감사, 예술·R&D. 집중이 필요한 전문 직군.",
    caution: "감정 기복과 집착이 크고, 옳고 그름을 강하게 따져 구설이 생길 수 있습니다.",
    jobs: ["개발/엔지니어", "디자인", "법률/감사", "R&D", "예술"],
  },
  천부: {
    trad: "재고(財庫)·고성. 저장·안정·관리.",
    modern: "자원과 리스크를 관리하며 꾸준히 쌓는 신뢰형 실무자.",
    example: "대기업 관리·재무, 자산운용, 운영·총무, 공공기관. 안정 조직에서 신뢰를 얻습니다.",
    caution: "안정을 지나치게 좇아 도전을 피하고 보수적으로 굳을 수 있습니다.",
    jobs: ["대기업 관리", "자산운용", "운영/총무", "금융", "공공"],
  },
  태음: {
    trad: "부성(富星). 섬세·내면·축적.",
    modern: "섬세한 기획·재무·돌봄과 미적 감각. 조용히 부를 쌓습니다.",
    example: "재무·투자, 디자인·콘텐츠, 연구, 상담·돌봄. 디테일이 필요한 자리.",
    caution: "예민함이 과하면 혼자 상처받고, 속마음을 삼켜 오해가 쌓입니다. (여성 차트에서 특히 왕성)",
    jobs: ["재무/투자", "디자인/콘텐츠", "연구", "상담", "회계"],
  },
  탐랑: {
    trad: "욕망·재예(才藝)의 별. 사교·다재다능.",
    modern: "네트워킹과 트렌드 감각으로 기회를 만드는 만능형.",
    example: "영업·마케팅, 스타트업, 엔터·미디어, 투자, 크리에이터. 사람과 기회를 끌어당깁니다.",
    caution: "욕심이 여러 갈래로 퍼져 집중이 흐려지고, 즉흥·과욕으로 무리할 수 있습니다.",
    jobs: ["영업/마케팅", "스타트업", "엔터/미디어", "투자", "크리에이터"],
  },
  거문: {
    trad: "암성(暗星)·구설의 별. 파고드는 언변과 분석.",
    modern: "말과 논리로 본질을 밝히는 전문성. 파고드는 힘.",
    example: "강사·교육, 법률, 언론·PD, 리서치, 마케팅 카피, 개발(디버깅). 말·글이 무기.",
    caution: "의심·따짐이 과하면 구설·오해를 부르고, 말이 날카로워 관계가 상합니다.",
    jobs: ["교육/강사", "법률", "언론", "리서치", "마케팅"],
  },
  천상: {
    trad: "인성(印星)·보좌의 별. 조율·신의·품위.",
    modern: "중재와 운영에 강한 핵심 실무·참모형.",
    example: "운영·PM, 법무·계약, 공공, HR, 비서·보좌. 곁에서 조직을 받칩니다.",
    caution: "남의 뜻에 맞추다 자기주장을 못 내고 우유부단해 보일 수 있습니다.",
    jobs: ["운영/PM", "법무", "공공", "HR", "비서/보좌"],
  },
  천량: {
    trad: "음성(蔭星)·수성. 원칙·보호·연장자의 지혜.",
    modern: "원칙 기반의 관리·감독·전문직. 위기관리에 강합니다.",
    example: "공무원·감사, 의료·연구, 교육, 법·컴플라이언스. 신뢰와 책임의 자리.",
    caution: "옳음을 앞세워 잔소리·간섭이 되고, 홀로 짐을 지다 지칠 수 있습니다.",
    jobs: ["공무원", "의료", "감사/컴플라이언스", "교육", "연구"],
  },
  칠살: {
    trad: "장군·숙살(肅殺)의 별. 개척·독립·승부.",
    modern: "강한 추진력으로 판을 개척하는 승부사. 위기 돌파형.",
    example: "창업·영업, 투자·트레이딩, 프로젝트 리더, 군경, 스포츠. 정면 돌파에 강합니다.",
    caution: "급하고 강경해 부딪히기 쉽고, 기복이 커 관계·건강을 소모할 수 있습니다.",
    jobs: ["스타트업", "영업", "투자", "프로젝트 리더", "군경"],
  },
  파군: {
    trad: "소모·개혁의 별. 파괴하고 다시 세움.",
    modern: "낡은 틀을 갈아엎는 혁신가·전환기 리더.",
    example: "창업·신사업, 혁신 조직, 개발(리팩터링·전환), 예술, 프리랜서. 변화의 최전선.",
    caution: "깨뜨린 뒤 수습이 약하면 소모가 크고, 기복·즉흥으로 안정이 흔들립니다.",
    jobs: ["창업/신사업", "혁신 조직", "개발", "예술", "프리랜서"],
  },
};

export const AUX_DEEP = {
  좌보: "귀인·조력. 좋은 상사·동료·파트너가 따르고 리더성이 강화됩니다.",
  우필: "귀인·조력. 실무를 받쳐 주는 인연이 따르고 추진에 힘이 붙습니다.",
  문창: "문성(文星). 학문·시험·문서·표현운. 연구·개발·자격에 유리합니다.",
  문곡: "문성(文星). 재능·구변·예술성. 기획·콘텐츠·시험에 유리합니다.",
  녹존: "재록(財祿)·안정. 꾸준한 수입과 재물 관리 능력. 보수적 재무.",
  경양: "살성(煞星). 예리함·경쟁·전문 기술. 과하면 마찰·조급·부상 주의.",
  타라: "살성(煞星). 끈기·지연·기술. 늦되지만 깊게 파고듦. 과하면 답답·꼬임.",
};

export const SIHUA_EFFECT = {
  "화록(祿)": "그 별의 영역에 복·기회·수입이 열립니다. 가장 잘 풀리는 축.",
  "화권(權)": "그 별의 영역에서 권한·주도·성과가 커집니다. 리더십이 붙는 축.",
  "화과(科)": "그 별의 영역에서 명예·평판·귀인·시험운이 따릅니다.",
  "화기(忌)": "그 별의 영역에 집착·장애·과제가 생깁니다. 나쁘다기보다 ‘가장 신경 쓰는·걸리는 축’.",
};

// 격국 분류: 각 주성이 속하는 계열
export const STAR_FAMILY = {
  칠살: "살파랑", 파군: "살파랑", 탐랑: "살파랑",
  천기: "기월동량", 태음: "기월동량", 천동: "기월동량", 천량: "기월동량",
  자미: "자부", 천부: "자부", 무곡: "자부", 염정: "자부", 천상: "자부",
  거문: "거일", 태양: "거일",
};

export const GEKGUK = {
  살파랑: {
    name: "살파랑(殺破狼) — 개척·변동의 격",
    trad: "칠살·파군·탐랑이 명운을 이끄는 격. 변동과 개척, 큰 기복 속의 성취.",
    modern: "안정된 틀보다 스스로 판을 만드는 사람. 변화·승부·성장에 강합니다.",
    jobs: ["스타트업·창업", "영업·투자", "프로젝트 리더", "신사업·혁신"],
    caution: "기복이 커서 ‘한 방’보다 리스크 관리가 성패를 가릅니다. 살성이 겹치면 변동이 과해집니다.",
  },
  기월동량: {
    name: "기월동량(機月同梁) — 안정·기획의 격",
    trad: "천기·태음·천동·천량 중심의 격. 참모·관리·서비스로 꾸준히 이루는 흐름.",
    modern: "조직 안에서 기획·관리·연구로 신뢰를 쌓는 사람. 안정 직군에 잘 맞습니다.",
    jobs: ["공무원·공공", "대기업 관리·기획", "연구·전문직", "회계·사무"],
    caution: "추진력·모험심이 약할 수 있어, 결정적 순간의 결단을 훈련해야 합니다.",
  },
  자부: {
    name: "자부염무상(紫府廉武相) — 관리·리더의 격",
    trad: "자미·천부·무곡·염정·천상 중심. 조직·재무·통솔의 격.",
    modern: "조직을 관리하고 자원을 운용하는 리더·전문 경영형.",
    jobs: ["대기업 임원·관리", "금융·자산운용", "공공기관", "전문 경영"],
    caution: "권위·안정에 기대면 변화에 둔해질 수 있습니다. 보좌성이 있어야 힘이 완성됩니다.",
  },
  거일: {
    name: "거일(巨日) — 언변·전문의 격",
    trad: "거문·태양 중심. 말·명분·해외·전문성으로 이름을 내는 격.",
    modern: "가르치고 알리고 파고드는 전문가·커뮤니케이터.",
    jobs: ["교육·강사", "법률", "언론·미디어", "해외·컨설팅"],
    caution: "구설·과로에 취약합니다. 말의 무게와 체력 관리가 중요합니다.",
  },
};

/* ===== (원래) ===== */
/* =========================================================
   자미두수 전문 심화 분석 (8단계).
   명반(computeZiwei 결과)을 받아 삼방사정·대궁·격국·사화·길흉 조합·
   현대 직업·최종 요약을 산출한다.
   ========================================================= */


const MAIN = new Set(Object.keys(STAR_DEEP));
const AUX_LUCKY = ["좌보", "우필", "문창", "문곡", "녹존"];
const AUX_SHA = ["경양", "타라"];

const byName = (z, name) => z.palaces.find((p) => p.name === name);
const mainOf = (p) => (p ? p.stars.filter((s) => MAIN.has(s.name)) : []);
const auxOf = (p) => (p ? p.stars.filter((s) => !MAIN.has(s.name)) : []);
const names = (arr) => arr.map((s) => s.name);

export function analyzeZiweiDeep(z) {
  const ming = byName(z, "명궁");
  const spouse = byName(z, "부처궁");
  const wealth = byName(z, "재백궁");
  const career = byName(z, "관록궁");
  const travel = byName(z, "천이궁");

  const mingMain = mainOf(ming);
  // 공궁이면 대궁(천이) 차성
  const useMing = mingMain.length ? mingMain : mainOf(travel);
  const empty = mingMain.length === 0;

  // 삼방사정 = 명궁 + 재백 + 관록 + 천이(대궁)
  const trine = [ming, wealth, career, travel];
  const trineStars = [];
  trine.forEach((p) => mainOf(p).forEach((s) => trineStars.push(s.name)));

  // 격국: 삼방(명+재백+관록) 주성 계열 최다
  const famCount = {};
  [ming, wealth, career].forEach((p) => mainOf(p).forEach((s) => {
    const f = STAR_FAMILY[s.name]; if (f) famCount[f] = (famCount[f] || 0) + 1;
  }));
  let gekKey = Object.entries(famCount).sort((a, b) => b[1] - a[1])[0];
  gekKey = gekKey ? gekKey[0] : "자부";
  const gekguk = GEKGUK[gekKey];

  // 사화 위치
  const sihuaHits = z.sihua.map((sh) => {
    const pal = z.palaces.find((p) => p.stars.some((s) => s.name === sh.star));
    return { label: sh.label, star: sh.star, palace: pal ? pal.name : "명반 밖", effect: SIHUA_EFFECT[sh.label] };
  });

  // 대궁(천이) 충돌
  const travelAux = names(auxOf(travel));
  const travelHasSha = travelAux.some((n) => AUX_SHA.includes(n));
  const travelHasKi = (travel ? travel.stars : []).some((s) => s.sihua === "화기(忌)");
  const travelLucky = travelAux.filter((n) => AUX_LUCKY.includes(n));

  // 길흉 조합
  const good = [];
  const bad = [];
  const trineAux = [];
  trine.forEach((p) => auxOf(p).forEach((s) => trineAux.push(s.name)));
  if (trineAux.includes("좌보") && trineAux.includes("우필")) good.push("좌보·우필이 삼방을 도와 ‘군신경회(君臣慶會)’의 결 — 사람 복과 조력이 따릅니다.");
  if (trineAux.includes("문창") && trineAux.includes("문곡")) good.push("문창·문곡이 함께 비쳐 학문·시험·전문성이 강화됩니다(연구·개발·자격에 유리).");
  if (trineAux.includes("녹존")) good.push("녹존이 삼방에 들어 재물의 기초가 안정적입니다.");
  const mingHua = (ming ? ming.stars : []).filter((s) => s.sihua && s.sihua !== "화기(忌)");
  if (mingHua.length) good.push(`명궁의 ${mingHua.map((s) => s.name + " " + s.sihua).join(", ")} — 타고난 강점 축이 뚜렷합니다.`);

  const mingSha = names(auxOf(ming)).filter((n) => AUX_SHA.includes(n));
  if (mingSha.length) bad.push(`명궁에 ${mingSha.join("·")}(살성)이 있어 조급함·마찰·기복이 커질 수 있습니다(전문 기술로 승화 가능).`);
  const mingKi = (ming ? ming.stars : []).find((s) => s.sihua === "화기(忌)");
  if (mingKi) bad.push(`명궁의 ${mingKi.name} 화기 — 그 영역에 집착·과제가 생기니 균형이 필요합니다.`);
  if (travelHasKi) bad.push("대궁(천이)에 화기가 있어, 밖에서의 견제·환경 변화가 잦을 수 있습니다.");
  if (empty) bad.push("명궁이 공궁이라 환경·관계의 영향을 크게 받습니다(대궁 차성으로 성향을 봄).");
  if (!good.length) good.push("두드러진 길성 조합은 약하지만, 그만큼 노력한 만큼 결과가 정직하게 쌓이는 구조입니다.");
  if (!bad.length) bad.push("큰 살성 충돌이 적어 비교적 안정적인 구조입니다(자극이 적어 추진력은 스스로 만들어야 함).");

  // 현대 직업 종합
  const jobSet = [];
  useMing.forEach((s) => (STAR_DEEP[s.name]?.jobs || []).forEach((j) => { if (!jobSet.includes(j)) jobSet.push(j); }));
  (gekguk.jobs || []).forEach((j) => { if (!jobSet.includes(j)) jobSet.push(j); });

  // 최종 요약
  const summary = {
    성격: describe(useMing, "modern", empty ? "명궁이 비어 주변 환경에 따라 색이 달라지되, 대궁의 " : ""),
    연애: loveMarryField(spouse, "love"),
    결혼: loveMarryField(spouse, "marry"),
    직업: `${gekguk.name.split(" — ")[0]} 격 + 관록궁 ${starList(career)}. ${describe(mainOf(career), "modern", "")}`,
    재물: `재백궁 ${starList(wealth)}. ${trineAux.includes("녹존") ? "녹존이 있어 안정적 축적에 유리합니다." : "수입은 실력·성과에 비례하는 편, 관리 습관이 관건입니다."}`,
    성공: good.length >= bad.length
      ? "길성이 살성보다 우세해, 방향만 맞으면 성취가 쌓이기 좋은 구조입니다."
      : "자극·변동이 있는 구조라, 리스크 관리와 꾸준함을 더하면 성공 가능성이 크게 올라갑니다.",
    조언: `${useMing[0] ? STAR_DEEP[useMing[0].name].caution + " " : ""}${gekguk.caution}`,
  };

  return {
    empty, useMing, mingMain, ming, spouse, wealth, career, travel,
    trineStars, gekguk, gekKey, sihuaHits,
    daegung: { stars: names(mainOf(travel)), lucky: travelLucky, hasSha: travelHasSha, hasKi: travelHasKi },
    good, bad, jobs: jobSet.slice(0, 8), summary,
  };
}

function starList(p) {
  const m = names(mainOf(p));
  return m.length ? m.join("·") : "공궁";
}
function describe(stars, field, prefix) {
  if (!stars.length) return prefix + "성향이 뚜렷하지 않아 유연합니다.";
  return prefix + stars.map((s) => STAR_DEEP[s.name] ? STAR_DEEP[s.name][field] : "").filter(Boolean).join(" ");
}
function relField(p, label, palaceName) {
  const m = mainOf(p);
  if (!m.length) return `${palaceName}이 공궁이라 상대·상황에 따라 유동적입니다. 상대의 성향이 관계 색을 크게 좌우합니다.`;
  return `${palaceName}에 ${names(m).join("·")}. ${m.map((s) => STAR_DEEP[s.name]?.modern).filter(Boolean)[0] || ""}`;
}

/* 부처궁 주성별 연애/결혼 결 — 연애와 결혼을 다르게 서술 */
const LOVE_MARRY = {
  자미: { love: "품격 있고 주도하는 연애. 존중받고 싶어 하며 아무나 만나지 않아요.", marry: "듬직하고 자기 세계가 뚜렷한 배우자. 가정의 중심을 세우려는 편이에요." },
  천기: { love: "머리로 하는 연애 — 대화가 통하고 센스가 맞아야 끌려요.", marry: "지혜롭고 임기응변이 좋은 배우자. 변화·이동이 잦은 결혼 생활." },
  태양: { love: "밝고 먼저 베푸는 헌신형 연애. 티 나게 챙겨 줘요.", marry: "활동적이고 사회적인 배우자. 밖으로 향하는 에너지가 커요." },
  무곡: { love: "표현은 서툴러도 행동으로 보여주는 진국형 연애.", marry: "현실적이고 책임에 충실한 배우자. 재무 감각이 뚜렷해요." },
  천동: { love: "다정하고 편안한 연애. 정서적 교감을 가장 중요하게 여겨요.", marry: "온화한 배우자와 소소한 행복 위주의 가정." },
  염정: { love: "밀당과 매력이 강한 연애. 끌림이 크지만 감정 기복도 있어요.", marry: "개성 강한 배우자. 열정과 갈등이 함께하는 결혼." },
  천부: { love: "안정을 보는 신중한 연애. 조건과 미래도 함께 살펴요.", marry: "살림 잘하고 안정적인 배우자. 풍요를 지향하는 가정." },
  태음: { love: "섬세하고 로맨틱한 연애. 분위기와 감성을 중시해요.", marry: "자상하고 가정적인 배우자. 정서적 안정이 큰 결혼." },
  탐랑: { love: "매력·인기가 많고 다채로운 연애. 새로운 자극을 즐겨요.", marry: "사교적이고 다재다능한 배우자. 지루하지 않은 결혼 생활." },
  거문: { love: "대화로 깊어지는 연애. 다만 오해·말다툼도 잦을 수 있어요.", marry: "논리적이고 할 말은 하는 배우자. 소통 방식이 관건." },
  천상: { love: "배려 깊고 매너 좋은 연애. 상대를 편하게 해 줘요.", marry: "조화롭고 신의 있는 배우자. 안정적인 결혼 생활." },
  천량: { love: "보호본능을 자극하는 연애. 연상·든든한 상대에게 끌려요.", marry: "어른스럽고 문제를 해결해 주는 배우자." },
  칠살: { love: "강렬하고 직진하는 연애. 빠르게 타오르는 편이에요.", marry: "독립적이고 카리스마 있는 배우자. 부침이 있는 결혼." },
  파군: { love: "변화 많고 개척적인 연애. 예측하기 어려운 매력.", marry: "개성 강한 배우자. 결혼 생활에 변동·리모델링이 잦아요." },
};
function loveMarryField(p, mode) {
  const m = mainOf(p);
  if (!m.length) return mode === "love"
    ? "부처궁이 공궁이라 정해진 연애 스타일보다 그때그때 상대에 따라 달라져요. 상대의 색에 잘 물드는 편이에요."
    : "부처궁이 공궁이라 배우자상이 고정적이지 않아요. 대궁(관록)의 기운과 상대의 성향이 결혼 색을 크게 좌우합니다.";
  const line = m.map((s) => LOVE_MARRY[s.name] && LOVE_MARRY[s.name][mode]).filter(Boolean)[0];
  return `부처궁에 ${names(m).join("·")}. ${line || (STAR_DEEP[m[0].name]?.modern || "")}`;
}
