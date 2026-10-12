import type { UppyFile } from "@uppy/core";
interface UploadMetadata {
    name: string;
    size: number;
    contentType: string;
}
interface UploadResponse {
    uploadURL: string;
    objectPath: string;
    servingUrl: string;
    metadata: UploadMetadata;
}
interface UseUploadOptions {
    basePath?: string;
    onSuccess?: (response: UploadResponse) => void;
    onError?: (error: Error) => void;
}
export declare function useUpload(options?: UseUploadOptions): {
    uploadFile: (file: File) => Promise<UploadResponse | null>;
    getUploadParameters: (file: UppyFile<Record<string, unknown>, Record<string, unknown>>) => Promise<{
        method: "PUT";
        url: string;
        headers: Record<string, string>;
    }>;
    isUploading: boolean;
    error: Error | null;
    progress: number;
};
export {};
//# sourceMappingURL=use-upload.d.ts.map