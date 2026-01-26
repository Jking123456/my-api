export default async function handler(req, res) {
  const { key, pkg } = req.query;

  // 1. SECURITY: Check Admin Key
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") {
    return res.status(401).send('gg.alert("❌ Unauthorized Access!")');
  }

  // 2. DYNAMIC TIME CHECK
  // It pulls from Vercel Env so you don't have to edit this code later
  const HARDCODED_EXPIRY = parseInt(process.env.EXPIRY_TIMESTAMP) || 1800000000; 
  const currentTime = Math.floor(Date.now() / 1000);

  if (currentTime > HARDCODED_EXPIRY) {
    return res.status(403).send('gg.alert("⌛ [EXPIRED]\\nYour subscription has ended.\\nContact @PRINZVAN for renewal.")');
  }

  // 3. FETCH SCRIPT
  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    rawScript = rawScript.trim().replace(/\r/g, ""); 

    const KEY_A = "ClientPart_99"; 
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const FULL_KEY = KEY_A + KEY_B;

    // Calculate time left for the menu
    const timeLeft = HARDCODED_EXPIRY - currentTime;
    const hours = Math.floor(timeLeft / 3600);
    const mins = Math.floor((timeLeft % 3600) / 60);
    const timeString = `🕒 Expire: ${hours}h ${mins}m`;

    // INJECTION: The server adds this variable to your GitHub code automatically
    const scriptWithContext = `local time_left = "${timeString}"\n${rawScript}`;

    const dataBuf = Buffer.from(scriptWithContext);
    const keyBuf = Buffer.from(FULL_KEY);
    
    let encryptedArray = [];
    for (let i = 0; i < dataBuf.length; i++) {
      encryptedArray.push(dataBuf[i] ^ keyBuf[i % keyBuf.length]);
    }

    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(encryptedArray.join(",")); 
  } else {
    res.status(500).send('gg.alert("❌ GitHub Sync Failed")');
  }
}
