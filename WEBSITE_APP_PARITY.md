# Mandatory website and app feature parity

Applies to every feature, fix, content update and UX refinement across Oppel Enterprises Group.

## Definition of done
- Identify all website, installed PWA and native app surfaces, including separate repositories where applicable.
- Implement equivalent functionality, navigation, branding, authentication, membership, pricing and payment behavior wherever applicable. Prefer shared components and business logic.
- Test guest, authenticated and entitled journeys where applicable; verify mobile and desktop, installed app, cache refresh and regression behavior.
- Verify both production deployments with evidence links and record any justified platform-specific differences or outstanding gaps. Do not declare full completion until parity is verified.
- Audit existing discrepancies and raise corrective issues or PRs. For KINDRA coordinate Kindra-Platform and kindra-website.
- Preserve security, privacy, existing release approvals, production data and zero-additional-cost constraints. Never enable charging or bypass payment/security gates under this policy.

## PR evidence checklist
- [ ] Website impact and implementation
- [ ] App impact and implementation (or evidenced not applicable)
- [ ] Functional, security and UX regression checks
- [ ] Both production deployments verified
- [ ] Exceptions and remaining gaps documented
