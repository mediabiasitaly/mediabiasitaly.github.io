# MBI – Media Bias in Italy

**Technical & Functional Specification (for Codex / VS Code agent)**

---

## 0. Overview

**Language requirement**

All user-facing text on the website (titles, buttons, instructions, consent text, questions, error messages, and thank-you messages) **must be written exclusively in Italian**. No English text should appear in the public-facing interface.

This document specifies a **minimal, static, GitHub Pages–deployable website** for the project:

> **MBI – Media Bias in Italy**
> Moreno Mancosu, Fabio Torreggiani, Mario Quaranta

The site hosts an **expert survey based on pairwise comparisons** of Italian media outlets, aimed at estimating their **left–right political slant**.

Key constraints:

* Static site (GitHub Pages / github.io)
* Minimal HTML + vanilla JS only
* No backend server
* Survey items loaded from a **custom CSV** (editable before launch)
* Responses sent to **Google Forms**

This document is written to be directly usable as input for an autonomous coding agent.

---

## 1. High-level structure

### Pages

1. `index.html` – Home / Landing page
2. `survey.html` – Questionnaire (5 sections / pages)
3. `thankyou.html` – Final page + email submission

Optional:

* `admin/preview.html` – optional CSV preview/debug page (not required, but useful)

### Assets

* `/assets/style.css`
* `/assets/script.js`
* `/data/outlets.csv` (custom, replaceable)
* `/assets/logo.png` (added later by PI)

---

## 2. Home page (`index.html`)

### Content requirements

**Title**
MBI – Media Bias in Italy

**Authors**
Moreno Mancosu · Fabio Torreggiani · Mario Quaranta

**Description text** (plain text, no animation):

> This project studies the political orientation of Italian media outlets using expert evaluations.
> Participation is open until **31 March 2026**.
>
> Participants may optionally leave their email address to enter a random draw for **three Amazon vouchers worth €50 each**.

**Main CTA**

* Large button: **“Start the questionnaire”**
* Links to `survey.html`

### Technical notes

* No JS required on home page
* Keep layout responsive but minimal

---

## 3. Questionnaire logic (`survey.html`)

### Conceptual design

* Total sections: **5**
* Each section = **6 pairwise comparisons**
* Total comparisons per respondent: **30**

### Sections

1. Television news (TG)
2. TV talk shows
3. Newspapers (print + online, no distinction)
4. Radio programs
5. Mixed comparisons (mainstream + cross-media)

Each section is shown sequentially (one section per screen).

---

## 4. Pairwise comparison task (core UI)

### Question text (fixed)

> *Which of the following two media outlets is, overall, more **left-wing** in its political orientation?*

### Response options

* Outlet A
* Outlet B
* “I don’t know / Not familiar with either”

### UI layout

* Two **cards**, side by side
* Each card contains:

  * Image (from CSV `pic` field)
  * Outlet name
* Clicking a card selects it

### Accessibility

* Cards must also be selectable via keyboard
* “Don’t know” as neutral button below

---

## 5. Outlet data source (CSV-driven)

### CSV file

Path: `/data/outlets.csv`

Example format (header mandatory):

```
codename,name,type,pic
tg1,TG1,tg,https://mbi.github.io/assets/tg1.png
cartabianca,Carta Bianca (Rete4),talk,https://mbi.github.io/assets/cartabianca.png
lariachetira,L’Aria che Tira (La7),talk,https://mbi.github.io/assets/aria.png
```

### Fields

* `codename` (string, unique ID – used in data export)
* `name` (display name)
* `type` (one of: `tg`, `talk`, `radio`, `press`)
* `pic` (URL to image/logo)

### Loading behavior

* CSV loaded client-side via `fetch()`
* Parsed using minimal JS (no external libraries)
* Outlets grouped by `type`

---

## 6. Pair generation logic

### Rules

* Pairs generated **client-side** at page load
* Randomized per respondent
* Constraints:

  * Pairs only within section type (except section 5)
  * No outlet appears twice in the same section

### Section 5 (Mixed)

* Pairs drawn across types
* At least one mainstream outlet per pair (flagged manually in CSV or via hardcoded list in JS)

### Reproducibility

* Generate a `respondent_id` (UUID or timestamp hash)
* Store pairings in JS memory so navigation back does not reshuffle

---

## 7. Data collection & Google Forms integration

### Strategy

* Survey responses submitted to a **Google Form** via POST
* Google Form is created manually by PI

### Required Google Form fields

Hidden or prefilled:

* respondent_id
* timestamp

Per comparison:

* comparison_id
* outlet_left_codename
* outlet_right_codename
* chosen_outlet_codename OR `dk`
* section_type

### Implementation

* Use `fetch()` POST to Google Form endpoint
* Alternatively, use hidden `<form>` submission per section

No authentication required.

---

## 8. Final page (`thankyou.html`)

### Content

* Thank-you message
* Optional email input field

Text example:

> Thank you for participating.
> If you wish to enter the prize draw, please leave your email address below.

### Email handling

* Email submitted to **separate Google Form** (recommended)
* Explicit text:

> Email addresses will be used **only** for the prize draw and will not be linked to survey responses.

---

## 9. Minimal JavaScript requirements

Allowed:

* Vanilla JS only
* `fetch()`
* Basic DOM manipulation

Not allowed:

* Frameworks (React, Vue, etc.)
* External JS libraries

### Files

* `script.js`

  * load CSV
  * generate pairs
  * handle UI interactions
  * store responses
  * submit to Google Forms

---

## 10. Styling guidelines (`style.css`)

* Neutral colors
* White background
* Clear contrast
* No animations
* Mobile-first

---

## 11. Ethics & consent text (mandatory)

Displayed before first comparison:

> By proceeding, you confirm that you are participating voluntarily and that your responses will be used for academic research purposes only. No personally identifying information is required.

Checkbox: “I agree” (required to continue)

---

## 12. Deployment

* Host on GitHub Pages (`username.github.io/MBI`)
* Ensure relative paths
* CSV must be publicly accessible

---

## 13. Future extensions (non-implementation notes)

* Add multi-dimensional bias (coalitions)
* Add rater expertise weighting
* Add admin CSV validation page

---

**End of specification**

