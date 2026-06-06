import { describe, it, expect } from 'vitest';
import { sha256Buffer, bufToHex, formatBytes, formatSpeed, formatETA } from '../utils/crypto.js';

describe('sha256Buffer', () => {
  it('produces a 64-char hex string', async () => {
    const buf = new TextEncoder().encode('hello world').buffer;
    const hash = await sha256Buffer(buf);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('produces consistent hashes', async () => {
    const buf = new TextEncoder().encode('beamit').buffer;
    const h1 = await sha256Buffer(buf);
    const h2 = await sha256Buffer(buf);
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different inputs', async () => {
    const buf1 = new TextEncoder().encode('file1').buffer;
    const buf2 = new TextEncoder().encode('file2').buffer;
    const h1 = await sha256Buffer(buf1);
    const h2 = await sha256Buffer(buf2);
    expect(h1).not.toBe(h2);
  });

  it('handles empty buffer', async () => {
    const buf = new ArrayBuffer(0);
    const hash = await sha256Buffer(buf);
    // SHA-256 of empty string is known
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});

describe('bufToHex', () => {
  it('converts a buffer to lowercase hex', () => {
    const buf = new Uint8Array([0x00, 0xff, 0x1a, 0x2b]).buffer;
    expect(bufToHex(buf)).toBe('00ff1a2b');
  });
});

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });
  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });
  it('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('formatSpeed', () => {
  it('formats bytes per second', () => {
    expect(formatSpeed(1024)).toBe('1 KB/s');
  });
});

describe('formatETA', () => {
  it('formats seconds', () => {
    expect(formatETA(30)).toBe('30s');
  });
  it('formats minutes', () => {
    expect(formatETA(90)).toBe('1m 30s');
  });
  it('handles Infinity', () => {
    expect(formatETA(Infinity)).toBe('—');
  });
  it('handles negative', () => {
    expect(formatETA(-1)).toBe('—');
  });
});
