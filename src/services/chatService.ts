import axiosInstance from "@/lib/axios";
import type { ApiResponse, Chat } from "@/lib/api-types";

export const chatService = {
  async createPrivate(userId: string) {
    const { data } = await axiosInstance.post<ApiResponse<{ chat: Chat }>>("/chat", { userId });
    return data.data.chat;
  },
  async list() {
    const { data } = await axiosInstance.get<ApiResponse<{ chats: Chat[] }>>("/chat");
    return data.data.chats ?? [];
  },
  async byId(chatId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ chat: Chat }>>(`/chat/${chatId}`);
    return data.data.chat;
  },
  async updateSettings(
    chatId: string,
    payload: { isMuted?: boolean; isArchived?: boolean; isPinned?: boolean },
  ) {
    const { data } = await axiosInstance.patch<ApiResponse<{ chat: Chat }>>(
      `/chat/${chatId}/settings`,
      payload,
    );
    return data.data.chat;
  },
  async markRead(chatId: string) {
    const { data } = await axiosInstance.patch<ApiResponse<unknown>>(`/chat/${chatId}/read`, {});
    return data.data;
  },
  async leave(chatId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/chat/${chatId}/leave`);
    return data.data;
  },
};
