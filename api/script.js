export default async function handler(req, res) {
  const { key, pkg } = req.query;
  const userAgent = req.headers['user-agent'] || "";
  
  // 1. RELAXED SNIFFER CHECK
  const badAgents = ["HttpCanary", "Postman", "Python", "curl", "Go-http-client"];
  if (badAgents.some(agent => userAgent.includes(agent))) {
    return res.status(403).send('gg.alert("🚫 SNIFFER TOOLS DETECTED!") os.exit()');
  }

  // 2. PACKAGE VERIFICATION (Updated for Mobile Legends)
  const EXPECTED_GAME = "com.mobile.legends"; 
  
  if (pkg !== EXPECTED_GAME) {
     return res.status(403).send(`gg.alert("🚫 Process Error!\\nMake sure Game Guardian is attached to Mobile Legends.") os.exit()`);
  }

  // 3. KEY CHECK
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).send('gg.alert("❌ Invalid License!") os.exit()');
  }

  // 4. FETCH FROM GITHUB
  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const url = `https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`;

  const response = await fetch(url, {
    headers: { 'Authorization': `token ${GH_TOKEN}` }
  });

  if (response.ok) {
    const scriptText = await response.text();
    res.status(200).send(scriptText);
  } else {
    res.status(500).send('gg.alert("❌ Server Sync Error: Check GitHub Token")');
  }
}
