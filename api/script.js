export default async function handler(req, res) {
  const { key } = req.query;
  const ADMIN_KEY = process.env.ADMIN_KEY; 
  if (key !== ADMIN_KEY) {
    return res.status(401).send('gg.alert("❌ Invalid License!") os.exit()');
  }

  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const url = `https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua`;

  const response = await fetch(url, {
    headers: { 'Authorization': `token ${GH_TOKEN}` }
  });

  if (response.ok) {
    const scriptText = await response.text();
    res.status(200).send(scriptText);
  } else {
    res.status(500).send('gg.alert("❌ Server Sync Error")');
  }
}
