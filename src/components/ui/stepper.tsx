"use client";

import { Minus, Plus } from "lucide-react";

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label: string;
  invalid?: boolean;
};

/** A big number with − and + either side, and room to type it straight in. */
export const Stepper = ({ value, onChange, min = 1, max, label, invalid = false }: StepperProps) => {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="flex items-stretch gap-3">
      <button
        type="button"
        aria-label="زيادة"
        onClick={() => onChange(clamp((value || 0) + 1))}
        disabled={value >= max}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control bg-primary text-white shadow-sm transition active:scale-95 disabled:opacity-40"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
      <input
        aria-label={label}
        aria-invalid={invalid || undefined}
        inputMode="numeric"
        pattern="[0-9]*"
        value={Number.isFinite(value) && value > 0 ? String(value) : ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/[^0-9]/g, "");
          onChange(digits ? Math.min(max, Number(digits)) : 0);
        }}
        onFocus={(event) => event.target.select()}
        placeholder="0"
        className={`h-16 min-w-0 flex-1 rounded-control border bg-surface text-center text-4xl font-extrabold text-ink tabular placeholder:text-faint focus:outline-none focus:ring-4 focus:ring-primary/12 ${
          invalid ? "border-danger" : "border-hairline focus:border-primary"
        }`}
      />
      <button
        type="button"
        aria-label="إنقاص"
        onClick={() => onChange(clamp((value || 0) - 1))}
        disabled={value <= min}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control border border-hairline bg-surface text-ink transition active:scale-95 disabled:opacity-40"
      >
        <Minus size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
};
