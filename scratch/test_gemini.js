const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testKey() {
  const apiKey = process.env.GOOGLE_API_KEY;
  console.log("Testing API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");
  
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY is not set in environment");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    const result = await model.generateContent("Hello, are you working?");
    console.log("✅ API is working! Response:", result.response.text());
  } catch (err) {
    console.error("❌ API failed:", err.message);
  }
}

testKey();
