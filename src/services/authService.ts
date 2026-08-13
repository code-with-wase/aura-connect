import axiosInstance from "@/lib/axios";
import type { ApiResponse, User } from "@/lib/api-types";

export type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginPayload = { identifier: string; password: string };

export type LoginResult = { user: User; accessToken: string; refreshToken: string };

export const authService = {
  async register(payload: RegisterPayload) {
    const { data } = await axiosInstance.post<ApiResponse<{ user: User }>>("/auth/register", payload);
    return data.data;
  },
  async login(payload: LoginPayload) {
    const { data } = await axiosInstance.post<ApiResponse<LoginResult>>("/auth/login", payload);
    return data.data;
  },
  async refreshToken(refreshToken: string) {
    const { data } = await axiosInstance.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh-token",
      { refreshToken },
    );
    return data.data;
  },
  async logout(refreshToken: string) {
    const { data } = await axiosInstance.post<ApiResponse<null>>("/auth/logout", { refreshToken });
    return data;
  },
};
