"use client";

import { CalendarDays } from "lucide-react";
import { useRef } from "react";
import { formatFullDay } from "@/utils/dates";

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
};

/**
 * A date written the app's way ("13 تشرين الأول 2026") rather than the
 * browser's "mm/dd/yyyy". The real date input sits invisibly on top, so a
 * tap still opens the phone's own calendar.
 */
export const DateField = ({ label, value, onChange, min, max }: DateFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="px-1 text-sm font-semibold text-muted">{label}</span>
      <span className="relative flex min-h-12 items-center justify-between gap-2 rounded-control border border-hairline bg-surface px-3.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12">
        <span className={`truncate text-base ${value ? "font-bold text-ink" : "text-faint"}`}>
          {value ? formatFullDay(value) : "اختر اليوم"}
        </span>
        <CalendarDays size={19} className="shrink-0 text-faint" />
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          onClick={() => inputRef.current?.showPicker?.()}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </span>
    </label>
  );
};
