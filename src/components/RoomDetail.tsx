import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, Loader2, Share2, Copy, Check } from 'lucide-react';
import type { Room } from '@/types/rooms';
import { shareRoom } from '@/lib/share';
import { useToast } from '@/hooks/useToast';

interface RoomDetailProps {
  room: Room;
  onBack: () => void;
  onMembersClick: () => void;
}

interface Product {
  id: string;
  name: string;
  url: string;
  addedBy: string;
  addedAt: string;
}

export function RoomDetail({ room, onBack, onMembersClick }: RoomDetailProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    // TODO: Load products from Supabase
    // For now, show empty state
    const timer = setTimeout(() => {
      setProducts([]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [room.id]);

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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 text-[#E40046] animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="rounded-full bg-[#F8F9FA] p-4 mb-3">
            <Package className="h-8 w-8 text-[#6B7280]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827] mb-1">No products yet</h3>
          <p className="text-sm text-[#6B7280]">Add products to this room to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id} className="border border-[#E5E7EB]">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-[#111827] mb-1">{product.name}</h3>
                <p className="text-xs text-[#6B7280]">Added by {product.addedBy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
