import { describe, it, expect } from 'vitest';
import { compressSDP, decompressSDP } from '../utils/qr.js';

describe('SDP compression', () => {
  const sampleSDP = JSON.stringify({
    type: 'offer',
    sdp: 'v=0\r\no=- 1234 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
  });

  it('compresses and decompresses losslessly', () => {
    const compressed = compressSDP(sampleSDP);
    const restored = decompressSDP(compressed);
    expect(restored).toBe(sampleSDP);
  });

  it('produces a string (base64)', () => {
    const compressed = compressSDP(sampleSDP);
    expect(typeof compressed).toBe('string');
    expect(compressed.length).toBeGreaterThan(0);
  });

  it('decompressed result is valid JSON', () => {
    const compressed = compressSDP(sampleSDP);
    const restored = decompressSDP(compressed);
    expect(() => JSON.parse(restored)).not.toThrow();
  });
});
