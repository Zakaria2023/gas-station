"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MonthNavProps = {
  month: string;
  label: string;
  /** Null at the first month with anything in it, or at this month. */
  previous: string | null;
  next: string | null;
  thisMonth: string;
  firstMonth: string;
};

const ARROW = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-card hover:bg-hover";

const hrefFor = (month: string, thisMonth: string) => (month === thisMonth ? "/history" : `/history?month=${month}`);

/** Step a month back or forward, or jump straight to any month with the phone's picker. */
export const MonthNav = ({ month, label, previous, next, thisMonth, firstMonth }: MonthNavProps) => {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {previous ? (
        <Link href={hrefFor(previous, thisMonth)} aria-label="الشهر السابق" className={ARROW}>
          <ChevronRight size={22} />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${ARROW} opacity-30`}>
          <ChevronRight size={22} />
        </span>
      )}
      <label className="relative flex min-h-11 flex-1 items-center justify-center rounded-control bg-surface px-3 text-base font-extrabold text-ink shadow-card">
        {label}
        <input
          type="month"
          aria-label="اختيار شهر"
          value={month}
          min={firstMonth}
          max={thisMonth}
          onChange={(event) => {
            if (event.target.value) {
              router.push(hrefFor(event.target.value, thisMonth));
            }
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      {next ? (
        <Link href={hrefFor(next, thisMonth)} aria-label="الشهر التالي" className={ARROW}>
          <ChevronLeft size={22} />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${ARROW} opacity-30`}>
          <ChevronLeft size={22} />
        </span>
      )}
    </div>
  );
};
