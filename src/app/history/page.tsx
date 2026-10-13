import { CalendarDays, ChevronLeft, ClipboardCheck } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TYPE_DOT } from "@/components/ui/type-badge";
import { cylinderTypes } from "@/db/enum";
import { CYLINDER_TYPE_LABELS } from "@/db/label";
import { dayAccount } from "@/lib/pricing";
import { getLedger } from "@/services";
import { addDays, formatCount, formatFullDay, formatMoney, relativeDayName, todayIso } from "@/utils";

export const metadata: Metadata = { title: "السجل" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const RANGES = [30, 90, 365];

const HistoryPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const asked = Number(Array.isArray(params.days) ? params.days[0] : params.days);
  const days = RANGES.includes(asked) ? asked : RANGES[0]!;
  const today = todayIso();
  const ledger = await getLedger(addDays(today, -(days - 1)), today);

  // The two types walk the same dates; a day shows when anything happened in it.
  const rows = ledger.household
    .map((household, index) => ({ date: household.date, household, industrial: ledger.industrial[index]! }))
    .filter(
      (row) =>
        row.date === today ||
        cylinderTypes.some((type) => row[type].movementCount > 0 || row[type].counted),
    )
    .reverse();

  return (
    <>
      <PageHeader title="السجل" subtitle="آخر اليوم لكل يوم فيه حركة" />
      <div className="flex flex-col gap-3 px-4">
        <div className="flex gap-2">
          {RANGES.map((range) => (
            <Link
              key={range}
              href={range === RANGES[0] ? "/history" : `/history?days=${range}`}
              className={`min-h-10 flex-1 rounded-full px-3 py-2 text-center text-sm font-bold ${
                range === days ? "bg-ink text-white" : "bg-surface text-muted shadow-card"
              }`}
            >
              {range === 365 ? "سنة" : `${range} يوم`}
            </Link>
          ))}
        </div>

        {rows.length === 0 ? (
          <section className="rounded-card bg-surface shadow-card">
            <EmptyState icon={<CalendarDays size={26} />} title="ما في أيام مسجّلة بعد" />
          </section>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {rows.map((row) => {
              const count = row.household.movementCount + row.industrial.movementCount;
              const counted = row.household.counted || row.industrial.counted;
              const income = cylinderTypes.reduce(
                (sum, type) => sum + dayAccount(row[type].amounts).income,
                0,
              );
              return (
                <li key={row.date}>
                  <Link
                    href={row.date === today ? "/" : `/?date=${row.date}`}
                    className="block rounded-card bg-surface p-4 shadow-card active:bg-hover"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-extrabold text-ink">{relativeDayName(row.date, today)}</p>
                        <p className="text-sm text-muted">{formatFullDay(row.date)}</p>
                        {income !== 0 && (
                          <p className="mt-1 text-sm font-bold text-success tabular">مقبوض {formatMoney(income)}</p>
                        )}
                      </div>
                      {counted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-hairline-soft px-2 py-0.5 text-[11px] font-bold text-muted">
                          <ClipboardCheck size={12} />
                          جرد
                        </span>
                      )}
                      <span className="text-sm font-semibold text-muted">
                        <span className="tabular">{formatCount(count)}</span> حركة
                      </span>
                      <ChevronLeft size={18} className="text-faint" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {cylinderTypes.map((type) => {
                        const closing = row[type].closing;
                        return (
                          <div key={type} className="rounded-control bg-hover px-3 py-2">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
                              <span className={`h-2 w-2 rounded-full ${TYPE_DOT[type]}`} />
                              {CYLINDER_TYPE_LABELS[type]}
                            </p>
                            <p className="mt-1 flex items-center gap-3 text-base font-extrabold text-ink tabular">
                              <span className={`flex items-center gap-1 ${closing.full < 0 ? "text-danger" : ""}`}>
                                <CylinderIcon filled size={15} className="text-muted" />
                                {formatCount(closing.full)}
                              </span>
                              <span className={`flex items-center gap-1 ${closing.empty < 0 ? "text-danger" : ""}`}>
                                <CylinderIcon filled={false} size={15} className="text-muted" />
                                {formatCount(closing.empty)}
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

export default HistoryPage;
