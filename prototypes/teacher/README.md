# CECS AI Learning Hub — Teacher Portal Prototype

This prototype represents the **Instructor & TA portal** for the VinUniversity College of Engineering and Computer Science (CECS) AI Learning Hub, conforming to the design patterns established in `prototypes/vin-uni` and the product requirements in `docs/research/day-01/TEAM_SYNTHESIS.md`.

## Features
- **VinUniversity CECS Branding:** VinUni Navy (`#1E3A6E`), VinUni Red (`#C8232C`), geometric shield logo.
- **Instructor Persona:** Dr. Nguyen Thanh Tung (CECS Faculty / Instructor).
- **Course Readiness & Analytics:** Displays course readiness percentages, enrolled student counts, approved materials count, and active practice quiz sets.
- **Human-in-the-Loop Curation:** Highlight alerts for AI-generated question drafts awaiting instructor review and approval into the active Question Bank.
- **Filtering & Search:** Real-time course filtering by readiness status ("Ready for Students", "Needs Review", "Processing") and text search across course names, codes, and departments.

## Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Production build
npm run build
```
