import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ref, get, query, limitToLast } from "firebase/database";
import { db } from "@/src/lib/firebase";

export async function GET() {
  return NextResponse.json({ 
    status: "online", 
    hasKey: !!process.env.GEMINI_API_KEY 
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Configuración incompleta: GEMINI_API_KEY" }, { status: 500 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Formato de mensajes inválido" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Intentar obtener datos de Firebase (silencioso si falla)
    let solarContext = "No hay datos en tiempo real disponibles en este momento.";
    try {
      const psRef = query(ref(db, "sensores/PS"), limitToLast(1));
      const batRef = query(ref(db, "sensores/bateria"), limitToLast(1));
      
      const [psSnap, batSnap] = await Promise.all([get(psRef), get(batRef)]);
      
      let psVal = null;
      let batVal = null;

      if (psSnap.exists()) psVal = Object.values(psSnap.val())[0];
      if (batSnap.exists()) batVal = Object.values(batSnap.val())[0];

      if (psVal || batVal) {
        solarContext = `
          DATOS ACTUALES DEL SISTEMA:
          - Paneles: ${psVal ? `${psVal.voltaje}V, ${psVal.amperaje}mA, ${psVal.potencia}mW` : "Sin datos"}
          - Batería: ${batVal ? `${batVal.voltaje}V, ${batVal.amperaje}mA, ${batVal.potencia}mW` : "Sin datos"}
        `;
      }
    } catch (e) {
      console.warn("Error obteniendo contexto de Firebase, se usará respuesta genérica.");
    }

    // 2. Configurar Gemini e IA
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `
      Eres el Asistente del Dashboard Solar. 
      Contexto técnico: ${solarContext}
      Responde de forma amable, corta (máximo 3 frases) y en español. 
      Si te preguntan por datos específicos, usa el contexto técnico proporcionado.
    `;

    const result = await model.generateContent([systemInstruction, lastUserMessage]);
    const responseText = result.response.text();

    return NextResponse.json({ content: responseText });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json(
      { error: "Error en el servidor de chat", details: error.message },
      { status: 500 }
    );
  }
}
