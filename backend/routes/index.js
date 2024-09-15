import express from 'express';
import multer from 'multer';
import {uploadAndTrinscribe, answerQuestions, uploadDocuments } from '../controllers/index.js'

const router = express.Router();

// Use Multer for file upload
const upload = multer({ dest: 'uploads/' });

router.post('/proccess-audio',upload.single('audio'), uploadAndTrinscribe, answerQuestions);
router.post('/document',upload.single('document'), uploadDocuments);

export default router;