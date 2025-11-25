const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8081;

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

/**
 * Perform DuckDuckGo search using their HTML endpoint
 * This gets fresh, current results
 */
function searchDuckDuckGo(query) {
    return new Promise((resolve, reject) => {
        // DuckDuckGo Lite requires POST request to get results
        const postData = `q=${encodeURIComponent(query)}`;

        const options = {
            hostname: 'lite.duckduckgo.com',
            path: '/lite/',
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const results = parseSearchResults(data, query);
                    console.log(`Found ${results.results.length} results for: ${query}`);
                    resolve(results);
                } catch (error) {
                    console.error('Parse error:', error);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        // Write POST data
        req.write(postData);
        req.end();
    });
}

/**
 * Parse HTML search results from DuckDuckGo Lite
 */
function parseSearchResults(html, query) {
    const results = [];

    // DuckDuckGo Lite structure: links are in <a> tags with rel="nofollow"
    // Snippets are in <td class="result-snippet">

    // Method 1: Find all links with their snippets
    // Pattern: <a rel="nofollow" href="URL">TITLE</a> ... <td class="result-snippet">SNIPPET</td>
    const resultPattern = /<a\s+rel="nofollow"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

    let match;
    while ((match = resultPattern.exec(html)) !== null && results.length < 5) {
        const url = match[1];
        const title = stripHtml(match[2]);
        const snippet = stripHtml(match[3]);

        // Skip DuckDuckGo internal links and ads
        if (url.startsWith('http') &&
            !url.includes('duckduckgo.com') &&
            !url.includes('//r.search.yahoo.com') &&
            title.length > 0) {

            results.push({
                title: title,
                url: url,
                snippet: snippet || ''
            });
        }
    }

    // Method 2: If no results, try simpler pattern (just links)
    if (results.length === 0) {
        const linkPattern = /<a\s+rel="nofollow"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

        while ((match = linkPattern.exec(html)) !== null && results.length < 5) {
            const url = match[1];
            const title = stripHtml(match[2]);

            if (url.startsWith('http') &&
                !url.includes('duckduckgo.com') &&
                !url.includes('//r.search.yahoo.com') &&
                title.length > 0) {

                results.push({
                    title: title,
                    url: url,
                    snippet: ''
                });
            }
        }
    }

    return {
        query: query,
        results: results,
        count: results.length,
        timestamp: new Date().toISOString()
    };
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html) {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * HTTP Server
 */
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Search endpoint
    if (parsedUrl.pathname === '/search' && req.method === 'GET') {
        const query = parsedUrl.query.q;

        if (!query) {
            res.writeHead(400, corsHeaders);
            res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
            return;
        }

        try {
            console.log(`🔍 Searching for: "${query}"`);
            const results = await searchDuckDuckGo(query);

            if (results.count === 0) {
                console.log('⚠️  No results found');
            }

            res.writeHead(200, corsHeaders);
            res.end(JSON.stringify(results));
        } catch (error) {
            console.error('❌ Search error:', error.message);
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({
                error: 'Search failed',
                message: error.message,
                results: [],
                count: 0
            }));
        }
    }
    // Health check endpoint
    else if (parsedUrl.pathname === '/health' && req.method === 'GET') {
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({
            status: 'ok',
            service: 'DuckDuckGo Search Proxy',
            timestamp: new Date().toISOString()
        }));
    }
    // Not found
    else {
        res.writeHead(404, corsHeaders);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`\n🔍 DuckDuckGo Search Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Search: http://localhost:${PORT}/search?q=your+query\n`);
});
