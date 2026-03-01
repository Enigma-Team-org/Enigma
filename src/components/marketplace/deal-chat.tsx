'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2 } from 'lucide-react';
import { cn, formatAddress } from '@/lib/utils/index';
import { format } from 'date-fns';

interface DealMessage {
  id: string;
  dealId: string;
  senderAddress: string;
  content: string;
  createdAt: string;
}

interface DealChatProps {
  dealId: string;
  currentAddress: string;
}

export function DealChat({ dealId, currentAddress }: DealChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<DealMessage[]>({
    queryKey: ['deal-messages', dealId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/marketplace/deals/${dealId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const json = await res.json();
      return json.data ?? json;
    },
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/v1/marketplace/deals/${dealId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderAddress: currentAddress, content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-messages', dealId] });
      setInput('');
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl overflow-hidden',
        'bg-[rgba(255,255,255,0.04)] backdrop-blur-xl',
        'border border-[rgba(255,255,255,0.06)]'
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
        <h3 className="text-sm font-semibold text-white">Deal Messages</h3>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px] min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[rgba(255,255,255,0.3)]" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-[rgba(255,255,255,0.3)] py-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderAddress.toLowerCase() === currentAddress.toLowerCase();
            return (
              <div
                key={msg.id}
                className={cn('flex flex-col max-w-[80%]', isOwn ? 'ml-auto items-end' : 'items-start')}
              >
                <span className="text-[10px] font-mono text-[rgba(255,255,255,0.3)] mb-1">
                  {formatAddress(msg.senderAddress)}
                </span>
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    isOwn
                      ? 'bg-[rgba(74,222,128,0.15)] text-[#4ADE80] border border-[rgba(74,222,128,0.2)]'
                      : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.8)] border border-[rgba(255,255,255,0.08)]'
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-[rgba(255,255,255,0.2)] mt-1">
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(255,255,255,0.06)]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className={cn(
            'flex-1 h-9 rounded-lg px-3 text-sm text-white placeholder:text-[rgba(255,255,255,0.3)]',
            'bg-[rgba(255,255,255,0.04)]',
            'border border-[rgba(255,255,255,0.06)]',
            'focus:outline-none focus:border-[rgba(74,222,128,0.4)]',
            'transition-colors'
          )}
          disabled={sendMutation.isPending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMutation.isPending}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            'bg-[rgba(74,222,128,0.15)] border border-[rgba(74,222,128,0.3)]',
            'text-[#4ADE80] transition-all',
            'hover:bg-[rgba(74,222,128,0.25)]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          {sendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
