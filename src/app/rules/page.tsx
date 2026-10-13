import { Metadata } from "next";
import { kindChipClass, KindIcon } from "@/components/movements/kind-style";
import { PageHeader } from "@/components/ui/page-header";
import { movementKinds } from "@/db/enum";
import { CYLINDER_STATE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { MOVEMENT_EFFECTS } from "@/lib/movement-rules";
import { formatSigned } from "@/utils";

export const metadata: Metadata = { title: "قواعد الحركات" };

const Effect = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-control bg-hover px-2 py-1.5 text-center">
    <p className="text-[11px] font-semibold text-muted">{label}</p>
    <p
      dir="ltr"
      className={`text-base font-extrabold tabular ${
        value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-faint"
      }`}
    >
      {value === 0 ? "—" : formatSigned(value)}
    </p>
  </div>
);

/**
 * Every movement and what one cylinder of it does, read straight off the
 * rules table — so what this page says is exactly what the app computes.
 */
const RulesPage = () => {
  return (
    <>
      <PageHeader title="قواعد الحركات" subtitle="لكل جرة واحدة" backHref="/more" />
      <div className="flex flex-col gap-2.5 px-4">
        {movementKinds.map((kind) => {
          const { stock, debt } = MOVEMENT_EFFECTS[kind];
          return (
            <section key={kind} className="rounded-card bg-surface p-3.5 shadow-card">
              <div className="mb-2.5 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${kindChipClass(kind)}`}>
                  <KindIcon kind={kind} size={20} />
                </span>
                <h2 className="text-base font-extrabold text-ink">{MOVEMENT_KIND_LABELS[kind]}</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Effect label="مليان بالمحل" value={stock.full} />
                <Effect label="فاضي بالمحل" value={stock.empty} />
                <Effect
                  label={debt ? `دين ${CYLINDER_STATE_LABELS[debt.state]}` : "دين الزبون"}
                  value={debt ? debt.sign : 0}
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
