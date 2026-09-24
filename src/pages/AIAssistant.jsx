import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

/* ── Suggested prompts ── */
const SUGGESTED_PROMPTS = [
  'What is SIP?',
  'What is EMI?',
  'What is inflation?',
  'How can I save more?',
  'I spent ₹300 on Swiggy, ₹150 on Uber, ₹500 on Amazon, ₹200 on Netflix',
];

/* ── Extract expense_analysis JSON from a response ── */
function extractExpenseData(text) {
  const fenceRegex = /```(?:json)?\s*\n?([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.type === 'expense_analysis' && Array.isArray(parsed.transactions)) {
        return parsed.transactions;
      }
    } catch { /* not valid JSON, skip */ }
  }
  return null;
}

/* ── Markdown-lite renderer ── */
function renderMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code / JSON blocks
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre key={elements.length}
          className="bg-surface-overlay rounded-lg p-3 my-2 overflow-x-auto text-xs leading-relaxed font-mono text-text-secondary border border-border-subtle">
          {lang && <span className="text-[10px] uppercase tracking-wider text-text-muted block mb-2">{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    if (!line.trim()) { elements.push(<div key={elements.length} className="h-2" />); i++; continue; }

    // Bullet points
    if (/^(\s*[-•*]|\s*\d+\.) /.test(line)) {
      const listItems = [];
      while (i < lines.length && /^(\s*[-•*]|\s*\d+\.) /.test(lines[i])) {
        const content = lines[i].replace(/^(\s*[-•*]|\s*\d+\.)\s*/, '');
        const indent = lines[i].match(/^\s*/)[0].length;
        listItems.push({ content, indent });
        i++;
      }
      elements.push(
        <ul key={elements.length} className="space-y-1 my-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm text-text-secondary"
              style={{ paddingLeft: `${Math.min(item.indent, 4) * 8}px` }}>
              <span className="text-text-muted mt-0.5 shrink-0">•</span>
              <span>{renderInline(item.content)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={elements.length} className="text-sm text-text-secondary leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }
  return elements;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="px-1.5 py-0.5 bg-surface-overlay rounded text-xs font-mono text-accent-light">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

/* ── Message bubble ── */
function MessageBubble({ message }) {
  const isBot = message.role === 'assistant';
  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
        isBot ? 'bg-accent/20' : 'bg-surface-overlay border border-border-subtle'
      }`}>
        {isBot ? <Bot className="w-4 h-4 text-accent-light" /> : <User className="w-4 h-4 text-text-secondary" />}
      </div>
      <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
        isBot ? 'bg-surface-raised border border-border-subtle' : 'bg-accent/12 border border-accent/20'
      }`}>
        {isBot
          ? <div className="space-y-1">{renderMarkdown(message.content)}</div>
          : <p className="text-sm text-text-primary">{message.content}</p>}
      </div>
    </div>
  );
}

/* ── System notification (expenses added) ── */
function SystemNotice({ text }) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        <span className="text-xs text-success font-medium">{text}</span>
      </div>
    </div>
  );
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-accent-light" />
      </div>
      <div className="bg-surface-raised border border-border-subtle rounded-2xl px-4 py-3 flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-accent-light animate-spin" />
        <span className="text-xs text-text-muted">Thinking…</span>
      </div>
    </div>
  );
}

/* ── Error banner ── */
function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="mx-4 lg:mx-6 mt-2 flex items-center gap-3 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
      <AlertCircle className="w-4 h-4 text-danger shrink-0" />
      <p className="text-xs sm:text-sm text-danger flex-1">{message}</p>
      <button onClick={onDismiss} className="text-xs text-danger/60 hover:text-danger transition-colors shrink-0">Dismiss</button>
    </div>
  );
}

/* ══════════════════ AI Assistant ══════════════════ */
export default function AIAssistant() {
  const { addExpenses } = useFinance();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm **Money Matters**, your AI finance assistant. 💰\n\nI can help you:\n- **Understand financial terms** like SIP, EMI, inflation\n- **Analyse your expenses** — just paste them and I'll categorise + update your dashboard\n- **Suggest budgeting tips** to save more\n\nTry pasting your expenses like: *\"₹300 Swiggy, ₹150 Uber, ₹500 Amazon\"*",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    setError(null);
    const userMsg = { id: Date.now(), role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const conversationHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, conversation: conversationHistory }),
      });

      if (!res.ok) throw new Error(`Server error (${res.status})`);

      const data = await res.json();
      const reply = data.reply;

      // Try to extract categorised expenses from the response
      const expenseData = extractExpenseData(reply);

      setMessages((prev) => {
        const updated = [
          ...prev,
          { id: Date.now() + 1, role: 'assistant', content: reply },
        ];
        // Add a system notice if expenses were parsed
        if (expenseData && expenseData.length > 0) {
          updated.push({
            id: Date.now() + 2,
            role: 'system',
            content: `✓ ${expenseData.length} expense${expenseData.length > 1 ? 's' : ''} added to your dashboard`,
          });
        }
        return updated;
      });

      // Add expenses to shared context
      if (expenseData && expenseData.length > 0) {
        addExpenses(expenseData);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Could not reach the server. Make sure the backend is running with npm run dev:all.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Suggested Prompts */}
      <div className="px-4 lg:px-6 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-accent-light" />
          <span className="text-xs font-medium text-text-secondary">Try asking</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="text-[11px] sm:text-xs px-2.5 py-1.5 rounded-full bg-surface-overlay border border-border-subtle text-text-secondary
                         hover:bg-accent/10 hover:text-accent-light hover:border-accent/30
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 max-w-full truncate"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
        {messages.map((msg) =>
          msg.role === 'system' ? (
            <SystemNotice key={msg.id} text={msg.content} />
          ) : (
            <MessageBubble key={msg.id} message={msg} />
          )
        )}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 lg:px-6 py-3 border-t border-border-subtle">
        <div className="flex items-center gap-2 sm:gap-3 bg-surface-raised border border-border-subtle rounded-2xl px-3 sm:px-4 py-2 focus-within:border-accent/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about finances or paste expenses…"
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none disabled:opacity-50 min-w-0"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-[11px] text-text-muted mt-2 text-center">
          Money Matters provides financial literacy only — not investment advice.
        </p>
      </div>
    </div>
  );
}
