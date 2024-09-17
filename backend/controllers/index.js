import OpenAIApi from "openai";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
// In-memory storage for our vector store
let vectorStore = null;
// Set up OpenAI API
const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});

/**
 * An array of supported audio formats.
 * 
 * @constant {string[]}
 * @default
 * @example
 * // Example usage:
 * if (supportedFormats.includes(fileExtension)) {
 *   console.log("Format is supported.");
 * }
 */
const supportedFormats = [
  "flac",
  "m4a",
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "oga",
  "ogg",
  "wav",
  "webm",
];

/**
 * Handles the upload and transcription of an audio file.
 * 
 * This function processes an uploaded audio file, checks if the file format is supported,
 * sends the file to OpenAI Whisper for transcription, and attaches the transcription text
 * to the request body. If the file format is unsupported or an error occurs during processing,
 * appropriate error responses are sent.
 * 
 * @param {Object} req - The request object.
 * @param {Object} req.file - The uploaded file object.
 * @param {string} req.file.path - The path to the uploaded file.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * 
 * @returns {void}
 * 
 * @throws {Error} If an error occurs during transcription.
 */
export const uploadAndTrinscribe = async (req, res, next) => {
  const audioFilePath = req.file.path;

  try {
    const fileExtension = path.extname(audioFilePath).toLowerCase().slice(1);

    if (!supportedFormats.includes(fileExtension)) {
      fs.unlinkSync(audioFilePath); // Remove unsupported file
      return res
        .status(400)
        .json({
          error: `Unsupported file format. Supported formats are: ${supportedFormats.join(
            ", "
          )}`,
        });
    }

    // Create a read stream from the audio file
    const audioFile = fs.createReadStream(audioFilePath);

    // Send audio file to OpenAI Whisper for transcription
    const transcriptResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    const transcript = transcriptResponse.text;

    fs.unlinkSync(audioFilePath); // Remove file after processing
    req.body.question = transcript;
    next();
  } catch (error) {
    console.error("Error in transcription:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles answering questions based on uploaded documents.
 *
 * @async
 * @function answerQuestions
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.question - The question to be answered.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} Sends a JSON response with the answer or an error message.
 */
export const answerQuestions = async (req, res) => {
  const { question } = req.body;

  if (!vectorStore) {
    return res.status(400).json({ error: "No documents uploaded yet." });
  }

  try {
    // Initialize the OpenAI model
    const llm = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY });
    // Define a prompt template
    const prompt = ChatPromptTemplate.fromTemplate(
      `Answer the user's question: {input} based on the following context {context}`
    );

    // Create a chain to combine documents
    const combineDocsChain = await createStuffDocumentsChain({
      llm,
      prompt,
    });

    // Use the vector store's retriever method
    const retriever = vectorStore.asRetriever();

    // Create a retrieval chain for document retrieval
    const retrievalChain = await createRetrievalChain({
      combineDocsChain,
      retriever,
    });

    // Get the response from the chain
    const response = await retrievalChain.invoke({ input: question });
    res.json({ answer: response?.answer, question });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Uploads a document, processes its content, and stores it in a memory vector store.
 *
 * @async
 * @function uploadDocuments
 * @param {Object} req - The request object.
 * @param {Object} req.file - The uploaded file object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the document is processed and stored.
 * @throws {Error} - Throws an error if the document processing fails.
 *
 * uploadDocuments(req, res);
 */
export const uploadDocuments = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    // Embed the document text using OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    // Read the file content
    const buffer = fs.readFileSync(file.path);
    // Parse the PDF
    const pdfData = await pdfParse(buffer);

    // Get the text content
    const fileContent = pdfData.text;
    // Split the text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.createDocuments([fileContent]);

    // Store the documents in MemoryVectorStore
    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

    // Clean up the uploaded file
    fs.unlinkSync(file.path);

    res.json({ message: "Document uploaded and stored successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your document" });
  }
};
