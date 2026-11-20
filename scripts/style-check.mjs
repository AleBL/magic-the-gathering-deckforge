#!/usr/bin/env node
/**
 * Visual-style ratchet for MTG Deck Forge.
 *
 * Counts the styling signals the UX plan wants to drive down (raw palette classes,
 * catch-all transitions, glows, tracked capitals...) across `src/` and compares them
 * with the ceilings stored in `scripts/style-baseline.json`.
 *
 * Usage:
 *   node scripts/style-check.mjs            # print the counts and the ceilings
 *   node scripts/style-check.mjs --ci       # exit non-zero when a count rises above its ceiling
 *   node scripts/style-check.mjs --update   # lower the ceilings to the current counts (never raises)
 *   node scripts/style-check.mjs --list <signal>  # print every match of one signal with file:line
 *
 * The ceilings only move down, like the coverage ratchet: a count that drops is locked in
 * with --update, a count that rises fails CI.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv, exit, stdout, stderr } from 'node:process';
import { Console } from 'node:console';

const console = new Console(stdout, stderr);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');
const BASELINE_FILE = join(__dirname, 'style-baseline.json');

const NEUTRALS = 'slate|gray|zinc|neutral|stone';
const HUES = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const UTILITY =
  '(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|from|via|to|fill|stroke|shadow|outline|divide|placeholder|decoration|accent|caret)';

/** Each signal is one regex, counted per match. */
const SIGNALS = {
  rawHue: {
    pattern: new RegExp(`\\b${UTILITY}-(?:${HUES})-\\d{2,3}\\b`, 'g'),
    why: 'raw coloured shades instead of semantic tokens'
  },
  rawNeutral: {
    pattern: new RegExp(`\\b${UTILITY}-(?:${NEUTRALS})-\\d{2,3}\\b`, 'g'),
    why: 'raw grey shades instead of surface/text roles'
  },
  transitionAll: {
    pattern: /\btransition-all\b|transition:\s*all\b/g,
    why: 'catch-all transitions animate layout properties by accident'
  },
  heavyWeights: {
    pattern: /\bfont-(?:bold|extrabold|black)\b|font-weight:\s*(?:700|800|900|bold)\b/g,
    why: 'hierarchy built with weight instead of size and colour'
  },
  uppercase: {
    pattern: /\buppercase\b/g,
    why: 'labels set in capitals'
  },
  wideTracking: {
    pattern: /\btracking-(?:wide|wider|widest)\b/g,
    why: 'tracked capitals'
  },
  backdropBlur: {
    pattern: /\bbackdrop-blur(?:-\w+)?\b|backdrop-filter:\s*blur/g,
    why: 'glass outside overlays'
  },
  hoverMotion: {
    pattern: /\b(?:group-)?hover:(?:scale-\d+|-translate-y-\S+)/g,
    why: 'hover moves more than a few pixels'
  },
  gradients: {
    pattern: /\b(?:linear|radial|conic)-gradient\(|\bbg-gradient-to-\w+|\bbg-linear-to-\w+|\bbg-radial\b/g,
    why: 'hue gradients and colour washes'
  },
  loopAnimations: {
    pattern: /\banimate-(?:pulse|ping|bounce)\b/g,
    why: 'looping motion without a live state behind it'
  },
  coloredShadows: {
    pattern: new RegExp(
      `\\bshadow-(?:${NEUTRALS}|${HUES}|primary|success|danger|warning)(?:-\\d{2,3})?(?:\\/\\d+)?\\b`,
      'g'
    ),
    why: 'coloured glows'
  }
};

const args = argv.slice(2);
const CI = args.includes('--ci');
const UPDATE = args.includes('--update');
const listIndex = args.indexOf('--list');
const LIST = listIndex >= 0 ? args[listIndex + 1] : null;

/** Source files that ship to users: no tests, no generated service-worker output. */
function collectSources(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'dev-dist' || entry === 'test') continue;
      collectSources(full, out);
    } else if (['.ts', '.tsx', '.css'].includes(extname(entry)) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function count(files) {
  const totals = Object.fromEntries(Object.keys(SIGNALS).map((k) => [k, 0]));
  const matches = [];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      for (const [name, { pattern }] of Object.entries(SIGNALS)) {
        const found = line.match(pattern);
        if (!found) continue;
        totals[name] += found.length;
        if (name === LIST) matches.push(`${relative(ROOT, file)}:${index + 1}  ${found.join(' ')}`);
      }
    });
  }
  return { totals, matches };
}

function readBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

const { totals, matches } = count(collectSources(SRC_DIR));

if (LIST) {
  if (!SIGNALS[LIST]) {
    console.error(`Unknown signal "${LIST}". Known: ${Object.keys(SIGNALS).join(', ')}`);
    exit(2);
  }
  for (const line of matches) console.log(line);
  console.log(`\n${matches.length} line(s), ${totals[LIST]} match(es)`);
  exit(0);
}

const baseline = readBaseline();
let failed = false;
console.log('style check (current / ceiling)');
for (const [name, { why }] of Object.entries(SIGNALS)) {
  const ceiling = baseline[name];
  const current = totals[name];
  const over = typeof ceiling === 'number' && current > ceiling;
  if (over) failed = true;
  const mark = over ? 'FAIL' : typeof ceiling === 'number' && current < ceiling ? 'down' : ' ok ';
  console.log(
    `  ${mark}  ${name.padEnd(15)} ${String(current).padStart(4)} / ${String(ceiling ?? '-').padStart(4)}  ${why}`
  );
}

if (UPDATE) {
  const next = { ...baseline };
  for (const [name, current] of Object.entries(totals)) {
    next[name] = typeof baseline[name] === 'number' ? Math.min(baseline[name], current) : current;
  }
  writeFileSync(BASELINE_FILE, JSON.stringify(next, null, 2) + '\n');
  console.log('\nceilings updated (they only go down)');
}

if (failed) {
  console.log('\nA count rose above its ceiling. Use the semantic tokens in docs/DESIGN_TOKENS.md,');
  console.log('or run with --list <signal> to see every match.');
  if (CI) exit(1);
}
