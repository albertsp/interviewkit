import { apiFetch, handleResponse } from "./httpClient";

interface GetMyProfileResponse{
  name: string;
  email: string;
  total_xp: number;
  level: number;
  progress_in_level: number;
  xp_per_level: number;
  xp_to_next_level: number;

}
interface LoginUserResponse{
  user_id: number;
  name: string;
  token: string;
}
interface RegisterUserResponse { 
  success: string; 
}
interface LogoutUserResponse {
  msg: string;
}
export async function getMyProfile(): Promise<GetMyProfileResponse> {
  const response = await apiFetch("/me/profile", {
    method: "GET",
  });
  return handleResponse<GetMyProfileResponse>(response);
}

export async function loginUser(email: string, password: string): Promise<LoginUserResponse> {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMsg;
    try {
      const data = await response.json();
      errorMsg = data.error || data.msg || data.message;
    } catch {
      errorMsg = null;
    }
    throw new Error(errorMsg || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function registerUser(name: string, email: string, password: string): Promise<RegisterUserResponse> {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    let errorMsg;
    try {
      const data = await response.json();
      errorMsg = data.error || data.msg || data.message;
    } catch {
      errorMsg = null;
    }
    throw new Error(errorMsg || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function logoutUser(): Promise<LogoutUserResponse> {
  const response = await apiFetch("/auth/logout", {
    method: "POST",
  });
  return handleResponse<LogoutUserResponse>(response);
}