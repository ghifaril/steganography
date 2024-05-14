function textToBin(text) {
  const binary = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const charBin = charCode.toString(2).padStart(8, "0");
    binary.push(charBin);
  }
  return binary.join("");
}

function hideMessage() {
  const audioInput = document.getElementById("audioFile");
  const textInput = document.getElementById("message").value;

  if (audioInput.files.length === 0 || textInput.trim() === "") {
    alert("Silakan pilih file audio, masukkan pesan. ");
    return;
  }

  const audioFile = audioInput.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    const arrayBuffer = event.target.result;
    const audioData = new Uint8Array(arrayBuffer);

    const messageBin = textToBin(textInput);
    const messageLength = messageBin.length;

    if (messageLength + 32 > audioData.length) {
      alert("Pesan terlalu panjang untuk disembunyikan dalam audio ini.");
      return;
    }

    hideMessageInAudio(audioData, messageBin);

    const blob = new Blob([audioData], { type: "audio/wav" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "steg_audio.wav";
    downloadLink.textContent = "Unduh Audio dengan Pesan Tersembunyi";

    // Menambahkan link unduh ke dalam container
    const container = document.getElementById("downloadContainer");
    container.innerHTML = ""; // Membersihkan container sebelum menambahkan link baru
    container.appendChild(downloadLink);

    // Menambahkan output angka biner yang ringkas
    const binaryOutput = document.createElement("p");
    const binaryPreviewLength = 64; // Panjang data biner yang akan ditampilkan di awal dan akhir
    const binaryData = Array.from(audioData).map((byte) =>
      byte.toString(2).padStart(8, "0")
    );
    const binaryPreview =
      binaryData.slice(0, binaryPreviewLength).join(" ") +
      " ... " +
      binaryData.slice(-binaryPreviewLength).join(" ");
    binaryOutput.textContent = "Data Audio (Binary): " + binaryPreview;
    container.appendChild(binaryOutput);
  };

  reader.readAsArrayBuffer(audioFile);
}

function binToText(bin) {
  const text = [];
  for (let i = 0; i < bin.length; i += 8) {
    const byte = bin.substring(i, i + 8);
    const charCode = parseInt(byte, 2);
    text.push(String.fromCharCode(charCode));
  }
  return text.join("");
}

function hideMessageInAudio(audioData, messageBin) {
  const messageLength = messageBin.length;

  // Menyisipkan panjang pesan di awal audio
  for (let i = 0; i < 32; i++) {
    const bit = (messageLength >> i) & 1;
    audioData[i] = (audioData[i] & ~1) | bit;
  }

  // Menyisipkan pesan
  for (let i = 0; i < messageLength; i++) {
    const byteIndex = i + 32;
    const bit = messageBin[i];
    audioData[byteIndex] = (audioData[byteIndex] & ~1) | bit;
  }
}

function extractMessage() {
  const audioInput = document.getElementById("audioFile");

  if (audioInput.files.length === 0) {
    alert("Silakan pilih file audio dan masukkan password.");
    return;
  }

  const audioFile = audioInput.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    const arrayBuffer = event.target.result;
    const audioData = new Uint8Array(arrayBuffer);

    const extractedBin = extractMessageFromAudio(audioData);
    const extractedText = binToText(extractedBin);

    const resultElement = document.createElement("p");
    resultElement.textContent = "Pesan yang diekstrak: " + extractedText;
    resultElement.id = "extractedText";

    // Menambahkan hasil ekstraksi ke dalam container
    const container = document.getElementById("extractionContainer");
    container.innerHTML = ""; // Membersihkan container sebelum menambahkan hasil baru
    container.appendChild(resultElement);
  };

  reader.readAsArrayBuffer(audioFile);
}

function extractMessageFromAudio(audioData) {
  let messageLength = 0;

  // Mengambil panjang pesan dari 32 bit pertama
  for (let i = 0; i < 32; i++) {
    const bit = audioData[i] & 1;
    messageLength |= bit << i;
  }

  let extractedBin = "";
  for (let i = 32; i < messageLength + 32; i++) {
    const audioByte = audioData[i];
    const bit = audioByte & 1;
    extractedBin += bit;
  }

  return extractedBin;
}

function resetApp() {
  document.getElementById("audioFile").value = "";
  document.getElementById("message").value = "";
  const extractedTextElement = document.getElementById("extractedText");
  if (extractedTextElement) {
    extractedTextElement.remove();
  }

  const downloadLink = document.querySelector("a[href^='blob']");
  if (downloadLink) {
    downloadLink.remove();
  }

  // Menghapus isi dari kedua container
  document.getElementById("downloadContainer").innerHTML = "";
  document.getElementById("extractionContainer").innerHTML = "";
}
