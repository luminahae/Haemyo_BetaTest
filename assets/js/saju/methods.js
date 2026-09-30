import { majorBgStyle } from "../tarot/cardArt.js";
import { topicMeta } from "./topics.js";
import { computeZiwei, STAR_MEANING } from "./ziwei.js";
import { tojeongYear } from "./tojeong.js";
/* =========================================================
   한 운세 토픽을 4가지 방법으로 — 사주·타로·자미두수·토정비결.
   'saju'는 topics.readTopic이 담당하고, 여기선 나머지 3방법을 생성한다.
   각 방법의 고유 엔진(카드/명반/괘)으로 같은 주제를 다르게 풀어 준다.
   ========================================================= */


/* ---- 공용 ---- */
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff; return h; }
function timeSeed(id, input) {
  const d = input && input.targetDate ? new Date(input.targetDate) : new Date();
  if (id === "tomorrow" || id === "tomorrowlove") d.setDate(d.getDate() + 1);
  const meta = topicMeta(id);
  let t;
  if (meta && (meta.kind === "daily" || id === "todaylove" || id === "tomorrowlove" || id === "daylove")) t = `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
  else if (id === "month" || id === "monthlove" || id === "nextmonth") t = `${d.getFullYear()}${d.getMonth()}`;
  else t = `${d.getFullYear()}`;
  return hashStr(`${input.birthDate || ""}_${id}_${t}`);
}
const topicWord = (id) => (topicMeta(id) ? topicMeta(id).name : "운세");

/* ---- 타로 22 메이저 키워드 ---- */
const TAROT = [
  ["바보", "새 시작·모험·순수한 도약", "무모함·준비 부족·즉흥"],
  ["마법사", "실행력·자원 활용·주도", "속임수·산만·재능 낭비"],
  ["여사제", "직관·기다림·숨은 진실", "비밀·혼란·직관 무시"],
  ["여황제", "풍요·애정·돌봄", "과보호·의존·정체"],
  ["황제", "안정·주도권·현실 구조", "고집·통제·경직"],
  ["교황", "배움·조언·전통·계약", "관습에 갇힘·형식주의"],
  ["연인", "인연·선택·조화", "갈등·유혹·엇갈림"],
  ["전차", "추진·의지·전진", "폭주·통제 불능·정체"],
  ["힘", "인내·부드러운 용기", "자신감 부족·조급"],
  ["은둔자", "성찰·홀로서기·탐구", "고립·회피·지연"],
  ["운명의 수레바퀴", "전환점·기회·흐름", "악순환·타이밍 어긋남"],
  ["정의", "균형·공정·결과·책임", "불공정·미룬 결정"],
  ["매달린 사람", "관점 전환·잠시 멈춤", "희생만·정체·집착"],
  ["죽음", "끝과 새로운 시작·변화", "변화 거부·질질 끎"],
  ["절제", "조율·중용·인내", "과함·불균형·조급"],
  ["악마", "집착·유혹·굴레", "해방·끊어냄·직면"],
  ["탑", "급변·충격·해체", "위기 모면·서서히 붕괴"],
  ["별", "희망·회복·영감", "실망·자신감 하락"],
  ["달", "불안·직관·모호함", "혼란 해소·진실 드러남"],
  ["태양", "성취·활력·명확함", "잠깐의 흐림·과신"],
  ["심판", "각성·부름·재도약", "미련·자기비판·지연"],
  ["세계", "완성·성취·통합", "미완·마무리 지연"],
];

function tarotMethod(profile, id, input) {
  const seed = timeSeed(id, input) + hashStr("tarot");
  const idx = seed % 22;
  const reversed = (seed >> 5) % 2 === 1;
  const [name, up, rev] = TAROT[idx];
  const key = reversed ? rev : up;
  const w = topicWord(id);
  return {
    method: "tarot", methodName: "타로",
    mediaStyle: majorBgStyle(idx),
    title: `${name}${reversed ? " (역방향)" : ""}`,
    lead: `${w}에 대해 뽑힌 카드는 ‘${name}’. ${reversed ? "지금은 이 카드의 기운이 막히거나 뒤집혀 있어요." : "이 카드의 기운이 지금 흐르고 있어요."}`,
    points: [
      { label: "카드의 메시지", text: key },
      { label: `${w}으로 읽으면`, text: tarotFrame(id, key, reversed) },
    ],
    advice: reversed ? "서두르기보다 한 박자 멈추고, 놓친 부분을 살펴보세요." : "카드가 가리키는 방향으로 한 걸음 내디뎌 보세요.",
  };
}
function tarotFrame(id, key, rev) {
  const w = topicWord(id);
  return `${w}의 흐름은 ‘${key}’로 요약돼요. ${rev ? "무리하게 밀어붙이기보다 정비가 필요한 시기" : "지금의 선택과 태도가 좋은 결과로 이어질 수 있는 시기"}예요. 결국 답은 알려주지만, 선택은 당신 몫이에요.`;
}

/* ---- 자미두수 (토픽 → 관련 궁) ---- */
const TOPIC_PALACE = {
  love: "부처궁", yearlove: "부처궁", reunion: "부처궁", breakup: "부처궁", todaylove: "부처궁", monthlove: "부처궁",
  wealth: "재백궁", business: "재백궁", study: "관록궁", document: "전택궁",
  today: "명궁", weekday: "명궁", weekend: "명궁", month: "명궁", nextmonth: "명궁", year: "명궁",
};
function ziweiMethod(profile, id, input) {
  const z = computeZiwei(input);
  const palName = TOPIC_PALACE[id] || "명궁";
  const pal = z.palaces.find((p) => p.name === palName) || z.palaces.find((p) => p.isMing);
  let starName = (pal.stars[0] && pal.stars[0].name) || (z.mingStars[0]) || "";
  let m = STAR_MEANING[starName];
  const w = topicWord(id);
  const empty = !pal.stars.length;
  return {
    method: "ziwei", methodName: "자미두수",
    title: `${palName} · ${starName || "공궁(空宮)"}`,
    lead: `${w}은(는) 자미두수의 ‘${palName}’로 봐요. ${empty ? "이 궁은 주성이 없는 공궁이라, 대궁의 기운과 주변 흐름을 함께 봐요." : `이 궁에 든 주성은 ‘${starName}’이에요.`}`,
    points: m ? [
      { label: "이 별의 기질", text: m.persona },
      { label: `${w}에서는`, text: `${m.strength} 다만 ${m.shadow}` },
    ] : [{ label: `${palName}`, text: "주성이 비어 대궁·삼방의 기운으로 흐름을 읽어요. 스스로 중심을 잡을수록 좋아요." }],
    advice: m ? m.advice : "명궁·삼방사정을 함께 보면 더 또렷해져요. 심화 해석에서 확인해 보세요.",
  };
}

/* ---- 토정비결 (올해 괘 → 토픽 각도) ---- */
function tojeongMethod(profile, id, input) {
  const t = tojeongYear(profile, new Date().getFullYear());
  const w = topicWord(id);
  return {
    method: "tojeong", methodName: "토정비결",
    title: `${t.palName} · ${t.palSym}`,
    lead: `올해의 괘 ‘${t.palName}(${t.palSym})’로 ${w}을(를) 봐요. “${t.verse}”`,
    points: [
      { label: "올해 전체 기운", text: t.summary },
      { label: `${w}로 좁혀 보면`, text: `${t.pros[0]} 반대로 ${t.cons[0]}` },
    ],
    advice: t.advice,
    goodMonths: t.goodMonths,
  };
}

/** 방법별 해석 (saju 제외) */
export function methodReading(profile, id, method, input) {
  if (method === "tarot") return tarotMethod(profile, id, input);
  if (method === "ziwei") return ziweiMethod(profile, id, input);
  if (method === "tojeong") return tojeongMethod(profile, id, input);
  return null;
}

/* 운세 방법 탭 — 사주·타로만. 자미두수는 어차피 명반·8단계 심화로 넘어가야 해서
   홈의 독립 메뉴(/ziwei)로 따로 보고, 토정비결도 '올해 전체 괘'라 /tojeong으로 따로 본다. */
export const METHODS = [
  { id: "saju", name: "사주" },
  { id: "tarot", name: "타로" },
];
