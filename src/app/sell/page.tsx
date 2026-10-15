import { Metadata } from "next";
import { SellForm } from "@/components/day-entry/sell-form";
import { PageHeader } from "@/components/ui/page-header";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { StockDelta } from "@/lib/movement-rules";
import { PricedKind, pricedKinds } from "@/lib/pricing";
import { getDayStock, getPriceList, requireUser } from "@/services";
import { formatLongDay, isIsoDate, relativeDayName, todayIso } from "@/utils";

export const metadata: Metadata = { title: "بيع" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SellPage = async ({ searchParams }: Props) => {
  await requireUser();
  const params = await searchParams;
  const asked = Array.isArray(params.date) ? params.date[0] : params.date;
  const today = todayIso();
  const date = isIsoDate(asked) && asked <= today ? asked : today;

  const [stock, prices] = await Promise.all([getDayStock(date), getPriceList(date)]);
  const blank = () => Object.fromEntries(pricedKinds.map((kind) => [kind, ""])) as Record<PricedKind, string>;

  return (
    <>
      <PageHeader
        title="بيع"
        subtitle={`${relativeDayName(date, today)} · ${formatLongDay(date)}`}
        backHref={date === today ? "/" : `/?date=${date}`}
      />
      <SellForm
        stock={
          Object.fromEntries(cylinderTypes.map((type) => [type, stock[type].closing])) as Record<
            CylinderType,
            StockDelta
          >
        }
        prices={prices}
        defaults={{ businessDate: date, household: blank(), industrial: blank(), note: "" }}
      />
    </>
  );
};

export default SellPage;
