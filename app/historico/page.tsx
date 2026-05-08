"use client";
import * as React from "react";
import { BatteryCharging, Sun } from "lucide-react";
import { MetricCard } from "@/src/components/MetricCard";
import { MetricData, SensoresDB } from "@/src/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ref, onValue } from "firebase/database";
import { db } from "@/src/lib/firebase";
import { getLastValue, parseChartData } from "@/src/lib/utils";
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
} from "recharts";

export default function HistoricoPage() {
  const [mounted, setMounted] = React.useState<boolean>(false);
  const [inputDateRange, setInputDateRange] = React.useState<{ start: string; end: string }>({ start: "", end: "" });
  const [appliedDateRange, setAppliedDateRange] = React.useState<{ start: string; end: string }>({ start: "", end: "" });
  const [metrics, setMetrics] = React.useState<MetricData[]>([]);
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

        const psData = parseChartData(data.PS, appliedDateRange);
        const batData = parseChartData(data.bateria, appliedDateRange);

        const ps = getLastValue(data.PS);
        const bat = getLastValue(data.bateria);

        // ⚡ valores
        const generado = ps.potencia;
        const consumo = bat.potencia > 0 ? bat.potencia : 0;
        const eficiencia = generado - consumo;
        setSummary({
          generado,
          consumo,
          eficiencia,
        });

        // unir por índice
        const merged = psData.map((item, index) => ({
          fecha: item.fecha,
          voltajePS: item.voltaje,
          amperajePS: item.amperaje,
          potenciaPS: item.potencia,
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
          }
        ];
        setMetrics(newMetrics);
      }
    });

    return () => unsubscribe();
  }, [appliedDateRange]);

  if (!mounted) return null;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="flex flex-col gap-1.5 w-full md:w-auto">
          <label className="text-sm font-semibold text-muted-foreground">Fecha y Hora Inicio</label>
          <Input
            type="datetime-local"
            value={inputDateRange.start}
            onChange={(e) => setInputDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-full md:w-56"
          />
        </div>
        <div className="flex flex-col gap-1.5 w-full md:w-auto">
          <label className="text-sm font-semibold text-muted-foreground">Fecha y Hora Fin</label>
          <Input
            type="datetime-local"
            value={inputDateRange.end}
            onChange={(e) => setInputDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-full md:w-56"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={() => setAppliedDateRange(inputDateRange)}
            className="w-full md:w-auto h-10 cursor-pointer"
          >
            Consultar Histórico
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setInputDateRange({ start: "", end: "" });
              setAppliedDateRange({ start: "", end: "" });
            }}
            disabled={!appliedDateRange.start && !appliedDateRange.end && !inputDateRange.start && !inputDateRange.end}
            className="w-full md:w-auto h-10 cursor-pointer"
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voltaje */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Voltaje (V)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Line name="Voltaje Panel Solar" dataKey="voltajePS" stroke="#3b82f6" dot={false} strokeWidth={2} />
                  <Line name="Voltaje Baterias" dataKey="voltajeBat" stroke="#22c55e" dot={false} strokeWidth={2} />
                  <Brush dataKey="fecha" height={30} stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Corriente */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Corriente (mA)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Line name="Corriente Panel Solar" type="monotone" dataKey="amperajePS" stroke="#eab308" strokeWidth={2} dot={false} />
                  <Line name="Corriente Baterias" type="monotone" dataKey="amperajeBat" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Brush dataKey="fecha" height={30} stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Potencia */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Potencia (mW)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Line name="Potencia Panel Solar" dataKey="potenciaPS" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line name="Potencia Baterias" dataKey="potenciaBat" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Brush dataKey="fecha" height={30} stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
