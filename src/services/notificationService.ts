import axiosInstance from "@/lib/axios";
import type { ApiResponse, Notification } from "@/lib/api-types";

export const notificationService = {
  async create(payload: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    chatId?: string;
  }) {
    const { data } = await axiosInstance.post<ApiResponse<{ notification: Notification }>>(
      "/notification",
      payload,
    );
    return data.data.notification;
  },
  async list(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { data } = await axiosInstance.get<ApiResponse<{ notifications: Notification[] }>>(
      "/notification",
      {
        params: {
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
          unreadOnly: params?.unreadOnly ? "true" : undefined,
        },
      },
    );
    return data.data.notifications ?? [];
  },
  async unreadCount() {
    const { data } = await axiosInstance.get<ApiResponse<{ count?: number; unreadCount?: number }>>(
      "/notification/unread",
    );
    return data.data?.count ?? data.data?.unreadCount ?? 0;
  },
  async byId(notificationId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ notification: Notification }>>(
      `/notification/${notificationId}`,
    );
    return data.data.notification;
  },
  markRead: (notificationId: string) => axiosInstance.patch(`/notification/${notificationId}/read`, {}),
  markAllRead: () => axiosInstance.patch("/notification/read-all", {}),
  remove: (notificationId: string) => axiosInstance.delete(`/notification/${notificationId}`),
  removeAll: () => axiosInstance.delete("/notification/all"),
};
