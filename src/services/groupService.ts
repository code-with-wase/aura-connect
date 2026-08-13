import axiosInstance from "@/lib/axios";
import type { ApiResponse, Group } from "@/lib/api-types";

export const groupService = {
  async create(payload: { name: string; description?: string | null; memberIds?: string[] }) {
    const { data } = await axiosInstance.post<ApiResponse<{ group: Group }>>("/group", payload);
    return data.data.group;
  },
  async list() {
    const { data } = await axiosInstance.get<ApiResponse<{ groups: Group[] }>>("/group");
    return data.data.groups ?? [];
  },
  async byId(groupId: string) {
    const { data } = await axiosInstance.get<ApiResponse<{ group: Group }>>(`/group/${groupId}`);
    return data.data.group;
  },
  async update(groupId: string, payload: { name?: string; description?: string | null; avatar?: string | null }) {
    const { data } = await axiosInstance.patch<ApiResponse<{ group: Group }>>(`/group/${groupId}`, payload);
    return data.data.group;
  },
  async addMembers(groupId: string, memberIds: string[]) {
    const { data } = await axiosInstance.post<ApiResponse<{ group: Group }>>(
      `/group/${groupId}/members`,
      { memberIds },
    );
    return data.data.group;
  },
  async removeMember(groupId: string, userId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<{ group: Group }>>(
      `/group/${groupId}/members/${userId}`,
    );
    return data.data?.group;
  },
  async leave(groupId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>(`/group/${groupId}/leave`);
    return data.data;
  },
  async promote(groupId: string, userId: string) {
    const { data } = await axiosInstance.patch<ApiResponse<{ group: Group }>>(
      `/group/${groupId}/members/${userId}/promote`,
      {},
    );
    return data.data?.group;
  },
  async demote(groupId: string, userId: string) {
    const { data } = await axiosInstance.patch<ApiResponse<{ group: Group }>>(
      `/group/${groupId}/members/${userId}/demote`,
      {},
    );
    return data.data?.group;
  },
  async updateSettings(
    groupId: string,
    payload: {
      onlyAdminsCanSendMessages?: boolean;
      onlyAdminsCanEditInfo?: boolean;
      onlyAdminsCanAddMembers?: boolean;
      onlyAdminsCanRemoveMembers?: boolean;
    },
  ) {
    const { data } = await axiosInstance.patch<ApiResponse<{ group: Group }>>(
      `/group/${groupId}/settings`,
      payload,
    );
    return data.data?.group;
  },
  async mute(groupId: string, isMuted: boolean) {
    const { data } = await axiosInstance.patch<ApiResponse<unknown>>(`/group/${groupId}/mute`, {
      isMuted,
    });
    return data.data;
  },
};
