export default async function handler(req, res) {
    const { key, pkg } = req.query;
    
    // 1. Secret Identity Check (Anti-Sniffer)
    const userAgent = req.headers['user-agent'];

    if (userAgent !== 'Prinzvan-Engine-v2') {
        // This is what the cracker sees in HttpCanary or a browser
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send('-- [SYSTEM] Script is now running in Game Guardian...');
    }

    // 2. Security Validation (Key & Package)
    if (key === "170993" && pkg === "com.mobile.legends") {
        try {
            // Replace with your actual Private GitHub Raw URL
            const GITHUB_URL = "https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua";
            
            const response = await fetch(GITHUB_URL, {
                headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
            });

            if (!response.ok) throw new Error('GitHub Fetch Failed');

            const code = await response.text();
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send(code);
            
        } catch (error) {
            return res.status(500).send('gg.alert("❌ Server Sync Error")');
        }
    }

    // 3. Invalid Access Response
    return res.status(403).send('gg.alert("❌ Unauthorized Access: Invalid Key")');
}
