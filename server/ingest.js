const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/hf_transformers");
const { QdrantVectorStore } = require("@langchain/qdrant");
const fs = require("fs");
const path = require("path");

async function ingestFile(filePath, fileName) {
  try {
    let loader;
    const extension = path.extname(filePath).toLowerCase();

    if (extension === ".pdf") {
      loader = new PDFLoader(filePath);
    } else if (extension === ".txt") {
      loader = new TextLoader(filePath);
    } else {
      throw new Error("Unsupported file format. Please upload PDF or TXT.");
    }

    const docs = await loader.load();

    // Add metadata: page and source
    const processedDocs = docs.map((doc) => {
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          source: fileName,
          page: doc.metadata.loc?.pageNumber || 1,
        },
      };
    });

    // Chunking logic: RecursiveCharacterTextSplitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitDocuments(processedDocs);

    // Free Embeddings: HuggingFace Xenova/all-MiniLM-L6-v2
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });

    // Qdrant Setup
    const vectorStore = await QdrantVectorStore.fromDocuments(chunks, embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.COLLECTION_NAME || "notebooklm",
    });

    return {
      success: true,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error("Ingestion Error:", error);
    throw error;
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = { ingestFile };
