
import { apiFetch, handleResponse } from "./httpClient";

interface CardDTO{
  card_id: number;
  question_id: number;
  session_id: number;
  user_id: number;
  concept: string;
  definition: string | null;
  explanation: string;
  use_case: string;
  avoid_when: string | null;
  mnemonic: string | null;
  code: string | null;
  code_language: string | null;
  created_at: string;

}

export async function getCards(): Promise<CardDTO[]> {
  const response = await apiFetch("/cards/", {
    method: "GET",
  });
  return handleResponse<CardDTO[]>(response);
}

export async function updateCard(cardId: number, data: Partial<Omit<CardDTO, "card_id" | "question_id" | "session_id" | "user_id" | "created_at" >>) : Promise<CardDTO> {
  const response = await apiFetch(`/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return handleResponse<CardDTO>(response);
}

export async function deleteCardById(cardId: number): Promise<{ msg: string}> {
  const response = await apiFetch(`/cards/${cardId}`, {
    method: "DELETE",
  });
  return handleResponse(response);
}