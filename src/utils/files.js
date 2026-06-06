/**
 * Map a MIME type or extension to an icon label.
 */
export function getFileIcon(file) {
  const type = file.type || '';
  const name = file.name || '';
  const ext = name.split('.').pop()?.toLowerCase();

  if (type.startsWith('image/')) return '🖼';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type === 'application/pdf' || ext === 'pdf') return '📄';
  if (type === 'application/zip' || ext === 'zip' || ext === 'rar' || ext === '7z') return '📦';
  if (type.includes('word') || ext === 'docx' || ext === 'doc') return '📝';
  if (type.includes('sheet') || ext === 'xlsx' || ext === 'csv') return '📊';
  if (type.includes('presentation') || ext === 'pptx') return '📋';
  if (type.includes('javascript') || ['js','ts','jsx','tsx','py','go','rs','java','cpp','c'].includes(ext)) return '💻';
  if (type.includes('json') || ext === 'json') return '🔧';
  if (ext === 'svg') return '🎨';
  return '📁';
}

/**
 * Get a color for file type badge.
 */
export function getFileTypeColor(file) {
  const type = file.type || '';
  if (type.startsWith('image/')) return '#7c5cfc';
  if (type.startsWith('video/')) return '#f87171';
  if (type.startsWith('audio/')) return '#fbbf24';
  if (type === 'application/pdf') return '#f87171';
  if (type.includes('zip')) return '#fbbf24';
  return '#4f9eff';
}

/**
 * Validate files before queuing.
 */
export function validateFiles(files) {
  const errors = [];
  for (const file of files) {
    if (file.size === 0) errors.push(`${file.name}: empty file`);
    // No hard size limit — WebRTC handles any size via chunking
  }
  return errors;
}

/**
 * Trigger download of a blob.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Format a timestamp to human-readable.
 */
export function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Generate a unique short ID for display.
 */
export function shortId(id) {
  return id?.slice(0, 8).toUpperCase() ?? '--------';
}
