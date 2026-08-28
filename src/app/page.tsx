import Link from "next/link";
import type { Market } from "@/shared/config/markets";

// 방문자가 아직 언어를 고르지 않은 유일한 화면이라 사전(dictionaries)을 쓸 수 없다.
// 사전은 로케일별로 갈라져 있기 때문이다. 각 선택지를 자기 언어로 직접 적는다.
//
// 언어만 보여주지 않고 통화·배송지를 함께 적는 이유는, 마켓을 잘못 고르면
// 가격과 배송 국가가 통째로 달라지기 때문이다. 무엇을 고르는 것인지 드러나야 한다.
const CHOICES: { market: Market; language: string; detail: string }[] = [
  { market: "jp", language: "日本語", detail: "円でのお支払い · 日本国内へ配送" },
  { market: "kr", language: "한국어", detail: "원화 결제 · 국내 배송" },
];

// 브랜드명은 두 로케일에서 같은 값이라 여기서는 그대로 적는다.
const BRAND_NAME = "COMO";

export default function RootPage() {
  return (
    <main className="mx-auto flex w-full max-w-480 flex-1 flex-col items-center justify-center gap-12 px-6 py-20 sm:px-10">
      <h1
        style={{ fontFamily: "var(--font-noto-jp)" }}
        className="text-3xl font-bold tracking-tight text-foreground"
      >
        {BRAND_NAME}
      </h1>
      <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
        {CHOICES.map((choice) => (
          <MarketChoice key={choice.market} {...choice} />
        ))}
      </div>
    </main>
  );
}

function MarketChoice({
  market,
  language,
  detail,
}: {
  market: Market;
  language: string;
  detail: string;
}) {
  return (
    <Link
      href={`/${market}`}
      className="border border-border bg-surface px-6 py-10 text-center transition-colors hover:bg-sand"
    >
      <span className="block text-lg font-medium text-foreground">{language}</span>
      <span className="mt-3 block text-xs leading-relaxed text-muted">{detail}</span>
    </Link>
  );
}
