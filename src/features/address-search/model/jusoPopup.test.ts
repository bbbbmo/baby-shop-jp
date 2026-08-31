import { describe, expect, it } from "vitest";
import {
  JUSO_MESSAGE_TYPE,
  openPopupHtml,
  readJusoForm,
  readJusoMessage,
  scriptJson,
  selectedHtml,
} from "./jusoPopup";
import type { JusoAddress } from "./jusoAddress";

const seoul: JusoAddress = {
  zipNo: "06232",
  roadAddrPart1: "서울특별시 강남구 테헤란로 152",
  siNm: "서울특별시",
  sggNm: "강남구",
};

// juso가 returnUrl로 돌려보내는 폼에는 26개 항목이 들어 있다. 여기서는
// 우리가 쓰는 네 개와, 무시해야 하는 항목 하나만 흉내 낸다.
const jusoForm = (fields: Partial<Record<string, string>>): FormData => {
  const form = new FormData();
  form.set("roadFullAddr", "서울특별시 강남구 테헤란로 152");
  form.set("zipNo", "06232");
  form.set("roadAddrPart1", "서울특별시 강남구 테헤란로 152");
  form.set("siNm", "서울특별시");
  form.set("sggNm", "강남구");
  Object.entries(fields).forEach(([key, value]) => form.set(key, value ?? ""));
  return form;
};

describe("readJusoForm", () => {
  it("picks the four fields we use out of the juso post", () => {
    expect(readJusoForm(jusoForm({}))).toEqual(seoul);
  });

  it("accepts an empty sggNm", () => {
    // 세종특별자치시는 시군구가 없어 빈 값으로 온다. 이걸 거절하면
    // 세종 주소를 아예 고를 수 없게 된다.
    const sejong = jusoForm({
      zipNo: "30151",
      roadAddrPart1: "세종특별자치시 한누리대로 2130",
      siNm: "세종특별자치시",
      sggNm: "",
    });
    expect(readJusoForm(sejong)?.sggNm).toBe("");
  });


  it("returns null when the postal code is missing", () => {
    expect(readJusoForm(jusoForm({ zipNo: "" }))).toBeNull();
  });

  it("returns null when the road address is missing", () => {
    expect(readJusoForm(jusoForm({ roadAddrPart1: "" }))).toBeNull();
  });
});

describe("readJusoMessage", () => {
  it("accepts the message our own callback page sends", () => {
    expect(readJusoMessage({ type: JUSO_MESSAGE_TYPE, juso: seoul })).toEqual(seoul);
  });

  it("ignores messages from other senders", () => {
    // 같은 오리진의 다른 스크립트(확장 프로그램, 라이브러리)도 message를 보낸다.
    // 타입 표시가 없으면 주소 칸이 엉뚱한 값으로 덮인다.
    expect(readJusoMessage({ type: "webpackHotUpdate" })).toBeNull();
    expect(readJusoMessage("hello")).toBeNull();
    expect(readJusoMessage(null)).toBeNull();
    expect(readJusoMessage({ type: JUSO_MESSAGE_TYPE, juso: { zipNo: "06232" } })).toBeNull();
  });
});

describe("scriptJson", () => {
  it("escapes < so a value cannot close the script tag", () => {
    // 이 라우트는 juso가 아니라 누구나 POST할 수 있다. 값을 그대로 <script>에
    // 넣으면 우리 오리진에서 임의 스크립트가 실행된다.
    const json = scriptJson({ zipNo: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json)).toEqual({ zipNo: "</script><script>alert(1)</script>" });
  });

  it("escapes the line separators that break javascript string literals", () => {
    expect(scriptJson("a b c")).toBe('"a\\u2028b\\u2029c"');
  });
});

describe("openPopupHtml", () => {
  it("submits the key and the return url to juso", () => {
    const html = openPopupHtml("devKEY==", "https://como.example/api/address/juso");
    expect(html).toContain('action="https://business.juso.go.kr/addrlink/addrLinkUrl.do"');
    expect(html).toContain('name="confmKey" value="devKEY=="');
    expect(html).toContain('name="returnUrl" value="https://como.example/api/address/juso"');
  });

  it("escapes quotes so a value cannot escape its attribute", () => {
    expect(openPopupHtml('" onload="alert(1)', "https://como.example")).not.toContain(
      'onload="alert(1)',
    );
  });
});

describe("selectedHtml", () => {
  it("posts the address back to the opener on our own origin only", () => {
    const html = selectedHtml(seoul, "https://como.example");
    expect(html).toContain("window.opener.postMessage(");
    expect(html).toContain('"zipNo":"06232"');
    expect(html).toContain('"https://como.example"');
  });
});
