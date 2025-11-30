require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyAtIUv46begLcO2yR99RAFNwxBFfCzlqM8';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

async function testGeminiKey() {
  console.log('Testing Gemini API key...');
  console.log('API Key:', GEMINI_API_KEY.substring(0, 10) + '...');
  console.log('');

  // First, try to list available models
  try {
    console.log('Step 1: Checking available models...');
    const modelsResponse = await axios.get(
      `${GEMINI_API_BASE}/models?key=${GEMINI_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const models = modelsResponse.data?.models || [];
    console.log(`✓ Found ${models.length} available models:`);
    models.slice(0, 5).forEach(model => {
      console.log(`  - ${model.name}`);
    });
    console.log('');

    // Find a suitable model for generateContent
    const generateContentModel = models.find(m => 
      m.name && (
        m.name.includes('gemini-2.5') ||
        m.name.includes('gemini-1.5') || 
        m.name.includes('gemini-pro') ||
        m.name.includes('gemini-1.0')
      ) && m.supportedGenerationMethods?.includes('generateContent')
    );

    if (generateContentModel) {
      console.log(`Found suitable model: ${generateContentModel.name}`);
      console.log('Supported methods:', generateContentModel.supportedGenerationMethods?.join(', ') || 'unknown');
    }
  } catch (listError) {
    console.log('⚠️  Could not list models (this is okay, continuing with test)...');
    if (listError.response?.status === 403) {
      console.log('   API key might not have permission to list models');
    }
    console.log('');
  }

  // Try different model names (with and without models/ prefix)
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-pro-preview-06-05',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-pro-latest',
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Making test request with model: ${modelName}...`);
      
      const response = await axios.post(
        `${GEMINI_API_BASE}/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: 'Say "Hello" in one word.',
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 50,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const candidate = response.data?.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text;
      const finishReason = candidate?.finishReason;
      
      if (content) {
        console.log('');
        console.log('✅ SUCCESS: Gemini API key is valid and working!');
        console.log(`Working model: ${modelName}`);
        console.log('Response:', content.trim());
        console.log(`Finish reason: ${finishReason}`);
        console.log('');
        console.log('The API key can be used to generate content.');
        return true;
      } else if (finishReason === 'MAX_TOKENS') {
        // Even if content is empty, MAX_TOKENS means it started responding
        console.log('');
        console.log('✅ SUCCESS: Gemini API key is valid and working!');
        console.log(`Working model: ${modelName}`);
        console.log('Note: Response was truncated (MAX_TOKENS), but API key is working');
        console.log('Usage:', JSON.stringify(response.data?.usageMetadata, null, 2));
        console.log('');
        console.log('The API key can be used to generate content.');
        return true;
      } else {
        console.log('⚠️  WARNING: API responded but no content in response');
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        continue; // Try next model
      }
    } catch (error) {
      // If it's a 404, try next model
      if (error.response?.status === 404) {
        console.log(`  ✗ Model ${modelName} not found (${error.response.data?.error?.message || '404'}), trying next...`);
        continue;
      }
      
      // If it's a 403, the API key is invalid
      if (error.response?.status === 403) {
        console.error('');
        console.error('❌ ERROR: API key is invalid or does not have permissions');
        console.error('HTTP Status: 403');
        console.error('Error:', error.response.data?.error?.message || 'Forbidden');
        console.error('');
        console.error('⚠️  This usually means:');
        console.error('   - API key is invalid or revoked');
        console.error('   - API key doesn\'t have required permissions');
        console.error('   - Gemini API is not enabled for this project');
        return false;
      }
      
      // For other errors, log and continue trying
      console.log(`  ✗ Error with ${modelName}: ${error.response?.status || error.message}`);
      continue;
    }
  }

  // If we get here, none of the models worked
  console.error('');
  console.error('❌ ERROR: None of the tested models worked');
  console.error('Tried models:', modelsToTry.join(', '));
  console.error('The API key might be invalid or the models are not available.');
  return false;
}

// Run the test
testGeminiKey()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
