// Web Search Integration for Ollama WebUI
// Using Ollama's Web Search API with Tavily

// Configuration
const WEB_SEARCH_CONFIG = {
    apiKey: '8c09136495174857951075d1f4e9fa09.YUehTySxFxVGvDt_2XQSsar4',
    apiEndpoint: 'https://ollama.com/api/web_search'
};

// Perform web search using Ollama API
async function performWebSearch(query) {
    console.log(`Searching web for: ${query}`);

    try {
        const response = await fetch(WEB_SEARCH_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WEB_SEARCH_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Web search API error:', response.status, errorText);
            throw new Error(`Web search API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('Web search results:', data);
        return data;
    } catch (error) {
        console.error('Web search error:', error);
        throw error;
    }
}

// Display search results in the chat
function displaySearchResults(results) {
    if (!results || !results.results || results.results.length === 0) {
        console.log('No search results to display');
        return;
    }

    const searchInfo = document.createElement('div');
    searchInfo.className = 'search-results-info';

    const headerHTML = `
        <div class="search-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <span>Found ${results.results.length} search result(s)</span>
        </div>
    `;
    searchInfo.innerHTML = headerHTML;

    // Add each search result
    results.results.forEach(result => {
        const resultEl = document.createElement('div');
        resultEl.className = 'search-result-item';

        const title = result.title || 'Untitled';
        const url = result.url || '#';
        const content = result.content || '';
        const snippet = content.length > 200 ? content.substring(0, 200) + '...' : content;

        resultEl.innerHTML = `
            <a href="${url}" target="_blank" class="search-result-title">${title}</a>
            <p class="search-result-content">${snippet}</p>
        `;
        searchInfo.appendChild(resultEl);
    });

    // Append to chat
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.appendChild(searchInfo);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

console.log('Web search module loaded successfully');
