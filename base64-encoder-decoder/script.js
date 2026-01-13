const tabEncoder = document.getElementById('tabEncoder');
const tabDecoder = document.getElementById('tabDecoder');
const encoderSection = document.getElementById('encoderSection');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const output = document.getElementById('output');
const fileNameDisplay = document.getElementById('fileName');

const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

const previewContainer = document.getElementById('previewContainer');
const previewLabel = document.getElementById('previewLabel');
const mediaViewer = document.getElementById('mediaViewer');

tabEncoder.addEventListener('click', () => switchMode('encode'));
tabDecoder.addEventListener('click', () => switchMode('decode'));

function switchMode(mode) {
    if (mode === 'encode') {
        tabEncoder.classList.add('active');
        tabDecoder.classList.remove('active');

        encoderSection.classList.remove('hidden');
        copyBtn.classList.remove('hidden');
        output.placeholder = "Base64 encoded output will appear here.";
    } else {
        tabDecoder.classList.add('active');
        tabEncoder.classList.remove('active');

        encoderSection.classList.add('hidden');
        copyBtn.classList.add('hidden');
        output.placeholder = "Paste in your Base64 string to decode and preview.";
    }
    resetUI();
}

function resetUI() {
    output.value = "";
    fileNameDisplay.textContent = "";
    fileInput.value = "";
    previewContainer.classList.add('hidden');
    mediaViewer.innerHTML = "";
}

let debounceTimer;
output.addEventListener('input', () => {
    if (!tabDecoder.classList.contains('active')) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const text = output.value.trim();
        if (text.length > 0) {
            decodeAndPreview(text);
        } else {
            previewContainer.classList.add('hidden');
        }
    }, 300);
});

document.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            e.preventDefault();
            const file = items[i].getAsFile();
            switchMode('encode');
            processFile(file);
            return;
        }
    }
});

async function decodeAndPreview(base64Str) {
    try {
        const clearStr = base64Str.replace(/^data:.*;base64,/, '');

        const binaryStr = window.atob(clearStr);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) { 
            bytes[i] = binaryStr.charCodeAt(i);
        }

        const header = Array.from(bytes.slice(0, 12)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
        const typeInfo = getFileType(header);
        
        previewContainer.classList.remove('hidden');
        mediaViewer.innerHTML = "";

        const sizeStr = formatSize(bytes.length);
        previewContainer.classList.remove('hidden');
        previewLabel.innerHTML = `
            Detected: <strong style="color: #2196F3">${typeInfo.ext.toUpperCase()}</strong>
            <span style="color: #555; font-size: 0.9em; margin-left: 10px;">(${sizeStr})</span>
        `;

        const blob = new Blob([bytes], {type: typeInfo.mime});
        const url = URL.createObjectURL(blob);

        if (typeInfo.mime.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = url;
            mediaViewer.appendChild(img);
        } else if (typeInfo.mime.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = url;
            video.controls = true;
            mediaViewer.appendChild(video);
        } else if (typeInfo.mime.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.src = url;
            audio.controls = true;
            mediaViewer.appendChild(audio);
        } else {
            const msg = document.createElement('p');
            msg.innerText = "Preview not available for this file type.";
            msg.style.color = "#888";
            mediaViewer.appendChild(msg);
        }

        const dLink = document.createElement('a');
        dLink.href = url;
        dLink.download = `decode.${typeInfo.ext}`;
        dLink.innerText = "Download File";
        dLink.style.display = "block";
        dLink.style.width = "fit-content";
        dLink.style.margin = "20px auto 0 auto";
        mediaViewer.appendChild(dLink);
    } catch (e) {
        previewContainer.classList.add('hidden');
    }
}

function getFileType(header) {
    // images
    if (header.startsWith("89504E47")) return { ext: "png", mime: "image/png" };
    if (header.startsWith("FFD8FF")) return { ext: "jpg", mime: "image/jpeg" };
    if (header.startsWith("47494638")) return { ext: "gif", mime: "image/gif" };
    if (header.startsWith("424D")) return { ext: "bmp", mime: "image/bmp" };
    if (header.startsWith("00000100")) return { ext: "ico", mime: "image/x-icon" };

    // audio / video
    if (header.startsWith("494433") || header.startsWith("FFFB")) return { ext: "mp3", mime: "audio/mpeg" };
    if (header.startsWith("4F676753")) return { ext: "ogg", mime: "audio/ogg" };
    if (header.includes("66747970")) return { ext: "mp4", mime: "video/mp4" };
    if (header.startsWith("1A45DFA3")) return { ext: "mkv", mime: "video/x-matroska" };

    // (wav, avi, webp)
    if (header.startsWith("52494646")) {
        const format = header.substring(16, 24);
        if (format === "57415645") return { ext: "wav", mime: "audio/wav" };
        if (format === "41564920") return { ext: "avi", mime: "video/x-msvideo" };
        if (format === "57454250") return { ext: "webp", mime: "image/webp" };
        return { ext: "wav", mime: "audio/wav" }; // Default guess
    }

    // docs / exe
    if (header.startsWith("25504446")) return { ext: "pdf", mime: "application/pdf" };
    if (header.startsWith("504B0304")) return { ext: "zip", mime: "application/zip" };
    if (header.startsWith("4D5A")) return { ext: "exe", mime: "application/x-msdownload" };

    // unknow
    return { ext: "bin", mime: "application/octet-stream" };
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {e.preventDefault(); dropZone.classList.add('dragover');});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) processFile(fileInput.files[0]);
});

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function processFile(file) {
    fileNameDisplay.textContent = file.name;
    const size = document.getElementById('fileSize');
    if(size) size.textContent = `(${formatSize(file.size)})`;
    const reader = new FileReader();
    reader.onload = function(e) {
        const rawData = e.target.result;
        output.value = rawData.split(',')[1];
    };
    reader.readAsDataURL(file);
}

copyBtn.addEventListener('click', async () => {
    if (!output.value || copyBtn.innerText === "Copied!") return;

    try {
        await navigator.clipboard.writeText(output.value);
        const originalText = "Copy to Clipboard";
        copyBtn.innerText = "Copied!";
        copyBtn.style.backgroundColor = "#096e3c";
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.backgroundColor = "";
        }, 500);
    } catch (err) {
        alert("Failed to copy to clipboard, maybe check your permissions or do it manually.")
    }
});

clearBtn.addEventListener('click', resetUI);

