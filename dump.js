/* Drag and Drop Container */
.custom-file {
    position: relative;
    width: 100%;
    height: 130px;
}

/* File Input */
.custom-file .custom-file-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
}

/* Drag and Drop Area */
.custom-file .custom-file-label {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    border: 2px dashed #b8c2d1;
    border-radius: 8px;
    background-color: #f8faff;

    display: flex;
    align-items: center;
    justify-content: center;

    text-align: center;
    cursor: pointer;
    padding: 15px;
    color: #6c757d;
}

/* Hilangkan tombol Browse bawaan Bootstrap */
.custom-file-label::after {
    display: none;
}

/* Hover Effect */
.custom-file:hover .custom-file-label {
    border-color: #007bff;
    background-color: #f0f6ff;
}