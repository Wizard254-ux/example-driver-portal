# FreightFusion Frontend API Integration Documentation

## Overview
This document outlines all API integrations used in the FreightFusion Driver Portal frontend application. The frontend is built with React, TypeScript, and Vite, providing a comprehensive dashboard for organization administrators to manage drivers and subscriptions.

## Base Configuration

### API Client Setup
**File**: `src/services/api.ts`

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000000,
  withCredentials: true
});
```

**Features:**
- Automatic JWT token injection via request interceptor
- Token refresh handling via response interceptor
- Automatic logout on authentication failure
- Error handling and logging

---

## Authentication APIs

### Service File: `src/services/auth.ts`

#### 1. Organization Registration
**Endpoint**: `POST /api/auth/register/organization/`
**Usage**: Register new organization with admin user

**Request Data:**
```typescript
{
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  organization_name: string;
  organization_email_domain: string;
  organization_website: string;
  user_type: string;
}
```

**Response:**
```typescript
{
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message?: string;
}
```

#### 2. User Login
**Endpoint**: `POST /api/auth/login/`
**Usage**: Authenticate user and get JWT tokens

**Request Data:**
```typescript
{
  email: string;
  password: string;
}
```

**Response**: Same as registration response
**Storage**: Tokens stored in localStorage, user data cached

#### 3. Password Management
**Endpoint**: `POST /api/auth/password/change/`
**Usage**: Change user password

**Request Data:**
```typescript
{
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}
```

#### 4. Account Activation
**Endpoint**: `GET /api/auth/email/verify/{uidb64}/{token}/`
**Usage**: Verify email address after registration

#### 5. Password Reset
**Endpoints**: 
- `POST /api/auth/password/reset/` - Request reset
- `POST /api/auth/password/reset/confirm/` - Confirm reset

---

## Driver Management APIs

### Service File: `src/services/driver.ts`

#### 1. Create Driver
**Endpoint**: `POST /api/auth/register/driver/`
**Usage**: Add new driver to organization

**Request Data:**
```typescript
{
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  license_number: string;
  license_expiry: string;
  years_of_experience: number;
  vehicle_type: string;
  truck_license_plate?: string;
  truck_model?: string;
  date_of_birth?: string;
  gender?: string;
  bio?: string;
  organization_id?: number;
  password: string;
  password_confirm: string;
}
```

#### 2. Get Drivers List
**Endpoint**: `GET /api/auth/driver-profiles/`
**Usage**: Fetch all drivers in organization

**Response:**
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: DriverProfile[];
}
```

#### 3. Get Single Driver
**Endpoint**: `GET /api/auth/driver-profiles/{id}/`
**Usage**: Fetch specific driver details

#### 4. Update Driver
**Endpoint**: `PATCH /api/auth/driver-profiles/{id}/`
**Usage**: Update driver information

#### 5. Delete Driver
**Endpoint**: `DELETE /api/auth/driver-profiles/{id}/`
**Usage**: Remove driver from organization

---

## Subscription Management APIs

### Service File: `src/services/subscription.ts`

#### 1. Get Available Subscriptions
**Endpoint**: `GET /api/payment/subscriptions/`
**Usage**: Fetch all active subscription plans
**Frontend Logic**: Automatically sorted by amount (low to high)

#### 2. Get Subscription Status
**Endpoint**: `GET /api/payment/subscription-status/`
**Usage**: Get current user's subscription details and wallet balance

**Response:**
```typescript
{
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
  driver_usage?: {
    current_drivers: number;
    max_drivers: number;
    remaining_slots: number;
    can_add_driver: boolean;
  };
  wallet_balance?: string;
}
```

#### 3. Create Checkout Session
**Endpoint**: `POST /api/payment/create-session/`
**Usage**: Initialize subscription purchase or upgrade

**Request Data:**
```typescript
{
  subscription_id: number;
  state_code?: string;
  is_upgrade?: boolean;
}
```

**Response Types:**
- **Stripe Payment**: Returns `session_url` for redirect
- **Credit Payment**: Returns `payment_completed: true` with `redirect_url`
- **Free Plan**: Immediate activation with success message

#### 4. Tax Calculation
**Endpoint**: `POST /api/payment/calculate-tax/`
**Usage**: Calculate tax for subscription amount and state

**Request Data:**
```typescript
{
  amount: number;
  state_code: string;
  city?: string;
  postal_code?: string;
  address_line1?: string;
}
```

#### 5. Proration Preview
**Endpoint**: `POST /api/payment/proration-preview/`
**Usage**: Preview pricing for subscription changes

**Response:**
```typescript
{
  proration_details?: {
    original_price: string;
    credit_applied: string;
    final_amount: string;
    days_remaining: number;
    subscription_age: number;
    tax_covered_by_credit: string;
    tax_to_pay: string;
  };
  current_subscription_details?: SubscriptionDetails;
  new_subscription_details: SubscriptionDetails;
  blocked_period?: boolean;
  message?: string;
  tax_info: {
    tax_amount: number;
    tax_rate: number;
    total_amount: number;
    state_name: string;
  };
}
```

#### 6. Subscription Validation
**Endpoint**: `POST /api/payment/validate-subscription/`
**Usage**: Pre-validate subscription eligibility (driver limits)

#### 7. Cancellation Preview
**Endpoint**: `GET /api/payment/cancellation-preview/`
**Usage**: Preview refund details before cancellation

#### 8. Cancel Subscription
**Endpoint**: `POST /api/payment/cancel-subscription/`
**Usage**: Cancel active subscription with refund processing

#### 9. Payment History
**Endpoint**: `GET /api/payment/history/`
**Usage**: Get complete payment and refund history

#### 10. Subscription Limits
**Endpoint**: `GET /api/payment/subscription-limits/`
**Usage**: Check monthly change limits (upgrade/downgrade/cancel)

#### 11. Driver Addition Validation
**Endpoint**: `POST /api/payment/validate-driver-addition/`
**Usage**: Check if organization can add more drivers

#### 12. Downgrade Permission Check
**Endpoint**: `POST /api/payment/check-downgrade-allowed/`
**Usage**: Verify if downgrade is allowed (5-25 day blocking)

#### 13. Get States List
**Endpoint**: `GET /api/payment/states/`
**Usage**: Fetch US states with tax information

---

## Organization APIs

### Service File: `src/services/organization.ts`

#### 1. Get Organization Details
**Endpoint**: `GET /api/auth/organization-admin-profiles/{id}/`
**Usage**: Fetch organization information for dashboard header

---

## Frontend API Usage Patterns

### 1. Authentication Flow
```typescript
// Login process
const response = await authService.login(credentials);
// Tokens automatically stored in localStorage
// User data cached for session
```

### 2. Protected Route Pattern
```typescript
// All API calls automatically include JWT token
// Token refresh handled transparently
// Automatic logout on 401 errors
```

### 3. Subscription Management Flow
```typescript
// 1. Validate eligibility
const validation = await subscriptionService.validateSubscriptionEligibility(planId);

// 2. Check monthly limits
const limits = await subscriptionService.getSubscriptionLimits();

// 3. Preview pricing with proration
const preview = await subscriptionService.getProrationPreview(planId, stateCode);

// 4. Create checkout session
const session = await subscriptionService.createCheckoutSession(data);

// 5. Handle response (Stripe redirect or immediate completion)
```

### 4. Driver Management Flow
```typescript
// 1. Check driver limits before adding
const validation = await subscriptionService.validateDriverAddition();

// 2. Create driver if allowed
const driver = await driverService.createDriver(driverData);

// 3. Refresh driver list
const drivers = await driverService.getDrivers();
```

### 5. Error Handling Pattern
```typescript
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  const errorData = error.response?.data;
  
  // Handle specific error types
  if (errorData?.blocked_period) {
    // Show blocking period message
  } else if (errorData?.drivers_to_remove) {
    // Show driver limit exceeded message
  } else {
    // Generic error handling
  }
}
```

### 6. State Management
- **Authentication**: Context-based with localStorage persistence
- **Subscription Data**: Component-level state with refresh patterns
- **Driver Data**: Component-level state with CRUD operations
- **UI State**: Local component state for modals, loading, etc.

### 7. Real-time Updates
- **Payment Success**: URL-based redirects with session ID
- **Subscription Changes**: Immediate data refresh after operations
- **Driver Operations**: Optimistic updates with error rollback

---

## API Integration Best Practices

### 1. Error Handling
- Consistent error message display via toast notifications
- Specific handling for business logic errors (blocked periods, limits)
- Graceful degradation for non-critical API failures

### 2. Loading States
- Component-level loading indicators
- Skeleton screens for data-heavy components
- Disabled states during operations

### 3. Data Validation
- Frontend validation before API calls
- Backend validation error display
- Real-time validation for forms

### 4. Performance Optimization
- Memoized API calls to prevent unnecessary requests
- Conditional data fetching based on user state
- Efficient re-rendering with React optimization patterns

### 5. Security
- Automatic token management
- Secure token storage
- CSRF protection via withCredentials
- Input sanitization before API calls

---

## Environment Configuration

### Development
```typescript
baseURL: 'http://localhost:8000'
```

### Production
```typescript
baseURL: process.env.VITE_API_BASE_URL || 'https://api.freightfusion.com'
```

---

## API Response Handling

### Success Responses
- Consistent data structure extraction
- Automatic data transformation (sorting, filtering)
- State updates with new data

### Error Responses
- HTTP status code handling
- Business logic error extraction
- User-friendly error messages
- Retry mechanisms for transient failures

### Loading States
- Request initiation indicators
- Progress tracking for long operations
- Completion feedback via notifications

This documentation provides a comprehensive overview of all API integrations in the FreightFusion frontend application, enabling developers to understand the complete data flow and integration patterns used throughout the application.