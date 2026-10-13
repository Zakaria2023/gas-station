"use client";

import { useMemo, useState, useTransition } from "react";
import { CylinderState, CylinderType } from "@/db/enum";
import { Balance, emptyBalance } from "@/lib/balances";
import { cleanName, foldArabic } from "@/utils/text";
import { quickCreateCustomerAction } from "../customers/actions";

export type CustomerOption = {
  uuid: string;
  name: string;
  phone: string | null;
  balance: Balance;
};

type UseCustomerPickerArgs = {
  customers: CustomerOption[];
  onSelect: (uuid: string) => void;
  /** For a return: the bucket that matters, so those who owe it come first. */
  owedBucket: { cylinderType: CylinderType; state: CylinderState } | null;
};

/** The customer list's search, ordering and "add a new one by name" for the movement form. */
export const useCustomerPicker = ({ customers, onSelect, owedBucket }: UseCustomerPickerArgs) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Customers added from here, so they show up before the page reloads.
  const [added, setAdded] = useState<CustomerOption[]>([]);
  const [createError, setCreateError] = useState<string>();
  const [isCreating, startCreating] = useTransition();

  const all = useMemo(() => [...added, ...customers], [added, customers]);

  const owedOf = (customer: CustomerOption) =>
    owedBucket ? customer.balance[owedBucket.cylinderType][owedBucket.state] : customer.balance.total;

  const visible = useMemo(() => {
    const term = foldArabic(query.trim());
    const matches = term
      ? all.filter(
          (customer) =>
            foldArabic(customer.name).includes(term) || (customer.phone ?? "").includes(query.trim()),
        )
      : all;
    if (!owedBucket) {
      return matches;
    }
    const owed = (customer: CustomerOption) => customer.balance[owedBucket.cylinderType][owedBucket.state];
    return [...matches].sort((a, b) => owed(b) - owed(a));
  }, [all, query, owedBucket]);

  const typedName = cleanName(query);
  const canCreate =
    typedName.length >= 2 && !all.some((customer) => foldArabic(customer.name) === foldArabic(typedName));

  const close = () => {
    setOpen(false);
    setQuery("");
    setCreateError(undefined);
  };

  const choose = (uuid: string) => {
    onSelect(uuid);
    close();
  };

  const createFromQuery = () => {
    setCreateError(undefined);
    startCreating(async () => {
      const result = await quickCreateCustomerAction(typedName);
      if (result.customer) {
        setAdded((list) => [{ ...result.customer!, phone: null, balance: emptyBalance() }, ...list]);
        choose(result.customer.uuid);
      } else {
        setCreateError(result.error);
      }
    });
  };

  const find = (uuid: string) => all.find((customer) => customer.uuid === uuid);

  return {
    open,
    setOpen,
    close,
    query,
    setQuery,
    visible,
    choose,
    canCreate,
    typedName,
    createFromQuery,
    isCreating,
    createError,
    find,
    owedOf,
  };
};
