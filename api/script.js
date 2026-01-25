export default async function handler(req, res) {
  const { key, pkg } = req.query;
  const userAgent = req.headers['user-agent'] || "";
  
  // 1. ANTI-SNIFFER: Check for suspicious User-Agents
  // Most sniffers use "Java" or "Go-http-client" instead of a real Android/GG signature
  if (userAgent.includes("HttpCanary") || userAgent.includes("Postman") || userAgent.includes("Python")) {
    return res.status(403).send('gg.alert("🚫 SNIFFER DETECTED!") os.exit()');
  }

  // 2. ANTI-PROXY: Detect common Proxy/VPN headers
  const isProxy = req.headers['via'] || req.headers['x-forwarded-for']?.includes(',') || req.headers['forwarded'];
  if (isProxy) {
    return res.status(403).send('gg.alert("🚫 PROXY/VPN DETECTED!") os.exit()');
  }

  // 3. PACKAGE VERIFICATION: Ensure it's running in the right game
  const EXPECTED_GAME = "com.dts.freefireth"; // Example: Change to your game package
  if (pkg !== EXPECTED_GAME) {
     return res.status(403).send('gg.alert("🚫 Invalid Game Process!") os.exit()');
  }

  // 4. STANDARD KEY CHECK
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).send('gg.alert("❌ Invalid License!") os.exit()');
  }

  // 5. FETCH FROM GITHUB (Only if all checks pass)
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    const code = await response.text();
    res.status(200).send(code);
  } else {
    res.status(500).send('gg.alert("❌ Server Sync Error")');
  }
}
