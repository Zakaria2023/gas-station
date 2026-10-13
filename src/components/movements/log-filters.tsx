"use client";

import { CalendarRange, Check, ChevronDown, ListFilter, RotateCcw, UserRound, X } from "lucide-react";
import { ReactNode } from "react";
import { QuickRange, useLogFilters } from "@/app/movements/use-log-filters";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { DateField } from "@/components/ui/date-field";
import { TYPE_DOT } from "@/components/ui/type-badge";
import { CylinderType, cylinderTypes, MovementKind } from "@/db/enum";
import { CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { kindsInGroup, movementGroups } from "@/lib/movement-rules";
import { formatShortDay } from "@/utils/dates";
import { GROUP_LABELS, kindChipClass, KindIcon } from "./kind-style";

type LogFiltersProps = {
  today: string;
  /** The name of the customer the log is narrowed to, when it is. */
  customerName: string | null;
};

const RANGES: { value: QuickRange; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "آخر 7 أيام" },
  { value: "month", label: "هذا الشهر" },
  { value: "lastMonth", label: "الشهر الماضي" },
  { value: "year", label: "هذه السنة" },
  { value: "all", label: "كل الأيام" },
];

/** One of the three buttons in the bar: what is chosen now, and a tap to change it. */
const FilterButton = ({
  icon,
  text,
  changed,
  onClick,
  label,
}: {
  icon: ReactNode;
  text: string;
  changed: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`${label}: ${text}`}
    className={`flex min-h-12 min-w-0 items-center gap-2 rounded-control border px-3 text-start transition lg:min-w-44 ${
      changed
        ? "border-primary/30 bg-primary-tint text-primary"
        : "border-hairline bg-surface text-ink hover:border-faint"
    }`}
  >
    <span className={`shrink-0 ${changed ? "" : "text-muted"}`}>{icon}</span>
    <span className="min-w-0 flex-1">
      <span className={`block text-[11px] leading-tight font-semibold ${changed ? "text-primary/80" : "text-faint"}`}>
        {label}
      </span>
      <span className="block truncate text-sm leading-tight font-bold">{text}</span>
    </span>
    <ChevronDown size={16} className="shrink-0 opacity-60" />
  </button>
);

/** A choice in a sheet: a big row with a tick on the one in force. */
const Option = ({
  selected,
  onClick,
  icon,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
}) => (
  <li>
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-13 w-full items-center gap-3 rounded-control px-3 text-start text-base transition ${
        selected ? "bg-primary-tint font-bold text-primary" : "text-ink hover:bg-hover active:bg-hover"
      }`}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {selected && <Check size={20} />}
    </button>
  </li>
);

const SheetBody = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-4 px-3 pb-4">{children}</div>
);

const SheetHeading = ({ children }: { children: ReactNode }) => (
  <p className="px-3 text-xs font-bold text-faint">{children}</p>
);

/**
 * The log's filters as one tidy bar — period, type, movement — each opening a
 * list of choices (a sheet on a phone, a dialog on a desktop). The customer
 * filter appears as a chip when the log was opened from a customer.
 */
export const LogFilters = ({ today, customerName }: LogFiltersProps) => {
  const filters = useLogFilters(today);
  const from = filters.value("from");
  const to = filters.value("to");
  const type = filters.value("type") as CylinderType | "";
  const kind = filters.value("kind") as MovementKind | "";

  const periodText = filters.activeRange
    ? RANGES.find((range) => range.value === filters.activeRange)!.label
    : from && to
      ? from === to
        ? formatShortDay(from)
        : `${formatShortDay(from)} – ${formatShortDay(to)}`
      : from
        ? `من ${formatShortDay(from)}`
        : `حتى ${formatShortDay(to)}`;


  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Phone: the period gets its own row, as its text is the longest. */}
        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center [&>*:first-child]:col-span-2">
          <FilterButton
            label="الفترة"
            icon={<CalendarRange size={19} />}
            text={periodText}
            changed={Boolean(from || to)}
            onClick={() => filters.openSheet("period")}
          />
          <FilterButton
            label="الصنف"
            icon={<CylinderIcon filled size={19} />}
            text={type ? CYLINDER_TYPE_LABELS[type] : "الكل"}
            changed={Boolean(type)}
            onClick={() => filters.openSheet("type")}
          />
          <FilterButton
            label="الحركة"
            icon={kind ? <KindIcon kind={kind} size={19} /> : <ListFilter size={19} />}
            text={kind ? MOVEMENT_KIND_LABELS[kind] : "الكل"}
            changed={Boolean(kind)}
            onClick={() => filters.openSheet("kind")}
          />

          {customerName && (
            <button
              type="button"
              onClick={() => filters.apply({ customer: "" })}
              className="col-span-2 flex min-h-12 items-center gap-2 rounded-control border border-primary/30 bg-primary-tint px-3 text-sm font-bold text-primary lg:col-span-1"
            >
              <UserRound size={18} />
              <span className="truncate">{customerName}</span>
              <X size={16} className="ms-auto opacity-70" />
            </button>
          )}

          {filters.any && (
            <button
              type="button"
              onClick={filters.clearAll}
              className="col-span-2 flex min-h-10 items-center justify-center gap-1.5 rounded-control text-sm font-semibold text-muted hover:text-ink lg:col-span-1 lg:min-h-12 lg:px-3"
            >
              <RotateCcw size={15} />
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      <BottomSheet open={filters.sheet === "period"} onClose={filters.closeSheet} title="الفترة">
        <SheetBody>
          <ul role="radiogroup" aria-label="الفترة" className="flex flex-col gap-1">
            {RANGES.map((range) => (
              <Option
                key={range.value}
                selected={filters.activeRange === range.value}
                onClick={() => filters.setRange(range.value)}
              >
                {range.label}
              </Option>
            ))}
          </ul>
          <div className="flex flex-col gap-3 rounded-card bg-hover p-3">
            <SheetHeading>أو من يوم إلى يوم</SheetHeading>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DateField label="من" value={filters.draftFrom} max={filters.draftTo || today} onChange={filters.setDraftFrom} />
              <DateField label="إلى" value={filters.draftTo} min={filters.draftFrom} max={today} onChange={filters.setDraftTo} />
            </div>
            <Button block size="lg" onClick={filters.applyDraft} disabled={!filters.draftFrom || !filters.draftTo}>
              عرض هذه الفترة
            </Button>
          </div>
        </SheetBody>
      </BottomSheet>

      <BottomSheet open={filters.sheet === "type"} onClose={filters.closeSheet} title="الصنف">
        <SheetBody>
          <ul role="radiogroup" aria-label="الصنف" className="flex flex-col gap-1">
            <Option selected={!type} onClick={() => filters.apply({ type: "" })}>
              كل الأصناف
            </Option>
            {cylinderTypes.map((option) => (
              <Option
                key={option}
                selected={type === option}
                onClick={() => filters.apply({ type: option })}
                icon={<span className={`h-3 w-3 rounded-full ${TYPE_DOT[option]}`} />}
              >
                {CYLINDER_TYPE_LABELS[option]}
              </Option>
            ))}
          </ul>
        </SheetBody>
      </BottomSheet>

      <BottomSheet open={filters.sheet === "kind"} onClose={filters.closeSheet} title="الحركة">
        <SheetBody>
          <ul role="radiogroup" aria-label="الحركة" className="flex flex-col gap-1">
            <Option selected={!kind} onClick={() => filters.apply({ kind: "" })} icon={<ListFilter size={20} className="text-muted" />}>
              كل الحركات
            </Option>
          </ul>
          {movementGroups.map((group) => (
            <div key={group} className="flex flex-col gap-1">
              <SheetHeading>{GROUP_LABELS[group]}</SheetHeading>
              <ul role="radiogroup" aria-label={GROUP_LABELS[group]} className="flex flex-col gap-1">
                {kindsInGroup(group).map((option) => (
                  <Option
                    key={option}
                    selected={kind === option}
                    onClick={() => filters.apply({ kind: option })}
                    icon={
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${kindChipClass(option)}`}>
                        <KindIcon kind={option} size={17} />
                      </span>
                    }
                  >
                    {MOVEMENT_KIND_LABELS[option]}
                  </Option>
                ))}
              </ul>
            </div>
          ))}
        </SheetBody>
      </BottomSheet>
    </>
  );
};
