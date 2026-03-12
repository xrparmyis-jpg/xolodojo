// Utility to convert a social platform and username to a full profile URL
// Supported platforms: twitter, discord, tiktok, instagram, telegram

export function getSocialProfileUrl(platform: string, username: string): string {
    if (!username || username === "#" || username.trim() === "") return "";
    const clean = username.replace(/^@/, "").trim();
    switch (platform) {
        case "twitter":
            return /^https?:\/\//.test(clean) ? clean : `https://twitter.com/${clean}`;
        case "discord":
            return /^https?:\/\//.test(clean) ? clean : `https://discord.com/users/${clean}`;
        case "tiktok":
            return /^https?:\/\//.test(clean) ? clean : `https://www.tiktok.com/@${clean}`;
        case "instagram":
            return /^https?:\/\//.test(clean) ? clean : `https://instagram.com/${clean}`;
        case "telegram":
            return /^https?:\/\//.test(clean) ? clean : `https://t.me/${clean}`;
        default:
            return clean;
    }
}
