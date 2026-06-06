import { describe, it, expect } from 'vitest';
import { getFileIcon, validateFiles, shortId } from '../utils/files.js';

describe('getFileIcon', () => {
  it('returns image icon for image types', () => {
    expect(getFileIcon({ name: 'photo.jpg', type: 'image/jpeg' })).toBe('🖼');
  });
  it('returns video icon for video types', () => {
    expect(getFileIcon({ name: 'movie.mp4', type: 'video/mp4' })).toBe('🎬');
  });
  it('returns PDF icon', () => {
    expect(getFileIcon({ name: 'doc.pdf', type: 'application/pdf' })).toBe('📄');
  });
  it('returns zip icon', () => {
    expect(getFileIcon({ name: 'archive.zip', type: 'application/zip' })).toBe('📦');
  });
  it('falls back to folder icon', () => {
    expect(getFileIcon({ name: 'unknown.xyz', type: '' })).toBe('📁');
  });
});

describe('validateFiles', () => {
  it('returns no errors for valid files', () => {
    const files = [
      { name: 'test.txt', size: 1024 },
      { name: 'image.png', size: 512 * 1024 },
    ];
    expect(validateFiles(files)).toHaveLength(0);
  });

  it('flags empty files', () => {
    const files = [{ name: 'empty.txt', size: 0 }];
    const errors = validateFiles(files);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('empty.txt');
  });
});

describe('shortId', () => {
  it('returns 8 uppercase chars from a UUID', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const short = shortId(id);
    expect(short).toHaveLength(8);
    expect(short).toBe(short.toUpperCase());
  });

  it('handles null', () => {
    expect(shortId(null)).toBe('--------');
  });
});
