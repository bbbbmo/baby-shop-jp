"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminProducts } from "./model/useAdminProducts";
import { QueryGuard } from "@/shared/ui/QueryGuard";
import { adminFetch } from "@/shared/api/adminFetch";
import { formatPrice } from "@/shared/lib/format";
import type { AdminProductListItem } from "@/shared/api/supabase/admin";

export function AdminProductListView() {
  const { data, isLoading, error } = useAdminProducts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Header />
      <QueryGuard isLoading={isLoading} error={error}>
        <ProductTable products={data ?? []} />
      </QueryGuard>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-bold text-foreground">상품 관리</h1>
      <Link href="/admin/products/new" className="bg-foreground px-4 py-2 text-sm text-white hover:opacity-90">
        + 신규 등록
      </Link>
    </div>
  );
}

function ProductTable({ products }: { products: AdminProductListItem[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted">
          <th className="py-2 pr-3 font-normal">이미지</th>
          <th className="py-2 pr-3 font-normal">상품명</th>
          <th className="py-2 pr-3 font-normal">브랜드</th>
          <th className="py-2 pr-3 font-normal">카테고리</th>
          <th className="py-2 pr-3 font-normal">가격</th>
          <th className="py-2 pr-3 font-normal">재고</th>
          <th className="py-2 pr-3 font-normal">상태</th>
          <th className="py-2 pr-3" />
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </tbody>
    </table>
  );
}

const DELETE_FAILED = "삭제에 실패했습니다";
const ORDER_HISTORY_EXISTS = "주문 이력이 있어 삭제할 수 없습니다. 품절 처리해 주세요.";

async function deleteProduct(id: string): Promise<string | null> {
  try {
    const res = await adminFetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.status === 409) return ORDER_HISTORY_EXISTS;
    return res.ok ? null : DELETE_FAILED;
  } catch {
    return DELETE_FAILED;
  }
}

function ProductRow({ product }: { product: AdminProductListItem }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const onDelete = async () => {
    if (!window.confirm(`"${product.nameJa}"을(를) 삭제하시겠습니까?`)) return;
    const message = await deleteProduct(product.id);
    setError(message);
    if (!message) queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };
  return (
    <tr className="border-b border-border">
      <td className="py-2 pr-3">
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnailUrl} alt="" className="h-12 w-12 object-cover" />
        ) : (
          <div className="h-12 w-12 bg-sand" />
        )}
      </td>
      <td className="py-2 pr-3">{product.nameJa}</td>
      <td className="py-2 pr-3">{product.brandName}</td>
      <td className="py-2 pr-3">{product.category}</td>
      {/* /admin은 [market] 밖이라 MarketProvider가 없다. 엔화로 고정한다(Task 6에서 원화 열 추가 예정). */}
      <td className="py-2 pr-3">{formatPrice(product.price, "JPY")}</td>
      <td className="py-2 pr-3">{product.totalStock}</td>
      <td className="py-2 pr-3">{product.soldOut ? "품절" : "판매중"}</td>
      <td className="py-2 pr-3 whitespace-nowrap">
        <Link href={`/admin/products/${product.id}/edit`} className="mr-3 underline">수정</Link>
        <button type="button" onClick={onDelete} className="text-sale underline">삭제</button>
        {error && <p className="mt-1 max-w-40 whitespace-normal text-xs text-sale">{error}</p>}
      </td>
    </tr>
  );
}
