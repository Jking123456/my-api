export default async function handler(req, res) {
    const { key, pkg } = req.query;
    const userAgent = req.headers['user-agent'];

    // 1. STRICT USER-AGENT CHECK
    // Only serve the script if the ID matches EXACTLY.
    if (userAgent !== 'Prinzvan-Engine-v2-Secret-Key') {
        res.setHeader('Content-Type', 'text/plain');
        // This is the decoy the sniffer will catch
        return res.status(200).send('-- [SYSTEM] Script is now running...\n-- Authenticating with Game Guardian...');
    }

    // 2. KEY & PACKAGE VALIDATION
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

    return res.status(403).send('gg.alert("❌ Access Denied: Invalid License")');
}
