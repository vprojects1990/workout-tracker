# Backend Architecture

> Last updated: 2026-01-26

## Overview

The backend is a minimal Vercel Serverless Function that handles feedback submission from the mobile app. It creates GitHub Issues for bug reports and feature requests.

## Location

```
workout-tracker-api/
├── api/
│   └── feedback.ts      # Feedback endpoint
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Vercel Functions | Serverless runtime |
| TypeScript | Type safety |
| GitHub API | Issue creation |

## API Endpoint

### `POST /api/feedback`

Creates a GitHub Issue from user feedback submitted in the app.

#### Request

```typescript
interface FeedbackRequest {
  type: 'bug' | 'feature' | 'other';  // Feedback type
  subject: string;                     // Issue title
  description: string;                 // Issue body
  email?: string;                      // Optional contact email
  screenshotUrl?: string;              // Optional screenshot URL
}
```

#### Response

**Success (200)**
```json
{
  "success": true,
  "issueNumber": 42
}
```

**Validation Error (400)**
```json
{
  "error": "Subject and description are required"
}
```

**Server Error (500)**
```json
{
  "error": "Failed to create issue"
}
```

## Implementation

```typescript
// api/feedback.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, subject, description, email, screenshotUrl } = req.body;

  // Validation
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  // Build issue body
  const labels = [type || 'feedback'];
  let body = `## Description\n${description}\n`;

  if (email) {
    body += `\n## Contact\n${email}\n`;
  }

  if (screenshotUrl) {
    body += `\n## Screenshot\n![Screenshot](${screenshotUrl})\n`;
  }

  body += `\n---\n_Submitted via Workout Tracker app_`;

  // Create GitHub Issue
  const response = await fetch(
    'https://api.github.com/repos/vprojects1990/workout-tracker/issues',
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Workout-Tracker-App',
      },
      body: JSON.stringify({
        title: `[${type?.toUpperCase() || 'FEEDBACK'}] ${subject}`,
        body,
        labels,
      }),
    }
  );

  const issue = await response.json();
  return res.status(200).json({ success: true, issueNumber: issue.number });
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token with `repo` scope |

## Deployment

The API is deployed on Vercel:

1. **Production URL**: `https://workout-tracker-api.vercel.app`
2. **Auto-deploy**: On push to main branch
3. **Environment**: Set `GITHUB_TOKEN` in Vercel dashboard

## Security Considerations

- **CORS**: Allows all origins (`*`) for mobile app compatibility
- **Rate Limiting**: Relies on GitHub API rate limits
- **Token Security**: GitHub token stored in Vercel environment variables
- **Input Validation**: Basic validation for required fields

## Mobile App Integration

The mobile app calls this endpoint from `app/feedback.tsx`:

```typescript
const response = await fetch('https://workout-tracker-api.vercel.app/api/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: feedbackType,
    subject,
    description,
    email: email || undefined,
    screenshotUrl: uploadedImageUrl || undefined,
  }),
});

const result = await response.json();
if (result.success) {
  // Show success message with issue number
}
```

## Future Considerations

- **Rate Limiting**: Add custom rate limiting if abuse occurs
- **Authentication**: Add app-specific API key for security
- **Analytics**: Track feedback submission counts
- **Image Upload**: Direct image upload to cloud storage
