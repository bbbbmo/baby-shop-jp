import type { LegalDocument } from "./types";

// 아직 모르는 사업자 정보는 감추지 않고 본문에 그대로 드러낸다. 조용히 빼면
// 법정 기재사항이 빠진 줄 모르고 배포한다. 눈에 보이면 채우게 된다.
//
// 전각 대괄호를 쓰는 이유는 본문에 "[필수]" 같은 일반 대괄호가 나오기 때문이다.
// 같은 기호를 쓰면 멀쩡한 문구를 미입력으로 잘못 잡는다.
export function placeholder(label: string): string {
  return `［${label} 미입력］`;
}

const PLACEHOLDER_PATTERN = /［([^］]+)\s미입력］/g;

// 문서에 남은 미입력 항목 이름을 중복 없이, 나온 순서대로 돌려준다.
export function findPlaceholders(document: LegalDocument): string[] {
  const text = document.sections
    .flatMap((section) => [section.heading, ...section.paragraphs])
    .join("\n");
  const labels = [...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]!);
  return [...new Set(labels)];
}
