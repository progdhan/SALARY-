/**
 * Fallback mock responses + expense parser when the Grok API is unavailable.
 * Ensures the demo always works, even without an API key.
 */

/* ── Category keyword map ── */
const CATEGORY_KEYWORDS = {
  Food: ['swiggy', 'zomato', 'food', 'restaurant', 'cafe', 'coffee', 'grocery', 'groceries', 'lunch', 'dinner', 'breakfast', 'eat', 'biryani', 'pizza', 'burger', 'chai', 'tea', 'dominos', 'mcdonalds', 'starbucks', 'kfc', 'mess'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'clothes', 'shoes', 'mall', 'meesho', 'nykaa'],
  Transport: ['uber', 'ola', 'rapido', 'auto', 'bus', 'metro', 'train', 'petrol', 'fuel', 'diesel', 'cab', 'taxi', 'transport', 'travel'],
  Entertainment: ['netflix', 'spotify', 'hotstar', 'movie', 'game', 'gaming', 'party', 'entertainment', 'prime', 'youtube', 'concert', 'disney'],
  Bills: ['electricity', 'water', 'gas', 'internet', 'wifi', 'phone', 'recharge', 'rent', 'bill', 'jio', 'airtel', 'vi', 'broadband'],
  Education: ['course', 'book', 'books', 'udemy', 'coursera', 'skill', 'tuition', 'education', 'class', 'coaching', 'exam'],
  Healthcare: ['doctor', 'medicine', 'pharmacy', 'hospital', 'health', 'medical', 'clinic', 'dental', 'eye'],
  Other: [],
};

/**
 * Categorise a description string.
 */
function categorise(description) {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Other') continue;
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'Other';
}

/**
 * Parse a natural-language expense string and return structured JSON.
 * Handles formats like:
 *   "300 swiggy, 150 uber, 500 amazon"
 *   "I spent ₹300 on Swiggy, ₹150 on Uber"
 *   "swiggy 300, uber 150"
 */
function parseExpenses(message) {
  const transactions = [];
  // Split on newlines, commas, or semicolons
  const lines = message.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Remove currency symbols and dashes for parsing
    const cleaned = line.replace(/[₹$]/g, '').replace(/\s*-\s*/g, ' ').trim();

    // Try: description amount (e.g. "Swiggy 350")
    let match = cleaned.match(/^([a-zA-Z][a-zA-Z\s]*?)\s+(\d+)\s*$/);
    if (match) {
      const desc = match[1].trim();
      const amount = parseInt(match[2], 10);
      if (desc && amount > 0 && !isNoise(desc)) {
        transactions.push({ description: capitalise(desc), amount, category: categorise(desc) });
        continue;
      }
    }

    // Try: amount description (e.g. "350 Swiggy")
    match = cleaned.match(/^(\d+)\s+(?:on\s+)?([a-zA-Z][a-zA-Z\s]*?)\s*$/);
    if (match) {
      const amount = parseInt(match[1], 10);
      const desc = match[2].trim();
      if (desc && amount > 0 && !isNoise(desc)) {
        transactions.push({ description: capitalise(desc), amount, category: categorise(desc) });
        continue;
      }
    }

    // Try: "I spent 300 on Swiggy" style
    match = cleaned.match(/(?:spent|paid)\s+(\d+)\s+(?:on\s+)?([a-zA-Z][a-zA-Z\s]*)/i);
    if (match) {
      const amount = parseInt(match[1], 10);
      const desc = match[2].trim();
      if (desc && amount > 0 && !isNoise(desc)) {
        transactions.push({ description: capitalise(desc), amount, category: categorise(desc) });
      }
    }
  }

  return transactions;
}

const NOISE_WORDS = new Set(['on', 'and', 'the', 'for', 'to', 'in', 'at', 'i', 'my', 'spent', 'rs', 'rupees', 'then', 'also', 'plus', 'with']);
function isNoise(desc) { return NOISE_WORDS.has(desc.toLowerCase()) || desc.length < 2; }
function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }


/* ── Static mock responses ── */
const mockResponses = {
  'what is sip': `**SIP (Systematic Investment Plan)** is a way to invest a fixed amount regularly — like a subscription for growing your money! 💰

**How it works:**
- You pick a mutual fund
- You set a fixed amount (e.g., ₹500/month)
- That amount is automatically invested every month

**Example:**
If you invest ₹1,000/month in a SIP with ~12% annual returns:
- After 5 years → ~₹82,000 (invested ₹60,000)
- After 10 years → ~₹2,32,000 (invested ₹1,20,000)

**Why it's great for beginners:**
- Start with as little as ₹100/month
- No need to time the market
- Builds investing discipline automatically
- Benefits from rupee cost averaging`,

  'what is emi': `**EMI (Equated Monthly Installment)** is a fixed monthly payment you make to repay a loan — part of it covers the principal, and part covers the interest.

**Simple example:**
You buy a phone worth ₹20,000 on EMI for 12 months at 15% interest:
- Monthly EMI ≈ ₹1,805
- Total paid = ₹21,660
- Extra cost (interest) = ₹1,660

**Key things to know:**
- **Lower EMI** = longer tenure = more total interest
- **Higher EMI** = shorter tenure = less total interest
- Always check the **total cost**, not just the monthly EMI
- Avoid EMIs for things that lose value quickly (like gadgets)

💡 **Tip:** If you can afford to buy something outright, avoid EMI — you'll save on interest!`,

  'what is inflation': `**Inflation** is when prices of things go up over time, which means your money buys less than before. 📈

**Real-world example:**
- In 2020, a plate of biryani cost ₹150
- In 2025, the same biryani costs ₹200
- Your ₹150 now buys less food — that's inflation!

**Why it matters for you:**
- If you keep ₹1,00,000 in a savings account earning 3.5% interest, but inflation is 6%, your money is actually **losing** 2.5% in real value every year
- This is why just saving isn't enough — you need to **invest** to beat inflation

**India's average inflation:** ~5-6% per year

💡 **Tip:** Always compare your investment returns against inflation. If your returns are below inflation, your money is shrinking in real terms!`,

  'how can i save more': `Here are **practical ways** to boost your savings:

**🎯 The 50/30/20 Rule:**
- **50%** of income → Needs (rent, food, bills)
- **30%** of income → Wants (entertainment, shopping)
- **20%** of income → Savings & investments

**Quick Wins:**
1. **Track every expense** for a week — you'll spot leaks immediately
2. **Cancel unused subscriptions** — check your bank statement now
3. **Cook more, order less** — saves ₹3,000-5,000/month easily
4. **Wait 24 hours** before any purchase over ₹500 — reduces impulse buying
5. **Automate savings** — set up auto-transfer on salary day

**The Latte Factor ☕:**
A ₹200 daily coffee = ₹6,000/month = ₹72,000/year. Small daily expenses add up fast!

💡 **Start small:** Even saving ₹100/day = ₹3,000/month = ₹36,000/year.`,

  'analyse my expenses': `I'd love to help analyse your expenses! 📊

**Share your expenses like this:**

"I spent ₹300 on Swiggy, ₹150 on Uber, ₹500 on Amazon, ₹200 on Netflix"

I'll automatically:
1. **Categorise** each expense (Food, Shopping, Transport, etc.)
2. **Calculate** your total spending
3. **Update your dashboard** with the new data
4. **Suggest** areas where you can cut back

Go ahead — paste your expenses and watch your dashboard update in real-time! 💡`,
};

/**
 * Find the best matching mock response for a user message.
 */
function getMockResponse(message) {
  const lower = message.toLowerCase().trim();

  // First: try to parse expenses from the message
  const transactions = parseExpenses(message);
  if (transactions.length > 0) {
    const total = transactions.reduce((s, t) => s + t.amount, 0);
    const byCategory = {};
    for (const t of transactions) {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
    const highestCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    const jsonBlock = JSON.stringify({ type: 'expense_analysis', transactions, total }, null, 2);

    return `I've categorised your expenses! Here's the breakdown:

\`\`\`json
${jsonBlock}
\`\`\`

**Summary:**
- **Total spent:** ₹${total.toLocaleString()}
- **${transactions.length} transactions** categorised
- **Highest category:** ${highestCat[0]} (₹${highestCat[1].toLocaleString()})

${highestCat[1] > total * 0.4 ? `⚠️ **${highestCat[0]}** makes up over 40% of this batch. Consider setting a weekly limit for this category.` : '✅ Your spending looks reasonably distributed across categories.'}

Your dashboard has been updated with these expenses! Check the **Dashboard** tab to see the changes. 📊`;
  }

  // Static keyword matches
  for (const [key, response] of Object.entries(mockResponses)) {
    if (lower.includes(key)) return response;
  }

  // Category fallbacks
  if (lower.includes('save') || lower.includes('saving') || lower.includes('budget')) return mockResponses['how can i save more'];
  if (lower.includes('expense') || lower.includes('spent') || lower.includes('spending')) return mockResponses['analyse my expenses'];
  if (lower.includes('invest') || lower.includes('mutual fund')) return mockResponses['what is sip'];
  if (lower.includes('loan') || lower.includes('credit')) return mockResponses['what is emi'];

  return null;
}

/**
 * Generic fallback when no keyword match is found.
 */
function getGenericFallback() {
  return `That's a great question! 🤔

I'm here to help you with:
- **Financial terms** — Ask me about SIP, EMI, inflation, compound interest, etc.
- **Expense analysis** — Share your expenses and I'll categorise them
- **Budgeting tips** — I can suggest ways to manage your money better
- **Saving strategies** — Learn practical ways to save more

Try asking something like:
- "What is SIP?"
- "How can I save more?"
- "I spent ₹300 on Swiggy, ₹200 on Uber, ₹500 on Amazon"

I'm your friendly finance buddy — no question is too basic! 💡`;
}

module.exports = { getMockResponse, getGenericFallback, parseExpensesFallback: parseExpenses };
