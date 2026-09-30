const imageInput = document.getElementById('imageInput');
const dropzone = document.getElementById('dropzone');
const preview = document.getElementById('preview');
const dropTitle = document.getElementById('dropTitle');
const dropText = document.getElementById('dropText');
const claim = document.getElementById('claim');
const checkBtn = document.getElementById('checkBtn');
const progress = document.getElementById('progress');
const errorBox = document.getElementById('errorBox');

let selectedFile = null;

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}
function selectFile(file) {
  clearError();
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
    showError('Please choose a JPG, PNG, or WebP image.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showError('That image is larger than 5 MB. Please choose a smaller file.');
    return;
  }
  selectedFile = file;
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  dropTitle.textContent = file.name;
  dropText.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · ready to investigate`;
  dropzone.classList.add('has-file');
}
imageInput.addEventListener('change', () => selectFile(imageInput.files[0]));
['dragenter','dragover'].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault(); dropzone.classList.add('dragging');
}));
['dragleave','drop'].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault(); dropzone.classList.remove('dragging');
}));
dropzone.addEventListener('drop', e => selectFile(e.dataTransfer.files[0]));

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
}

checkBtn.addEventListener('click', async () => {
  clearError();
  if (!selectedFile) {
    showError('Choose an image first.');
    return;
  }
  checkBtn.disabled = true;
  progress.hidden = false;
  try {
    const image = await fileToBase64(selectedFile);
    const response = await fetch('/api/investigate', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        image,
        claim: claim.value.trim()
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id) throw new Error(data.error || 'Unable to start the investigation.');
    window.location.href = `report.html?id=${encodeURIComponent(data.id)}`;
  } catch (error) {
    showError(error.message || 'Something went wrong. Please try again.');
    checkBtn.disabled = false;
    progress.hidden = true;
  }
});