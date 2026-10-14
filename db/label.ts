import { CylinderState, CylinderType, MovementKind, UserRole } from "./enum";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدير",
  staff: "موظف",
};

export const CYLINDER_TYPE_LABELS: Record<CylinderType, string> = {
  household: "منزلي",
  industrial: "صناعي",
};

export const CYLINDER_STATE_LABELS: Record<CylinderState, string> = {
  full: "مليان",
  empty: "فاضي",
};

export const MOVEMENT_KIND_LABELS: Record<MovementKind, string> = {
  exchange: "تبديل",
  sell_full: "بيع مليان",
  sell_empty: "بيع فاضي",
  debt_full: "دين مليان",
  debt_empty: "دين فاضي",
  return_full: "رجع دين مليان",
  return_empty: "رجع دين فاضي",
  customer_empty_in: "فاضي دخل زبون",
  refill: "تعبئة",
  cash_debt: "دين مصاري",
  cash_return: "رجع دين مصاري",
};
