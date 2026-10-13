"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type DayNavProps = {
  date: string;
  previous: string;
  next: string | null;
  today: string;
};

const ICON_BUTTON =
  "flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-hover active:bg-hairline-soft";

/**
 * Step a day back or forward, or jump with the phone's own date picker. In a
 * right-to-left page earlier days are to the right, so "previous" points right.
 */
export const DayNav = ({ date, previous, next, today }: DayNavProps) => {
  const router = useRouter();
  const pickerRef = useRef<HTMLInputElement>(null);
  const hrefFor = (day: string) => (day === today ? "/" : `/?date=${day}`);

  return (
    <div className="flex items-center">
      <Link href={hrefFor(previous)} aria-label="اليوم السابق" className={ICON_BUTTON}>
        <ChevronRight size={22} />
      </Link>
      <div className="relative">
        <button
          type="button"
          aria-label="اختيار يوم"
          className={ICON_BUTTON}
          onClick={() => pickerRef.current?.showPicker?.()}
        >
          <CalendarDays size={21} />
        </button>
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={date}
          max={today}
          onChange={(event) => {
            if (event.target.value) {
              router.push(hrefFor(event.target.value));
            }
          }}
          className="pointer-events-none absolute inset-0 opacity-0"
        />
      </div>
      {next ? (
        <Link href={hrefFor(next)} aria-label="اليوم التالي" className={ICON_BUTTON}>
          <ChevronLeft size={22} />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${ICON_BUTTON} pointer-events-none opacity-25`}>
          <ChevronLeft size={22} />
        </span>
      )}
    </div>
  );
};
