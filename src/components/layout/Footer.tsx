"use client";

import { useLocale } from "@/i18n/LocaleProvider";

export function Footer() {
  const { d } = useLocale();

  return (
    <footer className="mt-20 border-t border-border bg-sand">
      <div className="mx-auto max-w-480 px-6 py-12 sm:px-10">
        <div className="text-sm text-black">
          <p>Company Name : como | Owner : Lee Jinwoo</p>
          <p>Personal Info Manager :  Ikeya Moeri</p>
          <p className="mt-4">customer</p>
          <p>JP : 080-4969-7532</p>
          <p>KR：</p>
          <p>Email : como@gmail.com</p>
        </div>
        <p className="mt-10 text-xs text-muted">
          © {new Date().getFullYear()} {d.brandName}. {d.footer.note}
        </p>
      </div>
    </footer>
  );
}
