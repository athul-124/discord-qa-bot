# Screenshot & Visual Asset Guide

## Overview

This guide provides instructions for capturing screenshots and creating visual assets for the Whop listing, promotional materials, and documentation. All placeholders below should be replaced with actual screenshots once the UI is ready.

## Required Screenshots

### Priority 1: Whop Listing (Required for Launch)

#### Screenshot 1: Dashboard Overview
**Filename:** `dashboard-overview.png`  
**Dimensions:** 1920x1080 (16:9)  
**Purpose:** Primary hero image for Whop listing

**What to Capture:**
- Full dashboard main view
- Show navigation sidebar (collapsed or expanded)
- Display key metrics cards (total queries, KB size, active servers)
- Include recent queries list with 3-5 sample entries
- Show upload button/section prominently
- Include profile/subscription info in header

**Setup Instructions:**
1. Create demo account with populated data
2. Set up test server with realistic metrics:
   - 237 queries this month
   - 3 documents uploaded
   - 42.3 MB storage used
   - 94% accuracy rate
3. Populate recent queries with diverse, realistic questions
4. Use production-quality sample data
5. Clear browser console before capture
6. Use standard browser zoom (100%)

**Annotations Needed:**
- None (clean screenshot)

**Tool:** Use browser screenshot tool or Figcaptor with these settings:
```bash
# Figcaptor command (placeholder)
figcaptor capture \
  --url "https://dashboard.yourbot.com" \
  --selector ".dashboard-main" \
  --viewport 1920x1080 \
  --output "dashboard-overview.png" \
  --delay 2000
```

---

#### Screenshot 2: Knowledge Base Upload Interface
**Filename:** `kb-upload.png`  
**Dimensions:** 1920x1080 (16:9)  
**Purpose:** Show ease of document management

**What to Capture:**
- Knowledge Base page with upload area prominent
- Show drag-and-drop zone (with hover state if possible)
- Display list of 4-5 uploaded documents with:
  - Document names (realistic: "FAQ.pdf", "Getting Started Guide.md", etc.)
  - File sizes
  - Upload dates
  - Status indicators (processed, processing, etc.)
- Show supported file types indicator
- Include storage usage bar

**Setup Instructions:**
1. Navigate to Knowledge Base section
2. Upload 5 realistic documents beforehand
3. Position cursor over upload zone for hover effect
4. Ensure file list shows variety of formats
5. Show storage at ~60% capacity (not empty, not full)

**Annotations Needed:**
- Optional: Arrow pointing to drag-and-drop zone with text "Drag & drop your docs here"

**Tool:** Browser screenshot or Figcaptor
```bash
figcaptor capture \
  --url "https://dashboard.yourbot.com/knowledge-base" \
  --viewport 1920x1080 \
  --output "kb-upload.png" \
  --delay 2000
```

---

#### Screenshot 3: Bot in Action (Discord)
**Filename:** `bot-response-discord.png`  
**Dimensions:** 1200x800 or native Discord width  
**Purpose:** Show bot responding to real question

**What to Capture:**
- Discord channel with 3-4 message exchange
- User asks realistic question (e.g., "How do I reset my password?")
- Bot responds with:
  - Detailed, helpful answer
  - Source attribution (e.g., "Source: Account Security Guide")
  - Bot avatar and name clearly visible
  - Timestamp showing <5s response time
- Show Discord UI naturally (channels sidebar, etc.)

**Setup Instructions:**
1. Create demo Discord server with branded channels
2. Use realistic server name and channels
3. Stage conversation:
   - Message 1: User context or previous question
   - Message 2: User asks specific question
   - Message 3: Bot's detailed response
   - Optional Message 4: User thanks bot
4. Use test bot with production-ready avatar and name
5. Ensure timestamps show realistic times
6. Use Discord light or dark mode (capture both)

**Annotations Needed:**
- None (natural Discord screenshot)

**Privacy Note:**
- Blur any real user names/avatars
- Use test accounts for staging

**Tool:** Discord's built-in screenshot (Shift + Cmd/Ctrl + S) or Snipping Tool

---

#### Screenshot 4: Analytics Dashboard
**Filename:** `analytics-dashboard.png`  
**Dimensions:** 1920x1080 (16:9)  
**Purpose:** Show insights and metrics

**What to Capture:**
- Analytics page with multiple visualization sections:
  - Line chart: Query volume over time (last 30 days)
  - Bar chart: Top 10 most common questions
  - Pie chart: Question categories breakdown
  - Table: Recent query log with timestamps and status
- Show filters/date range selector
- Include key summary stats at top

**Setup Instructions:**
1. Generate realistic demo data spanning 30 days
2. Create believable trends (e.g., spike on weekends, steady growth)
3. Use real-looking questions in "top questions" list
4. Ensure charts are colorful and professional
5. Show mixed status indicators (answered, escalated, failed)

**Sample Data:**
- Total queries: 847
- Avg response time: 2.7s
- Accuracy rate: 94%
- Top question: "How do I access the course?" (68 times)

**Annotations Needed:**
- Optional: Highlight key insights with callout boxes

**Tool:** Browser screenshot or Figcaptor
```bash
figcaptor capture \
  --url "https://dashboard.yourbot.com/analytics" \
  --viewport 1920x1080 \
  --output "analytics-dashboard.png" \
  --delay 3000
```

---

#### Screenshot 5: Bot Configuration Settings
**Filename:** `bot-settings.png`  
**Dimensions:** 1920x1080 (16:9)  
**Purpose:** Show customization options

**What to Capture:**
- Settings/Configuration page showing:
  - Bot personality selector (Formal, Friendly, Technical)
  - Response length preference slider
  - Active channels selector with checkboxes
  - Command prefix input
  - Toggle switches for features (mentions, slash commands, DMs)
  - Custom greeting message textarea
- Show save button and last saved timestamp

**Setup Instructions:**
1. Navigate to settings page
2. Fill in sample custom configurations
3. Show some toggles ON and some OFF
4. Display realistic channel list (5-7 channels)
5. Ensure UI is clean and organized

**Annotations Needed:**
- None

**Tool:** Browser screenshot or Figcaptor

---

### Priority 2: Social Media Assets

#### Social Media Card (Twitter/OG)
**Filename:** `social-card.png`  
**Dimensions:** 1200x630 (1.91:1)  
**Purpose:** OpenGraph image for link sharing

**Design Elements:**
- Discord QA Bot logo (center or left)
- Tagline: "AI-Powered Knowledge Base for Discord"
- Key benefit text: "Answer questions instantly • 24/7 • No coding required"
- Background: Brand colors with subtle geometric pattern
- Bot character/mascot illustration (if available)
- Professional but friendly design

**Tool:** Figma, Canva, or design software

**Template:**
```
[LOGO]                    Discord QA Bot
                          AI-Powered Knowledge Base

                          Transform your Discord server into
                          an intelligent support hub

                          ✓ Answer questions instantly
                          ✓ 24/7 automated support
                          ✓ Setup in 5 minutes

                          [Small bot illustration]
```

---

#### Demo GIF: Bot Response
**Filename:** `bot-demo.gif`  
**Dimensions:** 800x600  
**Duration:** 5-8 seconds  
**Purpose:** Show bot in action for social media

**What to Capture:**
1. Frame 1: User typing question (show typing indicator)
2. Frame 2: User sends message
3. Frame 3: Bot shows "thinking" indicator
4. Frame 4: Bot response appears (animate message appearing)
5. Frame 5: Hold on complete response (2 seconds)

**Tool:** ScreenToGif, LICEcap, or Figcaptor with GIF export

**Recording Instructions:**
1. Set up Discord window at 800x600
2. Record at 15 fps
3. Use Discord's compact mode
4. Keep GIF file size under 5MB
5. Loop: Yes

---

#### Feature Highlight Graphics (4 images)
**Filename:** `feature-[name].png`  
**Dimensions:** 1080x1080 (square for Instagram/LinkedIn)  
**Purpose:** Individual feature callouts

**Feature 1: Fast Responses**
- Icon: Lightning bolt
- Headline: "Lightning Fast"
- Subtext: "<5 second response times"
- Visual: Stopwatch showing 2.4s

**Feature 2: Smart Learning**
- Icon: Brain
- Headline: "Learns From Your Docs"
- Subtext: "Upload PDFs, TXT, MD, DOCX"
- Visual: Documents flowing into brain

**Feature 3: Easy Management**
- Icon: Dashboard
- Headline: "Simple Dashboard"
- Subtext: "Manage everything from one place"
- Visual: Dashboard screenshot or illustration

**Feature 4: 24/7 Support**
- Icon: Clock
- Headline: "Always Available"
- Subtext: "Never miss a question again"
- Visual: Moon/sun cycle or 24hr clock

**Tool:** Figma with template, Canva, or similar

---

### Priority 3: Documentation Screenshots

#### Screenshot 6: Setup Flow (4-part sequence)
**Filename:** `setup-step-[1-4].png`  
**Dimensions:** 1920x1080 each  
**Purpose:** Tutorial documentation

**Step 1: Subscription**
- Whop checkout page or confirmation screen
- Blur sensitive info

**Step 2: Dashboard Access**
- Login screen or welcome screen after first login
- Show "Add to Discord" button prominently

**Step 3: Bot Authorization**
- Discord OAuth screen showing permission request
- Highlight required permissions

**Step 4: First Upload**
- KB upload in progress or completed
- Show success message

**Tool:** Sequential screenshots during actual setup process

---

#### Screenshot 7: Error States
**Filename:** `error-[type].png`  
**Purpose:** Documentation for troubleshooting

**Captures Needed:**
- Bot offline message in Discord
- Upload failed error
- Subscription expired notice
- Permission denied error
- Rate limit warning

**Tool:** Trigger each error state and capture

---

### Priority 4: Video Assets

#### Demo Video (60 seconds)
**Filename:** `demo-video.mp4`  
**Dimensions:** 1920x1080 (16:9)  
**Purpose:** Whop listing, social media, YouTube

**Script & Scenes:**
1. (0-5s) Hook: Text overlay "Answering the same questions 100x a day?" over frustrated person at computer
2. (5-10s) Solution intro: Discord QA Bot logo animation with tagline
3. (10-25s) Dashboard walkthrough: 
   - Quick tour of upload interface
   - Show document processing
   - Highlight analytics
4. (25-40s) Bot in action:
   - Show Discord question
   - Bot thinking
   - Bot response appears
   - User reacts positively
5. (40-50s) Key benefits:
   - Text overlays with icons
   - "70% less support time"
   - "<5 second responses"
   - "95% accuracy"
6. (50-60s) CTA:
   - "Get started today"
   - Show URL
   - "50% off first 3 months"

**Production Notes:**
- Use screen recording software (OBS, Camtasia, ScreenFlow)
- Add background music (royalty-free)
- Include captions for accessibility
- Export at 1080p, 30fps
- File size: <50MB for Whop upload

---

#### Tutorial Video (3-5 minutes)
**Filename:** `tutorial-full-setup.mp4`  
**Purpose:** Comprehensive setup guide

**Content:**
1. Introduction (30s)
2. Purchasing/subscribing on Whop (45s)
3. Accessing dashboard (30s)
4. Adding bot to Discord (60s)
5. Uploading first document (60s)
6. Testing bot with questions (45s)
7. Exploring analytics (30s)
8. Conclusion and next steps (30s)

**Tool:** Screen recording with voiceover

---

## Screenshot Capture Checklist

### Before Capturing Any Screenshot:

- [ ] Use production-ready UI (no dev environments)
- [ ] Verify all text is readable (no Lorem Ipsum)
- [ ] Check for typos and grammar errors
- [ ] Ensure brand colors are correct
- [ ] Clear browser console (no errors visible)
- [ ] Use realistic demo data (not "Test User", "asdf", etc.)
- [ ] Hide any sensitive information (API keys, real emails)
- [ ] Disable browser extensions that might appear in UI
- [ ] Set browser to 100% zoom
- [ ] Use high-resolution display (Retina/4K if possible)
- [ ] Verify all UI elements are loaded (no loading spinners)
- [ ] Check that timestamps are realistic
- [ ] Ensure cursor is not in frame (unless demonstrating interaction)

### After Capturing:

- [ ] Verify dimensions are correct
- [ ] Check file size (optimize if >2MB)
- [ ] Rename file according to naming convention
- [ ] Save both original and optimized versions
- [ ] Add to asset library/repository
- [ ] Update this document with actual file paths
- [ ] Create thumbnails if needed
- [ ] Test images in target platforms (Whop, Twitter, etc.)

---

## Image Optimization

### For Screenshots (PNG)
```bash
# Use pngquant for compression
pngquant --quality=80-95 --ext .png --force screenshot.png

# Or ImageOptim (Mac) / TinyPNG (online)
```

### For Social Graphics (PNG/JPG)
```bash
# Convert to optimized JPG if no transparency needed
convert input.png -quality 85 output.jpg

# Or use online tools: Squoosh.app, TinyPNG
```

### For GIFs
```bash
# Use gifsicle for optimization
gifsicle -O3 --colors 256 input.gif -o output.gif

# Target: <5MB file size
```

---

## Asset Organization

### File Structure
```
assets/
├── screenshots/
│   ├── dashboard/
│   │   ├── dashboard-overview.png
│   │   ├── kb-upload.png
│   │   ├── analytics-dashboard.png
│   │   └── bot-settings.png
│   ├── discord/
│   │   ├── bot-response-light.png
│   │   ├── bot-response-dark.png
│   │   └── bot-demo.gif
│   └── setup/
│       ├── setup-step-1.png
│       ├── setup-step-2.png
│       ├── setup-step-3.png
│       └── setup-step-4.png
├── social/
│   ├── social-card.png
│   ├── feature-fast.png
│   ├── feature-smart.png
│   ├── feature-easy.png
│   └── feature-247.png
├── videos/
│   ├── demo-video.mp4
│   ├── demo-video-thumbnail.jpg
│   ├── tutorial-full-setup.mp4
│   └── tutorial-thumbnail.jpg
└── branding/
    ├── logo.png
    ├── logo.svg
    ├── icon.png
    └── brand-colors.md
```

### Naming Convention
- Use lowercase with hyphens
- Be descriptive but concise
- Include context (where it's used)
- Version if needed: `dashboard-overview-v2.png`

---

## Figcaptor Usage Guide

Figcaptor is a command-line tool for automated screenshot capture. Install and use for consistent, reproducible screenshots.

### Installation
```bash
npm install -g figcaptor
# or
yarn global add figcaptor
```

### Basic Usage
```bash
# Capture full page
figcaptor capture --url "https://dashboard.yourbot.com" --output screenshot.png

# Capture specific element
figcaptor capture --url "https://example.com" --selector ".dashboard-main" --output dashboard.png

# Set viewport size
figcaptor capture --url "https://example.com" --viewport 1920x1080 --output screenshot.png

# Add delay for animations
figcaptor capture --url "https://example.com" --delay 2000 --output screenshot.png

# Capture multiple viewports (responsive)
figcaptor capture --url "https://example.com" --viewports 1920x1080,768x1024 --output-dir ./screenshots/
```

### Batch Capture Script
Create `capture-all.sh`:
```bash
#!/bin/bash

# Dashboard screenshots
figcaptor capture --url "https://dashboard.yourbot.com" --viewport 1920x1080 --delay 2000 --output dashboard-overview.png
figcaptor capture --url "https://dashboard.yourbot.com/knowledge-base" --viewport 1920x1080 --delay 2000 --output kb-upload.png
figcaptor capture --url "https://dashboard.yourbot.com/analytics" --viewport 1920x1080 --delay 3000 --output analytics-dashboard.png
figcaptor capture --url "https://dashboard.yourbot.com/settings" --viewport 1920x1080 --delay 2000 --output bot-settings.png

echo "All screenshots captured!"
```

Run with:
```bash
chmod +x capture-all.sh
./capture-all.sh
```

---

## Alternative: Manual Screenshot Tools

If Figcaptor isn't available, use these tools:

### Mac
- **Cmd + Shift + 4**: Region select
- **Cmd + Shift + 5**: Advanced screenshot/recording options
- **CleanShot X**: Professional screenshot tool (paid)

### Windows
- **Win + Shift + S**: Snipping tool
- **ShareX**: Free, feature-rich screenshot tool
- **Greenshot**: Open-source screenshot tool

### Linux
- **Flameshot**: Powerful screenshot tool
- **GNOME Screenshot**: Built-in tool
- **Shutter**: Feature-rich option

### Browser Extensions
- **Awesome Screenshot**: Full page captures, annotations
- **Nimbus Screenshot**: Screenshots and video recording
- **GoFullPage**: Full page screenshot capture

---

## Quality Standards

### All Screenshots Must:
- ✅ Be in focus and sharp (no blur)
- ✅ Have correct colors (match brand guidelines)
- ✅ Show realistic data (no placeholder text visible)
- ✅ Be properly cropped (no unnecessary whitespace)
- ✅ Have consistent browser chrome (if visible)
- ✅ Be taken on high-DPI displays (2x resolution minimum)
- ✅ Be optimized for web (fast loading)
- ✅ Work at intended display size

### Screenshots Should Not:
- ❌ Show browser bookmarks or extensions
- ❌ Include personal information
- ❌ Have visible cursor (unless demonstrating action)
- ❌ Show developer tools open
- ❌ Include broken images or loading states
- ❌ Have console errors visible
- ❌ Use test/debug data that looks fake
- ❌ Be pixelated or compressed artifacts

---

## Accessibility Considerations

### For Documentation Screenshots:
- Include descriptive alt text in docs
- Provide text description of what's shown
- Ensure text in screenshots meets contrast requirements
- Consider adding captions below images

### For Video:
- Include closed captions/subtitles
- Provide transcript
- Ensure audio quality is clear
- Add visual cues for audio-only information

---

## Update Schedule

This document should be updated:
- When new features are added requiring new screenshots
- When UI significantly changes
- When brand guidelines update
- Before major marketing campaigns
- Quarterly review of all assets

---

## Contact for Asset Creation

**Responsible:** [Name/Role]  
**Review Required:** [Name/Role]  
**Questions:** [Email/Slack]

---

**Last Updated:** [Date]  
**Next Review:** [Date]
