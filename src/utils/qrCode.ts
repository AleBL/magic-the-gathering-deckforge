/**
 * Self-contained QR Code generator — no external dependency.
 *
 * Scope is deliberately narrow to keep the code small and auditable: byte mode
 * (UTF-8), error-correction level L (maximum data capacity), automatic version
 * selection across versions 1–40. That is everything a "share this deck" link
 * needs. It returns a boolean module matrix (true = dark); rendering to canvas
 * or SVG is the caller's concern.
 *
 * Algorithm follows the ISO/IEC 18004 spec: data encoding + Reed–Solomon error
 * correction over GF(256), block interleaving, function-pattern placement,
 * zig-zag data placement, and best-of-8 data masking by penalty score.
 */

/** Error-correction level L data codewords per version, plus block structure. */
// [ecCodewordsPerBlock, group1Blocks, group1DataCodewords, group2Blocks, group2DataCodewords]
const EC_BLOCKS_L: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [7, 1, 19, 0, 0],
  [10, 1, 34, 0, 0],
  [15, 1, 55, 0, 0],
  [20, 1, 80, 0, 0],
  [26, 1, 108, 0, 0],
  [18, 2, 68, 0, 0],
  [20, 2, 78, 0, 0],
  [24, 2, 97, 0, 0],
  [30, 2, 116, 0, 0],
  [18, 2, 68, 2, 69],
  [20, 4, 81, 0, 0],
  [24, 2, 92, 2, 93],
  [26, 4, 107, 0, 0],
  [30, 3, 115, 1, 116],
  [22, 5, 87, 1, 88],
  [24, 5, 98, 1, 99],
  [28, 1, 107, 5, 108],
  [30, 5, 120, 1, 121],
  [28, 3, 113, 4, 114],
  [28, 3, 107, 5, 108],
  [28, 4, 116, 4, 117],
  [28, 2, 111, 7, 112],
  [30, 4, 121, 5, 122],
  [30, 6, 117, 4, 118],
  [26, 8, 106, 4, 107],
  [28, 10, 114, 2, 115],
  [30, 8, 122, 4, 123],
  [30, 3, 117, 10, 118],
  [30, 7, 116, 7, 117],
  [30, 5, 115, 10, 116],
  [30, 13, 115, 3, 116],
  [30, 17, 115, 0, 0],
  [30, 17, 115, 1, 116],
  [30, 13, 115, 6, 116],
  [30, 12, 121, 7, 122],
  [30, 6, 121, 14, 122],
  [30, 17, 122, 4, 123],
  [30, 4, 122, 18, 123],
  [30, 20, 117, 4, 118],
  [30, 19, 118, 6, 119]
];

/** Alignment-pattern centre coordinates per version (index 0 = version 1). */
const ALIGNMENT_POSITIONS: ReadonlyArray<readonly number[]> = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170]
];

const MIN_VERSION = 1;
const MAX_VERSION = 40;

// --- GF(256) tables for Reed–Solomon (primitive polynomial x^8 + x^4 + x^3 + x^2 + 1) ---
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/**
 * Builds the Reed–Solomon divisor (generator) polynomial of the given degree.
 * The result is monic with the implicit leading 1 dropped, so it has exactly
 * `degree` coefficients — the form {@link rsEncode} expects.
 */
function rsGeneratorPoly(degree: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < degree - 1; i++) result.push(0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

/** Computes the `degree` error-correction codewords for a data block. */
function rsEncode(data: number[], degree: number): number[] {
  const divisor = rsGeneratorPoly(degree);
  const result = divisor.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < result.length; i++) result[i] ^= gfMul(divisor[i], factor);
  }
  return result;
}

/** Total data codewords available at level L for a version. */
function dataCodewordsForVersion(version: number): number {
  const [, g1, d1, g2, d2] = EC_BLOCKS_L[version - 1];
  return g1 * d1 + g2 * d2;
}

/** Byte-mode character-count indicator width for a version. */
function charCountBits(version: number): number {
  return version <= 9 ? 8 : 16;
}

/** Smallest version (1–40) whose level-L capacity fits `byteLength` bytes. */
function selectVersion(byteLength: number): number {
  for (let version = MIN_VERSION; version <= MAX_VERSION; version++) {
    const capacityBits = dataCodewordsForVersion(version) * 8;
    const requiredBits = 4 + charCountBits(version) + byteLength * 8;
    if (requiredBits <= capacityBits) return version;
  }
  return -1;
}

/** Encodes the byte payload into the final interleaved codeword sequence. */
function buildCodewords(bytes: Uint8Array, version: number): number[] {
  const bits: number[] = [];
  const pushBits = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  pushBits(0b0100, 4); // byte mode indicator
  pushBits(bytes.length, charCountBits(version));
  for (const byte of bytes) pushBits(byte, 8);

  const capacityBits = dataCodewordsForVersion(version) * 8;
  // Terminator (up to 4 zero bits) then pad to a byte boundary.
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCodewords.push(byte);
  }
  // Alternating pad bytes fill the remaining capacity.
  const padBytes = [0xec, 0x11];
  for (let i = 0; dataCodewords.length < capacityBits / 8; i++) {
    dataCodewords.push(padBytes[i % 2]);
  }

  // Split into blocks, compute EC per block, then interleave data and EC.
  const [ecPerBlock, g1, d1, g2, d2] = EC_BLOCKS_L[version - 1];
  const blocks: { data: number[]; ec: number[] }[] = [];
  let offset = 0;
  const addBlocks = (count: number, size: number) => {
    for (let b = 0; b < count; b++) {
      const data = dataCodewords.slice(offset, offset + size);
      offset += size;
      blocks.push({ data, ec: rsEncode(data, ecPerBlock) });
    }
  };
  addBlocks(g1, d1);
  addBlocks(g2, d2);

  const result: number[] = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) {
    for (const block of blocks) if (i < block.data.length) result.push(block.data[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of blocks) result.push(block.ec[i]);
  }
  return result;
}

type Grid = (boolean | null)[][];

function isFinderZone(row: number, col: number, size: number): boolean {
  // The three 8×8 finder + separator zones in the corners.
  return (row < 8 && col < 8) || (row < 8 && col >= size - 8) || (row >= size - 8 && col < 8);
}

/** Places all function patterns, marking `reserved` where data must not go. */
function placeFunctionPatterns(modules: Grid, reserved: boolean[][], version: number): void {
  const size = modules.length;
  const setFn = (r: number, c: number, dark: boolean) => {
    modules[r][c] = dark;
    reserved[r][c] = true;
  };

  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = top + r;
        const cc = left + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const dark =
          r >= 0 &&
          r <= 6 &&
          c >= 0 &&
          c <= 6 &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setFn(rr, cc, dark);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns.
  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }

  // Alignment patterns (skip any overlapping a finder zone).
  const centres = ALIGNMENT_POSITIONS[version - 1];
  for (const r of centres) {
    for (const c of centres) {
      if (isFinderZone(r, c, size)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFn(r + dr, c + dc, dark);
        }
      }
    }
  }

  // Dark module.
  setFn(size - 8, 8, true);

  // Reserve format-info areas (values filled in after masking).
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Reserve version-info areas (version >= 7).
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true;
        reserved[size - 11 + j][i] = true;
      }
    }
  }
}

/** Writes the 18-bit version information (version >= 7). */
function drawVersionInfo(modules: Grid, version: number): void {
  if (version < 7) return;
  const size = modules.length;
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = ((version << 12) | rem) >>> 0;

  for (let i = 0; i < 18; i++) {
    const bit = ((bits >> i) & 1) === 1;
    const a = Math.floor(i / 3);
    const b = (i % 3) + size - 11;
    modules[a][b] = bit;
    modules[b][a] = bit;
  }
}

/** Writes the 15-bit format information for level L and the chosen mask. */
function drawFormatInfo(modules: Grid, mask: number): void {
  const size = modules.length;
  const data = (0b01 << 3) | mask; // level L = 0b01
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;

  const getBit = (i: number) => ((bits >> i) & 1) === 1;
  // First copy: vertical strip on column 8 + horizontal strip on row 8, around
  // the top-left finder. (Positions follow the spec's (row, col) placement.)
  for (let i = 0; i <= 5; i++) modules[i][8] = getBit(i);
  modules[7][8] = getBit(6);
  modules[8][8] = getBit(7);
  modules[8][7] = getBit(8);
  for (let i = 9; i < 15; i++) modules[8][14 - i] = getBit(i);
  // Second copy: split between the bottom-left and top-right finders.
  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = getBit(i);
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = getBit(i);
  modules[size - 8][8] = true; // dark module (kept set)
}

/** Places the data/EC bit stream in the standard upward-left zig-zag order. */
function placeData(modules: Grid, reserved: boolean[][], codewords: number[]): void {
  const size = modules.length;
  let bitIndex = 0;
  const totalBits = codewords.length * 8;

  // Walk column pairs right-to-left; when a pair reaches the vertical timing
  // column (6) it shifts left to 5, so column 6 is never used for data.
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let c = 0; c < 2; c++) {
        const cc = right - c;
        const upward = ((right + 1) & 2) === 0;
        const rr = upward ? size - 1 - vert : vert;
        if (reserved[rr][cc]) continue;
        let dark = false;
        if (bitIndex < totalBits) {
          const byte = codewords[bitIndex >> 3];
          dark = ((byte >> (7 - (bitIndex & 7))) & 1) === 1;
          bitIndex++;
        }
        modules[rr][cc] = dark;
      }
    }
  }
}

function maskCondition(mask: number, row: number, col: number): boolean {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
  }
}

/** Penalty score used to pick the least-disruptive mask (lower is better). */
function penaltyScore(modules: boolean[][]): number {
  const size = modules.length;
  let score = 0;

  const runPenalty = (line: boolean[]) => {
    let run = 1;
    for (let i = 1; i < size; i++) {
      if (line[i] === line[i - 1]) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score++;
      } else {
        run = 1;
      }
    }
  };
  for (let r = 0; r < size; r++) runPenalty(modules[r]);
  for (let c = 0; c < size; c++) runPenalty(modules.map((row) => row[c]));

  // Rule 2: 2×2 blocks of the same colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns.
  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const patternRev = [...pattern].reverse();
  const matches = (arr: boolean[], start: number, pat: boolean[]) => {
    for (let k = 0; k < pat.length; k++) if (arr[start + k] !== pat[k]) return false;
    return true;
  };
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      if (matches(modules[r], c, pattern) || matches(modules[r], c, patternRev)) score += 40;
    }
  }
  for (let c = 0; c < size; c++) {
    const column = modules.map((row) => row[c]);
    for (let r = 0; r <= size - 11; r++) {
      if (matches(column, r, pattern) || matches(column, r, patternRev)) score += 40;
    }
  }

  // Rule 4: balance of dark modules.
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (modules[r][c]) dark++;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/**
 * Generates a QR code module matrix for `text` (UTF-8, EC level L).
 * @returns a square `boolean[][]` where `true` means a dark module.
 * @throws if the text exceeds the capacity of a version-40 level-L code.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const version = selectVersion(bytes.length);
  if (version < 0) {
    throw new Error('QrCapacityExceeded');
  }

  const codewords = buildCodewords(bytes, version);
  const size = version * 4 + 17;

  const baseModules: Grid = Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

  placeFunctionPatterns(baseModules, reserved, version);
  drawVersionInfo(baseModules, version);
  placeData(baseModules, reserved, codewords);

  // Try all 8 masks, keep the lowest-penalty result.
  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const candidate: boolean[][] = baseModules.map((row, r) =>
      row.map((cell, c) => {
        const value = cell === true;
        return reserved[r][c] ? value : value !== maskCondition(mask, r, c);
      })
    );
    // Format info sits over reserved cells and must reflect this mask.
    drawFormatInfo(candidate, mask);
    const score = penaltyScore(candidate);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best as boolean[][];
}
