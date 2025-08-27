# FreightFusion Driver Portal - User Navigation Guide

## Overview
The FreightFusion Driver Portal is a comprehensive web application designed for organization administrators to manage their fleet operations, drivers, and subscriptions. This guide provides a complete walkthrough of user navigation and functionality.

## Application Structure

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React Context + Local State
- **HTTP Client**: Axios with interceptors
- **UI Components**: Custom component library based on Radix UI

---

## User Authentication Flow

### 1. Landing Page (`/`)
- **Auto-redirect**: Automatically redirects to `/dashboard` if authenticated
- **Purpose**: Entry point that routes users to appropriate destination

### 2. Login Page (`/login`)
**URL**: `/login`
**Purpose**: User authentication

**User Journey:**
1. Enter email and password
2. Click "Sign In" button
3. **Success**: Redirect to dashboard with JWT tokens stored
4. **Error**: Display validation messages

**Features:**
- Form validation (email format, required fields)
- Password visibility toggle
- "Remember me" functionality via localStorage
- Link to registration page
- Password reset functionality

### 3. Registration Page (`/register`)
**URL**: `/register`
**Purpose**: Organization and admin user creation

**User Journey:**
1. **Personal Information**:
   - First name, last name
   - Email address
   - Phone number
   - Password with confirmation

2. **Organization Details**:
   - Organization name
   - Email domain
   - Website URL

3. **Submit Registration**:
   - Account created with email verification required
   - Automatic login after successful registration

**Features:**
- Multi-step form validation
- Real-time password strength indicator
- Email domain validation
- Organization name uniqueness check

---

## Main Dashboard Navigation

### Dashboard Layout
**URL**: `/dashboard`
**Layout**: Sidebar + Main Content Area

#### Sidebar Navigation
**Location**: Left side, collapsible
**Brand**: FleetFlow with truck icon
**User Info**: Shows logged-in user name

**Navigation Menu:**
1. **Dashboard** (Landing tab) - Overview and quick actions
2. **Drivers** - Driver management interface
3. **Subscription** - Subscription and billing management
4. **Profile** - User profile settings
5. **Settings** - Application settings
6. **Logout** - Sign out functionality

#### Header Bar
**Location**: Top of main content
**Elements**:
- Sidebar toggle button
- Current page title (capitalized)
- Organization name (right side)

---

## Page-by-Page Navigation Guide

### 1. Dashboard (Landing Tab)
**Purpose**: Overview and quick access to key functions

**Content Sections:**
- **Welcome Message**: Personalized greeting
- **Quick Stats**: Driver count, subscription status
- **Recent Activity**: Latest driver additions, subscription changes
- **Quick Actions**: Add driver, upgrade subscription buttons

**User Actions:**
- View organization summary
- Quick navigation to other sections
- Access to most common tasks

### 2. Drivers Management
**Purpose**: Complete driver lifecycle management

#### Driver List View
**Features:**
- **Data Table**: Sortable columns (name, email, license, status)
- **Search/Filter**: Real-time search by name or email
- **Pagination**: Handle large driver lists
- **Actions**: View, Edit, Delete buttons per driver

#### Add New Driver
**Trigger**: "Add Driver" button
**Modal**: `CreateDriverModal`

**Form Fields:**
1. **Personal Information**:
   - First name, last name
   - Email address
   - Phone number
   - Date of birth
   - Gender

2. **Professional Details**:
   - License number
   - License expiry date
   - Years of experience
   - Vehicle type

3. **Vehicle Information**:
   - Truck model
   - License plate number

4. **Account Setup**:
   - Password creation
   - Bio (optional)

**Validation Flow:**
1. **Subscription Check**: Verify driver slots available
2. **Form Validation**: All required fields completed
3. **Email Uniqueness**: Check for duplicate emails
4. **License Validation**: Verify license number format

**Success Flow:**
1. Driver account created
2. Email verification sent to driver
3. Driver added to organization
4. Driver list refreshed
5. Success notification displayed

#### View Driver Details
**Trigger**: Click driver name or "View" button
**Modal**: `ViewDriverModal`

**Information Displayed:**
- Complete driver profile
- Contact information
- License details
- Vehicle information
- Account status
- Join date and activity

#### Edit Driver
**Trigger**: "Edit" button in driver row
**Modal**: `EditDriverModal`

**Editable Fields:**
- Professional details (experience, vehicle type)
- License information
- Vehicle details
- Bio and profile information

**Restrictions:**
- Cannot edit personal information (name, email)
- Cannot change organization assignment

#### Delete Driver
**Trigger**: "Delete" button in driver row
**Confirmation**: Alert dialog with warning

**Process:**
1. Confirm deletion intent
2. Remove driver from organization
3. Deactivate driver account
4. Update driver count
5. Refresh driver list

### 3. Subscription Management
**Purpose**: Complete subscription lifecycle management

#### Current Subscription Tab
**Content When Active Subscription Exists:**

**Subscription Card:**
- **Header**: Plan name, type (Organization/Driver)
- **Status Badge**: Active (green) or Expired (red)
- **Details**:
  - Subscription period (start - end dates)
  - Driver slots usage (current/max with progress bar)
  - Plan features list

**Billing Cycle Limits:**
- Monthly change limits display
- Upgrade/Downgrade usage tracking
- Next reset date

**Action Buttons:**
- **Change Plan**: Navigate to Available Plans tab
- **Cancel Subscription**: Open cancellation modal

**Content When No Subscription:**
- Empty state message
- "Choose a Plan" button to navigate to plans

#### Available Plans Tab
**Purpose**: Browse and select subscription plans

**Plan Display:**
- **Grid Layout**: Responsive card grid
- **Plan Cards**: Each plan shows:
  - Name and description
  - Price per duration
  - Driver limit
  - Feature list
  - Plan tier badges (Free, Basic, Premium, Ultimate)

**Plan Categorization:**
- **Free Plans**: Gray theme
- **Basic Plans**: Blue theme  
- **Standard Plans**: Green theme
- **Premium Plans**: Purple theme with "MOST POPULAR" badge
- **Ultimate Plans**: Gold theme with "ULTIMATE" badge

**Filtering:**
- Duration filter dropdown (1 month, 3 months, etc.)
- "All Plans" option

**Plan Selection:**
1. Click plan card to select
2. Plan highlights with blue border
3. "Subscribe" button becomes active
4. Shows upgrade/downgrade badges relative to current plan

**Subscription Flow:**
1. **Validation**: Check driver limits and monthly change limits
2. **State Selection**: Choose state for tax calculation
3. **Billing Preview**: Show proration and tax breakdown
4. **Payment Processing**: Stripe checkout or credit-only completion

#### Payment History Tab
**Purpose**: Complete transaction history and reporting

**History Table:**
- **Columns**: Date, Plan, Period, Amount, Subtotal, Tax, Effective Amount, Credit Used, Credit Remaining, Status
- **Transaction Types**: Payments (green) and Refunds (red)
- **Sorting**: Most recent first
- **Details**: Expandable rows with full transaction breakdown

**Export Features:**
- **PDF Export**: Formatted report with summary statistics
- **CSV Export**: Raw data for spreadsheet analysis
- **Export Options**: Dropdown menu with both formats

**Summary Statistics:**
- Total transactions count
- Total payments and refunds
- Total amount paid
- Current billing period summary

### 4. Profile Management
**Purpose**: User account and profile settings

**Profile Information:**
- Personal details (name, email, phone)
- Organization information
- Account status and verification
- Profile picture upload
- Account creation date

**Editable Fields:**
- First name, last name
- Phone number
- Profile picture
- Bio/description

**Account Actions:**
- Change password
- Update contact information
- Email verification status

### 5. Settings
**Purpose**: Application preferences and configuration

**Settings Categories:**
- **Account Settings**: Password, email preferences
- **Notification Settings**: Email notifications, alerts
- **Organization Settings**: Organization details, branding
- **Privacy Settings**: Data sharing preferences

---

## Modal Workflows

### Subscription Upgrade/Downgrade Modal
**Trigger**: Click "Change Plan" or select plan from Available Plans

**Step 1: Plan Selection**
- Display filtered plans based on current subscription
- Show upgrade/downgrade indicators
- Highlight recommended plans
- Display driver requirement warnings

**Step 2: State Selection**
- State dropdown with tax information
- Real-time tax calculation
- Billing preview with proration breakdown

**Step 3: Confirmation**
- Final billing summary
- Payment method selection
- Terms acceptance
- Process payment or redirect to Stripe

### Cancellation Modal
**Trigger**: Click "Cancel Subscription"

**Cancellation Preview:**
- Current subscription details
- Refund calculation based on subscription age
- Policy explanation (5-day, 5-24 day blocking, 25+ day rules)
- Expected refund amount and method

**Confirmation Process:**
1. Display cancellation policy
2. Show refund breakdown
3. Confirm cancellation intent
4. Process refund (Stripe or wallet credit)
5. Update subscription status

### Driver Management Modals
**Create/Edit/View Driver Modals:**
- Form-based interfaces
- Step-by-step validation
- Real-time field validation
- Success/error feedback

---

## User Experience Features

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Adapted layouts for tablet screens
- **Desktop**: Full-featured desktop experience
- **Sidebar**: Collapsible on smaller screens

### Loading States
- **Skeleton Screens**: For data-heavy components
- **Spinner Indicators**: For quick operations
- **Progress Bars**: For multi-step processes
- **Disabled States**: During form submissions

### Error Handling
- **Toast Notifications**: Success and error messages
- **Inline Validation**: Real-time form validation
- **Error Boundaries**: Graceful error recovery
- **Retry Mechanisms**: For failed operations

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Proper focus handling in modals

### Performance Optimization
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Prevent unnecessary re-renders
- **Efficient Updates**: Optimistic UI updates
- **Caching**: API response caching where appropriate

---

## Navigation Patterns

### URL Structure
- `/` - Auto-redirect to dashboard
- `/login` - Authentication page
- `/register` - Registration page
- `/dashboard` - Main application (tab-based navigation)
- `/payment/success` - Payment completion page
- `*` - 404 Not Found page

### Tab-Based Navigation
**Within Dashboard:**
- URL remains `/dashboard`
- Tab state managed in component
- Deep linking via URL parameters (e.g., `?tab=subscription&plan=2`)
- Browser back/forward support

### Modal Navigation
- Modals overlay current page
- No URL changes for modals
- ESC key closes modals
- Click outside closes modals
- Proper focus management

### Breadcrumb Navigation
- Header shows current section
- Sidebar highlights active tab
- Modal titles indicate context
- Clear navigation hierarchy

---

## User Workflow Examples

### Complete Driver Addition Workflow
1. **Navigate**: Dashboard → Drivers tab
2. **Initiate**: Click "Add Driver" button
3. **Validate**: System checks driver slot availability
4. **Form**: Fill out driver information form
5. **Submit**: Create driver account
6. **Confirm**: Success notification and list refresh
7. **Follow-up**: Driver receives email verification

### Subscription Upgrade Workflow
1. **Navigate**: Dashboard → Subscription tab
2. **Current**: Review current subscription details
3. **Browse**: Switch to "Available Plans" tab
4. **Select**: Choose new plan (upgrade/downgrade)
5. **Validate**: System checks eligibility and limits
6. **Configure**: Select state for tax calculation
7. **Review**: Confirm billing preview with proration
8. **Payment**: Complete via Stripe or credit
9. **Success**: Redirect to success page with confirmation

### Organization Setup Workflow
1. **Register**: Create organization account
2. **Verify**: Email verification process
3. **Login**: Access dashboard for first time
4. **Subscribe**: Choose initial subscription plan
5. **Setup**: Add first drivers to organization
6. **Configure**: Set up organization preferences
7. **Operate**: Begin daily fleet management

This comprehensive navigation guide provides users with a complete understanding of how to effectively use the FreightFusion Driver Portal for all fleet management needs.