import { NextResponse } from "next/server";
import type { JusoAddress } from "@/features/address-search/model/jusoAddress";

const JUSO_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

export async function GET(request: Request): Promise<NextResponse> {
  const keyword = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (keyword.length === 0) {
    return NextResponse.json({ addresses: [] });
  }
  const apiKey = process.env.JUSO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "notConfigured" }, { status: 500 });
  }
  try {
    return NextResponse.json({ addresses: await searchJuso(apiKey, keyword) });
  } catch {
    return NextResponse.json({ error: "searchFailed" }, { status: 502 });
  }
}

async function searchJuso(apiKey: string, keyword: string): Promise<JusoAddress[]> {
  const url = new URL(JUSO_ENDPOINT);
  url.searchParams.set("confmKey", apiKey);
  url.searchParams.set("currentPage", "1");
  url.searchParams.set("countPerPage", "10");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("resultType", "json");

  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json()) as JusoResponse;
  if (body.results?.common?.errorCode !== "0") {
    throw new Error(body.results?.common?.errorMessage ?? "unknown");
  }
  return body.results.juso ?? [];
}

type JusoResponse = {
  results?: {
    common?: { errorCode?: string; errorMessage?: string };
    juso?: JusoAddress[];
  };
};
