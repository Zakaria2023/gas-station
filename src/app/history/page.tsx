import { CalendarDays, List } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { DayRow, DayRows } from "@/components/history/day-rows";
import { MonthNav } from "@/components/history/month-nav";
import { LogTabs } from "@/components/layout/log-tabs";
import { MoneySummary } from "@/components/money/money-summary";
import { StockSummary } from "@/components/stock/stock-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cylinderTypes } from "@/db/enum";
import { summaryRowsOf } from "@/lib/ledger";
import { getFirstActivityDate, getLedger, requireUser, summarizeCash } from "@/services";
import { addMonths, formatMonth, isIsoMonth, monthEnd, monthOf, monthStart, todayIso } from "@/utils";

export const metadata: Metadata = { title: "سجل الأيام" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Every day ever, a month at a time: back as far as the first entry, ten years
 * or more. Laid out like the movements log — the month bar, its totals, the
 * stock at its end, then its days.
 */
const HistoryPage = async ({ searchParams }: Props) => {
  await requireUser();
  const params = await searchParams;
  const today = todayIso();
  const thisMonth = monthOf(today);
  const asked = Array.isArray(params.month) ? params.month[0] : params.month;
  const month = isIsoMonth(asked) && asked <= thisMonth ? asked : thisMonth;
  const end = month === thisMonth ? today : monthEnd(month);

  const [ledger, cash, firstDate] = await Promise.all([
    getLedger(monthStart(month), end),
    summarizeCash(monthStart(month), end),
    getFirstActivityDate(),
  ]);
  const firstMonth = firstDate ? monthOf(firstDate) : thisMonth;

  // The two types walk the same dates; a day shows when anything happened in it.
  const days: DayRow[] = ledger.household.map((household, index) => ({
    date: household.date,
    household,
    industrial: ledger.industrial[index]!,
  }));
  const rows = days
    .filter((row) => row.date === today || cylinderTypes.some((type) => row[type].movementCount > 0 || row[type].counted))
    .reverse();
  const lastDay = days[days.length - 1];

  return (
    <>
      <PageHeader title="السجل" subtitle={`${formatMonth(month)} · كل الأيام، شهر بشهر`} />

      <div className="px-4 pb-3 lg:pb-5">
        <LogTabs active="days" />
      </div>

      <div className="flex flex-col gap-3 px-4 lg:gap-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="lg:w-96">
            <MonthNav
              month={month}
              label={formatMonth(month)}
              previous={month > firstMonth ? addMonths(month, -1) : null}
              next={month < thisMonth ? addMonths(month, 1) : null}
              thisMonth={thisMonth}
              firstMonth={firstMonth}
            />
          </div>
          <Link
            href={`/movements?from=${monthStart(month)}&to=${end}`}
            className="flex min-h-11 items-center justify-center gap-2 rounded-control px-3 text-sm font-bold text-primary hover:bg-primary-tint active:bg-primary-tint"
          >
            <List size={18} />
            كل حركات {formatMonth(month)}
          </Link>
        </div>

        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
          <MoneySummary rows={[...summaryRowsOf(ledger), ...cash]} periodLabel={formatMonth(month)} />
          {lastDay && (
            <StockSummary
              title={month === thisMonth ? "المخزون الآن" : "المخزون آخر الشهر"}
              meta={formatMonth(month)}
              stock={{ household: lastDay.household.closing, industrial: lastDay.industrial.closing }}
            />
          )}
        </div>

        {rows.length === 0 ? (
          <section className="rounded-card bg-surface shadow-card">
            <EmptyState icon={<CalendarDays size={26} />} title="ما في أيام مسجّلة بهذا الشهر" />
          </section>
        ) : (
          <DayRows rows={rows} today={today} />
        )}
      </div>
    </>
  );
};

export default HistoryPage;
