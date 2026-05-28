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
  skill: string; // "Sit", "Stay", "Heel", "Recall", etc.
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
  parsedActionLog?: {
    loggedType: "training" | "milestone" | "none";
    details: any;
  };
}
