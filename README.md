# Oman Tender Intelligence SaaS

Commercial SaaS layer for Oman tender intelligence.

## Principle
The existing Oman Tender Dashboard remains completely independent and untouched. This repository is a separate customer-facing product.

## Planned capabilities
- User signup/login
- Company profile and tender preferences
- Personalized tender matching and relevance scoring
- Saved tenders and watchlists
- Deadline and tender alerts
- AI tender summaries
- Eligibility and requirement analysis
- Tender document / BOQ analysis
- Subscription plans and usage limits
- Team accounts
- Billing integration
- Admin controls

## Architecture
Existing Oman tender data/dashboard -> read-only integration boundary -> this SaaS -> customer accounts and paid features.

No credentials or production secrets belong in this repository.

## Development
The implementation will be added incrementally, keeping the existing tender collection system isolated from the commercial application.
