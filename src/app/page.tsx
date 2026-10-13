import { ClipboardCheck, ClipboardList, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { MovementList } from "@/components/movements/movement-list";
import { MoneySummary } from "@/components/money/money-summary";
import { DayNav } from "@/components/today/day-nav";
import { DayStats } from "@/components/today/day-stats";
import { DayTable } from "@/components/today/day-table";
import { StockCard } from "@/components/today/stock-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Toast } from "@/components/ui/toast";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_TYPE_LABELS } from "@/db/label";
import { toMovementViews } from "@/lib/movement-view";
import { summaryRowsOf, sumAmounts } from "@/lib/ledger";
import { dayAccount, stockValue } from "@/lib/pricing";
import { getDayMovements, getDayStock, getPriceList, getTotalOwed } from "@/services";
import { addDays, formatLongDay, isIsoDate, relativeDayName, todayIso } from "@/utils";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const TodayPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const today = todayIso();
  const asked = first(params.date);
  // A future day has nothing in it yet; it opens today instead.
  const date = isIsoDate(asked) && asked <= today ? asked : today;
  const saved = first(params.saved);

  const [stock, rows, prices, owed] = await Promise.all([
    getDayStock(date),
    getDayMovements(date),
    getPriceList(date),
    getTotalOwed(),
  ]);
  const movements = toMovementViews(rows);
  // The stock is worth the day's prices: raising a price revalues what is left.
  const values = Object.fromEntries(
    cylinderTypes.map((type) => [type, stockValue(stock[type].closing, prices, type)]),
  ) as Record<CylinderType, ReturnType<typeof stockValue>>;
  const hasPrices = cylinderTypes.some((type) => Object.values(prices[type]).some((price) => price !== null));
  const nothingYet =
    movements.length === 0 &&
    cylinderTypes.every((type) => !stock[type].counted && stock[type].opening.full === 0 && stock[type].opening.empty === 0);
  const negative = cylinderTypes.filter(
    (type) => stock[type].closing.full < 0 || stock[type].closing.empty < 0,
  );
  const nextDay = date < today ? addDays(date, 1) : null;
  const totalStockValue = cylinderTypes.reduce((sum, type) => sum + values[type].total, 0);
  const income = dayAccount(sumAmounts(cylinderTypes.map((type) => stock[type]))).income;

  return (
    <>
      <PageHeader
        title={relativeDayName(date, today)}
        subtitle={formatLongDay(date)}
        actions={<DayNav date={date} previous={addDays(date, -1)} next={nextDay} today={today} />}
      />

      <div className="flex flex-col gap-3 px-4 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
        {!nothingYet && (
          <DayStats
            income={income}
            stockValue={totalStockValue}
            owedMoney={owed.money}
            owedCylinders={owed.total}
            movementCount={movements.length}
          />
        )}

        {nothingYet ? (
          <section className="rounded-card bg-surface shadow-card lg:col-span-12">
            <EmptyState
              icon={<ClipboardCheck size={26} />}
              title="ابدأ بجرد أول اليوم"
              description="اكتب كم جرة مليانة وكم فاضية عندك الآن، وبعدها كل حركة تُحسب لوحدها."
              action={
                <Link href={`/counts/new?date=${date}`} className={buttonClasses({ size: "lg" })}>
                  <ClipboardCheck size={20} />
                  تسجيل الجرد
                </Link>
              }
            />
          </section>
        ) : (
          <div className="flex flex-col gap-3 lg:col-span-12 lg:grid lg:grid-cols-2 lg:gap-5">
            {negative.length > 0 && (
              <Link
                href={`/counts/new?date=${date}`}
                className="flex items-start gap-3 rounded-card bg-danger-tint p-4 text-danger lg:col-span-2"
              >
                <TriangleAlert size={22} className="mt-0.5 shrink-0" />
                <span className="text-sm">
                  <span className="block font-bold">
                    المخزون بالسالب ({negative.map((type) => CYLINDER_TYPE_LABELS[type]).join("، ")})
                  </span>
                  في حركة ناقصة أو الجرد قديم. اضغط هنا لتسجيل جرد جديد.
                </span>
              </Link>
            )}
            {cylinderTypes.map((type) => (
              <StockCard key={type} cylinderType={type} day={stock[type]} value={values[type]} />
            ))}
            <Link
              href={`/counts/new?date=${date}`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-control text-sm font-bold text-primary active:bg-primary-tint lg:col-span-2 lg:-my-2"
            >
              <ClipboardCheck size={18} />
              {cylinderTypes.some((type) => stock[type].counted) ? "تعديل جرد أول اليوم" : "تسجيل جرد أول اليوم"}
            </Link>
          </div>
        )}

        <section className="rounded-card bg-surface shadow-card lg:col-span-7">
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <h2 className="text-base font-bold text-ink">
              الحركات
              {movements.length > 0 && (
                <span className="ms-2 rounded-full bg-hairline-soft px-2 py-0.5 text-xs text-muted tabular">
                  {movements.length}
                </span>
              )}
            </h2>
            <Link
              href={date === today ? "/movements/new" : `/movements/new?date=${date}`}
              className="flex items-center gap-1 text-sm font-bold text-primary"
            >
              <Plus size={16} />
              إضافة
            </Link>
          </div>
          {movements.length > 0 ? (
            <MovementList movements={movements} highlight={saved} />
          ) : (
            <EmptyState
              icon={<ClipboardList size={26} />}
              title="ما في حركات"
              description={date === today ? "ما انسجّلت حركات اليوم بعد." : "ما انسجّلت حركات بهذا اليوم."}
              action={
                <Link
                  href={date === today ? "/movements/new" : `/movements/new?date=${date}`}
                  className={buttonClasses({ variant: "secondary" })}
                >
                  <Plus size={18} />
                  حركة جديدة
                </Link>
              }
            />
          )}
        </section>

        {!nothingYet && (
          <div className="flex flex-col gap-3 lg:col-span-5 lg:gap-5">
            <MoneySummary
              title="حساب اليوم"
              periodLabel={relativeDayName(date, today)}
              rows={summaryRowsOf({ household: [stock.household], industrial: [stock.industrial] })}
              action={
                <Link href="/prices" className="shrink-0 text-sm font-bold text-primary">
                  الأسعار
                </Link>
              }
              notice={
                !hasPrices && (
                  <p className="rounded-control bg-warning-tint px-3 py-2.5 text-sm text-warning">
                    ما في أسعار بعد، فالمبالغ صفر.{" "}
                    <Link href="/prices" className="font-bold underline">
                      حدّد الأسعار
                    </Link>
                  </p>
                )
              }
            />
            <DayTable stock={stock} />
          </div>
        )}
      </div>

      {saved && <Toast key={saved} message="تم حفظ الحركة" />}
    </>
  );
};

export default TodayPage;
