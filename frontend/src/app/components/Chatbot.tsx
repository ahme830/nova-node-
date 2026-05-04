import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const extractAction = (text: string) => {
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (match) {
    try {
      const action = JSON.parse(match[1]);
      const cleanText = text.replace(match[0], '').trim();
      return { action, cleanText };
    } catch (e) {
      return { cleanText: text };
    }
  }
  return { cleanText: text };
};

export function Chatbot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant NOVA NODE, votre expert en matériel informatique. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`
        },
        body: JSON.stringify({
          messages: newMessages,
          language: 'fr'
        }),
      });

      if (!response.ok) throw new Error('Erreur réseau');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Erreur Chatbot:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: t('chatbot.error') || 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: any) => {
    if (action.action === 'search') {
      const params = new URLSearchParams();
      if (action.query) params.append('search', action.query);
      if (action.categorie) params.append('categorie', action.categorie);
      if (action.minPrice) params.append('minPrice', action.minPrice.toString());
      if (action.maxPrice) params.append('maxPrice', action.maxPrice.toString());
      
      setIsOpen(false);
      navigate(`/catalog?${params.toString()}`);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-background rounded-2xl shadow-2xl border border-border flex flex-col z-50 overflow-hidden"
          >
            <div className="bg-primary text-primary-foreground p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t('chatbot.title') || 'Assistant NOVA NODE'}</h3>
                  <p className="text-xs opacity-80">{t('chatbot.subtitle') || 'Expert Informatique'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const { action, cleanText } = message.role === 'assistant' 
                  ? extractAction(message.content) 
                  : { cleanText: message.content, action: null };

                return (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    <div
                      className={`p-3 rounded-2xl text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground whitespace-pre-wrap'
                          : 'bg-muted text-foreground prose prose-sm dark:prose-invert max-w-none'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <ReactMarkdown>{cleanText}</ReactMarkdown>
                      ) : (
                        <p>{cleanText}</p>
                      )}
                    </div>
                    {action && action.action === 'search' && (
                      <Button 
                        onClick={() => handleActionClick(action)}
                        variant="outline" 
                        size="sm" 
                        className="self-start text-primary border-primary/20 hover:bg-primary/10 mt-1 shadow-sm font-semibold"
                      >
                        🔍 {action.label || t('chatbot.viewProducts') || 'Voir les produits'}
                      </Button>
                    )}
                  </div>
                </div>
              )})}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm">{t('chatbot.thinking') || 'L\'assistant réfléchit...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('chatbot.placeholder') || "Posez votre question informatique..."}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  size="icon" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
