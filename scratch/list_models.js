const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_API_KEY is missing");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("Listing available models...");
    // Use the base fetch or the SDK if possible
    // The SDK v0.21.0 has a listModels method on the genAI object
    const models = await genAI.listModels();
    console.log("Available models:");
    models.models.forEach(m => {
      console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (err) {
    console.error("❌ Failed to list models:", err.message);
    
    // Try raw fetch if SDK fails
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available models (via fetch):");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("Raw response:", JSON.stringify(data));
        }
    } catch (fetchErr) {
        console.error("Raw fetch also failed:", fetchErr.message);
    }
  }
}

listModels();
