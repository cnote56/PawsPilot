export interface DogProfile {
  id: string;
  name: string;
  breed: string;
  birthdate: string; // YYYY-MM-DD
  weight: number; // lbs
  goals: string[];
}

export type LogStatus = "success" | "in_progress" | "needs_work";

export interface TrainingLog {
  id: string;
  dogId: string;
  timestamp: string; // ISO string
  skill: string;
  status: LogStatus;
  notes: string;
  durationMinutes: number;
}

export interface Milestone {
  id: string;
  dogId: string;
  title: string;
  dateEarned: string; // ISO string or date
  notes: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string; // ISO string
  parsedActionLog?: ParsedActionLog;
}

export interface ChatHistoryItem {
  sender: "user" | "assistant";
  text: string;
}

export interface CustomSkillItem {
  id: string;
  name: string;
}

export interface ParsedLogDetails {
  skill?: string;
  durationMinutes?: number;
  status?: LogStatus;
  title?: string;
  notes?: string;
}

export interface ParsedActionLog {
  loggedType: "training" | "milestone" | "none";
  details: ParsedLogDetails | null;
}