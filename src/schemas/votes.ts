import { z } from 'zod';

export const VoteTypeSchema = z.enum(['upvote', 'downvote']);
export type VoteType = z.infer<typeof VoteTypeSchema>;

export const VoteProductSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  voteType: VoteTypeSchema,
});

export type VoteProductInput = z.infer<typeof VoteProductSchema>;

export const RemoveVoteSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
});

export type RemoveVoteInput = z.infer<typeof RemoveVoteSchema>;

