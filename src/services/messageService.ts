import axiosInstance from "@/lib/axios";
import type { ApiResponse, Attachment, Message } from "@/lib/api-types";

export type SendMessagePayload = {
  chatId: string;
  type?: Message["type"];
  content?: string | null;
  attachment?: Attachment;
  replyTo?: string | null;
  isForwarded?: boolean;
  forwardedFrom?: string | null;
};

export const messageService = {
  async send(payload: SendMessagePayload) {
    const { data } = await axiosInstance.post<ApiResponse<{ message: Message }>>("/message", payload);
    return data.data.message;
  },
  async listByChat(chatId: string, page = 1, limit = 50) {
    const { data } = await axiosInstance.get<ApiResponse<{ messages: Message[] }>>(
      `/message/chat/${chatId}`,
      { params: { page, limit } },
    );
    return data.data.messages ?? [];
  },
  async byId(messageId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ message: Message }>>(`/message/${messageId}`);
    return data.data.message;
  },
  async edit(messageId: string, content: string) {
    const { data } = await axiosInstance.patch<ApiResponse<{ message: Message }>>(
      `/message/${messageId}`,
      { content },
    );
    return data.data.message;
  },
  async remove(messageId: string, deleteForEveryone = false) {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/message/${messageId}`, {
      data: { deleteForEveryone },
    });
    return data.data;
  },
  async markDelivered(messageId: string) {
    const { data } = await axiosInstance.patch<ApiResponse<unknown>>(
      `/message/${messageId}/delivered`,
      {},
    );
    return data.data;
  },
  async markRead(messageId: string) {
    const { data } = await axiosInstance.patch<ApiResponse<unknown>>(`/message/${messageId}/read`, {});
    return data.data;
  },
  async addReaction(messageId: string, emoji: string) {
    const { data } = await axiosInstance.post<ApiResponse<{ message: Message }>>(
      `/message/${messageId}/reaction`,
      { emoji },
    );
    return data.data.message;
  },
  async removeReaction(messageId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<{ message: Message }>>(
      `/message/${messageId}/reaction`,
    );
    return data.data?.message;
  },
  async star(messageId: string) {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(`/message/${messageId}/star`, {});
    return data.data;
  },
  async unstar(messageId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/message/${messageId}/star`);
    return data.data;
  },
  async forward(messageId: string, chatId: string) {
    const { data } = await axiosInstance.post<ApiResponse<{ message: Message }>>(
      `/message/${messageId}/forward`,
      { chatId },
    );
    return data.data.message;
  },
};
