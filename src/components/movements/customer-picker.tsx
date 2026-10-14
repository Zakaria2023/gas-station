"use client";

import { ChevronDown, Search, UserPlus, UserRound } from "lucide-react";
import { CustomerOption, useCustomerPicker } from "@/app/movements/use-customer-picker";
import { BalanceChips } from "@/components/customers/balance-chips";
import { CustomerAvatar } from "@/components/customers/customer-avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { OwedBucket } from "@/lib/balances";
import { formatCount, formatMoney } from "@/utils/text";

type CustomerPickerProps = {
  customers: CustomerOption[];
  value: string;
  onChange: (uuid: string) => void;
  owedBucket: OwedBucket | null;
  invalid?: boolean;
};

/** A button showing the chosen customer; tapping it opens a searchable list from the bottom. */
export const CustomerPicker = ({ customers, value, onChange, owedBucket, invalid = false }: CustomerPickerProps) => {
  const picker = useCustomerPicker({ customers, onSelect: onChange, owedBucket });
  const selected = value ? picker.find(value) : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => picker.setOpen(true)}
        className={`flex min-h-16 w-full items-center gap-3 rounded-control border-2 bg-surface px-3 py-2.5 text-start transition active:bg-hover ${
          invalid ? "border-danger" : selected ? "border-hairline" : "border-dashed border-hairline"
        }`}
      >
        {selected ? (
          <>
            <CustomerAvatar name={selected.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-ink">{selected.name}</span>
              <span className="mt-0.5 block">
                <BalanceChips balance={selected.balance} />
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hairline-soft text-muted">
              <UserRound size={22} />
            </span>
            <span className="flex-1 text-base font-semibold text-muted">اختر الزبون</span>
          </>
        )}
        <ChevronDown size={20} className="shrink-0 text-faint" />
      </button>

      <BottomSheet open={picker.open} onClose={picker.close} title="اختر الزبون">
        <div className="sticky top-0 z-10 bg-surface px-4 pb-3">
          <div className="relative">
            <Search size={19} className="pointer-events-none absolute start-3.5 top-3.5 text-faint" />
            <Input
              autoFocus
              value={picker.query}
              onChange={(event) => picker.setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو الرقم، أو اكتب اسماً جديداً"
              className="ps-11"
              enterKeyHint="search"
            />
          </div>
        </div>

        <ul className="px-2 pb-4">
          {picker.canCreate && (
            <li>
              <button
                type="button"
                onClick={picker.createFromQuery}
                disabled={picker.isCreating}
                className="flex min-h-14 w-full items-center gap-3 rounded-control px-2 text-start active:bg-primary-tint disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <UserPlus size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-muted">{picker.isCreating ? "جارٍ الإضافة…" : "زبون جديد"}</span>
                  <span className="block truncate text-base font-bold text-primary">{picker.typedName}</span>
                </span>
              </button>
            </li>
          )}
          {picker.createError && (
            <li className="px-2 pb-2">
              <FormError message={picker.createError} />
            </li>
          )}
          {picker.visible.map((customer) => {
            const owed = picker.owedOf(customer);
            return (
              <li key={customer.uuid}>
                <button
                  type="button"
                  onClick={() => picker.choose(customer.uuid)}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-control px-2 py-2 text-start active:bg-hover ${
                    customer.uuid === value ? "bg-primary-tint" : ""
                  }`}
                >
                  <CustomerAvatar name={customer.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-ink">{customer.name}</span>
                    {owedBucket ? (
                      <span className={`block text-sm ${owed > 0 ? "font-semibold text-debts" : "text-faint"}`}>
                        {owedBucket === "cash"
                          ? owed > 0
                            ? `عليه ${formatMoney(owed)}`
                            : "ما عليه مصاري"
                          : owed > 0
                            ? `عليه ${formatCount(owed)}`
                            : "ما عليه من هذا الصنف"}
                      </span>
                    ) : (
                      <span className="mt-0.5 block">
                        <BalanceChips balance={customer.balance} />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          {picker.visible.length === 0 && !picker.canCreate && (
            <li className="px-4 py-8 text-center text-sm text-muted">
              {customers.length === 0 ? "ما في زبائن بعد. اكتب اسم لإضافته." : "ما في زبون بهذا الاسم"}
            </li>
          )}
        </ul>
      </BottomSheet>
    </>
  );
};
