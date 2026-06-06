import { useState, useRef, useCallback } from 'react';
import styles from './DropZone.module.css';

export function DropZone({ onFiles, disabled = false, children }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleFiles = useCallback((fileList) => {
    if (disabled || !fileList?.length) return;
    onFiles(Array.from(fileList));
  }, [onFiles, disabled]);

  const onDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items?.length) setDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Drop files here or click to browse"
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className={styles.hiddenInput}
        onChange={(e) => handleFiles(e.target.files)}
        tabIndex={-1}
        aria-hidden="true"
      />
      {children || (
        <div className={styles.defaultContent}>
          <div className={styles.icon}>
            <UploadIcon />
          </div>
          <p className={styles.primary}>Drop files here</p>
          <p className={styles.secondary}>or click to browse · Any file type · Any size</p>
        </div>
      )}
      {dragging && <div className={styles.overlay}><span>Release to add files</span></div>}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
