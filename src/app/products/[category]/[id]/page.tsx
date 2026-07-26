"use client";

import { notFound, useParams } from "next/navigation";
import { getProduct } from "@/lib/products";
import { ProductDetail } from "@/components/product/ProductDetail";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
