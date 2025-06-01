import redisClient from "./redis";

export const GetSetCache = async (key: string, cb: () => Promise<void>) => {
  const cacheData = await redisClient.get(key);
  if (cacheData) {
    return JSON.parse(String(cacheData));
  }
  const data = await cb();
  redisClient.set(key, JSON.stringify(data), {
    EX: 60 * 60,
    NX: true,
  });
  return data;
};
