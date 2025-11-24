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
        // Use DuckDuckGo Lite for better parsing and current results
        const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        };

        https.get(searchUrl, options, (res) => {
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
        }).on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });
    });
}

/**
 * Parse HTML search results from DuckDuckGo Lite
 */
function parseSearchResults(html, query) {
    const results = [];

    // DuckDuckGo Lite uses simple table structure
    // Each result is in a table row with specific structure
    const lines = html.split('\n');

    let currentResult = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Look for result links - they contain the actual URLs
        if (line.includes('class="result-link"') || line.includes('<a rel="nofollow"')) {
            const urlMatch = line.match(/href="([^"]+)"/);
            const textMatch = line.match(/>(.*?)<\/a>/);

            if (urlMatch && textMatch) {
                const resultUrl = urlMatch[1];
                const title = stripHtml(textMatch[1]);

                // Skip DuckDuckGo internal links and ads
                if (resultUrl.startsWith('http') &&
                    !resultUrl.includes('duckduckgo.com') &&
                    !resultUrl.includes('//r.search.yahoo.com') &&
                    title.length > 0) {

                    currentResult = {
                        title: title,
                        url: resultUrl,
                        snippet: ''
                    };
                }
            }
        }

        // Look for snippet text (usually in the next few lines after the link)
        if (currentResult && line.includes('class="result-snippet"')) {
            let snippetText = stripHtml(line);
            if (snippetText.length > 10) {
                currentResult.snippet = snippetText;
                results.push(currentResult);
                currentResult = null;

                if (results.length >= 5) break;
            }
        }
    }

    // If the above parsing didn't work, try alternative method
    if (results.length === 0) {
        const altPattern = /<tr>[\s\S]*?<a[^>]*href="(http[^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<td[^>]*class="result-snippet"[^>]*>(.*?)<\/td>/gi;
        let match;

        while ((match = altPattern.exec(html)) !== null && results.length < 5) {
            const resultUrl = match[1];
            const title = stripHtml(match[2]);
            const snippet = stripHtml(match[3]);

            if (!resultUrl.includes('duckduckgo.com') &&
                !resultUrl.includes('//r.search.yahoo.com') &&
                title.length > 0) {
                results.push({
                    title: title,
                    url: resultUrl,
                    snippet: snippet
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
