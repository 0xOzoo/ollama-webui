const https = require('https');

const query = 'bitcoin price';
const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
    }
};

https.get(searchUrl, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('=== HTML SAMPLE ===');
        // Print first 5000 characters to see the structure
        console.log(data.substring(0, 5000));
        console.log('\n=== SEARCHING FOR LINKS ===');

        // Find all links
        const linkMatches = data.match(/<a[^>]*href="http[^"]*"[^>]*>[^<]+<\/a>/gi);
        if (linkMatches) {
            console.log(`Found ${linkMatches.length} links`);
            linkMatches.slice(0, 5).forEach((link, i) => {
                console.log(`\n${i + 1}. ${link}`);
            });
        } else {
            console.log('No links found!');
        }
    });
}).on('error', (error) => {
    console.error('Error:', error);
});
