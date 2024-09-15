import OpenAIApi from "openai";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
// In-memory storage for our vector store
let vectorStore = null
// Set up OpenAI API
const openai = new OpenAIApi({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

export const uploadAndTrinscribe = async (req, res, next) => {
  const audioFilePath = req.file.path;

  try {
    const audioFile = fs.readFileSync(audioFilePath);

    // Send audio file to OpenAI Whisper for transcription
    const transcriptResponse = await openai.createTranscription(
      audioFile,
      "whisper-1"
    );
    const transcript = transcriptResponse.data.text;

    fs.unlinkSync(audioFilePath); // Remove file after processing
    req.body.question = transcript;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    const response = await retrievalChain.call({ query: question });
    res.json({ answer: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    const fileContent = fs.readFileSync(file.path, "utf8");

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
