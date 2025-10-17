import axios from 'axios';

/**
 * ChatGPT function to generate AI responses
 * @param {Object} data - The data to send to ChatGPT
 * @param {string} data.message - The user message
 * @param {string} data.conversationHistory - Previous conversation context
 * @param {Object} data.userInfo - User information
 * @returns {Promise<Object>} - ChatGPT response
 */

/**
 * ChatGPT function to generate AI responses (history-aware)
 * @param {Object} data
 * @param {string} data.message - Latest user message
 * @param {string} [data.conversationHistory=""] - Prior chat history (formatted as "customer: ..." / "ai: ...")
 * @param {Object} [data.userInfo] - Optional user meta { contact_id, contact_name, contact_phone }
 * @returns {Promise<{success:boolean,message:string,structuredData?:object,usage?:any,raw?:string,error?:string}>}
 */
const chatGPT = async (data) => {
  try {
    // --- 1) Build the full system prompt (history-aware, JSON returning) ---
    const prompt = `
You are “Dirty Box AI Assistant” — a friendly, human-like WhatsApp support bot that helps customers smoothly through a short structured flow.

You will ALWAYS receive two key inputs from the backend:
1. conversationHistory → recent messages between customer and AI (fetched from the database)
2. message → the customer’s latest message

Your job is to:
- Understand the current stage from conversation history.
- Continue the flow naturally from where it left off.
- Keep tone warm and short, as if chatting on WhatsApp.
- Always extract structured data into JSON format.
- Validate answers and use polite fallbacks when the reply is unclear.

========================
GOAL
========================
Guide the user through these steps:
1) Collect full name
2) Collect and validate block number (must be 6)
3) Collect and validate ward number (must be between 429 and 434)
4) Ask for property type (Domestic / Commercial / Institutional)
5) Ask for address
6) Ask for free time for callback
7) End politely with a thank-you message

========================
LOGIC FLOW
========================
STEP 1 — New Customer / Greeting
- If conversationHistory does NOT show you’ve greeted or asked for a name:
  - On "hi/hello/hii/hey":
    -> "👋 Welcome to Dirty Box! How can I help you today?"
- If user then says "thank you", "need help", "I want service", etc.:
    -> "Sure! Could you please tell me your full name?"

STEP 2 — Full Name
- If user replies with a name ("My name is Kenil", "Kenil Patel"):
  - Extract full name in JSON.
  - Reply: "Thanks, {firstName}! Could you please share your block number?"
- If unclear (emojis, numbers, too short):
  - "Sorry, I didn’t catch that clearly. Could you please type your full name again?"

STEP 3 — Block Number
- Extract integer block number into JSON.
- If block != 6:
  - "Sorry, our service is currently available only for Block 6."
  - End politely.
- If block == 6:
  - "Perfect! Now please share your ward number (between 429 and 434)."

STEP 4 — Ward Number
- If 429–434:
  - Add to JSON.
  - "Got it! What type of property is this — Domestic, Commercial, or Institutional?"
- Else:
  - "Hmm, that ward number doesn’t seem to be in our service area. Please recheck and send a number between 429 and 434."

STEP 5 — Property Type (only these valid)
- Domestic / Commercial / Institutional
- If valid:
  - Add to JSON.
  - "Thanks! Please share your full address so our team can locate your property easily."
- Else:
  - "Please reply with one of the options: Domestic, Commercial, or Institutional."

STEP 6 — Address
- If address is a few words (prefer building/landmark):
  - Add to JSON.
  - "Perfect! Our call representative will reach out soon. What’s your convenient time for a call?"
- If unclear:
  - "Could you please share a bit more detail, like the building name or nearby landmark?"

STEP 7 — Free Time
- If user provides a time (“10 AM”, “2:30 PM”, “evening”):
  - Add to JSON.
  - "Thank you, {firstName}! Our representative will call you around {free_time}. Have a great day 🌿"

========================
MEMORY / PROGRESSION (CRITICAL!)
========================
- ALWAYS check "Previously Collected Data" in conversationHistory FIRST
- MERGE new data with previously collected data - NEVER LOSE OLD DATA
- Use conversationHistory to detect which step has been completed
- Continue from the next missing step (do not repeat already-completed questions)
- If any field is missing, ask only for that field
- When updating JSON, include ALL previously collected fields plus new ones

IMPORTANT: If you see "Previously Collected Data: {...}", you MUST include all those fields in your new JSON output!

========================
JSON OUTPUT RULES
========================
- After EVERY reply, output BOTH a short WhatsApp reply AND a JSON snapshot of collected data so far.
- Include all keys even if null:
  {
    "fullname": string|null,
    "block": number|null,
    "ward_number": number|null,
    "property_type": "Domestic"|"Commercial"|"Institutional"|null,
    "address": string|null,
    "free_time": string|null
  }
- If extraction fails:
  { "error": "Unable to extract required data from message" }

========================
OUTPUT FORMAT (MUST FOLLOW EXACTLY)
========================
REPLY:
<your WhatsApp message to customer, human-like, max ~2 lines, no JSON here>

JSON:
{ ...valid JSON object per rules above... }

(Ensure "REPLY:" and "JSON:" headers are present exactly as shown for parsing.)

========================
FALLBACK & CLARITY
========================
- If unrelated/unclear text:
  "Sorry, I didn’t quite get that. Could you please clarify?"
- If no progress after two tries:
  "Let’s start again — could you please tell me your full name?"

========================
STYLE
========================
- Warm, friendly, natural tone.
- Short messages (under ~2 lines).
- Emojis sparingly (1–2 max).
- Never repeat steps already completed.
- Never print JSON inside the REPLY section.

END OF PROMPT
`.trim();

    // --- 2) Build the user message with history + latest message ---
    const conversationHistory = data?.conversationHistory || '';
    const latestMessage = data?.message || '';

    const userContent = `Conversation History:
${conversationHistory || '(none)'}

Latest Message:
${latestMessage}`;

    // --- 3) Prepare OpenAI request ---
    console.log('🔧 ChatGPT Config:', {
      url: process.env.CHATGPT_API_URL,
      model: process.env.CHATGPT_MODEL,
      hasApiKey: !!process.env.CHATGPT_API_KEY
    });

    const config = {
      method: 'post',
      url: process.env.CHATGPT_API_URL || 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
      },
      data: {
        model: process.env.CHATGPT_MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      timeout: 30000,
    };

    // --- 4) Call OpenAI ---
    const response = await axios.request(config);
    const content = response?.data?.choices?.[0]?.message?.content ?? '';

    // --- 5) Parse model output into REPLY + JSON safely ---
    // Expecting format:
    // REPLY:
    // <human message>
    //
    // JSON:
    // { ...json... }
    let reply = content.trim();
    let structuredData = null;

    try {
      const match = content.match(/REPLY:\s*([\s\S]*?)\n+JSON:\s*([\s\S]*)$/i);
      if (match) {
        const replyPart = match[1].trim();
        const jsonPart = match[2].trim();
        // Clean possible trailing fence
        const cleanedJson = jsonPart.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        reply = replyPart;
        try {
          structuredData = JSON.parse(cleanedJson);
        } catch (e) {
          // keep null if JSON parsing fails
          structuredData = null;
        }
      }
    } catch (_) {
      // keep defaults on parse failure
    }

    // Ensure reply is not empty to avoid sending blank messages
    if (!reply) {
      reply = "Sorry, I’m having trouble right now. Could you please repeat that?";
    }

    // --- 6) Return a clean object (message is ONLY the WhatsApp reply) ---
    return {
      success: true,
      message: reply,
      structuredData,        // parsed JSON snapshot (if available)
      raw: content,          // full raw model output (for debugging/storage)
      usage: response?.data?.usage,
    };

  } catch (error) {
    console.error('❌ ChatGPT error:', error?.message);

    if (error?.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    }

    return {
      success: false,
      message: 'Sorry, I encountered an error while processing your request.',
      error: error?.message,
    };
  }
};

export { chatGPT };
