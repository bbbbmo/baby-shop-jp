import { describe, expect, it } from "vitest";
import { jusoToAddressFields, type JusoAddress } from "./jusoAddress";

const base: JusoAddress = {
  zipNo: "06232",
  roadAddrPart1: "서울특별시 강남구 테헤란로 152",
  siNm: "서울특별시",
  sggNm: "강남구",
  addrDetail: "",
};

describe("jusoToAddressFields", () => {
  it("splits the road address into region, city and the rest", () => {
    expect(jusoToAddressFields(base)).toEqual({
      postalCode: "06232",
      prefecture: "서울특별시",
      city: "강남구",
      addressLine: "테헤란로 152",
      building: "",
    });
  });

  it("handles a region with no city level", () => {
    // 세종특별자치시는 시군구가 없어 sggNm이 빈 문자열로 온다.
    // 접두사를 그대로 이으면 공백이 겹쳐 잘려나가지 않는다.
    const sejong: JusoAddress = {
      zipNo: "30151",
      roadAddrPart1: "세종특별자치시 한누리대로 2130",
      siNm: "세종특별자치시",
      sggNm: "",
      addrDetail: "",
    };
    expect(jusoToAddressFields(sejong)).toEqual({
      postalCode: "30151",
      prefecture: "세종특별자치시",
      city: "",
      addressLine: "한누리대로 2130",
      building: "",
    });
  });

  it("keeps the road address whole when it does not start with the region", () => {
    const odd: JusoAddress = { ...base, roadAddrPart1: "테헤란로 152" };
    expect(jusoToAddressFields(odd).addressLine).toBe("테헤란로 152");
  });

  it("carries the detail address the user typed in the popup", () => {
    // 팝업 안에서 입력한 동·호수다. 버리면 사용자가 주문서에서 다시 쳐야 한다.
    const withDetail: JusoAddress = { ...base, addrDetail: "101동 1503호" };
    expect(jusoToAddressFields(withDetail).building).toBe("101동 1503호");
  });

  it("handles a district with a space in its name", () => {
    const withSpace: JusoAddress = {
      zipNo: "13529",
      roadAddrPart1: "경기도 성남시 분당구 판교역로 235",
      siNm: "경기도",
      sggNm: "성남시 분당구",
      addrDetail: "",
    };
    expect(jusoToAddressFields(withSpace).addressLine).toBe("판교역로 235");
  });
});
