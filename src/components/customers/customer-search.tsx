"use client";

import { Search, X } from "lucide-react";
import { useCustomerSearch } from "@/app/customers/use-customer-search";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

export const CustomerSearch = () => {
  const { search, setSearch, owingOnly, setOwingOnly } = useCustomerSearch();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <Search size={19} className="pointer-events-none absolute start-3.5 top-3.5 text-faint" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف"
          className="ps-11 pe-11"
          enterKeyHint="search"
          type="search"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="مسح البحث"
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-faint"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <Segmented
        label="عرض"
        value={owingOnly ? "owing" : "all"}
        onChange={(next) => setOwingOnly(next === "owing")}
        options={[
          { value: "all", label: "كل الزبائن" },
          { value: "owing", label: "اللي عليهم دين" },
        ]}
      />
    </div>
  );
};
