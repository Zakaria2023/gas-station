"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** The search and the "owing only" switch live in the URL, so back and refresh keep them. */
export const useCustomerSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const owingOnly = searchParams.get("owing") === "1";

  const go = (params: URLSearchParams) => {
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setOwingOnly = (next: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("owing", "1");
    } else {
      params.delete("owing");
    }
    go(params);
  };

  // Typing waits a moment before touching the URL. Once the URL carries the
  // typed text the effect finds nothing to do.
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  useEffect(() => {
    const typed = search.trim();
    if (typed === (searchParams.get("q") ?? "")) {
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (typed) {
        params.set("q", typed);
      } else {
        params.delete("q");
      }
      go(params);
    }, 300);
    return () => clearTimeout(timer);
    // `go` is rebuilt every render from the same router and params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchParams]);

  return { search, setSearch, owingOnly, setOwingOnly };
};
