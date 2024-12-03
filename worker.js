export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const country = request.headers.get('CF-IPCountry') || 'CH';
            const region = getNearestRegion(country, env);

            // Handle different paths
            switch (url.pathname) {
                case '/':
                case '/*':
                    // Forward to regional server
                    const regionalUrl = getRegionalUrl(url, region);
                    return await forwardRequest(request, regionalUrl);

                case '/api/region':
                    return new Response(JSON.stringify({
                        region: region,
                        country: country,
                        datacenters: getRegionDatacenters(region),
                        timestamp: new Date().toISOString()
                    }), {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Region': region,
                            'X-Country': country,
                            ...corsHeaders
                        }
                    });

                case '/health':
                    return new Response('OK', { status: 200 });

                default:
                    // Forward all other requests to regional server
                    const defaultRegionalUrl = getRegionalUrl(url, region);
                    return await forwardRequest(request, defaultRegionalUrl);
            }
        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Service temporarily unavailable', {
                status: 503,
                headers: {
                    'Content-Type': 'text/plain',
                    'Retry-After': '30'
                }
            });
        }
    }
};

function getRegionalUrl(url, region) {
    const datacenters = getRegionDatacenters(region);
    const selectedDC = datacenters[0]; // Use primary datacenter

    const regionalUrl = new URL(url);
    regionalUrl.hostname = `${selectedDC}.lucaskemper.com`;
    return regionalUrl;
}

async function forwardRequest(request, regionalUrl) {
    const requestInit = {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body,
        redirect: 'follow'
    };

    try {
        const response = await fetch(regionalUrl.toString(), requestInit);
        return response;
    } catch (error) {
        console.error('Forward error:', error);
        throw error;
    }
}

function getNearestRegion(country, env) {
    const regionMap = {
        'US': 'na-east',
        'CA': 'na-east',
        'MX': 'na-east',
        'GB': 'eu-central',
        'CH': 'eu-central',
        'DE': 'eu-central',
        'FR': 'eu-central',
        'default': env.DEFAULT_REGION || 'eu-central'
    };

    return regionMap[country] || regionMap['default'];
}

function getRegionDatacenters(region) {
    const datacenters = {
        'na-east': ['nyc', 'sea'],
        'eu-central': ['zrh', 'cdg', 'lhr'],
        'default': ['zrh']
    };
    return datacenters[region] || datacenters['default'];
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
