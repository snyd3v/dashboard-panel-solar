import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
// import { Sensor } from "../types/dashboard";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getLastValue = (obj: unknown): { voltaje: number; amperaje: number; potencia: number; fecha: string } => {
  if (!obj) return { voltaje: 0, amperaje: 0, potencia: 0, fecha: "" };

  const values = Object.values(obj) as { voltaje: number; amperaje: number; potencia: number; fecha: string }[];

  if (values.length === 0) return { voltaje: 0, amperaje: 0, potencia: 0, fecha: "" };

  // O(N) instead of O(N log N) with heavy Date parsing
  let latest = values[values.length - 1]; // Fallback if lengths are huge
  let maxTime = new Date(latest.fecha).getTime();

  for (let i = 0; i < values.length; i++) {
    const time = new Date(values[i].fecha).getTime();
    if (time >= maxTime) {
      maxTime = time;
      latest = values[i];
    }
  }

  return latest;
};

export const parseChartData = (
  obj: unknown,
  dateRange?: { start: string; end: string }
) => {
  if (!obj) return [];

  const rawValues = Object.values(obj) as {
    fecha: string;
    voltaje: number;
    amperaje: number;
    potencia: number;
  }[];

  // Map only once
  let dataWithTime = rawValues.map((item) => ({
    ...item,
    _time: new Date(item.fecha).getTime() || 0,
  }));

  if (dateRange && (dateRange.start || dateRange.end)) {
    let startT = 0;
    let endT = Infinity;
    
    if (dateRange.start) {
      startT = dateRange.start.includes("T") 
        ? new Date(dateRange.start).getTime() 
        : new Date(`${dateRange.start}T00:00:00`).getTime();
    }
    
    if (dateRange.end) {
      endT = dateRange.end.includes("T")
        ? new Date(dateRange.end).getTime()
        : new Date(`${dateRange.end}T23:59:59`).getTime();
    }

    dataWithTime = dataWithTime.filter(
      (item) => item._time >= startT && item._time <= endT
    );
  } else {
    dataWithTime = dataWithTime.slice(-50);
  }

  // Sort efficiently using precalculated timestamp
  dataWithTime.sort((a, b) => a._time - b._time);

  return dataWithTime.map((item) => {
    const isFiltered = dateRange && (dateRange.start || dateRange.end);
    const fechaFormat = isFiltered
      ? item.fecha.substring(5, 16) // "MM-DD HH:mm"
      : item.fecha.split(" ")[1]; // "HH:mm:ss"

    return {
      fecha: fechaFormat,
      voltaje: item.voltaje,
      amperaje: item.amperaje,
      potencia: item.potencia,
    };
  });
};