import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import type { Product, VoteType } from '@/types/products';
import { useToast } from '@/hooks/useToast';
import { sendMessage, withFallback } from '@/lib/messaging';
import { formatSupabaseError } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface ProductVotingProps {
  product: Product;
  onVoteChange?: (productId: string, voteType: VoteType | null) => void;
}

export function ProductVoting({ product, onVoteChange }: ProductVotingProps) {
  const [isVoting, setIsVoting] = useState(false);
  const toast = useToast();

  const upvoteCount = product.upvoteCount ?? 0;
  const downvoteCount = product.downvoteCount ?? 0;
  const userVote = product.userVote ?? null;

  async function handleVote(voteType: VoteType) {
    // If clicking the same vote type, remove the vote (toggle off)
    if (userVote === voteType) {
      await handleRemoveVote();
      return;
    }

    setIsVoting(true);
    try {
      logger.debug('ProductVoting:vote:request', { 
        productId: product.id, 
        voteType 
      });

      const response = await withFallback(
        () => sendMessage({ 
          type: 'votes:vote', 
          payload: { productId: product.id, voteType } 
        }),
        async () => {
          const { voteProduct } = await import('@/services/supabase/votes');
          const { VoteProductSchema } = await import('@/schemas/votes');
          const validated = VoteProductSchema.parse({ 
            productId: product.id, 
            voteType 
          });
          const result = await voteProduct(validated);
          // Convert ServiceResult to MessageResponse
          return {
            ok: !result.error,
            data: result.data,
            error: result.error,
          };
        },
      );

      if (!response.ok || response.error) {
        const errorMsg = response.error?.message || 'Failed to vote on product';
        logger.error('ProductVoting:vote:failed', { 
          productId: product.id, 
          voteType, 
          error: errorMsg 
        });
        throw response.error || new Error(errorMsg);
      }

      // Notify parent component of vote change
      if (onVoteChange) {
        onVoteChange(product.id, voteType);
      }

      logger.debug('ProductVoting:vote:success', { 
        productId: product.id, 
        voteType 
      });
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('ProductVoting:vote:error', err);
      toast.showError(errorMessage);
    } finally {
      setIsVoting(false);
    }
  }

  async function handleRemoveVote() {
    if (!userVote) return;

    setIsVoting(true);
    try {
      logger.debug('ProductVoting:removeVote:request', { 
        productId: product.id 
      });

      const response = await withFallback(
        () => sendMessage({ 
          type: 'votes:remove', 
          payload: { productId: product.id } 
        }),
        async () => {
          const { removeVote } = await import('@/services/supabase/votes');
          const { RemoveVoteSchema } = await import('@/schemas/votes');
          const validated = RemoveVoteSchema.parse({ 
            productId: product.id 
          });
          const result = await removeVote(validated);
          // Convert ServiceResult to MessageResponse
          return {
            ok: !result.error,
            data: result.data,
            error: result.error,
          };
        },
      );

      if (!response.ok || response.error) {
        const errorMsg = response.error?.message || 'Failed to remove vote';
        logger.error('ProductVoting:removeVote:failed', { 
          productId: product.id, 
          error: errorMsg 
        });
        throw response.error || new Error(errorMsg);
      }

      // Notify parent component of vote removal
      if (onVoteChange) {
        onVoteChange(product.id, null);
      }

      logger.debug('ProductVoting:removeVote:success', { 
        productId: product.id 
      });
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('ProductVoting:removeVote:error', err);
      toast.showError(errorMessage);
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('upvote')}
        disabled={isVoting}
        className={`h-8 px-3 text-xs hover:bg-green-50 ${
          userVote === 'upvote'
            ? 'bg-green-50 text-green-700 hover:bg-green-100'
            : 'text-[#6B7280] hover:text-green-700'
        }`}
        aria-label="Upvote product"
      >
        {isVoting && userVote === 'upvote' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <ThumbsUp className={`h-3.5 w-3.5 mr-1 ${userVote === 'upvote' ? 'fill-current' : ''}`} />
        )}
        {upvoteCount}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('downvote')}
        disabled={isVoting}
        className={`h-8 px-3 text-xs hover:bg-red-50 ${
          userVote === 'downvote'
            ? 'bg-red-50 text-red-700 hover:bg-red-100'
            : 'text-[#6B7280] hover:text-red-700'
        }`}
        aria-label="Downvote product"
      >
        {isVoting && userVote === 'downvote' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          <ThumbsDown className={`h-3.5 w-3.5 mr-1 ${userVote === 'downvote' ? 'fill-current' : ''}`} />
        )}
        {downvoteCount}
      </Button>
    </div>
  );
}

