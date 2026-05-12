"use client";
import * as React from "react";
import { BatteryCharging, Sun } from "lucide-react";
import { MetricCard } from "@/src/components/MetricCard";
import { MetricData, SensoresDB } from "@/src/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ref, onValue } from "firebase/database";
import { db } from "@/src/lib/firebase";
import { getLastValue, parseChartData } from "@/src/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [mounted, setMounted] = React.useState<boolean>(false);
  const [metrics, setMetrics] = React.useState<MetricData[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState({
    generado: 0,
    consumo: 0,
    eficiencia: 0,
  });

  React.useEffect(() => {
    setMounted(true);

    const sensoresRef = ref(db, "sensores");

    const unsubscribe = onValue(sensoresRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as SensoresDB;

        const psData = parseChartData(data.PS);
        const batData = parseChartData(data.bateria);

        const ps = getLastValue(data.PS);
        const bat = getLastValue(data.bateria);

        // ⚡ valores en tiempo real
        const generado = ps.potencia; // lo que generan los paneles
        const consumo = bat.potencia > 0 ? bat.potencia : 0;
        const eficiencia = generado - consumo;
        setSummary({
          generado,
          consumo,
          eficiencia,
        });

        // unir por índice (asumiendo mismo tamaño)
        const merged = psData.map((item, index) => ({
          fecha: item.fecha,

          // PS
          voltajePS: item.voltaje,
          amperajePS: item.amperaje,
          potenciaPS: item.potencia,

          // Batería
          voltajeBat: batData[index]?.voltaje ?? 0,
          amperajeBat: batData[index]?.amperaje ?? 0,
          potenciaBat: batData[index]?.potencia ?? 0,
        }));

        setChartData(merged);

        const newMetrics: MetricData[] = [
          {
            title: "Paneles Solares",
            voltage: ps.voltaje,
            current: ps.amperaje,
            power: ps.potencia,
            fecha: ps.fecha,
            icon: Sun,
            status: "Active",
          },
          {
            title: "Baterias",
            voltage: bat.voltaje,
            current: bat.amperaje,
            power: bat.potencia,
            fecha: bat.fecha,
            icon: BatteryCharging,
            status: "Active",
          },
          // {
          //   title: "Paneles Solares",
          //   voltage: data.panel?.voltaje ?? data.voltaje,
          //   current: data.panel?.corriente ??  data.amperaje,
          //   power: data.panel?.potencia ?? data.potencia,
          //   icon: Sun,
          //   status: "Active",
          // },
          // {
          //   title: "Almacenamiento/Batería",
          //   voltage: data.bateria?.voltaje ?? 0,
          //   current: data.bateria?.corriente ?? 0,
          //   power: data.bateria?.potencia ?? 0,
          //   icon: BatteryCharging,
          //   status: "Active",
          // },
          // {
          //   title: "Consumo LEDs",
          //   voltage: data.leds?.voltaje ?? 0,
          //   current: data.leds?.corriente ?? 0,
          //   power: data.leds?.potencia ?? 0,
          //   icon: Lightbulb,
          //   status: "Active",
          // },
        ];

        setMetrics(newMetrics);
      }
    });

    return () => unsubscribe();
  }, []);

  // const metrics: MetricData[] = [
  //   {
  //     title: "Paneles Solares",
  //     voltage: 5.2,
  //     current: 1.1,
  //     power: 5.72,
  //     icon: Sun,
  //     status: "Active",
  //   },
  //   {
  //     title: "Almacenamiento/Batería",
  //     voltage: 3.7,
  //     current: -0.5,
  //     power: 1.85,
  //     status: "Active",
  //     icon: BatteryCharging,
  //   },
  //   {
  //     title: "Consumo LEDs",
  //     voltage: 5.0,
  //     current: 0.9,
  //     power: 4.5,
  //     status: "Active",
  //     icon: Lightbulb,
  //   },
  // ];

  if (!mounted) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Voltaje */}
        <Card>
          <CardHeader>
            <CardTitle>Voltaje (V)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-60 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />

                  <Line
                    name="Voltaje Panel Solar"
                    dataKey="voltajePS"
                    stroke="#3b82f6"
                  />
                  <Line
                    name="Voltaje Baterias"
                    dataKey="voltajeBat"
                    stroke="#22c55e"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Corriente */}
        <Card>
          <CardHeader>
            <CardTitle>Corriente (mhA)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-60 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    name="Corriente Panel Solar"
                    type="monotone"
                    dataKey="amperajePS"
                    stroke="#eab308"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    name="Corriente Baterias"
                    type="monotone"
                    dataKey="amperajeBat"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Potencia */}
        <Card>
          <CardHeader>
            <CardTitle>Potencia (mhW)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-60 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />

                  <Line
                    name="Potencia Panel Solar"
                    dataKey="potenciaPS"
                    stroke="#ef4444"
                  />
                  <Line
                    name="Potencia Baterias"
                    dataKey="potenciaBat"
                    stroke="#f97316"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SUMMARY SECTION */}
      <Card className="bg-linear-to-br from-background to-muted/30 border-border/50">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Generado */}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Generado Total
              </p>
              <p className="text-4xl font-black text-foreground">
                {summary.generado.toFixed(2)}{" "}
                <span className="text-lg font-bold">W</span>
              </p>
            </div>

            {/* Consumo */}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Consumo Total
              </p>
              <p className="text-4xl font-black text-foreground">
                {summary.consumo.toFixed(2)}{" "}
                <span className="text-lg font-bold">W</span>
              </p>
            </div>

            {/* Eficiencia */}
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Eficiencia
              </p>

              <div className="flex items-baseline gap-2">
                <p
                  className={`text-4xl font-black ${
                    summary.eficiencia >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {summary.eficiencia >= 0 ? "+" : ""}
                  {summary.eficiencia.toFixed(2)}{" "}
                  <span className="text-lg font-bold">W</span>
                </p>

                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    summary.eficiencia >= 0
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {summary.eficiencia >= 0 ? "OPTIMAL" : "DEFICIT"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
