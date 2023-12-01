function showSettings() {

  var settings = document.getElementById("edit");

  console.log(settings.style.display)
  
  if (settings.style.display == "none" || settings.style.display.length == 0)
    settings.style.display = "block";
  else
    settings.style.display = "none";

}

const socket = io.connect('https://dent-torpid-slug.glitch.me');

// Listener for receiving transcribed text from the server
socket.on('transcription', (transcribedText) => {
    document.getElementById('textOutput').innerText = transcribedText;
});

// (Optional) Listener for transcription errors
socket.on('transcriptionError', (error) => {
    console.error('Transcription error:', error);
    document.getElementById('textOutput').innerText = 'Error: ' + error.message;
});

let audioContext;
let mediaStream;
let isRecording = false;
let audioWorkletNode;
let audioDataBuffer = [];

document.getElementById('recordButton').addEventListener('click', toggleRecording);

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support audio input');
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      audioContext = new AudioContext();
      mediaStream = stream;

      audioContext.audioWorklet.addModule('audio-processor.js').then(() => {
          const mediaStreamSource = audioContext.createMediaStreamSource(stream);
          audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');

          mediaStreamSource.connect(audioWorkletNode);
          // audioWorkletNode.connect(audioContext.destination);

          audioWorkletNode.port.onmessage = (event) => {
            processAudio(event.data);
          };

          // If you need to send data back from the processor
          // audioWorkletNode.port.onmessage = (event) => { ... };

          updateUIForRecording(true);
      });
  })
  .catch(error => {
      console.error('Error accessing media devices.', error);
  });
}

function stopRecording() {

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  if (audioContext) {
    audioContext.close();
  }
  if (audioWorkletNode) {
    audioWorkletNode.disconnect();
  }

  if (audioDataBuffer.length > 0) {
      const combinedData = combineAudioData(audioDataBuffer);
      const convertedData = convertTo16BitPCM(combinedData);
      socket.emit('audioData', convertedData);
      audioDataBuffer = []; // Reset the buffer
  }

  updateUIForRecording(false);
}

function processAudio(audioData) {

  audioDataBuffer.push(new Float32Array(audioData));

}

function combineAudioData(bufferArray) {

  let totalLength = bufferArray.reduce((acc, val) => acc + val.length, 0);
  let result = new Float32Array(totalLength);
  let offset = 0;
  for (let data of bufferArray) {
      result.set(data, offset);
      offset += data.length;
  }
  return result;

}

function convertTo16BitPCM(float32Array) {
  let pcmData = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcmData.buffer;
}

function updateUIForRecording(isRecordingNow) {
  const recordButton = document.getElementById('recordButton');
  if (isRecordingNow) {
    recordButton.innerText = 'Stop Recording';
    isRecording = true;
  } else {
    recordButton.innerText = 'Start Recording';
    isRecording = false;
  }
}