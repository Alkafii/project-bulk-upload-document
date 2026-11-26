const formatSize = (s) => s < 1048576
    ? (s / 1024).toFixed(1) + " KB"
    : (s / 1048576).toFixed(2) + " MB";

const getTotalSize = () => selected.reduce(
    (total, item) => total + item.file.size,
    0
);




function checkDuplicates() {
    // Nama dokumen boleh sama.
    // Tombol preview hanya bergantung pada jumlah file dan status upload.
    btnPreview.disabled = selected.length === 0 || isUploading;
}




if (selected.length === 0) return;





