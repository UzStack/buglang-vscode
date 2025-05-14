import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  Position,
  TextDocumentIdentifier,
  Connection
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

// Create LSP connection
const connection: Connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Buglang keywords and built-ins for autocompletion
const keywords = [
  'class', 'func', 'return', 'for', 'new', 'super', 'this', 'import', 'if', 'else', 'while'
];
const builtins = ['println', "input", "print", "console", "consoleln", "math", "ffi", "ffi.load", "ffi.call"];

// Completion item descriptions
const completionDetails: { [key: string]: string } = {
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
connection.onInitialize((params: InitializeParams) => {
  connection.console.log('Buglang LSP server initialized');
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true
      },
      hoverProvider: true
    }
  };
});

// Handle document changes
documents.onDidChangeContent(change => {
  const document: TextDocument = change.document;
  const diagnostics: Diagnostic[] = [];
  const text: string = document.getText();
  const lines: string[] = text.split('\n');

  // Diagnostic: Check for incorrect keyword "funct"
  lines.forEach((line: string, index: number) => {
    const match = line.match(/\bfunct\b/);
    if (match) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: index, character: match.index! },
          end: { line: index, character: match.index! + match[0].length }
        },
        message: `"funct" is incorrect. Use "func" instead.`,
        source: 'Buglang LSP'
      });
    }
  });

  connection.sendDiagnostics({ uri: document.uri, diagnostics });
});

// Autocompletion
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    connection.console.log('Received completion request');
    return [
      ...keywords.map(keyword => ({
        label: keyword,
        kind: CompletionItemKind.Keyword,
        detail: `Buglang keyword: ${keyword}`,
        documentation: completionDetails[keyword]
      })),
      ...builtins.map(builtin => ({
        label: builtin,
        kind: CompletionItemKind.Function,
        detail: `Buglang built-in: ${builtin}`,
        documentation: completionDetails[builtin]
      }))
    ];
  }
);

// Resolve completion item
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    connection.console.log(`Resolving completion item: ${item.label}`);
    if (completionDetails[item.label]) {
      item.documentation = {
        kind: 'markdown',
        value: completionDetails[item.label]
      };
    }
    return item;
  }
);

// Hover information
connection.onHover(
  ({ textDocument, position }: { textDocument: TextDocumentIdentifier; position: Position }): Hover | null => {
    const document = documents.get(textDocument.uri);
    if (!document) return null;

    const line: string = document.getText({
      start: { line: position.line, character: 0 },
      end: { line: position.line + 1, character: 0 }
    });
    const wordMatch = line.match(/\b\w+\b/g);
    if (!wordMatch) return null;

    const word = wordMatch.find((w: string) => {
      const index: number = line.indexOf(w);
      return index <= position.character && position.character <= index + w.length;
    });

    if (!word) return null;

    if (keywords.includes(word)) {
      return {
        contents: [
          { language: 'buglang', value: word },
          `Buglang keyword: ${completionDetails[word] || 'Used for control flow or structure.'}`
        ]
      };
    } else if (builtins.includes(word)) {
      return {
        contents: [
          { language: 'buglang', value: word },
          `Buglang built-in function: ${completionDetails[word] || 'Built-in function.'}`
        ]
      };
    } else {
      return {
        contents: [
          { language: 'buglang', value: word },
          `Identifier in Buglang code.`
        ]
      };
    }
  }
);

// Connect documents to connection
documents.listen(connection);
connection.listen();