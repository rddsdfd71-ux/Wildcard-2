import posthog from "posthog-js";

export function initPostHog() {
  posthog.init("phc_x8pMj99PimbnwBSSNegTqtRHBe77aWdFtm5SCBvZpXoi", {
    api_host: "https://eu.i.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export function identifyUser(userId: number, username: string, fullName?: string | null) {
  posthog.identify(String(userId), {
    username,
    fullName: fullName || username,
  });
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

export function resetAnalytics() {
  posthog.reset();
}

export default posthog;
