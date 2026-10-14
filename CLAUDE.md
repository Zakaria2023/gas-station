# محطة الغاز — gas cylinder stock, money and customer debts

Replaces an Excel workbook with three sheets: الجرد اليومي (daily count),
ديون الزبائن (customer debts) and ملخص الديون (debt summary), and adds prices.
Used mostly on phones by 3–4 people of one shop, so every screen is designed
mobile-first. **Everything the user sees is Arabic, right to left, in the Cairo
font** (self-hosted in `src/fonts`). Money is Syrian pounds (ل.س).

There is **no sign-in and no users**, on purpose: everyone in the shop opens
the same app and sees everything. Keep the URL private.

## Commands

- `pnpm dev` — http://localhost:3020
- `pnpm type-check`, `pnpm lint`, `pnpm test` (vitest; rules, ledger, balances, pricing are pure and tested)
- `pnpm db:push` — apply `db/schema` to the database (no migration files)

## Stack

Next.js 16 (App Router), React 19, Drizzle ORM on Aiven PostgreSQL (free plan,
20 connections, SSL), Tailwind v4, zod 4 + react-hook-form. Same conventions as
the sibling `tracking` project: `db/` beside `src/` (aliased `@/db`), services
in `src/services`, Server Actions in `src/app/**/actions.ts`, form logic in
`use-*.ts` hooks next to the route.

## The model — read before changing anything

- Two cylinder types (منزلي household, صناعي industrial), each full (مليان) or empty (فاضي).
- **Movements** are the only thing entered day to day. The day's stock, the
  history, every customer's debt and the day's money are all computed from
  them; nothing is stored twice.
- **What each movement does to stock and debt lives in one table**:
  `MOVEMENT_EFFECTS` in `src/lib/movement-rules.ts`. The sheet only documented
  تبديل, بيع مليان, بيع فاضي and فاضي دخل زبون; the debt kinds, their returns
  and `refill` (تعبئة, not in the sheet) are the app's reading.
- **Stock counts** (`stock_counts`) are what was physically there at the START
  of a day. A day opens with the previous day's closing unless counted that
  morning; then the count wins. See `buildLedger` in `src/lib/ledger.ts`.
- **Money debts** (`cash_debt` دين مصاري, `cash_return` رجع دين مصاري) are
  movements too: a customer borrows cash and pays it back. They have no
  cylinder type (`cylinder_type` is null only for them, enforced by a check),
  `quantity` is 1 and `unit_price` is the amount. `isCash` tells them apart.
  The per-type ledger never sees them, so a day's or month's money adds
  `summarizeCash` to its rows.
- A return can never exceed what the customer owes (cylinders of that type
  and state, or `Balance.cash` for money), and a debt that was partly returned
  cannot be deleted first — both checked in a transaction with the customer
  row locked (`src/services/movements.ts`).

## Money — `src/lib/pricing.ts`

- `prices` is a price list with history: a price per cylinder type **per
  movement kind** (`pricedKinds`: every kind but the debts, their returns and
  money, whose amount is typed), effective from a day. A new price is a new row.
- A movement stores the `unit_price` it was entered with (prefilled from the
  list, editable). A later price change never rewrites a past sale.
- The stock on hand is valued at the day's list prices: full at the تبديل
  price, empty at the بيع فاضي price. Raising a price raises the value of
  what is still in the shop (the owner's example: 400 at 100, 200 sold for
  20,000, price to 110 → the 200 left are worth 22,000).
- Debts are cylinders **and** money. A debt or return has no list price of its
  own: it is prefilled at the price of the cylinder it moves, full at تبديل,
  empty at بيع فاضي (`priceFor`), so debts and stock are valued alike. Old
  debt rows in `prices` are ignored. A customer's `Balance.money` is the
  cylinders' worth plus `Balance.cash`, the money borrowed and not paid back.
- `MONEY_FLOW` groups the day's money: income (sales), expense (refill, empties
  bought), credit (debts given, cylinders or money), settlement (debts returned).

## Dates

Business days are `"YYYY-MM-DD"` strings in the shop's zone (`APP_TIME_ZONE`,
default Asia/Damascus); the server runs in UTC. Never derive a business day
from `created_at`, and never do date arithmetic on a local `Date` — use
`addDays`/`todayIso` in `src/utils/dates.ts`. Display uses `ar-SY-u-nu-latn`
(Syrian month names, Western digits, as the sheet had).

## Environment (`.env.local`)

The database is configured field by field (`DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME`, `DB_SSL_MODE`, optional `DB_CA_CERT`,
`DB_CONNECTION_LIMIT`, `DB_POOL_MAX`), read in one place — `db/connection.ts` —
by both the app's pool and drizzle-kit.

## Layout and style

- One page tree, two layouts: a phone column with a bottom tab bar, and from
  `lg` up a dashboard with a right-hand sidebar (`components/layout`). Never
  build a separate desktop page; spread the same page into columns with `lg:`.
- Totals are always `StatTile`s inside a `SummaryCard` (`components/ui`);
  money for any period is `MoneySummary`, stock is `StockSummary`, debts are
  `OwedSummary`. Desktop lists are tables built from `components/ui/data-table.ts`,
  with cards on a phone. Every table column is right-aligned (`text-start`).
- Choices are tapped, not typed: filters open a `BottomSheet` (a dialog on
  desktop); dates show via `DateField`, never the browser's "mm/dd/yyyy".
- Format numbers only with `formatCount` / `formatMoney` / `formatSigned`:
  they wrap signed numbers in a left-to-right isolate so "−15" does not turn
  into "15-" in right-to-left text.
- Any period is cheap: `getLedger` starts a window from the stock before it
  (one parallel round trip), the movements log pages and sums in SQL, and the
  CSV export streams in batches — keep it that way for years of data.

## Gotchas

- The database is far from a dev machine (~2 s to connect, ~280 ms per query).
  Keep pages to few sequential round trips; deploy the app in the same region
  as the Aiven service.
- drizzle-kit wants `ssl` as `true` or an options object, never `false`.
- Sums of money come back as `::float8` (see `src/services/aggregates.ts`);
  Postgres numeric would arrive as a string.
- Inputs are 16px+ (iOS zooms otherwise); fixed bottom bars use `pb-safe`;
  "back" chevrons point right and "next" left (RTL).
