import { Banknote } from "lucide-react";
import Link from "next/link";
import { kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { CylinderType, cylinderTypes, MovementKind, movementKinds } from "@/db/enum";
import { MOVEMENT_KIND_LABELS } from "@/db/label";
import { emptyTotals, KindTotals, LedgerDay } from "@/lib/ledger";
import { dayAccount, MONEY_FLOW, MoneyFlow, roundMoney } from "@/lib/pricing";
import { formatMoney } from "@/utils/text";

type DayAccountProps = {
  stock: Record<CylinderType, LedgerDay>;
  /** What the stock left at the end of the day is worth, both types together. */
  stockValue: number;
  hasPrices: boolean;
};

const FLOW_LABELS: Record<MoneyFlow, string> = {
  income: "المقبوض من البيع",
  expense: "المصاريف",
  credit: "ديون جديدة",
  settlement: "رجع ديون",
};

/** The day's money: what came in, what went out, what was lent and paid back. */
export const DayAccount = ({ stock, stockValue, hasPrices }: DayAccountProps) => {
  const amounts: KindTotals = emptyTotals();
  for (const type of cylinderTypes) {
    for (const kind of movementKinds) {
      amounts[kind] = roundMoney(amounts[kind] + stock[type].amounts[kind]);
    }
  }
  const account = dayAccount(amounts);
  const kindsOf = (flow: MoneyFlow): MovementKind[] =>
    movementKinds.filter((kind) => MONEY_FLOW[kind] === flow && amounts[kind] !== 0);
  const flows = (["income", "expense", "credit", "settlement"] as const).filter(
    (flow) => flow === "income" || account[flow] !== 0,
  );

  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <Banknote size={20} className="text-success" />
          حساب اليوم
        </h2>
        <Link href="/prices" className="text-sm font-bold text-primary">
          الأسعار
        </Link>
      </div>

      {!hasPrices && (
        <p className="mt-2 rounded-control bg-warning-tint px-3 py-2.5 text-sm text-warning">
          ما في أسعار بعد، فالمبالغ صفر.{" "}
          <Link href="/prices" className="font-bold underline">
            حدّد الأسعار
          </Link>
        </p>
      )}

      <p className="mt-3 text-sm text-muted">{FLOW_LABELS.income}</p>
      <p className="text-[34px] leading-tight font-extrabold text-ink tabular">{formatMoney(account.income)}</p>

      <dl className="mt-3 flex flex-col divide-y divide-hairline-soft">
        {flows.map((flow) => (
          <div key={flow} className="py-2.5">
            {flow !== "income" && (
              <div className="flex items-center justify-between">
                <dt className="text-sm font-bold text-ink">{FLOW_LABELS[flow]}</dt>
                <dd className="text-base font-extrabold text-ink tabular">{formatMoney(account[flow])}</dd>
              </div>
            )}
            {kindsOf(flow).map((kind) => (
              <div key={kind} className="mt-1.5 flex items-center gap-2 text-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${kindChipClass(kind)}`}>
                  <KindIcon kind={kind} size={13} />
                </span>
                <span className="flex-1 text-muted">{MOVEMENT_KIND_LABELS[kind]}</span>
                <span className="text-ink tabular">{formatMoney(amounts[kind])}</span>
              </div>
            ))}
          </div>
        ))}
        {account.expense !== 0 && (
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-sm font-bold text-ink">الصافي (المقبوض − المصاريف)</dt>
            <dd className={`text-base font-extrabold tabular ${account.net < 0 ? "text-danger" : "text-success"}`}>
              {formatMoney(account.net)}
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-sm font-bold text-ink">قيمة المخزون آخر اليوم</dt>
          <dd className="text-base font-extrabold text-ink tabular">{formatMoney(stockValue)}</dd>
        </div>
      </dl>
    </section>
  );
};
