"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { addDays, addMonths, monthEnd, monthStart } from "@/utils/dates";

export type LogFilterKey = "from" | "to" | "type" | "kind" | "customer";

export type QuickRange = "today" | "week" | "month" | "lastMonth" | "year" | "all";

export type FilterSheet = "period" | "type" | "kind" | null;

/** The all-movements filters live in the URL; any change starts again from page one. */
export const useLogFilters = (today: string) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheet, setSheet] = useState<FilterSheet>(null);

  const value = (key: LogFilterKey) => searchParams.get(key) ?? "";

  const apply = (changes: Partial<Record<LogFilterKey, string>>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, next] of Object.entries(changes)) {
      if (next) {
        params.set(key, next);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setSheet(null);
  };

  const thisMonth = today.slice(0, 7);
  const rangeOf = (range: QuickRange): { from: string; to: string } => {
    switch (range) {
      case "today":
        return { from: today, to: today };
      case "week":
        return { from: addDays(today, -6), to: today };
      case "month":
        return { from: monthStart(thisMonth), to: today };
      case "lastMonth":
        return { from: monthStart(addMonths(thisMonth, -1)), to: monthEnd(addMonths(thisMonth, -1)) };
      case "year":
        return { from: `${today.slice(0, 4)}-01-01`, to: today };
      case "all":
        return { from: "", to: "" };
    }
  };

  const activeRange = (["today", "week", "month", "lastMonth", "year", "all"] as const).find((range) => {
    const { from, to } = rangeOf(range);
    return value("from") === from && value("to") === to;
  });

  // The custom range is typed in the sheet first and applied together.
  const [draftFrom, setDraftFrom] = useState(value("from"));
  const [draftTo, setDraftTo] = useState(value("to"));
  const openSheet = (next: FilterSheet) => {
    setDraftFrom(value("from") || monthStart(thisMonth));
    setDraftTo(value("to") || today);
    setSheet(next);
  };

  const clearAll = () => router.replace(pathname, { scroll: false });
  const any = (["from", "to", "type", "kind", "customer"] as const).some((key) => value(key));

  return {
    value,
    apply,
    setRange: (range: QuickRange) => apply(rangeOf(range)),
    activeRange,
    sheet,
    openSheet,
    closeSheet: () => setSheet(null),
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    applyDraft: () => apply({ from: draftFrom, to: draftTo }),
    clearAll,
    any,
  };
};
