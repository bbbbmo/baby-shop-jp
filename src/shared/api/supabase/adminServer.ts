import { supabaseServer } from "./serverClient";

// 관리자 Route Handler 전용 서버 헬퍼 — service-role 클라이언트를 쓰므로
// "use client" 코드에서 절대 import 하지 않는다.

export const PRODUCT_IMAGES_BUCKET = "product-images";

export async function productImageUrls(productId: string): Promise<string[]> {
  const { data } = await supabaseServer
    .from("product_images")
    .select("url")
    .eq("product_id", productId);
  return (data ?? []).map((row) => row.url);
}

/** 비-ASCII/특수문자를 Storage 키에 안전한 문자로 치환한다 (업로드 500 방지). */
export function sanitizeStorageFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

/** 공개 URL에서 Storage 객체 경로를 역산해 실제 파일까지 지운다. */
export async function removeProductImageFiles(urls: string[]): Promise<void> {
  const paths = urls.flatMap(toStoragePath);
  if (paths.length > 0) {
    await supabaseServer.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  }
}

function toStoragePath(url: string): string[] {
  const path = url.split(`/${PRODUCT_IMAGES_BUCKET}/`)[1];
  // getPublicUrl이 encodeURI로 만든 URL이므로 decodeURI가 정확한 역변환.
  return path ? [decodeURI(path)] : [];
}

/** order_items FK(23503) 위반은 "주문 이력 있음"으로 구분해 409로 내보낸다. */
export function toFailureCode(error: { code?: string } | null): string | null {
  if (!error) return null;
  return error.code === "23503" ? "orderHistoryExists" : "unknownError";
}

export function failureStatus(code: string): number {
  return code === "orderHistoryExists" ? 409 : 500;
}
