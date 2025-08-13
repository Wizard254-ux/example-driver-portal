import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Clock, Calculator } from 'lucide-react';

interface BillingPreviewProps {
  subscriptionName: string;
  originalPrice: string;
  creditApplied: string;
  finalAmount: string;
  taxAmount: number;
  taxRate: number;
  stateName: string;
  totalAmount: number;
  subscriptionAge?: number;
  isUpgrade?: boolean;
  daysUsed?: number;
  unusedDays?: number;
}

export const BillingPreview: React.FC<BillingPreviewProps> = ({
  subscriptionName,
  originalPrice,
  creditApplied,
  finalAmount,
  taxAmount,
  taxRate,
  stateName,
  totalAmount,
  subscriptionAge = 0,
  isUpgrade = false,
  daysUsed = 0,
  unusedDays = 0
}) => {
  const getBillingScenario = () => {
    if (!isUpgrade) return null;
    
    if (subscriptionAge < 5) {
      return {
        type: 'early',
        title: 'Early Upgrade Credit',
        description: `You subscribed ${subscriptionAge} days ago. Your previous payment (including taxes) has been credited to this upgrade.`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />
      };
    } else if (subscriptionAge < 25) {
      return {
        type: 'partial',
        title: 'Partial Credit Applied',
        description: `You used ${daysUsed} days of your previous subscription. Credit applied for ${unusedDays} unused days.`,
        icon: <Clock className="h-4 w-4 text-blue-500" />
      };
    } else {
      return {
        type: 'full',
        title: 'Full Payment Required',
        description: `Your previous subscription was used for ${subscriptionAge} days. Full payment required for new plan.`,
        icon: <CreditCard className="h-4 w-4 text-orange-500" />
      };
    }
  };

  const scenario = getBillingScenario();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Billing Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription Details */}
        <div>
          <h4 className="font-medium mb-2">{subscriptionName}</h4>
          {isUpgrade && (
            <Badge variant="outline" className="mb-2">
              Plan Upgrade
            </Badge>
          )}
        </div>

        {/* Billing Scenario */}
        {scenario && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {scenario.icon}
              <span className="font-medium text-sm">{scenario.title}</span>
            </div>
            <p className="text-xs text-gray-600">{scenario.description}</p>
          </div>
        )}

        {/* Billing Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Original Price:</span>
            <span className="text-sm font-medium">${originalPrice}</span>
          </div>
          
          {parseFloat(creditApplied) > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="text-sm">Credit Applied:</span>
              <span className="text-sm font-medium">-${creditApplied}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="text-sm">Subtotal:</span>
            <span className="text-sm font-medium">${finalAmount}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm">Tax ({stateName} - {(taxRate * 100).toFixed(2)}%):</span>
            <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-medium">
            <span>Total Amount:</span>
            <span className="text-lg">${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* New Subscription Period */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-sm text-blue-700">New Subscription Period</span>
          </div>
          <p className="text-xs text-blue-600">
            Your new subscription starts today and will be active for the full duration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingPreview;