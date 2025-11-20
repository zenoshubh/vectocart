import { getSupabase } from './client';
import type { VoteType, ProductVote, ProductVoteCounts, UserVote } from '@/types/votes';
import type { ServiceResult } from '@/types/rooms';
import { logger } from '@/lib/logger';
import type { VoteProductInput, RemoveVoteInput } from '@/schemas/votes';

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabase();
  logger.debug('getSession:request');
  
  const { data: sessionData, error } = await supabase.auth.getSession();
  
  logger.debug('getSession:response', { 
    hasSession: !!sessionData.session, 
    userId: sessionData.session?.user?.id,
    error: error?.message 
  });
  
  if (error) {
    logger.error('getSession:error', error);
    throw error;
  }
  
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    logger.warn('getSession:noUserId', { hasSession: !!sessionData.session });
    throw new Error('Not authenticated');
  }
  
  return userId;
}

async function checkProductRoomMembership(productId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  logger.debug('checkProductRoomMembership:request', { productId, userId });
  
  // Get the product's room_id
  const { data: product, error: productErr } = await supabase
    .from('products')
    .select('room_id')
    .eq('id', productId)
    .single();
  
  logger.debug('checkProductRoomMembership:getProduct', { 
    hasProduct: !!product, 
    error: productErr?.message 
  });
  
  if (productErr || !product) {
    throw new Error('Product not found');
  }
  
  // Check if user is a member of the room
  const { data: membership, error: membershipErr } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', product.room_id)
    .eq('user_id', userId)
    .maybeSingle();
  
  logger.debug('checkProductRoomMembership:response', { 
    isMember: !!membership, 
    error: membershipErr?.message 
  });
  
  if (membershipErr) throw membershipErr;
  return !!membership;
}

/**
 * Vote on a product (upvote or downvote)
 * If user has already voted, the vote will be updated
 * If user votes the opposite type, the previous vote is replaced
 */
export async function voteProduct(
  input: VoteProductInput,
): Promise<ServiceResult<ProductVote>> {
  const supabase = getSupabase();
  try {
    logger.debug('voteProduct:request', { productId: input.productId, voteType: input.voteType });
    const userId = await getCurrentUserId();

    // Check if user is a member of the product's room
    const isMember = await checkProductRoomMembership(input.productId, userId);
    if (!isMember) {
      throw new Error('Not a member of this room');
    }

    // Check if user has already voted on this product
    logger.debug('getExistingVote:request', { productId: input.productId, userId });
    const { data: existingVote, error: existingErr } = await supabase
      .from('product_votes')
      .select('id, vote_type')
      .eq('product_id', input.productId)
      .eq('user_id', userId)
      .maybeSingle();
    
    logger.debug('getExistingVote:response', { 
      hasExistingVote: !!existingVote, 
      existingVoteType: existingVote?.vote_type,
      error: existingErr?.message 
    });
    
    if (existingErr) throw existingErr;

    let vote: ProductVote;

    if (existingVote) {
      // User has already voted
      if (existingVote.vote_type === input.voteType) {
        // Same vote type - return existing vote (idempotent)
        logger.debug('voteProduct:sameVoteType', { voteId: existingVote.id });
        const { data: fullVote, error: fetchErr } = await supabase
          .from('product_votes')
          .select('id, product_id, user_id, vote_type, created_at, updated_at')
          .eq('id', existingVote.id)
          .single();
        
        if (fetchErr) throw fetchErr;
        if (!fullVote) throw new Error('Vote not found after fetch');
        
        vote = {
          id: fullVote.id,
          productId: fullVote.product_id,
          userId: fullVote.user_id,
          voteType: fullVote.vote_type as VoteType,
          createdAt: fullVote.created_at,
          updatedAt: fullVote.updated_at,
        };
        
        logger.debug('voteProduct:success', { voteId: vote.id, action: 'unchanged' });
        return { data: vote, error: null };
      } else {
        // Different vote type - update the vote (switch from upvote to downvote or vice versa)
        logger.debug('updateVote:request', { 
          voteId: existingVote.id, 
          oldType: existingVote.vote_type,
          newType: input.voteType 
        });
        
        const { data: updatedVote, error: updateErr } = await supabase
          .from('product_votes')
          .update({ 
            vote_type: input.voteType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVote.id)
          .select('id, product_id, user_id, vote_type, created_at, updated_at')
          .single();
        
        logger.debug('updateVote:response', { 
          hasUpdatedVote: !!updatedVote, 
          error: updateErr?.message 
        });
        
        if (updateErr) throw updateErr;
        if (!updatedVote) throw new Error('Vote not found after update');
        
        vote = {
          id: updatedVote.id,
          productId: updatedVote.product_id,
          userId: updatedVote.user_id,
          voteType: updatedVote.vote_type as VoteType,
          createdAt: updatedVote.created_at,
          updatedAt: updatedVote.updated_at,
        };
        
        logger.debug('voteProduct:success', { voteId: vote.id, action: 'updated' });
        return { data: vote, error: null };
      }
    } else {
      // User hasn't voted yet - create new vote
      logger.debug('insertVote:request', { productId: input.productId, userId, voteType: input.voteType });
      
      const { data: newVote, error: insertErr } = await supabase
        .from('product_votes')
        .insert({
          product_id: input.productId,
          user_id: userId,
          vote_type: input.voteType,
        })
        .select('id, product_id, user_id, vote_type, created_at, updated_at')
        .single();
      
      logger.debug('insertVote:response', { 
        hasNewVote: !!newVote, 
        error: insertErr?.message 
      });
      
      if (insertErr) throw insertErr;
      if (!newVote) throw new Error('Vote not created');
      
      vote = {
        id: newVote.id,
        productId: newVote.product_id,
        userId: newVote.user_id,
        voteType: newVote.vote_type as VoteType,
        createdAt: newVote.created_at,
        updatedAt: newVote.updated_at,
      };
      
      logger.debug('voteProduct:success', { voteId: vote.id, action: 'created' });
      return { data: vote, error: null };
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('voteProduct:error', error);
    return { data: null, error };
  }
}

/**
 * Remove a user's vote from a product
 */
export async function removeVote(
  input: RemoveVoteInput,
): Promise<ServiceResult<null>> {
  const supabase = getSupabase();
  try {
    logger.debug('removeVote:request', { productId: input.productId });
    const userId = await getCurrentUserId();

    // Check if user is a member of the product's room
    const isMember = await checkProductRoomMembership(input.productId, userId);
    if (!isMember) {
      throw new Error('Not a member of this room');
    }

    // Check if user has voted
    logger.debug('checkVoteExists:request', { productId: input.productId, userId });
    const { data: existingVote, error: checkErr } = await supabase
      .from('product_votes')
      .select('id')
      .eq('product_id', input.productId)
      .eq('user_id', userId)
      .maybeSingle();
    
    logger.debug('checkVoteExists:response', { 
      hasVote: !!existingVote, 
      error: checkErr?.message 
    });
    
    if (checkErr) throw checkErr;
    
    if (!existingVote) {
      // No vote to remove - idempotent operation
      logger.debug('removeVote:noVote', { productId: input.productId });
      return { data: null, error: null };
    }

    // Delete the vote
    logger.debug('deleteVote:request', { voteId: existingVote.id });
    const { error: deleteErr } = await supabase
      .from('product_votes')
      .delete()
      .eq('id', existingVote.id);
    
    logger.debug('deleteVote:response', { error: deleteErr?.message });
    
    if (deleteErr) throw deleteErr;
    
    logger.debug('removeVote:success', { productId: input.productId });
    return { data: null, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('removeVote:error', error);
    return { data: null, error };
  }
}

/**
 * Get vote counts for multiple products
 */
export async function getVoteCounts(
  productIds: string[],
): Promise<ServiceResult<Map<string, ProductVoteCounts>>> {
  const supabase = getSupabase();
  try {
    logger.debug('getVoteCounts:request', { productIds, count: productIds.length });
    
    if (productIds.length === 0) {
      return { data: new Map(), error: null };
    }

    // Query vote counts using the view
    const { data: voteCounts, error: countsErr } = await supabase
      .from('product_vote_counts')
      .select('product_id, upvote_count, downvote_count, net_score')
      .in('product_id', productIds);
    
    logger.debug('getVoteCounts:response', { 
      count: voteCounts?.length, 
      error: countsErr?.message 
    });
    
    if (countsErr) throw countsErr;

    // Build a map of product_id -> vote counts
    const countsMap = new Map<string, ProductVoteCounts>();
    
    for (const productId of productIds) {
      const counts = voteCounts?.find((vc) => vc.product_id === productId);
      countsMap.set(productId, {
        productId,
        upvoteCount: counts?.upvote_count ?? 0,
        downvoteCount: counts?.downvote_count ?? 0,
        netScore: counts?.net_score ?? 0,
      });
    }
    
    logger.debug('getVoteCounts:success', { count: countsMap.size });
    return { data: countsMap, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('getVoteCounts:error', error);
    return { data: null, error };
  }
}

/**
 * Get user's votes for multiple products
 */
export async function getUserVotes(
  productIds: string[],
): Promise<ServiceResult<Map<string, UserVote>>> {
  const supabase = getSupabase();
  try {
    logger.debug('getUserVotes:request', { productIds, count: productIds.length });
    const userId = await getCurrentUserId();

    if (productIds.length === 0) {
      return { data: new Map(), error: null };
    }

    // Query user's votes for these products
    const { data: votes, error: votesErr } = await supabase
      .from('product_votes')
      .select('product_id, vote_type')
      .eq('user_id', userId)
      .in('product_id', productIds);
    
    logger.debug('getUserVotes:response', { 
      count: votes?.length, 
      error: votesErr?.message 
    });
    
    if (votesErr) throw votesErr;

    // Build a map of product_id -> user vote
    const votesMap = new Map<string, UserVote>();
    
    for (const productId of productIds) {
      const vote = votes?.find((v) => v.product_id === productId);
      votesMap.set(productId, {
        productId,
        voteType: (vote?.vote_type as VoteType) ?? null,
      });
    }
    
    logger.debug('getUserVotes:success', { count: votesMap.size });
    return { data: votesMap, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('getUserVotes:error', error);
    return { data: null, error };
  }
}

