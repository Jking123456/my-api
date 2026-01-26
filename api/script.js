export default async function handler(req, res) {
  const { key, pkg } = req.query;

  // 1. Authorization Check
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized!")');
  }

  // 2. Fetch Script from GitHub
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    // Clean Windows line endings and whitespace
    rawScript = rawScript.trim().replace(/\r/g, ""); 

    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || ""; 
    const FULL_KEY = KEY_A + KEY_B;

    // Convert strings to Byte Buffers for mathematical stability
    const dataBuf = Buffer.from(`print("[system] Securely Loaded")\n${rawScript}`);
    const keyBuf = Buffer.from(FULL_KEY);
    
    // 3. XOR Operation (Resulting in numbers 0-255 only)
    let encryptedArray = [];
    for (let i = 0; i < dataBuf.length; i++) {
      encryptedArray.push(dataBuf[i] ^ keyBuf[i % keyBuf.length]);
    }

    // 4. Send as comma-separated numeric string
    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(encryptedArray.join(",")); 
  } else {
    res.status(500).send('gg.alert("❌ GitHub Sync Failed")');
  }
}
