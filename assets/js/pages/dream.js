import { el, clear } from "../utils/dom.js";
import { pageHeader, backLink, noticeBox, loadDisclaimer } from "./_shared.js";

/* 꿈해몽 사전 — 대표 상징. 재미·참고용(해석은 상황·문맥에 따라 달라져요). */
const DREAM = {
  돼지: { luck: "길몽", m: "재물·행운의 대표 길몽이에요. 뜻밖의 수입이나 좋은 기회가 다가와요.", tip: "재물운이 열리는 시기 — 계약·기회를 놓치지 마세요." },
  똥: { luck: "길몽", m: "대표적인 재물운! 몸에 묻을수록 더 큰 재물을 뜻해요.", tip: "금전 기회가 오면 적극적으로." },
  뱀: { luck: "길몽", m: "재물·지혜·태몽의 상징. 뱀을 잡거나 품으면 특히 길해요.", tip: "임신·재물 소식의 전조로도 봐요." },
  피: { luck: "길몽", m: "피는 재물의 상징이에요. 피를 보면 오히려 금전운이 열려요.", tip: "돈 들어올 일을 기대해도 좋아요." },
  아기: { luck: "길몽", m: "새 시작·기회·태몽. 예쁜 아기일수록 길해요.", tip: "새 프로젝트·인연의 전조." },
  죽음: { luck: "길몽", m: "죽는 꿈은 오히려 재생·변화·새 출발의 길몽이에요.", tip: "낡은 것을 정리하고 새로 시작하기 좋아요." },
  불: { luck: "중립", m: "크게 타오르면 번성·재물, 꺼지면 손실. 불길이 셀수록 길해요.", tip: "감정 조절이 필요한 시기일 수도." },
  물: { luck: "중립", m: "맑은 물은 재물·정화, 흐린 물은 근심. 물의 상태가 핵심이에요.", tip: "물이 맑았는지 떠올려 보세요." },
  비: { luck: "중립", m: "촉촉한 비는 해갈·재물, 폭우는 근심을 뜻해요.", tip: "감정이 씻겨 내려가는 시기." },
  돈: { luck: "중립", m: "받으면 지출·부담, 주우면 뜻밖의 이익으로도 봐요(해석 분분).", tip: "금전 관리를 점검하세요." },
  시험: { luck: "중립", m: "현실의 압박·평가에 대한 불안. 잘 봤으면 자신감, 못 봤으면 준비 신호.", tip: "지금 신경 쓰는 일을 점검해 보세요." },
  결혼: { luck: "중립", m: "변화·결합·새 국면. 큰 변화의 신호로 봐요.", tip: "중요한 결정이 다가올 수 있어요." },
  이사: { luck: "중립", m: "환경·마음의 변화. 좋은 집이면 상황이 나아져요.", tip: "변화를 받아들일 준비를." },
  연예인: { luck: "중립", m: "인정 욕구·주목받고 싶은 마음. 친밀했다면 인기운 상승.", tip: "자기표현의 기회를 살려 보세요." },
  이빨: { luck: "흉몽", m: "이 빠지는 꿈은 가까운 사람의 우환·구설·건강 주의로 봐요.", tip: "무리한 말·행동을 조심하세요." },
  쫓김: { luck: "흉몽", m: "스트레스·회피하고 싶은 문제를 뜻해요.", tip: "미루던 일을 마주할 때예요." },
  떨어짐: { luck: "중립", m: "불안·통제력 상실감. 크게 다치지 않았다면 곧 안정돼요.", tip: "무리한 확장을 조심하세요." },
  거미: { luck: "중립", m: "재물·인연의 그물. 거미줄은 관계·기회를 엮는 의미.", tip: "인맥을 챙겨 보세요." },
  신발: { luck: "중립", m: "잃어버리면 이별·이동, 새 신발은 새 출발·인연을 뜻해요.", tip: "관계·직장 변화 가능성." },
  머리카락: { luck: "흉몽", m: "빠지면 근심·손실, 길고 풍성하면 건강·재물이에요.", tip: "건강 관리에 신경 쓰세요." },
};
const KEYS = Object.keys(DREAM);
const LUCK_COLOR = { 길몽: "#9fd3b7", 흉몽: "#e2919a", 중립: "#e0b878" };

export function renderDream({ navigate }) {
  loadDisclaimer();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("꿈해몽", "무슨 꿈 꿨어?", "꿈에 나온 걸 적거나 골라 봐. 해묘가 무슨 뜻인지 풀어줄게. (재미·참고용)"));

  const result = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  const input = el("input", { class: "input", type: "text", maxlength: "20", placeholder: "예: 돼지, 이빨, 물…", "aria-label": "꿈 키워드" });
  const search = () => {
    const q = input.value.trim();
    const hits = q ? KEYS.filter((k) => q.includes(k) || k.includes(q)) : [];
    show(hits.length ? hits : q ? "none" : []);
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });

  root.append(el("section", { class: "wrap section-gap" }, [
    el("div", { style: "display:flex; gap:8px;" }, [input, el("button", { class: "btn btn-primary btn-sm", onclick: search }, [el("span", { text: "해몽" })])]),
    el("p", { class: "muted tiny", text: "자주 찾는 꿈" }),
    el("div", { class: "chip-grid" }, KEYS.slice(0, 14).map((k) =>
      el("button", { class: "chip", type: "button", onclick: () => { input.value = k; search(); } }, [el("span", { text: k })]))),
  ]));
  root.append(result);

  function show(hits) {
    clear(result);
    if (hits === "none") { result.append(noticeBox("info", "그 꿈은 아직 사전에 없어요. 다른 키워드(돼지·물·이빨 등)로 찾아보거나, 해묘의 오라클에게 물어봐도 좋아요.")); return; }
    if (!hits.length) return;
    result.append(el("div", { class: "section-gap" }, hits.map((k) => {
      const d = DREAM[k], c = LUCK_COLOR[d.luck];
      return el("div", { class: "panel section-gap" }, [
        el("div", { style: "display:flex; align-items:center; gap:8px;" }, [
          el("span", { class: "serif", style: "font-size:1.3rem;", text: k + " 꿈" }),
          el("span", { style: `font-size:.72rem; font-weight:800; color:${c}; border:1px solid ${c}66; border-radius:999px; padding:2px 10px;`, text: d.luck }),
        ]),
        el("p", { text: d.m }),
        el("div", { class: "insight", text: d.tip }),
      ]);
    })));
    result.append(noticeBox("info", "꿈 해석은 문맥·감정에 따라 크게 달라져요. 재미로 참고만 하세요."));
  }
  return root;
}
