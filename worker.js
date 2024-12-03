// worker.js

const PERFORMANCE_THRESHOLD = 100; // ms
const MAX_RETRIES = 3;
const CACHE_DURATION = 3600; // 1 hour

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            const country = request.headers.get('CF-IPCountry') || 'CH';
            const clientIP = request.headers.get('CF-Connecting-IP');
            
            // Get performance metrics from client if available
            const clientMetrics = await getClientMetrics(request);
            const region = await getNearestRegion(country, clientMetrics, env);
            
            // Handle preflight requests
            if (request.method === 'OPTIONS') {
                return handleCORS(request);
            }

            // Check cache first for GET requests
            if (request.method === 'GET') {
                const cache = caches.default;
                const cacheKey = new Request(url.toString(), {
                    headers: request.headers
                });
                
                let response = await cache.match(cacheKey);
                if (response) {
                    return response;
                }
            }

            // Route based on path
            switch (url.pathname) {
                case '/':
                case '/*':
                    const regionalUrl = await getRegionalUrl(url, region, env);
                    return await forwardRequest(request, regionalUrl, env);
                
                case '/api/region':
                    return handleRegionInfo(region, country, clientIP);
                
                case '/api/health':
                    return handleHealthCheck(region, env);
                
                case '/api/metrics':
                    return handleMetricsReport(request);
                
                default:
                    const defaultRegionalUrl = await getRegionalUrl(url, region, env);
                    return await forwardRequest(request, defaultRegionalUrl, env);
            }
        } catch (error) {
            console.error('Worker error:', error);
            return new Response('Service temporarily unavailable', {
                status: 503,
                headers: {
                    'Content-Type': 'text/plain',
                    'Retry-After': '30',
                    ...corsHeaders
                }
            });
        }
    }
};

async function getNearestRegion(country, metrics, env) {
    const regionMap = {
        // North America
        'US': 'na-east',
        'CA': 'na-east',
        'MX': 'na-east',
        
        // Europe
        'GB': 'eu-central',
        'CH': 'eu-central',
        'DE': 'eu-central',
        'FR': 'eu-central',
        
        // Asia Pacific
        'SG': 'ap-south',
        'JP': 'ap-south',
        'AU': 'ap-south',
        
        // Default
        'default': env.DEFAULT_REGION || 'eu-central'
    };

    // If we have client metrics, use them for decision
    if (metrics && metrics.latencies) {
        const bestRegion = selectBestRegionByLatency(metrics.latencies);
        if (bestRegion) return bestRegion;
    }

    return regionMap[country] || regionMap['default'];
}

async function getRegionalUrl(url, region, env) {
    const datacenters = await getHealthyDatacenters(region, env);
    if (!datacenters.length) {
        throw new Error(`No healthy datacenters found for region ${region}`);
    }

    // Select datacenter based on load and health
    const selectedDC = await selectOptimalDatacenter(datacenters, env);
    
    const regionalUrl = new URL(url);
    regionalUrl.hostname = `${selectedDC}.lucaskemper.com`;
    return regionalUrl;
}

async function forwardRequest(request, regionalUrl, env, attempt = 1) {
    const requestInit = {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.body,
        redirect: 'follow',
        cf: {
            // Optimize for performance
            minify: true,
            mirage: true,
            polish: 'lossy',
            cacheTtl: CACHE_DURATION,
            cacheEverything: true
        }
    };

    try {
        const startTime = Date.now();
        const response = await fetch(regionalUrl.toString(), requestInit);
        const latency = Date.now() - startTime;

        // Store metrics
        await storeMetrics(regionalUrl.hostname, latency, response.status);

        if (!response.ok && attempt < MAX_RETRIES) {
            // Try backup datacenter
            const newUrl = await getFailoverUrl(regionalUrl, env);
            return forwardRequest(request, newUrl, env, attempt + 1);
        }

        // Cache successful GET responses
        if (request.method === 'GET' && response.ok) {
            const cache = caches.default;
            ctx.waitUntil(cache.put(request, response.clone()));
        }

        return response;
    } catch (error) {
        console.error(`Forward error (attempt ${attempt}):`, error);
        if (attempt < MAX_RETRIES) {
            // Exponential backoff
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            return forwardRequest(request, regionalUrl, env, attempt + 1);
        }
        throw error;
    }
}

// Health check endpoint handler
async function handleHealthCheck(region, env) {
    const datacenters = await getHealthyDatacenters(region, env);
    const health = {
        status: datacenters.length > 0 ? 'healthy' : 'degraded',
        region: region,
        healthy_datacenters: datacenters,
        timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(health), {
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
}

// CORS headers and handler
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, CF-IPCountry, CF-Connecting-IP',
    'Access-Control-Max-Age': '86400',
};

function handleCORS(request) {
    return new Response(null, {
        headers: corsHeaders
    });
}

// Metrics and monitoring
async function storeMetrics(datacenter, latency, status) {
    // Implement your metrics storage logic here
    // Could use Workers KV or external monitoring service
    console.log(`DC: ${datacenter}, Latency: ${latency}ms, Status: ${status}`);
}

// Helper functions
function selectBestRegionByLatency(latencies) {
    return Object.entries(latencies)
        .sort(([,a], [,b]) => a - b)
        [0]?.[0];
}

async function getHealthyDatacenters(region, env) {
    const allDatacenters = {
        'na-east': ['nyc', 'sea'],
        'eu-central': ['zrh', 'cdg', 'lhr'],
        'ap-south': ['sin'],
        'default': ['zrh']
    };

    const datacenters = allDatacenters[region] || allDatacenters['default'];
    return datacenters;
}

async function selectOptimalDatacenter(datacenters, env) {
    // Implement your selection logic here
    // Could be based on latency, load, or other metrics
    return datacenters[0];
}

// Test Configuration
export const test = {
    endpoints: [
       
    ],
    
    async runTests() {
        const results = [];
        for (const endpoint of this.endpoints) {
            try {
                const start = Date.now();
                const response = await fetch(endpoint);
                const latency = Date.now() - start;
                
                results.push({
                    endpoint,
                    status: response.status,
                    latency,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                results.push({
                    endpoint,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        return results;
    }
};
