const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/hf_transformers");
const { ChatGroq } = require("@langchain/groq");
const { QdrantVectorStore } = require("@langchain/qdrant");

async function retrieveAndGenerate(question) {
  try {
    // Free Embeddings: HuggingFace Xenova/all-MiniLM-L6-v2 (must match ingestion)
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });

    // Connect to existing Qdrant collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: process.env.COLLECTION_NAME || "notebooklm",
    });

    // Retrieve top 5 most relevant chunks
    const results = await vectorStore.similaritySearch(question, 5);

    const context = results
      .map((doc) => `[Source: ${doc.metadata.source}, Page: ${doc.metadata.page}]\nContent: ${doc.pageContent}`)
      .join("\n\n");

    const sources = results.map((doc) => ({
      page: doc.metadata.page,
      source: doc.metadata.source,
      content: doc.pageContent.substring(0, 100) + "...",
    }));

    // Free LLM: Groq llama-3.1-8b-instant
    const llm = new ChatGroq({
      modelName: "llama-3.1-8b-instant",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are a document assistant. Answer the user's question using ONLY the context provided below. If the answer is not in the context, say 'I could not find this in the uploaded document.' Do not use any outside knowledge. Always mention the page number your answer comes from.

Context:
${context}`;

    const response = await llm.invoke([
      ["system", systemPrompt],
      ["user", question],
    ]);

    return {
      answer: response.content,
      sources: sources,
    };
  } catch (error) {
    console.error("Retrieval Error:", error);
    throw error;
  }
}

module.exports = { retrieveAndGenerate };
