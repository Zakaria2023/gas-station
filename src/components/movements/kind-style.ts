import {
  ArrowLeftRight,
  BanknoteArrowDown,
  Factory,
  HandCoins,
  NotebookPen,
  PackagePlus,
  ShoppingBag,
  Tag,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";
import { MovementKind } from "@/db/enum";
import { MOVEMENT_EFFECTS, MovementGroup } from "@/lib/movement-rules";

/** How a movement looks on screen: its icon and the colours of its family. */

type Tone = "sales" | "debts" | "returns" | "stock";

const KIND_ICONS: Record<MovementKind, LucideIcon> = {
  exchange: ArrowLeftRight,
  sell_full: ShoppingBag,
  sell_empty: Tag,
  debt_full: NotebookPen,
  debt_empty: NotebookPen,
  return_full: Undo2,
  return_empty: Undo2,
  customer_empty_in: PackagePlus,
  refill: Factory,
  cash_debt: HandCoins,
  cash_return: BanknoteArrowDown,
};

const toneOf = (kind: MovementKind): Tone => {
  const effect = MOVEMENT_EFFECTS[kind];
  const sign = effect.debt?.sign ?? effect.cash;
  if (sign) {
    return sign === 1 ? "debts" : "returns";
  }
  return effect.group === "stock" ? "stock" : "sales";
};

const TONE_CHIP: Record<Tone, string> = {
  sales: "bg-sales-tint text-sales",
  debts: "bg-debts-tint text-debts",
  returns: "bg-returns-tint text-returns",
  stock: "bg-stock-tint text-stock",
};

const TONE_SELECTED: Record<Tone, string> = {
  sales: "border-sales bg-sales-tint ring-sales/20",
  debts: "border-debts bg-debts-tint ring-debts/20",
  returns: "border-returns bg-returns-tint ring-returns/20",
  stock: "border-stock bg-stock-tint ring-stock/20",
};

/** A movement's icon, as a component of its own so the choice is not made during a render. */
export const KindIcon = ({ kind, size }: { kind: MovementKind; size: number }) =>
  createElement(KIND_ICONS[kind], { size });
export const kindChipClass = (kind: MovementKind): string => TONE_CHIP[toneOf(kind)];
export const kindSelectedClass = (kind: MovementKind): string => TONE_SELECTED[toneOf(kind)];

export const GROUP_LABELS: Record<MovementGroup, string> = {
  sales: "بيع وتبديل",
  debts: "ديون الزبائن",
  cash: "دين مصاري",
  stock: "المخزون",
};

/** "يطلع مليان · يدخل فاضي" — what one of these does, read off the rules. */
export const kindEffectText = (kind: MovementKind): string => {
  const { stock, debt, cash } = MOVEMENT_EFFECTS[kind];
  if (cash) {
    return cash === 1 ? "يطلع مصاري من المحل · دين على الزبون" : "ترجع مصاري للمحل · ينقص دين الزبون";
  }
  const parts: string[] = [];
  for (const state of ["full", "empty"] as const) {
    const word = state === "full" ? "مليان" : "فاضي";
    if (stock[state] < 0) {
      parts.push(`يطلع ${word}`);
    } else if (stock[state] > 0) {
      parts.push(`يدخل ${word}`);
    }
  }
  if (debt) {
    parts.push(debt.sign === 1 ? "دين على الزبون" : "ينقص دين الزبون");
  }
  return parts.join(" · ");
};
