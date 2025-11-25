// Web Search Integration for Ollama WebUI
// Using local DuckDuckGo search server

// Configuration
const WEB_SEARCH_CONFIG = {
    searchEndpoint: 'http://localhost:8081/search'
};

// Perform web search using local DuckDuckGo server
async function performWebSearch(query) {
    console.log(`Searching web for: ${query}`);

    try {
        const response = await fetch(`${WEB_SEARCH_CONFIG.searchEndpoint}?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Web search error:', response.status, errorText);
            throw new Error(`Web search returned ${response.status}`);
        }

        const data = await response.json();
        console.log('Web search results:', data);
        return data;
    } catch (error) {
        console.error('Web search error:', error);
        // Return null instead of throwing to allow chat to continue
        return null;
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
        const snippet = result.snippet || '';
        const displaySnippet = snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet;

        resultEl.innerHTML = `
            <a href="${url}" target="_blank" class="search-result-title">${title}</a>
            <p class="search-result-content">${displaySnippet}</p>
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
