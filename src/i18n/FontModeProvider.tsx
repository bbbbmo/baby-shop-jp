"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type FontMode = "slab" | "mono";

type FontModeContextValue = {
  fontMode: FontMode;
  setFontMode: (mode: FontMode) => void;
  toggleFontMode: () => void;
};

const STORAGE_KEY = "komo.fontMode";
const FontModeContext = createContext<FontModeContextValue | null>(null);

const isFontMode = (value: unknown): value is FontMode =>
  value === "slab" || value === "mono";

export function FontModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fontMode, setFontModeState] = useState<FontMode>("slab");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isFontMode(stored)) {
      setFontModeState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove(
      "font-mode-slab",
      "font-mode-mono",
    );
    document.documentElement.classList.add(`font-mode-${fontMode}`);
  }, [fontMode]);

  const setFontMode = useCallback((next: FontMode) => {
    setFontModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleFontMode = useCallback(() => {
    setFontMode(fontMode === "slab" ? "mono" : "slab");
  }, [fontMode, setFontMode]);

  const value = useMemo<FontModeContextValue>(
    () => ({ fontMode, setFontMode, toggleFontMode }),
    [fontMode, setFontMode, toggleFontMode],
  );

  return (
    <FontModeContext.Provider value={value}>
      {children}
    </FontModeContext.Provider>
  );
}

export function useFontMode(): FontModeContextValue {
  const ctx = useContext(FontModeContext);
  if (!ctx) {
    throw new Error("useFontMode must be used within FontModeProvider");
  }
  return ctx;
}
