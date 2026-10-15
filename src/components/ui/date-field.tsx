"use client";

import { CalendarDays } from "lucide-react";
import { DateOverlay } from "@/components/ui/date-overlay";
import { formatFullDay } from "@/utils/dates";

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  error?: string;
  hint?: string;
};

/**
 * A date written the app's way ("13 تشرين الأول 2026") rather than the
 * browser's "mm/dd/yyyy". The real date input sits invisibly on top
 * (`DateOverlay`), so a tap opens the phone's own calendar.
 */
export const DateField = ({ label, value, onChange, min, max, error, hint }: DateFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="px-1 text-sm font-semibold text-muted">{label}</span>
    <span
      className={`relative flex min-h-12 items-center justify-between gap-2 rounded-control border bg-surface px-3.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12 ${
        error ? "border-danger" : "border-hairline"
      }`}
    >
      <span className={`truncate text-base ${value ? "font-bold text-ink" : "text-faint"}`}>
        {value ? formatFullDay(value) : "اختر اليوم"}
      </span>
      <CalendarDays size={19} className="shrink-0 text-faint" />
      <DateOverlay
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
    {error ? (
      <p className="px-1 text-sm text-danger">{error}</p>
    ) : (
      hint && <p className="px-1 text-xs text-faint">{hint}</p>
    )}
  </div>
);
