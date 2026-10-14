import { ClipboardList, Download } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogTabs } from "@/components/layout/log-tabs";
import { LogFilters } from "@/components/movements/log-filters";
import { MoneySummary } from "@/components/money/money-summary";
import { LogTable } from "@/components/movements/log-table";
import { MovementList } from "@/components/movements/movement-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { filtersQuery, hasFilters, MovementFilters, parseMovementFilters } from "@/lib/movement-filters";
import { MovementView, toMovementViews } from "@/lib/movement-view";
import { getCustomerName, listMovements, requireUser, summarizeMovements } from "@/services";
import { formatCount, formatFullDay, formatLongDay, todayIso } from "@/utils";

export const metadata: Metadata = { title: "كل الحركات" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const periodLabel = ({ from, to }: MovementFilters): string => {
  if (from && to) {
    return from === to ? formatFullDay(from) : `من ${formatFullDay(from)} إلى ${formatFullDay(to)}`;
  }
  if (from) {
    return `من ${formatFullDay(from)}`;
  }
  if (to) {
    return `حتى ${formatFullDay(to)}`;
  }
  return "كل الأيام";
};

/** Consecutive movements of the same day, for the phone's list with a heading per day. */
const byDay = (movements: MovementView[]): { date: string; movements: MovementView[] }[] => {
  const groups: { date: string; movements: MovementView[] }[] = [];
  for (const movement of movements) {
    const last = groups[groups.length - 1];
    if (last && last.date === movement.businessDate) {
      last.movements.push(movement);
    } else {
      groups.push({ date: movement.businessDate, movements: [movement] });
    }
  }
  return groups;
};

/**
 * Every movement ever recorded, with its price and amount, for any period —
 * a day, a month, or ten years. Read a page at a time; the totals above the
 * list are added up in the database for the whole filtered period.
 */
const MovementsLogPage = async ({ searchParams }: Props) => {
  await requireUser();
  const params = await searchParams;
  const today = todayIso();
  const filters = parseMovementFilters(params);
  const askedPage = Number(Array.isArray(params.page) ? params.page[0] : params.page);
  const page = Number.isInteger(askedPage) && askedPage > 0 ? askedPage : 1;

  const [log, summary, customerName] = await Promise.all([
    listMovements(filters, page),
    summarizeMovements(filters),
    filters.customerUuid ? getCustomerName(filters.customerUuid) : Promise.resolve(null),
  ]);
  const movements = toMovementViews(log.rows);

  return (
    <>
      <PageHeader
        title="كل الحركات"
        subtitle={`${formatCount(log.total)} حركة · ${periodLabel(filters)}`}
        actions={
          log.total > 0 && (
            <a
              href={`/movements/export${filtersQuery(filters)}`}
              aria-label="تنزيل ملف Excel"
              title="تنزيل ملف Excel"
              className="flex h-11 items-center gap-2 rounded-full bg-primary-tint px-3.5 text-sm font-bold text-primary hover:bg-primary-soft"
            >
              <Download size={19} />
              <span className="hidden sm:inline">تنزيل Excel</span>
            </a>
          )
        }
      />

      <div className="px-4 pb-3 lg:pb-5">
        <LogTabs active="movements" />
      </div>

      {/* Full width on every screen: the filter bar, the totals, then the movements. */}
      <div className="flex flex-col gap-3 px-4 lg:gap-5">
        <Suspense>
          <LogFilters today={today} customerName={customerName} />
        </Suspense>
        <MoneySummary rows={summary} periodLabel={periodLabel(filters)} />

        <div className="flex flex-col gap-3">
          {movements.length === 0 ? (
            <section className="rounded-card bg-surface shadow-card">
              <EmptyState
                icon={<ClipboardList size={26} />}
                title={hasFilters(filters) ? "ما في حركات بهذه الفلاتر" : "ما في حركات بعد"}
                description={hasFilters(filters) ? "جرّب فترة أطول أو امسح الفلاتر." : undefined}
                action={
                  hasFilters(filters) ? undefined : (
                    <Link href="/movements/new" className="text-sm font-bold text-primary">
                      سجّل أول حركة
                    </Link>
                  )
                }
              />
            </section>
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:hidden">
                {byDay(movements).map((group) => (
                  <section key={group.date} className="rounded-card bg-surface shadow-card">
                    <Link
                      href={`/?date=${group.date}`}
                      className="flex items-baseline justify-between gap-2 px-4 pt-3.5 pb-1"
                    >
                      <h2 className="text-[15px] font-extrabold text-ink">{formatLongDay(group.date)}</h2>
                      <span className="text-xs text-faint tabular">{group.date.slice(0, 4)}</span>
                    </Link>
                    <MovementList movements={group.movements} />
                  </section>
                ))}
              </div>
              <div className="hidden lg:block">
                <LogTable movements={movements} />
              </div>
              <Pagination
                page={log.page}
                pageCount={log.pageCount}
                hrefFor={(target) => `/movements${filtersQuery(filters, target > 1 ? { page: String(target) } : {})}`}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MovementsLogPage;
