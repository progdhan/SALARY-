const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');
const { SYSTEM_PROMPT, TRANSACTION_ANALYSIS_PROMPT } = require('./prompts.cjs');
const { getMockResponse, getGenericFallback } = require('./fallback.cjs');

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ── Gemini client ── */
let genai = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

app.use(cors());
app.use(express.json());

/* ──────────────────────────────────────────────
 *  Helper: call Gemini for chat
 * ────────────────────────────────────────────── */
async function callGeminiChat(userMessage, conversationHistory) {
  if (!genai) return null;

  try {
    const history = conversationHistory.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    return response?.text || null;
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    return null;
  }
}

/* ──────────────────────────────────────────────
 *  Helper: call Gemini for transaction analysis
 * ────────────────────────────────────────────── */
async function callGeminiAnalysis(transactionText) {
  if (!genai) return null;

  try {
    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: transactionText }] },
      ],
      config: {
        systemInstruction: TRANSACTION_ANALYSIS_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    });

    const raw = response?.text || '';
    return parseGeminiJSON(raw);
  } catch (err) {
    console.error('Gemini analysis error:', err.message);
    return null;
  }
}

/* ──────────────────────────────────────────────
 *  Helper: safely extract JSON from Gemini output
 *  Handles raw JSON, markdown fences, extra text
 * ────────────────────────────────────────────── */
function parseGeminiJSON(raw) {
  // Try direct parse first
  try { return JSON.parse(raw.trim()); } catch { /* continue */ }

  // Strip markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }

  // Try to find first { ... } block
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch { /* continue */ }
  }

  return null;
}

/* ══════════════════════════════════════════════
 *  Routes
 * ══════════════════════════════════════════════ */

/**
 * POST /api/chat
 * Chat endpoint for the AI Assistant page.
 */
app.post('/api/chat', async (req, res) => {
  const { message, conversation = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Try Gemini
  const geminiReply = await callGeminiChat(message, conversation);
  if (geminiReply) {
    return res.json({ reply: geminiReply, source: 'gemini' });
  }

  // Fallback to mock
  const mockReply = getMockResponse(message) || getGenericFallback();
  return res.json({ reply: mockReply, source: 'fallback' });
});

/**
 * POST /api/transactions/analyze
 * Dedicated endpoint for structured transaction analysis.
 */
app.post('/api/transactions/analyze', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Please enter at least one transaction.' });
  }

  // Try Gemini analysis
  const geminiResult = await callGeminiAnalysis(text);

  if (geminiResult && Array.isArray(geminiResult.transactions) && geminiResult.transactions.length > 0) {
    // Validate & sanitise each transaction
    const cleaned = geminiResult.transactions
      .filter((t) => t.description && typeof t.amount === 'number' && t.amount > 0)
      .map((t) => ({
        description: String(t.description).trim(),
        amount: Math.round(t.amount),
        category: validateCategory(t.category),
      }));

    if (cleaned.length === 0) {
      return res.status(422).json({ error: 'Could not understand the transactions. Please check the format.' });
    }

    const totalAmount = cleaned.reduce((s, t) => s + t.amount, 0);
    const categoryTotals = {};
    for (const t of cleaned) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
    const highestSpendingCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0];

    return res.json({
      transactions: cleaned,
      totalAmount,
      categoryTotals,
      highestSpendingCategory,
      source: 'gemini',
    });
  }

  // Fallback: use the existing local parser
  const { parseExpensesFallback } = require('./fallback.cjs');
  const fallbackTxns = parseExpensesFallback(text);

  if (fallbackTxns.length === 0) {
    return res.status(422).json({ error: 'Unable to analyse transactions. Please try a different format.' });
  }

  const totalAmount = fallbackTxns.reduce((s, t) => s + t.amount, 0);
  const categoryTotals = {};
  for (const t of fallbackTxns) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  }
  const highestSpendingCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0];

  return res.json({
    transactions: fallbackTxns,
    totalAmount,
    categoryTotals,
    highestSpendingCategory,
    source: 'fallback',
  });
});

/**
 * GET /api/health
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(genai),
  });
});

/* ── Validate category against allowed list ── */
const ALLOWED_CATEGORIES = ['Food', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Education', 'Healthcare', 'Other'];
function validateCategory(cat) {
  if (!cat) return 'Other';
  const found = ALLOWED_CATEGORIES.find((c) => c.toLowerCase() === String(cat).toLowerCase());
  return found || 'Other';
}

app.listen(PORT, () => {
  console.log(`\n  Money Matters API running on http://localhost:${PORT}`);
  console.log(`  Gemini API: ${genai ? '✓ configured' : '✗ using fallback responses'}\n`);
});
