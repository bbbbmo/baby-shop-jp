import { Suspense } from "react";
import { EmailConfirmedView } from "@/views/email-confirmed/EmailConfirmedView";

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <EmailConfirmedView />
    </Suspense>
  );
}
