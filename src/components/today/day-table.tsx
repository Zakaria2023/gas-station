import { ChevronDown, Table2 } from "lucide-react";
import { CylinderType, cylinderTypes, movementKinds } from "@/db/enum";
import { CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { TYPE_TEXT } from "@/components/ui/type-badge";
import { LedgerDay, stockTotal } from "@/lib/ledger";
import { formatCount } from "@/utils";

type DayTableProps = {
  stock: Record<CylinderType, LedgerDay>;
};

type Row = {
  label: string;
  value: (day: LedgerDay) => number;
  strong?: boolean;
};

// The sheet's columns, top to bottom, so the day reads like the old row did.
const ROWS: Row[] = [
  { label: "أول اليوم مليان", value: (day) => day.opening.full, strong: true },
  { label: "أول اليوم فاضي", value: (day) => day.opening.empty, strong: true },
  ...movementKinds.map((kind) => ({
    label: MOVEMENT_KIND_LABELS[kind],
    value: (day: LedgerDay) => day.totals[kind],
  })),
  { label: "آخر اليوم مليان", value: (day) => day.closing.full, strong: true },
  { label: "آخر اليوم فاضي", value: (day) => day.closing.empty, strong: true },
  { label: "المجموع", value: (day) => stockTotal(day.closing), strong: true },
];

/** The day as the sheet laid it out, folded away until asked for. */
export const DayTable = ({ stock }: DayTableProps) => (
  <details className="group rounded-card bg-surface shadow-card">
    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
      <Table2 size={20} className="text-muted" />
      <span className="flex-1 font-bold text-ink">الجدول كما في الدفتر</span>
      <ChevronDown size={18} className="text-faint transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-2 pb-3">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="px-2 py-2 text-start font-semibold" />
            {cylinderTypes.map((type) => (
              <th key={type} className={`px-2 py-2 text-start font-extrabold ${TYPE_TEXT[type]}`}>
                {CYLINDER_TYPE_LABELS[type]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className={`border-t border-hairline-soft ${row.strong ? "bg-hover" : ""}`}>
              <td className={`px-2 py-2 ${row.strong ? "font-bold text-ink" : "text-muted"}`}>{row.label}</td>
              {cylinderTypes.map((type) => {
                const value = row.value(stock[type]);
                return (
                  <td
                    key={type}
                    className={`px-2 py-2 text-start tabular ${
                      value < 0 ? "font-bold text-danger" : row.strong ? "font-bold text-ink" : value ? "text-ink" : "text-faint"
                    }`}
                  >
                    {value === 0 && !row.strong ? "·" : formatCount(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);
