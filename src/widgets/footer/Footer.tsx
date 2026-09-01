"use client";

import Link from "next/link";
import { BUSINESS_INFO } from "@/entities/legal";
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
          <p>
            Company Name : {BUSINESS_INFO.companyName} | Owner : {BUSINESS_INFO.ownerName}
          </p>
          <p>Personal Info Manager : {BUSINESS_INFO.privacyOfficer}</p>
          <p>Business Registration : {BUSINESS_INFO.registrationNumber}</p>
          <p>Mail-order Sales : {BUSINESS_INFO.mailOrderNumber}</p>
          <p>Address : {BUSINESS_INFO.address}</p>
          <p className="mt-4">customer</p>
          <p>JP : {BUSINESS_INFO.phoneJp}</p>
          <p>KR : {BUSINESS_INFO.phoneKr}</p>
          <p>Email : {BUSINESS_INFO.email}</p>
        </div>
        {/* 마켓 선택 화면으로 돌아가는 유일한 길. MarketLink를 쓰면 "/"에
            현재 마켓 접두사가 붙어 선택 화면 대신 홈으로 가버린다. */}
        <Link
          href="/"
          className="mt-10 inline-block text-xs text-muted underline underline-offset-2 hover:text-foreground"
        >
          日本語 / 한국어
        </Link>
        <p className="mt-4 text-xs text-muted">
          © {new Date().getFullYear()} {d.brandName}. {d.footer.note}
        </p>
      </div>
    </footer>
  );
}
