import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Button, Box, Typography, Card, CardContent } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import UploadIcon from '@mui/icons-material/Upload';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [assistanceResponse, setAassistanceResponse] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const [response, setResponse] = useState("");

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        audioChunks.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone: ', error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const response = await axios.post('http://localhost:8082/api/v1/proccess-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResponse(response.data?.question)
      setAassistanceResponse(response.data?.answer)
      console.log('Audio uploaded successfully:', response.data?.answer);
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  return (
   
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>
            Audio Recorder
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: "column", justifyContent: 'center', gap: 2 }}>
            {isRecording ? (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<StopIcon />}
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<MicIcon />}
                onClick={startRecording}
              >
                Start Recording
              </Button>
            )}
          </Box>

          {audioBlob && (
            <Box sx={{ mt: 4, textAlign: 'center', display: 'flex', flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">Recorded Audio:</Typography>
              <audio controls src={URL.createObjectURL(audioBlob)} style={{ marginTop: '10px', width:'100%'}} />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<UploadIcon />}
                sx={{ mt: 2 }}
                onClick={uploadAudio}
              >
                Upload Audio
              </Button>
            </Box>
          )}
           <CardContent>
           <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>You said:</Typography>
                <Typography>{response || 'Waiting for input...'}</Typography>
              </Box>
          <Box sx={{ bgcolor: "primary.light", p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Assistant response:
                  </Typography>
                  <Typography>{assistanceResponse || "Waiting for input..."}</Typography>
                </Box>
          </CardContent>
        </CardContent>
  );
};

export default AudioRecorder;
