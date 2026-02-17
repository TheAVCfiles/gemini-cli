# Ballet Bots Minting System Overview

The minting system rewards Ballet Bots learners with on-chain badges that track milestones across the program. Badges double as narrative artifacts—each token celebrates a choreography breakthrough, debugging achievement, or community contribution.

## Badge architecture

- **Blockchain:** Ethereum-compatible sidechain (e.g., Polygon) chosen for low fees and educator-friendly tooling.
- **Token standard:** ERC-1155 contract supporting batch minting for class cohorts while keeping metadata unique per badge.
- **Metadata hosting:** JSON descriptors stored via IPFS with fallback caching on the program server for reliable access in low-connectivity settings.
- **Access roles:**
  - _Program Director_ can update metadata templates, revoke badges in rare cases, and manage cohort configuration.
  - _Facilitators_ mint badges through a dashboard authenticated by OAuth and wallet delegation.
  - _Learners_ receive custodial wallets managed through guardian email approval; families can later export badges to a personal wallet.

## Badge types

| Badge                    | Trigger                                                                  | Metadata Highlights                                      |
| ------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `Warmup Voyager`         | Completes Module 1 collaborative warmup and sets personal learning goal. | Animated gradient background, goal statement text field. |
| `Choreo Debugger`        | Demonstrates three iterative improvements during Module 2 coding labs.   | Step-by-step code screenshots, facilitator annotations.  |
| `Sensor Storyteller`     | Designs responsive routine using at least one sensor input in Module 3.  | Sensor data capture snippet, audio mood selection.       |
| `Collaborative Composer` | Leads feedback session and documents action items in Module 4.           | Team roster, peer shout-outs.                            |
| `Stagecraft Specialist`  | Integrates lighting or costume prototype during Module 5 build week.     | Media gallery attachments, lighting preset tags.         |
| `Community Showcase`     | Performs at Module 6 showcase and completes reflection journal.          | Performance clip link, audience feedback quotes.         |

## Minting workflow

1. Facilitators track milestones through the lesson dashboard or offline worksheets.
2. At the end of each module, facilitators upload evidence (photos, notes, code snippets) through the secure minting interface.
3. The backend verifies cohort eligibility, bundles metadata, and signs a minting transaction using delegated keys.
4. Learners receive email/SMS notifications with badge previews and optional sharing links.
5. Families can claim custody by connecting a personal wallet; otherwise, tokens remain in custodial accounts managed by IntuitionLabs.

## Privacy and safety considerations

- No sensitive personal information is stored on-chain; reflections and media attachments are stored in a secure off-chain bucket with expiring URLs.
- Guardian approval is required before any learner-generated media becomes publicly viewable.
- Token metadata emphasizes learning milestones rather than competitive rankings to maintain supportive class culture.
- Contracts and dashboards undergo annual security reviews, and facilitators receive safety training for digital asset management.

## Integration with Gemini CLI

- Use Gemini CLI to draft badge narratives from facilitator notes, ensuring consistent tone and inclusive language.
- Automate metadata QA by running CLI scripts that validate JSON schema and flag missing evidence links.
- Generate celebratory showcase scripts or newsletter blurbs using the `/ask` assistant with badge metadata as context.
