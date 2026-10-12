import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AmplifiedCopy, AuthState, BootstrapInput, BootstrapStatus, ErrorEnvelope, GenerateCopyInput, HealthStatus, ListPostsParams, LoginInput, Post, PostInput, PostUpdate, RoleWritingInstruction, RoleWritingInstructionUpdate, StyleGuide, StyleGuideInput, UploadUrlRequest, UploadUrlResponse, User } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCurrentUserUrl: () => string;
export declare const getCurrentUser: (options?: Parameters<typeof customFetch>[1]) => Promise<AuthState>;
export declare const getGetCurrentUserQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetCurrentUserQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentUserQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export type GetCurrentUserQueryError = ErrorType<unknown>;
export declare function useGetCurrentUser<TData = Awaited<ReturnType<typeof getCurrentUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBootstrapStatusUrl: () => string;
export declare const getBootstrapStatus: (options?: Parameters<typeof customFetch>[1]) => Promise<BootstrapStatus>;
export declare const getGetBootstrapStatusQueryKey: () => readonly ["/api/auth/bootstrap-status"];
export declare const getGetBootstrapStatusQueryOptions: <TData = Awaited<ReturnType<typeof getBootstrapStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBootstrapStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBootstrapStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBootstrapStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getBootstrapStatus>>>;
export type GetBootstrapStatusQueryError = ErrorType<unknown>;
export declare function useGetBootstrapStatus<TData = Awaited<ReturnType<typeof getBootstrapStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBootstrapStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getBootstrapUrl: () => string;
export declare const bootstrap: (bootstrapInput: BootstrapInput, options?: Parameters<typeof customFetch>[1]) => Promise<User>;
export declare const getBootstrapMutationKey: () => readonly ["bootstrap"];
export declare const getBootstrapMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof bootstrap>>, TError, BootstrapMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof bootstrap>>, TError, BootstrapMutationVariables, TContext>;
export type BootstrapMutationResult = NonNullable<Awaited<ReturnType<typeof bootstrap>>>;
export type BootstrapMutationBody = BodyType<BootstrapInput>;
export type BootstrapMutationError = ErrorType<ErrorEnvelope>;
export type BootstrapMutationVariables = {
    data: BodyType<BootstrapInput>;
};
export declare const useBootstrap: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof bootstrap>>, TError, BootstrapMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof bootstrap>>, TError, BootstrapMutationVariables, TContext>;
export declare const getLoginUrl: () => string;
export declare const login: (loginInput: LoginInput, options?: Parameters<typeof customFetch>[1]) => Promise<User>;
export declare const getLoginMutationKey: () => readonly ["login"];
export declare const getLoginMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, LoginMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, LoginMutationVariables, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<unknown>;
export type LoginMutationVariables = {
    data: BodyType<LoginInput>;
};
export declare const useLogin: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, LoginMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, LoginMutationVariables, TContext>;
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: Parameters<typeof customFetch>[1]) => Promise<void>;
export declare const getLogoutMutationKey: () => readonly ["logout"];
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export declare const getListPostsUrl: (params?: ListPostsParams) => string;
export declare const listPosts: (params?: ListPostsParams, options?: Parameters<typeof customFetch>[1]) => Promise<Post[]>;
export declare const getListPostsQueryKey: (params?: ListPostsParams) => readonly ["/api/posts", ...ListPostsParams[]];
export declare const getListPostsQueryOptions: <TData = Awaited<ReturnType<typeof listPosts>>, TError = ErrorType<unknown>>(params?: ListPostsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPosts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPostsQueryResult = NonNullable<Awaited<ReturnType<typeof listPosts>>>;
export type ListPostsQueryError = ErrorType<unknown>;
export declare function useListPosts<TData = Awaited<ReturnType<typeof listPosts>>, TError = ErrorType<unknown>>(params?: ListPostsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPosts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePostUrl: () => string;
export declare const createPost: (postInput: PostInput, options?: Parameters<typeof customFetch>[1]) => Promise<Post>;
export declare const getCreatePostMutationKey: () => readonly ["createPost"];
export declare const getCreatePostMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPost>>, TError, CreatePostMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPost>>, TError, CreatePostMutationVariables, TContext>;
export type CreatePostMutationResult = NonNullable<Awaited<ReturnType<typeof createPost>>>;
export type CreatePostMutationBody = BodyType<PostInput>;
export type CreatePostMutationError = ErrorType<unknown>;
export type CreatePostMutationVariables = {
    data: BodyType<PostInput>;
};
export declare const useCreatePost: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPost>>, TError, CreatePostMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPost>>, TError, CreatePostMutationVariables, TContext>;
export declare const getGetPostUrl: (id: string) => string;
export declare const getPost: (id: string, options?: Parameters<typeof customFetch>[1]) => Promise<Post>;
export declare const getGetPostQueryKey: (id: string) => readonly [`/api/posts/${string}`];
export declare const getGetPostQueryOptions: <TData = Awaited<ReturnType<typeof getPost>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPost>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPost>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPostQueryResult = NonNullable<Awaited<ReturnType<typeof getPost>>>;
export type GetPostQueryError = ErrorType<unknown>;
export declare function useGetPost<TData = Awaited<ReturnType<typeof getPost>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPost>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdatePostUrl: (id: string) => string;
export declare const updatePost: (id: string, postUpdate: PostUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<Post>;
export declare const getUpdatePostMutationKey: () => readonly ["updatePost"];
export declare const getUpdatePostMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePost>>, TError, UpdatePostMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePost>>, TError, UpdatePostMutationVariables, TContext>;
export type UpdatePostMutationResult = NonNullable<Awaited<ReturnType<typeof updatePost>>>;
export type UpdatePostMutationBody = BodyType<PostUpdate>;
export type UpdatePostMutationError = ErrorType<unknown>;
export type UpdatePostMutationVariables = {
    id: string;
    data: BodyType<PostUpdate>;
};
export declare const useUpdatePost: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePost>>, TError, UpdatePostMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePost>>, TError, UpdatePostMutationVariables, TContext>;
export declare const getDeletePostUrl: (id: string) => string;
export declare const deletePost: (id: string, options?: Parameters<typeof customFetch>[1]) => Promise<void>;
export declare const getDeletePostMutationKey: () => readonly ["deletePost"];
export declare const getDeletePostMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePost>>, TError, DeletePostMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePost>>, TError, DeletePostMutationVariables, TContext>;
export type DeletePostMutationResult = NonNullable<Awaited<ReturnType<typeof deletePost>>>;
export type DeletePostMutationError = ErrorType<unknown>;
export type DeletePostMutationVariables = {
    id: string;
};
export declare const useDeletePost: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePost>>, TError, DeletePostMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePost>>, TError, DeletePostMutationVariables, TContext>;
export declare const getGetStyleGuideUrl: () => string;
export declare const getStyleGuide: (options?: Parameters<typeof customFetch>[1]) => Promise<StyleGuide>;
export declare const getGetStyleGuideQueryKey: () => readonly ["/api/style-guide"];
export declare const getGetStyleGuideQueryOptions: <TData = Awaited<ReturnType<typeof getStyleGuide>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStyleGuide>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStyleGuide>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStyleGuideQueryResult = NonNullable<Awaited<ReturnType<typeof getStyleGuide>>>;
export type GetStyleGuideQueryError = ErrorType<unknown>;
export declare function useGetStyleGuide<TData = Awaited<ReturnType<typeof getStyleGuide>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStyleGuide>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateStyleGuideUrl: () => string;
export declare const updateStyleGuide: (styleGuideInput: StyleGuideInput, options?: Parameters<typeof customFetch>[1]) => Promise<StyleGuide>;
export declare const getUpdateStyleGuideMutationKey: () => readonly ["updateStyleGuide"];
export declare const getUpdateStyleGuideMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateStyleGuide>>, TError, UpdateStyleGuideMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateStyleGuide>>, TError, UpdateStyleGuideMutationVariables, TContext>;
export type UpdateStyleGuideMutationResult = NonNullable<Awaited<ReturnType<typeof updateStyleGuide>>>;
export type UpdateStyleGuideMutationBody = BodyType<StyleGuideInput>;
export type UpdateStyleGuideMutationError = ErrorType<unknown>;
export type UpdateStyleGuideMutationVariables = {
    data: BodyType<StyleGuideInput>;
};
export declare const useUpdateStyleGuide: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateStyleGuide>>, TError, UpdateStyleGuideMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateStyleGuide>>, TError, UpdateStyleGuideMutationVariables, TContext>;
export declare const getListRoleInstructionsUrl: () => string;
export declare const listRoleInstructions: (options?: Parameters<typeof customFetch>[1]) => Promise<RoleWritingInstruction[]>;
export declare const getListRoleInstructionsQueryKey: () => readonly ["/api/role-instructions"];
export declare const getListRoleInstructionsQueryOptions: <TData = Awaited<ReturnType<typeof listRoleInstructions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRoleInstructions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listRoleInstructions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListRoleInstructionsQueryResult = NonNullable<Awaited<ReturnType<typeof listRoleInstructions>>>;
export type ListRoleInstructionsQueryError = ErrorType<unknown>;
export declare function useListRoleInstructions<TData = Awaited<ReturnType<typeof listRoleInstructions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listRoleInstructions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateRoleInstructionsUrl: () => string;
export declare const updateRoleInstructions: (roleWritingInstructionUpdate: RoleWritingInstructionUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<RoleWritingInstruction>;
export declare const getUpdateRoleInstructionsMutationKey: () => readonly ["updateRoleInstructions"];
export declare const getUpdateRoleInstructionsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRoleInstructions>>, TError, UpdateRoleInstructionsMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateRoleInstructions>>, TError, UpdateRoleInstructionsMutationVariables, TContext>;
export type UpdateRoleInstructionsMutationResult = NonNullable<Awaited<ReturnType<typeof updateRoleInstructions>>>;
export type UpdateRoleInstructionsMutationBody = BodyType<RoleWritingInstructionUpdate>;
export type UpdateRoleInstructionsMutationError = ErrorType<unknown>;
export type UpdateRoleInstructionsMutationVariables = {
    data: BodyType<RoleWritingInstructionUpdate>;
};
export declare const useUpdateRoleInstructions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateRoleInstructions>>, TError, UpdateRoleInstructionsMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateRoleInstructions>>, TError, UpdateRoleInstructionsMutationVariables, TContext>;
export declare const getGenerateCopyUrl: () => string;
export declare const generateCopy: (generateCopyInput: GenerateCopyInput, options?: Parameters<typeof customFetch>[1]) => Promise<AmplifiedCopy>;
export declare const getGenerateCopyMutationKey: () => readonly ["generateCopy"];
export declare const getGenerateCopyMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateCopy>>, TError, GenerateCopyMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateCopy>>, TError, GenerateCopyMutationVariables, TContext>;
export type GenerateCopyMutationResult = NonNullable<Awaited<ReturnType<typeof generateCopy>>>;
export type GenerateCopyMutationBody = BodyType<GenerateCopyInput>;
export type GenerateCopyMutationError = ErrorType<unknown>;
export type GenerateCopyMutationVariables = {
    data: BodyType<GenerateCopyInput>;
};
export declare const useGenerateCopy: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateCopy>>, TError, GenerateCopyMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateCopy>>, TError, GenerateCopyMutationVariables, TContext>;
export declare const getRequestUploadUrlUrl: () => string;
/**
 * Returns a presigned GCS URL for direct upload. The client sends JSON
 * metadata here, then uploads the file directly to the returned URL.
 * @summary Request a presigned URL for file upload
 */
export declare const requestUploadUrl: (uploadUrlRequest: UploadUrlRequest, options?: Parameters<typeof customFetch>[1]) => Promise<UploadUrlResponse>;
export declare const getRequestUploadUrlMutationKey: () => readonly ["requestUploadUrl"];
export declare const getRequestUploadUrlMutationOptions: <TError = ErrorType<ErrorEnvelope | void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
export type RequestUploadUrlMutationResult = NonNullable<Awaited<ReturnType<typeof requestUploadUrl>>>;
export type RequestUploadUrlMutationBody = BodyType<UploadUrlRequest>;
export type RequestUploadUrlMutationError = ErrorType<ErrorEnvelope | void>;
export type RequestUploadUrlMutationVariables = {
    data: BodyType<UploadUrlRequest>;
};
/**
* @summary Request a presigned URL for file upload
*/
export declare const useRequestUploadUrl: <TError = ErrorType<ErrorEnvelope | void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
export declare const getGetPublicObjectUrl: (filePath: string) => string;
/**
 * @summary Serve a public asset from PUBLIC_OBJECT_SEARCH_PATHS
 */
export declare const getPublicObject: (filePath: string, options?: Parameters<typeof customFetch>[1]) => Promise<Blob>;
export declare const getGetPublicObjectQueryKey: (filePath: string) => readonly [`/api/storage/public-objects/${string}`];
export declare const getGetPublicObjectQueryOptions: <TData = Awaited<ReturnType<typeof getPublicObject>>, TError = ErrorType<ErrorEnvelope>>(filePath: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicObject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPublicObject>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPublicObjectQueryResult = NonNullable<Awaited<ReturnType<typeof getPublicObject>>>;
export type GetPublicObjectQueryError = ErrorType<ErrorEnvelope>;
/**
 * @summary Serve a public asset from PUBLIC_OBJECT_SEARCH_PATHS
 */
export declare function useGetPublicObject<TData = Awaited<ReturnType<typeof getPublicObject>>, TError = ErrorType<ErrorEnvelope>>(filePath: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublicObject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStorageObjectUrl: (objectPath: string) => string;
/**
 * @summary Serve an uploaded object entity
 */
export declare const getStorageObject: (objectPath: string, options?: Parameters<typeof customFetch>[1]) => Promise<Blob>;
export declare const getGetStorageObjectQueryKey: (objectPath: string) => readonly [`/api/storage/objects/${string}`];
export declare const getGetStorageObjectQueryOptions: <TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<void | ErrorEnvelope>>(objectPath: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStorageObjectQueryResult = NonNullable<Awaited<ReturnType<typeof getStorageObject>>>;
export type GetStorageObjectQueryError = ErrorType<void | ErrorEnvelope>;
/**
 * @summary Serve an uploaded object entity
 */
export declare function useGetStorageObject<TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<void | ErrorEnvelope>>(objectPath: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map