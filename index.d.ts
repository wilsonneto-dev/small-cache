interface ICacheOptions {
    TTL_InSeconds: number;
    enabled: boolean;
}
declare const getFromCache: <T>(key: string, fetchFunction: () => Promise<T>, options?: ICacheOptions | null) => Promise<T>;
export { getFromCache };
