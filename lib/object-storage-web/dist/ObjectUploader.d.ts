import { type ReactNode } from "react";
import { type UploadResult, type UppyFile } from "@uppy/core";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
interface ObjectUploaderProps {
    maxNumberOfFiles?: number;
    maxFileSize?: number;
    onGetUploadParameters: (file: UppyFile<Record<string, unknown>, Record<string, unknown>>) => Promise<{
        method: "PUT";
        url: string;
        headers?: Record<string, string>;
    }>;
    onComplete?: (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => void;
    buttonClassName?: string;
    children: ReactNode;
}
export declare function ObjectUploader({ maxNumberOfFiles, maxFileSize, onGetUploadParameters, onComplete, buttonClassName, children, }: ObjectUploaderProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ObjectUploader.d.ts.map