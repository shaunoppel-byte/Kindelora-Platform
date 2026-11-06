# Zero-Cost Operating Principle (R0 / $0)

**Scope:** This business and all associated websites, apps, APIs, integrations, CI/CD, AI features, analytics, media, and automations.

**Founder policy:** Until sustainable revenue supports operations, no new financial commitments. No paid infrastructure, subscriptions, API credits, hosted services, paid trials that auto-renew, or card-backed provisioning without explicit founder approval. Transaction fees and free-tier limits must be evaluated before commercial activation.

## Engineering decisions
1. Prefer existing free infrastructure, reusable components, open-source tools and free allowances already verified for the account.
2. Do not assume a free tier has unlimited capacity or no billing prerequisites. Verify terms and enforce usage limits where supported.
3. Never trade away authentication, privacy, encryption, access controls, reliability or customer safety to meet R0. Defer unsafe features.
4. Design for graceful degradation, rollback, observability, and low-cost migration when revenue arrives.
5. Use offline fixtures and mock payment/provider tests before enabling live integrations; never represent simulated flows as production-ready.
6. Record any unavoidable operating cost, limit, or external dependency as a launch blocker and propose a no-cost alternative first.

## Release gate
Every deployment must pass existing CI and security tests, preserve live customer experience, and include rollback. Explicit founder approval is required before any change that can incur a charge.

**Operating motto:** Innovate first. Monetise next. Invest from revenue.
