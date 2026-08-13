import axiosInstance from "@/lib/axios";
import type { ApiResponse, UploadedFile } from "@/lib/api-types";

export const uploadService = {
  async single(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await axiosInstance.post<ApiResponse<{ file: UploadedFile }>>(
      "/upload/single",
      formData,
    );
    return data.data.file;
  },
  async multiple(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const { data } = await axiosInstance.post<ApiResponse<{ files: UploadedFile[] }>>(
      "/upload/multiple",
      formData,
    );
    return data.data.files ?? [];
  },
  async remove(publicId: string) {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>("/upload", {
      data: { publicId },
    });
    return data.data;
  },
};
