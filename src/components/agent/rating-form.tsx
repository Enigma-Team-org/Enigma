'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/index';

interface RatingFormProps {
  agentAddress: string;
}

const MAX_COMMENT_LENGTH = 280;

export function RatingForm({ agentAddress }: RatingFormProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();

  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [comment, setComment] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (data: { score: number; comment?: string; signature: string; userAddress: string; nonce: string }) => {
      const res = await fetch(`/api/v1/agents/${agentAddress}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to submit rating');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Rating submitted successfully');
      setScore(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['ratings', agentAddress] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentAddress] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (score === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      // Step 1: Request nonce from server (anti-replay)
      const nonceRes = await fetch('/api/v1/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!nonceRes.ok) {
        toast.error('Failed to get authentication nonce');
        return;
      }
      const { data: nonceData } = await nonceRes.json();

      // Step 2: Sign the message that includes the nonce
      const signature = await signMessageAsync({ message: nonceData.message });
      const trimmedComment = comment.trim();

      // Step 3: Submit with nonce for replay protection
      submitMutation.mutate({
        score,
        ...(trimmedComment && { comment: trimmedComment }),
        signature,
        userAddress: address,
        nonce: nonceData.nonce,
      });
    } catch {
      toast.error('Signature rejected');
    }
  };

  const displayScore = hoveredScore || score;

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-border-subtle bg-glass p-6 text-center">
        <p className="text-sm text-text-secondary">
          Connect your wallet to leave a rating
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-glass p-6">
      <h3 className="mb-4 text-sm font-semibold text-white">Rate this Agent</h3>

      {/* Star Rating */}
      <div className="mb-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
            onClick={() => setScore(value)}
            onMouseEnter={() => setHoveredScore(value)}
            onMouseLeave={() => setHoveredScore(0)}
            aria-label={`Rate ${value} star${value !== 1 ? 's' : ''}`}
          >
            <Star
              size={24}
              className={cn(
                'transition-colors',
                value <= displayScore
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              )}
            />
          </button>
        ))}
        {displayScore > 0 && (
          <span className="ml-2 text-sm text-text-secondary">
            {displayScore}/5
          </span>
        )}
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label htmlFor="rating-comment" className="mb-1.5 block text-xs font-medium text-text-muted">
          Comment (optional)
        </label>
        <Textarea
          id="rating-comment"
          placeholder="Leave a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          className="bg-[rgba(31,41,55,0.5)] border-[rgba(255,255,255,0.08)] text-white placeholder:text-gray-500 resize-none"
          rows={3}
          aria-describedby="rating-char-count"
        />
        <div id="rating-char-count" className="mt-1 text-right text-xs text-text-muted" aria-live="polite">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={score === 0 || submitMutation.isPending}
        className="w-full bg-gradient-to-r from-primary to-primary-dark"
      >
        {submitMutation.isPending ? 'Submitting...' : 'Submit Rating'}
      </Button>
    </div>
  );
}
