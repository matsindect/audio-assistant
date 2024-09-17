import express from 'express';
import multer from 'multer';
import path from 'path'
import fs from "fs";
import { fileURLToPath } from 'url';
import {uploadAndTrinscribe, answerQuestions, uploadDocuments } from '../controllers/index.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..',  'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const router = express.Router();
/**
 * Configuration for multer disk storage.
 * 
 * @type {import('multer').StorageEngine}
 * 
 * @property {function} destination - Function to determine the destination directory for uploaded files.
 * @property {function} filename - Function to determine the filename for uploaded files.
 * 
 * @param {Object} req - The request object.
 * @param {Object} file - The file object.
 * @param {function} cb - Callback function to set the destination or filename.
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,  path.join(__dirname, '..',  'uploads'))
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  });
  
  /**
   * Filters uploaded files based on their extension.
   *
   * @param {Object} req - The request object.
   * @param {Object} file - The file object containing file details.
   * @param {Function} cb - The callback function to indicate whether the file is accepted or rejected.
   * @returns {void}
   *
   * @description
   * This function checks the file extension of the uploaded file against a list of supported formats.
   * If the file extension is supported, it calls the callback with `true`, otherwise it calls the callback
   * with an error indicating that the file format is unsupported.
   *
   * @example
   * const multer = require('multer');
   * const upload = multer({ fileFilter });
   *
   * app.post('/upload', upload.single('file'), (req, res) => {
   *   res.send('File uploaded successfully');
   * });
   */
  const fileFilter = (req, file, cb) => {
    const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm','pdf'];
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (supportedFormats.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'), false);
    }
  };

  /**
   * Middleware for handling file uploads using multer.
   * 
   * @constant {Object} upload - The multer instance configured with storage and fileFilter options.
   * @property {Object} storage - The storage configuration for multer.
   * @property {Function} fileFilter - The function to control which files are accepted.
   */
  const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
  });

/**
 * @route POST /proccess-audio
 * @group Audio - Operations related to audio processing
 * @summary Uploads an audio file, processes it, and transcribes the content.
 * @param {file} audio.formData.required - The audio file to be uploaded and processed.
 * @returns {object} 200 - An object containing the transcription and answers to questions.
 * @returns {Error} 400 - Bad request, unsupported file format or other errors.
 * @produces application/json
 * @consumes multipart/form-data
 * @security JWT
 * 
 * @description
 * This endpoint allows users to upload an audio file, which is then processed and transcribed.
 * The transcription is analyzed to answer any questions provided in the request.
 * 
 * @example
 * // Example usage:
 * const formData = new FormData();
 * formData.append('audio', audioFile);
 * 
 * fetch('/proccess-audio', {
 *   method: 'POST',
 *   body: formData,
 *   headers: {
 *     'Authorization': 'Bearer <token>'
 *   }
 * })
 * .then(response => response.json())
 * .then(data => console.log(data))
 * .catch(error => console.error('Error:', error));
 */
router.post('/proccess-audio',upload.single('audio'), uploadAndTrinscribe, answerQuestions);
/**
 * @api {post} /document Upload a document
 * @apiName UploadDocument
 * @apiGroup Document
 * 
 * @apiDescription This endpoint allows users to upload a single document. The document is expected to be sent as a file in the multipart/form-data format.
 * 
 * @apiParam {File} document The document file to be uploaded.
 * 
 * @apiSuccess {Object} response The response object.
 * @apiSuccess {String} response.message Success message.
 * @apiSuccess {Object} response.data Additional data related to the uploaded document.
 * 
 * @apiError {Object} error The error object.
 * @apiError {String} error.message Error message.
 * 
 * @apiExample {curl} Example usage:
 *     curl -X POST -F "document=@path/to/your/document.pdf" http://localhost:3000/document
 */
router.post('/document',upload.single('document'), uploadDocuments);
/**
 * @api {post} /ask Ask questions
 * @apiName AskQuestions
 * @apiGroup Questions
 * 
 * @apiDescription This endpoint allows users to ask questions about the content of the uploaded audio file.
 * 
 * @apiParam {String} questions The questions to be answered.
 * 
 * @apiSuccess {Object} response The response object.
 * @apiSuccess {String} response.message Success message.
 * @apiSuccess {Object} response.data Additional data related to the questions and answers.
 * 
 * @apiError {Object} error The error object.
 * @apiError {String} error.message Error message.
 * 
 * @apiExample {curl} Example usage:
 *     curl -X POST -d "questions=What is the main topic of the conversation?" http://localhost:3000/ask
 */
router.post('/ask', answerQuestions);

export default router;
