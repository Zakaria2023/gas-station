import { CylinderType } from "@/db/enum";
import { CYLINDER_TYPE_LABELS } from "@/db/label";

export const TYPE_TEXT: Record<CylinderType, string> = {
  household: "text-household",
  industrial: "text-industrial",
};

export const TYPE_TINT: Record<CylinderType, string> = {
  household: "bg-household-tint text-household",
  industrial: "bg-industrial-tint text-industrial",
};

export const TYPE_DOT: Record<CylinderType, string> = {
  household: "bg-household",
  industrial: "bg-industrial",
};

type TypeBadgeProps = {
  cylinderType: CylinderType;
};

export const TypeBadge = ({ cylinderType }: TypeBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${TYPE_TINT[cylinderType]}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[cylinderType]}`} />
    {CYLINDER_TYPE_LABELS[cylinderType]}
  </span>
);
