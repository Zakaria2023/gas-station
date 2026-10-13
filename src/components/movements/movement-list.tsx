"use client";

import { ChevronDown, StickyNote, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { deleteMovementAction } from "@/app/movements/actions";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { TypeBadge } from "@/components/ui/type-badge";
import { MOVEMENT_KIND_LABELS } from "@/db/label";
import type { MovementView } from "@/lib/movement-view";
import { amountOf } from "@/lib/pricing";
import { formatCount, formatMoney, formatShortDay } from "@/utils";
import { kindChipClass, kindEffectText, KindIcon } from "./kind-style";

type MovementListProps = {
  movements: MovementView[];
  /** The one just saved, picked out with a short highlight. */
  highlight?: string;
  /** On a customer's page the day matters and the name does not. */
  show?: "customer" | "date";
};

const MovementItem = ({
  movement,
  highlight,
  show,
}: {
  movement: MovementView;
  highlight: boolean;
  show: "customer" | "date";
}) => {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, remove, isRemoving] = useActionState(() => deleteMovementAction(movement.uuid), {});

  const secondLine =
    show === "date"
      ? `${formatShortDay(movement.businessDate)} · ${movement.time}`
      : [movement.customerName, movement.time].filter(Boolean).join(" · ");

  return (
    <li className={highlight ? "animate-flash" : ""}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setConfirming(false);
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-start active:bg-hover"
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${kindChipClass(movement.kind)}`}>
          <KindIcon kind={movement.kind} size={21} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-bold text-ink">{MOVEMENT_KIND_LABELS[movement.kind]}</span>
            <TypeBadge cylinderType={movement.cylinderType} />
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">{secondLine}</span>
        </span>
        <span className="flex flex-col items-end">
          <span className="text-2xl leading-tight font-extrabold text-ink tabular">{formatCount(movement.quantity)}</span>
          {movement.unitPrice !== null && (
            <span className="text-xs font-semibold text-muted tabular">
              {formatMoney(amountOf(movement.quantity, movement.unitPrice))}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="animate-fade-in px-4 pb-4">
          <div className="flex flex-col gap-2 rounded-control bg-hover p-3 text-sm">
            <p className="font-semibold text-muted">{kindEffectText(movement.kind)}</p>
            <p className="text-ink tabular">
              {movement.unitPrice === null
                ? "انسجّلت بدون سعر"
                : `${formatCount(movement.quantity)} × ${formatMoney(movement.unitPrice)} = ${formatMoney(
                    amountOf(movement.quantity, movement.unitPrice),
                  )}`}
            </p>
            {movement.customerName && movement.customerUuid && show !== "date" && (
              <Link
                href={`/customers/${movement.customerUuid}`}
                className="flex items-center gap-2 font-semibold text-primary"
              >
                <UserRound size={16} />
                {movement.customerName}
              </Link>
            )}
            {movement.note && (
              <p className="flex items-start gap-2 text-ink">
                <StickyNote size={16} className="mt-0.5 shrink-0 text-faint" />
                {movement.note}
              </p>
            )}
            <p className="text-xs text-faint">انسجّلت الساعة {movement.time}</p>
          </div>
          <FormError message={state.error} />
          <div className="mt-2 flex justify-end">
            {confirming ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={isRemoving}>
                  إلغاء
                </Button>
                <Button
                  variant="danger"
                  disabled={isRemoving}
                  onClick={() => startTransition(() => remove())}
                  className="bg-danger! text-white!"
                >
                  <Trash2 size={17} />
                  {isRemoving ? "جارٍ الحذف…" : "تأكيد الحذف"}
                </Button>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setConfirming(true)}>
                <Trash2 size={17} />
                حذف
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

/** Movements as a tappable list; a tap opens the details and the delete button. */
export const MovementList = ({ movements, highlight, show = "customer" }: MovementListProps) => (
  <ul className="divide-y divide-hairline-soft">
    {movements.map((movement) => (
      <MovementItem
        key={movement.uuid}
        movement={movement}
        highlight={movement.uuid === highlight}
        show={show}
      />
    ))}
  </ul>
);
