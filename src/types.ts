export interface Component {
  id: string;
  name: string;
  package: string;
  quantity: number;
  description: string;
}

export interface Net {
  name: string;
  pins: { componentId: string; pinName: string }[];
}

export interface PCBLayout {
  boardSize: { width: number; height: number };
  components: {
    id: string;
    x: number;
    y: number;
    rotation: number;
  }[];
  traces: {
    netName: string;
    points: { x: number; y: number }[];
  }[];
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  parameters: PCBParameters;
  bom?: Component[];
  netlist?: Net[];
  layout?: PCBLayout;
  drc?: string[];
  pipelineStep: number;
}

export interface PCBParameters {
  voltage: string;
  signalType: 'Analog' | 'Digital' | 'RF';
  traceWidth: number;
  layerCount: number;
  boardSize: string;
  frequency: string;
  material: string;
  thermal: string;
  emi: string;
  modelPreference?: 'Gemini' | 'Claude';
}

export type UserRole = 'student' | 'startup' | 'admin';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}
