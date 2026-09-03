import { notFound } from "next/navigation";
import { MockPayView } from "@/views/mock-pay/MockPayView";

export default function MockPayPage() {
  // 가짜 결제창은 개발·테스트 전용이다. 운영에는 존재하지 않아야 한다.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <MockPayView />;
}
