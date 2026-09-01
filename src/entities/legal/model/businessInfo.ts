import { placeholder } from "./placeholders";

// 상호·대표자·연락처는 푸터에도 나오고 약관·처리방침에도 나온다. 세 곳에
// 따로 적으면 하나만 고치는 사고가 나는데, 법정 기재사항이 화면마다 다르면
// 그 자체가 문제다. 한 곳에서 읽는다.
//
// 아직 모르는 값은 placeholder로 둔다. 화면에 「미입력」이 그대로 보이고,
// findPlaceholders가 목록으로 뽑아준다.
export const BUSINESS_INFO = {
  companyName: "COMO",
  ownerName: "Lee Jinwoo",
  privacyOfficer: "Ikeya Moeri",
  email: "como@gmail.com",
  phoneJp: "080-4969-7532",
  phoneKr: placeholder("한국 연락처"),
  address: placeholder("사업장 주소"),
  registrationNumber: placeholder("사업자등록번호"),
  mailOrderNumber: placeholder("통신판매업 신고번호"),
  // 국외 이전 고지에 필요하다. Supabase 대시보드 → Settings → General → Region.
  dataRegion: placeholder("데이터 보관 리전"),
} as const;
