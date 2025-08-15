import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, CreditCard, AlertCircle, Filter } from 'lucide-react';
import { subscriptionService, Subscription, SubscriptionStatus, SubscriptionDetails } from '../services/subscription';
import { useToast } from '@/hooks/use-toast';
import StateSelector from './StateSelector';

interface UpgradeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentSubscription: SubscriptionStatus | null;
  requiredDrivers?: number;
  preselectedPlanId?: number;
}

export const UpgradeSubscriptionModal: React.FC<UpgradeSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentSubscription,
  requiredDrivers,
  preselectedPlanId
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [prorationDetails, setProrationDetails] = useState<{
    originalPrice: string;
    creditApplied: string;
    finalAmount: string;
    daysRemaining: number;
    subscriptionAge: number;
    refundAmount?: string;
  } | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [taxInfo, setTaxInfo] = useState<{
    tax_amount: number;
    tax_rate: number;
    total_amount: number;
    state_name: string;
    proration_applied?: any;
  } | null>(null);
  const [currentSubscriptionDetails, setCurrentSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [newSubscriptionDetails, setNewSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const { toast } = useToast();

  // Calculate minimum required drivers
  const minRequiredDrivers = requiredDrivers || 
    (currentSubscription?.driver_usage?.current_drivers || 0) + 1;

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions();
    }
  }, [isOpen]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const subs = await subscriptionService.getSubscriptions();
      
      // Filter organization subscriptions (allow both upgrades and downgrades)
      const filteredSubs = subs.filter(sub => 
        sub.subscription_type === 'organization' && 
        // For upgrades: must support more drivers than current
        // For downgrades: show all plans (validation happens on backend)
        (sub.max_drivers >= minRequiredDrivers || 
         (currentSubscription?.max_drivers && sub.max_drivers < currentSubscription.max_drivers))
      );
      
      // Sort by amount (low to high)
      const sortedSubs = filteredSubs.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
      setSubscriptions(sortedSubs);
      
      // Extract unique months for filtering
      const months = [...new Set(filteredSubs.map(sub => sub.duration_months))].sort((a, b) => a - b);
      setAvailableMonths(months);
      
      // Auto-select plan based on context
      if (preselectedPlanId && sortedSubs.find(s => s.id === preselectedPlanId)) {
        // If specific plan was clicked, select only that plan
        setSelectedPlan(preselectedPlanId);
      } else if (sortedSubs.length > 0) {
        // If general upgrade, select recommended plan
        const recommendedPlan = sortedSubs.find(plan => plan.max_drivers >= minRequiredDrivers);
        if (recommendedPlan) {
          setSelectedPlan(recommendedPlan.id);
        }
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a subscription plan",
        variant: "destructive"
      });
      return;
    }
    
    // Show state selector dialog
    setShowStateSelector(true);
  };
  
  const calculateProration = async (currentSub: SubscriptionStatus, newPlan: Subscription) => {
    if (!currentSub.start_date) return null;
    
    const startDate = new Date(currentSub.start_date);
    const now = new Date();
    const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = currentSub.duration_months * 30;
    const currentAmount = parseFloat(currentSub.amount);
    const newAmount = parseFloat(newPlan.amount);
    
    // Get actual proration details from backend
    try {
      const response = await subscriptionService.createCheckoutSession({
        subscription_id: newPlan.id,
        state_code: 'CA', // Temporary state for calculation
        is_upgrade: true
      });
      
      if (response.proration_details) {
        return {
          originalPrice: response.proration_details.original_price,
          creditApplied: response.proration_details.credit_applied,
          finalAmount: response.proration_details.final_amount,
          daysRemaining: response.proration_details.days_remaining || 0,
          subscriptionAge: response.proration_details.subscription_age || daysElapsed,
          totalPaidWithTax: response.proration_details.previous_payment_credit || response.proration_details.credit_applied
        };
      }
    } catch (error) {
      console.error('Error getting proration from backend:', error);
    }
    
    // Fallback to basic calculation if backend call fails
    let finalAmount = newAmount;
    let creditApplied = 0;
    
    if (daysElapsed < 5) {
      creditApplied = currentAmount; // Use subscription amount only as fallback
      finalAmount = Math.max(0, newAmount - creditApplied);
    } else if (daysElapsed >= 25) {
      finalAmount = newAmount;
      creditApplied = 0;
    } else {
      const dailyRate = currentAmount / totalDays;
      const usedAmount = dailyRate * daysElapsed;
      const unusedCredit = currentAmount - usedAmount;
      creditApplied = unusedCredit;
      finalAmount = Math.max(0, newAmount - unusedCredit);
    }
    
    return {
      originalPrice: newAmount.toFixed(2),
      creditApplied: creditApplied.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      daysRemaining: Math.max(0, totalDays - daysElapsed),
      subscriptionAge: daysElapsed,
      totalPaidWithTax: creditApplied.toFixed(2)
    };
  };

  const calculateTaxPreview = async (stateCode: string) => {
    if (!selectedPlan) return;
    
    try {
      // Get proration and tax data from backend preview endpoint
      const preview = await subscriptionService.getProrationPreview(selectedPlan, stateCode);
      console.log('preview ',preview)
      
      // Check if downgrade is blocked
      if (preview.blocked_period) {
        toast({
          title: "Downgrade Not Allowed",
          description: preview.message,
          variant: "destructive"
        });
        setShowStateSelector(false);
        return;
      }
      
      setTaxInfo({
        ...preview.tax_info,
        proration_applied: preview.proration_details
      });
      
      // Set subscription details from preview response
      if (preview.current_subscription_details) {
        setCurrentSubscriptionDetails(preview.current_subscription_details);
      }
      if (preview.new_subscription_details) {
        setNewSubscriptionDetails(preview.new_subscription_details);
      }
    } catch (error) {
      console.error('Error calculating tax preview:', error);
    }
  };

  const handleStateSelected = async () => {
    if (!selectedState) {
      toast({
        title: "Error",
        description: "Please select your state for tax calculation",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedPlan) return;

    setUpgrading(true);
    try {
      const response = await subscriptionService.createCheckoutSession({
        subscription_id: selectedPlan,
        state_code: selectedState,
        is_upgrade: !!currentSubscription?.has_subscription
      });
      
      // Check for blocked period response
      if (response.blocked_period) {
        toast({
          title: "Downgrade Not Allowed",
          description: response.message,
          variant: "destructive"
        });
        return;
      }
      
      // Handle credit-only payments vs Stripe payments
      if (response.payment_completed && response.redirect_url) {
        // Credit-only payment completed immediately
        window.location.href = response.redirect_url;
      } else if (response.session_url) {
        // Stripe payment - redirect to checkout
        window.location.href = response.session_url;
      } else {
        // Fallback error handling
        throw new Error('Invalid payment response - no redirect URL provided');
      }
    } catch (error: any) {
      console.error('Error creating subscription session:', error);
      const errorData = error.response?.data;
      
      if (errorData?.blocked_period) {
        toast({
          title: "Downgrade Not Allowed",
          description: errorData.message,
          variant: "destructive"
        });
      } else if (errorData?.drivers_to_remove) {
        toast({
          title: "Cannot Downgrade",
          description: `You have ${errorData.current_drivers} active drivers but the new plan only supports ${errorData.new_plan_limit}. Please remove ${errorData.drivers_to_remove} drivers first.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: errorData?.error || "Failed to process subscription change",
          variant: "destructive"
        });
      }
    } finally {
      setUpgrading(false);
      setShowStateSelector(false);
    }
  };

  // Calculate tax when state changes
  useEffect(() => {
    if (selectedState && selectedPlan) {
      calculateTaxPreview(selectedState);
    }
  }, [selectedState, selectedPlan]);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3">Loading subscription plans...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>
            Upgrade or downgrade your subscription plan
          </DialogDescription>
        </DialogHeader>

        {currentSubscription && currentSubscription.driver_usage && (
          <div className="mb-6">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your current plan ({currentSubscription.subscription_name}) allows a maximum of {currentSubscription.driver_usage.max_drivers} drivers.
                You currently have {currentSubscription.driver_usage.current_drivers} drivers.
                {requiredDrivers && (
                  <> You need a plan that supports at least {requiredDrivers} drivers.</>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Driver Usage</span>

                <span className="text-sm font-medium">
                  {currentSubscription.driver_usage.current_drivers}/{currentSubscription.driver_usage.max_drivers}
                </span>
              </div>
              <Progress 
                value={(currentSubscription.driver_usage.current_drivers / currentSubscription.driver_usage.max_drivers) * 100} 
                className="h-2"
              />
            </div>
          </div>
        )}

        {/* Month Filter */}
        {availableMonths.length > 1 && (
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by duration:</span>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {month} month{month > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {subscriptions.length === 0 ? (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
            <h3 className="mt-2 text-lg font-medium">No suitable upgrade plans available</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no subscription plans available that meet your driver requirements.
              Please contact support for a custom plan.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions
                .filter(plan => {
                  // If specific plan preselected, show only that plan
                  if (preselectedPlanId) {
                    return plan.id === preselectedPlanId;
                  }
                  // Otherwise show filtered plans
                  return monthFilter === 'all' || plan.duration_months.toString() === monthFilter;
                })
                .map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isUpgrade = currentSubscription?.max_drivers ? plan.max_drivers > currentSubscription.max_drivers : true;
                const isDowngrade = currentSubscription?.max_drivers ? plan.max_drivers < currentSubscription.max_drivers : false;
                const isRecommended = plan.max_drivers >= minRequiredDrivers && isUpgrade;

                return (
                  <Card 
                    key={plan.id} 
                    className={`border cursor-pointer transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'hover:border-blue-300'}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        {isRecommended && (
                          <Badge className="bg-green-500">Recommended</Badge>
                        )}
                        {isDowngrade && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">Downgrade</Badge>
                        )}
                        {isUpgrade && !isRecommended && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">Upgrade</Badge>
                        )}

                      </div>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">${plan.amount}</span>
                        <span className="text-gray-500">/{plan.duration_months === 1 ? 'month' : `${plan.duration_months} months`}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="font-medium">Up to {plan.max_drivers} drivers</span>
                        {currentSubscription?.driver_usage?.max_drivers && (
                          <div className="text-sm text-green-600 mt-1">
                            +{plan.max_drivers - currentSubscription.driver_usage.max_drivers} additional drivers
                          </div>
                        )}
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Manage up to {plan.max_drivers} drivers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''} subscription</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Prorated billing - only pay the difference</span>
                        </li>
                      </ul>
                    </CardContent>
                    {isSelected && (
                      <CardFooter className="bg-blue-50 flex-col items-start">
                        <div className="text-sm font-medium mb-2">Selected Plan</div>
                        {currentSubscription?.end_date && (
                          <div className="text-xs text-gray-600">
                            Your new plan will expire on the same date as your current subscription
                          </div>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>


            <div className="flex justify-end space-x-2 pt-4 mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpgrade}
                disabled={!selectedPlan || upgrading}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {upgrading ? "Processing..." : "Subscribe Plan"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
    
    {/* State Selection Dialog */}
    <Dialog open={showStateSelector} onOpenChange={(open) => !open && setShowStateSelector(false)}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle>Select Your State</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          <StateSelector 
            onStateSelect={setSelectedState} 
            selectedState={selectedState} 
            className="mb-4"
          />
          
          {/* Billing Preview */}
          {taxInfo && selectedState && selectedPlan && (() => {
            const selectedSubscription = subscriptions.find(s => s.id === selectedPlan);
            if (!selectedSubscription) return null;
            
            const proration = taxInfo.proration_applied;
            console.log('prorarion ',proration)
            
            return (
              <div className="p-4 bg-gray-50 rounded-lg  overflow-y-auto">
                <h4 className="font-medium mb-3">Billing Summary</h4>
                
                {/* Subscription Comparison */}
                {(currentSubscriptionDetails || newSubscriptionDetails) && (
                  <div className="mb-4 p-3 bg-white rounded border">
                    <h5 className="font-medium text-sm mb-2">Plan Comparison</h5>
                    <div className="space-y-2 text-xs">
                      {currentSubscriptionDetails && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Current Plan:</span>
                          <div className="text-right">
                            <div className="font-medium">{currentSubscriptionDetails.name}</div>
                            <div className="text-gray-500">
                              ${currentSubscriptionDetails.amount}/{currentSubscriptionDetails.duration_months}mo • {currentSubscriptionDetails.max_drivers} drivers
                            </div>
                          </div>
                        </div>
                      )}
                      {newSubscriptionDetails && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">New Plan:</span>
                          <div className="text-right">
                            <div className="font-medium text-blue-600">{newSubscriptionDetails.name}</div>
                            <div className="text-gray-500">
                              ${newSubscriptionDetails.amount}/{newSubscriptionDetails.duration_months}mo • {newSubscriptionDetails.max_drivers} drivers
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Plan Change Information */}
                {proration && (() => {
                  const currentAmount = parseFloat(currentSubscription?.amount || '0');
                  const newAmount = parseFloat(selectedSubscription.amount);
                  const isDowngrade = newAmount < currentAmount;
                  const changeType = isDowngrade ? 'Downgrade' : 'Upgrade';
                  const subscriptionAge = proration.subscription_age || 0;
                  const daysRemaining = proration.days_remaining || 0;
                  const creditAmount = parseFloat(proration.credit_applied || '0');
                  const walletBalance = parseFloat(currentSubscription?.wallet_balance || '0');
                  
                  return (
                    <div className="mb-3 p-3 bg-white rounded border">
                      {subscriptionAge < 5 && (
                        <div className="text-green-700">
                          <div className="font-medium text-sm">Early {changeType} Credit</div>
                          <div className="text-xs">
                            Subscribed {subscriptionAge} days ago - Full effective payment credited
                            {walletBalance > 0 && ` (includes $${walletBalance.toFixed(2)} wallet balance)`}
                          </div>
                        </div>
                      )}
                      {subscriptionAge >= 5 && subscriptionAge < 25 && (
                        <div className="text-blue-700">
                          <div className="font-medium text-sm">Partial Credit Applied</div>
                          <div className="text-xs">
                            Credit for {daysRemaining} unused days from previous plan
                            {walletBalance > 0 && ` plus $${walletBalance.toFixed(2)} wallet balance`}
                          </div>
                        </div>
                      )}
                      {subscriptionAge >= 25 && (
                        <div className="text-orange-700">
                          <div className="font-medium text-sm">{walletBalance > 0 ? 'Wallet Credit Only' : 'Full Payment Required'}</div>
                          <div className="text-xs">
                            Previous subscription used for {subscriptionAge} days
                            {walletBalance > 0 && ` - Using $${walletBalance.toFixed(2)} wallet balance`}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Billing Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plan Price:</span>
                    <span>${selectedSubscription.amount}</span>
                  </div>
                  
                  {proration && parseFloat(proration.credit_applied || '0') > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Credit Applied:</span>
                        <span>-${proration.credit_applied}</span>
                      </div>
                      {(() => {
                        const originalPrice = parseFloat(selectedSubscription.amount);
                        const creditApplied = parseFloat(proration.credit_applied || '0');
                        const taxCoveredByCredit = parseFloat(proration.tax_covered_by_credit || '0');
                        const actualCreditRemaining = Math.max(0, creditApplied - originalPrice - taxCoveredByCredit);
                        
                        return actualCreditRemaining > 0 ? (
                          <div className="flex justify-between text-blue-600">
                            <span>Remaining Credit (to wallet):</span>
                            <span>+${actualCreditRemaining.toFixed(2)}</span>
                          </div>
                        ) : null;
                      })()} 
                    </>
                  )}
                  
                  {/* Tax Breakdown */}
                  {proration && (proration.tax_covered_by_credit || proration.tax_to_pay) && (
                    <>
                      {parseFloat(proration.tax_covered_by_credit || '0') > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Tax Covered by Credit:</span>
                          <span>-${parseFloat(proration.tax_covered_by_credit).toFixed(2)}</span>
                        </div>
                      )}
                      {parseFloat(proration.tax_to_pay || '0') > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Tax to Pay:</span>
                          <span>${parseFloat(proration.tax_to_pay).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="border-t pt-2">
                    {(() => {
                      const subtotal = parseFloat(proration?.final_amount || selectedSubscription.amount);
                      const taxAmount = subtotal <= 0 ? 0 : taxInfo.tax_amount;
                      const totalAmount = subtotal + taxAmount;
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax ({taxInfo.state_name} - {(taxInfo.tax_rate * 100).toFixed(2)}%):</span>
                            <div className="text-right">
                              {proration?.tax_covered_by_credit && parseFloat(proration.tax_covered_by_credit) > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-green-600 text-xs">-${parseFloat(proration.tax_covered_by_credit).toFixed(2)} (from credit)</div>
                                  <div>${parseFloat(proration.tax_to_pay || '0').toFixed(2)}</div>
                                </div>
                              ) : (
                                <span>${taxAmount.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-2 mt-2">
                            <span>Total Amount:</span>
                            <span className="text-lg">${taxInfo.total_amount.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* New Subscription Info */}
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <strong>New subscription starts today</strong> and will be active for {selectedSubscription.duration_months} month{selectedSubscription.duration_months > 1 ? 's' : ''}. 
                  {proration && parseFloat(proration.credit_applied || '0') > parseFloat(selectedSubscription.amount) && 
                    <span className="block mt-1">Excess credits will be saved to your wallet for future use.</span>
                  }
                </div>
              </div>
            );
          })()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowStateSelector(false)}>Cancel</Button>
          <Button onClick={handleStateSelected} disabled={!selectedState || upgrading}>
            {upgrading ? "Processing..." : "Continue to Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
  
};

export default UpgradeSubscriptionModal;