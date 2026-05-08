"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ref, get } from "firebase/database";
import { db } from "@/src/lib/firebase";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  CartesianGrid,
  Legend,
} from "recharts";

type SensorItem = {
  fecha: string;
  voltaje: number;
  amperaje: number;
  potencia: number;
};

type SensorCollection = Record<string, SensorItem>;

type SensoresDB = {
  PS: SensorCollection;
  bateria: SensorCollection;
};

type ChartDataItem = {
  fecha: string;
  timestamp: number;

  voltajePS?: number;
  amperajePS?: number;
  potenciaPS?: number;

  voltajeBat?: number;
  amperajeBat?: number;
  potenciaBat?: number;
};

const normalizeDate = (date: string): string => {
  return date.replace(" ", "T");
};

const parseSensorData = (
  obj: SensorCollection | undefined,
  dateRange?: {
    start: string;
    end: string;
  },
): SensorItem[] => {
  if (!obj) return [];

  const values = Object.values(obj);

  const startTime = dateRange?.start ? new Date(dateRange.start).getTime() : 0;

  const endTime = dateRange?.end ? new Date(dateRange.end).getTime() : Infinity;

  return values
    .map((item) => ({
      ...item,
      fecha: normalizeDate(item.fecha),
    }))
    .filter((item) => {
      const time = new Date(item.fecha).getTime();

      return time >= startTime && time <= endTime;
    })
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
};

const mergeSensorData = (
  psData: SensorItem[],
  batData: SensorItem[],
): ChartDataItem[] => {
  const map = new Map<number, ChartDataItem>();

  psData.forEach((item) => {
    const timestamp = new Date(item.fecha).getTime();

    const existing = map.get(timestamp);

    map.set(timestamp, {
      ...existing,
      fecha: item.fecha,
      timestamp,

      voltajePS: item.voltaje,
      amperajePS: item.amperaje,
      potenciaPS: item.potencia,
    });
  });

  batData.forEach((item) => {
    const timestamp = new Date(item.fecha).getTime();

    const existing = map.get(timestamp);

    map.set(timestamp, {
      ...existing,
      fecha: item.fecha,
      timestamp,

      voltajeBat: item.voltaje,
      amperajeBat: item.amperaje,
      potenciaBat: item.potencia,
    });
  });

  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
};

export default function HistoricoPage() {
  const [mounted, setMounted] = React.useState<boolean>(false);

  const [inputDateRange, setInputDateRange] = React.useState<{
    start: string;
    end: string;
  }>({
    start: "",
    end: "",
  });

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const [chartData, setChartData] = React.useState<ChartDataItem[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleConsultar = async () => {
    try {
      setErrorMsg("");
      if (!inputDateRange.start || !inputDateRange.end) {
        setErrorMsg("Debes seleccionar un rango de fechas.");
        return;
      }
      const startDate = new Date(inputDateRange.start);
      const endDate = new Date(inputDateRange.end);
      if (endDate < startDate) {
        setErrorMsg(
          "La fecha de fin no puede ser anterior a la fecha de inicio.",
        );
        return;
      }

      setIsLoading(true);
      const sensoresRef = ref(db, "sensores");
      const snapshot = await get(sensoresRef);
      if (!snapshot.exists()) {
        setChartData([]);
        return;
      }

      const data = snapshot.val() as SensoresDB;
      // console.log(" ~ handleConsultar ~ data:", data)

      const psData = parseSensorData(data.PS, inputDateRange);
      // console.log(" ~ handleConsultar ~ psData:", psData)

      const batData = parseSensorData(data.bateria, inputDateRange);
      // console.log(" ~ handleConsultar ~ batData:", batData)

      const merged = mergeSensorData(psData, batData);
      // console.log(" ~ handleConsultar ~ merged:", merged)

      setChartData(merged);
    } catch (error) {
      console.error(error);

      setErrorMsg("Ocurrió un error al consultar el histórico.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatXAxis = (value: string) => {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-CO", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(",", "");
  };

 const formatTooltipLabel = (value: React.ReactNode) => {
   if (typeof value !== "string") return "";

   const date = new Date(value);

   if (isNaN(date.getTime())) return value;

   return new Intl.DateTimeFormat("es-CO", {
     year: "numeric",
     month: "short",
     day: "2-digit",
     hour: "2-digit",
     minute: "2-digit",
     second: "2-digit",
   }).format(date);
 };

  if (!mounted) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <label className="text-sm font-semibold text-muted-foreground">
              Fecha y Hora Inicio
            </label>

            <Input
              type="datetime-local"
              value={inputDateRange.start}
              onChange={(e) => {
                setInputDateRange((prev) => ({
                  ...prev,
                  start: e.target.value,
                }));

                setErrorMsg("");
              }}
              className="w-full md:w-56"
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <label className="text-sm font-semibold text-muted-foreground">
              Fecha y Hora Fin
            </label>

            <Input
              type="datetime-local"
              value={inputDateRange.end}
              onChange={(e) => {
                setInputDateRange((prev) => ({
                  ...prev,
                  end: e.target.value,
                }));

                setErrorMsg("");
              }}
              className="w-full md:w-56"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={handleConsultar}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                "Consultar Histórico"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setInputDateRange({
                  start: "",
                  end: "",
                });

                setChartData([]);

                setErrorMsg("");
              }}
              disabled={
                isLoading || (!inputDateRange.start && !inputDateRange.end)
              }
              className="cursor-pointer"
            >
              Limpiar
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="text-sm text-destructive px-2">{errorMsg}</div>
        )}
      </div>

      {/* VOLTAJE */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Voltaje (V)</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full h-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatXAxis}
                  minTickGap={50}
                />

                <YAxis />

                <Tooltip labelFormatter={formatTooltipLabel} />

                <Legend />

                <Line
                  name="Voltaje Panel Solar"
                  dataKey="voltajePS"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  name="Voltaje Batería"
                  dataKey="voltajeBat"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />

                <Brush
                  dataKey="fecha"
                  tickFormatter={formatXAxis}
                  height={30}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* CORRIENTE */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Corriente (mA)</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full h-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatXAxis}
                  minTickGap={50}
                />

                <YAxis />

                <Tooltip labelFormatter={formatTooltipLabel} />

                <Legend />

                <Line
                  name="Corriente Panel Solar"
                  dataKey="amperajePS"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  name="Corriente Batería"
                  dataKey="amperajeBat"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />

                <Brush
                  dataKey="fecha"
                  tickFormatter={formatXAxis}
                  height={30}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* POTENCIA */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Potencia (mW)</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="w-full h-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatXAxis}
                  minTickGap={50}
                />

                <YAxis />

                <Tooltip labelFormatter={formatTooltipLabel} />

                <Legend />

                <Line
                  name="Potencia Panel Solar"
                  dataKey="potenciaPS"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  name="Potencia Batería"
                  dataKey="potenciaBat"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />

                <Brush
                  dataKey="fecha"
                  tickFormatter={formatXAxis}
                  height={30}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
