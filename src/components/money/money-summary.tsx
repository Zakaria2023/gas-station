import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";
import { kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { StatTile, StatTone } from "@/components/ui/stat-tile";
import { SummaryCard, TILE_GRID } from "@/components/ui/summary-card";
import { TYPE_TEXT } from "@/components/ui/type-badge";
import { CylinderType, cylinderTypes, MovementKind, movementKinds } from "@/db/enum";
import { CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { emptyTotals, KindSummaryRow } from "@/lib/ledger";
import { dayAccount, MoneyFlow, roundMoney } from "@/lib/pricing";
import { formatCount, formatMoney } from "@/utils/text";

type MoneySummaryProps = {
  rows: KindSummaryRow[];
  title?: string;
  /** "هذا الشهر", "من … إلى …", "كل الأيام". */
  periodLabel: string;
  action?: ReactNode;
  /** Shown between the tiles and the breakdown, e.g. "no prices yet". */
  notice?: ReactNode;
  className?: string;
};

const FLOWS: { flow: MoneyFlow; label: string; tone: StatTone }[] = [
  { flow: "income", label: "المقبوض", tone: "success" },
  { flow: "expense", label: "المدفوع", tone: "danger" },
  { flow: "credit", label: "ديون جديدة", tone: "debts" },
  { flow: "settlement", label: "ديون رجعت", tone: "returns" },
];

/**
 * Any period's money in the app's one shape: four tiles (sold, paid for
 * purchases, lent, paid back), then every movement with its cylinders and money, folded away.
 * Used for a day, a month and any filtered stretch of the log.
 */
export const MoneySummary = ({ rows, title = "المجموع", periodLabel, action, notice, className }: MoneySummaryProps) => {
  const amounts = emptyTotals();
  const quantities = Object.fromEntries(cylinderTypes.map((type) => [type, emptyTotals()])) as Record<
    CylinderType,
    Record<MovementKind, number>
  >;
  const seen = new Set<MovementKind>();
  for (const row of rows) {
    amounts[row.kind] = roundMoney(amounts[row.kind] + row.amount);
    // Money lent or paid back has no type: only its amount shows.
    if (row.cylinderType) {
      quantities[row.cylinderType][row.kind] += row.quantity;
    }
    if (row.quantity !== 0) {
      seen.add(row.kind);
    }
  }
  const account = dayAccount(amounts);
  const kinds = movementKinds.filter((kind) => seen.has(kind));

  return (
    <SummaryCard
      title={title}
      meta={periodLabel}
      action={action}
      className={className}
      footer={
        <>
          {notice && <div className="px-3 pb-3">{notice}</div>}
          {kinds.length > 0 && (
            <details className="group border-t border-hairline-soft">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold text-primary [&::-webkit-details-marker]:hidden">
                التفصيل حسب الحركة
                <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="overflow-x-auto px-2 pb-3">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <thead>
                    <tr className="text-xs text-muted">
                      <th className="px-2 py-2 text-start font-semibold">الحركة</th>
                      {cylinderTypes.map((type) => (
                        <th key={type} className={`px-2 py-2 text-start font-extrabold ${TYPE_TEXT[type]}`}>
                          {CYLINDER_TYPE_LABELS[type]}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-start font-semibold">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kinds.map((kind) => (
                      <tr key={kind} className="border-t border-hairline-soft">
                        <td className="px-2 py-2">
                          <span className="flex items-center gap-2 text-ink">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${kindChipClass(kind)}`}>
                              <KindIcon kind={kind} size={13} />
                            </span>
                            {MOVEMENT_KIND_LABELS[kind]}
                          </span>
                        </td>
                        {cylinderTypes.map((type) => (
                          <td key={type} className="px-2 py-2 text-start text-ink tabular">
                            {quantities[type][kind] ? formatCount(quantities[type][kind]) : <span className="text-faint">·</span>}
                          </td>
                        ))}
                        <td className="px-2 py-2 text-start font-bold text-ink tabular">
                          {amounts[kind] ? formatMoney(amounts[kind]) : <span className="font-normal text-faint">·</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      }
    >
      <div className={TILE_GRID}>
        {FLOWS.map(({ flow, label, tone }) => (
          <StatTile key={flow} label={label} value={formatMoney(account[flow])} tone={tone} empty={account[flow] === 0} />
        ))}
      </div>
    </SummaryCard>
  );
};
