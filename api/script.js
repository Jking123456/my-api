export default async function handler(req, res) {
  const { key, pkg } = req.query;

  // 1. Basic Security
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized!")');
  }

  // 2. Fetch from GitHub
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    rawScript = rawScript.trim().replace(/\r/g, ""); // Clean formatting

    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const FULL_KEY = KEY_A + KEY_B;

    // 3. XOR each character and store as a number
    let numbers = [];
    for (let i = 0; i < rawScript.length; i++) {
      numbers.push(rawScript.charCodeAt(i) ^ FULL_KEY.charCodeAt(i % FULL_KEY.length));
    }

    // 4. Send as comma-separated text
    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(numbers.join(",")); 
  } else {
    res.status(500).send('gg.alert("❌ GitHub Sync Failed")');
  }
}
