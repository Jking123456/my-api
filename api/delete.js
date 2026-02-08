import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { license, secret } = req.query;

  if (secret !== process.env.ADMIN_KEY) return res.status(401).send("Unauthorized");
  if (!license) return res.status(400).send("License required");

  const deleted = await redis.del(`license:${license}`);

  if (deleted) {
    res.status(200).json({ success: true, msg: `Key ${license} deleted.` });
  } else {
    res.status(404).json({ success: false, msg: "Key not found." });
  }
}
