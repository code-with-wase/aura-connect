import axiosInstance from "@/lib/axios";
import type { ApiResponse, Contact, User } from "@/lib/api-types";

/** Backend returns search results wrapped: { user, isContact, isBlocked } */
type SearchRow = { user?: User; isContact?: boolean; isBlocked?: boolean } & Partial<User>;

export type SearchResult = { user: User; isContact: boolean; isBlocked: boolean };

function normalizeSearchRow(row: SearchRow): SearchResult | null {
  const user = (row.user ?? (row as User)) as User | undefined;
  if (!user?._id) return null;
  return { user, isContact: Boolean(row.isContact), isBlocked: Boolean(row.isBlocked) };
}

export const contactService = {
  async search(q: string): Promise<SearchResult[]> {
    const { data } = await axiosInstance.get<ApiResponse<{ users: SearchRow[] }>>("/contact/search", {
      params: { q },
    });
    return (data.data?.users ?? [])
      .map(normalizeSearchRow)
      .filter((row): row is SearchResult => row !== null);
  },
  async list() {
    const { data } = await axiosInstance.get<ApiResponse<{ contacts: Contact[] }>>("/contact");
    // Blocked contacts are also returned here; keep them out of the contacts tab.
    return (data.data?.contacts ?? []).filter((contact) => !contact.isBlocked);
  },
  async blocked() {
    const { data } = await axiosInstance.get<
      ApiResponse<{ blockedUsers?: Contact[]; contacts?: Contact[] }>
    >("/contact/blocked");
    return data.data?.blockedUsers ?? data.data?.contacts ?? [];
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
