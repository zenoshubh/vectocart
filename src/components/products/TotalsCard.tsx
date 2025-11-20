import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Product, ProductPlatform } from '@/types/products';
import { getPlatformName, getPlatformIcon } from '@/components/products/PlatformBadge';

interface TotalsCardProps {
  products: Product[];
}

interface PlatformTotals {
  platform: ProductPlatform;
  totalPrice: number;
  productCount: number;
  currency: string | null;
}

function formatPrice(price: number, currency: string | null): string {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency || '₹';
  return `${symbol}${price.toLocaleString()}`;
}

// Platform name formatting is now handled by getPlatformName from PlatformBadge

export function TotalsCard({ products }: TotalsCardProps) {
  const totals = useMemo(() => {
    let totalPrice = 0;
    let totalProducts = products.length;
    const platformTotalsMap = new Map<ProductPlatform, PlatformTotals>();

    products.forEach((product) => {
      // Count products
      if (product.price !== null && product.price !== undefined) {
        totalPrice += product.price;
      }

      // Calculate platform totals
      const existing = platformTotalsMap.get(product.platform);
      const productPrice = product.price ?? 0;
      const productCurrency = product.currency;

      if (existing) {
        existing.totalPrice += productPrice;
        existing.productCount += 1;
        // Use the currency from the first product with a price, or keep existing
        if (!existing.currency && productCurrency) {
          existing.currency = productCurrency;
        }
      } else {
        platformTotalsMap.set(product.platform, {
          platform: product.platform,
          totalPrice: productPrice,
          productCount: 1,
          currency: productCurrency,
        });
      }
    });

    const platformTotals = Array.from(platformTotalsMap.values()).sort((a, b) =>
      a.platform.localeCompare(b.platform)
    );

    // Determine currency - use the most common currency, or default to INR
    const currencies = products
      .filter((p) => p.currency)
      .map((p) => p.currency!);
    const currencyCounts = currencies.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonCurrency =
      Object.keys(currencyCounts).length > 0
        ? Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'INR';

    return {
      totalPrice,
      totalProducts,
      currency: mostCommonCurrency,
      platformTotals,
    };
  }, [products]);

  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="border border-[#E5E7EB] shadow-sm">
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="totals" className="border-none">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">Total Price</p>
                    <p className="text-lg font-semibold text-[#111827]">
                      {formatPrice(totals.totalPrice, totals.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">Total Products</p>
                    <p className="text-lg font-semibold text-[#111827]">{totals.totalProducts}</p>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4">
              <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
                {totals.platformTotals.length > 0 ? (
                  totals.platformTotals.map((platformTotal) => (
                    <div
                      key={platformTotal.platform}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {React.createElement(getPlatformIcon(platformTotal.platform), { className: 'h-4 w-4 text-[#6B7280]' })}
                          <span className="text-sm font-medium text-[#111827]">
                            {getPlatformName(platformTotal.platform)}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B7280]">
                          {platformTotal.productCount} {platformTotal.productCount === 1 ? 'product' : 'products'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[#111827]">
                        {formatPrice(platformTotal.totalPrice, platformTotal.currency || totals.currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#6B7280] py-2">No products with prices</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

