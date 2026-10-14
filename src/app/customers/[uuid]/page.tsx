import { BanknoteArrowDown, ClipboardList, HandCoins, NotebookPen, Pencil, Phone, Undo2 } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAvatar } from "@/components/customers/customer-avatar";
import { OwedSummary } from "@/components/customers/owed-summary";
import { LogTable } from "@/components/movements/log-table";
import { MovementList } from "@/components/movements/movement-list";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { toMovementViews } from "@/lib/movement-view";
import { getCustomer, getCustomerMovements, requireUser } from "@/services";

export const metadata: Metadata = { title: "زبون" };

type Props = {
  params: Promise<{ uuid: string }>;
};

const CustomerPage = async ({ params }: Props) => {
  await requireUser();
  const { uuid } = await params;
  const customer = await getCustomer(uuid);
  if (!customer) {
    notFound();
  }
  const movements = toMovementViews(await getCustomerMovements(customer.id));
  const owesFull = customer.balance.household.full + customer.balance.industrial.full > 0;
  const returnKind = owesFull ? "return_full" : "return_empty";

  return (
    <>
      <PageHeader
        title={customer.name}
        backHref="/customers"
        actions={
          <Link
            href={`/customers/${customer.uuid}/edit`}
            aria-label="تعديل"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-hover active:bg-hairline-soft"
          >
            <Pencil size={20} />
          </Link>
        }
      />

      {/* Full width like the movements log: who they are, what they owe, then every movement. */}
      <div className="flex flex-col gap-3 px-4 lg:gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-5">
          <section className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card lg:flex-1">
            <CustomerAvatar name={customer.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-extrabold text-ink">{customer.name}</p>
              {customer.phone ? (
                <a
                  href={`tel:${customer.phone.replace(/s/g, "")}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-base font-semibold text-primary"
                  dir="ltr"
                >
                  <Phone size={16} />
                  {customer.phone}
                </a>
              ) : (
                <p className="mt-1 text-sm text-faint">ما في رقم هاتف</p>
              )}
              {customer.notes && <p className="mt-1.5 text-sm whitespace-pre-wrap text-muted">{customer.notes}</p>}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2 lg:w-96">
            <Link
              href={`/movements/new?kind=debt_full&customer=${customer.uuid}`}
              className={buttonClasses({ size: "lg" }) + " bg-debts! hover:bg-debts/90!"}
            >
              <NotebookPen size={20} />
              أخذ دين
            </Link>
            <Link
              href={`/movements/new?kind=${returnKind}&customer=${customer.uuid}`}
              className={buttonClasses({ size: "lg" }) + " bg-returns! hover:bg-returns/90!"}
            >
              <Undo2 size={20} />
              رجّع
            </Link>
            <Link
              href={`/movements/new?kind=cash_debt&customer=${customer.uuid}`}
              className={buttonClasses({ size: "lg", variant: "secondary" }) + " text-debts!"}
            >
              <HandCoins size={20} />
              أخذ مصاري
            </Link>
            <Link
              href={`/movements/new?kind=cash_return&customer=${customer.uuid}`}
              className={buttonClasses({ size: "lg", variant: "secondary" }) + " text-returns!"}
            >
              <BanknoteArrowDown size={20} />
              رجّع مصاري
            </Link>
          </div>
        </div>

        <OwedSummary balance={customer.balance} title="عليه" />

        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-ink">السجل</h2>
          {movements.length > 0 && (
            <Link href={`/movements?customer=${customer.uuid}`} className="text-sm font-bold text-primary">
              كل حركاته مع الفلاتر
            </Link>
          )}
        </div>
        {movements.length > 0 ? (
          <>
            <section className="rounded-card bg-surface shadow-card lg:hidden">
              <MovementList movements={movements} show="date" />
            </section>
            <div className="hidden lg:block">
              <LogTable movements={movements} />
            </div>
          </>
        ) : (
          <section className="rounded-card bg-surface shadow-card">
            <EmptyState icon={<ClipboardList size={26} />} title="ما في حركات لهذا الزبون بعد" />
          </section>
        )}
      </div>
    </>
  );
};

export default CustomerPage;
