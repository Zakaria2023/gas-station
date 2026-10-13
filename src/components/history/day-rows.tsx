import { ChevronLeft, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { TABLE, TABLE_HEAD_ROW, TABLE_WRAP, TD, TD_NUMBER, TH, TR } from "@/components/ui/data-table";
import { TYPE_DOT, TYPE_TEXT } from "@/components/ui/type-badge";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { LedgerDay } from "@/lib/ledger";
import { dayAccount } from "@/lib/pricing";
import { formatCount, formatFullDay, formatMoney, relativeDayName } from "@/utils";

export type DayRow = { date: string } & Record<CylinderType, LedgerDay>;

type DayRowsProps = {
  rows: DayRow[];
  today: string;
};

const facts = (row: DayRow) => ({
  href: `/?date=${row.date}`,
  count: row.household.movementCount + row.industrial.movementCount,
  counted: row.household.counted || row.industrial.counted,
  income: cylinderTypes.reduce((sum, type) => sum + dayAccount(row[type].amounts).income, 0),
});

const CountedBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-hairline-soft px-2 py-0.5 text-[11px] font-bold text-muted">
    <ClipboardCheck size={12} />
    جرد
  </span>
);

const stockClass = (value: number) => (value < 0 ? "text-danger" : value === 0 ? "text-faint" : "text-ink");

/** The phone's view: one card per day, the closing stock of each type underneath. */
const DayCards = ({ rows, today }: DayRowsProps) => (
  <ul className="flex flex-col gap-2.5 lg:hidden">
    {rows.map((row) => {
      const { href, count, counted, income } = facts(row);
      return (
        <li key={row.date}>
          <Link href={href} className="block rounded-card bg-surface p-4 shadow-card active:bg-hover">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-ink">{relativeDayName(row.date, today)}</p>
                <p className="text-sm text-muted">{formatFullDay(row.date)}</p>
              </div>
              {counted && <CountedBadge />}
              <span className="text-sm font-semibold text-muted">
                <span className="tabular">{formatCount(count)}</span> حركة
              </span>
              <ChevronLeft size={18} className="text-faint" />
            </div>
            {income !== 0 && (
              <p className="mt-2 inline-flex rounded-full bg-success-tint px-2.5 py-0.5 text-sm font-bold text-success tabular">
                المقبوض {formatMoney(income)}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {cylinderTypes.map((type) => {
                const closing = row[type].closing;
                return (
                  <div key={type} className="rounded-control bg-hover px-3 py-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
                      <span className={`h-2 w-2 rounded-full ${TYPE_DOT[type]}`} />
                      {CYLINDER_TYPE_LABELS[type]}
                    </p>
                    <p className="mt-1 flex items-center gap-3 text-base font-extrabold tabular">
                      <span className={`flex items-center gap-1 ${stockClass(closing.full)}`}>
                        <CylinderIcon filled size={15} className="text-muted" />
                        {formatCount(closing.full)}
                      </span>
                      <span className={`flex items-center gap-1 ${stockClass(closing.empty)}`}>
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
);

/** The desktop's view: one row per day, the closing stock in columns. */
const DaysTable = ({ rows, today }: DayRowsProps) => (
  <div className={`hidden lg:block ${TABLE_WRAP}`}>
    <table className={TABLE}>
      <thead className={TABLE_HEAD_ROW}>
        <tr>
          <th className={TH}>اليوم</th>
          <th className={TH}>الحركات</th>
          <th className={TH}>المقبوض</th>
          {cylinderTypes.flatMap((type) =>
            (["full", "empty"] as const).map((state) => (
              <th key={`${type}-${state}`} className={`${TH} ${TYPE_TEXT[type]}`}>
                {CYLINDER_TYPE_LABELS[type]} {CYLINDER_STATE_LABELS[state]}
              </th>
            )),
          )}
          <th className={TH} />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const { href, count, counted, income } = facts(row);
          return (
            <tr key={row.date} className={TR}>
              <td className={TD}>
                <Link href={href} className="font-bold text-ink hover:text-primary hover:underline">
                  {relativeDayName(row.date, today)}
                </Link>
                <span className="block text-xs text-faint">{formatFullDay(row.date)}</span>
              </td>
              <td className={`${TD_NUMBER} font-bold text-ink`}>{formatCount(count)}</td>
              <td className={`${TD_NUMBER} font-bold ${income ? "text-success" : "text-faint"}`}>
                {income ? formatMoney(income) : "—"}
              </td>
              {cylinderTypes.flatMap((type) =>
                (["full", "empty"] as const).map((state) => (
                  <td key={`${type}-${state}`} className={`${TD_NUMBER} text-base font-extrabold ${stockClass(row[type].closing[state])}`}>
                    {formatCount(row[type].closing[state])}
                  </td>
                )),
              )}
              <td className={TD}>{counted && <CountedBadge />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/** Days with anything in them: cards on a phone, a table on a desktop. */
export const DayRows = (props: DayRowsProps) => (
  <>
    <DayCards {...props} />
    <DaysTable {...props} />
  </>
);
