import { getSupabase } from './client';
import type { Product, AddProductInput, ProductPlatform } from '@/types/products';
import type { ServiceResult } from '@/types/rooms';
import { logger } from '@/lib/logger';

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabase();
  logger.debug('getSession:request');
  
  // Force refresh session from storage
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

async function checkRoomMembership(roomId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  logger.debug('checkRoomMembership:request', { roomId, userId });
  const { data, error } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();
  logger.debug('checkRoomMembership:response', { isMember: !!data, error: error?.message });
  if (error) throw error;
  return !!data;
}

export async function addProduct(
  roomId: string,
  productData: AddProductInput,
): Promise<ServiceResult<Product>> {
  const supabase = getSupabase();
  try {
    logger.debug('addProduct:request', { roomId, productName: productData.name });
    const userId = await getCurrentUserId();

    // Check if user is a member of the room
    const isMember = await checkRoomMembership(roomId, userId);
    if (!isMember) {
      throw new Error('Not a member of this room');
    }

    logger.debug('insertProduct:request', { roomId, userId, productData });
    const { data: insertProduct, error: insertErr } = await supabase
      .from('products')
      .insert({
        room_id: roomId,
        name: productData.name,
        price: productData.price ?? null,
        currency: productData.currency ?? null,
        rating: productData.rating ?? null,
        image: productData.image ?? null,
        url: productData.url,
        added_by: userId,
        platform: productData.platform,
      })
      .select('id, room_id, name, price, currency, rating, image, url, added_by, added_at, platform')
      .single();
    logger.debug('insertProduct:response', { productId: insertProduct?.id, error: insertErr?.message });
    if (insertErr) throw insertErr;

    const product: Product = {
      id: insertProduct.id,
      roomId: insertProduct.room_id,
      name: insertProduct.name,
      price: insertProduct.price,
      currency: insertProduct.currency,
      rating: insertProduct.rating,
      image: insertProduct.image,
      url: insertProduct.url,
      addedBy: insertProduct.added_by,
      addedAt: insertProduct.added_at,
      platform: insertProduct.platform as Product['platform'],
    };
    logger.debug('addProduct:success', { productId: product.id });
    return { data: product, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('addProduct:error', error);
    return { data: null, error };
  }
}

export async function listProductsByRoom(roomId: string): Promise<ServiceResult<Product[]>> {
  const supabase = getSupabase();
  try {
    logger.debug('listProductsByRoom:request', { roomId });
    const userId = await getCurrentUserId();

    // Check if user is a member of the room
    const isMember = await checkRoomMembership(roomId, userId);
    if (!isMember) {
      throw new Error('Not a member of this room');
    }

    logger.debug('selectProducts:request', { roomId });
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, room_id, name, price, currency, rating, image, url, added_by, added_at, platform')
      .eq('room_id', roomId)
      .order('added_at', { ascending: false });
    logger.debug('selectProducts:response', { count: productsData?.length, error: productsError?.message });
    if (productsError) throw productsError;

    const products: Product[] = (productsData ?? []).map(
      (p): Product => ({
        id: p.id,
        roomId: p.room_id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        rating: p.rating,
        image: p.image,
        url: p.url,
        addedBy: p.added_by,
        addedAt: p.added_at,
        platform: p.platform as Product['platform'],
      }),
    );

    logger.debug('listProductsByRoom:success', { count: products.length });
    return { data: products, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('listProductsByRoom:error', error);
    return { data: null, error };
  }
}

export async function deleteProduct(productId: string): Promise<ServiceResult<null>> {
  const supabase = getSupabase();
  try {
    logger.debug('deleteProduct:request', { productId });
    const userId = await getCurrentUserId();

    // First, get the product to check room membership
    logger.debug('selectProduct:request', { productId });
    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('room_id, added_by')
      .eq('id', productId)
      .single();
    logger.debug('selectProduct:response', { hasProduct: !!product, error: productErr?.message });
    if (productErr) throw productErr;
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if user is a member of the room or added the product
    const isMember = await checkRoomMembership(product.room_id, userId);
    if (!isMember) {
      throw new Error('Not a member of this room');
    }

    // Allow deletion if user added the product or is room owner
    const isOwner = product.added_by === userId;
    if (!isOwner) {
      // Check if user is room owner
      const { data: member } = await supabase
        .from('room_members')
        .select('role')
        .eq('room_id', product.room_id)
        .eq('user_id', userId)
        .single();
      if (member?.role !== 'owner') {
        throw new Error('Only product owner or room owner can delete products');
      }
    }

    logger.debug('deleteProductRow:request', { productId });
    const { error: delErr } = await supabase.from('products').delete().eq('id', productId);
    logger.debug('deleteProductRow:response', { error: delErr?.message });
    if (delErr) throw delErr;

    logger.debug('deleteProduct:success', { productId });
    return { data: null, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('deleteProduct:error', error);
    return { data: null, error };
  }
}

