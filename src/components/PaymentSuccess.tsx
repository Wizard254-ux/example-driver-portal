import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import api from '../services/api';
import { useToast } from './ui/use-toast';

interface PaymentDetails {
  id: number;
  subscription_name: string;
  subscription_type: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  subtotal_amount?: string;
  tax_amount?: string;
  tax_rate?: string;
  billing_state?: string;
}

interface SubscriptionDetails {
  name: string;
  description: string;
  duration_months: number;
  max_drivers: number | null;
}

interface SubscriptionPeriod {
  start_date: string;
  end_date: string;
}

interface PaymentSuccessData {
  payment_status: string;
  payment_details: PaymentDetails;
  subscription_details: SubscriptionDetails;
  subscription_period?: SubscriptionPeriod;
}

export function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // Get parameters from URL
        const queryParams = new URLSearchParams(location.search);
        let sessionId = queryParams.get('session_id');
        const paymentId = queryParams.get('payment_id');
        const method = queryParams.get('method');
        
        // If not in query params, check if it's in the URL path
        if (!sessionId) {
          const pathParts = location.pathname.split('/');
          console.log('Path parts:', pathParts);
          if (pathParts.length > 0) {
            // Find the index of 'session' in the path
            const sessionIndex = pathParts.findIndex(part => part === 'session');
            if (sessionIndex !== -1 && sessionIndex < pathParts.length - 1) {
              sessionId = pathParts[sessionIndex + 1];
              console.log('Found session ID in path:', sessionId);
            }
          }
        }

        // Handle credit-only payments (no session_id)
        if (!sessionId && paymentId && method === 'credit') {
          console.log('Credit-only payment detected, payment_id:', paymentId);
          try {
            const response = await api.get(`/api/payment/success-details/?payment_id=${paymentId}`);
            setPaymentData(response.data);
            
            toast({
              title: 'Payment Successful',
              description: 'Your subscription has been activated using wallet credits',
              variant: 'default',
            });
          } catch (err: any) {
            console.error('Error fetching credit payment details:', err);
            setError(err.response?.data?.error || 'Failed to load credit payment details');
          }
          setLoading(false);
          return;
        }

        // Handle free plan payments (no session_id)
        if (!sessionId && paymentId && method === 'free') {
          console.log('Free plan detected, payment_id:', paymentId);
          try {
            const response = await api.get(`/api/payment/success-details/?payment_id=${paymentId}`);
            setPaymentData(response.data);
            
            toast({
              title: 'Free Plan Activated',
              description: 'Your free subscription has been activated successfully',
              variant: 'default',
            });
          } catch (err: any) {
            console.error('Error fetching free plan details:', err);
            setError(err.response?.data?.error || 'Failed to load free plan details');
          }
          setLoading(false);
          return;
        }

        if (!sessionId) {
          setError('No session ID found in URL');
          setLoading(false);
          return;
        }

        console.log('Found session ID:', sessionId);

        // Fetch payment details for Stripe payments
        const response = await api.get(`/api/payment/success-details/?session_id=${sessionId}`);
        setPaymentData(response.data);
        
        // Show success toast for Stripe payments
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully',
          variant: 'default',
        });
      } catch (err: any) {
        console.error('Error fetching payment details:', err);
        setError(err.response?.data?.error || 'Failed to load payment details');
        toast({
          title: 'Error',
          description: 'Failed to load payment details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [location, toast]);

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-red-500">Payment Error</CardTitle>
          <CardDescription>There was a problem retrieving your payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGoHome}>Go to Dashboard</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!paymentData) {
    return null;
  }

  const { payment_details, subscription_details, subscription_period } = paymentData;
  const hasTaxInfo = payment_details.subtotal_amount && payment_details.tax_amount;

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader className="bg-green-50 dark:bg-green-900/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-600 dark:text-green-400">Payment Successful!</CardTitle>
            <CardDescription>Your subscription has been activated</CardDescription>
          </div>
          <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium">Subscription Details</h3>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{subscription_details.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium capitalize">{payment_details.subscription_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{subscription_details.duration_months} month{subscription_details.duration_months !== 1 ? 's' : ''}</span>
          </div>
          {subscription_details.max_drivers && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Drivers</span>
              <span className="font-medium">{subscription_details.max_drivers}</span>
            </div>
          )}
        </div>

        {subscription_period && (
          <>
            <Separator className="my-4" />
            <h3 className="text-lg font-medium">Subscription Period</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{new Date(subscription_period.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{new Date(subscription_period.end_date).toLocaleDateString()}</span>
              </div>
            </div>
          </>
        )}

        <Separator className="my-4" />
        <h3 className="text-lg font-medium">Payment Summary</h3>
        <div className="mt-4 space-y-3">
          {hasTaxInfo ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{payment_details.subtotal_amount} {payment_details.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Tax {payment_details.billing_state && `(${payment_details.billing_state})`}
                  {payment_details.tax_rate && ` - ${Number(payment_details.tax_rate) * 100}%`}
                </span>
                <span className="font-medium">{payment_details.tax_amount} {payment_details.currency}</span>
              </div>
              <Separator className="my-2" />
            </>
          ) : null}
          <div className="flex justify-between text-lg">
            <span className="font-medium">Total</span>
            <span className="font-bold">{payment_details.amount} {payment_details.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment ID</span>
            <span className="text-muted-foreground">{payment_details.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span className="text-muted-foreground">{new Date(payment_details.created_at).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-center gap-4 pt-2 pb-6">
        <p className="text-center text-muted-foreground">Thank you for your payment. Your subscription is now active.</p>
        <Button size="lg" className="w-full md:w-auto" onClick={handleGoHome}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Return to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}