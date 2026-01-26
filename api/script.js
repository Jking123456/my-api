// Helper function for XOR encryption
function xor(data, key) {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

export default async function handler(req, res) {
  const { key, pkg } = req.query;
  const userAgent = req.headers['user-agent'] || "";
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // 1. VPN/Sniffer Guard
  if (/HttpCanary|Postman|curl/i.test(userAgent)) {
    return res.status(403).send('gg.alert("🚫 Sniffer Detected!") os.exit()');
  }

  // 2. Validate Key & Package
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("⚠️ Unauthorized Access!") os.exit()');
  }

  // 3. Fetch Script from GitHub
  const url = `https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`;
  const response = await fetch(url, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    const rawScript = await response.text();
    
    // THE SPLIT KEY LOGIC
    const KEY_A = "users"; // Hardcoded in Loader
    const KEY_B = process.env.XOR_KEY_B; // Hidden in Vercel
    const FULL_KEY = KEY_A + KEY_B;

    const wrapped = `print("[system] Securely Loaded")\n${rawScript}`;
    
    // Encrypt and Encode
    const encrypted = xor(wrapped, FULL_KEY);
    const encoded = Buffer.from(encrypted, 'binary').toString('base64');

    // Send Key_B via a custom header so the Loader can find it
    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(encoded);
  } else {
    res.status(500).send('gg.alert("❌ Server Sync Error")');
  }
}
