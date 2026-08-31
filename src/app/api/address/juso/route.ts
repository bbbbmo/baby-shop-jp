import {
  JUSO_CALLBACK_PATH,
  noticeHtml,
  openPopupHtml,
  readJusoForm,
  selectedHtml,
} from "@/features/address-search/model/jusoPopup";

// 도로명주소 팝업 API는 우리 서버의 한 주소를 두 번 부른다.
//   GET  — 사용자가 "주소 검색"을 눌러 팝업이 열릴 때. juso로 자동 제출한다.
//   POST — 사용자가 juso 화면에서 주소를 고른 뒤 juso가 돌려보낼 때.
// page.tsx는 POST 본문을 읽을 수 없어서 라우트 핸들러로 둔다.
// 슬라이스 공개 API(index.ts) 대신 깊은 경로로 가져오는 이유는, 그 배럴이
// 클라이언트 컴포넌트를 함께 끌고 들어오기 때문이다. 여기서는 필요 없다.

export async function GET(request: Request): Promise<Response> {
  const confmKey = process.env.JUSO_API_KEY;
  if (!confmKey) {
    return htmlResponse(noticeHtml("주소 검색이 아직 설정되지 않았습니다."), 500);
  }
  return htmlResponse(openPopupHtml(confmKey, `${originOf(request)}${JUSO_CALLBACK_PATH}`));
}

export async function POST(request: Request): Promise<Response> {
  const juso = readJusoForm(await request.formData());
  if (!juso) {
    return htmlResponse(noticeHtml("주소를 가져오지 못했습니다. 창을 닫고 다시 시도해주세요."), 400);
  }
  return htmlResponse(selectedHtml(juso, originOf(request)));
}

// juso에 넘길 returnUrl은 절대 주소여야 한다. 배포 환경은 프록시 뒤라
// request.url이 내부 주소일 수 있어 x-forwarded-*를 먼저 본다.
function originOf(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

// 이 페이지는 우리 오리진에서 스크립트를 실행한다. 남의 사이트에 끼워져
// 클릭재킹에 쓰이지 않도록 프레임을 막고, 주소가 캐시에 남지 않게 한다.
function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-frame-options": "DENY",
    },
  });
}
