"use client";

import { MovementKind } from "@/db/enum";
import { MOVEMENT_KIND_LABELS } from "@/db/label";
import { kindsInGroup, movementGroups } from "@/lib/movement-rules";
import { GROUP_LABELS, kindChipClass, kindEffectText, KindIcon, kindSelectedClass } from "./kind-style";

type KindPickerProps = {
  value: MovementKind;
  onChange: (kind: MovementKind) => void;
};

/** Every kind of movement as a big tile, in the three families the sheet's columns fall into. */
export const KindPicker = ({ value, onChange }: KindPickerProps) => (
  <div className="flex flex-col gap-3.5" role="radiogroup" aria-label="نوع الحركة">
    {movementGroups.map((group) => {
      const kinds = kindsInGroup(group);
      return (
        <div key={group}>
          <p className="mb-1.5 px-1 text-xs font-bold text-faint">{GROUP_LABELS[group]}</p>
          <div className={`grid gap-2 ${kinds.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {kinds.map((kind) => {
              const selected = kind === value;
              return (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(kind)}
                  className={`flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-control border-2 px-1.5 py-2.5 text-center transition active:scale-[0.97] ${
                    selected ? `${kindSelectedClass(kind)} ring-4` : "border-transparent bg-surface shadow-card"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${kindChipClass(kind)}`}>
                    <KindIcon kind={kind} size={18} />
                  </span>
                  <span className="text-[14px] leading-tight font-bold text-ink">{MOVEMENT_KIND_LABELS[kind]}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
    <p className="rounded-control bg-hairline-soft px-3 py-2.5 text-sm text-muted">
      <span className="font-bold text-ink">{MOVEMENT_KIND_LABELS[value]}:</span> {kindEffectText(value)}
    </p>
  </div>
);
