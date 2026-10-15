import { Metadata } from "next";
import { AddForm } from "@/components/day-entry/add-form";
import { PageHeader } from "@/components/ui/page-header";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { StockDelta } from "@/lib/movement-rules";
import { getDayStock, requireUser } from "@/services";
import { formatLongDay, isIsoDate, relativeDayName, todayIso } from "@/utils";

export const metadata: Metadata = { title: "إضافة" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const AddPage = async ({ searchParams }: Props) => {
  await requireUser();
  const params = await searchParams;
  const asked = Array.isArray(params.date) ? params.date[0] : params.date;
  const today = todayIso();
  const date = isIsoDate(asked) && asked <= today ? asked : today;

  const stock = await getDayStock(date);

  return (
    <>
      <PageHeader
        title="إضافة"
        subtitle={`${relativeDayName(date, today)} · ${formatLongDay(date)}`}
        backHref={date === today ? "/" : `/?date=${date}`}
      />
      <AddForm
        stock={
          Object.fromEntries(cylinderTypes.map((type) => [type, stock[type].closing])) as Record<
            CylinderType,
            StockDelta
          >
        }
        defaults={{ businessDate: date, household: "", industrial: "", note: "" }}
      />
    </>
  );
};

export default AddPage;
