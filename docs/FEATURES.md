# Features Documentation

This document provides detailed information about all features in the Discord QA Bot web dashboard.

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard Home](#dashboard-home)
3. [Knowledge Base Upload](#knowledge-base-upload)
4. [Server Linking](#server-linking)
5. [Trends & Insights](#trends--insights)
6. [Global Features](#global-features)

---

## Authentication

### Email/Password Login

**Description:** Standard email and password authentication using Firebase Auth.

**User Flow:**
1. User navigates to login page
2. Enters email and password
3. Clicks "Sign In"
4. Redirected to dashboard upon success

**Features:**
- Form validation
- Error handling for invalid credentials
- Loading states during authentication
- Secure token storage

**Restrictions:**
- Only invited users can sign in
- Users must be added to Firebase Auth by administrator

---

### Magic Link Login

**Description:** Passwordless authentication via email magic link.

**User Flow:**
1. User navigates to login page
2. Checks "Use magic link instead"
3. Enters email address
4. Clicks "Send Magic Link"
5. Receives email with login link
6. Clicks link to complete authentication

**Features:**
- No password required
- Email stored in localStorage for verification
- Automatic authentication upon clicking link
- Link expires after use or timeout

**Configuration:**
```javascript
const actionCodeSettings = {
  url: window.location.origin + '/auth/complete',
  handleCodeInApp: true,
};
```

---

### Whop Token Integration (Optional)

**Description:** Allows users to authenticate using Whop subscription token.

**User Flow:**
1. User purchases subscription on Whop
2. Receives Whop authentication token
3. Backend exchanges token for Firebase custom token
4. Client signs in with custom token

**Backend Endpoint:** `POST /auth/whop-exchange`

**Benefits:**
- Seamless integration with Whop subscriptions
- Automatic tier detection
- No separate registration required

---

## Dashboard Home

### Usage Metrics Display

**Description:** Real-time display of bot usage statistics for selected server.

**Metrics Displayed:**

1. **Monthly Usage Count**
   - Total questions answered this month
   - Updates in real-time
   - Resets monthly

2. **Remaining Quota**
   - Questions remaining in current tier
   - Free tier: 1,000/month
   - Pro tier: 10,000/month

3. **Subscription Tier**
   - Current tier (Free or Pro)
   - Badge display with color coding
   - Determines feature access

**Features:**
- Server ID selection and persistence
- Automatic data refresh
- Visual progress bar showing quota usage
- Error handling for failed requests
- Loading states

**API Integration:**
```typescript
GET /usage?serverId={serverId}

Response:
{
  monthlyCount: number,
  remainingQuota: number,
  tier: 'free' | 'pro'
}
```

---

## Knowledge Base Upload

### File Upload Interface

**Description:** Drag-and-drop interface for uploading knowledge base documents.

**Supported File Types:**
- CSV (text/csv)
- PDF (application/pdf)

**File Size Limit:** 10MB

**Features:**

1. **Drag and Drop**
   - Visual feedback on drag enter/leave
   - Highlighted drop zone
   - Touch-friendly on mobile devices

2. **File Selection**
   - Standard file input as fallback
   - File type filtering in picker
   - Immediate file validation

3. **File Preview**
   - Shows selected file name
   - Displays file size
   - Remove file option

4. **Validation**
   - File type checking
   - File size verification
   - Real-time error messages

5. **Upload Process**
   - Progress indication
   - Success/error feedback
   - Automatic form reset on success

**User Flow:**
1. Enter server ID (auto-filled if previously entered)
2. Drag file or click to select
3. File appears in upload area
4. Click "Upload Knowledge Base"
5. File is uploaded and processed
6. Success message displayed

**API Integration:**
```typescript
POST /upload-kb

FormData:
- file: File
- serverId: string

Response:
{
  success: boolean,
  message: string,
  fileId?: string
}
```

**Backend Processing:**
1. File validation
2. Storage in Cloud Storage
3. Text extraction
4. Content chunking
5. Embedding generation
6. Vector database storage

---

## Server Linking

### Whop Subscription Integration

**Description:** Links Discord server with Whop subscription to unlock features.

**Purpose:**
- Verify subscription status
- Determine tier (Free or Pro)
- Enable tier-specific features
- Track server-subscription mapping

**User Flow:**
1. Navigate to "Link Server" page
2. Enter Discord Server ID
3. Enter Whop Token (from subscription purchase)
4. Click "Link Server"
5. View confirmation with tier information

**Features:**

1. **Server ID Input**
   - Validation
   - Help text with instructions
   - Persistence for convenience

2. **Whop Token Input**
   - Secure input field
   - Token validation
   - Clear error messages

3. **Success Feedback**
   - Visual confirmation
   - Tier badge display
   - Feature unlocking notification
   - Pro tier celebration for upgrades

4. **Help Information**
   - Instructions for finding server ID
   - Token acquisition guidance
   - Prerequisites checklist

**Subscription Tiers:**

### Free Tier
- 1,000 questions/month
- Basic dashboard
- Knowledge base upload
- Server linking

### Pro Tier
- 10,000 questions/month
- All Free features
- Advanced trends and insights
- Topic analysis
- Usage analytics

**API Integration:**
```typescript
POST /link-server

Request:
{
  whopToken: string,
  serverId: string
}

Response:
{
  success: boolean,
  tier: 'free' | 'pro',
  message: string
}
```

---

## Trends & Insights

### Pro Tier Exclusive Feature

**Description:** Advanced analytics and usage patterns for Pro tier subscribers.

**Access Control:**
- Automatically checks server tier
- Shows upgrade prompt for Free tier
- Displays full analytics for Pro tier

**Metrics Displayed:**

1. **Total Questions**
   - Cumulative count
   - All-time statistics
   - Historical tracking

2. **Average Response Time**
   - Measured in milliseconds
   - Performance indicator
   - Optimization insights

3. **Top Topics**
   - Most frequently asked topics
   - Count per topic
   - Visual progress bars
   - Relative popularity

4. **Daily Usage**
   - Last 7 days by default
   - Question count per day
   - Trend visualization
   - Pattern identification

**Features:**

1. **Visual Analytics**
   - Clean, modern charts
   - Color-coded metrics
   - Responsive design
   - Easy-to-understand visualizations

2. **Real-time Updates**
   - Automatic data refresh
   - Current statistics
   - Live performance metrics

3. **Export Capability (Future)**
   - Download as CSV
   - PDF reports
   - Email scheduling

**User Flow:**
1. Navigate to "Trends" page
2. System checks subscription tier
3. If Pro: Display full analytics
4. If Free: Show upgrade prompt

**API Integration:**
```typescript
GET /trends?serverId={serverId}

Response:
{
  totalQuestions: number,
  averageResponseTime: number,
  topTopics: Array<{
    topic: string,
    count: number
  }>,
  dailyUsage: Array<{
    date: string,
    count: number
  }>
}
```

**Data Aggregation:**
- Backend processes bot events
- Stores in Firestore
- Aggregates periodically
- Caches for performance

---

## Global Features

### Toast Notifications

**Description:** System-wide notification system for user feedback.

**Types:**

1. **Success** (Green)
   - Successful operations
   - Confirmations
   - Completions

2. **Error** (Red)
   - Failed operations
   - Validation errors
   - API failures

3. **Warning** (Yellow)
   - Cautionary messages
   - Permission issues
   - Deprecation notices

4. **Info** (Blue)
   - General information
   - Tips and hints
   - Status updates

**Features:**
- Auto-dismiss after 5 seconds
- Manual dismiss with X button
- Multiple toasts supported
- Stacked vertically
- Fixed position (top-right)
- Responsive on mobile

**Usage:**
```typescript
const { addToast } = useToast();
addToast('success', 'Operation completed!');
```

---

### Loading States

**Description:** Visual feedback during asynchronous operations.

**Implementations:**

1. **Full Page Loading**
   - Initial app load
   - Authentication check
   - Large data fetches

2. **Component Loading**
   - Inline spinners
   - Skeleton screens
   - Progress indicators

3. **Button Loading**
   - Spinning icon in button
   - Disabled state
   - Prevents double-submit

**Features:**
- Consistent spinner design
- Appropriate sizing
- Clear messaging
- Prevents user interaction during loading

---

### Form Validation

**Description:** Client-side validation for all forms.

**Validation Types:**

1. **Required Fields**
   - Browser native validation
   - Custom error messages
   - Visual indicators

2. **Email Format**
   - RFC 5322 compliant
   - Clear error messages
   - Real-time validation

3. **File Validation**
   - Type checking
   - Size verification
   - Immediate feedback

**Features:**
- Inline error messages
- Disabled submit until valid
- Clear validation states
- Helpful error text

---

### Navigation

**Description:** Primary navigation system.

**Features:**

1. **Responsive Menu**
   - Desktop: Horizontal navigation
   - Mobile: Hamburger menu (future)
   - Active page highlighting

2. **Menu Items**
   - Dashboard (Home icon)
   - Upload KB (Upload icon)
   - Link Server (Link icon)
   - Trends (TrendingUp icon)

3. **User Menu**
   - Display current user email
   - Sign out button
   - Profile settings (future)

**Navigation Guards:**
- Protected routes require authentication
- Redirects to login if not authenticated
- Preserves intended destination

---

### Responsive Design

**Description:** Mobile-first, responsive layout.

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Features:**
- Flexible grid system
- Touch-friendly buttons
- Readable text sizes
- Optimized images
- Stacked layouts on mobile

---

### Error Handling

**Description:** Comprehensive error handling throughout the app.

**Error Types:**

1. **Network Errors**
   - Connection failures
   - Timeouts
   - API unavailable

2. **Authentication Errors**
   - Invalid credentials
   - Expired sessions
   - Permission denied

3. **Validation Errors**
   - Invalid input
   - Missing required fields
   - Format errors

4. **Server Errors**
   - 500 errors
   - Database issues
   - Processing failures

**Features:**
- User-friendly error messages
- Technical details in console
- Retry mechanisms
- Graceful degradation
- Error boundaries (React)

---

### Session Persistence

**Description:** Maintains user session across page refreshes.

**Features:**

1. **Authentication State**
   - Firebase Auth persistence
   - Automatic token refresh
   - Session validation

2. **Local Storage**
   - Server ID persistence
   - User preferences
   - Recent selections

3. **Session Security**
   - Secure token storage
   - HttpOnly cookies
   - CSRF protection

---

## Future Features

### Planned Enhancements

1. **Advanced Analytics**
   - Custom date ranges
   - Export functionality
   - Scheduled reports
   - Comparative analysis

2. **Team Management**
   - Multi-user support
   - Role-based access
   - Activity logs
   - User invitations

3. **Customization**
   - Bot personality settings
   - Response templates
   - Branding options
   - Theme customization

4. **Integrations**
   - Slack integration
   - Webhook support
   - API access
   - Zapier integration

5. **Advanced KB Management**
   - File versioning
   - Content search
   - Bulk operations
   - KB organization

6. **Mobile App**
   - Native iOS app
   - Native Android app
   - Push notifications
   - Offline support

---

## Feature Requests

To request new features:
1. Open an issue on GitHub
2. Describe the feature
3. Explain the use case
4. Provide examples if applicable

## Support

For feature-related questions:
- Check documentation
- Review examples
- Contact support
- Join community Discord
