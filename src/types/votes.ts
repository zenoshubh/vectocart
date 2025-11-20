export type VoteType = 'upvote' | 'downvote';

export interface ProductVote {
  id: string;
  productId: string;
  userId: string;
  voteType: VoteType;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVoteCounts {
  productId: string;
  upvoteCount: number;
  downvoteCount: number;
  netScore: number;
}

export interface UserVote {
  productId: string;
  voteType: VoteType | null;
}

