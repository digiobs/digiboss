import { useState } from 'react';
import { Send, Sparkles, FileText, BarChart3, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { chatHistory } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(chatHistory);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        role: 'assistant',
        content:
          "I've analyzed your data and here's what I found:\n\n**Key Insight:**\nYour LinkedIn campaigns are outperforming other channels by 2.3x in terms of qualified lead generation.\n\n**Data Sources Used:**\n- LinkedIn Ads Manager (last 30 days)\n- CRM Pipeline data\n- Website analytics\n\n**Confidence:** 91%\n\n**Recommended Actions:**\n1. Increase LinkedIn ad budget by 25%\n2. Replicate top-performing ad creative across campaigns\n3. Test new audience segments based on current converters",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What's working best this month?",
    'Show me underperforming campaigns',
    'Build a Q2 content plan',
    'Which leads should I prioritize?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Talk to DigiObs</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions, get insights, and trigger actions
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex animate-fade-in',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%]',
                message.role === 'user' ? 'chat-message-user' : 'chat-message-ai'
              )}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {message.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <p key={i} className="font-semibold mt-2 first:mt-0">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <p key={i} className="text-sm ml-2">
                        • {line.slice(2)}
                      </p>
                    );
                  }
                  if (line.match(/^\d+\./)) {
                    return (
                      <p key={i} className="text-sm ml-2">
                        {line}
                      </p>
                    );
                  }
                  return line ? (
                    <p key={i} className="text-sm">
                      {line}
                    </p>
                  ) : null;
                })}
              </div>

              {/* Action buttons for AI messages */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                  <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                    <FileText className="w-3 h-3" />
                    Create Plan
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                    <BarChart3 className="w-3 h-3" />
                    Open Report
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                    <UserPlus className="w-3 h-3" />
                    Assign
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested questions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 pb-4">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInput(question)}
              className="text-xs"
            >
              {question}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask DigiObs anything about your marketing..."
          className="min-h-[60px] pr-12 resize-none"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim()}
          className="absolute right-2 bottom-2"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
