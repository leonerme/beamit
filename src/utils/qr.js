import QRCode from 'qrcode';
import jsQR from 'jsqr';

/**
 * Generate a QR code as data URL from a string.
 * SDP strings can be large so we compress them.
 * @param {string} text
 * @returns {Promise<string>} data URL
 */
export async function generateQRCode(text) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'L', // Low EC to maximize data capacity
    margin: 2,
    width: 320,
    color: {
      dark: '#0d1117',
      light: '#f0f4ff',
    },
  });
}

/**
 * Scan a QR code from a canvas ImageData or video frame.
 * @param {ImageData} imageData
 * @returns {string|null} decoded text or null
 */
export function decodeQRFromImageData(imageData) {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });
  return result?.data ?? null;
}

/**
 * Compress SDP string for QR encoding (base64 + minimal cleanup).
 * @param {string} sdp JSON string
 * @returns {string}
 */
export function compressSDP(sdp) {
  // Already JSON — just encode as base64 to reduce QR complexity
  return btoa(sdp);
}

/**
 * Decompress SDP from base64.
 * @param {string} compressed
 * @returns {string}
 */
export function decompressSDP(compressed) {
  return atob(compressed);
}
