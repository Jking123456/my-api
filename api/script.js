export default async function handler(req, res) {
  const { key, pkg } = req.query;

  // 1. Auth Check
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized!")');
  }

  // 2. Server-Side Time Check
  const EXPIRY = parseInt(process.env.EXPIRY_TIMESTAMP) || 1800000000; 
  const now = Math.floor(Date.now() / 1000);

  if (now > EXPIRY) {
    return res.status(403).send('gg.alert("⌛ [EXPIRED]\\nContact @HOMER for renewal.")');
  }

  // 3. Fetch Script from GitHub
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    rawScript = rawScript.trim().replace(/\r/g, ""); 

    // Calculate time left for display
    const diff = EXPIRY - now;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const timeStr = `🕒 Expire: ${h}h ${m}m`;

    // 4. Injection: We use _G.time_left to avoid syntax errors with local variables
    const finalScript = `_G.time_left = "${timeStr}";\n` + rawScript;

    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const fullKey = KEY_A + KEY_B;

    const dataBuf = Buffer.from(finalScript);
    const keyBuf = Buffer.from(fullKey);
    
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
