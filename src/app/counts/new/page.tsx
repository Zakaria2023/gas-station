import { Metadata } from "next";
import { CountForm } from "@/components/counts/count-form";
import { PageHeader } from "@/components/ui/page-header";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { StockDelta } from "@/lib/movement-rules";
import { getCountsForDay, getDayStock, requireUser } from "@/services";
import { formatLongDay, isIsoDate, relativeDayName, todayIso } from "@/utils";

export const metadata: Metadata = { title: "جرد أول اليوم" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const NewCountPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const asked = Array.isArray(params.date) ? params.date[0] : params.date;
  const today = todayIso();
  const date = isIsoDate(asked) && asked <= today ? asked : today;

  const [, stock, counts] = await Promise.all([requireUser(), getDayStock(date), getCountsForDay(date)]);
  const byType = <T,>(pick: (type: CylinderType) => T) =>
    Object.fromEntries(cylinderTypes.map((type) => [type, pick(type)])) as Record<CylinderType, T>;
  const amount = (value: number | undefined) => (value === undefined ? "" : String(value));

  return (
    <>
      <PageHeader
        title="جرد أول اليوم"
        subtitle={`${relativeDayName(date, today)} · ${formatLongDay(date)}`}
        backHref={date === today ? "/" : `/?date=${date}`}
      />
      <CountForm
        expected={byType<StockDelta>((type) => stock[type].expectedOpening)}
        counted={byType((type) => Boolean(counts[type]))}
        defaults={{
          countedOn: date,
          household: { full: amount(counts.household?.full), empty: amount(counts.household?.empty) },
          industrial: { full: amount(counts.industrial?.full), empty: amount(counts.industrial?.empty) },
          note: counts.household?.note ?? counts.industrial?.note ?? "",
        }}
      />
    </>
  );
};

export default NewCountPage;
