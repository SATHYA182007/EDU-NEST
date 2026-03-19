Build a complete "Graded Assessment & Certificate Unlock System" for an online learning platform (EduNest).

Tech Stack:
- Frontend: HTML, CSS, JavaScript (or React if already used)
- Backend: Supabase (PostgreSQL, Auth, Storage)

----------------------------------------
FEATURE REQUIREMENTS
----------------------------------------

1. COURSE FINAL ASSESSMENT
- Each course must have a "Final Assessment"
- Assessment consists of multiple-choice questions (MCQs)
- Each question has:
  - Question text
  - 4 options
  - Correct answer
  - Marks

----------------------------------------

2. PASSING LOGIC
- Passing percentage = 80% (default, but configurable per course)
- After submission:
  - Calculate score
  - Calculate percentage
- If percentage >= passing_percentage:
  → Mark as PASSED
- Else:
  → Mark as FAILED

----------------------------------------

3. DATABASE SCHEMA (SUPABASE)

Create the following tables:

Table: assessments
- id (uuid, primary key)
- course_id (uuid)
- title (text)
- total_marks (int)
- passing_percentage (int, default 80)

Table: questions
- id (uuid)
- assessment_id (uuid)
- question (text)
- options (json)
- correct_answer (text)
- marks (int)

Table: user_attempts
- id (uuid)
- user_id (uuid)
- assessment_id (uuid)
- score (int)
- percentage (float)
- is_passed (boolean)
- attempt_count (int)
- created_at (timestamp)

Table: certificates
- id (uuid)
- user_id (uuid)
- course_id (uuid)
- issued_at (timestamp)
- certificate_url (text)

----------------------------------------

4. ASSESSMENT FLOW

- User clicks "Start Final Assessment"
- Fetch questions from Supabase
- Display questions one by one or all at once
- On submit:
  - Evaluate answers
  - Calculate score & percentage
  - Save attempt in "user_attempts"

----------------------------------------

5. CERTIFICATE UNLOCK SYSTEM

- Add "Download Certificate" button in course page
- Button behavior:
  - Disabled by default
  - Enabled ONLY if user has passed (>=80%)

Frontend Logic:
IF user_attempt.is_passed == true:
    enable button
ELSE:
    disable button

----------------------------------------

6. RE-ATTEMPT SYSTEM

- If user fails:
  - Show message:
    "You scored X%. You need 80% to unlock certificate."
  - Show "Re-attempt Assessment" button
- Allow multiple attempts
- Increment attempt_count each time

----------------------------------------

7. UI REQUIREMENTS

Assessment Page:
- Clean question layout
- Radio buttons for options
- Submit button

Result Page:
- Show:
  - Score
  - Percentage
  - Status (Passed / Failed)

If Passed:
  - Show "Certificate Unlocked 🎉"
  - Enable download button

If Failed:
  - Show "Re-attempt Required"
  - Show retry button

----------------------------------------

8. CERTIFICATE GENERATION

- Generate a downloadable certificate (PDF or image)
- Include:
  - User name
  - Course name
  - Completion date
  - Score (optional)

- Store certificate in Supabase Storage
- Save URL in "certificates" table

----------------------------------------

9. SECURITY RULES

- Only authenticated users can:
  - Attempt assessments
  - View their results
  - Download certificates

- Prevent users from accessing certificate without passing

----------------------------------------

10. ADVANCED FEATURES (OPTIONAL BUT PREFERRED)

- Randomize questions order
- Add timer for assessment
- Prevent tab switching (basic warning)
- Show attempt history
- Lock assessment after passing (optional)

----------------------------------------

11. PERFORMANCE

- Optimize queries
- Use Supabase client efficiently
- Avoid duplicate submissions

----------------------------------------

12. DELIVERABLE

- Fully working assessment system
- Certificate unlock logic implemented
- Clean UI with proper state handling
- Supabase integrated backend

----------------------------------------

IMPORTANT:
- Code should be modular and scalable
- Use clear naming conventions
- Ensure mobile responsiveness
- Follow best UX practices