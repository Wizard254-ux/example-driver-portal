import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, CreditCard, Calendar, Users, ArrowUpRight, Filter, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Subscription as SubscriptionType, SubscriptionStatus, PaymentHistory, SubscriptionLimits } from '../services/subscription';
import { toast } from '@/hooks/use-toast';
import UpgradeSubscriptionModal from './UpgradeSubscriptionModal';
import CancelSubscriptionModal from './CancelSubscriptionModal';

import { subscriptionService } from '../services/subscription';


const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState<{message: string; policy: string; days_elapsed: number; days_until_allowed: number} | null>(null);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [subscriptionLimits, setSubscriptionLimits] = useState<SubscriptionLimits | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subs, status, history, limits] = await Promise.all([
          subscriptionService.getSubscriptions(),
          subscriptionService.getSubscriptionStatus(),
          subscriptionService.getPaymentHistory().catch(() => []),
          subscriptionService.getSubscriptionLimits().catch(() => null)
        ]);

        console.log('history', history);
        console.log('subscriptions',subs)

        setSubscriptions(subs);
        setSubscriptionStatus(status);
        setPaymentHistory(history.sort((a, b) => b.id - a.id));
        setSubscriptionLimits(limits);

        // Extract unique months for filtering
        const months = [...new Set(subs.map(sub => sub.duration_months))].sort((a, b) => a - b);
        setAvailableMonths(months);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Only run once on component mount

  const handleSubscribe = async (subscriptionId: number) => {
    // Check subscription limits before showing modal
    if (subscriptionStatus?.has_subscription && subscriptionLimits) {
      const selectedPlan = subscriptions.find(s => s.id === subscriptionId);
      const currentAmount = parseFloat(subscriptionStatus.amount || '0');
      const newAmount = parseFloat(selectedPlan?.amount || '0');
      const isUpgrade = newAmount > currentAmount;
      const isDowngrade = newAmount < currentAmount;
      
      if ((isUpgrade && !subscriptionLimits.limits.upgrade.allowed) || 
          (isDowngrade && !subscriptionLimits.limits.downgrade.allowed)) {
        const changeType = isUpgrade ? 'upgrade' : 'downgrade';
        toast({
          title: "Monthly Limit Reached",
          description: `You can only ${changeType} once per month. Try again next month.`,
          variant: "destructive"
        });
        return;
      }
      
      // Check 5-25 day blocking period for downgrades
      if (isDowngrade) {
        try {
          const downgradeCheck = await subscriptionService.checkDowngradeAllowed(subscriptionId);
          if (!downgradeCheck.allowed && downgradeCheck.blocked_period) {
            setBlockedInfo({
              message: downgradeCheck.message || '',
              policy: downgradeCheck.policy || '',
              days_elapsed: downgradeCheck.days_elapsed || 0,
              days_until_allowed: downgradeCheck.days_until_allowed || 0
            });
            setShowBlockedModal(true);
            return;
          }
        } catch (error) {
          console.error('Error checking downgrade permission:', error);
        }
      }
    }
    
    // Show the upgrade modal with specific plan preselected
    setSelectedPlanForUpgrade(subscriptionId);
    setShowUpgradeModal(true);
  };

  const handleGeneralUpgrade = () => {
    // Check if upgrade/downgrade is allowed
    if (subscriptionLimits && !subscriptionLimits.limits.upgrade.allowed && !subscriptionLimits.limits.downgrade.allowed) {
      toast({
        title: "Monthly Limit Reached",
        description: "You can only change your subscription once per month. Try again next month.",
        variant: "destructive"
      });
      return;
    }
    
    // Show upgrade modal with all plans
    setSelectedPlanForUpgrade(null);
    setShowUpgradeModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const refreshData = async () => {
    try {
      const [subs, status, history, limits] = await Promise.all([
        subscriptionService.getSubscriptions(),
        subscriptionService.getSubscriptionStatus(),
        subscriptionService.getPaymentHistory().catch(() => []),
        subscriptionService.getSubscriptionLimits().catch(() => null)
      ]);

      setSubscriptions(subs);
      setSubscriptionStatus(status);
      setPaymentHistory(history.sort((a, b) => b.id - a.id));
      setSubscriptionLimits(limits);

      // Update available months
      const months = [...new Set(subs.map(sub => sub.duration_months))].sort((a, b) => a - b);
      setAvailableMonths(months);
    } catch (error) {
      console.error('Error refreshing subscription data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>

      <Tabs defaultValue={subscriptionStatus?.has_subscription ? "current" : "plans"} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="current">Current Subscription</TabsTrigger>
          <TabsTrigger value="plans">Available Plans</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {subscriptionStatus?.has_subscription ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl">{subscriptionStatus.subscription_name}</CardTitle>
                      <CardDescription>
                        {subscriptionStatus.subscription_type === 'organization'
                          ? 'Organization subscription'
                          : 'Driver subscription'}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={subscriptionStatus.status === 'active' && !subscriptionStatus.is_expired ? 'default' : 'destructive'}
                      className="text-sm py-1"
                    >
                      {subscriptionStatus.status === 'active' && !subscriptionStatus.is_expired ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> {subscriptionStatus.is_expired ? 'Expired' : subscriptionStatus.status}
                        </span>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Subscription Period</p>
                        <p className="font-medium">
                          {subscriptionStatus.start_date && subscriptionStatus.end_date && (
                            <>
                              {formatDate(subscriptionStatus.start_date)} - {formatDate(subscriptionStatus.end_date)}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {subscriptionStatus.subscription_type === 'organization' && subscriptionStatus.driver_usage && (
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Driver Slots</p>
                          <p className="font-medium">
                            {subscriptionStatus.driver_usage.current_drivers} / {subscriptionStatus.driver_usage.max_drivers} used
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {subscriptionStatus.subscription_type === 'organization' && subscriptionStatus.driver_usage && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Driver Usage</span>
                        <span className="text-sm font-medium">
                          {Math.round((subscriptionStatus.driver_usage.current_drivers / subscriptionStatus.driver_usage.max_drivers) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(subscriptionStatus.driver_usage.current_drivers / subscriptionStatus.driver_usage.max_drivers) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  {subscriptionStatus.is_expired && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 w-full">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Your subscription has expired. Please renew to continue using premium features.</span>
                      </div>
                    </div>
                  )}

                  {/* Billing Cycle Limits Summary */}
                  {subscriptionLimits && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 w-full">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Billing Cycle Change Limits</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <div className={`font-medium ${subscriptionLimits.limits.upgrade.allowed ? 'text-green-600' : 'text-red-600'}`}>
                            Upgrade: {subscriptionLimits.limits.upgrade.used_count}/{subscriptionLimits.limits.upgrade.limit}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`font-medium ${subscriptionLimits.limits.downgrade.allowed ? 'text-green-600' : 'text-red-600'}`}>
                            Downgrade: {subscriptionLimits.limits.downgrade.used_count}/{subscriptionLimits.limits.downgrade.limit}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={handleGeneralUpgrade}
                      className="flex-1"
                      disabled={subscriptionLimits && !subscriptionLimits.limits.upgrade.allowed && !subscriptionLimits.limits.downgrade.allowed}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      {subscriptionLimits && !subscriptionLimits.limits.upgrade.allowed && !subscriptionLimits.limits.downgrade.allowed ? 'Change Limit Reached' : 'Change Plan'}
                    </Button>
                    <Button
                      onClick={() => setShowCancelModal(true)}
                      variant="destructive"
                      className="flex-1"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
                <p className="text-gray-500 mb-4">You don't have an active subscription. Choose a plan to get started.</p>
                <Button onClick={handleGeneralUpgrade}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Choose a Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans">
          {/* Month Filter */}
          {availableMonths.length > 1 && (
            <div className="mb-6 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by duration:</span>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {month} month{month > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions
              .filter(subscription => monthFilter === 'all' || subscription.duration_months.toString() === monthFilter)
              .map((subscription) => {
                const currentAmount = subscriptionStatus?.amount ? parseFloat(subscriptionStatus.amount) : 0;
                const newAmount = parseFloat(subscription.amount);
                const isUpgrade = subscriptionStatus?.has_subscription && newAmount > currentAmount;
                const isDowngrade = subscriptionStatus?.has_subscription && newAmount < currentAmount;
                const isCurrent = subscriptionStatus?.has_subscription && newAmount === currentAmount;

                return (
                  <Card key={subscription.id} className="relative">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <CardTitle>{subscription.name}</CardTitle>
                          <CardDescription>{subscription.description}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-1">
                          {isCurrent && (
                            <Badge className="bg-blue-500">Current Plan</Badge>
                          )}
                          {isUpgrade && (
                            <Badge className="bg-green-500">Upgrade</Badge>
                          )}
                          {isDowngrade && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">Downgrade</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-3xl font-bold">
                        ${subscription.amount}
                        <span className="text-base font-normal text-gray-500">/{subscription.duration_months}mo</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Up to {subscription.max_drivers} drivers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{subscription.duration_months} month subscription</span>
                        </li>
                        {subscription.features_display && subscription.features_display.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex-col space-y-2">
                      {(() => {
                        const currentAmount = subscriptionStatus?.amount ? parseFloat(subscriptionStatus.amount) : 0;
                        const newAmount = parseFloat(subscription.amount);
                        const isUpgradeAction = subscriptionStatus?.has_subscription && newAmount > currentAmount;
                        const isDowngradeAction = subscriptionStatus?.has_subscription && newAmount < currentAmount;
                        
                        const upgradeBlocked = isUpgradeAction && subscriptionLimits && !subscriptionLimits.limits.upgrade.allowed;
                        const downgradeBlocked = isDowngradeAction && subscriptionLimits && !subscriptionLimits.limits.downgrade.allowed;
                        const isBlocked = upgradeBlocked || downgradeBlocked;
                        
                        return (
                          <>
                            {isBlocked && (
                              <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Monthly {isUpgradeAction ? 'upgrade' : 'downgrade'} limit reached</span>
                                </div>
                              </div>
                            )}
                            <Button
                              className="w-full"
                              onClick={() => handleSubscribe(subscription.id)}
                              disabled={isCurrent || isBlocked}
                              variant={isDowngrade ? "outline" : "default"}
                            >
                              {isCurrent ? 'Current Plan' :
                               isBlocked ? 'Limit Reached' :
                               isUpgrade ? 'Upgrade' :
                               isDowngrade ? 'Downgrade' : 'Subscribe'}
                            </Button>
                          </>
                        );
                      })()}
                    </CardFooter>
                  </Card>
                );
              })
            }
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your subscription payments and refunds</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.map((transaction) => (
                    <div key={`${transaction.type}-${transaction.id}`} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{transaction.subscription_name}</p>
                          <Badge variant={transaction.type === 'refund' ? 'destructive' : 'secondary'} className="text-xs">
                            {transaction.type === 'refund' ? 'REFUND' : 'PAYMENT'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.transaction_date)} - {transaction.duration_months} months
                        </p>
                        {transaction.type === 'refund' && transaction.reason && (
                          <p className="text-xs text-gray-400 mt-1">
                            {transaction.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${transaction.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.type === 'refund' ? '-' : '+'}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                        {transaction.type === 'refund' && transaction.refund_method && (
                          <p className="text-xs text-gray-500 mt-1">
                            via {transaction.refund_method === 'stripe' ? 'Original Payment Method' : 'Wallet Credit'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transaction history found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Subscription Modal */}
      <UpgradeSubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setSelectedPlanForUpgrade(null);
        }}
        currentSubscription={subscriptionStatus}
        preselectedPlanId={selectedPlanForUpgrade}
        onSuccess={() => {
          setShowUpgradeModal(false);
          setSelectedPlanForUpgrade(null);
          refreshData();
        }}
      />

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        currentSubscription={subscriptionStatus}
        onSuccess={() => {
          setShowCancelModal(false);
          refreshData();
        }}
      />

      {/* Blocked Downgrade Modal */}
      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Downgrade Not Allowed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 mb-2">{blockedInfo?.message}</p>
              <div className="text-xs text-amber-700">
                <strong>Policy:</strong> {blockedInfo?.policy}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">{blockedInfo?.days_elapsed}</div>
                <div className="text-gray-500">Days Elapsed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-900">{blockedInfo?.days_until_allowed}</div>
                <div className="text-blue-700">Days Until Allowed</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBlockedModal(false)}>Understood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default Subscription;