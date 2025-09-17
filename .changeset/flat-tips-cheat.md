---
"scaffolder-toolkit": patch
---

- Remove constant spinner when running a command and resolving the new command invocation
- Investigate and fix the problem with the lint-staged pre-commit hook failing with no reason.
- investigate the workflows to publish the packages, they seem to not work as expected mainly after releasing a new version and does not create a PR with the version bumps to main branch. Also see while after changing the release message on the PR, the commit lint workflow failed to validate the commit message.
