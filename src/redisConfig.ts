import dotenv from "dotenv";
import * as redis from "redis";

dotenv.config();

type RedisUrlComponents = {
  password: string;
  host: string;
  port: number;
};
export const redisKeys = {
  rankingCollections: "rankingCollections",
  pageCollections: "pageCollections",
};

function parseRedisCloudUrl(redisCloudUrl: string): RedisUrlComponents {
  const regexExpression = /redis:\/\/default:(.+)@(.+):(\d+)/;
  const match = regexExpression.exec(redisCloudUrl);
  if (!match) {
    throw new Error("Invalid Redis URL");
  }
  const [, password, host, port] = match;
  return { password, host, port: parseInt(port, 10) };
}

const { password, host, port } = parseRedisCloudUrl(
  process.env.REDISCLOUD_URL!,
);

const redisClient = redis.createClient({
  password,
  socket: {
    host,
    port,
  },
});

const getRedis = (value: string) => {
  const syncRedisGet = redisClient.get.bind(redisClient);

  return syncRedisGet(value);
};

const setRedis = (key: string, value: string) => {
  const syncRedisSet = redisClient.set.bind(redisClient);

  return syncRedisSet(key, value);
};

const delRedis = (key: string) => {
  const syncRedisDel = redisClient.del.bind(redisClient);

  return syncRedisDel(key);
};

export { redisClient, getRedis, setRedis, delRedis };
