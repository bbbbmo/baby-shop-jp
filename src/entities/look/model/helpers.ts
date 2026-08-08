import type { FriendLook } from "./types";
import type { Locale } from "@/shared/i18n/types";

/** 홈 섹션 캐러셀에 노출하는 룩. 전체 열람은 /friends 가 담당한다. */
export const homeLooks = (looks: FriendLook[]): FriendLook[] => looks.slice(0, 8);

/** 이미지 alt 문구. 룩별 코멘트가 없으므로 핸들과 모델정보를 조합한다. */
export const lookAlt = (look: FriendLook, locale: Locale): string =>
  `${look.handle} / ${look.modelInfo[locale]}`;
