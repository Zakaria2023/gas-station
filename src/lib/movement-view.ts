import type { MovementRow } from "@/services/movements";
import { appTimeZone, formatTime } from "@/utils/dates";

/** A movement as a list on the phone shows it: the time already written in the shop's zone. */
export type MovementView = Omit<MovementRow, "createdAt"> & { time: string };

/** Server-side only: the phone's own time zone may not be the shop's. */
export const toMovementViews = (rows: MovementRow[]): MovementView[] => {
  const timeZone = appTimeZone();
  return rows.map(({ createdAt, ...row }) => ({ ...row, time: formatTime(createdAt, timeZone) }));
};
