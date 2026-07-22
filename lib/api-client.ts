import axios from "axios";

import { axiosClient } from "@/lib/axios";
import type { ApiError, ApiResponse } from "@/types/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  try {
    const response = await axiosClient.request<ApiResponse<T>>({
      url,
      method: init.method,
      data: init.body,
      headers: Object.fromEntries(headers.entries()),
      signal: init.signal ?? undefined,
    });
    return response.data.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    if (!axios.isAxiosError<ApiError>(error)) throw error;
    throw new ApiClientError(
      error.response?.data?.message ?? "Permintaan gagal diproses.",
      error.response?.status ?? 0,
      error.response?.data?.code,
    );
  }
}
