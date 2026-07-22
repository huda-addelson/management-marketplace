import { API_ENDPOINTS } from "@/constants";
import { ApiClientError, apiRequest } from "@/lib/api-client";

import type { AuthResult, CurrentUser, LoginInput } from "../types/auth.type";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

async function authRequest<T>(url: string, init?: RequestInit) {
  try {
    return await apiRequest<T>(url, init);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new AuthServiceError(error.message, error.code ?? "unknown");
    }
    throw error;
  }
}

export function login(input: LoginInput) {
  return authRequest<AuthResult>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return authRequest<null>(API_ENDPOINTS.auth.logout, { method: "POST" });
}

export function getCurrentUser() {
  return authRequest<CurrentUser>(API_ENDPOINTS.auth.user);
}
