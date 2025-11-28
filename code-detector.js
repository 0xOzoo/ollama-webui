// Auto-detect and format code blocks
function autoDetectAndFormatCode(text) {
    // Patterns to detect code
    const codePatterns = [
        // Function definitions
        /(?:^|\n)((?:def|function|func|fn|public|private|protected|static)\s+\w+\s*\([^)]*\)\s*(?:{|:)[^\n]*(?:\n(?:\s{2,}|\t).+)*)/gm,
        // Class definitions
        /(?:^|\n)((?:class|interface|struct|enum)\s+\w+[^\n]*(?:{|:)[^\n]*(?:\n(?:\s{2,}|\t).+)*)/gm,
        // Import/include statements with following code
        /(?:^|\n)((?:import|from|#include|using|require)\s+[^\n]+(?:\n(?:\s{2,}|\t).+)*)/gm,
        // Multi-line indented blocks (4+ spaces or tabs)
        /(?:^|\n)((?:(?:\s{4,}|\t+).+\n){3,})/gm,
        // Common code structures
        /(?:^|\n)((?:if|for|while|switch|try|catch)\s*\([^)]*\)\s*{[^}]*})/gm,
    ];

    // Language detection keywords
    const languageKeywords = {
        python: ['def ', 'import ', 'from ', 'class ', 'if __name__', 'self.', 'print(', 'elif ', 'lambda ', 'yield '],
        javascript: ['function ', 'const ', 'let ', 'var ', '=>', 'console.log', 'require(', 'export ', 'async ', 'await '],
        java: ['public class', 'private ', 'protected ', 'void ', 'System.out', 'new ', 'extends ', 'implements '],
        cpp: ['#include', 'std::', 'cout', 'cin', 'namespace ', 'template<', 'nullptr'],
        csharp: ['using System', 'namespace ', 'public class', 'private ', 'void ', 'string ', 'int ', 'var '],
        go: ['package ', 'func ', 'import ', 'fmt.', 'var ', 'type ', 'struct {', 'interface {'],
        rust: ['fn ', 'let ', 'mut ', 'impl ', 'pub ', 'use ', 'mod ', '&str', 'Vec<'],
        php: ['<?php', 'function ', '$', 'echo ', 'class ', 'namespace ', 'use '],
        ruby: ['def ', 'end', 'class ', 'module ', 'puts ', 'require ', '@'],
        typescript: ['interface ', 'type ', ': string', ': number', 'export ', 'import '],
    };

    function detectLanguage(code) {
        let maxScore = 0;
        let detectedLang = 'plaintext';

        for (const [lang, keywords] of Object.entries(languageKeywords)) {
            let score = 0;
            for (const keyword of keywords) {
                if (code.includes(keyword)) {
                    score++;
                }
            }
            if (score > maxScore) {
                maxScore = score;
                detectedLang = lang;
            }
        }

        return maxScore > 0 ? detectedLang : 'plaintext';
    }

    // Check if text already has markdown code blocks
    if (text.includes('```')) {
        return text; // Already formatted, don't modify
    }

    let modifiedText = text;
    let codeBlocks = [];

    // Find all code-like blocks
    for (const pattern of codePatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const codeBlock = match[1].trim();
            if (codeBlock.length > 20) { // Minimum length to be considered code
                codeBlocks.push({
                    original: match[0],
                    code: codeBlock,
                    index: match.index
                });
            }
        }
    }

    // Remove duplicates and sort by index
    codeBlocks = codeBlocks
        .filter((block, index, self) =>
            index === self.findIndex(b => b.code === block.code)
        )
        .sort((a, b) => b.index - a.index); // Reverse order for replacement

    // Replace code blocks with markdown formatted versions
    for (const block of codeBlocks) {
        const language = detectLanguage(block.code);
        const formatted = `\n\`\`\`${language}\n${block.code}\n\`\`\`\n`;
        modifiedText = modifiedText.replace(block.original, formatted);
    }

    return modifiedText;
}
