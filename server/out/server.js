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
const builtins = ['println', "input", "print", "console", "consoleln", "math", "ffi", "ffi.load", "ffi.call"];
// Completion item descriptions
const completionDetails = {
    'class': 'Defines a class in Buglang.',
    'func': 'Defines a function in Buglang.',
    'return': 'Returns a value from a function.',
    'for': 'Iterates over a collection or range.',
    'new': 'Creates a new instance of a class.',
    'super': 'Calls a parent class method or constructor.',
    'this': 'Refers to the current instance.',
    'import': 'Imports a module or library.',
    'if': 'Conditional statement.',
    'else': 'Alternative branch for if statement.',
    'while': 'Loops while a condition is true.',
    'println': 'Prints a line to the console.',
    'math.round': 'Rounds a number to the specified decimal places.',
    'size': 'Returns the size of an array or collection.',
    'add': 'Adds an element to an array.'
};
// Initialize server
connection.onInitialize((params) => {
    connection.console.log('Buglang LSP server initialized');
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
    connection.console.log('Received completion request');
    return [
        ...keywords.map(keyword => ({
            label: keyword,
            kind: node_1.CompletionItemKind.Keyword,
            detail: `Buglang keyword: ${keyword}`,
            documentation: completionDetails[keyword]
        })),
        ...builtins.map(builtin => ({
            label: builtin,
            kind: node_1.CompletionItemKind.Function,
            detail: `Buglang built-in: ${builtin}`,
            documentation: completionDetails[builtin]
        }))
    ];
});
// Resolve completion item
connection.onCompletionResolve((item) => {
    connection.console.log(`Resolving completion item: ${item.label}`);
    if (completionDetails[item.label]) {
        item.documentation = {
            kind: 'markdown',
            value: completionDetails[item.label]
        };
    }
    return item;
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
                `Buglang keyword: ${completionDetails[word] || 'Used for control flow or structure.'}`
            ]
        };
    }
    else if (builtins.includes(word)) {
        return {
            contents: [
                { language: 'buglang', value: word },
                `Buglang built-in function: ${completionDetails[word] || 'Built-in function.'}`
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