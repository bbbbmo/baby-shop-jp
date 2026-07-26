"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/types";
import { useLocale } from "@/i18n/LocaleProvider";
import { slides, type Slide } from "@/lib/slides";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

const INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

export function HeroCarousel() {
  const { locale } = useLocale();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % slides.length);
  }, []);
  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useAutoAdvance(paused, goNext);
  const swipe = useSwipe(goPrev, goNext);

  return (
    <section
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
      className="relative min-h-[calc(100svh-6rem)] overflow-hidden"
    >
      {slides.map((slide, i) => (
        <SlideView
          key={slide.id}
          slide={slide}
          locale={locale}
          active={i === index}
        />
      ))}
      <Arrow dir="prev" label="previous" onClick={goPrev} />
      <Arrow dir="next" label="next" onClick={goNext} />
      <Dots count={slides.length} index={index} onSelect={setIndex} />
    </section>
  );
}

function useAutoAdvance(paused: boolean, onNext: () => void) {
  useEffect(() => {
    if (paused || prefersReducedMotion()) {
      return;
    }
    const id = setInterval(onNext, INTERVAL);
    return () => clearInterval(id);
  }, [paused, onNext]);
}

function useSwipe(onPrev: () => void, onNext: () => void) {
  const startX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) < SWIPE_THRESHOLD) {
      return;
    }
    if (dx < 0) {
      onNext();
      return;
    }
    onPrev();
  };
  return { onTouchStart, onTouchEnd };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type SlideViewProps = { slide: Slide; locale: Locale; active: boolean };

function SlideView({ slide, locale, active }: SlideViewProps) {
  const vis = active ? "opacity-100" : "pointer-events-none opacity-0";
  return (
    <div
      aria-hidden={!active}
      className={`absolute inset-0 flex items-center transition-opacity duration-700 ${slide.gradient} ${vis}`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
        <div className="max-w-lg">
          <p className="mb-3 text-sm font-medium tracking-wide text-sage">
            {slide.eyebrow[locale]}
          </p>
          <h2 className="whitespace-pre-line text-4xl font-bold leading-tight text-foreground md:text-6xl">
            {slide.title[locale]}
          </h2>
          <p className="mt-4 text-sm text-muted md:text-base">
            {slide.subtitle[locale]}
          </p>
          <Link
            href={slide.href}
            className="mt-8 inline-flex items-center rounded-full bg-foreground px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {slide.cta[locale]}
          </Link>
        </div>
        <span className="pointer-events-none hidden select-none text-[13rem] opacity-70 md:block">
          {slide.emoji}
        </span>
      </div>
    </div>
  );
}

type ArrowProps = { dir: "prev" | "next"; label: string; onClick: () => void };

function Arrow({ dir, label, onClick }: ArrowProps) {
  const pos = dir === "prev" ? "left-3" : "right-3";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/80 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-surface ${pos}`}
    >
      {dir === "prev" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </button>
  );
}

type DotsProps = { count: number; index: number; onSelect: (i: number) => void };

function Dots({ count, index, onSelect }: DotsProps) {
  return (
    <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`slide ${i + 1}`}
          onClick={() => onSelect(i)}
          className={dotClass(i === index)}
        />
      ))}
    </div>
  );
}

function dotClass(active: boolean): string {
  const state = active ? "w-6 bg-foreground" : "w-2 bg-foreground/30";
  return `h-2 rounded-full transition-all ${state}`;
}
