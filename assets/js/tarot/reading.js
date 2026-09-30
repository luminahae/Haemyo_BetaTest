import { getCard, getTopic, getSpread } from "./cardArt.js";
import { answerFor, MAJOR_YESNO } from "./oracle.js";
/* 타로 해석 결과 생성기.
   선택한 카드 + 방향 + 질문 분야를 받아, 요청된 구조의 해석을 만든다:
   핵심 상징 · 질문과 연결한 해석 · 긍정 가능성 · 현실적 장애물 ·
   놓치는 부분 · 가까운 시기 행동 · 하지 말아야 할 행동 · 스스로 볼 질문 */


export function buildReading({ topicId, spreadId, slots, question }) {
  const topic = getTopic(topicId);
  const spread = getSpread(spreadId);

  const items = slots.map((slot, i) => {
    const card = getCard(slot.cardIndex);
    const dir = slot.reversed ? card.reversed : card.upright;
    const pos = spread.positions[i] || { key: "core", label: "메시지" };
    return {
      position: pos,
      cardNumber: card.number,
      cardName: card.name,
      cardNameEn: card.nameEn,
      art: card.art,
      suit: card.suit || "major",
      reversed: slot.reversed,
      cardIndex: slot.cardIndex,
      symbol: card.symbol,
      keywords: card.keywords,
      blocks: {
        connect: connectToTopic(dir.essence, topic, pos),
        positive: dir.positive,
        obstacle: dir.obstacle,
        blindspot: dir.blindspot,
        action: dir.action,
        avoid: dir.avoid,
      },
      reflect: card.reflect,
    };
  });

  // 전체 카드 기운(좋음/반반/막힘) — 결론·질문 답에 공통으로 씀
  let e = 0;
  {
    items.forEach((it, i) => {
      const w = i === items.length - 1 ? 2 : (/미래|결과|흐름|가능성|조언/.test(it.position.label || "") ? 1.5 : 1);
      let v;
      if (it.suit && it.suit !== "major") v = it.reversed ? -0.5 : 0.5;
      else { const b = MAJOR_YESNO[it.cardNumber] || "maybe"; const base = b === "yes" ? 1 : b === "no" ? -1 : 0; v = it.reversed ? (base === 0 ? -0.3 : -base) : base; }
      e += v * w;
    });
  }
  const norm = e / items.reduce((s, _, i) => s + (i === items.length - 1 ? 2 : 1.2), 0);
  const verdict = norm > 0.2 ? "yes" : norm < -0.2 ? "no" : "maybe";
  const conclusion = buildConclusion(topic, verdict, items);
  const overallObj = buildOverall(items, spread, topic);

  // 질문이 있으면 — 전체 카드의 기운으로 질문에 대한 답
  let answer = null;
  if (question && question.trim()) {
    answer = answerFor(question, verdict);
    if (answer) {
      // 근거가 된 카드 — 결과·미래 자리 + 가장 마지막 카드
      const key = items.filter((it) => /결과|미래|가능성|희망|마음|감정|상대/.test(it.position.label || "")).slice(0, 3);
      answer.evidence = (key.length ? key : items.slice(-2)).map((it) => `‘${it.position.label}’ ${it.cardName}${it.reversed ? "(역)" : ""} — ${it.blocks.connect.replace(/^‘[^’]+’\s*자리에서,\s*/, "")}`);
    }
  }

  if (overallObj && conclusion) overallObj.close = `한마디로 — ${conclusion.headline} 지금 할 한 가지: ${overallObj.keyAction}`;
  return {
    verdict, conclusion,
    question: question || "", answer,
    topic, spread, items,
    summary: buildSummary(items, topic),
    overall: overallObj,
  };
}

/** 종합 해석 — 뽑은 카드들을 하나의 흐름/이야기로 엮는다. */
function buildOverall(items, spread, topic) {
  const rev = items.filter((it) => it.reversed).length;
  const nm = (it) => `${it.cardName}${it.reversed ? "(역)" : ""}`;
  // 위치 접두사(예: "‘과거’ 자리에서, ")는 종합에서 중복되므로 제거
  const ess = (it) => it.blocks.connect.replace(/^‘[^’]+’\s*자리에서,\s*/, "");
  const narrative = [];
  let keyAction;

  if (spread.id === "three" && items.length === 3) {
    const [past, present, future] = items;
    narrative.push(`지난 흐름은 ‘${nm(past)}’ — ${ess(past)}`);
    narrative.push(`지금 당신은 ‘${nm(present)}’의 자리에 있어요. ${ess(present)}`);
    narrative.push(`가까운 미래는 ‘${nm(future)}’로 향합니다. ${ess(future)}`);
    keyAction = future.blocks.action;
  } else if (spread.id === "relation" && items.length === 3) {
    const [me, you, between] = items;
    narrative.push(`당신은 ‘${nm(me)}’ — ${ess(me)}`);
    narrative.push(`상대는 ‘${nm(you)}’ — ${ess(you)} (단정이 아니라 가능성)`);
    narrative.push(`두 사람 사이는 ‘${nm(between)}’ — ${ess(between)}`);
    keyAction = between.blocks.action;
  } else if (items.length > 1) {
    // 그 밖의 배열 — 자리 이름을 붙여 순서대로 잇고, 마지막 자리(결과·조언)의 행동을 핵심으로
    items.forEach((it) => narrative.push(`${tagOf(it)} ‘${it.position.label}’ 자리는 ‘${nm(it)}’ — ${ess(it)}`));
    keyAction = items[items.length - 1].blocks.action;
  } else {
    narrative.push(`‘${nm(items[0])}’ — ${ess(items[0])}`);
    keyAction = items[0].blocks.action;
  }

  const tone = rev === 0
    ? `${items.length === 1 ? "카드가 순방향이라" : items.length + "장이 대체로 순방향이라"}, 지금 잡은 방향을 믿고 한 걸음 더 나아가도 좋은 흐름이에요.`
    : rev >= items.length
      ? "역방향이 많아요. 지금은 밖으로 밀어붙이기보다, 안을 정비하고 속도를 늦추며 마음을 살필 때입니다."
      : "순방향과 역방향이 섞여 있어요. 잘 풀리는 부분은 밀고, 막힌 부분은 점검하는 균형이 필요한 시기예요.";

  const close = `${topic.label}에 대해 종합하면 — ${tone} 지금 할 수 있는 가장 현실적인 한 걸음은 이거예요: ${keyAction}`;
  return { narrative, close, keyAction, reversedCount: rev, total: items.length };
}

function connectToTopic(essence, topic, pos) {
  const posPrefix = pos && pos.key !== "core" ? `‘${pos.label}’ 자리에서, ` : "";
  return `${posPrefix}${essence}`;
}

function buildSummary(items, topic) {
  const names = items.map((it) => `${it.cardName}${it.reversed ? "(역)" : ""}`).join(" · ");
  const lead =
    items.length === 1
      ? `${topic.label}에 대한 한 장의 조언은 ‘${items[0].cardName}’입니다.`
      : `${topic.label}의 흐름을 ${names}로 읽었습니다.`;
  return `${lead} ${topic.lens}`;
}

/* 상대방 마음/미래처럼 단정 위험이 있는 분야에 붙일 안내 */
export function needsSpeculationNote(topicId) {
  return topicId === "their_mind" || topicId === "reunion";
}

/* ---------- 두괄식 한 줄 결론 ---------- */
const CONCLUDE = {
  now: { yes: "흐름이 좋아요. 지금 방향 그대로 한 걸음 더 나아가도 돼요.", maybe: "좋고 나쁨이 섞인 시기예요. 잘 되는 건 밀고, 막힌 건 한 번 점검하세요.", no: "지금은 속도를 늦출 때예요. 무리하게 밀기보다 정비가 먼저예요." },
  love: { yes: "연애 기운이 열려 있어요. 마음을 조금 더 솔직하게 표현하면 잘 풀려요.", maybe: "설렘과 망설임이 함께 있어요. 서두르지 말고 대화로 거리를 좁히세요.", no: "지금은 연애에 에너지가 막혀 있어요. 상대보다 내 마음부터 돌볼 때예요." },
  their_mind: { yes: "그 사람은 당신에게 호감이 있어요. 관계를 이어 가고 싶은 마음이 커요.", maybe: "관심은 있지만 아직 망설이는 중이에요. 부담 없이 가볍게 다가가 보세요.", no: "지금 그 사람은 마음의 여유가 없어요. 밀어붙이기보다 거리를 두는 게 좋아요." },
  reunion: { yes: "다시 이어질 가능성이 있어요. 헤어진 이유가 풀렸는지가 관건이에요.", maybe: "마음은 남아 있지만 계기가 필요해요. 서두르면 오히려 멀어져요.", no: "지금은 재회보다 나를 회복할 때예요. 흐름이 바뀐 뒤 다시 보세요." },
  new_love: { yes: "새 인연이 들어올 흐름이에요. 모임·새 환경에 적극적으로 나가 보세요.", maybe: "인연의 씨앗은 있지만 아직 싹이 트기 전이에요. 만남의 폭을 조금씩 넓히세요.", no: "지금은 인연보다 내 준비가 먼저예요. 나를 채우면 때가 와요." },
  work: { yes: "일이 앞으로 나아가는 흐름이에요. 준비한 걸 실행에 옮겨도 좋아요.", maybe: "기회와 부담이 함께 와요. 우선순위를 정리하면 길이 보여요.", no: "지금은 무리하게 확장하지 말고 기본을 다질 때예요." },
  money: { yes: "돈의 흐름이 좋아요. 계획한 지출·투자를 차분히 진행해도 돼요.", maybe: "들어오는 만큼 나갈 수 있어요. 큰 결정은 한 번 더 따져 보세요.", no: "지금은 지키는 게 이득이에요. 충동 지출·큰 투자는 미루세요." },
  choice: { yes: "지금 기울어 있는 선택이 맞는 방향이에요. 결정해도 좋아요.", maybe: "어느 쪽도 완벽하지 않아요. 포기할 수 있는 것을 기준으로 고르세요.", no: "지금은 결정을 서두르지 마세요. 정보를 더 모은 뒤 고르는 게 좋아요." },
  today: { yes: "오늘은 운이 따르는 날이에요. 미뤄 둔 일을 시작하기 좋아요.", maybe: "평범하지만 작은 선택이 하루를 바꿔요. 무리하지 말고 차분하게.", no: "오늘은 조심하는 날이에요. 큰 결정보다 쉬어 가는 게 이득이에요." },
};
function buildConclusion(topic, verdict, items) {
  const t = CONCLUDE[topic && topic.id] || CONCLUDE.now;
  const key = items[items.length - 1];
  const nm = `${key.cardName}${key.reversed ? "(역)" : ""}`;
  const label = verdict === "yes" ? "좋은 흐름" : verdict === "no" ? "조심할 흐름" : "반반의 흐름";
  return {
    label,
    headline: t[verdict],
    sub: `열쇠 카드는 ‘${key.position && key.position.label ? key.position.label + "" : "마지막"}’ 자리의 ${nm} — ${key.blocks.action}`,
  };
}

/* 카드 한 장의 기운 표시 — 👍 좋음 / 🤔 반반 / ⚠️ 막힘 */
function tagOf(it) {
  let v;
  if (it.suit && it.suit !== "major") v = it.reversed ? -1 : 1;
  else { const b = MAJOR_YESNO[it.cardNumber] || "maybe"; const base = b === "yes" ? 1 : b === "no" ? -1 : 0; v = it.reversed ? (base === 0 ? -1 : -base) : base; }
  return v > 0 ? "👍" : v < 0 ? "⚠️" : "🤔";
}
