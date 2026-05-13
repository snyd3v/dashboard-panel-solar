# Dashboard de Panel Solar ☀️🔋

Este proyecto es un panel de control interactivo diseñado para monitorear en tiempo real el rendimiento de un sistema de paneles solares y almacenamiento en baterías. Permite visualizar métricas críticas como voltaje, corriente y potencia, además de analizar la eficiencia del sistema.

## 🚀 Características principales

- **Monitoreo en Tiempo Real:** Integración con Firebase Realtime Database para actualizaciones instantáneas.
- **Gráficos Interactivos:** Visualización de datos históricos y actuales usando Recharts.
- **Análisis de Eficiencia:** Cálculo automático de la diferencia entre energía generada y consumida.
- **Diseño Moderno:** Interfaz responsiva y elegante construida con Next.js, Tailwind CSS y componentes de shadcn/ui.
- **Exportación de Datos:** Funcionalidad para exportar reportes (basado en la dependencia `xlsx`).

## 🛠️ Tecnologías utilizadas

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript
- **Base de Datos:** Firebase Realtime Database
- **Estilos:** Tailwind CSS
- **Componentes:** shadcn/ui & Lucide React
- **Gráficos:** Recharts

---

## 💻 Guía de Instalación Local

Sigue estos pasos para configurar el proyecto en tu entorno local.

### 1. Requisitos previos

Asegúrate de tener instalado:
- **Node.js** (Versión 18 o superior recomendada)
- **pnpm** (Recomendado) o `npm` / `yarn`

### 2. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/dashboard-panel-solar.git
cd dashboard-panel-solar
```

### 3. Instalar dependencias

El proyecto utiliza `pnpm` para la gestión de paquetes.

**Windows / Linux / macOS:**
```bash
pnpm install
```
*(Si prefieres usar npm, ejecuta `npm install`)*

### 4. Configuración de Variables de Entorno

Crea un archivo llamado `.env.local` en la raíz del proyecto basándote en el archivo de ejemplo:

**Linux / macOS:**
```bash
cp .env.example .env.local
```

**Windows (PowerShell):**
```powershell
cp .env.example .env.local
```

**Windows (CMD):**
```cmd
copy .env.example .env.local
```

Luego, abre el archivo `.env.local` y reemplaza los valores con tus credenciales de Firebase.

### 5. Iniciar el Servidor de Desarrollo

Una vez instaladas las dependencias y configuradas las variables, inicia el proyecto:

**Windows / Linux / macOS:**
```bash
pnpm dev
```
*(O `npm run dev` si usas npm)*

El servidor estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 📁 Estructura del Proyecto

- `app/`: Contiene las rutas y páginas principales (Dashboard, Datos, Gráficos).
- `src/components/`: Componentes reutilizables de la interfaz.
- `src/lib/`: Utilidades y configuración de Firebase.
- `src/types/`: Definiciones de tipos TypeScript.

---
