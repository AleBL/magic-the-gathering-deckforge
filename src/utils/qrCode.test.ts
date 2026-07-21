import { describe, it, expect } from 'vitest';
import { generateQrMatrix } from './qrCode';

/** The 7×7 finder pattern that must appear at three corners of every QR code. */
const FINDER = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1]
].map((row) => row.map(Boolean));

function assertFinderAt(matrix: boolean[][], top: number, left: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      expect(matrix[top + r][left + c]).toBe(FINDER[r][c]);
    }
  }
}

/** Reads the 15-bit format information back and returns the EC level bits. */
function readFormatEcBits(matrix: boolean[][]): number {
  let bits = 0;
  for (let i = 0; i <= 5; i++) bits |= (matrix[i][8] ? 1 : 0) << i;
  bits |= (matrix[7][8] ? 1 : 0) << 6;
  bits |= (matrix[8][8] ? 1 : 0) << 7;
  bits |= (matrix[8][7] ? 1 : 0) << 8;
  for (let i = 9; i < 15; i++) bits |= (matrix[8][14 - i] ? 1 : 0) << i;
  const data = (bits ^ 0x5412) >> 10; // undo mask; top 5 bits = ecl(2) + mask(3)
  return data >> 3; // ecl bits
}

describe('generateQrMatrix', () => {
  it('produces a 21×21 matrix (version 1) for short input', () => {
    const matrix = generateQrMatrix('hi');
    expect(matrix.length).toBe(21);
    expect(matrix.every((row) => row.length === 21)).toBe(true);
  });

  it('places the three finder patterns at the corners', () => {
    const matrix = generateQrMatrix('deckforge');
    const size = matrix.length;
    assertFinderAt(matrix, 0, 0);
    assertFinderAt(matrix, 0, size - 7);
    assertFinderAt(matrix, size - 7, 0);
  });

  it('draws the alternating timing patterns', () => {
    const matrix = generateQrMatrix('deckforge');
    const size = matrix.length;
    for (let i = 8; i < size - 8; i++) {
      expect(matrix[6][i]).toBe(i % 2 === 0);
      expect(matrix[i][6]).toBe(i % 2 === 0);
    }
  });

  it('sets the mandatory dark module', () => {
    const matrix = generateQrMatrix('x');
    expect(matrix[matrix.length - 8][8]).toBe(true);
  });

  it('encodes error-correction level L into the format bits', () => {
    const matrix = generateQrMatrix('level-check');
    expect(readFormatEcBits(matrix)).toBe(0b01); // level L
  });

  it('grows to a larger version as the payload grows', () => {
    const small = generateQrMatrix('short');
    const large = generateQrMatrix('x'.repeat(400));
    expect(large.length).toBeGreaterThan(small.length);
    // Every QR version side length is of the form 4v + 17 (odd).
    expect((large.length - 17) % 4).toBe(0);
  });

  it('is deterministic for the same input', () => {
    expect(generateQrMatrix('repeat-me')).toEqual(generateQrMatrix('repeat-me'));
  });

  it('throws when the payload exceeds version-40 capacity', () => {
    expect(() => generateQrMatrix('a'.repeat(5000))).toThrow('QrCapacityExceeded');
  });
});
