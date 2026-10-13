import { CYLINDER_TYPE_LABELS, MOVEMENT_KIND_LABELS } from "@/db/label";
import { parseMovementFilters } from "@/lib/movement-filters";
import { amountOf } from "@/lib/pricing";
import { streamMovements } from "@/services";
import { appTimeZone, formatTime, todayIso } from "@/utils";

const HEADERS = ["التاريخ", "الحركة", "الصنف", "الزبون", "العدد", "سعر الواحدة", "المبلغ", "ملاحظة", "وقت التسجيل"];

/** A spreadsheet cell: quoted, with quotes doubled, and never read as a formula. */
const cell = (value: string | number | null): string => {
  if (value === null) {
    return "";
  }
  const text = String(value);
  const safe = /^[=+\-@]/.test(text) && typeof value === "string" ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

/**
 * The filtered log as a CSV that Excel opens in Arabic (UTF-8 with a BOM).
 * Streamed batch by batch, so years of movements never sit in memory at once.
 */
export const GET = (request: Request) => {
  const filters = parseMovementFilters(Object.fromEntries(new URL(request.url).searchParams));
  const timeZone = appTimeZone();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`﻿${HEADERS.map(cell).join(",")}\r\n`));
        for await (const batch of streamMovements(filters)) {
          const lines = batch.map((row) =>
            [
              row.businessDate,
              MOVEMENT_KIND_LABELS[row.kind],
              CYLINDER_TYPE_LABELS[row.cylinderType],
              row.customerName,
              row.quantity,
              row.unitPrice,
              row.unitPrice === null ? null : amountOf(row.quantity, row.unitPrice),
              row.note,
              formatTime(row.createdAt, timeZone),
            ]
              .map(cell)
              .join(","),
          );
          controller.enqueue(encoder.encode(`${lines.join("\r\n")}\r\n`));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="movements-${todayIso()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
};
