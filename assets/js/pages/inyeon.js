import { el, clear, toast, icon } from "../utils/dom.js";
import { pageHeader, backLink, noticeBox, insight, loadDisclaimer } from "./_shared.js";
import { getMyBirth } from "../state.js";
import { personSwitch } from "./people.js";
import { computeSaju } from "../saju/manse.js";
import { charmSpirits, idealType, dayNightStyle, cheatIndex, spousePortrait, datePortrait, avoidPortrait, portraitSvg } from "../saju/spouse.js";
import { isUnlocked, unlock, getCoins, costOf, chartItemId } from "../wallet.js";
export function renderInyeon({ navigate }) {
  loadDisclaimer();
  const my = getMyBirth();
  const root = el("div", {});
  root.append(el("div", { class: "wrap", style: "margin-bottom: var(--sp-3);" }, [backLink(navigate, "/", "홈")]));
  root.append(pageHeader("나의 인연 알아보기", "사주로 보는 나의 연애·인연",
    "내 사주로 이상형·낮져밤이 스타일·바람기 지수를 풀고, 만나면 안 될 사람·연애할 사람·배우자의 초상화까지 그려 드려요."));
  root.append(personSwitch(navigate, { title: "누구의 인연을 볼까?" }));

  if (!my) {
    root.append(el("section", { class: "wrap section-gap" }, [
      noticeBox("info", "생년월일이 필요해요. 내 정보를 한 번 입력하면 저장됩니다."),
      el("button", { class: "btn btn-primary", onclick: () => navigate("/saju") }, [el("span", { text: "내 정보 입력하고 시작" })]),
    ]));
    return root;
  }

  const profile = computeSaju(my);
  const gender = my.gender === "male" ? "male" : "female";
  const host = el("section", { class: "wrap", style: "margin-top: var(--sp-2);" });
  root.append(host);
  const entryId = chartItemId("inyeon", my);

  function paint() {
    clear(host);
    const cost = costOf("inyeon");
    if (!isUnlocked(entryId)) {
      const coins = getCoins();
      const box = el("div", { class: "panel premium-lock" }, [
        el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
        el("h3", { class: "serif", style: "margin-top:10px;", text: "나의 인연 열어 보기" }),
        el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "이상형·낮져밤이 스타일·바람기 지수·매력 신살을 한 번에 풀어 드려요. 한 번 열면 재열람은 무료예요. (초상화는 개당 5코인)" }),
      ]);
      box.append(el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
        if (coins < cost) { toast("코인이 부족해요."); navigate("/store"); return; }
        const r = unlock(entryId, cost);
        if (r.ok) { toast(r.reason === "already" ? "이미 열어 둔 인연 리포트예요." : `나의 인연을 열었어요 · 코인 ${cost} 차감`); paint(); }
        else { toast("코인이 부족해요."); navigate("/store"); }
      } }, [el("span", { text: coins >= cost ? `코인 ${cost}개로 열기 · 보유 ${coins}개` : "코인 받으러 가기" })]));
      host.append(box);
      return;
    }

    // ── 열림: 이상형 / 낮져밤이 / 바람기 / 매력 신살 ──
    const ideal = idealType(profile, gender);
    const dn = dayNightStyle(profile);
    const cheat = cheatIndex(profile, gender);
    const charm = charmSpirits(profile);

    host.append(el("div", { class: "panel section-gap" }, [
      el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("heart")]), el("span", { text: "내 이상형" })]),
      el("p", { class: "tiny muted", text: `배우자성 ${ideal.god} · ${ideal.elemKr}` }),
      el("p", { style: "font-weight:600;", text: ideal.look }),
      insight(ideal.line),
    ]));

    host.append(el("div", { class: "panel section-gap", style: "margin-top: var(--sp-4);" }, [
      el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("sparkle")]), el("span", { text: "낮져밤이 스타일" })]),
      el("p", { class: "serif", style: "font-size:1.2rem; font-weight:700;", text: `${dn.key} · ${dn.title}` }),
      el("p", { class: "muted", text: dn.line }),
    ]));

    host.append(el("div", { class: "panel section-gap", style: "margin-top: var(--sp-4);" }, [
      el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("alert")]), el("span", { text: "바람기 지수 (재미용)" })]),
      el("div", { class: "cheat-bar" }, [el("div", { class: "cheat-fill", style: `width:${cheat.score}%;` })]),
      el("p", { style: "font-weight:700;", text: `${cheat.score}점 · ${cheat.tier}` }),
      el("p", { class: "muted tiny", text: cheat.line }),
    ]));

    host.append(el("div", { class: "panel section-gap", style: "margin-top: var(--sp-4);" }, [
      el("div", { class: "block-label", style: "color:var(--c-gold-soft);" }, [el("span", { class: "ic" }, [icon("sparkle")]), el("span", { text: "매력 신살 — 도화·홍염·화개" })]),
      el("div", { class: "charm-list" }, charm.items.map((it) =>
        el("div", { class: "charm-row" + (it.on ? " on" : "") }, [
          el("span", { class: "charm-key", text: it.key }),
          el("span", { class: "charm-badge", text: it.on ? "있음" : "약함" }),
          el("p", { class: "charm-desc muted tiny", text: it.desc }),
        ]))),
    ]));

    // ── 초상화 3종 (개당 5코인) ──
    host.append(el("h3", { class: "serif", style: "margin-top: var(--sp-5); text-align:center;", text: "사주로 그리는 인연 초상화" }));
    host.append(el("p", { class: "muted tiny", style: "text-align:center; margin-bottom: var(--sp-3);", text: "사주로 상상한 이미지예요. 실제 사진·확정이 아니라 재미·참고용입니다." }));
    host.append(portraitBlock("portrait-avoid", () => avoidPortrait(profile, gender)));
    host.append(portraitBlock("portrait-date", () => datePortrait(profile, gender)));
    host.append(portraitBlock("spouse-portrait", () => Object.assign(spousePortrait(profile, gender), { title: "결혼할 배우자" })));

    host.append(noticeBox("info", "연애·인연 해석은 자기이해와 재미를 위한 참고 콘텐츠예요. 사람을 좋고 나쁨으로 단정하지 않으며, 실제 관계는 두 사람의 선택과 노력으로 달라집니다."));
  }

  function portraitBlock(key, compute) {
    const cost = costOf(key);
    const id = chartItemId(key, my);
    const wrap = el("div", { style: "margin-top: var(--sp-4);" });
    function render() {
      clear(wrap);
      if (!isUnlocked(id)) {
        const coins = getCoins();
        const preview = compute();
        wrap.append(el("div", { class: "panel premium-lock" }, [
          el("span", { class: "lock-badge" }, [el("span", { class: "coin-mark sm", "aria-hidden": "true" }), el("span", { text: `코인 ${cost}개` })]),
          el("h4", { class: "serif", style: "margin-top:10px;", text: preview.title + " 초상화" }),
          el("p", { class: "muted", style: "font-size:var(--fs-sm);", text: "얼굴·분위기까지 그려 드려요." }),
          el("button", { class: "btn btn-primary btn-block", style: "margin-top: var(--sp-4);", onclick: () => {
            if (coins < cost) { toast("코인이 부족해요."); navigate("/store"); return; }
            const r = unlock(id, cost);
            if (r.ok) { toast(`초상화를 그렸어요 · 코인 ${cost} 차감`); render(); }
            else { toast("코인이 부족해요."); navigate("/store"); }
          } }, [el("span", { text: coins >= cost ? `코인 ${cost}개로 초상화 보기 · 보유 ${coins}개` : "코인 받으러 가기" })]),
        ]));
        return;
      }
      const port = compute();
      const svgWrap = el("div", { class: "portrait-wrap" });
      svgWrap.innerHTML = portraitSvg(port, 220);
      wrap.append(el("div", { class: "panel section-gap" + (port.warn ? " portrait-warn" : "") }, [
        el("div", { class: "block-label", style: `color:${port.warn ? "var(--c-danger)" : "var(--c-gold-soft)"};` }, [el("span", { class: "ic" }, [icon(port.warn ? "alert" : "heart")]), el("span", { text: port.title })]),
        svgWrap,
        el("p", { class: "tiny muted", text: `핵심 기운 ${port.elemKr}` }),
        el("ul", {}, port.traits.map((t) => el("li", { text: t }))),
        insight(port.summary),
      ]));
    }
    render();
    return wrap;
  }

  paint();
  return root;
}
