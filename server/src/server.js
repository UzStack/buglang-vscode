"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// Create LSP connection
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// Buglang keywords and built-ins for autocompletion
const keywords = [
    'class', 'func', 'return', 'for', 'new', 'super', 'this', 'import', 'if', 'else', 'while'
];
const builtins = ['println', 'math.round', 'size', 'add'];
// Initialize server
connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true
            },
            hoverProvider: true
        }
    };
});
// Handle document changes
documents.onDidChangeContent(change => {
    const document = change.document;
    const diagnostics = [];
    const text = document.getText();
    const lines = text.split('\n');
    // Diagnostic: Check for incorrect keyword "funct"
    lines.forEach((line, index) => {
        const match = line.match(/\bfunct\b/);
        if (match) {
            diagnostics.push({
                severity: node_1.DiagnosticSeverity.Error,
                range: {
                    start: { line: index, character: match.index },
                    end: { line: index, character: match.index + match[0].length }
                },
                message: `"funct" is incorrect. Use "func" instead.`,
                source: 'Buglang LSP'
            });
        }
    });
    connection.sendDiagnostics({ uri: document.uri, diagnostics });
});
// Autocompletion
connection.onCompletion((_textDocumentPosition) => {
    return [
        ...keywords.map(keyword => ({
            label: keyword,
            kind: node_1.CompletionItemKind.Keyword,
            detail: `Buglang keyword: ${keyword}`
        })),
        ...builtins.map(builtin => ({
            label: builtin,
            kind: node_1.CompletionItemKind.Function,
            detail: `Buglang built-in: ${builtin}`
        }))
    ];
});
// Hover information
connection.onHover(({ textDocument, position }) => {
    const document = documents.get(textDocument.uri);
    if (!document)
        return null;
    const line = document.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line + 1, character: 0 }
    });
    const wordMatch = line.match(/\b\w+\b/g);
    if (!wordMatch)
        return null;
    const word = wordMatch.find((w) => {
        const index = line.indexOf(w);
        return index <= position.character && position.character <= index + w.length;
    });
    if (!word)
        return null;
    if (keywords.includes(word)) {
        return {
            contents: [
                { language: 'buglang', value: word },
                `Buglang keyword: Used for control flow or structure.`
            ]
        };
    }
    else if (builtins.includes(word)) {
        return {
            contents: [
                { language: 'buglang', value: word },
                `Buglang built-in function.`
            ]
        };
    }
    else {
        return {
            contents: [
                { language: 'buglang', value: word },
                `Identifier in Buglang code.`
            ]
        };
    }
});
// Connect documents to connection
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map