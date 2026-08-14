import axiosInstance from "@/lib/axios";
import type { ApiResponse, Status } from "@/lib/api-types";

export const statusService = {
  async create(payload: {
    type: "text" | "image" | "video";
    content?: string | null;
    media?: { url?: string; publicId?: string | null; mimeType?: string | null; fileName?: string | null } | null;
    background?: string | null;
    privacy?: "everyone" | "contacts" | "onlySharedWith";
  }) {
    // The API rejects a media object on text statuses and requires media.url otherwise.
    const body: Record<string, unknown> = { type: payload.type, privacy: payload.privacy ?? "everyone" };
    if (payload.content?.trim()) body["content"] = payload.content.trim();
    if (payload.background) body["background"] = payload.background;
    if (payload.type !== "text" && payload.media?.url) {
      body["media"] = {
        url: payload.media.url,
        publicId: payload.media.publicId ?? null,
        mimeType: payload.media.mimeType ?? null,
        fileName: payload.media.fileName ?? null,
      };
    }
    const { data } = await axiosInstance.post<ApiResponse<{ status: Status }>>("/status", body);
    return data.data.status;
  },
  async feed() {
    const { data } = await axiosInstance.get<ApiResponse<{ statuses: Status[] }>>("/status");
    return data.data.statuses ?? [];
  },
  async mine() {
    const { data } = await axiosInstance.get<ApiResponse<{ statuses: Status[] }>>("/status/me");
    return data.data.statuses ?? [];
  },
  async byId(statusId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ status: Status }>>(`/status/${statusId}`);
    return data.data.status;
  },
  async view(statusId: string) {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(`/status/${statusId}/view`, {});
    return data.data;
  },
  async remove(statusId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/status/${statusId}`);
    return data.data;
  },
};
