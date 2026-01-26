export default async function handler(req, res) {
  const { key, pkg } = req.query;

  // 1. Auth Check
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized!")');
  }

  // 2. Fetch Secrets from Vercel Environment Variables
  const EXPIRY = parseInt(process.env.EXPIRY_TIMESTAMP) || 1800000000;
  const MH_VALUE = process.env.MAPHACK_VALUE || "98784247823"; // Pulled from Vercel Env
  const DRONE_DATA = process.env.DRONE_DATA_JSON || "{}";      // Pulled from Vercel Env

  const now = Math.floor(Date.now() / 1000);
  if (now > EXPIRY) return res.status(403).send('gg.alert("⌛ [EXPIRED]")');

  // 3. Fetch Script Template from GitHub
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    const timeStr = `🕒 Expire: ${Math.floor((EXPIRY - now) / 3600)}h`;

    // 4. Inject the secret data as Global Variables (_G)
    const injection = 
      `_G.time_left = "${timeStr}";\n` +
      `_G.mh_v = ${MH_VALUE};\n` +
      `_G.dr_p = ${DRONE_DATA};\n\n`;

    const finalScript = injection + rawScript;

    // 5. Encrypt with XOR
    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const dataBuf = Buffer.from(finalScript);
    const keyBuf = Buffer.from(KEY_A + KEY_B);
    
    let encryptedArray = [];
    for (let i = 0; i < dataBuf.length; i++) {
      encryptedArray.push(dataBuf[i] ^ keyBuf[i % keyBuf.length]);
    }

    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(encryptedArray.join(",")); 
  } else {
    res.status(500).send('gg.alert("❌ GitHub Sync Failed")');
  }
}
