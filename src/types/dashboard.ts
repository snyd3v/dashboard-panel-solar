export interface MetricData {
  title: string;
  voltage: number;
  current: number;
  power: number;
  fecha: string;
  status?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface HistoryData {
  time: string;
  vSolar: number;
  vBat: number;
  vOut: number;
  iSolar: number;
  iBat: number;
  iOut: number;
}

export interface Sensor {
  voltaje: number;
  corriente: number;
  potencia: number;
  fecha: string;
}

export interface SensoresDB {
  PS: Sensor;
  bateria: Sensor;
}

export interface ChartData {
  fecha: string;
  voltaje: number;
  amperaje: number;
  potencia: number;
}