import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  const { days, max, secret } = req.query;

  // Use the ADMIN_KEY from your Vercel Environment Variables
  if (secret !== process.env.ADMIN_KEY) return res.status(401).send("Unauthorized");

  const randomStr = Math.random().toString(36).substring(2, 12).toUpperCase();
  const licenseKey = `MLBB-${randomStr}`;
  const expiryTime = Math.floor(Date.now() / 1000) + (parseInt(days) * 86400);
  
  const keyData = {
    expiry: expiryTime,
    hwid: [], // Array to store multiple authorized Device IDs
    maxDevices: parseInt(max) || 1,
    game: "MLBB"
  };

  await redis.set(`license:${licenseKey}`, keyData);

  res.status(200).json({
    license: licenseKey,
    limit: `${max} Devices`,
    expires: new Date(expiryTime * 1000).toLocaleString()
  });
}
