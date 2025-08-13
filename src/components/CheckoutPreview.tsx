import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, CreditCard } from 'lucide-react';

interface CheckoutPreviewProps {
  subscriptionName: string;
  baseAmount: number;
  taxAmount: number;
  taxRate: number;
  stateName: string;
  totalAmount: number;
  prorationCredit?: number;
  walletRefund?: number;
  taxCoveredByCredit?: number;
  taxToPay?: number;
  className?: string;
}

export const CheckoutPreview: React.FC<CheckoutPreviewProps> = ({
  subscriptionName,
  baseAmount,
  taxAmount,
  taxRate,
  stateName,
  totalAmount,
  prorationCredit = 0,
  walletRefund = 0,
  taxCoveredByCredit = 0,
  taxToPay = taxAmount,
  className = ""
}) => {
  const finalAmount = totalAmount - prorationCredit;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center overflow-y-auto justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Checkout Summary</CardTitle>
        <Calculator className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">{subscriptionName}</span>
          <Badge variant="outline">${baseAmount.toFixed(2)}</Badge>
        </div>
        
        {prorationCredit > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <span className="text-sm">Proration Credit</span>
            <span className="text-sm font-medium">-${prorationCredit.toFixed(2)}</span>
          </div>
        )}
        
        {walletRefund > 0 && (
          <div className="flex justify-between items-center text-blue-600">
            <span className="text-sm">Wallet Refund</span>
            <span className="text-sm font-medium">+${walletRefund.toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t pt-2 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${(baseAmount - prorationCredit).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Tax ({stateName} - {(taxRate * 100).toFixed(2)}%)</span>
            <div className="text-right">
              {taxCoveredByCredit > 0 ? (
                <div className="space-y-1">
                  <div className="text-green-600 text-xs">-${taxCoveredByCredit.toFixed(2)} (from credit)</div>
                  <div>${taxToPay.toFixed(2)}</div>
                </div>
              ) : (
                <span>${taxAmount.toFixed(2)}</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between font-medium border-t pt-2">
            <span>Total</span>
            <span>${finalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
          <CreditCard className="h-3 w-3" />
          <span>Secure payment processed by Stripe</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutPreview;