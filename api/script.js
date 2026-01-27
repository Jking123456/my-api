export default async function handler(req, res) {
  const { key, pkg, gg_pkg } = req.query;
  const REQUIRED_GG = "com.lulu.luluboxsuper";

  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized Access!")');
  }

  // 🛡️ Lulubox Super Package Lock
  if (!gg_pkg || !gg_pkg.includes(REQUIRED_GG)) {
    const ggError = 
      `gg.alert("❌ SECURITY ALERT\\n\\n` +
      `This script is locked to Lulubox Super.\\n` +
      `Please use the authorized environment (Pkg: ${REQUIRED_GG})")\n` +
      `os.exit()`;
    return res.status(403).send(ggError);
  }

  // 2. Check Expiry
  const EXPIRY = parseInt(process.env.EXPIRY_TIMESTAMP) || 1800000000;
  const now = Math.floor(Date.now() / 1000);

  if (now > EXPIRY) {
    return res.status(403).send('gg.alert("⚠️ [ SUBSCRIPTION EXPIRED ] ⚠️")');
  }

  // 3. Fetch & Inject
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

    // 4. XOR Encryption (Using the new Package Name as part of the key)
    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const keyBuf = Buffer.from(KEY_A + KEY_B + REQUIRED_GG);
    const dataBuf = Buffer.from(finalScript);
    
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
