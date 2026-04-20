---
applyTo: "**/*"
---

# run-gradle-tests

Run unit tests with Gradle. Use when user asks to run tests, run Gradle tests, or verify code changes.

Run `./gradlew test --info` in the project directory.
Do not run if the repo has no Gradle wrapper.
Ensure Java/Kotlin is available before running.

After running tests, summarize results: total, passed, failed, skipped.
If there are failures, show the failing test names and error messages.

