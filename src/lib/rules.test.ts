import { describe, expect, it } from "vitest";
import { cashKinds, movementKinds } from "@/db/enum";
import { addDays, addMonths, isIsoDate, monthEnd, todayIso } from "@/utils/dates";
import { foldArabic, formatCount, formatMoney, formatSigned } from "@/utils/text";
import { balanceEntries, bucketOf, foldBalance, owedIn } from "./balances";
import { buildLedger, emptyTotals, stockBefore, stockTotal } from "./ledger";
import { applyToStock, isCash, MOVEMENT_EFFECTS, needsCustomer } from "./movement-rules";
import { amountOf, dayAccount, PriceList, priceFor, pricedKinds, stockValue } from "./pricing";

describe("movement rules, as the sheet's notes state them", () => {
  const start = { full: 41, empty: 434 };

  it("an exchange swaps a full for an empty and keeps the total", () => {
    // Row 2 of the sheet: 41 / 434, 20 exchanges → 21 / 454, total 475.
    const after = applyToStock(start, "exchange", 20);
    expect(after).toEqual({ full: 21, empty: 454 });
    expect(stockTotal(after)).toBe(stockTotal(start));
  });

  it("selling a full lowers the full and the total", () => {
    expect(applyToStock(start, "sell_full", 3)).toEqual({ full: 38, empty: 434 });
  });

  it("selling an empty lowers the empty and the total", () => {
    expect(applyToStock(start, "sell_empty", 4)).toEqual({ full: 41, empty: 430 });
  });

  it("adding stock raises only the full", () => {
    expect(applyToStock(start, "stock_in", 400)).toEqual({ full: 441, empty: 434 });
  });

  it("follows the owner's day: 400 added, 200 sold, 200 left", () => {
    const added = applyToStock({ full: 0, empty: 0 }, "stock_in", 400);
    expect(applyToStock(added, "sell_full", 200)).toEqual({ full: 200, empty: 0 });
  });

  it("only the debt kinds need a customer, of cylinders or of money", () => {
    const withCustomer = movementKinds.filter(needsCustomer);
    expect(withCustomer).toEqual([
      "debt_full",
      "debt_empty",
      "return_full",
      "return_empty",
      "cash_debt",
      "cash_return",
    ]);
  });

  it("money lent or paid back moves no cylinder", () => {
    expect(movementKinds.filter(isCash)).toEqual([...cashKinds]);
    expect(applyToStock(start, "cash_debt", 1)).toEqual(start);
    expect(applyToStock(start, "cash_return", 1)).toEqual(start);
  });

  it("a debt and its return cancel out, on the stock and on the debt", () => {
    for (const [out, back] of [
      ["debt_full", "return_full"],
      ["debt_empty", "return_empty"],
    ] as const) {
      expect(applyToStock(applyToStock(start, out, 5), back, 5)).toEqual(start);
      expect(MOVEMENT_EFFECTS[out].debt?.state).toBe(MOVEMENT_EFFECTS[back].debt?.state);
    }
  });
});

describe("ledger", () => {
  it("carries the closing into the next day's opening", () => {
    const days = buildLedger(
      "2026-10-12",
      "2026-10-13",
      [{ countedOn: "2026-10-12", full: 41, empty: 434 }],
      [
        { businessDate: "2026-10-12", kind: "exchange", quantity: 20, amount: 0, count: 1 },
        { businessDate: "2026-10-13", kind: "sell_full", quantity: 1, amount: 0, count: 1 },
      ],
    );
    expect(days[0]?.closing).toEqual({ full: 21, empty: 454 });
    expect(days[1]?.opening).toEqual({ full: 21, empty: 454 });
    expect(days[1]?.closing).toEqual({ full: 20, empty: 454 });
    expect(days[1]?.counted).toBe(false);
  });

  it("a morning count replaces the carried opening and remembers the difference", () => {
    const days = buildLedger(
      "2026-10-12",
      "2026-10-13",
      [
        { countedOn: "2026-10-12", full: 41, empty: 434 },
        { countedOn: "2026-10-13", full: 60, empty: 415 },
      ],
      [{ businessDate: "2026-10-12", kind: "exchange", quantity: 20, amount: 0, count: 1 }],
    );
    expect(days[1]?.expectedOpening).toEqual({ full: 21, empty: 454 });
    expect(days[1]?.opening).toEqual({ full: 60, empty: 415 });
    expect(days[1]?.counted).toBe(true);
  });

  it("adds up each kind for the day, like the sheet's columns, with its money", () => {
    // Rows arrive already grouped by day and kind: two exchanges are one row.
    const [day] = buildLedger("2026-10-13", "2026-10-13", [], [
      { businessDate: "2026-10-13", kind: "exchange", quantity: 5, amount: 500, count: 2 },
      { businessDate: "2026-10-13", kind: "debt_full", quantity: 1, amount: 100, count: 1 },
    ]);
    expect(day?.totals.exchange).toBe(5);
    expect(day?.totals.debt_full).toBe(1);
    expect(day?.amounts.exchange).toBe(500);
    expect(day?.movementCount).toBe(3);
  });

  it("starts a window from the stock before it, as if every earlier day had been walked", () => {
    // Counted 41 / 434 long ago, then 20 exchanges and 1 full added since.
    const before = stockBefore({ full: 41, empty: 434 }, [
      { kind: "exchange", quantity: 20 },
      { kind: "stock_in", quantity: 1 },
    ]);
    expect(before).toEqual({ full: 22, empty: 454 });
    const [day] = buildLedger("2036-10-13", "2036-10-13", [], [], before);
    expect(day?.opening).toEqual(before);
    expect(day?.expectedOpening).toEqual(before);
    // With no count ever, everything starts from zero.
    expect(stockBefore(null, [{ kind: "stock_in", quantity: 3 }])).toEqual({ full: 3, empty: 0 });
  });

  it("walks across a month end", () => {
    const days = buildLedger("2026-10-30", "2026-11-02", [], []);
    expect(days.map((day) => day.date)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

describe("customer balance", () => {
  it("is what was taken minus what was returned, per type and state, and in money", () => {
    // The sheet's examples: Ahmad took 5 household fulls; returned 2.
    const balance = foldBalance([
      { kind: "debt_full", cylinderType: "household", quantity: 5, amount: 500 },
      { kind: "return_full", cylinderType: "household", quantity: 2, amount: 200 },
      { kind: "debt_empty", cylinderType: "industrial", quantity: 1, amount: 40 },
      { kind: "exchange", cylinderType: "household", quantity: 9, amount: 900 },
    ]);
    expect(balance.household.full).toBe(3);
    expect(balance.industrial.empty).toBe(1);
    expect(balance.total).toBe(4);
    expect(balance.money).toBe(340);
    expect(balance.cash).toBe(0);
    expect(balanceEntries(balance)).toHaveLength(2);
  });

  it("adds the cash borrowed and not paid back to the money, but not to the cylinders", () => {
    const balance = foldBalance([
      { kind: "debt_full", cylinderType: "household", quantity: 2, amount: 200 },
      { kind: "cash_debt", cylinderType: null, quantity: 2, amount: 50_000 },
      { kind: "cash_return", cylinderType: null, quantity: 1, amount: 20_000 },
    ]);
    expect(balance.cash).toBe(30_000);
    expect(balance.money).toBe(30_200);
    expect(balance.total).toBe(2);
    expect(owedIn(balance, "cash")).toBe(30_000);
    expect(owedIn(balance, { cylinderType: "household", state: "full" })).toBe(2);
  });

  it("knows what a return settles: cylinders of its type and state, or money", () => {
    expect(bucketOf("return_empty", "industrial")).toEqual({ cylinderType: "industrial", state: "empty" });
    expect(bucketOf("cash_return", null)).toBe("cash");
    expect(bucketOf("exchange", "household")).toBeNull();
  });
});

describe("money", () => {
  const prices = (gas: number): PriceList => ({
    household: { exchange: gas, sell_full: gas, sell_empty: 30, debt_full: 999 },
    industrial: {},
  });

  it("follows the owner's example: 400 at 100, 200 sold, then the price goes to 110", () => {
    const opening = { full: 400, empty: 0 };
    expect(stockValue(opening, prices(100), "household").full).toBe(40_000);

    // The day's sale keeps the price it was made at.
    const sale = amountOf(200, priceFor(prices(100), "household", "exchange"));
    expect(sale).toBe(20_000);

    // Next day the price is 110: the 200 still in the shop are worth more,
    // and the sale already made is still 20,000.
    const left = applyToStock(opening, "exchange", 200);
    expect(left.full).toBe(200);
    expect(stockValue(left, prices(110), "household").full).toBe(22_000);
    expect(sale).toBe(20_000);
  });

  it("values a full cylinder at بيع مليان, not at the gas-only تبديل price", () => {
    const list: PriceList = { household: { exchange: 160, sell_full: 1_140, sell_empty: 980 }, industrial: {} };
    expect(stockValue({ full: 258, empty: 174 }, list, "household")).toEqual({
      full: 294_120,
      empty: 170_520,
      total: 464_640,
    });
    expect(priceFor(list, "household", "debt_full")).toBe(1_140);
  });

  it("prices a debt and its return like the cylinder they move, ignoring any old debt price", () => {
    expect(priceFor(prices(100), "household", "debt_full")).toBe(100);
    expect(priceFor(prices(100), "household", "return_full")).toBe(100);
    expect(priceFor(prices(100), "household", "debt_empty")).toBe(30);
    expect(priceFor(prices(100), "household", "return_empty")).toBe(30);
    expect(priceFor(prices(100), "household", "stock_in")).toBeNull();
  });

  it("splits the day's money into sold, lent and paid back; adding stock moves no money", () => {
    const account = dayAccount({
      ...emptyTotals(),
      exchange: 2_000,
      sell_empty: 300,
      stock_in: 1_000,
      debt_full: 500,
      return_full: 100,
    });
    expect(account).toEqual({ income: 2_300, credit: 500, settlement: 100 });
  });

  it("counts money lent as a new debt and money paid back as a debt returned", () => {
    const account = dayAccount({ ...emptyTotals(), cash_debt: 50_000, cash_return: 20_000 });
    expect(account.credit).toBe(50_000);
    expect(account.settlement).toBe(20_000);
    expect(account.income).toBe(0);
  });

  it("gives money no list price: its amount is typed", () => {
    expect(pricedKinds).toEqual(["exchange", "sell_full", "sell_empty"]);
    expect(priceFor(prices(100), "household", "cash_debt")).toBeNull();
  });

  it("does not count a movement with no price as free money", () => {
    expect(amountOf(5, null)).toBe(0);
    expect(amountOf(3, 0.1)).toBe(0.3);
  });
});

describe("dates and names", () => {
  // The invisible marks that keep a sign in front of a number in right-to-left text.
  const LRI = String.fromCharCode(0x2066);
  const PDI = String.fromCharCode(0x2069);

  it("adds days on the calendar, not in a time zone", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("steps through months, ends included", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(monthEnd("2028-02")).toBe("2028-02-29");
    expect(monthEnd("2026-10")).toBe("2026-10-31");
  });

  it("knows a real date from a typo", () => {
    expect(isIsoDate("2026-10-13")).toBe(true);
    expect(isIsoDate("2026-13-40")).toBe(false);
    expect(isIsoDate("13/10/2026")).toBe(false);
  });

  it("names today in the shop's time zone", () => {
    // 22:30 UTC on the 12th is already the 13th in Damascus (UTC+3).
    expect(todayIso(new Date(Date.UTC(2026, 9, 12, 22, 30)))).toBe("2026-10-13");
  });

  it("keeps the minus in front of a negative number in a right-to-left line", () => {
    expect(formatCount(-15)).toBe(`${LRI}−15${PDI}`);
    expect(formatMoney(-1500)).toBe(`${LRI}−1,500${PDI} ل.س`);
    expect(formatCount(15)).toBe("15");
    expect(formatSigned(3)).toBe(`${LRI}+3${PDI}`);
    expect(formatSigned(-3)).toBe(`${LRI}−3${PDI}`);
  });

  it("folds the letters people type interchangeably", () => {
    expect(foldArabic("أحمد")).toBe(foldArabic("احمد"));
    expect(foldArabic("فاطمة")).toBe(foldArabic("فاطمه"));
  });
});
