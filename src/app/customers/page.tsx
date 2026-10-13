import { ChevronLeft, UserPlus, Users } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BalanceChips } from "@/components/customers/balance-chips";
import { CustomerAvatar } from "@/components/customers/customer-avatar";
import { CustomerSearch } from "@/components/customers/customer-search";
import { OwedSummary } from "@/components/customers/owed-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { isSettled } from "@/lib/balances";
import { getTotalOwed, listCustomers } from "@/services";
import { formatCount } from "@/utils";

export const metadata: Metadata = { title: "الزبائن" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const CustomersPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const search = first(params.q)?.trim() || undefined;
  const owingOnly = first(params.owing) === "1";

  const [customers, owed] = await Promise.all([listCustomers({ search, owingOnly }), getTotalOwed()]);
  const filtered = Boolean(search || owingOnly);

  return (
    <>
      <PageHeader
        title="الزبائن"
        subtitle="ديون الجرار"
        actions={
          <Link
            href="/customers/new"
            aria-label="زبون جديد"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-tint text-primary active:bg-primary-soft"
          >
            <UserPlus size={21} />
          </Link>
        }
      />

      <div className="flex flex-col gap-3 px-4">
        {!filtered && !isSettled(owed) && <OwedSummary balance={owed} title="الجرار عند الزبائن" />}

        <Suspense>
          <CustomerSearch />
        </Suspense>

        {customers.length === 0 ? (
          <section className="rounded-card bg-surface shadow-card">
            <EmptyState
              icon={<Users size={26} />}
              title={filtered ? "ما في نتائج" : "ما في زبائن بعد"}
              description={
                filtered
                  ? "جرّب اسماً آخر، أو اعرض كل الزبائن."
                  : "الزبون ينضاف هنا أو مباشرة من شاشة الحركة لما تسجّل دين."
              }
              action={
                filtered ? null : (
                  <Link href="/customers/new" className="text-sm font-bold text-primary">
                    إضافة زبون
                  </Link>
                )
              }
            />
          </section>
        ) : (
          <section className="rounded-card bg-surface shadow-card">
            <p className="px-4 pt-3 text-xs font-semibold text-faint">
              {formatCount(customers.length)} زبون
            </p>
            <ul className="divide-y divide-hairline-soft">
              {customers.map((customer) => (
                <li key={customer.uuid}>
                  <Link
                    href={`/customers/${customer.uuid}`}
                    className="flex min-h-[72px] items-center gap-3 px-4 py-3 active:bg-hover"
                  >
                    <CustomerAvatar name={customer.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-ink">{customer.name}</span>
                      <span className="mt-1 block">
                        <BalanceChips balance={customer.balance} />
                      </span>
                    </span>
                    <ChevronLeft size={20} className="shrink-0 text-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
};

export default CustomersPage;
