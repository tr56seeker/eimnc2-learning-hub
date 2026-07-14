# EIM NC II LEARNING HUB
## MASTER REHABILITATION, MODERNIZATION, AND EXPANSION PROMPT

Act as a multidisciplinary digital product rehabilitation team composed of:

- Senior Website Strategist
- Senior UX Architect
- Learning Management System Specialist
- DepEd Curriculum and Assessment Specialist
- Senior Full-Stack Next.js Engineer
- Supabase Database Architect
- Application Security Engineer
- Data Privacy and Child Protection Compliance Specialist
- Accessibility and Quality Assurance Engineer
- Product Documentation Specialist

Your task is to audit, rehabilitate, modernize, secure, and expand the existing **EIM NC II Learning Hub** of Tabunoc National High School.

This is an existing working application. It must not be rebuilt from scratch unless a verified technical limitation makes a specific replacement unavoidable.

The objective is to transform the current EIM NC II Learning Hub into a polished, reliable, scalable, and institutionally credible digital learning and assessment platform while preserving all stable and useful existing functions.

The final product must feel intentionally designed by a professional digital product studio. It must not look like a generic LMS template, a copied dashboard, or an obviously AI-generated website.

---

# 1. PROJECT IDENTITY

## Current Platform Name

**EIM NC II Learning Hub**

The system name must remain configurable through one central settings or configuration source so it may later be changed without editing multiple components.

## Institution

**School:** Tabunoc National High School  
**School ID:** 303111  
**Address:** Sangi Road, Tabunok, Talisay City, Cebu  
**Division:** Schools Division Office of Talisay City  
**Principal:** Guillermo B. Villavelez

## Initial Learning Area

Technical-Vocational-Livelihood – Industrial Arts  
Electrical Installation and Maintenance NC II

The architecture must remain capable of supporting other Junior High School and Senior High School learning areas in the future without forcing an immediate school-wide rollout.

---

# 2. PRIMARY REHABILITATION OBJECTIVE

Rehabilitate the current platform so that:

- Teachers can securely log in and manage assigned classes.
- Learners can securely log in using learner accounts.
- Learners can read online modules through a clean, article-style learning experience.
- Learners can perform activities and submit outputs.
- Learners can retake quizzes when permitted.
- Learners can take quizzes, summative assessments, and term examinations.
- Teachers can monitor learner engagement, completion, submissions, performance, and assessment integrity signals.
- Teachers can review outputs and provide feedback.
- Learners can track lesson completion, project progress, competency mastery, assessment trends, and achievements.
- Administrators can manage accounts, academic structures, permissions, and reports.
- The system can operate under realistic Philippine public-school internet, device, manpower, and budget conditions.

The rehabilitation must improve the system incrementally while preserving working data, routes, authentication, integrations, and user flows.

---

# 3. CORE REHABILITATION PRINCIPLES

Follow these principles throughout the project:

1. **Preserve before replacing.**
2. **Audit before modifying.**
3. **Stabilize before redesigning.**
4. **Secure before expanding.**
5. **Improve one controlled phase at a time.**
6. **Do not mix major visual redesign and major database restructuring in the same phase.**
7. **Do not perform destructive changes without a backup and rollback plan.**
8. **Do not deploy directly to production without validation.**
9. **Do not weaken security to make development easier.**
10. **Do not use real learner records as development seed data.**
11. **Do not expose private learner information in logs, screenshots, commits, or reports.**
12. **Do not treat monitoring signals as automatic proof of cheating.**
13. **Do not remove a working feature unless its replacement is tested and documented.**
14. **Document every created, modified, renamed, and deleted file.**
15. **Maintain compatibility with the existing project stack unless a verified limitation requires a change.**

---

# 4. EXISTING STACK AND TECHNICAL DIRECTION

Use the current project stack wherever practical.

Expected existing technology pattern:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Authentication
- Supabase PostgreSQL
- Supabase Storage
- Supabase Row-Level Security
- Vercel deployment
- Git and GitHub
- Progressive Web App features where already available

Recommended supporting tools where compatible:

- React Hook Form
- Zod
- Recharts or another lightweight chart library
- Server Actions or secured API routes
- Database migrations
- Automated linting and type checking

Do not replace the existing stack simply because another framework is newer or more fashionable.

Any proposed framework, library, or architectural replacement must include:

- Clear technical reason
- Compatibility assessment
- Migration impact
- Security impact
- Rollback plan
- Maintenance implications

---

# 5. MANDATORY SAFETY AND PRIVACY RESTRICTIONS

Never read, display, copy, commit, publish, summarize, expose, or modify the contents of:

- `.env`
- `.env.local`
- `.env.production`
- Secret configuration files
- API keys
- Supabase service-role keys
- Database passwords
- Authentication tokens
- Private certificates
- Production backups
- Learner personal data
- Learner assessment answers
- Learner submitted files
- Parent information
- Private teacher feedback
- Confidential school records

It is acceptable to identify that such files exist and are protected, but do not reveal their contents.

Do not:

- Disable Supabase Row-Level Security.
- Use the Supabase service-role key in client-side code.
- Commit real learner data.
- Place real learner names in development seed files.
- Expose storage buckets publicly without a documented legitimate purpose.
- Add hidden webcam, microphone, facial recognition, or continuous screen recording.
- Create public grade rankings.
- Display another learner’s progress, answers, feedback, or submissions.
- Create unrestricted database queries from the browser.
- Expose internal database IDs in public URLs where avoidable.
- Log sensitive form values.
- Deploy unreviewed database migrations.

---

# 6. REQUIRED DEVELOPMENT WORKFLOW

Use the following controlled workflow for every major rehabilitation phase.

## Before Editing

1. Inspect the relevant existing files.
2. Identify current working behavior.
3. Identify affected routes, components, tables, policies, and integrations.
4. List the exact files proposed for modification.
5. Identify risks.
6. Identify tests required.
7. Confirm that no protected files need to be opened.
8. Create or recommend a dedicated Git branch.

## During Editing

1. Make only changes within the approved phase.
2. Preserve unrelated working features.
3. Use small, reviewable commits.
4. Avoid unnecessary dependencies.
5. Avoid duplicated business logic.
6. Use non-destructive database migrations.
7. Keep authorization checks on the server and database layers.
8. Maintain responsive behavior.

## After Editing

1. Run linting.
2. Run type checking.
3. Run the production build.
4. Test affected roles.
5. Test mobile, tablet, and desktop layouts.
6. Test unauthorized access.
7. Report all modified files.
8. Report unresolved issues.
9. Provide rollback instructions.
10. Do not deploy unless explicitly instructed.

---

# 7. TARGET USER ROLES

Implement or rehabilitate role-based access control for the following roles.

## 7.1 Super Administrator

The Super Administrator may:

- Configure platform-wide settings.
- Manage administrator accounts.
- Manage academic years and terms.
- View all classes, subjects, users, audit logs, and system reports.
- Review security and assessment incident reports.
- Suspend and reactivate accounts.
- Manage data-retention settings.
- Monitor storage usage.
- Review system health.

The Super Administrator must not silently alter teacher grades without an authorized and audited workflow.

## 7.2 School Administrator

The School Administrator may:

- Manage teacher and learner accounts.
- Create classes and sections.
- Create subjects and learning areas.
- Assign teachers.
- Enroll learners.
- Perform approved bulk imports.
- Manage academic years and terms.
- View school-level progress summaries.
- View audit and monitoring reports.
- Reset accounts using a documented process.
- Manage announcements.

## 7.3 Teacher

Teachers may:

- View only assigned classes and learners.
- Manage assigned subjects.
- Create units and lessons.
- Create modules and activities.
- Create projects and milestones.
- Create question banks.
- Create quizzes, summative tests, and term examinations.
- Configure retakes.
- Set availability windows and time limits.
- Review submissions.
- Grade activities.
- Provide feedback.
- Return outputs for revision.
- Review assessment integrity signals.
- View progress and intervention analytics.
- Export reports within their authorized scope.
- Post class announcements.
- Issue achievements when permitted.

## 7.4 Learner

Learners may:

- View enrolled classes and subjects.
- Read published modules.
- Save lesson progress.
- Complete activities.
- Upload outputs.
- Resubmit when allowed.
- Take quizzes and examinations.
- View released results.
- View teacher feedback.
- Track progress.
- View project milestones.
- View achievements.
- View personal notifications.
- Request support.

Learners must never access another learner’s:

- Profile details
- Grades
- Assessment answers
- Output submissions
- Private feedback
- Intervention records
- Monitoring records

---

# 8. TARGET INFORMATION ARCHITECTURE

Use or migrate toward the following hierarchy:

1. Academic Year
2. Term or Quarter
3. Grade Level
4. Section
5. Learning Area
6. Subject
7. Unit
8. Competency
9. Lesson or Module
10. Activity, Project, Quiz, or Assessment

The structure must support:

- EIM NC II competencies
- DepEd curriculum organization
- TESDA-aligned competencies
- Modular and asynchronous learning
- Class suspensions
- Remediation
- Enrichment
- Performance tasks
- Practical activities
- Term-based reporting

Do not force all current content into a new hierarchy in one migration. Provide a staged migration path.

---

# 9. MODULE AND LESSON EXPERIENCE

Rehabilitate the module-reading interface into a polished editorial learning experience.

## Each Module May Include

- Lesson title
- Unit
- Competency
- Estimated completion time
- Learning objectives
- Prior knowledge check
- Introduction
- Main discussion
- Diagrams
- Images
- Tables
- Worked examples
- Safety reminders
- Key concepts
- Guided practice
- Independent practice
- Reflection
- Activity instructions
- Rubric
- Downloadable resources
- References
- Glossary
- Related lessons
- Completion indicator

## Reader Features

Include:

- Clear heading hierarchy
- Comfortable reading width
- Professional typography
- Reading progress indicator
- Table of contents
- Previous and next lesson controls
- Mark-as-complete function
- Resume-from-last-position
- Bookmarking where practical
- Estimated reading time
- Responsive images
- Accessible captions
- Mobile-friendly tables
- Distraction-reduced reading mode
- Persistent but unobtrusive progress navigation

Avoid:

- Excessive cards inside cards
- Oversized decorative headers
- Dense dashboard styling inside lessons
- Tiny body text
- Unnecessary animation
- Generic blog-template appearance

---

# 10. TEACHER CONTENT AUTHORING

Create or rehabilitate a teacher-friendly content editor.

It should support:

- Rich text
- Headings
- Lists
- Tables
- Images
- Video embeds
- Attachments
- External links
- Safety notices
- Tip boxes
- Warning boxes
- Formula or code blocks where needed
- Accordion sections
- Checkpoint questions
- Glossary entries
- References
- Rubrics
- Preview mode
- Draft autosave
- Scheduled publishing
- Version history
- Reordering of sections

All rendered content must be sanitized.

Teachers must be able to:

- Save as draft
- Preview
- Publish
- Unpublish
- Schedule
- Archive
- Duplicate
- Reuse
- Restore an earlier version where practical

---

# 11. ACTIVITIES AND OUTPUT SUBMISSION

Support the following activity types:

- Text response
- File upload
- Multiple-file upload
- Image submission
- PDF submission
- Video link
- Website link
- Checklist
- Reflection journal
- Practical activity evidence
- Project milestone
- Group output
- Offline completion with teacher verification

Each activity must support:

- Title
- Instructions
- Competency
- Learning objective
- Due date
- Availability window
- Late-submission rule
- Maximum number of submissions
- Accepted file types
- Maximum file size
- Rubric
- Teacher feedback
- Private teacher notes
- Returned-for-revision status
- Resubmission history
- Original submission timestamp
- Academic integrity declaration

Never overwrite a previous submission version.

Submission history must show:

- Version number
- Date and time
- Submitted files
- Submitted text
- Status
- Teacher response
- Score
- Revision request

---

# 12. ASSESSMENT ENGINE

Rehabilitate or build the assessment system to support:

- Practice quizzes
- Diagnostic tests
- Formative assessments
- Summative tests
- Term examinations
- Remedial assessments
- Mastery checks
- Teacher-checked assessments

## Supported Question Types

- Multiple choice
- Multiple response
- True or false
- Matching
- Identification
- Fill in the blank
- Short answer
- Essay
- Numerical answer
- Sequencing
- Image-based question
- File-upload response
- Practical performance checklist

## Assessment Features

- Question bank
- Question categories
- Competency tagging
- Difficulty level
- Bloom’s or cognitive level
- Randomized question selection
- Randomized answer choices
- Question pools
- Attempt limits
- Retake controls
- Time limits
- Availability windows
- Automatic submission
- Passing score
- Delayed result release
- Answer-key release controls
- Manual checking
- Partial scoring
- Rubric-based essay grading
- Score override with audit history
- Highest, latest, or average attempt rule
- Exact learner preview
- Frequency-of-error analysis
- Item analysis

Assessments must use server-based timing where practical.

Learner answers must autosave.

Temporary connection loss must not erase answers.

---

# 13. RESPONSIBLE ASSESSMENT INTEGRITY

Implement strong but privacy-conscious assessment integrity controls.

Monitoring signals must be treated as indicators for teacher review, not conclusive proof of cheating.

## Allowed Integrity Features

- Large question banks
- Randomized questions
- Randomized choices
- One-question-at-a-time mode
- Optional prevention of returning to previous questions
- Access code
- Availability window
- Time limit
- Server-based timing
- Signed and expiring assessment sessions
- Attempt-token validation
- Duplicate active-session detection
- Submission locking
- Autosave
- Recovery after interruption
- Copy and paste monitoring where legally and technically appropriate
- Optional right-click restriction
- Optional text-selection restriction
- Tab-switch logging
- Window-blur logging
- Fullscreen-exit logging
- Browser-refresh logging
- Connection interruption logging
- Multiple-session detection
- Unusually rapid answer pattern detection
- Similar response-pattern indicators
- Learner acknowledgment of assessment rules

## Prohibited by Default

Do not use:

- Hidden webcam recording
- Facial recognition
- Hidden microphone recording
- Continuous screen recording
- Unannounced device fingerprinting
- Automatic accusations
- Automatic disciplinary sanctions

Any future remote-proctoring feature must require:

- Explicit school authorization
- Parent and learner notice
- Privacy impact review
- Secure retention period
- Documented legitimate purpose
- Clear appeals process

---

# 14. ASSESSMENT INTEGRITY MONITORING DASHBOARD

Create a teacher-facing monitoring dashboard.

Display:

- Learner name
- Class
- Section
- Assessment
- Attempt start time
- Current progress
- Remaining time
- Connection status
- Autosave status
- Tab switches
- Fullscreen exits
- Refresh events
- Connection interruptions
- Duplicate-session alerts
- Unusual answer-speed indicators
- Submission status
- Risk indicator
- Teacher review status

## Risk Labels

Use:

- Normal
- Needs Review
- High Attention

Every risk label must be explainable.

Teachers must be able to classify an incident as:

- Reviewed—No Concern
- Reviewed—Technical Issue
- Reviewed—Learner Clarification Required
- Reviewed—Possible Assessment Violation
- Resolved
- Escalated

Maintain:

- Incident timeline
- Teacher notes
- Status history
- Reviewer identity
- Date and time
- Resolution

---

# 15. LEARNER PROGRESS DASHBOARD

The learner dashboard must prioritize:

1. Continue learning
2. Due soon
3. Missing requirements
4. Returned outputs
5. Upcoming assessments
6. Recent feedback
7. Personal progress

Show:

- Overall completion
- Lessons completed
- Activities submitted
- Missing requirements
- Late submissions
- Returned outputs
- Quiz performance
- Summative performance
- Term-exam performance
- Project completion
- Competency mastery
- Upcoming deadlines
- Recent feedback
- Achievements earned

Recommended charts:

- Subject completion ring
- Weekly progress line
- Competency mastery chart
- Assessment trend chart
- Activity-status chart
- Project milestone tracker
- Achievement timeline

Charts must be understandable on mobile devices and must not be decorative filler.

---

# 16. TEACHER MONITORING DASHBOARD

The teacher dashboard must prioritize:

1. Submissions requiring checking
2. Learners requiring intervention
3. Upcoming assessments
4. Recently published lessons
5. Assessment monitoring alerts

Show:

- Class completion rate
- Learners on track
- Learners needing intervention
- Missing outputs
- Late outputs
- Recently submitted work
- Unchecked submissions
- Assessment score distribution
- Most difficult questions
- Frequency of error
- Competency mastery gaps
- Low-participation learners
- Repeated technical interruptions
- Upcoming deadlines
- Integrity alerts
- Average feedback turnaround time

Filters must include:

- Academic year
- Term
- Subject
- Class
- Section
- Activity
- Assessment
- Learner
- Submission status
- Date range

---

# 17. PROJECT AND MILESTONE TRACKING

Support individual and group performance tasks.

Each project may include:

- Title
- Overview
- Competency
- Individual or group assignment
- Milestones
- Due dates
- Evidence requirements
- Rubric
- Progress percentage
- Teacher comments
- Revision requests
- Final submission
- Final score
- Learner reflection

Learners must see:

- Project timeline
- Current milestone
- Completed milestones
- Missing evidence
- Teacher comments
- Final status

Teachers must see:

- On-track learners
- Delayed milestones
- Missing evidence
- Submitted milestones
- Learners needing intervention
- Final project status

Group projects must support:

- Group members
- Assigned roles
- Shared submissions
- Individual reflection
- Teacher-adjusted individual contribution score

---

# 18. ACHIEVEMENT SYSTEM

Create a meaningful achievement system that supports learning.

Achievement categories may include:

- Lesson completion
- Competency mastery
- Timely submission
- Improved performance
- Project completion
- Safety compliance
- Consistent participation
- Remediation completion
- Enrichment completion
- Teacher-awarded recognition

Each achievement must include:

- Name
- Description
- Icon
- Date earned
- Subject
- Teacher
- Evidence or qualifying condition
- Visibility setting

Do not enable public leaderboards by default.

Do not create rankings that shame or expose low-performing learners.

---

# 19. FEEDBACK AND GRADING

Teachers must be able to provide:

- General comments
- Inline comments
- Rubric scores
- Criterion-level feedback
- Audio feedback where storage allows
- Annotated file feedback
- Private teacher notes
- Revision instructions

## Submission Statuses

- Not Started
- In Progress
- Submitted
- Submitted Late
- Under Review
- Returned for Revision
- Resubmitted
- Graded
- Excused
- Missing
- Archived

Every grade modification must record:

- Previous score
- Updated score
- Reason
- Teacher
- Date and time

Learners must be notified when an output is:

- Received
- Returned
- Graded
- Reopened
- Marked missing
- Given feedback

---

# 20. NOTIFICATIONS AND ANNOUNCEMENTS

Support in-app notifications for:

- New module published
- New activity assigned
- Upcoming deadline
- Assessment availability
- Submission confirmation
- Feedback received
- Returned output
- Grade released
- Class announcement
- Schedule change
- Emergency learning advisory

Notifications must:

- Link to the relevant record
- Be markable as read
- Avoid excessive duplication
- Respect role and class boundaries

---

# 21. LOW-BANDWIDTH AND OFFLINE SUPPORT

Design for entry-level Android phones and unstable mobile data.

Include:

- Lightweight pages
- Optimized images
- Lazy loading
- Reduced unnecessary animation
- Clear loading states
- Autosave with retry
- Local draft preservation where safe
- Resume after disconnection
- Downloadable modules where authorized
- Printable lessons
- Progressive Web App support
- Cached app shell
- Clear offline indicator
- Synchronization status

A short interruption must not erase learner answers or drafts.

---

# 22. DESIGN AND UX DIRECTION

The final product must look like a custom educational platform built by a professional design studio.

## Visual Personality

The platform must feel:

- Institutional
- Modern
- Calm
- Focused
- Credible
- Clean
- Human
- Friendly
- Professional
- Appropriate for a Philippine public secondary school

## Use

- Strong typography
- Clear hierarchy
- Efficient spacing
- Purposeful color
- Subtle depth
- Refined micro-interactions
- Consistent iconography
- High contrast
- Mobile-first layouts
- Restrained transitions
- Helpful empty states
- Clear errors
- Clear confirmation states

## Avoid

- Generic admin templates
- Excessive gradients
- Glassmorphism everywhere
- Oversized dashboard hero sections
- Excessive rounded cards
- Card-within-card layouts
- Random decorative blobs
- Cartoonish illustrations
- Neon colors
- Dense spreadsheet-like dashboards
- Fake statistics
- Fake testimonials
- Decorative charts
- Robotic or AI-sounding copy

---

# 23. DESIGN SYSTEM

Create or rehabilitate centralized design tokens for:

- Primary color
- Secondary color
- Accent color
- Neutral palette
- Success
- Warning
- Danger
- Information
- Typography
- Spacing
- Border radius
- Shadows
- Component dimensions
- Breakpoints
- Motion duration
- Focus states

Respect Tabunoc National High School identity.

Do not distort official logos.

Keep official marks separate from decorative UI elements.

---

# 24. TARGET PAGES

## Public

- Landing page
- About
- Help
- Privacy notice
- Terms of acceptable use
- Data privacy statement
- Login
- Forgot password
- Account activation

## Learner

- Dashboard
- My Subjects
- Subject Overview
- Module Reader
- Activities
- Submission Page
- Assessments
- Assessment Interface
- Results
- Projects
- Project Milestones
- Calendar
- Progress
- Competency Mastery
- Achievements
- Feedback
- Notifications
- Profile
- Support Request

## Teacher

- Dashboard
- My Classes
- Class Overview
- Learner Roster
- Learner Profile
- Subject Management
- Curriculum Structure
- Module Editor
- Activity Editor
- Question Bank
- Assessment Builder
- Assessment Preview
- Live Monitoring
- Incident Review
- Submission Inbox
- Grading Workspace
- Rubrics
- Projects
- Progress Analytics
- Frequency of Error
- Intervention Monitoring
- Announcements
- Reports
- Settings

## Administrator

- Dashboard
- User Management
- Teacher Management
- Learner Management
- Bulk Enrollment
- Classes and Sections
- Subjects
- Academic Years
- Terms
- Role and Permission Management
- Announcements
- Audit Logs
- Assessment Incident Summary
- Storage Monitoring
- System Settings
- Archived Records

---

# 25. DATABASE REHABILITATION

Do not replace the current database blindly.

First:

1. Inspect the existing schema.
2. Map current tables.
3. Identify duplicated or overloaded tables.
4. Identify broken relationships.
5. Identify missing constraints.
6. Identify missing indexes.
7. Identify inconsistent status values.
8. Identify tables without RLS.
9. Identify legacy fields.
10. Propose staged migrations.

The target schema may include:

- profiles
- user_roles
- academic_years
- terms
- grade_levels
- sections
- subjects
- class_subjects
- teacher_assignments
- enrollments
- units
- competencies
- lessons
- lesson_sections
- lesson_progress
- resources
- activities
- activity_submissions
- submission_versions
- rubrics
- rubric_criteria
- rubric_scores
- question_banks
- questions
- question_options
- assessments
- assessment_questions
- assessment_attempts
- assessment_answers
- assessment_events
- assessment_incidents
- grades
- grade_history
- projects
- project_groups
- project_members
- project_milestones
- milestone_submissions
- achievements
- learner_achievements
- announcements
- notifications
- feedback
- intervention_records
- audit_logs
- system_settings
- support_requests

Use UUIDs where compatible with the current schema.

Include:

- created_at
- updated_at
- created_by
- archived_at
- status fields
- foreign keys
- indexes
- uniqueness constraints
- soft deletion where institutional records must be retained

Do not place sensitive information in public or client-readable tables.

---

# 26. ROW-LEVEL SECURITY

All appropriate Supabase tables must have Row-Level Security.

Policies must ensure:

- Learners read only their own profile.
- Learners access only classes where they are enrolled.
- Learners access only published content.
- Learners access only their own submissions.
- Learners access only their own attempts.
- Learners access only their own grades.
- Learners access only their own feedback.
- Learners access only their own achievements.
- Learners access only their own notifications.
- Teachers access only assigned classes.
- Teachers access only enrolled learners in assigned classes.
- Teachers grade only authorized submissions.
- Administrators access data according to administrative scope.
- Storage files follow the same access rules as their parent records.
- Public users cannot access private materials.
- Service-role credentials never reach the browser.

Do not rely on hidden buttons or client-side route guards as the only security measure.

---

# 27. AUTHENTICATION AND ACCOUNT MANAGEMENT

Support:

- Secure login
- Account activation
- Password reset
- Session expiration
- School-managed learner usernames
- Teacher-created or administrator-created accounts
- Bulk learner import
- Forced password change
- Suspended accounts
- Archived accounts
- Logout from all sessions
- Rate limiting
- Failed-login protection
- Audit logging

Learner accounts should not require public email addresses when school-managed usernames are more practical.

Provide:

- Temporary password workflow
- First-login password change
- Secure account reset
- Documented account recovery

---

# 28. DATA PRIVACY AND CHILD PROTECTION

Apply privacy by design.

Requirements:

- Collect only necessary data.
- Do not publicly expose grades.
- Do not publicly expose progress.
- Avoid class rankings.
- Do not display full learner information in URLs.
- Limit profile photos to legitimate school purposes.
- Use role-based access.
- Log access to sensitive records where practical.
- Provide a privacy notice.
- Use configurable retention periods.
- Avoid unnecessary fingerprinting.
- Protect uploaded files from indexing.
- Restrict public sharing.
- Prevent accidental publication of private feedback.
- Clearly separate public announcements and private messages.

Do not invent policy numbers.

---

# 29. ACCESSIBILITY

Target WCAG 2.2 AA principles where feasible.

Include:

- Keyboard navigation
- Visible focus
- Semantic HTML
- Screen-reader labels
- Sufficient contrast
- Text resizing
- Reduced motion
- Alt text
- Captions
- Accessible forms
- Error summaries
- Large touch targets
- Non-color-only indicators
- Mobile-friendly controls

---

# 30. REPORTING AND EXPORTS

Provide reports for:

- Class progress
- Learner progress
- Missing requirements
- Late submissions
- Assessment results
- Frequency of error
- Competency mastery
- Item analysis
- Project completion
- Intervention monitoring
- Achievements
- Assessment incidents
- Feedback turnaround
- User activity
- Login history where authorized

Reports should support:

- Filters
- Print-friendly view
- CSV export
- PDF-ready layout
- Date generated
- Academic year
- Term
- Scope
- Prepared-by information
- Data privacy notice

Do not expose internal IDs in exported reports.

---

# 31. AUDIT TRAIL

Maintain audit records for:

- Account creation
- Role changes
- Enrollment changes
- Lesson publishing
- Assessment publishing
- Assessment configuration changes
- Submission changes
- Grade changes
- Feedback changes
- Incident classification
- Account suspension
- Record archival
- Administrative exports

Audit records should include:

- User
- Action
- Entity
- Timestamp
- Previous value where appropriate
- Updated value where appropriate
- Reason where required

Audit logs must not be editable through the standard interface.

---

# 32. ERROR HANDLING

Create professional states for:

- No internet
- Interrupted assessment
- Expired session
- Unauthorized access
- Missing content
- Upload failure
- Unsupported file
- File too large
- Duplicate submission
- Session timeout
- Server error
- Empty class
- No published modules
- No available assessment
- Account not enrolled

Messages must explain:

- What happened
- What was preserved
- What the user should do next

Do not expose stack traces, SQL errors, or security details.

---

# 33. QUALITY ASSURANCE

Test:

- Desktop
- Tablet
- Android mobile
- Slow connection
- Connection loss
- Learner role
- Teacher role
- Administrator role
- Unauthorized access
- Empty states
- Long names
- Large classes
- Large question banks
- Timed assessments
- Retakes
- Autosave
- File uploads
- Returned submissions
- Grade changes
- Archived records
- Accessibility
- Row-Level Security
- Storage access
- Build and deployment

Use synthetic data only.

---

# 34. PERFORMANCE

Prioritize:

- Fast initial load
- Efficient queries
- Pagination
- Server-side filtering
- Indexed search
- Image compression
- Lazy-loaded charts
- Minimal client JavaScript
- Cached published content
- Safe optimistic updates
- Background autosave retry
- Prevention of duplicate submission
- Avoidance of unnecessary full-table queries

Do not fetch full class or assessment datasets when summaries are sufficient.

---

# 35. REHABILITATION PHASES

## Phase 1 — Audit and Stabilization

Complete:

- Project structure audit
- Route audit
- Authentication audit
- Role audit
- Supabase schema audit
- RLS audit
- Storage audit
- Current feature inventory
- Current bug inventory
- Build validation
- Dependency review
- Mobile review
- Accessibility review
- Privacy review
- Security review
- Performance review
- Feature gap analysis

Do not modify production code during the first audit unless explicitly instructed.

### Required Phase 1 Output

1. Executive summary
2. Current stack
3. Folder structure
4. Current routes
5. Existing roles
6. Current database model
7. Current data flows
8. Working features
9. Broken features
10. Duplicate features
11. Security risks
12. Privacy risks
13. RLS risks
14. UX issues
15. Mobile issues
16. Accessibility issues
17. Performance issues
18. Reusable components
19. Refactoring candidates
20. Feature gap analysis
21. Prioritized backlog
22. Proposed target architecture
23. Proposed design direction
24. Exact Phase 2 files
25. Exact proposed database changes
26. Testing plan
27. Rollback plan

Classify every issue as:

- Critical
- High
- Medium
- Low
- Enhancement

## Phase 2 — Design System and Application Shell

Rehabilitate:

- Typography
- Color tokens
- Spacing
- Layout
- Sidebar
- Top navigation
- Mobile navigation
- Dashboard shell
- Forms
- Tables
- Buttons
- Status badges
- Empty states
- Loading states
- Error states
- Modal and drawer behavior
- Responsive breakpoints
- Accessibility focus states

Preserve authentication, roles, and data behavior.

## Phase 3 — Roles, Classes, and Learner Records

Stabilize:

- Teacher role
- Learner role
- Administrator role
- Class assignments
- Section assignments
- Subject assignments
- Learner profiles
- Duplicate records
- Archive workflow
- Account suspension
- Bulk enrollment
- Teacher access boundaries
- RLS policies

Use non-destructive migrations only.

## Phase 4 — Modules and Learning Content

Rehabilitate:

- Units
- Competencies
- Lessons
- Blog-style reader
- Table of contents
- Reading progress
- Resume lesson
- Mark complete
- Glossary
- References
- Resources
- Downloadable files
- Content editor
- Version history
- Scheduled publishing

## Phase 5 — Activities, Submissions, and Feedback

Implement or rehabilitate:

- Activity creation
- Text submission
- File upload
- Image evidence
- Version history
- Rubrics
- Teacher feedback
- Return for revision
- Resubmission
- Missing status
- Late status
- Submission notifications

## Phase 6 — Quiz and Assessment Engine

Implement or rehabilitate:

- Question bank
- Practice quizzes
- Retakes
- Summative tests
- Term exams
- Time limits
- Autosave
- Randomization
- Result release
- Manual checking
- Frequency of error
- Item analysis
- Score history

## Phase 7 — Assessment Integrity Monitoring

Implement:

- Tab-switch logging
- Fullscreen-exit logging
- Refresh logging
- Connection-loss logging
- Duplicate-session detection
- Answer-speed indicators
- Risk labels
- Incident timelines
- Teacher review
- Resolution workflow
- Audit history

## Phase 8 — Progress, Projects, and Achievements

Implement:

- Learner progress
- Competency mastery
- Project timelines
- Milestones
- Achievement chart
- Missing-output tracker
- Intervention monitoring
- Teacher analytics

## Phase 9 — Reporting and Administration

Implement:

- Class reports
- Learner reports
- Assessment reports
- Missing outputs
- Item analysis
- Intervention reports
- Audit logs
- CSV export
- Print-ready reports
- Account administration
- Class administration
- Academic-year administration

## Phase 10 — Security, Optimization, and Deployment

Complete:

- RLS testing
- Storage-policy testing
- Role-access testing
- Mobile testing
- Accessibility audit
- Performance optimization
- Migration validation
- Backup plan
- Staging deployment
- User acceptance testing
- Production rollout
- Rollback procedure
- Documentation

---

# 36. CODING STANDARDS

Use:

- TypeScript strict mode
- Small reusable components
- Clear naming
- Feature-based organization
- Server-side authorization
- Zod validation
- Centralized constants
- Centralized role definitions
- Centralized status values
- Reusable query functions
- Non-destructive migrations
- Clear error handling

Avoid:

- `any` without justification
- Duplicated business logic
- Hard-coded production credentials
- Fake production records
- Client-only security
- Direct unvalidated mutations
- Silent catch blocks
- Destructive migration
- Placeholder replacements for working features
- Unnecessary dependencies

Use comments only for non-obvious logic.

---

# 37. USER EXPERIENCE COPY

Use wording that is:

- Clear
- Human
- Respectful
- Age-appropriate
- Concise
- Action-oriented

Preferred examples:

- Continue Learning
- Submit Activity
- Return for Revision
- Missing Requirement
- Needs Teacher Review
- Assessment Available
- Attempt Submitted
- Connection Interrupted—Your answers are being preserved

Avoid robotic phrases such as:

- Execute submission
- Data successfully processed
- User entity created
- Operation completed successfully

---

# 38. ACCEPTANCE CRITERIA

The rehabilitation will be considered successful when:

1. Current working features remain available.
2. Teachers and learners can securely log in.
3. Administrators can manage users and academic structures.
4. Teachers can publish modules.
5. Learners can read modules and save progress.
6. Teachers can create activities.
7. Learners can submit and resubmit outputs.
8. Teachers can grade and provide feedback.
9. Teachers can create quizzes using a question bank.
10. Learners can take timed assessments with autosave.
11. Teachers can configure retakes.
12. The system records integrity signals.
13. Teachers can review and resolve incidents.
14. Learners can view progress, projects, trends, and achievements.
15. Teachers can identify missing outputs and intervention needs.
16. RLS prevents cross-class and cross-learner access.
17. The interface works on Android, tablet, laptop, and desktop.
18. Temporary connection loss does not erase answers.
19. Reports can be filtered and exported.
20. Audit logs record major actions.
21. The visual design feels custom, polished, and institutionally credible.
22. Existing production data remains intact.
23. All major migrations have rollback procedures.
24. The production build passes.
25. No protected secret is exposed.

---

# 39. REQUIRED OUTPUT BEFORE ANY MAJOR IMPLEMENTATION

Before writing or modifying production code, provide:

1. Executive product summary
2. Existing-system audit
3. Reusable components
4. Technical debt summary
5. Security risks
6. Privacy risks
7. Accessibility issues
8. Performance issues
9. Architecture recommendation
10. User-role permission matrix
11. Site map
12. Core user flows
13. Database relationship plan
14. Proposed schema changes
15. RLS strategy
16. Assessment integrity strategy
17. Design-system direction
18. Recommended folder structure
19. Phased rehabilitation plan
20. Migration considerations
21. Exact files proposed for the next phase
22. Exact database changes proposed
23. Testing strategy
24. Rollback plan

Do not proceed to the next phase until explicitly approved.

---

# 40. FINAL PRODUCT STANDARD

The rehabilitated EIM NC II Learning Hub must feel like a purpose-built educational platform for Tabunoc National High School.

Every screen must demonstrate:

- Clear educational purpose
- Strong information hierarchy
- Secure access control
- Respect for learner privacy
- Reliable teacher workflow
- Mobile usability
- Academic accountability
- Thoughtful visual design
- Institutional credibility
- Long-term maintainability

Prioritize dependable learning workflows over decorative features.

Build incrementally.

Validate each phase.

Preserve working data.

Protect learner privacy.

Maintain a clear audit trail of technical and academic decisions.

---

# 41. STARTING INSTRUCTION FOR THE DEVELOPMENT AGENT

Read this file in full.

Treat it as the long-term rehabilitation specification for the existing EIM NC II Learning Hub.

For the first session, complete only **Phase 1 — Audit and Stabilization**.

Do not modify production code.

Do not access or expose protected files or private records.

Do not deploy.

Return the complete Phase 1 audit, prioritized backlog, proposed Phase 2 scope, exact files proposed for modification, exact database changes proposed, testing plan, and rollback plan.

Wait for explicit approval before implementing Phase 2.
