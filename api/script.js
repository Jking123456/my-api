export default async function handler(req, res) {
  const { key, pkg } = req.query;
  const userAgent = req.headers['user-agent'] || "";
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // 1. VPN & PROXY DETECTION (ProxyCheck.io)
  // Replace 'YOUR_PROXYCHECK_API_KEY' with your actual key
  try {
    const vpnCheck = await fetch(`https://proxycheck.io/v2/${clientIp}?key=a32d146411cf303edda0b28c73b0f85f9c73e9f4f1a3987ba25cb5b87414bd2d&vpn=1`);
    const vpnData = await vpnCheck.json();
    if (vpnData[clientIp] && vpnData[clientIp].proxy === "yes") {
      return res.status(403).send('gg.alert("❌ VPN/Proxy Detected! Please disable it.") os.exit()');
    }
  } catch (e) { /* Skip if API is down */ }

  // 2. SNIFFER & BOTS CHECK
  const isBadAgent = /HttpCanary|Postman|Python|curl|Go-http-client/i.test(userAgent);
  if (isBadAgent) {
    return res.status(403).send('gg.alert("🚫 Security Violation: Sniffer Detected!") os.exit()');
  }

  // 3. PACKAGE & KEY VERIFICATION
  if (pkg !== "com.mobile.legends") {
     return res.status(403).send('gg.alert("❌ Attach Game Guardian to Mobile Legends!") os.exit()');
  }
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).send('gg.alert("⚠️ Invalid License Key!") os.exit()');
  }

  // 4. FETCH & ENCAPSULATE SCRIPT
  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const url = `https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`;

  const response = await fetch(url, {
    headers: { 'Authorization': `token ${GH_TOKEN}` }
  });

  if (response.ok) {
    const rawScript = await response.text();
    
    // We wrap your logic in a string and print the status message
    const wrapped = `
      print("[system] script is now running")
      local secret_code = [===[${rawScript}]===]
      assert(load(secret_code))()
    `;

    // Encode to Base64 so it's not human-readable in the network log
    const encoded = Buffer.from(wrapped).toString('base64');
    res.status(200).send(encoded);
  } else {
    res.status(500).send('gg.alert("❌ Server Error: Content not found")');
  }
}
