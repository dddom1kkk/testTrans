document.addEventListener('DOMContentLoaded', () => {
  let mediaRecorder;
  let audioChunks = [];

const apiKey = 'LNI8R9zMx6-Z_yx41-9D2wuAJxk2I_IAafgIhWFbycWW';
const url = 'https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/857622cd-52d5-49eb-b441-155b56ba1154'; //

const startRecordingButton = document.getElementById('startRecording');
      const stopRecordingButton = document.getElementById('stopRecording');
      const transcriptionOutput = document.getElementById('transcription');

      startRecordingButton.addEventListener('click', startRecording);
      stopRecordingButton.addEventListener('click', stopRecording);

      async function startRecording() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);

        // audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {

          console.log('Audio chunks length:', audioChunks.length);
          console.log('Audio chunks:', audioChunks);

          if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: audioChunks[0].type });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.' + audioBlob.type.split('/')[1]);

          sendToSpeechToText(formData);
          }else {
            console.warn('No audio data captured.');
          }
        };

        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;

        mediaRecorder.start();
      }

      function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }

        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;
      }

      async function sendToSpeechToText(formData) {
        try {
          const response = await fetch(`${url}/v1/recognitions`, {
            method: 'POST',
            headers: {
              'Authorization': `apikey:${apiKey}`
            },
            body: formData
          });

          if (!response.ok) {
            console.error('Error from IBM Watson API:', response.statusText);
      const data = await response.json(); // Log additional information
      console.log('Additional information from IBM Watson API:', data);
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log(data);

          // Display the transcription in your UI
          transcriptionOutput.textContent = data.results[0].alternatives[0].transcript;
        } catch (error) {
          console.error('There was a problem with the fetch operation:', error);
        }
      }
});


// fetch(`${url}/v1/recognitions`, {
//   method: 'POST',
//   // mode: 'cors',
//   headers: {
//     // 'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
//     // 'Content-Type': 'audio/l16',
//     'Content-Type': 'audio/l16',
//     'Authorization': 'Basic ' + btoa('apikey:LNI8R9zMx6-Z_yx41-9D2wuAJxk2I_IAafgIhWFbycWW')
//   }
// })
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log(data);
//   })
//   .catch(error => {
//     console.error('There was a problem with the fetch operation:', error);
//   });
