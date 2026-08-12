# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# workflow
- Always save analysis, audit, and planning outputs to `.agent/*-output.txt` files for traceability and follow-up continuity. Confidence: 0.85
- Before executing from an audit/plan, verify the outputs are non-empty, contain real content (no null/placeholder markers), and are still current against the codebase; if verifiable and up-to-date, leave them as-is and proceed rather than regenerating. Confidence: 0.85
- Create a codebase snapshot generator script (like `gen-snapshot.js`) for projects to enable external agent context sharing. Confidence: 0.75

# packages
- When working with `@arcevo/facet-*` packages, reference the published versions in the npm registry rather than the local monorepo source. Confidence: 0.65
