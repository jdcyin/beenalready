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

## Adding a new post or trip

Whenever a new post is added, it must also be linked from the Mapped page:

* A single-location post gets one new `<option>` in its country's regular (non-excursion) dropdown, linking to the post, plus a marker on the main map with a matching city name so the existing auto-link script (`findUrlFor`/`urlLookup` in `mapped.njk`) picks it up automatically.
* A multi-day/multi-part trip (several day-pages sharing one hub page, like the Michinoku Trail or a future multi-day excursion) gets exactly ONE entry under Excursions, linking to the hub/overview page -- individual day-pages are never listed separately in Excursions. If specific days already have a confirmed place (e.g. the first and last day of a trip), also add those places individually to the country's regular dropdown and as markers on the main map, same as a single-location post -- placeholder/TBD days do not get their own dropdown entry or marker until they have a real place.

When scaffolding a post or trip before it happens (before there is real content or photos), do not invent narrative text. Use the placeholder `TEXT HERE` instead.

On a multi-day trip hub page, list the day cards in reverse order -- the most recent/last day at the top, Day 1 at the bottom -- matching the rest of the site's newest-first convention.

For a trip's own route map: the green marker is the start/departure point, the red marker is the end point, and yellow markers are stops along the way, with directional arrows drawn between points. Only add markers for places that are actually confirmed -- don't invent placeholder waypoints for days that aren't planned yet.

Every post/day page should show the date it was written, right under the title, as a plain `<h4>YYYY-MM-DD</h4>` line -- date only, no time. For a multi-day trip this is the day's actual date (e.g. `<h4>2026-09-14</h4>` for Day 1 of a trip that started that day).

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
