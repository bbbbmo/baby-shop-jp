"use client";

import { useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { jusoToAddressFields, type AddressFields, type JusoAddress } from "./model/jusoAddress";

export function AddressSearch({ onSelect }: { onSelect: (fields: AddressFields) => void }) {
  const { d } = useLocale();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<JusoAddress[]>([]);
  const [failed, setFailed] = useState(false);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    setSearching(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/address/search?q=${encodeURIComponent(keyword)}`);
      const body = (await res.json()) as { addresses?: JusoAddress[] };
      setResults(body.addresses ?? []);
      setFailed(!res.ok);
    } catch {
      setFailed(true);
    } finally {
      setSearching(false);
    }
  };

  // 이 입력란은 체크아웃 <form> 안에 있다. 검색 버튼의 type="button"은 클릭만
  // 막을 뿐, Enter로 인한 브라우저의 암묵적 제출은 막지 못한다. 그대로 두면
  // 주소를 다시 검색하려고 Enter를 눌렀을 때 옛 주소로 주문이 나간다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") {
      return;
    }
    e.preventDefault();
    if (keyword.trim().length > 0 && !searching) {
      void search();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={d.checkout.addressSearchPlaceholder}
          className="h-11 flex-1 border border-border bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-sage"
        />
        <button
          type="button"
          onClick={search}
          disabled={keyword.trim().length === 0 || searching}
          className="bg-foreground px-4 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.checkout.addressSearchButton}
        </button>
      </div>
      {failed && <p className="text-sm text-sale">{d.checkout.addressSearchFailed}</p>}
      <AddressResults results={results} onSelect={(j) => onSelect(jusoToAddressFields(j))} />
    </div>
  );
}

function AddressResults({
  results,
  onSelect,
}: {
  results: JusoAddress[];
  onSelect: (juso: JusoAddress) => void;
}) {
  if (results.length === 0) {
    return null;
  }
  return (
    <ul className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
      {results.map((juso) => (
        <li key={`${juso.zipNo}-${juso.roadAddrPart1}`}>
          <button
            type="button"
            onClick={() => onSelect(juso)}
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-sand"
          >
            <span className="text-xs text-muted">{juso.zipNo}</span> {juso.roadAddrPart1}
          </button>
        </li>
      ))}
    </ul>
  );
}
