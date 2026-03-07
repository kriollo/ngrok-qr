const config = {
    arrowParens: 'avoid',
    bracketSameLine: true,
    bracketSpacing: true,
    embeddedLanguageFormatting: 'auto',
    endOfLine: 'auto',
    htmlWhitespaceSensitivity: 'ignore',
    insertPragma: false,
    jsxBracketSameLine: false,
    jsxSingleQuote: false,
    printWidth: 80,
    proseWrap: 'preserve',
    quoteProps: 'as-needed',
    requirePragma: false,
    semi: true,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
    vueIndentScriptAndStyle: true,
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 4,
            },
        },
        {
            parser: 'php',
            files: '*.php',
            options: {
                braceStyle: 'psr-2',
                printWidth: 120,
                tabWidth: 4,
                trailingCommaPHP: true,
            },
        },
    ],
};

export default config;
