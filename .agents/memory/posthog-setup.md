---
name: PostHog EU Setup
description: PostHog analytics integration for Wild Card, EU cloud region
---

## Config
- **Key**: phc_x8pMj99PimbnwBSSNegTqtRHBe77aWdFtm5SCBvZpXoi
- **Host**: https://eu.i.posthog.com
- **Region**: EU cloud

## Integration Points
- `src/lib/analytics.ts` — initPostHog(), identifyUser(), trackEvent(), resetAnalytics()
- `src/main.tsx` — calls initPostHog() on app load
- `src/pages/AuthPage.tsx` — calls identifyUser() + trackEvent('user_signed_in'/'user_registered') after successful auth
- `src/pages/Settings.tsx` — calls resetAnalytics() on logout

**Why:** User requested EU region for GDPR compliance; person_profiles set to 'identified_only' to avoid creating anonymous profiles.
