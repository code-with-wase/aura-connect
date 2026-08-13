import axiosInstance from "@/lib/axios";
import type { ApiResponse, Privacy, User } from "@/lib/api-types";

export const userService = {
  async me() {
    const { data } = await axiosInstance.get<ApiResponse<{ user: User }>>("/user/me");
    return data.data.user;
  },
  async search(search: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ users: User[] }>>("/user/search", {
      params: { search },
    });
    return data.data.users ?? [];
  },
  async byId(userId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ user: User }>>(`/user/${userId}`);
    return data.data.user;
  },
  async updateProfile(payload: { name?: string; username?: string; about?: string }) {
    const { data } = await axiosInstance.put<ApiResponse<{ user: User }>>("/user/profile", payload);
    return data.data.user;
  },
  async updatePrivacy(payload: {
    lastSeen?: Privacy;
    profilePhoto?: Privacy;
    about?: Privacy;
    readReceipts?: boolean;
  }) {
    const { data } = await axiosInstance.put<ApiResponse<{ user: User }>>("/user/privacy", payload);
    return data.data.user;
  },
  async updateOnlineStatus(isOnline: boolean) {
    const { data } = await axiosInstance.put<ApiResponse<{ user: User }>>("/user/status", { isOnline });
    return data.data.user;
  },
};
