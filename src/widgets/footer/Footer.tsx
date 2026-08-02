"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { InstagramIcon } from "@/shared/ui/icons";

export function Footer() {
  const { d } = useLocale();

  return (
    <footer className="mt-20 border-t border-border bg-sand">
      <div className="mx-auto max-w-480 px-6 py-12 sm:px-10">
        <a
          href="https://www.instagram.com/como_kr/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="inline-flex text-black hover:opacity-70"
        >
          <InstagramIcon className="h-6 w-6" />
        </a>
        <div className="mt-6 text-sm text-black">
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
