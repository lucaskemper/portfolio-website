export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);

            // Basic health check
            if (url.pathname === '/health') {
                return new Response('OK', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }

            // Return a test response for now
            return new Response(JSON.stringify({
                message: 'Global Edge Worker is running!',
                timestamp: new Date().toISOString(),
                requestUrl: request.url,
                country: request.headers.get('CF-IPCountry'),
                version: '2024-02-12-3'
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Worker-Version': '2024-02-12-3',
                    'X-Request-ID': crypto.randomUUID()
                }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Service temporarily unavailable', {
                status: 503,
                headers: {
                    'Content-Type': 'text/plain',
                    'Retry-After': '30',
                    'X-Error': error.message
                }
            });
        }
    }
};
