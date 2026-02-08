import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    // 1. Only allow POST requests from the Loader
    if (req.method !== 'POST') {
      return res.status(405).json({ auth: false, msg: "Method Not Allowed" });
    }

    const { license, hwid, model } = req.body;

    // 2. CRITICAL: Check if Device is Permanently Banned
    const isBlocked = await redis.sismember("blocked_devices", hwid);
    if (isBlocked) {
      return res.status(200).json({ 
        auth: false, 
        msg: "❌ DEVICE BANNED\nYour Hardware ID has been blacklisted by the Admin." 
      });
    }

    // 3. Validate License existence
    const keyName = `license:${license}`;
    const keyData = await redis.get(keyName);

    if (!keyData) {
      return res.status(200).json({ auth: false, msg: "❌ License Key Not Found" });
    }

    // 4. Check Expiration
    const now = Math.floor(Date.now() / 1000);
    if (now > keyData.expiry) {
      return res.status(200).json({ auth: false, msg: "⚠️ License has Expired" });
    }

    // 5. Universal HWID Lock & Monitoring
    let hwidList = keyData.hwid || [];
    let deviceModels = keyData.deviceModels || {}; // Track which model belongs to which ID

    if (!hwidList.includes(hwid)) {
      // Check if we hit the device limit (default to 1 if not set)
      const max = keyData.maxDevices || 1;
      if (hwidList.length >= max) {
        return res.status(200).json({ 
          auth: false, 
          msg: `❌ Device Limit Reached!\nCapacity: ${hwidList.length}/${max}` 
        });
      }
      
      // Register new device
      hwidList.push(hwid);
      deviceModels[hwid] = model || "Unknown Device";
      
      keyData.hwid = hwidList;
      keyData.deviceModels = deviceModels;
      keyData.last_login = now;
      
      await redis.set(keyName, keyData);
    }

    // 6. Fetch Script from Private GitHub
    const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
      headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
    });

    if (response.ok) {
      let rawScript = await response.text();
      const diff = keyData.expiry - now;
      const timeStr = `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
      
      // 7. Inject Admin-defined values and User Info
      const injection = 
        `_G.time_left = "${timeStr}";\n` +
        `_G.device_info = "${hwidList.length}/${keyData.maxDevices}";\n` +
        `_G.mh_v = ${process.env.MAPHACK_VALUE || "98784247823"};\n` +
        `_G.dr_p = ${process.env.DRONE_DATA_JSON || "{}"};\n\n`;

      const finalScript = injection + rawScript;

      // 8. XOR Encryption Handshake
      const KEY_A = "ClientPart_99"; 
      const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
      const dataBuf = Buffer.from(finalScript);
      const keyBuf = Buffer.from(KEY_A + KEY_B);
      let encrypted = dataBuf.map((b, i) => b ^ keyBuf[i % keyBuf.length]);

      // 9. Send Payload as JSON (Body Handshake)
      return res.status(200).json({
        auth: true,
        session: KEY_B,
        payload: Array.from(encrypted).join(",")
      });
    } else {
      return res.status(200).json({ auth: false, msg: "❌ GitHub Cloud Sync Error" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ auth: false, msg: "❌ Server Error: " + err.message });
  }
  }
