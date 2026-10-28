import { edgeConfigApiInstance } from "@/api/edgeConfig/edgeConfigApi";

export interface ScoreEntry {
  name: string;
  value: number;
}

export interface ScoreSummary {
  personal: number;
  best?: ScoreEntry | null;
}

const BASE = "/ui/metrics";

export async function fetchScoreSummary(): Promise<ScoreSummary> {
  const { data } = await edgeConfigApiInstance.get<ScoreSummary>(`${BASE}/session`);
  return data;
}

export async function submitScore(value: number): Promise<ScoreSummary> {
  const { data } = await edgeConfigApiInstance.put<ScoreSummary>(`${BASE}/session`, { value });
  return data;
}

export async function fetchRanking(): Promise<ScoreEntry[]> {
  const { data } = await edgeConfigApiInstance.get<ScoreEntry[]>(`${BASE}/ranking`);
  return data;
}
