# Contributing to InterviewKit

Thanks for your interest in improving InterviewKit! Bug reports, ideas and pull requests are all welcome.

## Table of contents

- [Reporting bugs and suggesting features](#reporting-bugs-and-suggesting-features)
- [Setting up your environment](#setting-up-your-environment)
- [Making changes](#making-changes)
- [Checks that must pass](#checks-that-must-pass)
- [Commit messages](#commit-messages)
- [Opening a pull request](#opening-a-pull-request)
- [Security issues](#security-issues)

## Reporting bugs and suggesting features

Open an [issue](https://github.com/albertsp/interviewkit/issues) and include:

- **For a bug:** what you did, what you expected, what happened instead, and your browser or OS. Screenshots and error messages help a lot.
- **For a feature:** the problem you want to solve and, if you have one, your proposed solution.

Please search existing issues first to avoid duplicates. For anything large, open an issue before writing code so we can agree on the approach.

## Setting up your environment

Follow the [Getting started](README.md#getting-started) section of the README. In short:

- Node.js 22 (see `frontend/.nvmrc`; run `nvm use` or `fnm use` inside `frontend/`)
- Python 3.12
- Docker, for the local PostgreSQL database

Use Node 22 when you touch `frontend/package.json`. A different npm version can generate a `package-lock.json` that the CI rejects.

You do **not** need a Groq key or OAuth credentials to run the test suites: they use an in-memory SQLite database and mock the AI calls.

## Making changes

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b fix/short-description
   ```
2. Keep each pull request focused on one thing. Small PRs are reviewed faster.
3. Add or update tests for any behavior you change.
4. Update the README or other docs if your change affects them.

### Project conventions

- **Backend (`backend/`):** Flask routes live in `app/routes/`, business logic and the Groq integration in `app/services/`, and models in `app/models/`. Database changes need an Alembic migration (`flask db migrate`), and the migration must be committed.
- **Frontend (`frontend/`):** pages use the Next.js App Router in `app/`; reusable components and API calls live in `src/`. Use the theme tokens already defined for colors instead of hardcoding them, so light and dark themes keep working.
- Never commit secrets. Use `.env.example` files as the template and keep `.env` files local.

## Checks that must pass

The [CI workflow](.github/workflows/ci.yml) runs on every push and pull request. Run the same checks locally before you push.

**Backend** (from `backend/`, with your virtual environment active):

```bash
pip install ruff
ruff check .
pytest --cov=app --cov-fail-under=85
```

**Frontend** (from `frontend/`):

```bash
npx tsc --noEmit
npm run lint
npm test
```

Backend coverage must stay at or above 85%.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org):

```
<type>: <short summary in the imperative>
```

Common types: `feat`, `fix`, `docs`, `test`, `chore`, `ci`, `refactor`. Add a scope when it helps, for example `fix(footer): ...`.

Examples from this repository:

```
feat: add light/dark theme toggle with a proper light color palette
fix: normalize literal escape sequences in AI-generated card text
ci: add GitHub Actions workflow running pytest and npm test
```

## Opening a pull request

1. Push your branch and open a pull request against `main`.
2. Describe **what** changed and **why**, and link the related issue if there is one.
3. For UI changes, include a screenshot or short recording, ideally in both light and dark themes.
4. Make sure the CI is green. A maintainer will review your changes and may ask for adjustments.

## Security issues

Please do not report security vulnerabilities in a public issue. Use GitHub's private
[security advisory](https://github.com/albertsp/interviewkit/security/advisories/new) form instead, so the problem can be fixed before it is disclosed.
