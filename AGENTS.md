<!-- BEGIN:nextjs-agent-rules -->
# 이 Next.js는 기존에 알던 것과 다릅니다

이 버전은 브레이킹 체인지가 있습니다. API, 컨벤션, 파일 구조가 학습 데이터와 다를 수 있습니다. 코드를 작성하기 전에 `node_modules/next/dist/docs/`의 관련 가이드를 읽고, 디프리케이션 안내를 따르세요.
<!-- END:nextjs-agent-rules -->

# 아키텍처 & 상태

## Feature-Sliced Design (FSD)를 따르세요

- FSD 레이어로 코드를 구성하세요: `app` → `pages` → `widgets` → `features` → `entities` → `shared`.
- 단방향 import만 허용합니다 (상위 레이어 → 하위 레이어. 역방향 금지).
- 슬라이스별 `index.ts` public API를 우선하고, 슬라이스 간 깊은 경로 import는 피하세요.
- 가능하면 UI, model, lib를 해당 슬라이스 안에 함께 두세요.

## Zustand는 최대한 배제하세요

- 기본적으로 새 Zustand 스토어를 만들지 마세요.
- 새 기능에는 React state (`useState` / `useReducer`), Context, URL/search params, 또는 서버 상태를 우선하세요.
- 기존 Zustand (`src/store` 등)는 마이그레이션하거나, 더 단순한 대안이 없을 때만 수정하세요.
- 전역 클라이언트 상태가 불가피하면 새 Zustand 스토어보다 얇은 Context + reducer(또는 유사 패턴)를 선호하세요.
