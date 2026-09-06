import { apiFetch, handleResponse } from "./httpClient";

interface ProfileDTO{
  name: string;
  email: string;
  total_xp: number;
  level: number;
  progress_in_level: number;
  xp_per_level: number;
  xp_to_next_level: number;
}
export async function getProfile() : Promise<ProfileDTO> {
  const response = await apiFetch("/me/profile", {
    method: "GET",
  });
  return handleResponse<ProfileDTO>(response);
}

export async function updateProfile(name: string) : Promise<Pick<ProfileDTO, "name" | "email">> {
  const response = await apiFetch("/me/profile", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  return handleResponse<Pick<ProfileDTO, "name" | "email">>(response);
}