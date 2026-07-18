import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface RiskResult {
  level: "Low" | "Medium" | "High";
  confidence: number | null;
  probabilities?: Record<string, number>;
  source: "ml-model" | "no-data";
}
export interface RiskSnapshot {
  date: string;
  level: "Low" | "Medium" | "High";
  confidence: number | null;
  percentBudgetUsed: number;
  spendingTrend: number;
}
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function sendChatMessage(message: string, history: ChatMessage[]): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) throw new Error(`Chat request failed with status ${res.status}`);

  const data = await res.json();
  return data.reply;
}
export async function fetchRiskHistory(): Promise<RiskSnapshot[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE_URL}/api/risk-history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Risk history request failed with status ${res.status}`);

  const data = await res.json();
  return data.history;
}

export async function fetchRisk(): Promise<RiskResult> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE_URL}/api/risk`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  

  if (!res.ok) {
    throw new Error(`Risk request failed with status ${res.status}`);
  }

  return res.json();
}