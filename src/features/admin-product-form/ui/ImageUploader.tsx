"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/shared/api/adminFetch";
import type { AdminProductImage } from "@/shared/api/supabase/admin";

export function ImageUploader({ productId, images }: { productId: string; images: AdminProductImage[] }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-product-images", productId] });

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-bold text-foreground">상품 이미지</h2>
      <ImageGrid images={images} onDelete={(id) => handleDelete(productId, id, setError, invalidate)} />
      {error && <p className="mt-2 text-sm text-sale">{error}</p>}
      <input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => handleUpload(e.target.files, productId, setUploading, setError, invalidate)} className="mt-3 text-sm" />
    </div>
  );
}

async function handleUpload(files: FileList | null, productId: string, setUploading: (v: boolean) => void, setError: (v: string | null) => void, invalidate: () => void) {
  if (!files || !files.length) return;
  setUploading(true);
  try {
    setError(null);
    const results = await Promise.all(Array.from(files).map((f) => uploadOne(productId, f)));
    if (!results.every((r) => r.ok)) { setError("일부 이미지 업로드에 실패했습니다"); return; }
    invalidate();
  } catch { setError("이미지 업로드 중 오류가 발생했습니다"); }
  finally { setUploading(false); }
}

async function handleDelete(productId: string, imageId: string, setError: (v: string | null) => void, invalidate: () => void) {
  setError(null);
  const res = await adminFetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
  if (!res.ok) {
    setError("이미지 삭제에 실패했습니다");
    return;
  }
  invalidate();
}

function uploadOne(productId: string, file: File): Promise<Response> {
  const body = new FormData();
  body.append("file", file);
  return adminFetch(`/api/admin/products/${productId}/images`, { method: "POST", body });
}

function ImageGrid({ images, onDelete }: { images: AdminProductImage[]; onDelete: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {images.map((img) => (
        <div key={img.id} className="relative h-24 w-24 bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={() => onDelete(img.id)} className="absolute right-0 top-0 bg-black/60 px-1.5 text-xs text-white">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
