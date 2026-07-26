"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-full border border-border">
      <StepButton label="−" onClick={() => onChange(value - 1)} />
      <span className="w-9 text-center text-sm">{value}</span>
      <StepButton label="＋" onClick={() => onChange(value + 1)} />
    </div>
  );
}

function StepButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center text-muted hover:text-foreground"
    >
      {label}
    </button>
  );
}
