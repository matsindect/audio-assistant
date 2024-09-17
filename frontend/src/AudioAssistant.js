import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import AudioRecorder from "./components/AudioRecorder";
import TranscriptBox from "./components/TranscriptBox";
 
const theme = createTheme();
 
const AudioAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [editableTranscript, setEditableTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mode, setMode] = useState("transcribe"); // Mode: 'transcribe' or 'audio'
  const [assistanceResponse, setAassistanceResponse] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  
  const recognitionRef = useRef(null);
 
  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
 
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
 
    recognitionRef.current.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setTranscript(currentTranscript);
      setEditableTranscript(currentTranscript);
    };
 
    recognitionRef.current.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
 
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
 
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  /**
   * Custom hook for handling file drop using `useDropzone`.
   * 
   * @constant
   * @type {Object}
   * @property {Function} getRootProps - Function to get root props for the dropzone.
   * @property {Function} getInputProps - Function to get input props for the dropzone.
   * @property {boolean} isDragActive - Boolean indicating if a file is being dragged over the dropzone.
   * 
   * @param {Object} options - Options for the dropzone.
   * @param {string} options.accept - Specifies the file types to accept (e.g., 'application/pdf').
   * @param {number} options.maxFiles - Maximum number of files to accept.
   * @param {Function} options.onDrop - Callback function to handle file drop.
   * @param {Array} options.onDrop.acceptedFiles - Array of accepted files.
   * @param {Array} options.onDrop.rejectedFiles - Array of rejected files.
   * 
   * @returns {Object} - Returns an object containing `getRootProps`, `getInputProps`, and `isDragActive`.
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: 'application/pdf', // Specify the file types you accept
    maxFiles: 1, // Only allow 1 file
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (acceptedFiles.length > 0) {
        setFiles(acceptedFiles);
      
      } else if (rejectedFiles.length > 0) {
        setError("Please upload a valid PDF file.");
        setSuccess(false);
      }
    }
  });

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setEditableTranscript("");
      setResponse("");
      setError(null);
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };
 
  const handleSubmit = async() => {
    setResponse(`You said: ${editableTranscript}`);
    setIsListening(false);
    recognitionRef.current.stop();
    try {
      const response = await axios.post('http://localhost:8082/api/v1/ask', {question:editableTranscript}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setAassistanceResponse(response.data?.answer)
      console.log('Audio uploaded successfully:', response);
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };
 
  /**
   * Handles the file drop event and uploads the selected file to the server.
   * 
   * This function checks if any files are selected. If no files are selected, it sets an error message.
   * If a file is selected, it creates a FormData object and appends the file to it.
   * Then, it sends a POST request to the server with the file data.
   * 
   * On successful upload, it sets a success message and logs the response data.
   * On failure, it sets an upload error message.
   * 
   * @async
   * @function handleDropFiles
   * @returns {Promise<void>} A promise that resolves when the file upload is complete.
   */
  const handleDropFiles = async () => {
    if (files.length === 0) {
      setError("No file selected!");
      return;
    }
    
    const formData = new FormData();
    formData.append('document', files[0]);
 
    try {
      const response = await axios.post('http://localhost:8082/api/v1/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(response.data?.message);
      setUploadError(null);
      console.log(response.data); // Handle the response accordingly
    } catch (err) {
      setUploadError('File upload failed.');
      setSuccess(null);
    }
  };
 
  const handleTranscriptChange = (event) => {
    setEditableTranscript(event.target.value);
  };
  // Handle radio button change to switch between transcribing and audio recording
  const handleModeChange = (event) => {
    setMode(event.target.value);
    setResponse(""); // Clear response when switching modes
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Card sx={{ maxWidth: 400, width: "100%" }}>
        <CardContent>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed grey',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 2,
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography>Drop the files here...</Typography>
          ) : (
            <Typography>
              Drag 'n' drop a PDF file here, or click to select one and start asking questions.
            </Typography>
          )}
        </Box>
 
        {files.length > 0 && (
          <Box>
            <Typography variant="body1">
              Selected file: {files[0].name}
            </Typography>
          </Box>
        )}
 
        <Button
          variant="contained"
          fullWidth
          color="primary"
          onClick={handleDropFiles}
          disabled={files.length === 0}
        >
          Upload File
        </Button>
        {success && <Alert severity="success">{success}</Alert>}
        {uploadError && <Alert severity="error">{uploadError}</Alert>}
        </CardContent>
          
        <CardContent><FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Select Mode</FormLabel>
            <RadioGroup
              row
              aria-label="mode"
              name="mode"
              value={mode}
              onChange={handleModeChange}
            >
              <FormControlLabel
                value="transcribe"
                control={<Radio />}
                label="Transcribe Speech"
              />
              <FormControlLabel
                value="audio"
                control={<Radio />}
                label="Record Audio"
              />
            </RadioGroup>
          </FormControl>
          </CardContent>
          {mode === "transcribe" ? (
            <CardContent>
              <Typography
                variant="h4"
                component="div"
                gutterBottom
                align="center"
              >
                Audio Assistant
              </Typography>
 
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isListening ? <MicOffIcon /> : <MicIcon />}
                  onClick={toggleListening}
                  color={isListening ? "secondary" : "primary"}
                >
                  {isListening ? "Stop Listening" : "Start Listening"}
                </Button>
 
                {error && <Alert severity="error">{error}</Alert>}
 
                <TranscriptBox
                  transcript={editableTranscript}
                  onChange={handleTranscriptChange}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!editableTranscript}
                >
                  Submit
                </Button>
               
                  <Box sx={{ bgcolor: "primary.light", p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Assistant response:
                    </Typography>
                    <Typography>{assistanceResponse || "Waiting for input..."}</Typography>
                  </Box>
          
              </Box>
            </CardContent>
          ) : (
            <AudioRecorder />
          )}
         
        </Card>
      </Box>
    </ThemeProvider>
  );
};
 
export default AudioAssistant;
