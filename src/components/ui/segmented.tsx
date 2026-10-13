"use client";

import { ReactNode } from "react";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Classes for the chosen segment, so each option can wear its own colour. */
  selectedClassName?: string;
};

type SegmentedProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  size?: "md" | "lg";
};

/** A row of big tappable choices where exactly one is on. */
export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
}: SegmentedProps<T>) => (
  <div
    role="radiogroup"
    aria-label={label}
    className="grid gap-1 rounded-control bg-hairline-soft p-1"
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(option.value)}
          className={`flex items-center justify-center gap-2 rounded-[11px] font-bold transition ${
            size === "lg" ? "min-h-13 text-base" : "min-h-10 text-sm"
          } ${
            selected
              ? (option.selectedClassName ?? "bg-surface text-ink") + " shadow-sm"
              : "text-muted active:bg-surface/60"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      );
    })}
  </div>
);
