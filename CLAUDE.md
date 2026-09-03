# CLAUDE.md

## Project overview

This repository contains my website.

I am using Claude Code to help me maintain, redesign and improve the website.

The current working branch for the redesign is `beenalready-new`.

## How to work with me

I am not an expert developer. Explain important technical decisions in simple, non-technical language.

When I ask for a significant change:

1. First inspect the relevant existing files.
2. Explain what you propose to change.
3. Tell me if the change could affect other parts of the website.
4. Make the change only after the approach is clear.
5. Check that the website still builds and works after making significant changes.

For small and obvious changes, you can make the change directly.

## Git safety

The `main` branch should be treated as the stable/live version of the website.

Development and redesign work should happen on `beenalready-new`.

Before making major changes, confirm which Git branch you are working on.

Do not merge into `main` unless I explicitly ask you to.

Do not force push, rewrite Git history, or delete branches unless I explicitly ask you to.

Do not commit or push changes unless I ask you to.

## Before changing the architecture

Before substantially restructuring the website:

* Analyse the existing website architecture.
* Understand the purpose of the existing files and folders.
* Identify dependencies between pages and components.
* Identify functionality that must be preserved.
* Propose the new structure before implementing it.

Do not delete existing functionality simply because you think it is unnecessary. Ask me if you are unsure.

## Making changes

Prefer simple, maintainable solutions over unnecessarily complicated ones.

Reuse existing components where appropriate.

Avoid creating duplicate components or styles.

Keep the folder structure logical and easy to understand.

Do not add new frameworks, major libraries or dependencies without explaining why they are needed.

Preserve existing content unless I specifically ask you to rewrite or remove it.

## Image naming convention

Local post photos and videos live in a per-country `images/` folder (e.g. `src/asia/singapore/images/`) and must be named `postname_01.jpg`, `postname_02.jpg`, etc. -- always a zero-padded 2-digit number, always after the post name, never `01_postname` or `postname_1`.

## Design

The website will undergo a substantial redesign.

Before making major design decisions, discuss the proposed direction with me.

Design should be:

* clean
* modern
* visually consistent
* responsive on desktop, tablet and mobile
* accessible
* easy to navigate

Avoid unnecessary visual clutter.

## Testing

After significant changes:

* Check for errors.
* Run the appropriate build or test commands.
* Check that existing functionality has not been accidentally broken.
* Check responsive behaviour where relevant.
* Report any problems you find.

Do not claim something works unless you have actually checked it where possible.

## Keep this file updated

As you learn more about this project, suggest useful additions or changes to `CLAUDE.md`.

Do not substantially rewrite this file without asking me first.
