import { Metadata } from "next";
import { kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { movementKinds } from "@/db/enum";
import { CYLINDER_STATE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { MOVEMENT_EFFECTS } from "@/lib/movement-rules";
import { formatSigned } from "@/utils";

export const metadata: Metadata = { title: "قواعد الحركات" };

/** One effect in the app's tile style: green when it adds, red when it takes away, grey when it does nothing. */
const Effect = ({ label, value }: { label: string; value: number }) => (
  <StatTile
    label={label}
    value={value === 0 ? "—" : formatSigned(value)}
    tone={value > 0 ? "success" : "danger"}
    empty={value === 0}
  />
);

/**
 * Every movement and what one cylinder of it does, read straight off the
 * rules table — so what this page says is exactly what the app computes.
 */
const RulesPage = () => {
  return (
    <>
      <PageHeader title="قواعد الحركات" subtitle="لكل جرة واحدة، أو لكل ليرة بديون المصاري" backHref="/more" />
      <div className="flex flex-col gap-2.5 px-4 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
        {movementKinds.map((kind) => {
          const { stock, debt, cash } = MOVEMENT_EFFECTS[kind];
          return (
            <section key={kind} className="rounded-card bg-surface p-3 shadow-card">
              <div className="mb-2.5 flex items-center gap-3 px-1 pt-1">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${kindChipClass(kind)}`}>
                  <KindIcon kind={kind} size={20} />
                </span>
                <h2 className="text-base font-extrabold text-ink">{MOVEMENT_KIND_LABELS[kind]}</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Effect label="مليان بالمحل" value={stock.full} />
                <Effect label="فاضي بالمحل" value={stock.empty} />
                <Effect
                  label={debt ? `دين ${CYLINDER_STATE_LABELS[debt.state]}` : cash ? "دين مصاري" : "دين الزبون"}
                  value={debt?.sign ?? cash ?? 0}
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
};

export default RulesPage;
