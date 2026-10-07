# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured with Session Replay, Error Tracking, and Support enabled; health, error, support, and GitHub Issues responders are armed. The scout troop is focused on portfolio traffic and conversion quality, with two approved custom scouts, and Replay Vision has two signal-emitting monitors.

Findings will begin appearing in the [Self-driving inbox](https://eu.posthog.com/project/297618/inbox) within about 30 minutes after recordings and events arrive.

## AI data processing

Approved. The organization-level AI data-processing gate was confirmed by the setup wizard before this run.

## GitHub

The PostHog GitHub App was already connected. GitHub Issues was selected, but no warehouse source was connected: the app's accessible repository list did not contain a match for this repository directory, so its responder is enabled but dormant.

## Products enabled

| Product | Status | Notes |
| --- | --- | --- |
| Session Replay | enabled | Web `posthog.init` does not disable session recording. No recordings were returned during setup, so the scanners are armed for future sessions. |
| Error Tracking | enabled | Web `posthog.init` does not disable exception capture. |
| Support (Conversations) | enabled | An inbound email, inbox, or Slack channel is still required before tickets can arrive. |

## Signal sources

| Source product | Source type | Action |
| --- | --- | --- |
| `health_checks` | `health_issue` | Enabled. |
| `error_tracking` | `issue_created` | Enabled. |
| `error_tracking` | `issue_reopened` | Enabled. |
| `error_tracking` | `issue_spiking` | Enabled. |
| `conversations` | `ticket` | Enabled; dormant until a Support channel is connected. |
| `github` | `issue` | Enabled; dormant until a GitHub Issues warehouse source is connected. |
| `signals_scout` | `cross_source_issue` | No row created; scout findings are enabled by default. |
| `session_replay` | `session_analysis_cluster` | Deliberately skipped; Replay Vision scanners provide the replay route. |

## Connected tools

| Tool | Result |
| --- | --- |
| GitHub Issues | **Selected but no source detected (dormant).** The responder is enabled, but no warehouse source was created because this repository could not be matched to the GitHub App’s accessible repository list. |

## Scout troop

### Active scouts

| Scout | What it watches |
| --- | --- |
| General | Cross-product correlations and surfaces without a specialist. |
| Product analytics | Visitor-flow conversion and engagement regressions. |
| Web analytics | Traffic, attribution, landing-page health, and 404 patterns. |
| Web vitals | Page-level LCP, INP, CLS, and FCP regressions. |
| Hiring journey *(custom)* | Hiring-intent and enquiry conversion rates, normalized by relevant visitor volume. |
| Ask My CV engagement *(custom)* | Ask My CV question starts relative to pages that expose the feature. |

The verified scout budget is **100 runs/day**; **0** had been used at setup. The current announcement states: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

### Paused built-in scouts

- **AI observability, APM, Logs, Revenue analytics:** these products are not evidenced in this portfolio’s PostHog usage.
- **Anomaly detection, Insight alerts, Observability gaps:** no active saved insight/alert inventory was available to justify a specialist yet.
- **Conversations, Customer analytics, Data pipelines, Data warehouse, Experiments, Feature flags, Surveys, Tasks, Workflows, Skills store, MCP tool calls, PR follow-up:** the corresponding product surfaces are not currently used or not central to this site.
- **CSP violations:** no CSP-reporting configuration was found.
- **Error tracking:** covered by the native Error Tracking responders.
- **Session replay:** covered by the Replay Vision monitors below.
- **Replay vision:** left paused because there were no pre-existing observations for an aggregate analyst to inspect.
- **Inbox validation:** paused because there are no resolved Self-driving fixes to validate yet.

These scouts can be enabled later from the inbox if the portfolio adopts their corresponding surfaces.

## Custom scouts

| Scout | Discriminator | Why it adds coverage |
| --- | --- | --- |
| `signals-scout-hiring-journey` | Downstream hiring and enquiry conversion rate versus upstream relevant visitor volume. | Covers the site-specific path identified in `src/app/hire/page.tsx` and `src/lib/track.ts`; it avoids mistaking a broad traffic decline for a broken conversion path. |
| `signals-scout-ask-my-cv-engagement` | Question starts per visitor to pages that expose the feature. | Covers the feature-specific engagement path in `AskMyCV` and its API route; web analytics alone does not watch this interaction rate. |

The review ruled out error bursts and replay friction because native Error Tracking and Replay Vision already own those routes. Generic site traffic is covered by Web analytics, and portfolio demos/case-study exploration did not have a sufficiently distinct success/failure contract to justify another scheduled scout.

If either custom scout proves noisy, set its `emit` configuration to `false` in PostHog to leave it running in dry-run mode without sending reports.

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes qualifying findings into the inbox. It is the only part of this setup that spends Replay Vision quota. Scanner findings arrive at half weight and require corroboration before promotion into a report.

| Scanner | Status | Watches | Query scope | Sampling | Estimated monthly spend |
| --- | --- | --- | --- | --- | --- |
| Hiring journey breakage | Created | Visible breakage in booking, contact, and Ask My CV interactions. | Recordings that visit `/hire`, the portfolio’s identified conversion flow. | 50% | 0 observations / 0 credits at setup. |
| Portfolio visitor frustration | Created | Clear on-screen struggle with calls to action, contact submission, demos, or Ask My CV. | Sessions containing `$rageclick`; no URL filter was added. | 100% | 0 observations / 0 credits at setup. |

Both scanners emit Self-driving findings. The quota check found 2,500 credits remaining, none used, and no current scanner projections. No recordings existed when they were created, so they are armed and will start working when recordings begin. Rate observations in Replay Vision once they arrive to tune future results.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so enabled ticket signals can receive data.
- [ ] Grant this repository to the PostHog GitHub App, then connect its GitHub Issues warehouse source from [new data sources](https://eu.posthog.com/project/297618/pipeline/new/source). The enabled responder will begin working once issue data syncs.
- [ ] Confirm the PostHog reverse proxy in `next.config.ts` targets this project’s EU ingestion endpoints. It currently points `/ingest` to US endpoints while this project is hosted in EU; this may explain why no recordings or project profile were available during setup.
- [ ] Generate real site traffic after confirming ingestion so the new scouts and Replay Vision monitors can establish baselines.

## What happens next

Fresh scout configurations are picked up within about 30 minutes and draw from the daily run budget. Replay Vision monitors will process matching new recordings when they arrive. Self-driving clusters corroborated findings into reports in the inbox, where immediately actionable findings can start coding tasks.

## Files modified or created

- Created `posthog-self-driving-report.md`.

No application source files were modified by this Self-driving configuration run.
