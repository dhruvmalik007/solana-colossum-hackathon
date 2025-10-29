# pm-AMM and Distribution Markets – Overview

- **Scope:** Formalize mechanism design and product specifications for binary outcome markets (pm-AMM) and continuous outcome distribution markets (Distribution Markets), grounded in Paradigm research.
- **Objectives:**
  - Provide mathematically sound, capital-efficient AMMs tailored for prediction markets.
  - Map math to robust on-chain (Solana) implementations and performant APIs.
  - Translate mechanisms into intuitive Creator and Participant UX flows.
  - Define agents’ interfaces and responsibilities for guidance, quoting, and risk controls.
- **Deliverables (this folder):**
  - 01_BINARY_PM_AMM.md – Static/Dynamic pm-AMM (math, pricing, impl)
  - 02_DISTRIBUTION_MARKETS_CFMM.md – L2-invariant CFMM over distributions
  - 03_FEES_LVR_LIQUIDITY.md – LVR math, fees, liquidity schedules
  - 04_MARKET_LIFECYCLE_AND_SETTLEMENT.md – States, settlement rules
  - 05_ONCHAIN_PROGRAM_DESIGN_SOLANA.md – Accounts, instructions, numerics
  - 06_OFFCHAIN_INDEXER_AND_API.md – Endpoints, contracts, schemas
  - 07_UI_UX_MAPPINGS.md – Creator/Participant flows aligned to ux-story
  - 08_TESTING_AND_RISK.md – Tests, sims, monitoring, risk controls

## References
- Paradigm (2024-11): "pm-AMM: A Uniform AMM for Prediction Markets"
- Paradigm (2024-12): "Distribution Markets"

## Key Ideas
- pm-AMM is a uniform AMM under Gaussian score dynamics for binary outcome tokens; it controls loss-vs-rebalancing (LVR) and offers predictable LP economics, with a dynamic variant flattening expected LVR rate over time.
- Distribution Markets implement a constant-function AMM over function space with a constant L2 invariant, enabling markets over full probability distributions (continuous outcomes). Gaussian specialization admits efficient on-chain implementation with solvency constraints.

## Implementation Strategy
- Solana Anchor program for core math and state.
- Indexer for events → analytics and fast UI queries.
- API layer for quotes, trades, resolution, and streaming.
- UI with education, previews, guardrails, and accessible defaults.

## Agents Appendix (applies to all docs)
- Goals: assist creators with parametrization; assist participants with quotes, risk, and education; enforce guardrails.
- Inputs: market type/params, liquidity state, time-to-expiry, oracle state, user intents.
- Outputs: quotes, parameter suggestions, warnings, instructional copy, post-trade summaries.
- Tools: quoting endpoints, on-chain read helpers, price/time simulators, docs.
- Preconditions: wallet connected; market not expired; liquidity available.
- Postconditions: transactions submitted or quotes invalidated; UI state updated.
- Failure modes: numerics fail, near-expiry throttling, oracle delays, slippage bounds.
