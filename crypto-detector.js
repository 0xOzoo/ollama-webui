// Cryptocurrency Detection Module
// Detects crypto symbols and trading pairs in user messages

/**
 * List of supported cryptocurrencies with their symbols and common variations
 */
const CRYPTO_SYMBOLS = {
    'BTC': { name: 'Bitcoin', tradingViewSymbol: 'BTCUSD' },
    'BITCOIN': { name: 'Bitcoin', tradingViewSymbol: 'BTCUSD' },
    'ETH': { name: 'Ethereum', tradingViewSymbol: 'ETHUSD' },
    'ETHEREUM': { name: 'Ethereum', tradingViewSymbol: 'ETHUSD' },
    'BNB': { name: 'Binance Coin', tradingViewSymbol: 'BNBUSD' },
    'SOL': { name: 'Solana', tradingViewSymbol: 'SOLUSD' },
    'SOLANA': { name: 'Solana', tradingViewSymbol: 'SOLUSD' },
    'XRP': { name: 'Ripple', tradingViewSymbol: 'XRPUSD' },
    'RIPPLE': { name: 'Ripple', tradingViewSymbol: 'XRPUSD' },
    'ADA': { name: 'Cardano', tradingViewSymbol: 'ADAUSD' },
    'CARDANO': { name: 'Cardano', tradingViewSymbol: 'ADAUSD' },
    'DOGE': { name: 'Dogecoin', tradingViewSymbol: 'DOGEUSD' },
    'DOGECOIN': { name: 'Dogecoin', tradingViewSymbol: 'DOGEUSD' },
    'DOT': { name: 'Polkadot', tradingViewSymbol: 'DOTUSD' },
    'MATIC': { name: 'Polygon', tradingViewSymbol: 'MATICUSD' },
    'POLYGON': { name: 'Polygon', tradingViewSymbol: 'MATICUSD' },
    'AVAX': { name: 'Avalanche', tradingViewSymbol: 'AVAXUSD' },
    'LINK': { name: 'Chainlink', tradingViewSymbol: 'LINKUSD' },
    'UNI': { name: 'Uniswap', tradingViewSymbol: 'UNIUSD' }
};

/**
 * Detect cryptocurrency mentions in a message
 * @param {string} message - User message to analyze
 * @returns {Object} Detection results with symbols and pairs
 */
function detectCrypto(message) {
    const result = {
        detected: false,
        symbols: [],
        pairs: [],
        tradingViewSymbols: []
    };

    const upperMessage = message.toUpperCase();

    // Pattern 1: Trading pairs (BTC/USDT, BTCUSDT, BTC-USDT)
    const pairPattern = /\b([A-Z]{2,5})[\/-]?(USDT|USD|BTC|ETH|BNB)\b/g;
    let pairMatch;
    while ((pairMatch = pairPattern.exec(upperMessage)) !== null) {
        const base = pairMatch[1];
        const quote = pairMatch[2];

        if (CRYPTO_SYMBOLS[base]) {
            result.detected = true;
            result.pairs.push({
                base: base,
                quote: quote,
                full: `${base}${quote}`,
                name: CRYPTO_SYMBOLS[base].name
            });
            result.tradingViewSymbols.push(`${base}${quote}`);
        }
    }

    // Pattern 2: Dollar sign symbols ($BTC, $ETH)
    const dollarPattern = /\$([A-Z]{2,5})\b/g;
    let dollarMatch;
    while ((dollarMatch = dollarPattern.exec(upperMessage)) !== null) {
        const symbol = dollarMatch[1];
        if (CRYPTO_SYMBOLS[symbol]) {
            result.detected = true;
            if (!result.symbols.includes(symbol)) {
                result.symbols.push(symbol);
                result.tradingViewSymbols.push(CRYPTO_SYMBOLS[symbol].tradingViewSymbol);
            }
        }
    }

    // Pattern 3: Standalone crypto symbols or names
    for (const [symbol, data] of Object.entries(CRYPTO_SYMBOLS)) {
        const symbolPattern = new RegExp(`\\b${symbol}\\b`, 'i');
        if (symbolPattern.test(message)) {
            result.detected = true;
            // Avoid duplicates
            const normalizedSymbol = symbol.length <= 5 ? symbol : symbol.substring(0, 3).toUpperCase();
            if (!result.symbols.includes(normalizedSymbol) && !result.pairs.some(p => p.base === normalizedSymbol)) {
                result.symbols.push(normalizedSymbol);
                result.tradingViewSymbols.push(data.tradingViewSymbol);
            }
        }
    }

    // Remove duplicates
    result.tradingViewSymbols = [...new Set(result.tradingViewSymbols)];

    return result;
}

/**
 * Generate TradingView widget HTML for a symbol
 * @param {string} symbol - TradingView symbol (e.g., BTCUSD, BTCUSDT)
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} HTML for TradingView widget
 */
function generateTradingViewWidget(symbol, theme = 'dark') {
    const widgetId = `tradingview_${symbol}_${Date.now()}`;

    return `
        <div class="crypto-chart-container">
            <div class="crypto-chart-header">
                <span class="crypto-symbol">${symbol}</span>
                <span class="crypto-source">TradingView</span>
            </div>
            <div id="${widgetId}" class="tradingview-widget-container">
                <div class="tradingview-widget-container__widget"></div>
            </div>
        </div>
        <script type="text/javascript">
        (function() {
            new TradingView.widget({
                "autosize": true,
                "symbol": "BINANCE:${symbol}",
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "${theme}",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "allow_symbol_change": true,
                "container_id": "${widgetId}",
                "height": 400,
                "width": "100%"
            });
        })();
        </script>
    `;
}

console.log('Crypto detector module loaded');
