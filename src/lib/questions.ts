import type { AnswerValue } from "./types";

export type QuestionType =
  | "number"
  | "currency"
  | "percent"
  | "text"
  | "longtext"
  | "boolean"
  | "select"
  | "multi";

export interface Question {
  id: string;
  block: string;
  label: string;
  type: QuestionType;
  options?: string[];
  hint?: string;
  weightHint?: string;
  showIf?: (a: Record<string, AnswerValue>) => boolean;
}

export const BLOCKS = [
  "01 — Negócio",
  "02 — Aquisição",
  "03 — Atendimento",
  "04 — Qualificação",
  "05 — Funil",
  "06 — Visita presencial",
  "07 — Follow-up",
  "08 — Instagram",
  "09 — Base antiga",
  "10 — Pós-venda",
] as const;

const yes = (a: Record<string, AnswerValue>, id: string) => a[id] === true;
const no = (a: Record<string, AnswerValue>, id: string) => a[id] === false;

export const QUESTIONS: Question[] = [
  // BLOCO 1 — NEGÓCIO
  { id: "meta_contratos", block: BLOCKS[0], label: "Qual é a meta mensal de contratos?", type: "number" },
  { id: "contratos_atuais", block: BLOCKS[0], label: "Quantos contratos são fechados atualmente por mês?", type: "number" },
  { id: "melhor_mes", block: BLOCKS[0], label: "Qual foi o melhor mês dos últimos 6 meses (contratos)?", type: "number" },
  { id: "pior_mes", block: BLOCKS[0], label: "Qual foi o pior mês (contratos)?", type: "number" },
  { id: "faturamento", block: BLOCKS[0], label: "Qual é o faturamento médio mensal?", type: "currency" },
  { id: "ticket", block: BLOCKS[0], label: "Qual é o ticket médio?", type: "currency" },
  { id: "lucro_contrato", block: BLOCKS[0], label: "Qual é o lucro médio estimado por contrato?", type: "currency", hint: "Sem esse dado, projeções de lucro ficam indisponíveis." },
  { id: "funcionarios", block: BLOCKS[0], label: "Quantas pessoas trabalham na empresa?", type: "number" },
  { id: "atendentes", block: BLOCKS[0], label: "Quantas pessoas trabalham diretamente no atendimento?", type: "number" },
  { id: "unidades", block: BLOCKS[0], label: "Quantas unidades existem?", type: "number" },

  // BLOCO 2 — AQUISIÇÃO
  { id: "canais", block: BLOCKS[1], label: "Quais canais geram leads?", type: "multi", options: ["Instagram", "Google", "Meta Ads", "Indicação", "Fachada / Passagem", "WhatsApp", "Site", "Outros"] },
  { id: "investe_trafego", block: BLOCKS[1], label: "Vocês investem em tráfego pago?", type: "boolean" },
  { id: "investimento", block: BLOCKS[1], label: "Quanto investem por mês em tráfego pago?", type: "currency", showIf: (a) => yes(a, "investe_trafego") },
  { id: "leads_mes", block: BLOCKS[1], label: "Quantos leads chegam mensalmente?", type: "number" },
  { id: "leads_ads", block: BLOCKS[1], label: "Quantos leads vêm de anúncios?", type: "number", showIf: (a) => yes(a, "investe_trafego") },
  { id: "leads_organico", block: BLOCKS[1], label: "Quantos leads vêm organicamente?", type: "number" },
  { id: "leads_indicacao", block: BLOCKS[1], label: "Quantos leads vêm de indicação?", type: "number" },
  { id: "contratos_trafego", block: BLOCKS[1], label: "Quantos contratos são atribuídos ao tráfego pago?", type: "number", showIf: (a) => yes(a, "investe_trafego") },
  { id: "sabe_canal", block: BLOCKS[1], label: "Vocês sabem qual canal gera mais contratos?", type: "boolean" },
  { id: "sabe_campanha", block: BLOCKS[1], label: "Vocês sabem qual campanha gera mais contratos?", type: "boolean", showIf: (a) => yes(a, "investe_trafego") },
  { id: "acompanha_cpl", block: BLOCKS[1], label: "Vocês acompanham custo por lead?", type: "boolean" },
  { id: "acompanha_cac", block: BLOCKS[1], label: "Vocês acompanham custo por contrato?", type: "boolean" },
  { id: "ads_fora_horario", block: BLOCKS[1], label: "Os anúncios funcionam fora do horário comercial?", type: "boolean", showIf: (a) => yes(a, "investe_trafego") },
  { id: "acao_fora_horario", block: BLOCKS[1], label: "O que acontece quando um lead chega fora do horário?", type: "select", options: ["Fica sem resposta até o dia seguinte", "Responde alguém do time eventualmente", "Resposta automática simples", "Atendimento estruturado 24/7"] },

  // BLOCO 3 — ATENDIMENTO
  { id: "leads_dia", block: BLOCKS[2], label: "Quantos leads chegam por dia?", type: "number" },
  { id: "conversas_simultaneas", block: BLOCKS[2], label: "Quantas conversas simultâneas a recepção consegue atender?", type: "number" },
  { id: "tempo_resposta", block: BLOCKS[2], label: "Qual o tempo médio da primeira resposta (minutos)?", type: "number", hint: "Benchmark: até 10 minutos." },
  { id: "quem_responde", block: BLOCKS[2], label: "Quem responde os leads?", type: "text" },
  { id: "quem_whatsapp", block: BLOCKS[2], label: "Quem responde o WhatsApp?", type: "text" },
  { id: "quem_presencial", block: BLOCKS[2], label: "Quem atende presencialmente?", type: "text" },
  { id: "quem_alunos", block: BLOCKS[2], label: "Quem atende os alunos já matriculados?", type: "text" },
  { id: "quem_instagram", block: BLOCKS[2], label: "Quem responde o Instagram?", type: "text" },
  { id: "quem_fora_horario", block: BLOCKS[2], label: "Quem atende fora do horário comercial?", type: "text" },
  { id: "msgs_sem_resposta", block: BLOCKS[2], label: "Existem mensagens que ficam sem resposta?", type: "boolean" },
  { id: "leads_sem_resposta", block: BLOCKS[2], label: "Quantos leads por mês ficam sem resposta (estimativa)?", type: "number", showIf: (a) => yes(a, "msgs_sem_resposta") },
  { id: "frequencia_sem_resposta", block: BLOCKS[2], label: "Com que frequência isso acontece?", type: "select", options: ["Diariamente", "Algumas vezes por semana", "Raramente"], showIf: (a) => yes(a, "msgs_sem_resposta") },
  { id: "recepcao_ocupada", block: BLOCKS[2], label: "Quando a recepcionista está em atendimento presencial, os leads ficam esperando?", type: "boolean" },
  { id: "backup_leads", block: BLOCKS[2], label: "Existe alguém para assumir os leads nesse momento?", type: "boolean" },
  { id: "horas_repetitivas", block: BLOCKS[2], label: "Quantas horas por dia são gastas respondendo perguntas repetitivas?", type: "number" },
  { id: "perguntas_repetidas", block: BLOCKS[2], label: "Quais são as perguntas mais repetidas?", type: "longtext" },

  // BLOCO 4 — QUALIFICAÇÃO
  { id: "perguntas_iniciais", block: BLOCKS[3], label: "O que vocês perguntam quando um novo lead chega?", type: "longtext" },
  { id: "qualifica_itens", block: BLOCKS[3], label: "Quais informações são coletadas hoje?", type: "multi", options: ["Primeira habilitação", "Categoria A", "Categoria B", "Categoria AB", "Manual", "Automático", "Adição", "Mudança de categoria", "Já conhece a autoescola", "Quando pretende começar", "Já pesquisou concorrentes", "Fator de decisão"] },
  { id: "script_padrao", block: BLOCKS[3], label: "Existe um roteiro/pergunta padrão de qualificação?", type: "boolean" },
  { id: "qualificacao_manual", block: BLOCKS[3], label: "A qualificação é feita 100% manualmente?", type: "boolean" },
  { id: "fator_decisao", block: BLOCKS[3], label: "O que mais influencia a decisão do aluno?", type: "text" },

  // BLOCO 5 — FUNIL
  { id: "f_leads", block: BLOCKS[4], label: "Quantos leads entram por mês?", type: "number" },
  { id: "f_respondidos", block: BLOCKS[4], label: "Quantos são respondidos?", type: "number" },
  { id: "f_qualificados", block: BLOCKS[4], label: "Quantos são qualificados?", type: "number" },
  { id: "f_interessados", block: BLOCKS[4], label: "Quantos demonstram interesse real?", type: "number" },
  { id: "f_visitas", block: BLOCKS[4], label: "Quantos vão presencialmente à autoescola?", type: "number" },
  { id: "f_contratos", block: BLOCKS[4], label: "Quantos fecham contrato?", type: "number" },
  { id: "etapas_monitoradas", block: BLOCKS[4], label: "Quais etapas do funil são realmente monitoradas hoje?", type: "multi", options: ["Lead", "Respondido", "Qualificado", "Interessado", "Orçamento", "Visita agendada", "Visita realizada", "Negociação", "Contrato"] },

  // BLOCO 6 — VISITA
  { id: "convite_visita", block: BLOCKS[5], label: "A pessoa é convidada para visitar a autoescola?", type: "boolean" },
  { id: "agendamento", block: BLOCKS[5], label: "Existe agendamento da visita?", type: "boolean", showIf: (a) => yes(a, "convite_visita") },
  { id: "confirmacao", block: BLOCKS[5], label: "Existe confirmação automática?", type: "boolean", showIf: (a) => yes(a, "agendamento") },
  { id: "lembrete", block: BLOCKS[5], label: "Existe lembrete antes da visita?", type: "boolean", showIf: (a) => yes(a, "agendamento") },
  { id: "processo_recepcao", block: BLOCKS[5], label: "Existe processo estruturado de recepção?", type: "boolean" },
  { id: "roteiro_comercial", block: BLOCKS[5], label: "Existe roteiro comercial na visita?", type: "boolean" },
  { id: "processo_fechamento", block: BLOCKS[5], label: "Existe processo de fechamento?", type: "boolean" },
  { id: "equipe_qualifica", block: BLOCKS[5], label: "A equipe sabe qualificar intenção de compra?", type: "boolean" },
  { id: "equipe_objecoes", block: BLOCKS[5], label: "A equipe sabe tratar objeções?", type: "boolean" },
  { id: "mede_visita_contrato", block: BLOCKS[5], label: "Vocês medem a conversão de visita para contrato?", type: "boolean" },

  // BLOCO 7 — FOLLOW-UP
  { id: "lead_para_responder", block: BLOCKS[6], label: "O que acontece quando o lead para de responder?", type: "longtext" },
  { id: "followup", block: BLOCKS[6], label: "Existe follow-up estruturado?", type: "boolean" },
  { id: "followup_quem", block: BLOCKS[6], label: "Quem faz o follow-up?", type: "text", showIf: (a) => yes(a, "followup") },
  { id: "followup_prazo", block: BLOCKS[6], label: "Quanto tempo depois (horas)?", type: "number", showIf: (a) => yes(a, "followup") },
  { id: "followup_sequencia", block: BLOCKS[6], label: "Existe uma sequência definida?", type: "boolean", showIf: (a) => yes(a, "followup") },
  { id: "followup_contatos", block: BLOCKS[6], label: "Quantos contatos são realizados?", type: "number", showIf: (a) => yes(a, "followup") },
  { id: "followup_ferramenta", block: BLOCKS[6], label: "Qual ferramenta é utilizada?", type: "text", showIf: (a) => yes(a, "followup") },
  { id: "followup_automatizado", block: BLOCKS[6], label: "O follow-up é automatizado?", type: "boolean", showIf: (a) => yes(a, "followup") },
  { id: "followup_taxa", block: BLOCKS[6], label: "Qual a taxa estimada de recuperação (%)?", type: "percent", showIf: (a) => yes(a, "followup") },
  { id: "acompanha_antigos", block: BLOCKS[6], label: "Existe acompanhamento de leads antigos?", type: "boolean" },
  { id: "leads_parados", block: BLOCKS[6], label: "Quantos leads estão parados hoje (estimativa)?", type: "number" },
  { id: "quase_fecharam", block: BLOCKS[6], label: "Quantos quase fecharam e não voltaram?", type: "number" },
  { id: "rotina_recuperacao", block: BLOCKS[6], label: "Existe rotina de recuperação?", type: "boolean" },

  // BLOCO 8 — INSTAGRAM
  { id: "ig_seguidores_novos", block: BLOCKS[7], label: "Quantos seguidores novos por mês?", type: "number" },
  { id: "ig_views", block: BLOCKS[7], label: "Quantas visualizações por mês?", type: "number" },
  { id: "ig_mensagens", block: BLOCKS[7], label: "Quantas mensagens (direct) por mês?", type: "number" },
  { id: "ig_comentarios", block: BLOCKS[7], label: "Quantos comentários por mês?", type: "number" },
  { id: "ig_aborda_novos", block: BLOCKS[7], label: "Pessoas novas que seguem são abordadas?", type: "boolean" },
  { id: "ig_processo_comentarios", block: BLOCKS[7], label: "Existe processo para comentários?", type: "boolean" },
  { id: "ig_processo_stories", block: BLOCKS[7], label: "Existe processo para quem responde stories?", type: "boolean" },
  { id: "ig_para_whatsapp", block: BLOCKS[7], label: "Existe processo para levar seguidores ao WhatsApp?", type: "boolean" },
  { id: "ig_leads", block: BLOCKS[7], label: "Quantos seguidores viram leads por mês?", type: "number" },
  { id: "ig_visitas", block: BLOCKS[7], label: "Quantos leads do Instagram viram visitas?", type: "number" },
  { id: "ig_contratos", block: BLOCKS[7], label: "Quantos viram contratos?", type: "number" },

  // BLOCO 9 — BASE ANTIGA
  { id: "base_existe", block: BLOCKS[8], label: "Existe banco de leads antigos?", type: "boolean" },
  { id: "base_total", block: BLOCKS[8], label: "Quantos contatos existem na base?", type: "number", showIf: (a) => yes(a, "base_existe") },
  { id: "base_nunca_fecharam", block: BLOCKS[8], label: "Quantos nunca fecharam?", type: "number", showIf: (a) => yes(a, "base_existe") },
  { id: "base_pediram_info", block: BLOCKS[8], label: "Quantos pediram informações?", type: "number", showIf: (a) => yes(a, "base_existe") },
  { id: "base_visitaram", block: BLOCKS[8], label: "Quantos chegaram a visitar?", type: "number", showIf: (a) => yes(a, "base_existe") },
  { id: "base_desistiram", block: BLOCKS[8], label: "Quantos desistiram explicitamente?", type: "number", showIf: (a) => yes(a, "base_existe") },
  { id: "base_reativacao", block: BLOCKS[8], label: "Existe campanha de reativação?", type: "boolean", showIf: (a) => yes(a, "base_existe") },
  { id: "base_ultima_campanha", block: BLOCKS[8], label: "Quando foi a última campanha?", type: "text", showIf: (a) => yes(a, "base_reativacao") },
  { id: "base_recuperados", block: BLOCKS[8], label: "Quantos foram recuperados?", type: "number", showIf: (a) => yes(a, "base_reativacao") },

  // BLOCO 10 — PÓS-VENDA
  { id: "pos_imediato", block: BLOCKS[9], label: "O que acontece imediatamente após o contrato?", type: "longtext" },
  { id: "pos_automatico", block: BLOCKS[9], label: "Existe comunicação automática?", type: "boolean" },
  { id: "pos_instrucoes", block: BLOCKS[9], label: "O aluno recebe instruções claras?", type: "boolean" },
  { id: "pos_lembretes", block: BLOCKS[9], label: "Existem lembretes de aulas/etapas?", type: "boolean" },
  { id: "pos_acompanhamento", block: BLOCKS[9], label: "Existe acompanhamento durante o processo?", type: "boolean" },
  { id: "pos_avaliacao", block: BLOCKS[9], label: "Existe solicitação de avaliação?", type: "boolean" },
  { id: "pos_indicacao", block: BLOCKS[9], label: "Existe pedido de indicação?", type: "boolean" },
  { id: "pos_campanha_indicacao", block: BLOCKS[9], label: "Existe campanha estruturada de indicação?", type: "boolean", showIf: (a) => yes(a, "pos_indicacao") },
  { id: "pos_recompra", block: BLOCKS[9], label: "Existe comunicação para recompra/novos serviços?", type: "boolean" },
];

export const visibleQuestions = (answers: Record<string, AnswerValue>) =>
  QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));

export const isAnswered = (v: AnswerValue | undefined) =>
  v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

export { yes, no };
