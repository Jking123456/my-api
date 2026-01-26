const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
    const { key, pkg } = req.query;
    const userAgent = req.headers['user-agent'];

    // Decoy for Sniffers
    if (userAgent !== 'Homer-Engine-v2') {
        return res.status(200).send("U0lTVEVNQSBBQ1RJVk8="); // Base64 decoy
    }

    if (key === "170993") {
        const response = await fetch("https://raw.githubusercontent.com/Jking123456/mlbb-maphack-drone/main/main.lua", {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        const rawCode = await response.text();
        
        // Simple Base64 "Scramble" so Sniffers can't read it
        const scrambled = Buffer.from(rawCode).toString('base64');
        return res.status(200).send(scrambled);
    }
}
