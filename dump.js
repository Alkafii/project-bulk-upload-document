
/* ==========================================
   6. UPLOAD DOCUMENT PAGE
   ========================================== */

.dropzone {
  position: relative;
  border: 2px dashed #9bb8df;
  border-radius: 12px;
  background-color: #f7faff;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropzone:hover,
.dropzone.drag {
  background-color: #eaf2ff;
  border-color: #2563eb;
}

.dropzone .btn {
  pointer-events: none;
}

.file-row {
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  padding: 14px;
  margin-bottom: 10px;
  background-color: #ffffff;
}

.file-name {
  font-size: 13px;
  color: #64748b;
  word-break: break-all;
}

.doc-name {
  width: 100%;
}

.remove-file {
  flex-shrink: 0;
}

#fileList {
  width: 100%;
}

#fileCount {
  font-size: 12px;
  padding: 6px 10px;
}

#submitBtn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 576px) {
  .dropzone {
    padding: 24px 12px;
  }

  .file-row {
    padding: 10px;
  }

  .file-row .d-flex {
    gap: 10px;
  }

  main.flex-fill {
    padding: 16px !important;
  }
}


<link rel="stylesheet" href="/style/style.css?v=2" />
