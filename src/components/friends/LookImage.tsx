import type { FriendLook } from "@/lib/types";

type Props = {
  look: FriendLook;
  alt: string;
  className?: string;
};

/**
 * 룩 사진을 3:4 비율 박스에 렌더한다.
 *
 * 현재 자산이 SVG 자리표시 파일이라 next/image 대신 일반 img 를 쓴다.
 * Next 의 이미지 옵티마이저는 dangerouslyAllowSVG 없이는 SVG 를 처리하지
 * 않는다. 실제 사진(.jpg)으로 교체할 때 이 파일만 next/image 로 바꾸면 된다.
 */
export function LookImage({ look, alt, className = "" }: Props) {
  return (
    <div className={`aspect-[3/4] overflow-hidden bg-sand ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={look.imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
