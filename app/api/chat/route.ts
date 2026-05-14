import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/src/lib/firebase";
import { Sensor } from "@/src/types/dashboard";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function GET() {
  return NextResponse.json({ 
    status: "online", 
    hasKey: !!process.env.OPENROUTER_API_KEY 
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Configuración incompleta: OPENROUTER_API_KEY" }, { status: 500 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Formato de mensajes inválido" }, { status: 400 });
    }

    // 1. Obtener TODOS los datos históricos de Firebase para contexto completo
    let solarContext = "No hay datos disponibles en este momento.";
    try {
      const psRef = ref(db, "sensores/PS");
      const batRef = ref(db, "sensores/bateria");

      const [psSnap, batSnap] = await Promise.all([get(psRef), get(batRef)]);

      // Parsear todos los registros ordenados por fecha
      const parseSensor = (snap: ReturnType<typeof psSnap.val>): Sensor[] => {
        if (!snap) return [];
        const raw = snap as Record<string, Sensor>;
        return Object.values(raw)
          .map((item) => ({
            ...item,
            fecha: item.fecha?.replace(" ", "T") ?? "",
          }))
          .filter((item) => !!item.fecha)
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      };

      // Estadísticas resumen
      const calcStats = (items: Sensor[]) => {
        if (!items.length) return null;
        const voltajes = items.map((i) => i.voltaje ?? 0);
        const amperajes = items.map((i) => i.amperaje ?? i.corriente ?? 0);
        const potencias = items.map((i) => i.potencia ?? 0);
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const max = (arr: number[]) => Math.max(...arr);
        const min = (arr: number[]) => Math.min(...arr);
        return {
          total: items.length,
          fechaInicio: items[0].fecha,
          fechaFin: items[items.length - 1].fecha,
          voltaje: { avg: avg(voltajes).toFixed(2), max: max(voltajes).toFixed(2), min: min(voltajes).toFixed(2) },
          amperaje: { avg: avg(amperajes).toFixed(2), max: max(amperajes).toFixed(2), min: min(amperajes).toFixed(2) },
          potencia: { avg: avg(potencias).toFixed(2), max: max(potencias).toFixed(2), min: min(potencias).toFixed(2) },
        };
      };

      // Serializar registros con timestamps: si hay muchos, muestrear para no superar el contexto
      const MAX_RECORDS = 300;
      const serializeRecords = (items: Sensor[]): string => {
        if (!items.length) return "  (sin registros)";
        const sample =
          items.length <= MAX_RECORDS
            ? items
            : items.filter((_, i) => i % Math.ceil(items.length / MAX_RECORDS) === 0);
        const note =
          items.length > MAX_RECORDS
            ? `  (mostrando ${sample.length} de ${items.length} registros, muestreados uniformemente)\n`
            : "";
        const rows = sample
          .map(
            (r) =>
              `  [${r.fecha}] V:${r.voltaje}V  I:${r.amperaje ?? r.corriente ?? 0}mA  P:${r.potencia}mW`
          )
          .join("\n");
        return note + rows;
      };

      const psItems = psSnap.exists() ? parseSensor(psSnap.val()) : [];
      const batItems = batSnap.exists() ? parseSensor(batSnap.val()) : [];

      const psStats = calcStats(psItems);
      const batStats = calcStats(batItems);

      if (psStats || batStats) {
        const formatSensor = (
          label: string,
          s: ReturnType<typeof calcStats>,
          items: Sensor[]
        ) => {
          if (!s) return `${label}: Sin datos.`;
          return (
            `=== ${label} ===\n` +
            `Total registros: ${s.total} | Desde: ${s.fechaInicio} | Hasta: ${s.fechaFin}\n` +
            `Resumen → Voltaje: prom ${s.voltaje.avg}V / máx ${s.voltaje.max}V / mín ${s.voltaje.min}V\n` +
            `          Corriente: prom ${s.amperaje.avg}mA / máx ${s.amperaje.max}mA / mín ${s.amperaje.min}mA\n` +
            `          Potencia: prom ${s.potencia.avg}mW / máx ${s.potencia.max}mW / mín ${s.potencia.min}mW\n` +
            `Registros detallados (formato: [fecha] V I P):\n` +
            serializeRecords(items)
          );
        };

        solarContext = [
          formatSensor("PANEL SOLAR (PS)", psStats, psItems),
          formatSensor("BATERÍA", batStats, batItems),
        ].join("\n\n");
      }
    } catch (e) {
      console.warn("Error obteniendo contexto de Firebase:", e);
    }

    // 2. Contexto del asistente
   const systemInstruction = `
    Eres el asistente de un dashboard de monitoreo energético solar.

    CONTEXTO DEL PROYECTO:
    Este proyecto es una maqueta/prototipo educativo universitario orientado al aprendizaje.
    El sistema simula la captura, monitoreo y visualización de energía obtenida desde un panel solar, almacenada en una batería y utilizada para alimentar pequeños bombillos o cargas básicas.

    La captura de datos se realiza mediante sensores INA, los cuales permiten medir:
    - Voltaje
    - Amperaje (corriente)
    - Potencia

    El objetivo del proyecto es enseñar conceptos relacionados con:
    - Energía solar
    - Monitoreo IoT
    - Sensado electrónico
    - Visualización de datos en tiempo real
    - Gestión básica de energía

    Los datos mostrados en el dashboard corresponden a la maqueta/prototipo académico y no a una instalación eléctrica industrial o comercial.

    DATOS DEL SISTEMA (HISTÓRICO COMPLETO CON REGISTROS INDIVIDUALES):
    ${solarContext}

    INSTRUCCIONES DE RESPUESTA:
    - Responde en español.
    - Sé claro y amigable.
    - Tienes acceso a TODOS los registros históricos con su fecha y hora exacta. Úsalos para responder preguntas sobre rangos de tiempo específicos (ej: "entre las 10:00 y 10:30 de ayer").
    - Para filtrar por rango de tiempo, analiza las fechas de los registros detallados y selecciona los que caen en el rango pedido.
    - Si preguntan sobre promedios, máximos, mínimos o tendencias en un período específico, calcula con los registros de ese período.
    - Si preguntan sobre el proyecto, explica que es una maqueta educativa universitaria enfocada en aprendizaje e investigación.
  `;

    const formattedMessages: Message[] = [
      { role: "system", content: systemInstruction },
      ...messages.map((m: Message) => ({
        role: m.role,
        content: m.content
      }))
    ];

    // 3. Llamada a OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://dashboard-panel-solar.vercel.app", // Opcional
        "X-Title": "Solar Dashboard Assistant", // Opcional
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: formattedMessages,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "No recibí una respuesta clara.";

    return NextResponse.json({ content: responseText });

  } catch (error: unknown) {
    console.error("Chat Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error en el servidor de chat", details: errorMessage },
      { status: 500 }
    );
  }
}
