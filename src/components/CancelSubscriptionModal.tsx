import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Wallet, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { subscriptionService, SubscriptionStatus } from '../services/subscription';
import { useToast } from '@/hooks/use-toast';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentSubscription: SubscriptionStatus | null;
}

interface CancellationPreview {
  refund_type: 'full' | 'partial' | 'none';
  days_elapsed: number;
  total_days: number;
  remaining_days: number;
  subscription_details: {
    name: string;
    amount: string;
    duration_months: number;
    start_date: string;
  };
  payment_details: {
    original_amount: string;
    tax_amount: string;
    total_paid: string;
  };
  refund_breakdown: {
    subscription_refund: string;
    tax_refund: string;
    credit_remaining_refund: string;
    total_refund: string;
    used_amount: string;
    reason: string;
  };
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentSubscription
}) => {
  const [cancelling, setCancelling] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [cancellationPreview, setCancellationPreview] = useState<CancellationPreview | null>(null);
  const [blockedPeriod, setBlockedPeriod] = useState<any>(null);
  const { toast } = useToast();

  // Load cancellation preview when modal opens
  useEffect(() => {
    if (isOpen && currentSubscription?.has_subscription) {
      loadCancellationPreview();
    }
  }, [isOpen, currentSubscription]);

  const loadCancellationPreview = async () => {
    setLoadingPreview(true);
    try {
      const preview = await subscriptionService.getCancellationPreview();
      if (preview.blocked_period) {
        setBlockedPeriod(preview);
        setCancellationPreview(null);
      } else {
        setCancellationPreview(preview);
        setBlockedPeriod(null);
      }
    } catch (error: any) {
      console.error('Error loading cancellation preview:', error);
      toast({
        title: "Error",
        description: "Failed to load cancellation preview",
        variant: "destructive"
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await subscriptionService.cancelSubscription();
      
      if (response.blocked_period) {
        toast({
          title: "Cancellation Not Allowed",
          description: response.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Subscription Cancelled",
          description: response.message,
          variant: response.success ? "default" : "destructive"
        });
        
        if (response.success) {
          onSuccess?.();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to cancel subscription",
        variant: "destructive"
      });
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            Review the refund details below before confirming cancellation.
          </DialogDescription>
        </DialogHeader>

        {loadingPreview ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading refund preview...</span>
          </div>
        ) : blockedPeriod ? (
          <div className="space-y-6">
            {/* Blocked Period Notice */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cancellation Not Available</AlertTitle>
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <div>{blockedPeriod.message}</div>
                  <div className="font-medium">
                    Policy: {blockedPeriod.policy}
                  </div>
                  <div className="text-xs text-amber-700">
                    Wait {blockedPeriod.days_until_allowed} more days to cancel without refund
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : cancellationPreview ? (
          <div className="space-y-6">
            {/* Subscription Details */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Current Subscription
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Plan</p>
                  <p className="font-medium">{cancellationPreview.subscription_details.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Started</p>
                  <p className="font-medium">{formatDate(cancellationPreview.subscription_details.start_date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Days Used</p>
                  <p className="font-medium">{cancellationPreview.days_elapsed} of {cancellationPreview.total_days} days</p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining</p>
                  <p className="font-medium">{cancellationPreview.remaining_days} days</p>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subscription Amount</span>
                  <span>${cancellationPreview.payment_details.original_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes</span>
                  <span>${cancellationPreview.payment_details.tax_amount}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Paid</span>
                  <span>${cancellationPreview.payment_details.total_paid}</span>
                </div>
              </div>
            </div>

            {/* Refund Calculation */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Refund Calculation
              </h3>
              <div className="space-y-2 text-sm">
                {cancellationPreview.refund_type === 'partial' && (
                  <>
                    <div className="flex justify-between text-red-600">
                      <span>Used Amount ({cancellationPreview.days_elapsed} days)</span>
                      <span>-${cancellationPreview.refund_breakdown.used_amount}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Subscription Refund</span>
                      <span>+${cancellationPreview.refund_breakdown.subscription_refund}</span>
                    </div>
                    {parseFloat(cancellationPreview.refund_breakdown.credit_remaining_refund) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Credit Remaining Refund</span>
                        <span>+${cancellationPreview.refund_breakdown.credit_remaining_refund}</span>
                      </div>
                    )}
                  </>
                )}
                {cancellationPreview.refund_type === 'full' && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Subscription Refund</span>
                      <span>+${cancellationPreview.refund_breakdown.subscription_refund}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Tax Refund</span>
                      <span>+${cancellationPreview.refund_breakdown.tax_refund}</span>
                    </div>
                    {parseFloat(cancellationPreview.refund_breakdown.credit_remaining_refund) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Credit Remaining Refund</span>
                        <span>+${cancellationPreview.refund_breakdown.credit_remaining_refund}</span>
                      </div>
                    )}
                  </>
                )}
                {cancellationPreview.refund_type === 'none' && 
                 parseFloat(cancellationPreview.refund_breakdown.credit_remaining_refund) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Credit Remaining Refund</span>
                    <span>+${cancellationPreview.refund_breakdown.credit_remaining_refund}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total Refund</span>
                  <span className={parseFloat(cancellationPreview.refund_breakdown.total_refund) > 0 ? 'text-green-600' : 'text-gray-500'}>
                    ${cancellationPreview.refund_breakdown.total_refund}
                  </span>
                </div>
              </div>
            </div>

            {/* Refund Policy Alert */}
            <Alert className={
              cancellationPreview.refund_type === 'none' ? 'border-red-200 bg-red-50' :
              cancellationPreview.refund_type === 'full' ? 'border-green-200 bg-green-50' :
              'border-amber-200 bg-amber-50'
            }>
              <Wallet className="h-4 w-4" />
              <AlertTitle>Refund Policy</AlertTitle>
              <AlertDescription className="text-sm">
                {cancellationPreview.refund_breakdown.reason}
                {parseFloat(cancellationPreview.refund_breakdown.total_refund) > 0 && 
                  '. Refunds are processed to your original payment method and typically take 5-10 business days to appear on your statement.'}
              </AlertDescription>
            </Alert>

            {/* Warning */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription className="text-sm">
                Cancelling your subscription will immediately revoke access to premium features. This action cannot be undone.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Unable to load refund preview. Please try again.</p>
            <Button variant="outline" onClick={loadCancellationPreview} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={cancelling || loadingPreview}>
            Keep Subscription
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={cancelling || loadingPreview || (!cancellationPreview && !blockedPeriod) || blockedPeriod}
          >
            {blockedPeriod ? "Cancellation Blocked" : cancelling ? "Processing Cancellation..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionModal;