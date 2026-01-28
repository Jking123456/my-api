export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('gg.alert("❌ Unauthorized Request")');
  }

  const { key, pkg, pass } = req.body;

  // 1. Password Check against Vercel Environment Variable
  const MASTER_PASS = process.env.SCRIPT_PASSWORD || "default_backup_pass";
  
  if (pass !== MASTER_PASS) {
    return res.status(403).send(`gg.alert("❌ [ ACCESS DENIED ] ❌\\n\\nInvalid Password.\\n\\nContact Admin: ${process.env.ADMIN_NOTICE || "Admin"}")`);
  }

  // 2. Security & Expiry Checks
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized Access!")');
  }

  const EXPIRY = parseInt(process.env.EXPIRY_TIMESTAMP) || 1800000000;
  const now = Math.floor(Date.now() / 1000);
  if (now > EXPIRY) {
    return res.status(403).send('gg.alert("⚠️ [ SUBSCRIPTION EXPIRED ] ⚠️")');
  }

  // 3. Fetch Script from GitHub
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    const diff = EXPIRY - now;
    const timeStr = `🕒 Expire: ${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    
    const injection = 
      `_G.time_left = "${timeStr}";\n` +
      `_G.mh_v = ${process.env.MAPHACK_VALUE || "98784247823"};\n` +
      `_G.dr_p = ${process.env.DRONE_DATA_JSON || "{}"};\n\n`;

    const finalScript = injection + rawScript;

    // XOR Encryption
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
