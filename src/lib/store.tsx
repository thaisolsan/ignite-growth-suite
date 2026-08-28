import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ActivityLog,
  AnswerValue,
  DBShape,
  Meeting,
  Proposal,
  School,
  Settings,
} from "./types";
import { demoDB } from "./demo";

const KEY = "cfc-growth-db-v1";

export const defaultSettings: Settings = {
  consultant: "Consultor",
  benchmarkVisitRate: 45,
  benchmarkResponseMinutes: 10,
  recoveryRate: 12,
  reactivationRate: 4,
  hourlyRate: 25,
};

function load(): DBShape {
  if (typeof window === "undefined") return demoDB();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = demoDB();
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as DBShape;
    return { ...demoDB(), ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
  } catch {
    return demoDB();
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

interface Ctx {
  db: DBShape;
  ready: boolean;
  signIn: (email: string, name: string) => void;
  signOut: () => void;
  addSchool: (s: Omit<School, "id" | "createdAt" | "updatedAt">) => School;
  updateSchool: (id: string, patch: Partial<School>) => void;
  removeSchool: (id: string) => void;
  startMeeting: (schoolId: string) => Meeting;
  meetingForSchool: (schoolId: string) => Meeting | undefined;
  saveAnswer: (meetingId: string, questionId: string, value: AnswerValue) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  saveProposal: (p: Proposal) => void;
  updateProposal: (id: string, patch: Partial<Proposal>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DBShape>(() => demoDB());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDb(load());
    setReady(true);
  }, []);

  const persist = useCallback((next: DBShape) => {
    setDb(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage indisponível */
    }
  }, []);

  const log = useCallback(
    (base: DBShape, entry: Omit<ActivityLog, "id" | "at" | "actor">): ActivityLog[] => [
      {
        id: uid(),
        at: new Date().toISOString(),
        actor: base.session?.name ?? base.settings.consultant,
        ...entry,
      },
      ...base.logs,
    ],
    [],
  );

  const value = useMemo<Ctx>(() => {
    const now = () => new Date().toISOString();
    return {
      db,
      ready,
      signIn: (email, name) => persist({ ...db, session: { email, name } }),
      signOut: () => persist({ ...db, session: null }),
      addSchool: (s) => {
        const school: School = { ...s, id: uid(), createdAt: now(), updatedAt: now() };
        persist({
          ...db,
          schools: [school, ...db.schools],
          logs: log(db, { entity: "school", entityId: school.id, field: "criação", before: "", after: school.name }),
        });
        return school;
      },
      updateSchool: (id, patch) => {
        const before = db.schools.find((s) => s.id === id);
        persist({
          ...db,
          schools: db.schools.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: now() } : s)),
          logs: log(db, {
            entity: "school",
            entityId: id,
            field: Object.keys(patch).join(", "),
            before: JSON.stringify(
              Object.fromEntries(Object.keys(patch).map((k) => [k, (before as never as Record<string, unknown>)?.[k]])),
            ),
            after: JSON.stringify(patch),
          }),
        });
      },
      removeSchool: (id) =>
        persist({
          ...db,
          schools: db.schools.filter((s) => s.id !== id),
          meetings: db.meetings.filter((m) => m.schoolId !== id),
          proposals: db.proposals.filter((p) => p.schoolId !== id),
        }),
      startMeeting: (schoolId) => {
        const existing = db.meetings.find((m) => m.schoolId === schoolId && !m.finishedAt);
        if (existing) return existing;
        const meeting: Meeting = { id: uid(), schoolId, startedAt: now(), answers: {} };
        persist({ ...db, meetings: [meeting, ...db.meetings] });
        return meeting;
      },
      meetingForSchool: (schoolId) =>
        db.meetings.find((m) => m.schoolId === schoolId && !m.finishedAt) ??
        db.meetings.find((m) => m.schoolId === schoolId),
      saveAnswer: (meetingId, questionId, value) => {
        const meeting = db.meetings.find((m) => m.id === meetingId);
        if (!meeting) return;
        const before = meeting.answers[questionId];
        persist({
          ...db,
          meetings: db.meetings.map((m) =>
            m.id === meetingId ? { ...m, answers: { ...m.answers, [questionId]: value } } : m,
          ),
          logs: log(db, {
            entity: "answer",
            entityId: meetingId,
            field: questionId,
            before: JSON.stringify(before ?? null),
            after: JSON.stringify(value),
          }),
        });
      },
      updateMeeting: (id, patch) =>
        persist({ ...db, meetings: db.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)) }),
      saveProposal: (p) =>
        persist({
          ...db,
          proposals: [p, ...db.proposals.filter((x) => x.id !== p.id)],
          logs: log(db, { entity: "proposal", entityId: p.id, field: "criação", before: "", after: p.title }),
        }),
      updateProposal: (id, patch) => {
        const before = db.proposals.find((p) => p.id === id);
        persist({
          ...db,
          proposals: db.proposals.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...patch,
                  versions: [{ at: now(), snapshot: JSON.stringify(before) }, ...p.versions].slice(0, 20),
                }
              : p,
          ),
          logs: log(db, {
            entity: "proposal",
            entityId: id,
            field: Object.keys(patch).join(", "),
            before: JSON.stringify(before?.price ?? ""),
            after: JSON.stringify(patch.price ?? ""),
          }),
        });
      },
      updateSettings: (patch) => persist({ ...db, settings: { ...db.settings, ...patch } }),
      resetDemo: () => persist(demoDB()),
    };
  }, [db, ready, persist, log]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
