import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { license, hwid, model } = req.body;
    const keyName = `license:${license}`;
    const keyData = await redis.get(keyName);

    // Check if key exists
    if (!keyData) {
      return res.status(200).json({ auth: false, msg: "❌ License Not Found" });
    }

    const now = Math.floor(Date.now() / 1000);
    // Check Expiry
    if (now > keyData.expiry) {
      return res.status(200).json({ auth: false, msg: "⚠️ License Expired" });
    }

    // HWID Multi-Device Lock
    let hwidList = keyData.hwid || [];
    if (!hwidList.includes(hwid)) {
      if (hwidList.length >= keyData.maxDevices) {
        return res.status(200).json({ auth: false, msg: `❌ Limit Reached (${hwidList.length}/${keyData.maxDevices})` });
      }
      hwidList.push(hwid);
      keyData.hwid = hwidList;
      await redis.set(keyName, keyData);
    }

    // Fetch Script
    const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
      headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
    });

    if (response.ok) {
      let rawScript = await response.text();
      const diff = keyData.expiry - now;
      const timeStr = `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
      
      const injection = `_G.time_left = "${timeStr}";\n_G.device_count = "${hwidList.length}/${keyData.maxDevices}";\n\n`;
      const finalScript = injection + rawScript;

      const KEY_A = "ClientPart_99"; 
      const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
      const dataBuf = Buffer.from(finalScript);
      const keyBuf = Buffer.from(KEY_A + KEY_B);
      let encrypted = dataBuf.map((b, i) => b ^ keyBuf[i % keyBuf.length]);

      // ✅ SUCCESS RESPONSE
      return res.status(200).json({
        auth: true,
        session: KEY_B,
        payload: Array.from(encrypted).join(",")
      });
    } else {
      return res.status(200).json({ auth: false, msg: "❌ GitHub Sync Failed" });
    }
  } catch (err) {
    return res.status(500).json({ auth: false, msg: "❌ Server Error: " + err.message });
  }
        }
