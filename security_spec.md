# Security Specification: PredictMaster AI 2026

## 1. Data Invariants
- A user can only access their own profile, history, and bets.
- User IDs must match the authenticated user's UID.
- Timestamps must be valid and (usually) set by the server.
- Bets must have a valid status and positive stakes/odds.
- Analysis results must be linked to a user and have a valid timestamp.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

| ID | Attack Name | Target Path | Payload | Expected Result |
|----|-------------|-------------|---------|-----------------|
| 1 | Identity Spoofing | `/users/victim_id` | `{ uid: 'victim_id', ... }` (as attacker_id) | **DENIED** |
| 2 | Privilege Escalation | `/users/attacker_id` | `{ uid: 'attacker_id', role: 'admin' }` | **DENIED** |
| 3 | Resource Poisoning (ID) | `/users/JUNK_CHAR_1KB...` | `{ ... }` | **DENIED** |
| 4 | State Shortcutting (Bet) | `/users/uid/bets/bet1` | `{ status: 'won' }` (on creation) | **DENIED** |
| 5 | Mutation of Immutable Field | `/users/uid/history/h1` | `{ timestamp: 0 }` (update) | **DENIED** |
| 6 | Ghost Field Injection | `/users/uid` | `{ verifiedByAdmin: true, ... }` | **DENIED** |
| 7 | Massive Array Attack | `/users/uid` | `{ bankroll: { balanceHistory: [...] } }` (size > 100) | **DENIED** |
| 8 | Orphaned Record | `/users/uid/history/h1` | `{ userId: 'other_uid', ... }` | **DENIED** |
| 9 | PII Leak (Read) | `/users/victim_id` | `get()` (as non-admin) | **DENIED** |
| 10 | Query Scraping | `/users/uid/history` | `list()` (without userId filter) | **DENIED** (Rules force filter) |
| 11 | Future Timestamp Spoof | `/users/uid/bets/b1` | `{ timestamp: 9999999999999 }` | **DENIED** (must be server time) |
| 12 | Negative Stake/Odd | `/users/uid/bets/b1` | `{ stake: -100, odd: -1.5 }` | **DENIED** |
