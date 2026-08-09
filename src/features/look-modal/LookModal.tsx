"use client";

import { useEffect, useRef } from "react";
import type { FriendLook } from "@/entities/look";
import { lookAlt, LookImage } from "@/entities/look";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useEscapeToClose } from "@/shared/lib/useEscapeToClose";
import { useBodyScrollLock } from "@/shared/lib/useBodyScrollLock";
import { CloseIcon } from "@/shared/ui/icons";
import { WornItem } from "./WornItem";
import { useLookProducts } from "./useLookProducts";

type Props = {
  look: FriendLook | null;
  onClose: () => void;
};

export function LookModal({ look, onClose }: Props) {
  const { locale, d } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = look !== null;
  const products = useLookProducts(look);

  useEscapeToClose(open, onClose);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus();
  }, [open]);

  if (!look) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="como-fade-in fixed inset-0 z-50 bg-black/40"
      />
      {/*
        래퍼는 pointer-events-none 이다. 이 래퍼가 화면 전체를 덮으므로,
        클릭을 통과시켜야 패널 바깥(여백) 클릭이 아래 오버레이에 닿아
        모달이 닫힌다. 패널만 pointer-events-auto 로 되돌린다.
      */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6 wide:p-10">
        {/*
          1단(기본)은 패널 전체가 스크롤한다. 2단(wide)은 반대로 패널이
          스크롤하지 않고 제품 컬럼만 스크롤하므로, 1단 기본값을
          wide:overflow-hidden 으로 상쇄해야 한다.

          2단 높이가 max-h 가 아니라 h 인 것이 이 레이아웃의 핵심이다.
          max-h 면 패널 높이가 콘텐츠에 의존해 순환 참조가 생기고,
          좌측 이미지의 h-full 이 해소되지 않는다. h 로 확정값을 주면
          이미지가 높이에서 폭을 파생시킬 수 있다(아래 참조).

          패널 폭은 wide:w-auto(shrink-to-fit) 대신 calc() 로 직접 계산한다.
          이미지 래퍼 자체는 aspect-3/4 + h-full 로 정확한 폭(예: 435px)을
          갖지만, 브라우저가 조상의 shrink-to-fit 폭을 구할 때는 그 결과가
          아니라 <img> 의 고유 크기(플레이스홀더 SVG 의 width=600)를 기준으로
          삼아, 패널이 실제 콘텐츠보다 넓어지고 우측에 빈 여백이 남는다.
          이미지 높이는 패널 높이가 아니라 (패널 높이 - 헤더 높이) 이고 폭은
          그 0.75배, 제품 컬럼은 고정 폭이므로, 같은 공식으로 폭을 유도해
          shrink-to-fit 추정에 기대지 않는다.

          이 세 값(패널 높이, 헤더 높이, 컬럼 폭)은 패널 높이 클래스와 폭
          calc() 공식, 아래 제품 컬럼 클래스까지 총 세 곳에서 쓰이므로,
          CSS 커스텀 프로퍼티(--modal-panel-h/--modal-header-h/--modal-col-w)로
          이 div 에 한 번만 선언하고 나머지는 전부 var() 로 참조한다. 값이
          바뀌어도 고칠 곳이 한 곳뿐이라, 위 우측 여백 버그가 조용히
          재발하지 않는다. (전역 --header-h 는 사이트 상단 헤더용 별개
          변수라 이름이 겹치지 않게 --modal- 접두사를 쓴다.)
        */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lookAlt(look, locale)}
          className="como-sheet-up pointer-events-auto flex max-h-[calc(100svh-3rem)] w-full max-w-160 flex-col overflow-y-auto overscroll-contain bg-surface pb-6 shadow-xl wide:[--modal-panel-h:min(calc(100svh-5rem),45rem)] wide:[--modal-header-h:3.75rem] wide:[--modal-col-w:20rem] wide:h-(--modal-panel-h) wide:max-h-none wide:w-[calc(0.75*(var(--modal-panel-h)-var(--modal-header-h))+var(--modal-col-w))] wide:max-w-[calc(100vw-5rem)] wide:overflow-hidden wide:pb-0"
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            {/*
              나이/키는 본문이 아니라 헤더에 둔다. 본문에 두면 2단에서
              이미지 컬럼 바닥에 붙어 잘린 것처럼 보였다. 헤더로 올리면
              본문이 이미지 | 제품 두 덩어리로 단순해진다.
            */}
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="shrink-0 text-sm text-foreground">
                {look.handle}
              </span>
              <span className="truncate text-xs text-muted">
                {look.modelInfo[locale]}
              </span>
            </div>
            <button
              ref={closeRef}
              type="button"
              aria-label={d.friends.close}
              onClick={onClose}
              className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center text-foreground hover:bg-sand"
            >
              <CloseIcon />
            </button>
          </div>

          {/*
            min-h-0 이 없으면 flex 자식이 콘텐츠 크기 아래로 줄지 못해
            패널의 확정 높이가 본문까지 전달되지 않는다.
          */}
          <div className="flex flex-col wide:min-h-0 wide:flex-1 wide:flex-row">
            {/*
              1단: 폭을 채우고 높이만 캡한다(비율이 깨지며 object-cover 로 잘린다).
              2단: h-full 로 확정 높이를 받고 aspect-3/4 가 거기서 폭을 계산한다.
                   w-auto 라 폭이 파생값이 되고, 이미지는 정확히 3:4 를 유지한다.
            */}
            <LookImage
              look={look}
              alt={lookAlt(look, locale)}
              className="max-h-[60svh] shrink-0 wide:h-full wide:max-h-none wide:w-auto"
            />

            {/*
              제품 컬럼만 스크롤한다. 가로모드 폰처럼 낮은 화면에서
              본문 높이가 제품 목록보다 짧아도, 이미지는 고정된 채
              목록만 스크롤된다.

              var(--modal-col-w)(20rem, 위 패널 div 에서 선언)이 기본 폭이고
              shrink 는 허용이다. 좁고 낮은 창에서 패널이 max-w 에 걸리면
              이 컬럼이 먼저 줄어 가로 넘침을 막는다.
            */}
            <div className="px-4 pt-6 wide:w-(--modal-col-w) wide:min-w-0 wide:overflow-y-auto wide:overscroll-contain wide:pb-6">
              <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">
                {d.friends.wearing}
              </h3>
              <ul>
                {products.map((product) => (
                  <WornItem
                    key={product.id}
                    product={product}
                    label={d.friends.viewProduct}
                    onNavigate={onClose}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

