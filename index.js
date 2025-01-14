const fs = require('fs');

const {
  RE_COMMENT_BLOCKS,
  RE_SAFE_SEPARATOR,
  RE_SAFE_WHITESPACE,
  RE_CODING_BLOCKS,
  RE_CONTEXT_MODULE,
  RE_DIRECTIVE_TAGS,
  RE_DIRECTIVE_CONST,
  RE_TYPE_MODULE,
  RE_MATCH_QUOTED,
  RE_MATCH_ROUTES,
  RE_SPLIT_MARKER,
  RE_BLOCK_MARK,
  RE_BLOCK_TAGS,
  RE_EACH_CLOSE,
  RE_EACH_TAGS,
  RE_SNIPPET_TAGS,
  RE_SNIPPET_CLOSE,
  RE_ALL_SEMI,
  RE_FIX_SEMI,
  RE_FIX_SPREAD,
  RE_STYLE_ATTRS,
  RE_CLASS_ATTRS,
  RE_BIND_ATTRS,
  RE_CSS_ATTRS,
  RE_USE_ATTRS,
} = require('./const');

const {
  vars, blocks, disable, location,
} = require('./util');

function preprocess(text) {
  const scripts = [];
  const _module = [];

  text = text.replace(RE_CODING_BLOCKS, (_, kind, attr, body) => {
    /* istanbul ignore else */
    if (kind === 'script' && !attr.includes(' src')) {
      const info = vars(` ${kind.replace(RE_SAFE_WHITESPACE, ' ')}${attr.replace(RE_SAFE_WHITESPACE, ' ')} ${body}`);

      scripts.push(info);

      // eslint-disable-next-line arrow-body-style
      _ = _.replace(RE_MATCH_ROUTES, ($0, verb, path, alias) => {
        return alias ? $0.replace(alias, `/* ${alias.split(' as ').pop().trim()} */`) : $0;
      }).replace(/\bawait\b/, (_, offset) => {
        /* istanbul ignore else */
        if (info.awaits.includes(offset)) return '/* */';
        return _;
      });

      /* istanbul ignore else */
      if (RE_CONTEXT_MODULE.test(attr)) {
        _module.push(...info.deps.concat(info.keys));
      }
    }
    return _;
  });

  let tpl = text.replace(RE_COMMENT_BLOCKS, _ => _.replace(RE_SAFE_WHITESPACE, ' '))
    .replace(RE_CLASS_ATTRS, 'class:$1={expr:$1}')
    .replace(RE_STYLE_ATTRS, 'style:$1={expr:$1}')
    .replace(RE_BIND_ATTRS, 'bind:$1={expr:$1}')
    .replace(RE_CSS_ATTRS, 'css:$1={expr:$1}')
    .replace(RE_USE_ATTRS, 'use:$1={expr:$1}');

  const { locations, components } = blocks(tpl.replace(RE_CODING_BLOCKS, _ => _.replace(RE_SAFE_WHITESPACE, ' ')));
  const symbols = [];
  const shared = {};
  const chunks = [];
  const names = [];
  const deps = [];
  const fns = [];

  let buffer = '';
  let offset = 0;
  locations.forEach((local, i) => {
    const chunk = tpl.substr(offset, local.offset[0] - offset).replace(RE_ALL_SEMI, _ => _.replace(RE_SAFE_WHITESPACE, ' '));
    const key = `00000${i}`.substr(-5);

    local.locals.forEach(temp => {
      /* istanbul ignore else */
      if (!names.some(x => x.name === temp.name)) names.push(temp);
    });

    buffer += chunk
      .replace(RE_SNIPPET_CLOSE, '          ;;')
      .replace(RE_EACH_CLOSE, '      ;;')
      .replace(RE_SAFE_SEPARATOR, ' ');

    buffer += `;_${key}:${local.block
      .replace(RE_SNIPPET_TAGS, (_, fn, args) => {
        fns.push(fn.trim());
        return `var ${fn} = (${args}) => {`;
      })
      .replace(RE_BLOCK_TAGS, _ => _.replace(RE_SAFE_WHITESPACE, ' '))
      .replace(RE_EACH_TAGS, (_, locals) => `{each: ${locals.replace(' as ', ';let ')} `)}`;
    offset = local.offset[0] + local.offset[1];
  });

  buffer += tpl.substr(offset)
    .replace(RE_SNIPPET_CLOSE, '          ;;')
    .replace(RE_EACH_CLOSE, '      ;;')
    .replace(RE_SAFE_SEPARATOR, ' ');
  buffer = buffer.replace(RE_FIX_SEMI, '}')
    .replace(RE_DIRECTIVE_CONST, '{   var ')
    .replace(RE_DIRECTIVE_TAGS, '{$1_:');
  buffer = buffer.replace(RE_FIX_SPREAD, ':{   ');

  const globals = disable('let $$props;', [
    'one-var-declaration-per-line',
    'no-unused-vars',
    'semi-spacing',
    'max-len',
    'one-var',
  ]);

  tpl = tpl.replace(RE_CODING_BLOCKS, (_, kind, attr) => {
    /* istanbul ignore else */
    if (kind === 'script' && !attr.includes(' src')) {
      let prefix = 'let $$props;';
      let suffix = '';

      const used = [];
      const idx = text.indexOf(_);
      const info = scripts.shift();
      const scoped = attr.includes(' scoped');
      const isModule = RE_TYPE_MODULE.test(attr);
      const isContext = RE_CONTEXT_MODULE.test(attr);

      /* istanbul ignore else */
      if (!isModule && !scoped) {
        const set = info.keys.filter(x => info.locals[x] === 'import');

        if (isContext) {
          Object.assign(shared, info.locals);
          deps.push(...new Set(info.keys.concat(info.deps)));
          chunks.push({
            offset: [idx, _.length],
            names: names.filter(x => info.deps.includes(x.name) || set.includes(x.name)),
          });
        } else {
          const fixedDeps = [...new Set(info.keys.concat(info.deps))].filter(x => names.some(y => y.name === x));
          const consts = fixedDeps.filter(x => info.locals[x] !== 'var' && info.locals[x] !== 'let');
          const lets = fixedDeps.filter(x => info.locals[x] === 'var');

          /* istanbul ignore else */
          if (info.hasVars) {
            Object.assign(shared, info.locals);
            deps.push(...fixedDeps);

            components.forEach(x => {
              /* istanbul ignore else */
              if (set.includes(x.name) && !consts.includes(x.name)) consts.push(x.name);
            });

            chunks.push({
              offset: [idx, _.length],
              names: names.filter(x => info.keys.includes(x.name))
                .concat(components.filter(x => info.keys.includes(x.name))),
            });

            const fixed = deps.filter(x => !fixedDeps.includes(x));

            consts.push(...fixed);
            used.push(...fixed);
          } else {
            used.push(...deps);
          }

          /* istanbul ignore else */
          if (consts.length) {
            suffix = `${disable(consts.join(';'), [
              'semi',
              'semi-spacing',
              'no-unused-expressions',
            ], true)}</script>`;
          }
          /* istanbul ignore else */
          if (lets.length) {
            suffix = `${disable(consts.concat(lets).join(';'), [
              'semi',
              'semi-spacing',
              'no-unused-expressions',
            ], true)}</script>`;
          }
          /* istanbul ignore else */
          if (used.length) {
            prefix += `let ${used.join(', ')};`;
          }
        }
      } else {
        /* istanbul ignore else */
        if (symbols.length) {
          prefix += `let ${symbols.join(', ')};`;
          used.push(...symbols);
        }
        /* istanbul ignore else */
        if (info.hasVars) {
          const fixed = new Set(info.keys.concat(info.deps));

          symbols.push(...fixed);
          used.push(...fixed);
        }
      }

      /* istanbul ignore else */
      if (fns.length > 0) {
        prefix += `let ${fns.join(',')};`;
      }

      /* istanbul ignore else */
      if (used.length) {
        suffix = suffix || `${disable(used.join(';'), [
          'semi',
          'semi-spacing',
          'no-unused-expressions',
        ], true)}</script>`;
      }

      /* istanbul ignore else */
      if (suffix) {
        text = text.substr(0, idx)
          + text.substr(idx, _.length).replace('</script>', () => suffix)
          + text.substr(idx + _.length);
      }

      const diff = idx + kind.length + attr.length + 2;

      text = `${text.substr(0, diff)}${disable(prefix, [
        'max-len',
        'one-var',
        'no-void',
        'semi-spacing',
        'no-unused-vars',
        'no-unused-expressions',
        'one-var-declaration-per-line',
      ])}${text.substr(diff)}`;
    }
    return _.replace(RE_SAFE_WHITESPACE, ' ');
  });

  const used = chunks.reduce((memo, cur) => {
    memo.push(...cur.names.map(x => x.name));
    return memo;
  }, []);

  const missed = components.filter(x => !used.includes(x.name));

  /* istanbul ignore else */
  if (missed.length) {
    chunks.push({
      code: `<script>${disable(`${missed.map(x => `_${x.offset.join('_')}:${x.name}`).join(';')}`, [
        'semi',
        'max-len',
        'semi-spacing',
        'no-unused-expressions',
      ], true)}</script>`,
    });
  }

  /* istanbul ignore else */
  if (locations.length) {
    const fixed = names.filter(x => deps.includes(x.name));

    const prefix = fixed.length
      ? `let ${fixed.map(x => x.name).join(', ')};`
      : '';

    /* istanbul ignore else */
    if (names.length) {
      chunks.push({
        code: `<script>${disable(prefix, [
          'semi',
          'semi-style',
          'semi-spacing',
          'indent',
          'one-var',
          'max-len',
          'no-empty',
          'brace-style',
          'padded-blocks',
          'one-var-declaration-per-line',
          'no-multiple-empty-lines',
          'no-multi-spaces',
          'no-trailing-spaces',
          'no-extra-semi',
          'no-sequences',
          'block-spacing',
          'space-before-blocks',
          'no-unused-expressions',
        ].concat(fns.length ? [
          'vars-on-top',
          'no-var',
        ] : []), true)}\n${buffer};${fns.join(';')}</script>`,
      });
    }
  }

  offset = 0;
  chunks.forEach(chunk => {
    /* istanbul ignore else */
    if (chunk.names && chunk.names.length) {
      /* istanbul ignore else */
      if (offset) chunk.offset[0] += offset;

      const [index, length] = chunk.offset;
      const suffix = `${chunk.names.map(x => `_${x.offset.join('_')}:${x.name}`).join(';')}`;
      const sample = text.substr(index, length).replace('</script>', `${disable(suffix, [
        'semi',
        'max-len',
        'semi-spacing',
        'block-spacing',
        'no-unused-expressions',
      ], true)}</script>`);

      offset = index + sample.length - (index + length);
      text = text.substr(0, index) + sample + text.substr(index + length);
    }
  });

  /* istanbul ignore else */
  if (_module.length) {
    const _used = used.filter(_ => _module.includes(_));

    text = text.replace('</script>', `${disable(_used.join(';'), [
      'semi',
      'semi-spacing',
      'no-unused-expressions',
    ], true)}</script>`);
  }

  return [text, ...chunks.filter(x => !x.names)
    .map(x => x.code.replace('<script>', () => `<script>${globals}`))];
}

function postprocess(messages, filename) {
  const tpl = fs.readFileSync(filename).toString();

  return messages.reduce((memo, it) => memo.concat(it.map(chunk => {
    const left = chunk.source.substr(0, chunk.column - 1);
    const matches = chunk.message.match(/'([$\w]+?)'/);

    /* istanbul ignore else */
    if (['no-tabs', 'key-spacing', 'comma-spacing', 'space-in-parens', 'array-bracket-spacing'].includes(chunk.ruleId)) {
      if (chunk.source.charAt(chunk.column - 1) === '\t') return null;
      if (chunk.source.charAt(chunk.column - 2) === '\t') return null;
    }

    /* istanbul ignore else */
    if ((chunk.ruleId === null && !chunk.message.includes('eslint-disable'))
      || chunk.ruleId === 'no-undef'
      || chunk.ruleId === 'no-unused-vars'
      || chunk.ruleId === 'comma-spacing'
    ) {
      /* istanbul ignore else */
      if (RE_BLOCK_MARK.test(chunk.source)) {
        const diff = (left.split(RE_BLOCK_MARK).length - 1) * 8;
        const temp = chunk.ruleId === 'no-unused-vars' && left.includes(';let ') ? 1 : 0;

        if (chunk.fatal) {
          chunk.column -= diff + temp;
          chunk.line -= 1;
          chunk.endColumn = chunk.column;
          chunk.endLine = chunk.line;
        } else {
          chunk.endColumn -= diff + temp;
          chunk.endLine -= 1;
          chunk.column -= diff + temp;
          chunk.line -= 1;
        }
      }

      /* istanbul ignore else */
      if (RE_MATCH_QUOTED.test(chunk.message)) {
        const list = (chunk.source || '').substr(1).split(';');
        const name = chunk.message.match(RE_MATCH_QUOTED)[2];

        for (const test of list) {
          const [, offset, length, local] = test.match(RE_SPLIT_MARKER) || [];

          /* istanbul ignore else */
          if (local === name) {
            const { line, col } = location(tpl, offset);

            chunk.endColumn = col + +length + 1;
            chunk.endLine = line;
            chunk.column = col + 1;
            chunk.line = line;
            break;
          }
        }
      }

      /* istanbul ignore else */
      if (chunk.source.includes(':var ')) {
        const diff = chunk.ruleId === 'comma-spacing' ? 5 : 3;

        chunk.endColumn -= diff;
        chunk.column -= diff;
        chunk.endLine -= 1;
        chunk.line -= 1;
      }
    }

    /* istanbul ignore else */
    if (matches && chunk.source && chunk.source.includes(':{expr:')) {
      const parts = left.match(/\{expr:\w+\}/g) || [];
      const expr = left.substr(-5) === 'expr:';
      const key = matches[1];

      let diff = parts.length * 8;
      /* istanbul ignore else */
      if (expr) diff += key.length + 7;
      diff += parts.reduce((sum, x) => sum + (x.length - 7), 0);

      chunk.column -= diff;
      chunk.endColumn -= diff;
    }

    /* istanbul ignore else */
    if (chunk.source && chunk.source.includes(':{each:')) {
      const fix = +(left.includes(';let ') && left.substr(-1) === '{');

      chunk.column -= fix;
      chunk.endColumn -= fix;
    }

    return chunk;
  }).filter(Boolean)), []);
}

require('eslint-plugin-html');

const jamrockProcessor = {
  preprocess,
  postprocess,
  supportsAutofix: true,
};

module.exports = {
  configs: {
    config: {
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
      },
      plugins: ['jamrock'],
      env: {
        es6: true,
        node: true,
        browser: true,
      },
      rules: {
        strict: 0,
        camelcase: 0,
        'eol-last': 0,
        'object-shorthand': 0,
        'newline-per-chained-call': 0,
        'function-paren-newline': 0,
        'max-classes-per-file': 0,
        'arrow-body-style': 0,
        'consistent-return': 0,
        'global-require': 0,
        'no-new': 0,
        'no-alert': 0,
        'no-labels': 0,
        'no-console': 0,
        'no-bitwise': 0,
        'no-plusplus': 0,
        'no-await-in-loop': 0,
        'no-multi-assign': 0,
        'no-unused-labels': 0,
        'no-restricted-syntax': 0,
        'no-restricted-globals': 0,
        'no-underscore-dangle': 0,
        'no-param-reassign': 0,
        'no-useless-computed-key': 0,
        'object-curly-newline': 0,
        'prefer-destructuring': 0,
        'prefer-spread': 0,
        'prefer-const': 0,
        'prefer-rest-params': 0,
        'prefer-arrow-callback': 0,
        'import/first': 0,
        'import/extensions': 0,
        'import/newline-after-import': 0,
        'import/no-extraneous-dependencies': 0,
        'import/no-dynamic-require': 0,
        'import/no-unresolved': 0,
        'import/no-mutable-exports': 0,
        'import/prefer-default-export': 0,
        'arrow-parens': ['error', 'as-needed'],
      },
    },
  },
  processors: {
    '.jam': jamrockProcessor,
    '.rock': jamrockProcessor,
    '.html': jamrockProcessor,
    '.htmlx': jamrockProcessor,
  },
};
