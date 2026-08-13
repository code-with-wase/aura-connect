import axiosInstance from "@/lib/axios";
import type { ApiResponse, Call } from "@/lib/api-types";

export const callService = {
  async create(payload: {
    type: "audio" | "video";
    mode?: "private" | "group";
    chatId: string;
    participantIds: string[];
  }) {
    const { data } = await axiosInstance.post<ApiResponse<{ call: Call }>>("/call", payload);
    return data.data.call;
  },
  async history(page = 1, limit = 20) {
    const { data } = await axiosInstance.get<ApiResponse<{ calls: Call[] }>>("/call/history", {
      params: { page, limit },
    });
    return data.data.calls ?? [];
  },
  async byId(callId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ call: Call }>>(`/call/${callId}`);
    return data.data.call;
  },
  ringing: (callId: string) => axiosInstance.patch(`/call/${callId}/ringing`, {}),
  join: (callId: string) => axiosInstance.patch(`/call/${callId}/join`, {}),
  decline: (callId: string) => axiosInstance.patch(`/call/${callId}/decline`, {}),
  missed: (callId: string) => axiosInstance.patch(`/call/${callId}/missed`, {}),
  leave: (callId: string) => axiosInstance.patch(`/call/${callId}/leave`, {}),
  end: (callId: string, reason?: string) =>
    axiosInstance.patch(`/call/${callId}/end`, reason ? { reason } : {}),
};
