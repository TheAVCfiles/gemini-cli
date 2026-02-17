# StagePort Node Schema

Use this schema for Director's Chair surfaces and supporting routes. Swap identifiers, titles, dimensions, and events per screen.

```json
{
  "id": "stageport.node.directors_chair.home",
  "title": "Director's Chair – Home",
  "layer": "Surface",
  "dimension": ["Movement", "Economy", "Safety"],
  "route": "/home",
  "inputs": ["HumanIndexSnapshot", "MoveMintEvent", "LedgerSummary"],
  "outputs": [
    "DashboardCard:Students",
    "DashboardCard:Attendance",
    "DashboardCard:Revenue",
    "Whisper:ContextCue"
  ],
  "safety_grade": "A",
  "owner": "AVC",
  "status": "active"
}
```

Example for CALLBOARD:

```json
{
  "id": "stageport.node.directors_chair.callboard",
  "title": "Callboard",
  "layer": "Surface",
  "dimension": ["Narrative", "Enterprise"],
  "route": "/callboard",
  "inputs": ["OpportunityFeed", "WhisperPrompt"],
  "outputs": ["AuditionBookmark", "GrantApplicationStart"],
  "safety_grade": "B+",
  "owner": "AVC",
  "status": "active"
}
```
