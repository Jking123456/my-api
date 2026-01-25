export default async function handler(req, res) {
  const { key, pkg } = req.query;
  const userAgent = req.headers['user-agent'] || "";
  
  // 1. IMPROVED SNIFFER CHECK
  // We only block known sniffer names. 
  // We allow "GameGuardian" or empty User-Agents which are common in GG.
  const badAgents = ["HttpCanary", "Postman", "Python", "curl", "Go-http-client"];
  if (badAgents.some(agent => userAgent.includes(agent))) {
    return res.status(403).send('gg.alert("🚫 SNIFFER TOOLS DETECTED!") os.exit()');
  }

  // 2. RELAXED PROXY CHECK
  // We remove the check for 'x-forwarded-for' because Vercel ALWAYS adds this.
  // We only block if the 'via' header (classic proxy signature) is present.
  if (req.headers['via']) {
    return res.status(403).send('gg.alert("🚫 PROXY DETECTED!") os.exit()');
  }

  // 3. PACKAGE VERIFICATION
  const EXPECTED_GAME = "com.dts.freefireth"; // MAKE SURE THIS MATCHES YOUR GAME!
  if (pkg !== EXPECTED_GAME) {
     return res.status(403).send('gg.alert("🚫 Process Error: Run the script inside the game!") os.exit()');
  }

  // 4. KEY CHECK
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).send('gg.alert("❌ Invalid License!") os.exit()');
  }

  // 5. FETCH FROM GITHUB
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
