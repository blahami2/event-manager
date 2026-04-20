---
applyTo: "**/*"
---

# run-detekt

Run Detekt static analysis for Kotlin. Use when user asks to run detekt or requests static analysis on Kotlin code.

Run `./gradlew detekt` in the project directory.
After running detekt, summarize findings by severity.
If there are critical issues, list them first.

Output report is at `build/reports/detekt/detekt.html`.

