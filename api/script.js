export default async function handler(req, res) {
  const { key, pkg } = req.query;
  const userAgent = req.headers['user-agent'] || "";

  // 1. Basic Guards
  if (/HttpCanary|Postman|curl/i.test(userAgent)) {
    return res.status(403).send('gg.alert("🚫 Sniffer Detected!") os.exit()');
  }

  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("⚠️ Unauthorized!") os.exit()');
  }

  // 2. Fetch from GitHub
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    const rawScript = await response.text();
    
    // THE KEYS
    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const FULL_KEY = KEY_A + KEY_B;

    const wrapped = `print("[system] Securely Loaded")\n${rawScript}`;
    
    // 3. XOR and Convert to HEX
    let hexResult = "";
    for (let i = 0; i < wrapped.length; i++) {
      // XOR the character code
      const charCode = wrapped.charCodeAt(i) ^ FULL_KEY.charCodeAt(i % FULL_KEY.length);
      // Convert to 2-digit Hex
      hexResult += charCode.toString(16).padStart(2, '0');
    }

    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(hexResult);
  } else {
    res.status(500).send('gg.alert("❌ GitHub Fetch Failed")');
  }
}
