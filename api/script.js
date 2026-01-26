export default async function handler(req, res) {
    const { key, pkg } = req.query;
    
    // 1. HARD LOCK: Check for a custom secret token in the headers
    // If this specific header isn't present, send the decoy IMMEDIATELY.
    if (req.headers['x-prinzvan-token'] !== 'SECRET_PASS_7788') {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send('-- [SYSTEM] Script is now running...\n-- Secure Tunnel Established.');
    }

    // 2. Validate Key and Package as usual
    if (key === "170993" && pkg === "com.mobile.legends") {
        try {
            const GITHUB_URL = "https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua";
            const response = await fetch(GITHUB_URL, {
                headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
            });

            if (!response.ok) throw new Error('Source Fetch Failed');
            const code = await response.text();
            
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send(code);
        } catch (error) {
            return res.status(500).send('gg.alert("❌ Server Error: 500")');
        }
    }

    return res.status(403).send('gg.alert("❌ Access Denied")');
}
