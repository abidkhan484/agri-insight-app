# Tools Setup & Usage Guide

## Prerequisites

- Node.js 24 (LTS)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Installation

1. `cd src`
2. `npm install`
3. `cp .env.example .env` (fill in your `BOT_TOKEN`)

## Commands

- `npm run db:init` - Initialize the local SQLite database.
- `npm run lint` - Run quality checks (Zero warnings allowed).
- `npm run format` - Auto-fix formatting.
- `npm start` - Launch the bot and scheduler.

## Pre-commit Hooks

The project uses Husky to prevent commits that fail linting. If a commit fails, run `npm run lint` to see the errors and fix them.
