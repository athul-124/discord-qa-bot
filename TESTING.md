# Testing Guide

This guide explains how to test the Discord QA Bot web dashboard locally.

## Prerequisites

- Node.js 18+
- npm
- Firebase CLI (optional, for emulator testing)

## Setup for Testing

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with test configuration (can use Firebase emulator settings).

## Testing with Firebase Emulators

### Start Firebase Emulators

```bash
firebase emulators:start
```

This will start:
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080
- Storage Emulator: http://localhost:9199
- Hosting Emulator: http://localhost:5000
- Emulator UI: http://localhost:4000

### Start Development Server

In a separate terminal:

```bash
cd web
npm run dev
```

Access the dashboard at http://localhost:3000

## Manual Testing Scenarios

### 1. Authentication Flow

#### Email/Password Login
1. Navigate to login page
2. Enter test email: `test@example.com`
3. Enter test password: `password123`
4. Click "Sign In"
5. ✓ Should redirect to dashboard

#### Magic Link Login
1. Navigate to login page
2. Check "Use magic link instead"
3. Enter email address
4. Click "Send Magic Link"
5. ✓ Should show success message
6. Check Firebase Auth Emulator UI for the magic link
7. Click the link in emulator
8. ✓ Should complete authentication and redirect

### 2. Dashboard Home

#### View Usage Metrics
1. Ensure you're logged in
2. Navigate to dashboard home (/)
3. Enter a test server ID (e.g., `123456789`)
4. ✓ Should display:
   - Monthly Usage count
   - Remaining Quota
   - Subscription Tier
   - Usage progress bar

#### Error Handling
1. Try fetching usage without server ID
2. ✓ Should show server ID input form
3. Try with invalid server ID
4. ✓ Should show error toast

### 3. Knowledge Base Upload

#### Successful File Upload
1. Navigate to Upload KB page (/upload)
2. Enter server ID
3. Drag and drop a CSV or PDF file (< 10MB)
4. ✓ File should appear in upload area
5. Click "Upload Knowledge Base"
6. ✓ Should show success toast
7. ✓ File should be cleared from upload area

#### File Validation
1. Try uploading unsupported file type (e.g., .txt, .jpg)
2. ✓ Should show error: "Invalid file type"
3. Try uploading file > 10MB
4. ✓ Should show error: "File size must be less than 10MB"

#### Drag and Drop
1. Drag a valid file over the upload area
2. ✓ Upload area should highlight
3. Drop the file
4. ✓ File should be added

#### Remove File
1. Add a file to upload area
2. Click the X button
3. ✓ File should be removed

### 4. Server Linking

#### Successful Link
1. Navigate to Link Server page (/link-server)
2. Enter Discord Server ID
3. Enter Whop Token
4. Click "Link Server"
5. ✓ Should show success message
6. ✓ Should display subscription tier
7. ✓ Server ID should be saved to localStorage

#### Free Tier
1. Link server with free tier token
2. ✓ Should show "Free" tier badge
3. Navigate to Trends page
4. ✓ Should show "Pro Feature" message

#### Pro Tier
1. Link server with pro tier token
2. ✓ Should show "Pro" tier badge
3. ✓ Should show Pro features unlocked message
4. Navigate to Trends page
5. ✓ Should display trends data

### 5. Trends & Insights (Pro Only)

#### Pro Tier Access
1. Ensure server is linked with Pro tier
2. Navigate to Trends page (/trends)
3. ✓ Should display:
   - Total Questions metric
   - Average Response Time metric
   - Top Topics count
   - Top Topics list with progress bars
   - Daily Usage chart

#### Free Tier Access
1. Link server with free tier (or no link)
2. Navigate to Trends page
3. ✓ Should show upgrade prompt
4. ✓ Should not display trends data

### 6. Navigation

#### Menu Navigation
1. Click each menu item:
   - Dashboard
   - Upload KB
   - Link Server
   - Trends
2. ✓ Each should navigate to correct page
3. ✓ Active page should be highlighted

#### Sign Out
1. Click "Sign Out" button
2. ✓ Should sign out user
3. ✓ Should redirect to login page
4. Try accessing protected route
5. ✓ Should redirect to login page

### 7. Toast Notifications

#### Success Toast
1. Perform successful action (e.g., upload file)
2. ✓ Should show green success toast
3. ✓ Toast should auto-dismiss after 5 seconds
4. ✓ Can manually dismiss with X button

#### Error Toast
1. Perform failed action (e.g., invalid file upload)
2. ✓ Should show red error toast

#### Warning Toast
1. Try accessing Pro feature without Pro tier
2. ✓ Should show yellow warning toast

### 8. Loading States

#### Page Loading
1. Navigate to dashboard with slow network (throttle in DevTools)
2. ✓ Should show loading spinner

#### Form Loading
1. Submit a form (e.g., upload file)
2. ✓ Submit button should show loading spinner
3. ✓ Submit button should be disabled

### 9. Form Validation

#### Required Fields
1. Try submitting forms without required fields
2. ✓ Browser should show validation message
3. ✓ Form should not submit

#### Email Validation
1. Try entering invalid email in login
2. ✓ Should show email validation error

### 10. Responsive Design

#### Mobile View
1. Open DevTools responsive mode
2. Test on various screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1024px+)
3. ✓ Layout should adapt properly
4. ✓ Navigation should be accessible
5. ✓ Forms should be usable

#### Touch Interactions
1. Test drag-and-drop on touch devices
2. ✓ Should work with touch events

### 11. Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

### 12. Persistence

#### LocalStorage
1. Set server ID in any form
2. Refresh page
3. ✓ Server ID should persist
4. Navigate to different pages
5. ✓ Server ID should be remembered

#### Session Persistence
1. Log in
2. Refresh page
3. ✓ Should remain logged in
4. Close tab and reopen
5. ✓ Should remain logged in (until sign out)

## Backend API Testing

If testing with a mock backend or actual backend:

### Mock API Responses

Create a mock server for testing (optional):

```javascript
// mock-server.js
const express = require('express');
const app = express();

app.get('/usage', (req, res) => {
  res.json({
    monthlyCount: 150,
    remainingQuota: 850,
    tier: 'free'
  });
});

app.post('/link-server', (req, res) => {
  res.json({
    success: true,
    tier: 'pro',
    message: 'Server linked successfully'
  });
});

app.post('/upload-kb', (req, res) => {
  res.json({
    success: true,
    message: 'File uploaded successfully',
    fileId: 'test-file-id'
  });
});

app.get('/trends', (req, res) => {
  res.json({
    totalQuestions: 1250,
    averageResponseTime: 145,
    topTopics: [
      { topic: 'Account Issues', count: 45 },
      { topic: 'Technical Support', count: 38 },
      { topic: 'Billing', count: 22 }
    ],
    dailyUsage: [
      { date: '2024-10-20', count: 45 },
      { date: '2024-10-21', count: 52 },
      { date: '2024-10-22', count: 38 }
    ]
  });
});

app.listen(3001, () => console.log('Mock server on 3001'));
```

## Automated Testing (Future)

### Unit Tests
Future implementation with Vitest:
```bash
npm run test
```

### E2E Tests
Future implementation with Playwright or Cypress:
```bash
npm run test:e2e
```

## Performance Testing

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit
4. ✓ Performance score should be > 90
5. ✓ Accessibility score should be > 90
6. ✓ Best Practices score should be > 90
7. ✓ SEO score should be > 80

### Bundle Size Analysis
```bash
cd web
npm run build
```
Check build output for bundle sizes.

## Security Testing

### Authentication
- [ ] Protected routes redirect unauthenticated users
- [ ] Tokens are properly secured
- [ ] Sign out clears all auth state

### API Calls
- [ ] All API calls include authentication token
- [ ] Sensitive data is not exposed in client
- [ ] CORS is properly configured

### Input Validation
- [ ] File upload validates file types
- [ ] File upload validates file sizes
- [ ] Form inputs are sanitized
- [ ] XSS protection is in place

## Known Issues / Limitations

When testing with emulators:
- Magic link emails are shown in emulator UI, not sent via email
- Storage operations may be slower than production
- Some Firebase features may not work identically to production

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and version
5. Screenshots/videos if applicable
6. Console errors
7. Network tab information
