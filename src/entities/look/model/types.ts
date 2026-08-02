import type { Localized } from "@/shared/i18n/types";

export type FriendLook = {
  id: string;
  handle: string;
  imageSrc: string;
  modelInfo: Localized;
  productIds: string[];
};
