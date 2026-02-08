import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { hwid, action, secret } = req.query;
  if (secret !== process.env.ADMIN_KEY) return res.status(401).send("Unauthorized");

  if (action === "add") {
    await redis.sadd("blocked_devices", hwid);
    return res.json({ msg: `Device ${hwid} Banned.` });
  } else if (action === "remove") {
    await redis.srem("blocked_devices", hwid);
    return res.json({ msg: `Device ${hwid} Unbanned.` });
  }
  
  const list = await redis.smembers("blocked_devices");
  res.json(list);
}

