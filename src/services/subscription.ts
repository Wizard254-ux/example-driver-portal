import api from './api';

export interface Subscription {
  id: number;
  name: string;
  description: string;
  amount: string;
  currency: string;
  subscription_type: 'driver' | 'organization';
  duration_months: number;
  max_drivers: number;
  is_active: boolean;
  features_display?: string[];
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  subscription_name?: string;
  subscription_type?: string;
  duration_months?: number;
  max_drivers?: number;
  amount?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  is_expired?: boolean;
  user_role?: string;
  is_valid_for_role?: boolean;
  driver_usage?: {
    current_drivers: number;
    max_drivers: number;
    remaining_slots: number;
    can_add_driver: boolean;
  };
  wallet_balance?: string;
}

export interface SubscriptionLimits {
  current_month: string;
  limits: {
    upgrade: {
      allowed: boolean;
      used_count: number;
      limit: number;
      last_change?: string;
    };
    downgrade: {
      allowed: boolean;
      used_count: number;
      limit: number;
      last_change?: string;
    };
    cancel: {
      allowed: boolean;
      used_count: number;
      limit: number;
      last_change?: string;
    };
  };
  next_reset_date: string;
}

export interface CreateCheckoutSessionData {
  subscription_id: number;
  state_code?: string;
  is_upgrade?: boolean;
}

export interface PaymentHistory {
  id: number;
  type: 'payment' | 'refund';
  subscription_name: string;
  amount: string;
  currency: string;
  status: string;
  duration_months: number;
  start_date: string;
  end_date: string;
  transaction_date: string; // Renamed from payment_date for unified interface
  created_at: string;
  
  // Payment-specific fields (when type === 'payment')
  stripe_session_id?: string;
  
  // Refund-specific fields (when type === 'refund')
  refund_type?: 'full' | 'partial' | 'none';
  refund_method?: 'stripe' | 'wallet';
  stripe_refund_id?: string;
  days_used?: number;
  total_days?: number;
  reason?: string;
}

export interface SubscriptionDetails {
  name: string;
  amount: string;
  duration_months: number;
  max_drivers: number;
  subscription_type: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  days_used?: number;
}

export interface CheckoutSessionResponse {
  new_plan_name: any;
  current_plan_name: any;
  is_downgrade: any;
  billing_type: string;
  session_url: string;
  session_id: string;
  payment_completed: boolean;
  redirect_url: string;
  blocked_period:any,
  message: string;
  payment_id: number;
  current_subscription_details?: SubscriptionDetails;
  new_subscription_details: SubscriptionDetails;
  proration_details?: {
    previous_payment_credit: string;
    original_price: string;
    credit_applied: string;
    final_amount: string;
    days_remaining: number;
    subscription_age: number;
    refund_amount?: string;
    wallet_credit?: string;
  };
}

export interface StateInfo {
  code: string;
  name: string;
  taxable: boolean;
  rate: string;
}

export const subscriptionService = {
  async getSubscriptions(): Promise<Subscription[]> {
    const response = await api.get('/api/payment/subscriptions/');
    // Sort by amount (lowest to highest)
    return response.data.sort((a: Subscription, b: Subscription) => 
      parseFloat(a.amount) - parseFloat(b.amount)
    );
  },

  async getStates(): Promise<StateInfo[]> {
    const response = await api.get('/api/payment/states/');
    return response.data;
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await api.get('/api/payment/subscription-status/');
    console.log('subscription status response:', response.data);
    return response.data;
  },

  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<CheckoutSessionResponse> {
    const response = await api.post('/api/payment/create-session/', data);
    return response.data;
  },

  async calculateTax(amount: number, stateCode: string, address?: {
    city?: string;
    postal_code?: string;
    address_line1?: string;
  }): Promise<{
    tax_amount: number;
    tax_rate: number;
    total_amount: number;
    state_name: string;
  }> {
    const requestData: any = {
      amount,
      state_code: stateCode
    };
    
    // Add address fields if provided for enhanced Stripe Tax calculation
    if (address) {
      if (address.city) requestData.city = address.city;
      if (address.postal_code) requestData.postal_code = address.postal_code;
      if (address.address_line1) requestData.address_line1 = address.address_line1;
    }
    
    const response = await api.post('/api/payment/calculate-tax/', requestData);
    return response.data;
  },

  async cancelSubscription(): Promise<{
    success: boolean;
    refund_amount?: string;
    stripe_refund_id?: string;
    refund_method?: 'stripe' | 'wallet';
    wallet_credit?: string;
    message: string;
  }> {
    const response = await api.post('/api/payment/cancel-subscription/');
    return response.data;
  },

  async getWalletBalance(): Promise<{
    balance: string;
    currency: string;
    transactions: Array<{
      id: number;
      amount: string;
      type: 'credit' | 'debit';
      description: string;
      created_at: string;
    }>;
  }> {
    const response = await api.get('/api/payment/wallet/');
    return response.data;
  },

  async getPaymentHistory(): Promise<PaymentHistory[]> {
    const response = await api.get('/api/payment/history/');
    return response.data;
  },

  async checkDriverLimit(): Promise<{
    can_add_driver: boolean;
    current_drivers: number;
    max_drivers: number;
    remaining_slots: number;
    subscription_name: string;
  }> {
    const status = await this.getSubscriptionStatus();
    
    if (!status.has_subscription || !status.driver_usage) {
      throw new Error('No active subscription found');
    }
    
    return {
      can_add_driver: status.driver_usage.can_add_driver,
      current_drivers: status.driver_usage.current_drivers,
      max_drivers: status.driver_usage.max_drivers,
      remaining_slots: status.driver_usage.remaining_slots,
      subscription_name: status.subscription_name || 'Unknown'
    };
  },

  async validateDriverAddition(): Promise<{
    can_add_driver: boolean;
    current_drivers: number;
    max_drivers: number;
  }> {
    const response = await api.post('/api/payment/validate-driver-addition/');
    return response.data;
  },

  async getProrationPreview(subscriptionId: number, stateCode: string): Promise<{
    proration_details?: any;
    current_subscription_details?: SubscriptionDetails;
    new_subscription_details: SubscriptionDetails;
    message:string,
    blocked_period?: boolean;
    tax_info: {
      tax_amount: number;
      tax_rate: number;
      total_amount: number;
      state_name: string;
    };
  }> {
    const response = await api.post('/api/payment/proration-preview/', {
      subscription_id: subscriptionId,
      state_code: stateCode
    });
    return response.data;
  },

  async getCancellationPreview(): Promise<{
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
      total_refund: string;
      used_amount: string;
      reason: string;
    };
  }> {
    const response = await api.get('/api/payment/cancellation-preview/');
    return response.data;
  },

  async getSubscriptionLimits(): Promise<{
    current_month: string;
    limits: {
      upgrade: {
        allowed: boolean;
        used_count: number;
        limit: number;
        last_change?: string;
      };
      downgrade: {
        allowed: boolean;
        used_count: number;
        limit: number;
        last_change?: string;
      };
      cancel: {
        allowed: boolean;
        used_count: number;
        limit: number;
        last_change?: string;
      };
    };
    next_reset_date: string;
  }> {
    const response = await api.get('/api/payment/subscription-limits/');
    return response.data;
  },

  async checkDowngradeAllowed(subscriptionId: number): Promise<{
    allowed: boolean;
    blocked_period?: boolean;
    days_elapsed?: number;
    days_until_allowed?: number;
    message?: string;
    policy?: string;
  }> {
    const response = await api.post('/api/payment/check-downgrade-allowed/', {
      subscription_id: subscriptionId
    });
    return response.data;
  },

  async validateSubscriptionEligibility(subscriptionId: number): Promise<{
    eligible: boolean;
    error?: string;
    current_drivers?: number;
    plan_limit?: number;
    drivers_to_remove?: number;
    plan_name?: string;
    validation_type?: string;
    message?: string;
    available_slots?: number;
  }> {
    const response = await api.post('/api/payment/validate-subscription/', {
      subscription_id: subscriptionId
    });
    return response.data;
  }
};