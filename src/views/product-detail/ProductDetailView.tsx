"use client";

import { notFound, useParams } from "next/navigation";
import { getProduct } from "@/entities/product";
import { ProductDetail } from "./ProductDetail";

export function ProductDetailView() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
