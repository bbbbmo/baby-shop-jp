"use client";

import { useEffect, useRef } from "react";

// 휴대폰 사용자는 모달을 뒤로가기로 닫으려 한다. 그대로 두면 뒤로가기가
// 화면 자체를 벗어나, 회원가입 도중이라면 입력값이 날아간다.
// 열 때 히스토리 항목을 하나 넣어 두면 뒤로가기가 그 항목만 소비한다.
export function useHistoryBackToClose(active: boolean, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useHistoryEntry(active, close);
}

// 의존성은 active 하나뿐이어야 한다. onClose를 넣으면 호출부의 인라인 함수
// 때문에 렌더마다 effect가 다시 돌아, 히스토리 항목을 넣었다 뺐다 반복하며
// 뒤로가기가 어긋난다. 그래서 콜백은 ref로 받는다.
function useHistoryEntry(active: boolean, close: React.RefObject<() => void>) {
  useEffect(() => {
    if (!active) {
      return;
    }
    window.history.pushState(null, "");
    let closedByBack = false;
    const onPop = () => {
      closedByBack = true;
      close.current();
    };
    window.addEventListener("popstate", onPop);
    return () => cleanUp(onPop, closedByBack);
  }, [active, close]);
}

// 닫기 버튼으로 닫았으면 넣어둔 항목이 남아 있다. 그대로 두면 다음 뒤로가기가
// 아무 일도 안 하는 것처럼 보인다.
//
// history.state에 표시를 남겨 판단하면 안 된다 — Next 라우터가 pushState를
// 가로채 자기 내부 상태와 합쳐버려서, 뒤로 간 뒤에도 그 표시가 남아 있다.
// 지역 변수로 "뒤로가기로 닫혔는지"를 직접 기억한다.
function cleanUp(onPop: () => void, closedByBack: boolean): void {
  window.removeEventListener("popstate", onPop);
  if (!closedByBack) {
    window.history.back();
  }
}
