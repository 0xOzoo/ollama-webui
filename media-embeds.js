// Media Embed System for Ollama WebUI
// Add this to app.js or include as separate file

// Media type detection
function detectMediaType(url) {
    const urlLower = url.toLowerCase();

    // Image formats
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(urlLower)) {
        return 'image';
    }

    // Video formats and platforms
    if (/\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(urlLower)) {
        return 'video';
    }
    if (/youtube\.com\/watch|youtu\.be\//i.test(urlLower)) {
        return 'youtube';
    }
    if (/vimeo\.com\//i.test(urlLower)) {
        return 'vimeo';
    }
    if (/soundcloud\.com\//i.test(urlLower)) {
        return 'soundcloud';
    }

    // Audio formats
    if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(urlLower)) {
        return 'audio';
    }

    // Maps
    if (/maps\.google\.com|google\.com\/maps/i.test(urlLower)) {
        return 'map';
    }

    // Generic URL
    if (/^https?:\/\//i.test(url)) {
        return 'link';
    }

    return null;
}

// Extract YouTube video ID
function getYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
}

// Extract Vimeo video ID
function getVimeoId(url) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

// Encode SoundCloud URL for embed
function getSoundCloudEmbedUrl(url) {
    // Encode the SoundCloud URL for the iframe src
    const encodedUrl = encodeURIComponent(url);
    return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
}

// Clean URL by removing query parameters for images
function cleanUrl(url, type) {
    // For images, remove query parameters like &w=740&q=80
    if (type === 'image') {
        try {
            const urlObj = new URL(url);
            // Keep the base URL without query parameters
            return urlObj.origin + urlObj.pathname;
        } catch (e) {
            return url; // Return original if URL parsing fails
        }
    }
    return url;
}

// Render media embed HTML
function renderMediaEmbed(url, type) {
    if (!type) type = detectMediaType(url);
    if (!type) return '';

    // Clean the URL for images
    const cleanedUrl = cleanUrl(url, type);

    switch (type) {
        case 'image':
            return `<div class="media-embed media-image">
                <img src="${cleanedUrl}" alt="Image" loading="lazy" onclick="window.open('${cleanedUrl}', '_blank')">
            </div>`;

        case 'video':
            return `<div class="media-embed media-video">
                <video controls preload="metadata">
                    <source src="${url}">
                    Your browser does not support the video tag.
                </video>
            </div>`;

        case 'youtube':
            const ytId = getYouTubeId(url);
            return ytId ? `<div class="media-embed media-video">
                <iframe 
                    src="https://www.youtube.com/embed/${ytId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>` : '';

        case 'vimeo':
            const vimeoId = getVimeoId(url);
            return vimeoId ? `<div class="media-embed media-video">
                <iframe 
                    src="https://player.vimeo.com/video/${vimeoId}" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>` : '';

        case 'soundcloud':
            const soundcloudEmbedUrl = getSoundCloudEmbedUrl(url);
            return `<div class="media-embed media-audio">
                <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" 
                    src="${soundcloudEmbedUrl}">
                </iframe>
            </div>`;

        case 'audio':
            return `<div class="media-embed media-audio">
                <audio controls preload="metadata">
                    <source src="${url}">
                    Your browser does not support the audio tag.
                </audio>
            </div>`;

        case 'map':
            return `<div class="media-embed media-map">
                <a href="${url}" target="_blank" class="map-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Open in Google Maps
                </a>
            </div>`;

        case 'link':
            const domain = new URL(url).hostname.replace('www.', '');
            return `<div class="media-embed media-link">
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-preview">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span class="link-domain">${domain}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>`;

        default:
            return '';
    }
}

// Process message content and embed media
function processMessageWithMedia(content) {
    // Extract URLs from markdown image syntax ![alt](url)
    const markdownImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

    let processedContent = content;
    const mediaEmbeds = [];
    const foundUrls = new Set();

    // First, extract URLs from markdown images
    let match;
    while ((match = markdownImagePattern.exec(content)) !== null) {
        const url = match[2];
        foundUrls.add(url);
        const type = detectMediaType(url);
        if (type === 'image') {
            const embed = renderMediaEmbed(url, type);
            if (embed) {
                mediaEmbeds.push(embed);
                // Remove the markdown image syntax from content
                processedContent = processedContent.replace(match[0], '');
            }
        }
    }

    // Then extract plain URLs
    const urls = content.match(urlPattern) || [];
    urls.forEach(url => {
        if (!foundUrls.has(url)) {
            foundUrls.add(url);
            const type = detectMediaType(url);
            if (type) {
                const embed = renderMediaEmbed(url, type);
                if (embed) {
                    mediaEmbeds.push(embed);
                    // Optionally remove URL from text if it's just a standalone URL
                    if (content.trim() === url) {
                        processedContent = '';
                    }
                }
            }
        }
    });

    return {
        text: processedContent.trim(),
        embeds: mediaEmbeds
    };
}

// Example usage - modify your addMessage function:
/*
function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const processed = processMessageWithMedia(content);
    
    // Add avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    // ... avatar content
    
    // Add message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Add text if present
    if (processed.text) {
        const textDiv = document.createElement('div');
        textDiv.innerHTML = marked.parse(processed.text);
        contentDiv.appendChild(textDiv);
    }
    
    // Add media embeds
    processed.embeds.forEach(embedHTML => {
        const embedDiv = document.createElement('div');
        embedDiv.innerHTML = embedHTML;
        contentDiv.appendChild(embedDiv.firstChild);
    });
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}
*/
