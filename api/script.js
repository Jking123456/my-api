import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('gg.alert("❌ POST Only")');

  const { license, hwid, model } = req.body;
  const keyName = `license:${license}`;
  const keyData = await redis.get(keyName);

  if (!keyData) return res.status(403).send('gg.alert("❌ License not found.")');

  const now = Math.floor(Date.now() / 1000);
  if (now > keyData.expiry) return res.status(403).send('gg.alert("⚠️ License Expired.")');

  // --- UNIVERSAL HWID LOCK ---
  let hwidList = keyData.hwid || [];
  
  if (!hwidList.includes(hwid)) {
    if (hwidList.length >= keyData.maxDevices) {
      return res.status(403).send(`gg.alert("❌ Device Limit Reached (${keyData.maxDevices}/${keyData.maxDevices})")`);
    }
    
    // Lock this new device ID
    hwidList.push(hwid);
    keyData.hwid = hwidList;
    
    // Also save the model name for your logs in Upstash
    keyData.last_device_model = model; 
    
    await redis.set(keyName, keyData);
  }

  // --- FETCH SCRIPT ---
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    const diff = keyData.expiry - now;
    const timeStr = `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    
    const injection = `_G.TIME_LEFT = "${timeStr}";\n_G.DEVICES = "${hwidList.length}/${keyData.maxDevices}";\n\n`;
    const finalScript = injection + rawScript;

    // XOR Encryption
    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const dataBuf = Buffer.from(finalScript);
    const keyBuf = Buffer.from(KEY_A + KEY_B);
    let encrypted = dataBuf.map((b, i) => b ^ keyBuf[i % keyBuf.length]);

    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(Array.from(encrypted).join(","));
  }
}
