import { API_URL, handleResponse } from "./httpClient";

interface StackResponse {
  rol: Record<string, string[]>;
  level: string[];
  topic: Record<string, string[]>;
}

export async function getStacks(): Promise<StackResponse> {
  const response = await fetch(`${API_URL}/stacks/`);
  return handleResponse<StackResponse>(response);
}
