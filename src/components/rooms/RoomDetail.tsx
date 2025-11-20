import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loading } from '@/components/layout/Loading';
import { Users, Package, Loader2, Share2, Copy, Check, ExternalLink, Star, Trash2, RefreshCw, Search, Filter, ArrowUpDown } from 'lucide-react';
import type { Room } from '@/types/rooms';
import type { Product, ProductPlatform, VoteType } from '@/types/products';
import { shareRoom } from '@/lib/share';
import { useToast } from '@/hooks/useToast';
import { sendMessage, withFallback } from '@/lib/messaging';
import { listProductsByRoom, deleteProduct } from '@/services/supabase/products';
import { formatSupabaseError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { browser } from 'wxt/browser';
import { ProductVoting } from '@/components/products/ProductVoting';
import { TotalsCard } from '@/components/products/TotalsCard';
import { useAuth } from '@/hooks/useAuth';

interface RoomDetailProps {
  room: Room;
  onBack: () => void;
  onMembersClick: () => void;
}

type SortOption = 'date-asc' | 'date-desc' | 'rating-asc' | 'rating-desc' | 'price-asc' | 'price-desc' | 'votes-desc' | 'votes-asc';

export function RoomDetail({ room, onBack, onMembersClick }: RoomDetailProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<ProductPlatform | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const toast = useToast();

  // Check if current user is room owner
  const isRoomOwner = user?.id === room.createdBy;

  // Helper function to check if user can delete a product
  const canDeleteProduct = (product: Product): boolean => {
    if (!user) return false;
    // User can delete if they added the product OR if they're the room owner
    return product.addedBy === user.id || isRoomOwner;
  };

  const loadProducts = React.useCallback(async (showLoading = true): Promise<void> => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      logger.debug('RoomDetail:loadProducts:request', { roomId: room.id });
      
      const response = await withFallback(
        () => sendMessage({ type: 'products:list', payload: { roomId: room.id } }),
        () => listProductsByRoom(room.id),
      );

      if (!response.ok || response.error) {
        throw response.error || new Error('Failed to load products');
      }

      setProducts(response.data || []);
      logger.debug('RoomDetail:loadProducts:success', { count: response.data?.length || 0 });
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('RoomDetail:loadProducts:error', err);
      // Use toast directly without including in dependencies
      toast.showError(errorMessage);
      setProducts([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]); // Removed toast from dependencies to prevent infinite loop

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-refresh when window gains focus (user switches back to sidepanel)
  useEffect(() => {
    const handleFocus = () => {
      // Refresh products when user switches back to the sidepanel
      loadProducts(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadProducts]);

  // Listen for storage changes (when products are added from content script)
  useEffect(() => {
    let lastCheckedTimestamp = 0;
    
    const checkStorageForUpdates = async () => {
      try {
        const storage = await browser.storage.local.get([
          'vectocart:lastProductAdded',
          'vectocart:lastProductRoomId'
        ]);
        
        const timestamp = storage['vectocart:lastProductAdded'] as number | undefined;
        const roomId = storage['vectocart:lastProductRoomId'] as string | undefined;
        
        if (timestamp && roomId && roomId === room.id) {
          // Only refresh if this is a new timestamp
          if (timestamp > lastCheckedTimestamp) {
            lastCheckedTimestamp = timestamp;
            logger.debug('RoomDetail:storageCheck:productAdded', { roomId: room.id, timestamp });
            // Refresh immediately - background script only sets storage after DB write completes
            loadProducts(false);
          }
        }
      } catch (err) {
        logger.error('RoomDetail:storageCheck:error', err);
      }
    };

    const handleStorageChange = (
      changes: Record<string, browser.storage.StorageChange>,
      areaName: string
    ) => {
      try {
        // Only listen to local storage changes
        if (areaName !== 'local') return;
        
        logger.debug('RoomDetail:storageChange:detected', { 
          changes: Object.keys(changes),
          roomId: room.id,
          areaName
        });
        
        if (changes['vectocart:lastProductAdded'] && changes['vectocart:lastProductRoomId']) {
          const lastRoomId = changes['vectocart:lastProductRoomId'].newValue;
          // Only refresh if the product was added to this room
        if (lastRoomId === room.id) {
          logger.debug('RoomDetail:storageChange:productAdded', { roomId: room.id });
          // Refresh immediately - background script only sets storage after DB write completes
          loadProducts(false);
        }
        }
      } catch (err) {
        logger.error('RoomDetail:storageChange:error', err);
      }
    };

    // Set up storage listener
    browser.storage.onChanged.addListener(handleStorageChange);
    logger.debug('RoomDetail:storageListener:added', { roomId: room.id });
    
    // Also check storage periodically when visible (as fallback)
    // This is cheap - only reads from browser storage, not database
    const checkInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkStorageForUpdates();
      }
    }, 3000); // Check every 3 seconds when visible (cheap - only reads local storage)
    
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
      clearInterval(checkInterval);
      logger.debug('RoomDetail:storageListener:removed', { roomId: room.id });
    };
  }, [room.id, loadProducts]);

  // Refresh when sidepanel becomes visible (user switches back to it)
  useEffect(() => {
    // Use Page Visibility API to detect when sidepanel is visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh when becoming visible (user switched back to sidepanel)
        // Also check storage as a fallback
        setTimeout(async () => {
          try {
            const storage = await browser.storage.local.get([
              'vectocart:lastProductAdded',
              'vectocart:lastProductRoomId'
            ]);
            const roomId = storage['vectocart:lastProductRoomId'] as string | undefined;
            // If a product was recently added to this room, refresh
            if (roomId === room.id) {
              loadProducts(false);
            }
          } catch (err) {
            // If storage check fails, just refresh anyway
            loadProducts(false);
          }
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadProducts, room.id]);

  async function handleShare() {
    setSharing(true);
    try {
      await shareRoom(room.name, room.code);
      toast.showSuccess('Room shared successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share room';
      toast.showError(errorMessage);
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      toast.showSuccess('Room code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.showError('Failed to copy room code');
    }
  }

  function handleDeleteClick(productId: string) {
    setProductToDelete(productId);
    setShowDeleteDialog(true);
  }

  async function handleDeleteConfirm() {
    if (!productToDelete) return;

    setDeletingProductId(productToDelete);
    try {
      logger.debug('RoomDetail:deleteProduct:request', { productId: productToDelete });
      
      const response = await withFallback(
        () => sendMessage({ type: 'products:delete', payload: { productId: productToDelete } }),
        async () => {
          return await deleteProduct(productToDelete);
        },
      );

      if (!response.ok || response.error) {
        throw response.error || new Error('Failed to delete product');
      }

      // Remove product from local state
      setProducts((prev) => prev.filter(p => p.id !== productToDelete));
      toast.showSuccess('Product removed from room');
      logger.debug('RoomDetail:deleteProduct:success', { productId: productToDelete });
      setProductToDelete(null);
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('RoomDetail:deleteProduct:error', err);
      toast.showError(errorMessage);
    } finally {
      setDeletingProductId(null);
      setShowDeleteDialog(false);
    }
  }

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }

    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter((product) => product.platform === platformFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case 'date-desc':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'rating-asc':
          return (a.rating ?? 0) - (b.rating ?? 0);
        case 'rating-desc':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'price-asc':
          return (a.price ?? 0) - (b.price ?? 0);
        case 'price-desc':
          return (b.price ?? 0) - (a.price ?? 0);
        case 'votes-desc':
          return (b.netScore ?? 0) - (a.netScore ?? 0);
        case 'votes-asc':
          return (a.netScore ?? 0) - (b.netScore ?? 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, platformFilter, sortOption]);

  return (
    <div className="px-4 py-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#111827] mb-1">{room.name}</h2>
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#6B7280]">Code: {room.code}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-6 w-6 p-0 hover:bg-[#F8F9FA]"
            aria-label="Copy room code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#10B981]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#6B7280]" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onMembersClick}
          className="border-[#E5E7EB] hover:bg-[#F8F9FA]"
        >
          <Users className="h-4 w-4 mr-2" />
          Members
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadProducts(false)}
            disabled={refreshing}
            className="border-[#E5E7EB] hover:bg-[#F8F9FA]"
            aria-label="Refresh products"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
            className="border-[#E5E7EB] hover:bg-[#F8F9FA]"
          >
            {sharing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Share
          </Button>
        </div>
      </div>

      {/* Search, Filter, and Sort Controls */}
      {products.length > 0 && (
        <div className="mb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#E40046] focus:border-transparent"
            />
          </div>

          {/* Filter and Sort Row */}
          <div className="flex items-center gap-2">
            {/* Platform Filter */}
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as ProductPlatform | 'all')}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#E40046] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Platforms</option>
                <option value="amazon">Amazon</option>
                <option value="flipkart">Flipkart</option>
                <option value="meesho">Meesho</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex-1 relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#E40046] focus:border-transparent appearance-none bg-white"
              >
                <optgroup label="Date Added">
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </optgroup>
                <optgroup label="Rating">
                  <option value="rating-desc">Highest Rated</option>
                  <option value="rating-asc">Lowest Rated</option>
                </optgroup>
                <optgroup label="Price">
                  <option value="price-desc">Highest Price</option>
                  <option value="price-asc">Lowest Price</option>
                </optgroup>
                <optgroup label="Votes">
                  <option value="votes-desc">Most Voted</option>
                  <option value="votes-asc">Least Voted</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Results count */}
          {filteredAndSortedProducts.length !== products.length && (
            <p className="text-xs text-[#6B7280]">
              Showing {filteredAndSortedProducts.length} of {products.length} products
            </p>
          )}
        </div>
      )}

      {/* Totals Card */}
      {!loading && products.length > 0 && (
        <div className="mb-4">
          <TotalsCard products={products} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loading text="Loading products..." subtitle="Fetching room items" fullScreen={false} size="default" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="rounded-full bg-[#F8F9FA] p-4 mb-3">
            <Package className="h-8 w-8 text-[#6B7280]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827] mb-1">No products yet</h3>
          <p className="text-sm text-[#6B7280]">Add products to this room to get started</p>
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="rounded-full bg-[#F8F9FA] p-4 mb-3">
            <Package className="h-8 w-8 text-[#6B7280]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827] mb-1">No products found</h3>
          <p className="text-sm text-[#6B7280]">
            {searchQuery || platformFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add products to this room to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedProducts.map((product) => (
            <Card key={product.id} className="border border-[#E5E7EB] hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  {product.image && (
                    <div className="flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg border border-[#E5E7EB]"
                        onError={(e) => {
                          // Hide image on error
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-semibold text-[#111827] line-clamp-2 flex-1">
                        {product.name}
                      </h3>
                      {canDeleteProduct(product) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(product.id)}
                          disabled={deletingProductId === product.id}
                          className="h-6 w-6 p-0 hover:bg-red-50 text-red-600 hover:text-red-700 flex-shrink-0 ml-2"
                          aria-label="Delete product"
                        >
                          {deletingProductId === product.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                      {product.price !== null && product.price !== undefined ? (
                        <span className="text-sm font-medium text-[#111827]">
                          {product.currency === 'INR' ? '₹' : product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : product.currency || '₹'}
                          {product.price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-[#6B7280] italic">Price not available</span>
                      )}
                      
                      {product.rating !== null && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                          <span className="text-xs text-[#6B7280]">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      <span className="text-xs text-[#6B7280] bg-[#F8F9FA] px-2 py-0.5 rounded">
                        {product.platform}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#6B7280]">
                        Added {new Date(product.addedAt).toLocaleDateString()}
                      </p>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(product.url, '_blank')}
                        className="h-7 px-2 text-xs hover:bg-[#F8F9FA]"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View Product
                      </Button>
                    </div>
                    
                    {/* Voting Component */}
                    <ProductVoting 
                      product={product} 
                      onVoteChange={async (productId, voteType) => {
                        // Refresh products to get updated vote counts
                        // Small delay to ensure DB write completes
                        setTimeout(async () => {
                          await loadProducts(false);
                        }, 300);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Remove Product"
        description="Are you sure you want to remove this product from the room? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
