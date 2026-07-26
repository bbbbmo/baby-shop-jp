"use client";

type ColorProps = {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
};

export function ColorPicker({ colors, selected, onSelect }: ColorProps) {
  return (
    <div className="flex gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onSelect(c)}
          style={{ backgroundColor: c }}
          className={`h-8 w-8 rounded-full ring-1 ring-black/10 transition ${
            selected === c ? "outline outline-2 outline-offset-2 outline-sage" : ""
          }`}
        />
      ))}
    </div>
  );
}

type SizeProps = {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
};

export function SizePicker({ sizes, selected, onSelect }: SizeProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className={sizeClass(selected === s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function sizeClass(active: boolean): string {
  const activeCls = "border-sage bg-sage text-white";
  const idleCls = "border-border text-foreground hover:border-sage";
  return `min-w-14 rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? activeCls : idleCls}`;
}
