export default async function handler(req, res) {
  const { key, pkg } = req.query;
  const userAgent = req.headers['user-agent'] || "";

  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized!")');
  }

  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    rawScript = rawScript.trim().replace(/\r/g, ""); // Remove Windows line endings

    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const FULL_KEY = KEY_A + KEY_B;

    const wrapped = `print("[system] Securely Loaded")\n${rawScript}`;
    
    // NEW: Convert to XORed number array
    let encryptedArray = [];
    for (let i = 0; i < wrapped.length; i++) {
      encryptedArray.push(wrapped.charCodeAt(i) ^ FULL_KEY.charCodeAt(i % FULL_KEY.length));
    }

    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(encryptedArray.join(",")); // Send as "10,54,122..."
  } else {
    res.status(500).send('gg.alert("❌ GitHub Sync Failed")');
  }
}
