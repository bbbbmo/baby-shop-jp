import type { JusoAddress } from "./jusoAddress";

// 도로명주소 "팝업 API". 검색 API(addrLinkApi.do)와는 승인키가 서로 다르다.
// 우리가 가진 키는 팝업용이라 검색 API로는 E0001(승인되지 않은 KEY)이 난다.
export const JUSO_POPUP_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkUrl.do";

// 팝업이 열리는 곳이자 juso가 고른 주소를 돌려보내는 곳. 한 주소를 GET/POST로
// 두 번 쓴다 — 아래 openPopupHtml / selectedHtml 참고.
export const JUSO_CALLBACK_PATH = "/api/address/juso";

// 같은 오리진의 다른 스크립트(개발 서버의 HMR, 브라우저 확장)도 message를 보낸다.
// 우리 것만 골라내는 표시.
export const JUSO_MESSAGE_TYPE = "juso:selected";

// resultType 4 = 도로명 + 지번 + 상세건물명. 건물명으로도 찾을 수 있어야 해서 4를 쓴다.
const RESULT_TYPE = "4";

// juso가 돌려보내는 26개 항목 중 우리가 쓰는 것만 꺼낸다.
// 시군구(sggNm)는 세종특별자치시처럼 빈 값일 수 있어 필수로 보지 않는다.
export function readJusoForm(form: FormData): JusoAddress | null {
  const read = (name: string) => (form.get(name) ?? "").toString().trim();
  const juso = {
    zipNo: read("zipNo"),
    roadAddrPart1: read("roadAddrPart1"),
    siNm: read("siNm"),
    sggNm: read("sggNm"),
  };
  return juso.zipNo && juso.roadAddrPart1 ? juso : null;
}

// 팝업이 부모창으로 보낸 message. 오리진 검사만으로는 부족해서 모양까지 확인한다.
export function readJusoMessage(data: unknown): JusoAddress | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const { type, juso } = data as { type?: unknown; juso?: unknown };
  if (type !== JUSO_MESSAGE_TYPE || typeof juso !== "object" || juso === null) {
    return null;
  }
  const fields = juso as Record<string, unknown>;
  const ok = ["zipNo", "roadAddrPart1", "siNm", "sggNm"].every(
    (key) => typeof fields[key] === "string",
  );
  return ok ? (juso as JusoAddress) : null;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]!);
}

// 이 라우트는 juso만 부르는 게 아니라 누구나 POST할 수 있다. 값을 그대로
// <script> 안에 넣으면 우리 오리진에서 임의 스크립트가 실행된다.
// JSON.stringify가 못 막는 건 </script>와 줄 구분 문자 두 개뿐이다.
export function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// 팝업 창은 잠깐 보였다 사라진다. 프로젝트 테마(흰 배경·각진 모서리)만 맞춘다.
function popupPage(notice: string, body: string): string {
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>주소 검색</title>
<style>body{margin:0;padding:24px;background:#fff;color:#111;font:14px/1.6 system-ui,sans-serif}</style>
</head><body><p>${escapeHtml(notice)}</p>${body}</body></html>`;
}

// 1단계: 팝업이 열리면 juso로 곧장 넘긴다. 승인키가 우리 서버에만 있어야 해서
// 브라우저 번들이 아니라 이 HTML 안에서만 form에 실린다.
export function openPopupHtml(confmKey: string, returnUrl: string): string {
  return popupPage(
    "주소 검색을 여는 중…",
    `<form id="jusoForm" method="post" action="${JUSO_POPUP_ENDPOINT}">
<input type="hidden" name="confmKey" value="${escapeHtml(confmKey)}" />
<input type="hidden" name="returnUrl" value="${escapeHtml(returnUrl)}" />
<input type="hidden" name="resultType" value="${RESULT_TYPE}" />
<noscript><button type="submit">주소 검색 열기</button></noscript>
</form>
<script>document.getElementById("jusoForm").submit();</script>`,
  );
}

// 2단계: juso가 고른 주소를 이 주소로 POST한다. 부모창(체크아웃 폼)에 넘기고 닫는다.
// targetOrigin을 "*"로 두면 팝업이 다른 사이트로 옮겨간 뒤에도 주소가 새 나간다.
export function selectedHtml(juso: JusoAddress, targetOrigin: string): string {
  const message = { type: JUSO_MESSAGE_TYPE, juso };
  return popupPage(
    "주소를 가져왔습니다. 이 창은 자동으로 닫힙니다.",
    `<script>
if (window.opener) { window.opener.postMessage(${scriptJson(message)}, ${scriptJson(targetOrigin)}); }
window.close();
</script>`,
  );
}

export function noticeHtml(notice: string): string {
  return popupPage(notice, "");
}
