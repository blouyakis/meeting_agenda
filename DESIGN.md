# Design Document

## Barbara Louyakis & Aleena Karatra | Meeting Agenda Generator

CS5610 Web Development - Project 2

---

## Project Description

This web application was developed for CS5610 Web Development at Northeastern University during the Summer 2026 semester. It is a full-stack meeting agenda management tool that allows users to maintain a master employee roster, create meetings, generate structured agendas based on topic priority levels, export agendas to PDF, and email them directly to all meeting participants.

The application uses a rule-based smart agenda engine that allocates meeting time proportionally across topics based on priority tier. High priority topics receive 50% of the available time pool, medium priority topics receive 30%, and low priority topics receive 20%. Time is divided evenly among topics within each tier. If a priority tier has no topics, its percentage is redistributed proportionally across the active tiers so the agenda always fills the full meeting duration.

Users authenticate via a login and registration system secured with bcrypt password hashing and JSON Web Tokens (JWT). Authentication is handled using Passport.js with the Local Strategy to manage credential verification. Each user session is token-protected and all API routes require a valid token. The application was designed using the following technology stack:

- **Backend:** Node.js, Express 5, MongoDB (Node.js driver)
- **Frontend:** HTML5, Vanilla ES6 (ES modules), CSS3
- **Authentication:** Passport.js (Local Strategy), bcryptjs, jsonwebtoken
- **PDF Export:** PDFKit
- **Email Delivery:** Nodemailer with Ethereal SMTP
- **Dev Tools:** Nodemon, ESLint, Prettier
- **License:** MIT

There are 5 pages within the application:

- **auth.html** — Login and registration page with tabbed Log In / Register interface, email and password fields, show/hide password toggle, and Passport.js + JWT-based authentication
- **dashboard.html** — Main landing page after login showing a list of all previous meetings with a New Meeting button and navigation to the Employees page
- **employees.html** — Employee management page with a full table of all employees (name, department, email, phone) and Add / Edit / Delete functionality via modal
- **meetings.html** — New meeting creation form with title, location, start time, end time, dynamic topic input with priority selectors, and an attendee checklist drawn from the master employee list. Includes Save, Generate PDF, and Email Attendees actions
- **agenda.html** — Formatted agenda display page showing meeting title, location, time, prioritized topic list with time allotments, and attendee list. Includes Edit, Generate PDF, and Email Attendees buttons

---

## GitHub

URL: https://github.com/blouyakis/meeting_agenda

---

## Video Demonstration

URL: https://...

---

## User Personas

### General Manager

|                |                                                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Name**       | Sarah Johnson                                                                                                                                                                                                                                                                                          |
| **Age**        | 42                                                                                                                                                                                                                                                                                                     |
| **Position**   | General Manager, multi-venue restaurant group                                                                                                                                                                                                                                                          |
| **Background** | Sarah oversees multiple restaurant venues and conducts several meetings per week with her management teams. Her managers also run daily pre-shift meetings with front of house and back of house staff at each venue. Meeting responsibilities shift day to day depending on who is available to host. |
| **Goals**      | Generate structured agendas quickly that reflect both company-wide and venue-specific priorities. Distribute daily meeting agendas to all managers across venues without manually tracking who is hosting each meeting.                                                                                |
| **Device**     | MacBook Pro, iPhone, Chrome Browser                                                                                                                                                                                                                                                                    |

### Business Owner

|                |                                                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Name**       | Rachel Jones                                                                                                                                                                                                                                                                                           |
| **Age**        | 38                                                                                                                                                                                                                                                                                                     |
| **Position**   | Owner, boutique marketing agency                                                                                                                                                                                                                                                                       |
| **Background** | Rachel runs a growing marketing agency with multiple departments and a team of 20 employees. She holds weekly department head meetings and periodic all-hands meetings. As the business grows, managing who attends which meeting and what gets discussed is increasingly difficult to track manually. |
| **Goals**      | Organize her employee roster by department, quickly assemble the right attendees for each meeting, and generate focused agendas that reflect company-wide and department-specific priorities. Export and distribute agendas in advance so teams arrive prepared and meetings stay on schedule.         |
| **Device**     | Desktop PC, MacBook, Chrome Browser                                                                                                                                                                                                                                                                    |

### Project Manager

|                |                                                                                                                                                                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**       | Dyanna Prince                                                                                                                                                                                                                                                                                                    |
| **Age**        | 34                                                                                                                                                                                                                                                                                                               |
| **Position**   | Project Manager, mid-size software company                                                                                                                                                                                                                                                                       |
| **Background** | Dyanna manages many active projects simultaneously, each with its own team of developers, unique timeline, and shifting priorities. She runs recurring standups, sprint planning sessions, and stakeholder reviews every week. Each meeting requires a tailored agenda that reflects the current project status. |
| **Goals**      | Maintain a master list of team members across projects, generate structured agendas that prioritize critical items and respect time limits, and distribute agendas to attendees ahead of time. Always prints hard copies of the agenda for stakeholder meetings.                                                 |
| **Device**     | MacBook, iPad, Chrome Browser, Safari Browser                                                                                                                                                                                                                                                                    |

---

## User Stories

### Sarah Johnson, General Manager

Sarah is getting ready for a busy Tuesday at her restaurant group. She has a company-wide management meeting at 9am, a front of house pre-shift at 11am, and a back of house pre-shift at 3pm — and she does not yet know which managers will be running the latter two. She opens the Meeting Agenda Generator, logs in, and navigates to her employee roster, which she has already built out with all her managers and staff by venue. She creates the 9am meeting by entering the title, location, and start and end times, then selects her management team from the attendee checklist and enters the week's priorities as topics, marking the most time-sensitive items as high priority. She saves the meeting and the app builds a structured, time-blocked agenda instantly. She hits Email Attendees and every manager on the list receives the agenda by email before the morning shift begins. She then creates two more meetings — one for FOH and one for BOH — selects the relevant staff for each, and emails both agendas to the full rosters so that whoever ends up hosting will already have it in their inbox.

_— Sarah generated and distributed three structured agendas in under ten minutes, without needing to know in advance who would be running each meeting._

### Rachel Jones, Business Owner

Rachel is preparing for her weekly department head meeting and her quarterly all-hands. Her team has grown significantly and she can no longer keep track of who belongs in which meeting from memory. She opens the app, logs in, and navigates to the Employees page, where her full roster is organized by department. She creates the department head meeting, selects only the relevant leads from the attendee checklist, and enters the week's discussion topics with priority levels — budget review is high, a team social proposal is low. The app generates an agenda that front-loads the critical items and allocates time proportionally. She clicks Generate PDF and attaches it to her calendar invite. For the all-hands meeting she creates a new meeting, selects the entire company from the employee list, enters the company-wide topics, and emails the agenda to everyone directly from the app.

_— Rachel prepared and distributed two professional agendas in a single session without re-entering any employee contact details, and her department heads arrived to the meeting having already reviewed the agenda._

### Dyanna Prince, Project Manager

Dyanna has three project meetings before noon on Wednesday — a developer standup, a sprint planning session, and a stakeholder review. She opens the Meeting Agenda Generator, logs in, and creates each meeting one by one. For the standup she selects just the dev team from her employee roster, adds a short list of blockers and updates as low and medium priority topics, saves the meeting, and emails the agenda to the team. For the sprint planning she selects the same dev team, enters the backlog items ranked by urgency, and generates the agenda. For the stakeholder review she selects the stakeholder group, enters the milestone topics marked high priority, and generates the agenda. She clicks Generate PDF and prints several hard copies on her way to the conference room. She also emails the digital version to all stakeholders. Later in the review, she navigates back to the dashboard and pulls up last week's meeting from the previous meetings list to cross-reference what was planned.

_— Dyanna ran three meetings with three different attendee groups in one morning, produced tailored agendas for each, and had printed hard copies ready for her stakeholder review — all without leaving the app._

---

## Design Mockups

### Navigation

```
auth.html (Login / Register)
  |———— dashboard.html (Previous Meetings + New Meeting)
              |———— meetings.html (New Meeting Form)
              |          |———— agenda.html (Generated Agenda)
              |———— employees.html (Employee Management)
```

### Page View Snapshots

_Wireframes and page snapshots to be added upon completion of frontend development._
