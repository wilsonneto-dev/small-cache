const encodeToBase64 = (input: string): string =>
  btoa ? btoa(unescape(encodeURIComponent(input))) : input;

const decodeFromBase64 = (base64Input: string): string =>
  (!!atob) ? decodeURIComponent(escape(window.atob(base64Input))) : base64Input;

const writeToCache = <T>(key: string, data: T) => {
  if (!sessionStorage) return;

  const encodedKey = encodeToBase64(key);
  const jsonData = JSON.stringify(data);
  const ecodedJsonData = encodeToBase64(jsonData);

  sessionStorage.setItem(encodedKey, ecodedJsonData);
};

const readFromCache = <T>(key: string): T | null => {
  if (!sessionStorage) return null;

  const encodedKey = encodeToBase64(key);
  const encodedData = sessionStorage.getItem(encodedKey) || null;

  if (encodedData === null) return null;
  return JSON.parse(decodeFromBase64(encodedData));
};

const updateTTL = (key: string, TTL_InSeconds: number) => {
  const encodedKey = encodeToBase64(key);
  const TTLControl: Record<string, number> =
    readFromCache<Record<string, number>>('ttl-control') || {};

  const nowMilisseconds = Date.now();
  const TTLMilisseconds = nowMilisseconds + 1000 * TTL_InSeconds;
  TTLControl[encodedKey] = TTLMilisseconds;
  writeToCache('ttl-control', TTLControl);
};

const itsStillValidTTL = (key: string): boolean => {
  const encodedKey = encodeToBase64(key);

  const TTLControl = readFromCache<Record<string, number>>('ttl-control') || null;
  if (!TTLControl) return false;

  const TTLMilisseconds = TTLControl[encodedKey];
  if (!TTLMilisseconds) return false;

  const nowMilisseconds = Date.now();
  return nowMilisseconds < TTLMilisseconds;
};

const writeToCacheWithTTL = <T>(key: string, data: T, TTL_InSeconds: number) => {
  writeToCache(key, data);
  updateTTL(key, TTL_InSeconds);
};

const readFromCacheWithTTL = <T>(key: string): T | null => {
  const cachedData = readFromCache<T>(key);
  if (cachedData && itsStillValidTTL(key)) return cachedData;

  return null;
};

interface ICacheOptions {
  TTL_InSeconds: number;
  enabled: boolean;
}

const getFromCache = async <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: Partial<ICacheOptions> | null = null
): Promise<T> => {
  const defaultTtlTime15minutes = 15 * 60;
  const defaultOptions = { enabled: true, TTL_InSeconds: defaultTtlTime15minutes };
  const finalOptions: ICacheOptions = { ...defaultOptions, ...options };

  if (!sessionStorage || !finalOptions.enabled) return await fetchFunction();

  const cachedData = readFromCacheWithTTL<T>(key);
  if (cachedData) return cachedData;

  const freshData = await fetchFunction();
  writeToCacheWithTTL(key, freshData, finalOptions.TTL_InSeconds);
  return freshData;
};

export { getFromCache };