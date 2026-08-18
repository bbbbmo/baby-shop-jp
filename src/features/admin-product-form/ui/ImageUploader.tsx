"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/shared/api/adminFetch";
import type { AdminProductImage } from "@/shared/api/supabase/admin";

export function ImageUploader({ productId, images }: { productId: string; images: AdminProductImage[] }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-product-images", productId] });

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    await Promise.all(Array.from(files).map((file) => uploadOne(productId, file)));
    setUploading(false);
    invalidate();
  };

  const onDelete = async (imageId: string) => {
    await adminFetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
    invalidate();
  };

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-sm font-bold text-foreground">상품 이미지</h2>
      <ImageGrid images={images} onDelete={onDelete} />
      <input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => onUpload(e.target.files)} className="mt-3 text-sm" />
    </div>
  );
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
