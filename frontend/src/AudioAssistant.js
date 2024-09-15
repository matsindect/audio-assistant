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
  const [mode, setMode] = useState("transcribe"); // Mode: 'transcribe' or 'audio'

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

  const handleSubmit = () => {
    setResponse(`You said: ${editableTranscript}`);
    setIsListening(false);
    recognitionRef.current.stop();
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
                
              </Box>
            </CardContent>
          ) : (
            <AudioRecorder />
          )}
          <CardContent>
          <Box sx={{ bgcolor: "primary.light", p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Assistant response:
                  </Typography>
                  <Typography>{response || "Waiting for input..."}</Typography>
                </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

export default AudioAssistant;
