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

  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized!")');
  }

  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    
    // IMPORTANT: Clean the script of hidden characters that break XOR
    rawScript = rawScript.trim().replace(/\r/g, "");

    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const FULL_KEY = KEY_A + KEY_B;

    const wrapped = `print("[system] Securely Loaded")\n${rawScript}`;
    const encrypted = xor(wrapped, FULL_KEY);
    const hexResult = Buffer.from(encrypted, 'binary').toString('hex');

    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(hexResult);
  } else {
    res.status(500).send('gg.alert("❌ GitHub Sync Failed")');
  }
}
