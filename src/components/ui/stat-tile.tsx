import { ReactNode } from "react";

export type StatTone =
  | "success"
  | "danger"
  | "debts"
  | "returns"
  | "primary"
  | "stock"
  | "household"
  | "industrial";

const TONES: Record<StatTone, { tint: string; text: string }> = {
  success: { tint: "bg-success-tint", text: "text-success" },
  danger: { tint: "bg-danger-tint", text: "text-danger" },
  debts: { tint: "bg-debts-tint", text: "text-debts" },
  returns: { tint: "bg-returns-tint", text: "text-returns" },
  primary: { tint: "bg-primary-tint", text: "text-primary" },
  stock: { tint: "bg-stock-tint", text: "text-stock" },
  household: { tint: "bg-household-tint", text: "text-household" },
  industrial: { tint: "bg-industrial-tint", text: "text-industrial" },
};

type StatTileProps = {
  label: string;
  value: string;
  tone: StatTone;
  /** A zero is shown quietly, in grey, so the numbers that matter stand out. */
  empty?: boolean;
  icon?: ReactNode;
  hint?: ReactNode;
  /** Negative numbers (stock below zero) are shown in red. */
  negative?: boolean;
};

/**
 * One number with its name — the app's single way to show a total. Coloured
 * by what it measures, grey when it is zero.
 */
export const StatTile = ({ label, value, tone, empty = false, icon, hint, negative = false }: StatTileProps) => {
  const colors = TONES[tone];
  return (
    <div className={`min-w-0 rounded-control px-3 py-3 ${empty ? "bg-hover" : colors.tint}`}>
      <p className={`flex items-center gap-1.5 truncate text-sm font-bold ${empty ? "text-muted" : colors.text}`}>
        {icon}
        <span className="truncate">{label}</span>
      </p>
      <p
        className={`mt-0.5 truncate text-xl font-extrabold tabular ${
          negative ? "text-danger" : empty ? "text-faint" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted tabular">{hint}</p>}
    </div>
  );
};
