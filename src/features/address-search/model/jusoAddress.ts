// 도로명주소 API가 돌려주는 항목 중 우리가 쓰는 것만 추린 모양.
export type JusoAddress = {
  zipNo: string;
  roadAddrPart1: string;
  siNm: string;
  sggNm: string;
  // 유일하게 juso가 아니라 사용자가 팝업 안에서 직접 친 값(동·호수).
  addrDetail: string;
};

export type AddressFields = {
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  building: string;
};

// roadAddrPart1은 "서울특별시 강남구 테헤란로 152"처럼 시도·시군구를 포함한다.
// 그대로 넣으면 prefecture·city와 중복되므로 앞부분을 떼어낸다.
// 세종특별자치시처럼 시군구가 없는 곳은 sggNm이 빈 문자열로 오므로,
// 빈 값을 걸러 접두사를 만들어야 공백이 겹치지 않는다.
export function jusoToAddressFields(juso: JusoAddress): AddressFields {
  const prefix = `${[juso.siNm, juso.sggNm].filter(Boolean).join(" ")} `;
  const addressLine = juso.roadAddrPart1.startsWith(prefix)
    ? juso.roadAddrPart1.slice(prefix.length)
    : juso.roadAddrPart1;
  return {
    postalCode: juso.zipNo,
    prefecture: juso.siNm,
    city: juso.sggNm,
    addressLine,
    building: juso.addrDetail,
  };
}
