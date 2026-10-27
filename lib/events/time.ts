import { addDays, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import type { DateFilter, TimeOfDay } from "./filters";

export const EVENT_TIME_ZONE = "America/New_York";

export interface DateRange {
  start: Date;
  end: Date;
}

export function matchesTimeOfDay(
  date: Date,
  timeOfDay: TimeOfDay,
  timeZone = EVENT_TIME_ZONE,
): boolean {
  if (timeOfDay === "anytime") return true;

  const hour = toZonedTime(date, timeZone).getHours();
  switch (timeOfDay) {
    case "morning":
      return hour < 12;
    case "afternoon":
      return hour >= 12 && hour < 17;
    case "evening":
      return hour >= 17;
  }
}

export function resolveDateRange(
  dateFilter: DateFilter,
  now = new Date(),
  timeZone = EVENT_TIME_ZONE,
): DateRange {
  const zonedNow = toZonedTime(now, timeZone);
  let localStart: Date;

  switch (dateFilter.preset) {
    case "today":
      localStart = startOfDay(zonedNow);
      break;
    case "tomorrow":
      localStart = startOfDay(addDays(zonedNow, 1));
      break;
    case "weekend": {
      const day = zonedNow.getDay();
      const daysUntilSaturday = day === 0 ? -1 : 6 - day;
      localStart = startOfDay(addDays(zonedNow, daysUntilSaturday));
      return {
        start: fromZonedTime(localStart, timeZone),
        end: fromZonedTime(addDays(localStart, 2), timeZone),
      };
    }
    case "custom": {
      const [year, month, day] = dateFilter.date.split("-").map(Number);
      localStart = new Date(year, month - 1, day);
      break;
    }
  }

  return {
    start: fromZonedTime(localStart, timeZone),
    end: fromZonedTime(addDays(localStart, 1), timeZone),
  };
}
