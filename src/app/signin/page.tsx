import { Suspense } from "react";
import { SigninView } from "@/views/signin/SigninView";

export default function SigninPage() {
  return (
    <Suspense fallback={null}>
      <SigninView />
    </Suspense>
  );
}
