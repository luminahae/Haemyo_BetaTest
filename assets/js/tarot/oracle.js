import { getCard } from "./cardArt.js";
/* =========================================================
   쓸데없는 고민 즉답 오라클 — 카드 한 장으로 예/아니오/글쎄.
   가벼운 재미용. 카드별 전통적 예스노 성향 + 역방향은 뒤집기.
   ========================================================= */


// 메이저 아르카나 번호 → 기본 판정 (전통 예스노 성향 참고)
const YESNO = {
  0: "maybe", 1: "yes", 2: "maybe", 3: "yes", 4: "yes", 5: "yes", 6: "yes",
  7: "yes", 8: "yes", 9: "maybe", 10: "yes", 11: "maybe", 12: "no", 13: "no",
  14: "maybe", 15: "no", 16: "no", 17: "yes", 18: "maybe", 19: "yes", 20: "maybe", 21: "yes",
};

const VERDICT = {
  yes: { label: "응, 좋아!", emoji: "🙆", key: "yes", tone: "기운이 긍정적이야. 해도 좋아." },
  no: { label: "음, 아니야", emoji: "🙅", key: "no", tone: "지금은 아껴 두는 게 나아." },
  maybe: { label: "글쎄…", emoji: "🤔", key: "maybe", tone: "아직 확실하지 않아. 조금 더 두고 봐." },
};

const PLAYFUL = {
  yes: [
    "고민할 시간에 그냥 해버려 😆",
    "오늘의 우주는 네 편이야 ✨",
    "안 하면 나중에 궁금해할걸?",
    "가볍게 고고! 🐾",
    "냥냥이도 끄덕이는 중 🐱",
  ],
  no: [
    "오늘은 참는 게 이득 🙈",
    "괜히 벌였다 후회 각… 다음에!",
    "우주가 잠깐 스톱 걸었어 🛑",
    "지금 말고, 이따 다시 물어봐",
    "냥냥이가 고개 젓는 중 🙅",
  ],
  maybe: [
    "동전 던져도 반반이야 🪙",
    "마음은 이미 답을 아는 거 아냐?",
    "정보를 조금만 더 모아봐 🔍",
    "급할 거 없어, 천천히 🐌",
    "냥냥이도 갸웃하는 중 🐱❓",
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- 질문 분석 — '왜?'에 '응 좋아!' 같은 엉뚱한 답이 나오지 않게 ---------- */
const TOPICS = [
  { key: "date", re: /데이트|신청|약속|만나자|보자고|애프터|고백/, word: "데이트" },
  { key: "contact", re: /연락|카톡|톡|답장|문자|디엠|dm|읽씹|안읽씹|전화/i, word: "연락" },
  { key: "reunion", re: /재회|다시 만|헤어|전남친|전여친|전애인|구남친|구여친|돌아올/, word: "재회" },
  { key: "love", re: /좋아하|마음|짝사랑|썸|고백|사귀|연애|사랑|호감|애인|남친|여친|남자친구|여자친구|이랑 잘|랑 잘 ?될|사이|이 남자|이 여자/, word: "마음" },
  { key: "money", re: /돈|월급|투자|주식|코인|재물|용돈|알바비|살까|사도/, word: "돈" },
  { key: "work", re: /회사|취업|이직|면접|합격|시험|공부|과제|성적|승진|일이|업무|알바/, word: "일" },
  { key: "friend", re: /친구|동기|선배|후배|팀플|사람들/, word: "관계" },
];
/* 그 사람 속사정 — 카드별로 '상대 입장에서 왜 그러는지' (정방향 / 역방향) */
const PARTNER = {
  0: ["아직 관계를 가볍고 자유롭게 즐기고 싶어 해요. 진지한 약속을 먼저 꺼내는 게 부담스러운 상태예요.", "마음은 있는데 ‘괜히 시작했다가 망치면 어떡하지’ 하는 두려움에 첫발을 못 떼고 있어요."],
  1: ["마음먹으면 바로 움직일 수 있는 사람이에요. 다만 ‘제대로 된 타이밍·계획’을 만들고 나서 말하려고 준비 중이에요.", "말로는 관심을 보이지만 실제 행동으로 옮길 자신감·계획이 부족해요. 어떻게 해야 할지 몰라 미루고 있어요."],
  2: ["속으로 당신을 관찰하며 마음을 재는 중이에요. 확신이 설 때까지 먼저 드러내지 않는 타입이에요.", "자기 감정을 스스로도 잘 몰라요. 헷갈리니까 먼저 움직이지 못하고 있어요."],
  3: ["당신을 편하고 따뜻하게 느껴요. 서두르지 않고 자연스럽게 가까워지길 기다리는 중이에요.", "지금은 자기 일·생활에 지쳐 여유가 없어요. 마음이 없어서가 아니라 챙길 에너지가 부족해요."],
  4: ["관계를 제대로, 책임감 있게 하고 싶어 해요. 확실한 계획이 서야 움직이는 사람이에요.", "주도권·자존심 문제로 먼저 숙이고 들어가기 싫어해요. ‘먼저 연락하면 지는 것’처럼 느끼고 있어요."],
  5: ["정석대로, 단계를 밟아 가려는 사람이에요. 조금 더 친해진 뒤에 공식적으로 말하려고 해요.", "주변 시선이나 ‘이래도 되나’ 하는 틀에 갇혀 망설이고 있어요."],
  6: ["당신에게 분명히 끌리고 있어요. 다만 ‘정말 이 사람이 맞나’ 마지막 선택을 고민하는 중이에요.", "다른 선택지나 상황 때문에 마음이 갈려 있어요. 한쪽으로 정하지 못해 행동을 미루고 있어요."],
  7: ["마음먹으면 밀고 나가는 사람이라, 지금은 다른 목표(일·공부)에 에너지를 쏟고 있어요.", "의욕은 있는데 방향을 못 잡고 제자리에서 맴돌아요. 바쁘고 정신없는 상태예요."],
  8: ["부드럽게 참고 기다리는 중이에요. 당신이 부담스러워할까 봐 조심하고 있어요.", "자신감이 떨어져 있어요. ‘내가 신청해도 될까’ 하는 불안에 용기를 못 내고 있어요."],
  9: ["혼자만의 시간이 필요한 시기예요. 관계보다 자기 정리가 먼저라 조용한 거예요.", "마음의 문을 닫고 혼자 틀어박혀 있어요. 당신 문제가 아니라 그 사람의 컨디션 문제일 가능성이 커요."],
  10: ["타이밍을 보고 있어요. 계기(행사·기념일·우연한 만남)가 생기면 자연스럽게 움직일 흐름이에요.", "일이 꼬이고 상황이 자꾸 어긋나서, 약속을 잡을 여유가 없는 시기예요."],
  11: ["공정하고 신중한 사람이라, 관계를 저울질하며 이성적으로 판단하는 중이에요.", "감정보다 손익·조건을 따지느라 결정을 미루고 있어요. 확신이 부족해요."],
  12: ["기다리는 게 맞다고 생각하고 일부러 한 발 물러나 있어요.", "어떻게 해야 할지 몰라 멈춰 있어요. 스스로도 답답해하는 상태예요."],
  13: ["지난 관계나 예전 방식을 정리하고 새로 시작하려는 과도기예요. 정리가 끝나야 움직일 수 있어요.", "변화가 두려워서 지금 상태(친구·썸)를 유지하려고 해요. 관계를 한 단계 바꾸는 걸 망설이는 중이에요."],
  14: ["천천히, 균형 있게 다가가려는 사람이에요. 서두르지 않고 속도를 맞추는 중이에요.", "감정과 현실 사이에서 균형을 못 잡고 있어요. 마음이 갔다 왔다 해요."],
  15: ["끌림은 강한데, 부담·집착이 될까 봐 스스로 조절하고 있어요.", "다른 데 마음이 묶여 있거나(일·습관·다른 사람), 가볍게만 보고 있을 수 있어요."],
  16: ["최근 큰 일(갑작스러운 변화·스트레스)이 있어서 연애에 신경 쓸 틈이 없어요.", "예상 못 한 상황이 터졌거나 마음이 흔들린 상태예요. 정리될 때까지 시간이 필요해요."],
  17: ["당신에게 희망과 호감을 품고 있어요. 좋은 타이밍을 기다리며 조심스럽게 다가오는 중이에요.", "지난 상처 때문에 기대하는 게 두려워요. 또 실망할까 봐 먼저 나서지 못해요."],
  18: ["마음이 불안하고 헷갈려요. 당신 마음을 확신하지 못해 떠보는 중일 수 있어요.", "숨기는 게 있거나 말 못 할 사정이 있어요. 상황이 분명해지면 드러날 거예요."],
  19: ["당신과 있는 게 즐겁고 편해요. 거절당할 걱정이 없으면 금방 움직일 사람이에요.", "좋아하긴 하는데 너무 편해서 ‘굳이 데이트까지?’ 하고 미루고 있어요."],
  20: ["관계를 다시 돌아보며 ‘진지하게 가 볼까’ 결심하는 중이에요.", "과거 일이나 실수를 곱씹느라 결단을 못 내리고 있어요."],
  21: ["지금 관계에 만족하고 있어요. 한 단계 나아갈 준비가 거의 다 된 상태예요.", "거의 다 왔는데 마지막 한 걸음을 못 떼고 있어요. 작은 계기만 있으면 돼요."],
};
const PARTNER_SUIT = {
  cups: ["감정적으로 당신에게 마음이 가 있어요. 다만 표현이 서툴러요.", "감정이 복잡하거나 서운함이 쌓여 있어요."],
  wands: ["관심과 의욕은 있는데 다른 일에도 에너지가 분산돼 있어요.", "조급하거나 지쳐서 에너지가 바닥이에요."],
  swords: ["머리로 이것저것 따지며 신중하게 판단하는 중이에요.", "생각이 너무 많아 불안하고, 결정을 못 내리고 있어요."],
  pentacles: ["현실적인 상황(시간·돈·일정)을 먼저 정리하려는 사람이에요.", "일·돈 같은 현실 문제에 묶여 여유가 없어요."],
};
function partnerView(card, reversed) {
  const r = reversed ? 1 : 0;
  if (!card.suit || card.suit === "major") return (PARTNER[card.number] || PARTNER[0])[r];
  return (PARTNER_SUIT[card.suit] || PARTNER_SUIT.cups)[r];
}

function detectTopic(q) { const t = TOPICS.find((x) => x.re.test(q)); return t || { key: "general", word: "고민" }; }

function detectType(q) {
  // 끝에 붙은 ㅜㅠㅋㅎ·이모티콘·물음표·말줄임 등을 떼고 본다
  const s = q.replace(/\s+/g, " ").trim().replace(/[\sㅜㅠㅋㅎ~!?.…,^;:*()\-_=+'"☀-➿\uD83C-􏰀-\uDFFF]+$/u, "");
  if (!s) return "none";
  if (/왜|어째서|이유가|무슨 이유|뭐 때문|왜케|왜이렇게/.test(s)) return "why";
  if (/언제|몇 월|몇월|시기|며칠/.test(s)) return "when";
  const other = /(남자|여자|걔|쟤|그 ?사람|그분|그 ?애|씨|님|오빠|언니|누나|형|선배|후배|남친|여친|썸남|썸녀|전남친|전여친|상대|이 ?사람)/.test(s);
  const aboutMe = /(나를|날|나랑|나한테|나와|내게|나에게|저를|저랑|저한테)/.test(s);
  if (/(속마음|의도|진심|어쩌고 ?싶|뭘 ?(하고|원하)|원하는|원할|싶어 ?하|싶어할|싶을|생각할까|생각해|무슨 생각|어떤 생각|마음이|좋아할까|좋아하는|관심 ?있|호감)/.test(s) && (other || aboutMe)) return "mind";
  if (/어떻게|어떡|어캐|어케|뭘 해야|뭐 해야|방법|해야 할까|해야 돼|해야돼|해야 하나/.test(s)) return "how";
  if (/(누구|누가|뭐|뭘|무엇|무슨|어떤|어디)/.test(s)) return other || aboutMe ? "mind" : "what";
  if (/(올까|올지|될까|될지|붙을까|붙을지|좋아할까|생길까|생길지|있을까|있을지|받아줄까|받을까|돌아올|잘 ?될|성공할|합격할|이길|오나|되나|하려나)/.test(s)) return "outcome";
  if (/(까|까요|나요|니|냐|을지|할지|맞아|맞나|인가|일까)$/.test(s) || /\?/.test(q)) return other ? "mind" : "yesno";
  return other || aboutMe ? "mind" : "what";
}

/* 에너지: 카드 판정(yes/no/maybe)을 '흐름'으로 */
const WHY = {
  contact: {
    yes: "마음이 식어서라기보다 그 사람 쪽 상황 때문일 가능성이 커요. 바쁘거나 여유가 없어서 답을 미루는 흐름이에요.",
    maybe: "그 사람도 어떻게 반응해야 할지 망설이는 중이에요. 무슨 말을 해야 할지 몰라 타이밍을 놓치고 있을 수 있어요.",
    no: "그 사람이 지금은 거리를 두고 싶거나, 자기 마음을 정리할 시간이 필요한 상태로 보여요.",
  },
  reunion: {
    yes: "아직 정리되지 않은 감정이 남아 있어서, 쉽게 다가오지도 떠나지도 못하는 흐름이에요.",
    maybe: "그 사람도 과거와 현재 사이에서 흔들리고 있어요. 먼저 움직이는 게 두려운 상태예요.",
    no: "그 사람은 지금 과거보다 자기 앞의 일에 마음이 가 있어요. 에너지가 다른 곳을 향해 있어요.",
  },
  love: {
    yes: "관심이 없어서가 아니라, 표현이 서툴거나 조심스러워서 그렇게 보이는 흐름이에요.",
    maybe: "그 사람 마음이 아직 정해지지 않았어요. 호감과 망설임이 같이 있어요.",
    no: "지금은 그 사람의 마음이 다른 데 쏠려 있거나, 관계에 에너지를 쓸 여유가 없어 보여요.",
  },
  date: {
    yes: "마음이 없어서가 아니라, 확신이 설 타이밍을 재고 있는 거예요.",
    maybe: "호감은 있지만 거절당할까 봐, 혹은 부담 줄까 봐 망설이는 중이에요.",
    no: "지금은 그 사람 쪽 사정(여유·상황)이 연애를 밀어낼 만큼 벅찬 상태예요.",
  },
  general: {
    yes: "막혀 보이지만 흐름 자체는 나쁘지 않아요. 타이밍이 조금 어긋나 있을 뿐이에요.",
    maybe: "아직 조건이 다 갖춰지지 않았어요. 정보나 준비가 조금 부족한 상태예요.",
    no: "지금 방식이 상황과 맞지 않아서 그래요. 방향을 한 번 점검해야 할 때예요.",
  },
};
const HOW = {
  contact: { yes: "가볍고 부담 없는 한 마디로 먼저 연락해 보세요. 질문형보다 공유형(‘이거 보니 생각나서’)이 좋아요.", maybe: "지금은 한 번만 가볍게 연락하고, 답을 재촉하지 말고 기다려 보세요.", no: "지금은 연락을 쉬고 내 일상에 집중하세요. 먼저 매달리면 거리가 더 벌어질 수 있어요." },
  reunion: { yes: "헤어진 이유를 바꿨다는 걸 행동으로 보여 주세요. 말보다 달라진 모습이 먼저예요.", maybe: "서두르지 말고 가벼운 안부부터. 반응을 보고 한 걸음씩 가세요.", no: "지금은 붙잡기보다 나를 회복할 때예요. 시간이 지나 흐름이 바뀌면 다시 물어보세요." },
  love: { yes: "좋아하는 마음을 조금 더 분명하게 표현해 보세요. 지금은 솔직함이 통하는 흐름이에요.", maybe: "둘만의 대화 시간을 늘려 보세요. 마음을 확인하기 전에 거리를 먼저 좁혀요.", no: "밀어붙이기보다 편안한 거리를 유지하세요. 부담을 주면 멀어질 수 있어요." },
  date: { yes: "당신이 먼저 가볍게 판을 깔아 주세요. ‘이번 주말에 ○○ 가고 싶은데 같이 갈래?’처럼 날짜·장소를 구체적으로.", maybe: "‘나 요즘 ○○ 가 보고 싶더라’처럼 힌트를 흘려 그 사람이 신청할 명분을 만들어 주세요.", no: "지금은 재촉하지 말고 가볍게 연락만 이어 가세요. 그 사람 상황이 풀리면 움직일 거예요." },
  general: { yes: "생각한 방향대로 작게 먼저 시작해 보세요.", maybe: "정보를 조금 더 모으고, 가장 작은 단계부터 시험해 보세요.", no: "지금 방식을 잠깐 멈추고, 다른 방법을 찾아보세요." },
};
const WHEN = { yes: "가까워요. 1~2주 안에 움직임이 생기기 쉬운 흐름이에요.", maybe: "조금 걸려요. 한 달 안팎으로 보고, 그 사이 신호를 살펴보세요.", no: "지금 당장은 아니에요. 흐름이 한 번 바뀐 뒤(두세 달 뒤)를 보세요." };
const INTENT = { yes: "당신과 더 가까워지고 싶어 해요. 가볍게 보는 게 아니라 관계를 이어 가고 싶은 마음이 커요.", maybe: "호감은 있지만 어디까지 가고 싶은지 스스로도 아직 정하지 못했어요. 당신 반응을 보면서 속도를 재는 중이에요.", no: "지금은 깊은 관계보다 편하고 가벼운 거리를 원하는 쪽이에요. 기대를 조금 낮추고, 말보다 행동으로 확인해 보세요." };
/* 꼬시는 법 — 카드 흐름(좋음/반반/막힘)별. 상대를 불안하게 만드는 밀당 대신, 호감을 쌓는 방법 */
const FLIRT = {
  yes: [
    "지금은 마음이 열려 있는 흐름이라, 먼저 가볍게 약속을 잡아 보세요. ‘이번 주에 ○○ 가 볼래?’처럼 구체적으로.",
    "칭찬은 외모보다 그 사람만의 취향·말투·행동을 콕 집어서. ‘너 이런 거 진짜 잘 고른다’ 같은 말이 오래 남아요.",
    "대화 끝에 다음 이야기를 남겨 두세요. ‘그 얘기 다음에 마저 해 줘’ 한마디가 다음 만남을 만들어요.",
  ],
  maybe: [
    "상대가 아직 재는 중이라, 부담 없는 공유형 연락이 좋아요. ‘이거 보니 너 생각나서’ + 사진·링크 하나.",
    "둘만 아는 이야기(농담·별명·취향)를 하나 만들어 보세요. 공통점이 쌓일수록 마음이 빨리 기울어요.",
    "답장 속도나 말투를 상대에 맞춰 주세요. 편안함이 먼저 쌓여야 설렘으로 넘어가요.",
  ],
  no: [
    "지금은 밀어붙이면 역효과예요. 연락 빈도를 줄이고, 내 일상을 즐겁게 채운 모습을 자연스럽게 보여 주세요.",
    "만나면 가볍고 즐거운 사람으로 남으세요. 무거운 질문·확인은 잠깐 미뤄 두기.",
    "흐름이 바뀌는 계기(모임·생일·새 소식)가 올 때 가볍게 다시 다가가면 훨씬 잘 통해요.",
  ],
};
const MIND = { yes: "호감이 있어요. 당신을 편하고 좋게 생각하는 쪽에 가까워요.", maybe: "궁금해하고 있지만 아직 확신은 없어요. 조금 더 알아가 보고 싶어 하는 마음이에요.", no: "지금은 마음의 여유가 없거나 거리를 두려는 쪽이에요. 당신 탓이라기보다 그 사람 상황이 커요." };
const OUTCOME = { yes: "그렇게 될 가능성이 높아요.", maybe: "반반이에요. 작은 계기가 결과를 가를 수 있어요.", no: "지금 흐름으로는 어려워 보여요. 다만 확정은 아니에요." };
const OUTCOME_T = {
  contact: { yes: ["연락 올 가능성 높아!", "며칠 안에 신호가 올 수 있는 흐름이에요. 먼저 조급해하지만 않으면 돼요."], maybe: ["올 수도, 안 올 수도…", "그 사람도 망설이는 중이라 반반이에요. 가벼운 계기가 있으면 연락이 이어져요."], no: ["당분간은 조용할 듯", "지금은 연락이 뜸할 흐름이에요. 그 사람 상황이 정리될 때까지 시간이 필요해요."] },
  reunion: { yes: ["다시 이어질 가능성 있어!", "서로 끌리는 힘이 남아 있어요. 헤어진 이유가 풀리면 다시 이어지기 쉬워요."], maybe: ["아직은 반반이야", "마음은 남아 있지만 계기가 필요해요. 서두르면 오히려 멀어질 수 있어요."], no: ["지금은 어려워 보여", "지금은 각자의 길에 에너지가 가 있어요. 확정은 아니지만, 나를 먼저 챙길 때예요."] },
  love: { yes: ["잘될 가능성 높아!", "마음이 통할 흐름이에요. 조금 더 솔직해져도 좋아요."], maybe: ["반반이야…", "호감은 있지만 확신은 아직이에요. 시간을 조금 더 들여 보세요."], no: ["지금은 어려워 보여", "지금은 타이밍이 맞지 않아요. 억지로 밀기보다 거리를 조절하세요."] },
};

const LABEL = {
  yesno: null,
  outcome: { yes: ["될 가능성 높아!", "🙆"], maybe: ["반반이야…", "🤔"], no: ["지금은 어려워 보여", "🙅"] },
  why: ["이유는 이거야", "🔍"], how: ["이렇게 해봐", "💡"], when: ["시기는…", "🕰️"], mind: ["그 사람 마음은…", "💭"], what: ["해묘의 답", "🐱"], none: ["오늘의 한마디", "🐱"],
};
const PLAY_TYPE = {
  why: ["답이 없다고 내 탓은 아니야 🐾", "상대의 시간과 내 시간은 다르게 흘러", "이유를 알면 마음이 좀 가벼워질 거야"],
  how: ["작게 시작하는 게 제일 커 ✨", "정답보다 다음 한 걸음!", "냥냥이는 네 편이야 🐱"],
  when: ["기다리는 동안 나를 채우자 🌙", "때가 오면 알게 돼", "조급하면 타이밍이 도망가 🐌"],
  mind: ["마음은 말보다 행동에 보여 👀", "확인은 결국 대화로!", "카드는 가능성을 비출 뿐이야"],
  outcome: ["흐름을 믿되 준비는 하자 🐾", "결과는 네 행동이 바꿀 수 있어", "우주가 힌트를 준 거야 ✨"],
  what: ["답은 이미 네 안에 있을지도 🐱", "카드가 방향을 살짝 비춰 줬어"],
  none: ["오늘 하루도 묘하게 잘 풀리길 🐾", "냥냥이가 응원 중 🐱"],
};
export function buildOracle(cardIndex, reversed, question) {
  const card = getCard(cardIndex);
  const base = YESNO[card.number] || "maybe";
  const verdict = reversed ? (base === "yes" ? "no" : base === "no" ? "yes" : "maybe") : base;
  const v = VERDICT[verdict];
  const dir = reversed ? card.reversed : card.upright;
  const q = (question || "").trim();
  const type = detectType(q);
  const topic = detectTopic(q);
  let label = v.label, emoji = v.emoji, tone = v.tone;
  if (type === "outcome") {
    [label, emoji] = LABEL.outcome[verdict]; tone = OUTCOME[verdict];
    const ot = OUTCOME_T[topic.key]; if (ot) { [label, tone] = ot[verdict]; }
  }
  else if (type !== "yesno") {
    [label, emoji] = LABEL[type];
    const tk = WHY[topic.key] ? topic.key : "general";
    tone = type === "why" ? WHY[tk][verdict]
      : type === "how" ? (HOW[tk] || HOW.general)[verdict]
        : type === "when" ? WHEN[verdict]
          : type === "mind" ? (/(어쩌고 ?싶|원하|싶어|싶을|의도|진심|뭘 ?(하고|원))/.test(q) ? INTENT[verdict] : MIND[verdict])
            : type === "none" ? `오늘 카드는 ‘${card.name}’. ${dir.essence}`
              : `카드가 가리키는 건 ‘${card.keywords.slice(0, 2).join("·")}’이에요. ${dir.essence}`;
  }
  const aboutSomeone = /(남자|여자|걔|쟤|그 ?사람|그분|씨|오빠|언니|누나|형|선배|후배|남친|여친|썸|전남친|전여친|상대|이 ?사람|좋아하|짝사랑|고백|연락|카톡|재회|데이트)/.test(q);
  // 사람이 나오는 질문은 — 카드가 말하는 '그 사람 속사정'을 결론으로
  let insideStory = null, nextStep = null;
  if (aboutSomeone && type !== "yesno" && type !== "none") {
    insideStory = partnerView(card, reversed);
    const intentQ = /(어쩌고 ?싶|원하|싶어|싶을|의도|진심|뭘 ?(하고|원))/.test(q);
    if (type === "why" || type === "what" || (type === "mind" && !intentQ)) tone = insideStory;
    const tk2 = HOW[topic.key] ? topic.key : (WHY[topic.key] ? topic.key : "general");
    nextStep = (HOW[tk2] || HOW.general)[verdict];
  }
  const flirt = aboutSomeone && type !== "yesno" && type !== "none" ? FLIRT[verdict].concat(dir.action ? [`카드가 주는 한 수: ${dir.action}`] : []) : null;
  return {
    flirt, insideStory, nextStep,
    cardLine: `${card.name}${reversed ? "(역방향)" : ""}`,
    whyNote: type === "why" && aboutSomeone ? (WHY[topic.key] || WHY.general)[verdict] : null,
    question: q, qType: type, topic: topic.key,
    verdict, verdictLabel: label, emoji, tone,
    cardName: card.name, cardNumber: card.number, reversed,
    keyword: card.keywords[0], keywords: card.keywords, symbol: card.symbol,
    // 가벼운 고민이어도 '진짜 리딩'처럼 읽히도록 카드의 풍부한 내용을 얹는다
    reason: dir.essence,
    positive: dir.positive,
    caution: dir.obstacle,
    blindspot: dir.blindspot,
    action: dir.action,
    avoid: dir.avoid,
    reflect: card.reflect,
    playful: type === "yesno" ? pick(PLAYFUL[verdict]) : pick(PLAY_TYPE[type] || PLAY_TYPE.what),
  };
}

/** 타로 리딩(여러 장)용 — 질문 + 전체 흐름(yes/maybe/no)으로 질문에 대한 답을 만든다 */
export function answerFor(question, verdict) {
  const q = (question || "").trim();
  if (!q) return null;
  const type = detectType(q);
  const topic = detectTopic(q);
  const v = VERDICT[verdict];
  let label = v.label, emoji = v.emoji, tone = v.tone;
  const tk = WHY[topic.key] ? topic.key : "general";
  if (type === "outcome") { [label, emoji] = LABEL.outcome[verdict]; tone = OUTCOME[verdict]; const ot = OUTCOME_T[topic.key]; if (ot) [label, tone] = ot[verdict]; }
  else if (type === "why") { [label, emoji] = LABEL.why; tone = WHY[tk][verdict]; }
  else if (type === "how") { [label, emoji] = LABEL.how; tone = (HOW[tk] || HOW.general)[verdict]; }
  else if (type === "when") { [label, emoji] = LABEL.when; tone = WHEN[verdict]; }
  else if (type === "mind") { [label, emoji] = LABEL.mind; tone = /(어쩌고 ?싶|원하|싶어|싶을|의도|진심|뭘 ?(하고|원))/.test(q) ? INTENT[verdict] : MIND[verdict]; }
  else if (type === "what" || type === "none") { [label, emoji] = LABEL.what; tone = OUTCOME[verdict]; }
  const aboutSomeone = /(남자|여자|걔|쟤|그 ?사람|그분|씨|오빠|언니|누나|형|선배|후배|남친|여친|썸|전남친|전여친|상대|이 ?사람|좋아하|짝사랑|고백|연락|카톡|재회)/.test(q);
  return { question: q, type, topic: topic.key, verdict, label, emoji, tone, aboutSomeone, flirt: aboutSomeone ? FLIRT[verdict] : null };
}
export const MAJOR_YESNO = YESNO;
