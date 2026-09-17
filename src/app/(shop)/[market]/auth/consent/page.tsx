import { Suspense } from "react";
import { ConsentView } from "@/views/consent/ConsentView";

export default function ConsentPage() {
  return (
    <Suspense fallback={null}>
      <ConsentView />
    </Suspense>
  );
}
