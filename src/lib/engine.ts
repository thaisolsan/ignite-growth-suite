import type { AnswerValue, Opportunity, Settings } from "./types";
import { QUESTIONS, visibleQuestions, isAnswered } from "./questions";

export type Answers = Record<string, AnswerValue>;

const num = (a: Answers, id: string): number | null => {
  const v = a[id];
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  return null;
};
const n0 = (a: Answers, id: string) => num(a, id) ?? 0;
const bool = (a: Answers, id: string) => a[id] === true;
const isFalse = (a: Answers, id: string) => a[id] === false;
const arr = (a: Answers, id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);

export const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
    Number.isFinite(v) ? v : 0,
  );
export const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

export interface Metrics {
  leads: number | null;
  contratos: number | null;
  ticket: number | null;
  lucro: number | null;
  investimento: number | null;
  cpl: number | null;
  cac: number | null;
  taxaAtendimento: number | null;
  taxaQualificacao: number | null;
  taxaVisita: number | null;
  conversaoPresencial: number | null;
  conversaoGeral: number | null;
  capacidadeAtendimento: number | null;
  padronizacaoQualificacao: number | null;
  gapMeta: number | null;
}

export function computeMetrics(a: Answers): Metrics {
  const leads = num(a, "f_leads") ?? num(a, "leads_mes");
  const contratos = num(a, "f_contratos") ?? num(a, "contratos_atuais");
  const ticket = num(a, "ticket");
  const lucro = num(a, "lucro_contrato");
  const investimento = num(a, "investimento");
  const contratosTrafego = num(a, "contratos_trafego");

  const div = (x: number | null, y: number | null) =>
    x !== null && y !== null && y > 0 ? x / y : null;

  const respondidos = num(a, "f_respondidos");
  const qualificados = num(a, "f_qualificados");
  const visitas = num(a, "f_visitas");

  const leadsDia = num(a, "leads_dia");
  const simultaneas = num(a, "conversas_simultaneas");
  const capacidade =
    leadsDia !== null && simultaneas !== null && leadsDia > 0
      ? Math.min(1, (simultaneas * 8) / leadsDia)
      : null;

  const itens = arr(a, "qualifica_itens").length;
  const padronizacao = isAnswered(a["qualifica_itens"]) ? Math.min(1, itens / 12) : null;

  return {
    leads,
    contratos,
    ticket,
    lucro,
    investimento,
    cpl: div(investimento, leads),
    cac: div(investimento, contratosTrafego),
    taxaAtendimento: div(respondidos, leads),
    taxaQualificacao: div(qualificados, respondidos),
    taxaVisita: div(visitas, qualificados),
    conversaoPresencial: div(contratos, visitas),
    conversaoGeral: div(contratos, leads),
    capacidadeAtendimento: capacidade,
    padronizacaoQualificacao: padronizacao,
    gapMeta:
      num(a, "meta_contratos") !== null && contratos !== null
        ? (num(a, "meta_contratos") as number) - contratos
        : null,
  };
}

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  rate: number | null;
  loss: number;
  lostValue: number | null;
}

export function computeFunnel(a: Answers, m: Metrics): FunnelStage[] {
  const unit = m.lucro ?? null;
  const seq: { key: string; label: string; v: number | null }[] = [
    { key: "leads", label: "Leads", v: num(a, "f_leads") ?? num(a, "leads_mes") },
    { key: "respondidos", label: "Respondidos", v: num(a, "f_respondidos") },
    { key: "qualificados", label: "Qualificados", v: num(a, "f_qualificados") },
    { key: "interessados", label: "Interessados", v: num(a, "f_interessados") },
    { key: "visitas", label: "Visitas", v: num(a, "f_visitas") },
    { key: "contratos", label: "Contratos", v: num(a, "f_contratos") ?? num(a, "contratos_atuais") },
  ];
  const filled = seq.filter((s) => s.v !== null) as { key: string; label: string; v: number }[];
  const finalRate = m.conversaoGeral;
  return filled.map((s, i) => {
    const prev = i > 0 ? (filled[i - 1]?.v ?? null) : null;
    const loss = prev !== null ? Math.max(0, prev - s.v) : 0;
    return {
      key: s.key,
      label: s.label,
      value: s.v,
      rate: prev && prev > 0 ? s.v / prev : null,
      loss,
      lostValue: unit !== null && finalRate !== null ? loss * finalRate * unit : null,
    };
  });
}

export interface ScoreBreakdown {
  key: string;
  label: string;
  weight: number;
  score: number; // 0-1
}

export function computeScore(a: Answers, m: Metrics): { total: number; parts: ScoreBreakdown[] } {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const flag = (cond: boolean, v = 1) => (cond ? v : 0);

  const aquisicao = clamp(
    (flag(arr(a, "canais").length >= 3, 0.25) +
      flag(bool(a, "sabe_canal"), 0.25) +
      flag(bool(a, "acompanha_cpl"), 0.2) +
      flag(bool(a, "acompanha_cac"), 0.2) +
      flag(bool(a, "investe_trafego"), 0.1)),
  );

  const tr = num(a, "tempo_resposta");
  const atendimento = clamp(
    (tr === null ? 0.3 : tr <= 5 ? 0.4 : tr <= 10 ? 0.3 : tr <= 30 ? 0.15 : 0) +
      flag(!bool(a, "msgs_sem_resposta"), 0.2) +
      flag(bool(a, "backup_leads"), 0.15) +
      (m.capacidadeAtendimento ?? 0.2) * 0.25,
  );

  const qualificacao = clamp(
    flag(bool(a, "script_padrao"), 0.4) +
      (m.padronizacaoQualificacao ?? 0) * 0.4 +
      flag(!bool(a, "qualificacao_manual"), 0.2),
  );

  const conversao = clamp(
    flag(bool(a, "convite_visita"), 0.2) +
      flag(bool(a, "agendamento"), 0.1) +
      flag(bool(a, "confirmacao"), 0.1) +
      flag(bool(a, "lembrete"), 0.1) +
      flag(bool(a, "roteiro_comercial"), 0.15) +
      flag(bool(a, "processo_fechamento"), 0.15) +
      flag(bool(a, "equipe_objecoes"), 0.1) +
      flag(bool(a, "mede_visita_contrato"), 0.1),
  );

  const followup = clamp(
    flag(bool(a, "followup"), 0.35) +
      flag(bool(a, "followup_sequencia"), 0.2) +
      flag(bool(a, "followup_automatizado"), 0.25) +
      flag(bool(a, "acompanha_antigos"), 0.1) +
      flag(bool(a, "rotina_recuperacao"), 0.1),
  );

  const reativacao = clamp(
    flag(bool(a, "base_existe"), 0.3) + flag(bool(a, "base_reativacao"), 0.7),
  );

  const operacao = clamp(
    flag(!bool(a, "recepcao_ocupada"), 0.3) +
      flag(bool(a, "backup_leads"), 0.3) +
      flag((num(a, "horas_repetitivas") ?? 4) <= 1, 0.2) +
      flag(bool(a, "pos_automatico"), 0.2),
  );

  const dados = clamp(arr(a, "etapas_monitoradas").length / 9);

  const parts: ScoreBreakdown[] = [
    { key: "aquisicao", label: "Aquisição", weight: 20, score: aquisicao },
    { key: "atendimento", label: "Atendimento", weight: 15, score: atendimento },
    { key: "qualificacao", label: "Qualificação", weight: 10, score: qualificacao },
    { key: "conversao", label: "Conversão", weight: 15, score: conversao },
    { key: "followup", label: "Follow-up", weight: 15, score: followup },
    { key: "reativacao", label: "Reativação", weight: 10, score: reativacao },
    { key: "operacao", label: "Operação", weight: 10, score: operacao },
    { key: "dados", label: "Dados", weight: 5, score: dados },
  ];

  const total = Math.round(parts.reduce((s, p) => s + p.weight * p.score, 0));
  return { total, parts };
}

export function scoreLabel(v: number) {
  if (v < 40) return { label: "Crítico", tone: "critical" as const };
  if (v < 60) return { label: "Baixo", tone: "low" as const };
  if (v < 75) return { label: "Intermediário", tone: "mid" as const };
  if (v < 90) return { label: "Bom", tone: "good" as const };
  return { label: "Excelente", tone: "great" as const };
}

const priority = (impact: number, urgency: number, ease: number) =>
  Math.round((impact * urgency * ease * 100) / 125);

export function computeOpportunities(a: Answers, m: Metrics, s: Settings): Opportunity[] {
  const out: Opportunity[] = [];
  const lucro = m.lucro;
  const conv = m.conversaoGeral;

  const push = (
    o: Omit<Opportunity, "priority" | "id"> & { id: string },
  ) => out.push({ ...o, priority: priority(o.impact, o.urgency, o.ease) });

  const tr = num(a, "tempo_resposta");
  const semResposta = n0(a, "leads_sem_resposta");
  if ((tr !== null && tr > s.benchmarkResponseMinutes) || bool(a, "recepcao_ocupada") || semResposta > 0) {
    const potencial =
      lucro !== null && conv !== null && semResposta > 0 ? semResposta * conv * lucro : null;
    push({
      id: "atendimento_imediato",
      name: "Atendimento imediato",
      category: "ATENDIMENTO",
      evidence: [
        tr !== null ? `Tempo médio de primeira resposta: ${tr} min (benchmark ${s.benchmarkResponseMinutes} min).` : "",
        bool(a, "recepcao_ocupada") ? "Leads aguardam quando a recepção está em atendimento presencial." : "",
        semResposta > 0 ? `${semResposta} leads/mês sem resposta (estimativa informada).` : "",
      ].filter(Boolean),
      triggeredBy: ["tempo_resposta", "recepcao_ocupada", "leads_sem_resposta"],
      impact: 5,
      urgency: 5,
      ease: 4,
      complexity: "Média",
      timeframe: "0–30 dias",
      solution:
        "Camada de atendimento imediato 24/7 com triagem automática, distribuição de conversas e escalonamento humano.",
      monthlyPotential: potencial,
    });
  }

  if (bool(a, "qualificacao_manual") || (num(a, "horas_repetitivas") ?? 0) > 0 || isFalse(a, "script_padrao")) {
    const horas = n0(a, "horas_repetitivas");
    push({
      id: "qualificacao_estruturada",
      name: "Qualificação estruturada e automatizada",
      category: "OPERAÇÃO",
      evidence: [
        horas > 0 ? `${horas}h/dia gastas com perguntas repetitivas (≈ ${BRL(horas * 22 * s.hourlyRate)}/mês de custo operacional estimado).` : "",
        isFalse(a, "script_padrao") ? "Não existe roteiro padrão de qualificação." : "",
        bool(a, "qualificacao_manual") ? "Qualificação 100% manual." : "",
      ].filter(Boolean),
      triggeredBy: ["qualificacao_manual", "horas_repetitivas", "script_padrao"],
      impact: 4,
      urgency: 4,
      ease: 5,
      complexity: "Baixa",
      timeframe: "0–30 dias",
      solution: "Roteiro único de qualificação + respostas automáticas para as dúvidas recorrentes.",
      monthlyPotential: horas > 0 ? horas * 22 * s.hourlyRate : null,
    });
  }

  if (isFalse(a, "followup") || (bool(a, "followup") && isFalse(a, "followup_automatizado"))) {
    const parados = n0(a, "leads_parados");
    const potencial =
      lucro !== null && conv !== null && parados > 0
        ? parados * (s.recoveryRate / 100) * conv * lucro
        : null;
    push({
      id: "followup",
      name: "Follow-up estruturado e recuperação de leads",
      category: "FOLLOW-UP",
      evidence: [
        isFalse(a, "followup") ? "Não existe follow-up estruturado." : "Follow-up existe, porém manual.",
        parados > 0 ? `${parados} leads parados informados.` : "",
      ].filter(Boolean),
      triggeredBy: ["followup", "followup_automatizado", "leads_parados"],
      impact: 5,
      urgency: 4,
      ease: 4,
      complexity: "Média",
      timeframe: "30–60 dias",
      solution: "Cadência automática de 5 a 7 toques com quebra de objeção e retomada de agendamento.",
      monthlyPotential: potencial,
    });
  }

  const base = n0(a, "base_total");
  if (base >= 100 && (isFalse(a, "base_reativacao") || !isAnswered(a["base_reativacao"]))) {
    const potencial =
      lucro !== null && conv !== null
        ? base * (s.reactivationRate / 100) * Math.max(conv, 0.02) * lucro
        : null;
    push({
      id: "reativacao",
      name: "Reativação da base antiga",
      category: "REATIVAÇÃO",
      evidence: [`Base com ${base} contatos sem campanha de reativação ativa.`],
      triggeredBy: ["base_total", "base_reativacao"],
      impact: 4,
      urgency: 3,
      ease: 5,
      complexity: "Baixa",
      timeframe: "30–60 dias",
      solution: "Campanha de reativação segmentada por estágio (pediu informação, visitou, desistiu).",
      monthlyPotential: potencial,
    });
  }

  const novos = n0(a, "ig_seguidores_novos");
  if (novos > 0 && isFalse(a, "ig_aborda_novos")) {
    const potencial =
      lucro !== null && conv !== null ? novos * 0.05 * Math.max(conv, 0.03) * lucro : null;
    push({
      id: "instagram",
      name: "Novo seguidor → lead qualificado",
      category: "INSTAGRAM",
      evidence: [`${novos} novos seguidores/mês sem abordagem estruturada.`],
      triggeredBy: ["ig_seguidores_novos", "ig_aborda_novos"],
      impact: 4,
      urgency: 3,
      ease: 4,
      complexity: "Média",
      timeframe: "30–60 dias",
      solution:
        "Fluxo: novo seguidor → mensagem natural → intenção → categoria → prazo → convite → WhatsApp → visita.",
      monthlyPotential: potencial,
    });
  }

  if (isFalse(a, "convite_visita") || (m.taxaVisita !== null && m.taxaVisita * 100 < s.benchmarkVisitRate)) {
    const qualificados = n0(a, "f_qualificados");
    const gap =
      m.taxaVisita !== null ? Math.max(0, (s.benchmarkVisitRate / 100 - m.taxaVisita) * qualificados) : 0;
    const potencial =
      lucro !== null && m.conversaoPresencial !== null && gap > 0
        ? gap * m.conversaoPresencial * lucro
        : null;
    push({
      id: "conversao_visita",
      name: "Conversão para visita presencial",
      category: "CONVERSÃO",
      evidence: [
        isFalse(a, "convite_visita") ? "Não existe convite estruturado para visita." : "",
        m.taxaVisita !== null ? `Taxa de visita: ${pct(m.taxaVisita)} (benchmark ${s.benchmarkVisitRate}%).` : "",
      ].filter(Boolean),
      triggeredBy: ["convite_visita", "f_visitas"],
      impact: 5,
      urgency: 4,
      ease: 3,
      complexity: "Média",
      timeframe: "0–30 dias",
      solution: "Convite obrigatório para visita com agenda, oferta de horário e confirmação.",
      monthlyPotential: potencial,
    });
  }

  if (bool(a, "agendamento") && (isFalse(a, "confirmacao") || isFalse(a, "lembrete"))) {
    push({
      id: "no_show",
      name: "Redução de no-show",
      category: "CONVERSÃO",
      evidence: ["Visitas agendadas sem confirmação e/ou lembrete automático."],
      triggeredBy: ["confirmacao", "lembrete"],
      impact: 3,
      urgency: 4,
      ease: 5,
      complexity: "Baixa",
      timeframe: "0–30 dias",
      solution: "Confirmação automática + lembretes em D-1 e no dia da visita.",
      monthlyPotential: null,
    });
  }

  const monitoradas = arr(a, "etapas_monitoradas").length;
  if (isAnswered(a["etapas_monitoradas"]) && 9 - monitoradas >= 2) {
    push({
      id: "pipeline",
      name: "Pipeline e métricas comerciais",
      category: "DADOS",
      evidence: [`${9 - monitoradas} etapas do funil não são monitoradas.`],
      triggeredBy: ["etapas_monitoradas"],
      impact: 3,
      urgency: 3,
      ease: 4,
      complexity: "Média",
      timeframe: "60–90 dias",
      solution: "Pipeline único com etapas obrigatórias e painel semanal de conversão.",
      monthlyPotential: null,
    });
  }

  if (isFalse(a, "acompanha_cpl") || isFalse(a, "acompanha_cac")) {
    push({
      id: "atribuicao",
      name: "Atribuição de canais (CPL / CAC)",
      category: "AQUISIÇÃO",
      evidence: ["Custo por lead e/ou custo por contrato não são acompanhados."],
      triggeredBy: ["acompanha_cpl", "acompanha_cac"],
      impact: 3,
      urgency: 3,
      ease: 4,
      complexity: "Média",
      timeframe: "60–90 dias",
      solution: "Rastreamento de origem por canal/campanha até o contrato assinado.",
      monthlyPotential: null,
    });
  }

  if (isFalse(a, "pos_indicacao") || isFalse(a, "pos_campanha_indicacao") || isFalse(a, "pos_avaliacao")) {
    const contratos = m.contratos ?? 0;
    const potencial = lucro !== null && contratos > 0 ? contratos * 0.1 * lucro : null;
    push({
      id: "posvenda",
      name: "Pós-venda, avaliações e indicação",
      category: "PÓS-VENDA",
      evidence: ["Não existe processo estruturado de avaliação e/ou indicação após o contrato."],
      triggeredBy: ["pos_indicacao", "pos_avaliacao", "pos_campanha_indicacao"],
      impact: 3,
      urgency: 2,
      ease: 4,
      complexity: "Baixa",
      timeframe: "60–90 dias",
      solution: "Jornada pós-contrato com boas-vindas, lembretes, avaliação e campanha de indicação.",
      monthlyPotential: potencial,
    });
  }

  return out.sort((x, y) => y.priority - x.priority);
}

export function opportunityBucket(o: Opportunity) {
  if (o.impact >= 4 && o.complexity === "Baixa") return "Quick win";
  if (o.impact >= 4) return "Projeto estratégico";
  return "Baixa prioridade";
}

export interface Projection {
  scenario: string;
  upliftPct: number;
  projectedConversion: number | null;
  additionalContracts: number | null;
  incrementalRevenue: number | null;
  incrementalProfit: number | null;
  annualProfit: number | null;
}

export function computeProjections(m: Metrics): Projection[] {
  const scenarios = [
    { scenario: "Conservador", uplift: 0.15 },
    { scenario: "Provável", uplift: 0.3 },
    { scenario: "Expansão", uplift: 0.5 },
  ];
  return scenarios.map(({ scenario, uplift }) => {
    if (m.conversaoGeral === null || m.leads === null || m.contratos === null) {
      return {
        scenario,
        upliftPct: uplift,
        projectedConversion: null,
        additionalContracts: null,
        incrementalRevenue: null,
        incrementalProfit: null,
        annualProfit: null,
      };
    }
    const projected = m.conversaoGeral * (1 + uplift);
    const add = Math.max(0, m.leads * projected - m.contratos);
    return {
      scenario,
      upliftPct: uplift,
      projectedConversion: projected,
      additionalContracts: add,
      incrementalRevenue: m.ticket !== null ? add * m.ticket : null,
      incrementalProfit: m.lucro !== null ? add * m.lucro : null,
      annualProfit: m.lucro !== null ? add * m.lucro * 12 : null,
    };
  });
}

export function totalMonthlyPotential(opps: Opportunity[]) {
  const values = opps.map((o) => o.monthlyPotential).filter((v): v is number => v !== null);
  return values.length ? values.reduce((s, v) => s + v, 0) : null;
}

export interface PlanPhase {
  title: string;
  window: string;
  focus: string[];
  actions: { name: string; category: string; why: string }[];
}

export function buildPlan(opps: Opportunity[]): PlanPhase[] {
  const pick = (frame: string) => opps.filter((o) => o.timeframe === frame);
  return [
    {
      title: "Fase 1 — Estrutura",
      window: "Dias 1–30",
      focus: ["Atendimento", "Organização", "Pipeline", "Qualificação", "Velocidade"],
      actions: pick("0–30 dias").map((o) => ({ name: o.solution, category: o.name, why: o.evidence[0] ?? "" })),
    },
    {
      title: "Fase 2 — Conversão",
      window: "Dias 31–60",
      focus: ["Follow-up", "Recuperação", "Visita", "Instagram", "Reativação"],
      actions: pick("30–60 dias").map((o) => ({ name: o.solution, category: o.name, why: o.evidence[0] ?? "" })),
    },
    {
      title: "Fase 3 — Escala",
      window: "Dias 61–90",
      focus: ["Otimização", "Métricas", "Campanhas", "Expansão", "Performance"],
      actions: pick("60–90 dias").map((o) => ({ name: o.solution, category: o.name, why: o.evidence[0] ?? "" })),
    },
  ];
}

export function progress(a: Answers) {
  const vis = visibleQuestions(a);
  const done = vis.filter((q) => isAnswered(a[q.id])).length;
  return { done, total: vis.length, ratio: vis.length ? done / vis.length : 0 };
}

/** Motor de próxima pergunta: prioriza dados que mais alteram o diagnóstico. */
export function nextBestQuestion(a: Answers) {
  const weights: Record<string, number> = {
    tempo_resposta: 100,
    f_leads: 95,
    f_contratos: 92,
    lucro_contrato: 90,
    ticket: 85,
    followup: 84,
    leads_parados: 80,
    base_total: 76,
    f_visitas: 74,
    convite_visita: 72,
    msgs_sem_resposta: 70,
    recepcao_ocupada: 68,
    ig_seguidores_novos: 60,
    ig_aborda_novos: 58,
    etapas_monitoradas: 55,
    investimento: 52,
  };
  const vis = visibleQuestions(a).filter((q) => !isAnswered(a[q.id]));
  if (!vis.length) return null;
  const scored = vis
    .map((q) => ({ q, w: weights[q.id] ?? 10 - QUESTIONS.findIndex((x) => x.id === q.id) / 100 }))
    .sort((x, y) => y.w - x.w);
  return scored[0]?.q ?? null;
}

export function alerts(a: Answers, m: Metrics): string[] {
  const list: string[] = [];
  if (m.lucro === null) list.push("Lucro não informado — projeção de lucro indisponível.");
  if (m.leads === null) list.push("Volume de leads não informado — funil incompleto.");
  const tr = num(a, "tempo_resposta");
  if (tr !== null && tr > 30) list.push("Tempo de primeira resposta muito acima do benchmark.");
  if (bool(a, "msgs_sem_resposta")) list.push("Existem mensagens sem resposta na operação.");
  if (isFalse(a, "followup")) list.push("Sem follow-up estruturado: perda direta de oportunidades.");
  return list;
}

export function executiveSummary(a: Answers, m: Metrics, score: number, opps: Opportunity[]) {
  const top = opps.slice(0, 3).map((o) => o.name);
  const strengths: string[] = [];
  if (bool(a, "followup")) strengths.push("Follow-up já existe e pode ser potencializado");
  if (bool(a, "convite_visita")) strengths.push("A operação já convida o lead para visita");
  if (bool(a, "investe_trafego")) strengths.push("Existe geração ativa de demanda");
  if (bool(a, "script_padrao")) strengths.push("Há roteiro de qualificação em uso");
  return {
    situacao: `Eficiência comercial de ${score}/100, com conversão geral de ${pct(m.conversaoGeral)} e ${
      m.contratos ?? "—"
    } contratos/mês.`,
    gargalos: opps.slice(0, 4).map((o) => `${o.category}: ${o.evidence[0] ?? o.name}`),
    fortes: strengths.length ? strengths : ["A operação possui demanda ativa a ser melhor aproveitada"],
    oportunidades: top,
    dados: [
      `CPL: ${m.cpl !== null ? BRL(m.cpl) : "não informado"}`,
      `CAC: ${m.cac !== null ? BRL(m.cac) : "não informado"}`,
      `Conversão presencial: ${pct(m.conversaoPresencial)}`,
    ],
  };
}
