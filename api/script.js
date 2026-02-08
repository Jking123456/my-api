import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('gg.alert("❌ POST Required")');

  const { license, hwid, model } = req.body;
  const keyName = `license:${license}`;
  const keyData = await redis.get(keyName);

  if (!keyData) return res.status(403).send('gg.alert("❌ License Not Found")');

  const now = Math.floor(Date.now() / 1000);
  if (now > keyData.expiry) return res.status(403).send('gg.alert("⚠️ License Expired")');

  let hwidList = keyData.hwid || [];
  if (!hwidList.includes(hwid)) {
    if (hwidList.length >= keyData.maxDevices) {
      return res.status(403).send(`gg.alert("❌ Device Limit Reached!")`);
    }
    hwidList.push(hwid);
    keyData.hwid = hwidList;
    await redis.set(keyName, keyData);
  }

  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    const diff = keyData.expiry - now;
    const timeStr = `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    
    const injection = `_G.TIME_LEFT = "${timeStr}";\n_G.DEVICE_INFO = "${hwidList.length}/${keyData.maxDevices}";\n\n`;
    const finalScript = injection + rawScript;

    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    
    const dataBuf = Buffer.from(finalScript);
    const keyBuf = Buffer.from(KEY_A + KEY_B);
    let encrypted = dataBuf.map((b, i) => b ^ keyBuf[i % keyBuf.length]);

    // 🛡️ FAIL-SAFE: Send KEY_B inside the JSON body instead of Headers
    res.status(200).json({
      session: KEY_B,
      payload: Array.from(encrypted).join(",")
    });
  } else {
    res.status(500).send('gg.alert("❌ GitHub Sync Failed")');
  }
}
