export default async function handler(req, res) {
    const { key, pkg } = req.query;
    
    // 1. HARD ENFORCEMENT of the Secret Header
    const userAgent = req.headers['user-agent'];

    // If the header is missing, wrong, or contains "Canary"/"Browser" strings
    if (userAgent !== 'Prinzvan-Engine-v2') {
        res.setHeader('Content-Type', 'text/plain');
        // Return decoy message
        return res.status(200).send('-- [SYSTEM] Script is now running in Game Guardian...\n-- Connection established successfully.');
    }

    // 2. Validate Key and Package
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
            return res.status(500).send('gg.alert("❌ Cloud Sync Error: 505")');
        }
    }

    // Default response for invalid keys
    return res.status(403).send('gg.alert("❌ [SECURITY] Unauthorized Key Detected")');
}
