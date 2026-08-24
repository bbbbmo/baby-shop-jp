"use client";

/** 관리자 API 호출 전용 — 인증은 쿠키(세션)로 자동 처리된다. */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, init);
}
