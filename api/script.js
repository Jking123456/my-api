import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ auth: false, msg: "Method Not Allowed" });
    }

    const { license, hwid, model } = req.body;
    const keyName = `license:${license}`;
    const keyData = await redis.get(keyName);

    // 1. Validate License
    if (!keyData) {
      return res.status(200).json({ auth: false, msg: "❌ License Key Not Found" });
    }

    // 2. Check Expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > keyData.expiry) {
      return res.status(200).json({ auth: false, msg: "⚠️ License has Expired" });
    }

    // 3. HWID Multi-Device Lock (Universal)
    let hwidList = keyData.hwid || [];
    if (!hwidList.includes(hwid)) {
      if (hwidList.length >= (keyData.maxDevices || 1)) {
        return res.status(200).json({ auth: false, msg: `❌ Device Limit Reached (${hwidList.length}/${keyData.maxDevices})` });
      }
      hwidList.push(hwid);
      keyData.hwid = hwidList;
      keyData.last_model = model; // Store model for admin logs
      await redis.set(keyName, keyData);
    }

    // 4. Fetch Script from GitHub
    const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
      headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
    });

    if (response.ok) {
      let rawScript = await response.text();
      const diff = keyData.expiry - now;
      const timeStr = `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
      
      // 5. Inject Values (Re-added from your Env Variables)
      const injection = 
        `_G.time_left = "${timeStr}";\n` +
        `_G.device_info = "${hwidList.length}/${keyData.maxDevices}";\n` +
        `_G.mh_v = ${process.env.MAPHACK_VALUE || "98784247823"};\n` +
        `_G.dr_p = ${process.env.DRONE_DATA_JSON || "{}"};\n\n`;

      const finalScript = injection + rawScript;

      // 6. XOR Encryption
      const KEY_A = "ClientPart_99"; 
      const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
      const dataBuf = Buffer.from(finalScript);
      const keyBuf = Buffer.from(KEY_A + KEY_B);
      let encrypted = dataBuf.map((b, i) => b ^ keyBuf[i % keyBuf.length]);

      // ✅ RETURN AS JSON (Most stable for ELGG)
      return res.status(200).json({
        auth: true,
        session: KEY_B,
        payload: Array.from(encrypted).join(",")
      });
    } else {
      return res.status(200).json({ auth: false, msg: "❌ GitHub Connection Error" });
    }
  } catch (err) {
    return res.status(500).json({ auth: false, msg: "❌ Server Crash: " + err.message });
  }
}
