"use client";

import { useCallback, useEffect, useState } from "react";
import { JUSO_CALLBACK_PATH, readJusoMessage } from "./jusoPopup";
import { jusoToAddressFields, type AddressFields } from "./jusoAddress";

// juso 화면은 X-Frame-Options: SAMEORIGIN이라 iframe으로 못 띄운다. 별도 창만 된다.
const POPUP_FEATURES = "width=570,height=480,scrollbars=yes,resizable=yes";

// 팝업이 고른 주소를 postMessage로 돌려준다. 팝업은 juso로 갔다가 우리 오리진의
// 콜백 라우트로 돌아오므로, 그때 opener(이 창)와 다시 같은 오리진이 된다.
function useJusoMessage(onSelect: (fields: AddressFields) => void): void {
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const juso = readJusoMessage(event.data);
      if (juso) {
        onSelect(jusoToAddressFields(juso));
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onSelect]);
}

export function useJusoPopup(onSelect: (fields: AddressFields) => void) {
  const [blocked, setBlocked] = useState(false);
  useJusoMessage(onSelect);

  // 클릭 핸들러 안에서 곧바로 열어야 팝업 차단에 걸리지 않는다.
  const open = useCallback(() => {
    const popup = window.open(JUSO_CALLBACK_PATH, "jusoPopup", POPUP_FEATURES);
    setBlocked(popup === null);
    popup?.focus();
  }, []);

  return { open, blocked };
}
