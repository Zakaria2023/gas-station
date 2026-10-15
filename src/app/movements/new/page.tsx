import { Metadata } from "next";
import { MovementForm } from "@/components/movements/movement-form";
import { PageHeader } from "@/components/ui/page-header";
import { CylinderType, cylinderTypes, MovementKind, movementKinds } from "@/db/enum";
import { priceFor } from "@/lib/pricing";
import { getDayStock, getPriceList, listCustomers, requireUser } from "@/services";
import { formatLongDay, isIsoDate, priceInputValue, todayIso } from "@/utils";

export const metadata: Metadata = { title: "حركة جديدة" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined =>
  value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

const NewMovementPage = async ({ searchParams }: Props) => {
  await requireUser();
  const params = await searchParams;
  const today = todayIso();
  const asked = first(params.date);
  const date = isIsoDate(asked) && asked <= today ? asked : today;

  const [customers, stock, prices] = await Promise.all([listCustomers(), getDayStock(date), getPriceList(date)]);
  // Adding stock has its own page.
  const kind = oneOf<MovementKind>(first(params.kind), movementKinds.filter((kind) => kind !== "stock_in")) ?? "exchange";
  const cylinderType = oneOf<CylinderType>(first(params.type), cylinderTypes) ?? "household";
  const askedCustomer = first(params.customer);
  const customerUuid = customers.some((customer) => customer.uuid === askedCustomer) ? askedCustomer! : "";

  const closing = Object.fromEntries(
    cylinderTypes.map((type) => [type, stock[type].closing]),
  ) as Record<CylinderType, { full: number; empty: number }>;

  return (
    <>
      <PageHeader
        title="حركة جديدة"
        subtitle={date === today ? "اليوم" : formatLongDay(date)}
        backHref={date === today ? "/" : `/?date=${date}`}
      />
      <MovementForm
        today={today}
        stockDate={date}
        stock={closing}
        prices={prices}
        customers={customers.map(({ uuid, name, phone, balance }) => ({ uuid, name, phone, balance }))}
        defaults={{
          kind,
          cylinderType,
          quantity: 1,
          unitPrice: priceInputValue(priceFor(prices, cylinderType, kind)),
          customerUuid,
          businessDate: date,
          note: "",
        }}
      />
    </>
  );
};

export default NewMovementPage;
