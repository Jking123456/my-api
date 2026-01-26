export default async function handler(req, res) {
  const { key, pkg } = req.query;
  if (key !== process.env.ADMIN_KEY || pkg !== "com.mobile.legends") return res.status(401).send('gg.alert("❌ Unauthorized!")');

  const EXPIRY = parseInt(process.env.EXPIRY_TIMESTAMP) || 1800000000;
  const now = Math.floor(Date.now() / 1000);

  const response = await fetch(`https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`, {
    headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
  });

  if (response.ok) {
    let rawScript = await response.text();
    const injection = 
      `_G.mh_v=${process.env.MAPHACK_VALUE};_G.dr_p=${process.env.DRONE_DATA_JSON};` +
      `_G.time_left="${Math.floor((EXPIRY-now)/3600)}h left";\n`;

    const finalScript = injection + rawScript;
    const KEY_B = process.env.XOR_KEY_B || "ServerPart_77"; 
    const keyBuf = Buffer.from("ClientPart_99" + KEY_B);
    const dataBuf = Buffer.from(finalScript);
    
    let encrypted = [];
    for (let i = 0; i < dataBuf.length; i++) {
      encrypted.push(dataBuf[i] ^ keyBuf[i % keyBuf.length]);
    }
    res.setHeader('X-Session-Token', KEY_B);
    res.status(200).send(encrypted.join(",")); 
  }
}

