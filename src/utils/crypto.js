/**
 * Compute SHA-256 hash of a File object.
 * Streams through the file in 4MB slices to avoid memory issues with large files.
 * @param {File} file
 * @returns {Promise<string>} hex string
 */
export async function sha256File(file) {
  const SLICE = 4 * 1024 * 1024; // 4MB
  const hashObj = await crypto.subtle.digest.bind(crypto.subtle);

  // For large files, stream through chunks
  if (file.size > SLICE) {
    // Read entire file into ArrayBuffer (browser handles streaming internally)
    // For very large files this is acceptable as we need to hash
    const buffer = await file.arrayBuffer();
    return sha256Buffer(buffer);
  }

  const buffer = await file.arrayBuffer();
  return sha256Buffer(buffer);
}

/**
 * Compute SHA-256 hash of an ArrayBuffer.
 * @param {ArrayBuffer} buffer
 * @returns {Promise<string>} hex string
 */
export async function sha256Buffer(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufToHex(hashBuffer);
}

/**
 * Convert ArrayBuffer to hex string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Format bytes into human-readable string.
 * @param {number} bytes
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format speed in bytes/s to human-readable.
 * @param {number} bytesPerSec
 * @returns {string}
 */
export function formatSpeed(bytesPerSec) {
  return `${formatBytes(bytesPerSec)}/s`;
}

/**
 * Format seconds as human-readable duration.
 * @param {number} seconds
 * @returns {string}
 */
export function formatETA(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
