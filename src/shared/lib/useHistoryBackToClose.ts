"use client";

import { useEffect } from "react";

// 휴대폰 사용자는 모달을 뒤로가기로 닫으려 한다. 그대로 두면 뒤로가기가
// 화면 자체를 벗어나, 회원가입 도중이라면 입력값이 날아간다.
// 열 때 히스토리 항목을 하나 넣어 두면 뒤로가기가 그 항목만 소비한다.
export function useHistoryBackToClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) {
      return;
    }
    window.history.pushState({ modal: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // 뒤로가기가 아니라 닫기 버튼으로 닫은 경우, 넣어둔 항목이 남아 있다.
      // 그대로 두면 다음 뒤로가기가 아무 일도 안 하는 것처럼 보인다.
      if (window.history.state?.modal) {
        window.history.back();
      }
    };
  }, [active, onClose]);
}
