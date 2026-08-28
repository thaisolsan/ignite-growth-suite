export type SchoolStatus = "em_andamento" | "concluido";

export interface School {
  id: string;
  name: string;
  cnpj: string;
  owner: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
  city: string;
  state: string;
  units: number;
  employees: number;
  receptionists: number;
  sales: number;
  notes: string;
  status: SchoolStatus;
  demo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AnswerValue = string | number | boolean | string[] | null;

export interface Meeting {
  id: string;
  schoolId: string;
  startedAt: string;
  finishedAt?: string;
  answers: Record<string, AnswerValue>;
  outcome?: "ganho" | "perdido" | "negociacao" | "pendente";
  outcomeNotes?: string;
  summary?: string;
}

export type OpportunityCategory =
  | "AQUISIÇÃO"
  | "ATENDIMENTO"
  | "CONVERSÃO"
  | "FOLLOW-UP"
  | "REATIVAÇÃO"
  | "INSTAGRAM"
  | "OPERAÇÃO"
  | "DADOS"
  | "PÓS-VENDA";

export interface Opportunity {
  id: string;
  name: string;
  category: OpportunityCategory;
  evidence: string[];
  triggeredBy: string[];
  impact: number; // 1-5
  urgency: number; // 1-5
  ease: number; // 1-5
  priority: number; // 0-100
  complexity: "Baixa" | "Média" | "Alta";
  timeframe: string;
  solution: string;
  monthlyPotential: number | null;
}

export interface ProposalItem {
  id: string;
  name: string;
  base: number;
  hours: number;
  complexity: number;
  priority: number;
  enabled: boolean;
}

export interface Proposal {
  id: string;
  schoolId: string;
  meetingId: string;
  createdAt: string;
  title: string;
  intro: string;
  items: ProposalItem[];
  price: number;
  conditions: string;
  status: "rascunho" | "enviada" | "negociacao" | "fechada" | "perdida";
  versions: { at: string; snapshot: string }[];
}

export interface ActivityLog {
  id: string;
  at: string;
  actor: string;
  entity: string;
  entityId: string;
  field: string;
  before: string;
  after: string;
}

export interface Settings {
  consultant: string;
  benchmarkVisitRate: number; // %
  benchmarkResponseMinutes: number;
  recoveryRate: number; // %
  reactivationRate: number; // %
  hourlyRate: number;
}

export interface DBShape {
  schools: School[];
  meetings: Meeting[];
  proposals: Proposal[];
  logs: ActivityLog[];
  settings: Settings;
  session: { email: string; name: string } | null;
}
