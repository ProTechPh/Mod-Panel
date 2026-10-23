# Data-Driven Feature Development Implementation Playbook

## 1. Hypothesis & Experiment Framing Template

- **Observation / Baseline Insight**: What user behavior, funnel drop-off, or data trend triggered this initiative?
- **Hypothesis Statement**: "If we [implement feature/variant], then [primary metric] will increase/decrease by [expected effect size] because [underlying behavioral rationale]."
- **Target Population / Segment**: Specific cohorts, user tiers, platforms, or geographic regions included/excluded.
- **Minimum Detectable Effect (MDE)**: The smallest relative difference that the experiment must reliably detect at 80% power and 95% confidence level.

---

## 2. Metric Hierarchy & Guardrails

| Metric Level | Metric Name | Definition & Grain | Direction | Target / Threshold |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | Conversion / Core Action | E.g., Proposal submission rate per visitor | Positive | +5% relative lift |
| **Secondary** | Engagement / Retention | Time-on-page, 7-day retention, click-through | Positive | Positive or neutral |
| **Guardrail** | System Performance | p95 API response time, client render time | Neutral | < 200ms degradation |
| **Guardrail** | Error Rate | HTTP 5xx errors, unhandled client exceptions | Neutral | < 0.05% error rate |
| **Guardrail** | Business Health | Churn rate, customer support ticket volume | Neutral | No statistically significant increase |

---

## 3. Analytics & Telemetry Schema Checklist

1. **Event Taxonomy**: Follow standard snake_case naming (`feature_action_context`, e.g., `matching_filter_applied`).
2. **Payload Properties**:
   - `experiment_id`: Identifier for the active experiment.
   - `variant`: `control` or `treatment_a`, `treatment_b`.
   - `user_id` / `anonymous_id`: Consistent entity identifier.
   - `session_id`: Session context.
   - `timestamp_utc`: Standardized ISO-8601 UTC timestamp.
3. **Tracking Verification**:
   - Verify client-side tracking fires exactly once per interaction.
   - Verify server-side events track critical transactions for ground truth.
   - Inspect data pipeline ingestion logs in staging before production traffic routing.

---

## 4. Feature Flag & Staged Rollout Strategy

```text
Phase 0: Internal QA / Dogfooding (0% Public, Internal Staff Only)
Phase 1: Canary Deployment (5% Traffic, 24-48 Hours) -> Monitor Guardrails & Error Logs
Phase 2: Experiment Ramp-Up (50/50 Control vs Treatment Split, 14 Days)
Phase 3: Decision Window -> Full Rollout (100%) or Revert (0%)
```

- **Kill Switch**: Ensure a toggle exists that immediately routes all traffic to `control` without requiring a redeployment.
- **Sticky Assignment**: User hashing must consistently map the same user to the same variant across sessions.

---

## 5. Experiment Analysis & Decision Rules

- **Sample Size Sufficiency**: Do not evaluate significance before reaching the calculated minimum sample size (avoid the "peeking problem").
- **Sample Ratio Mismatch (SRM) Check**: Perform a chi-square test on traffic allocation counts before evaluating metrics. If SRM p < 0.001, halt analysis and investigate traffic assignment bugs.
- **Decision Matrix**:
  - **Win**: Primary metric is statistically significant positive (p < 0.05) with no negative impact on guardrails -> **Ship 100%**.
  - **Inconclusive**: Primary metric shows no statistically significant difference within the planned run duration -> **Iterate or Abandon**.
  - **Loss / Guardrail Breach**: Primary metric negative or guardrail threshold violated -> **Roll back to Control**.
