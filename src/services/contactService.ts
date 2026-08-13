import axiosInstance from "@/lib/axios";
import type { ApiResponse, Contact, User } from "@/lib/api-types";

export const contactService = {
  async search(q: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ users: User[] }>>("/contact/search", {
      params: { q },
    });
    return data.data.users ?? [];
  },
  async list() {
    const { data } = await axiosInstance.get<ApiResponse<{ contacts: Contact[] }>>("/contact");
    return data.data.contacts ?? [];
  },
  async blocked() {
    const { data } = await axiosInstance.get<ApiResponse<{ contacts: Contact[] }>>("/contact/blocked");
    return data.data.contacts ?? [];
  },
  async add(userId: string) {
    const { data } = await axiosInstance.post<ApiResponse<{ contact: Contact }>>(`/contact/${userId}`, {});
    return data.data?.contact;
  },
  async remove(userId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/contact/${userId}`);
    return data.data;
  },
  async block(userId: string) {
    const { data } = await axiosInstance.patch<ApiResponse<unknown>>(`/contact/${userId}/block`, {});
    return data.data;
  },
  async unblock(userId: string) {
    const { data } = await axiosInstance.patch<ApiResponse<unknown>>(`/contact/${userId}/unblock`, {});
    return data.data;
  },
  async onlineStatus(userId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ isOnline?: boolean; lastSeen?: string }>>(
      `/contact/${userId}/status`,
    );
    return data.data;
  },
};
