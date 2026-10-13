import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { StatTile } from "@/components/ui/stat-tile";
import { SummaryCard, TILE_GRID } from "@/components/ui/summary-card";
import { CylinderType, cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import { StockDelta } from "@/lib/movement-rules";
import { formatCount } from "@/utils/text";

type StockSummaryProps = {
  title: string;
  meta?: string;
  stock: Record<CylinderType, StockDelta>;
};

/** The four stock numbers — household and industrial, full and empty — as summary tiles. */
export const StockSummary = ({ title, meta, stock }: StockSummaryProps) => (
  <SummaryCard title={title} meta={meta}>
    <div className={TILE_GRID}>
      {cylinderTypes.flatMap((type) =>
        (["full", "empty"] as const).map((state) => {
          const value = stock[type][state];
          return (
            <StatTile
              key={`${type}-${state}`}
              label={`${CYLINDER_TYPE_LABELS[type]} ${CYLINDER_STATE_LABELS[state]}`}
              value={formatCount(value)}
              tone={type}
              empty={value === 0}
              negative={value < 0}
              icon={<CylinderIcon filled={state === "full"} size={16} />}
            />
          );
        }),
      )}
    </div>
  </SummaryCard>
);
