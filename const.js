const RE_SAFE_WHITESPACE = /\S/g;
const RE_SAFE_SEPARATOR = /[^\s;]/g;
const RE_COMMENT_BLOCKS = /<!--[^]*?-->/g;
const RE_CODING_BLOCKS = /<(script|style)([^<>]*?)>([^]*?)<\/\1>/g;
const RE_DIRECTIVE_TAGS = /\{@(raw|html|debug|render) /g;
const RE_DIRECTIVE_CONST = /\{@const /g;
const RE_MATCH_QUOTED = /(["'])(\w+)\1/;
const RE_STYLE_ATTRS = /(?<=<\w[^]*\s)style:(\w+)(?=[\s>])/g;
const RE_CLASS_ATTRS = /(?<=<\w[^]*\s)class:(\w+)(?=[\s>])/g;
const RE_BIND_ATTRS = /(?<=<\w[^]*\s)bind:(\w+)(?=[\s>])/g;
const RE_CSS_ATTRS = /(?<=<\w[^]*\s)css:(\w+)(?=[\s>])/g;
const RE_USE_ATTRS = /(?<=<\w[^]*\s)use:(\w+)(?=[\s>])/g;
const RE_CONTEXT_MODULE = /\scontext=(["'])?module\1/;
const RE_TYPE_MODULE = / type=(["'])?module\1/;
const RE_SPLIT_MARKER = /_(\d+)_(\d+):(\w+)/;
const RE_MATCH_ROUTES = /(?<=\s)(?:\[?["'])?(GET|POST|PATCH|PUT|DELETE)(?:\s(\/[^\s"']*))?(?:["']\]?)?(\s+as\s+[\w.]+)?(?=\s*[(:])/g;
const RE_ACCESED_SYMBOLS = /(?:(?:(?<=[=([]\s*|\.\.\.)[_$a-zA-Z]+\w*|(?<![.#]\w*)[_$a-zA-Z]+\w*)(?= *[.,;\n[})\]|&])|(?<![.#]\w*)[_$a-zA-Z]+\w*(?= *[(?:!<=>/*+-]{1,3}| *(?:in|as) *))/; // eslint-disable-line
const RE_COMMENT_INLINE = /(?!:) *\/\/ +.*?(?=\n)|\/\*[^]*?\*\//g;
const RE_COMMENT_SAFE = /<\/|(?<=\/[*/] *)(?:eslint|global)\b(?=[ \w,-]+)/;
const RE_IMPORT_MATCH = /\bimport[^]+?[\n;]/g;
const RE_EXPORT_MATCH = /\bexport +/g;
const RE_FIX_SPREAD = /:\{\.\.\./g;
const RE_FIX_VARS = /[[{\s}\]]/g;
const RE_FIX_SEMI = /;;/g;
const RE_ALL_SEMI = /;+/g;
const RE_ALL_BLOCKS = /\([^()]*?\)|\{[^{}]*?\}|(?<=)\[[^[\]]*?\]/;
const RE_SAFE_LOCALS = /(?:\$:|let|const)(?:[^=]*?)[;=]/g;
const RE_MATCH_LOCAL = /(?<=^|\n) *(\$:|(?:(?:export\s+)?let|const|(?:async +)?function(?: *\* *)?)) +\*?([[{}\] $\w=,]+)(?=[\n;=])/;
const RE_SPLIT_WHITESPACE = /\s+/;
const RE_SPLIT_COMMA = / *, */;
const RE_SPLIT_EQUAL = / *= */;
const RE_SPLIT_AS = /\s+as\s+/;
const RE_BLOCK_MARK = /;_\d+:\{/;
const RE_BLOCK_TAGS = /#if|:else(?: +if)?/g;
const RE_EACH_TAGS = /\{#each ([^{}\n]+?)\}/g;
const RE_EACH_CLOSE = /\{\/each\}/g;
const RE_SNIPPET_TAGS = /\{#snippet(\s+\w+\s*)\(([\w\s,]*)\)\}/g;
const RE_SNIPPET_CLOSE = /\{\/snippet\}/g;
const RE_EACH_LOCALS = / as [ \w,]+\}/g;
const RE_MATCH_TAGNAME = /<([A-Z]\w*)[^<>]*?\/?>/;
const RE_CLEAN_FUNCTION = /async |\*/g;
const RE_KEYWORD_NAMES = /^(?:if|try|for|while|switch)\b/;
const RE_CAPTURE_VARIABLES = /\{(#if|#each|#snippet|:else)(?: +([^{}\n]+?))?\}|\{((?![/:])[^{}\n]*?)\}/;
const RE_EXPORTED_ALIASES = /(?<=\bexport\s*)\{([^{}]+)\}/g;
const RE_EXPORTED_SYMBOLS = /\bexport +(let|const|(?:async +)?function(?: *\* *)?) +\*?([ \w,=]+)/g;
const RE_IMPORTED_SYMBOLS = /(?:^|[; ]+)?import(?: *(?:\* *as)? *(\w*?) *,? *(?:\{([^]*?)\})? *from)? *['"]([^'"]+)['"];?/g;

module.exports = {
  RE_SAFE_WHITESPACE,
  RE_SAFE_SEPARATOR,
  RE_COMMENT_BLOCKS,
  RE_CODING_BLOCKS,
  RE_MATCH_QUOTED,
  RE_KEYWORD_NAMES,
  RE_DIRECTIVE_TAGS,
  RE_DIRECTIVE_CONST,
  RE_CONTEXT_MODULE,
  RE_MATCH_ROUTES,
  RE_TYPE_MODULE,
  RE_CLASS_ATTRS,
  RE_STYLE_ATTRS,
  RE_BIND_ATTRS,
  RE_CSS_ATTRS,
  RE_USE_ATTRS,
  RE_SPLIT_MARKER,
  RE_ACCESED_SYMBOLS,
  RE_COMMENT_INLINE,
  RE_COMMENT_SAFE,
  RE_IMPORT_MATCH,
  RE_EXPORT_MATCH,
  RE_FIX_SPREAD,
  RE_FIX_SEMI,
  RE_ALL_SEMI,
  RE_FIX_VARS,
  RE_ALL_BLOCKS,
  RE_MATCH_LOCAL,
  RE_SAFE_LOCALS,
  RE_SPLIT_WHITESPACE,
  RE_SPLIT_COMMA,
  RE_SPLIT_EQUAL,
  RE_SPLIT_AS,
  RE_BLOCK_MARK,
  RE_BLOCK_TAGS,
  RE_EACH_TAGS,
  RE_EACH_CLOSE,
  RE_EACH_LOCALS,
  RE_SNIPPET_TAGS,
  RE_SNIPPET_CLOSE,
  RE_MATCH_TAGNAME,
  RE_CLEAN_FUNCTION,
  RE_CAPTURE_VARIABLES,
  RE_EXPORTED_ALIASES,
  RE_EXPORTED_SYMBOLS,
  RE_IMPORTED_SYMBOLS,
};
