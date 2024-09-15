import React from 'react';
import { TextField, Box, Typography } from '@mui/material';

const TranscriptBox = ({ transcript, onChange }) => {
  return (
    <Box>
      <TextField
        label="You said:"
        multiline
        rows={4}
        value={transcript}
        onChange={(event) => onChange(event.target.value)}
        variant="outlined"
        fullWidth
      />
    </Box>
  );
};

export default TranscriptBox;
