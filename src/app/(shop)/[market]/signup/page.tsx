import { Suspense } from "react";
import { SignupView } from "@/views/signup/SignupView";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupView />
    </Suspense>
  );
}
