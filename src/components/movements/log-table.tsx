import Link from "next/link";
import { TABLE, TABLE_HEAD_ROW, TABLE_WRAP, TD, TH, TR } from "@/components/ui/data-table";
import { TypeBadge } from "@/components/ui/type-badge";
import { MOVEMENT_KIND_LABELS } from "@/db/label";
import type { MovementView } from "@/lib/movement-view";
import { amountOf } from "@/lib/pricing";
import { formatCount, formatMoney, formatShortDay } from "@/utils";
import { kindChipClass, KindIcon } from "./kind-style";

type LogTableProps = {
  movements: MovementView[];
};

/** The desktop's view of the log: one row per movement, every column at a glance. */
export const LogTable = ({ movements }: LogTableProps) => (
  <div className={TABLE_WRAP}>
    <table className={TABLE}>
      <thead className={TABLE_HEAD_ROW}>
        <tr>
          <th className={TH}>اليوم</th>
          <th className={TH}>الحركة</th>
          <th className={TH}>الصنف</th>
          <th className={TH}>الزبون</th>
          <th className={TH}>العدد</th>
          <th className={TH}>سعر الواحدة</th>
          <th className={TH}>المبلغ</th>
          <th className={TH}>ملاحظة</th>
        </tr>
      </thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.uuid} className={TR}>
            <td className={`${TD} whitespace-nowrap`}>
              <Link href={`/?date=${movement.businessDate}`} className="font-semibold text-ink hover:text-primary hover:underline">
                {formatShortDay(movement.businessDate)}
              </Link>
              <span className="block text-xs text-faint">{movement.businessDate.slice(0, 4)} · {movement.time}</span>
            </td>
            <td className={TD}>
              <span className="flex items-center gap-2 font-bold whitespace-nowrap text-ink">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${kindChipClass(movement.kind)}`}>
                  <KindIcon kind={movement.kind} size={16} />
                </span>
                {MOVEMENT_KIND_LABELS[movement.kind]}
              </span>
            </td>
            <td className={TD}>
              <TypeBadge cylinderType={movement.cylinderType} />
            </td>
            <td className={TD}>
              {movement.customerName && movement.customerUuid ? (
                <Link href={`/customers/${movement.customerUuid}`} className="font-semibold text-primary hover:underline">
                  {movement.customerName}
                </Link>
              ) : (
                <span className="text-faint">—</span>
              )}
            </td>
            <td className={`${TD} text-base font-extrabold text-ink tabular`}>{formatCount(movement.quantity)}</td>
            <td className={`${TD} whitespace-nowrap text-muted tabular`}>
              {movement.unitPrice === null ? "—" : formatMoney(movement.unitPrice)}
            </td>
            <td className={`${TD} font-bold whitespace-nowrap text-ink tabular`}>
              {movement.unitPrice === null ? "—" : formatMoney(amountOf(movement.quantity, movement.unitPrice))}
            </td>
            <td className={`${TD} max-w-56 truncate text-muted`} title={movement.note ?? undefined}>
              {movement.note ?? ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
