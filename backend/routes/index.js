import express from 'express';
import multer from 'multer';
import path from 'path'
import fs from "fs";
import { fileURLToPath } from 'url';
import {uploadAndTrinscribe, answerQuestions, uploadDocuments } from '../controllers/index.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  path.join(__dirname, '..',  'uploads'))
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  });
  
  const fileFilter = (req, file, cb) => {
    const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm','pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (supportedFormats.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'), false);
    }
  };
  // Use Multer for file upload
  const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
  });


router.post('/proccess-audio',upload.single('audio'), uploadAndTrinscribe, answerQuestions);
router.post('/document',upload.single('document'), uploadDocuments);
router.post('/ask', answerQuestions);

export default router;