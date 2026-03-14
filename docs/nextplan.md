PROJECT CONTEXT
I am building a Student Learning Platform. Currently my project only has UI pages such as Dashboard, Library, Browse, Upload, and Download options. The UI should NOT be changed. Only backend functionality and logic should be added.

The platform currently has no working interactions. I want to connect the project with Supabase and implement Version 1 and Version 2 features of the platform.

TECH STACK
Frontend: Detect the framework used in the project (React / Next.js / Vanilla JS) and implement accordingly.
Backend: Supabase (Database + Storage)

IMPORTANT
Do not modify or redesign the existing UI. Only connect the UI components with backend functionality.

--------------------------------

VERSION 1 FEATURES (CORE PLATFORM)

1. NOTES UPLOAD SYSTEM
Users should be able to upload notes.

Upload form should include:
- title
- subject
- description
- file upload (PDF, DOCX, PPT)

Process:
1. Upload file to Supabase Storage bucket called "notes-files"
2. Generate public file URL
3. Store metadata in database table "notes"

Database table: notes
- id (uuid primary key)
- title (text)
- subject (text)
- description (text)
- file_url (text)
- downloads (integer default 0)
- rating (float default 0)
- created_at (timestamp)

--------------------------------

2. BROWSE NOTES PAGE

The Browse page should fetch notes dynamically from Supabase and display:

- title
- subject
- uploaded date
- download button
- rating

When user clicks download:
- download the file using file_url
- increase download count in database

--------------------------------

3. SEARCH SYSTEM

Add search functionality for notes.

Users should be able to search by:
- title
- subject
- keywords

The browse page should filter notes based on search input.

--------------------------------

4. BOOKMARK SYSTEM

Users should be able to bookmark notes.

Create table: bookmarks

Fields:
- id
- user_id
- note_id
- created_at

Bookmarked notes should appear inside the Library page.

--------------------------------

5. RATING SYSTEM

Users can rate notes from 1 to 5 stars.

Create table: ratings

Fields:
- id
- note_id
- user_id
- rating_value

Average rating should be displayed in Browse page.

--------------------------------

VERSION 2 FEATURES (ADVANCED LEARNING)

6. VIDEO LECTURE SYSTEM

Users can upload or share lecture videos.

Create table: videos

Fields:
- id
- title
- subject
- description
- video_url
- created_at

Allow:
- uploading video
OR
- adding YouTube links.

Videos should appear in a video learning section.

--------------------------------

7. QUIZ SYSTEM

Create an MCQ quiz system.

Tables:

quizzes
- id
- title
- subject
- created_at

questions
- id
- quiz_id
- question
- option_a
- option_b
- option_c
- option_d
- correct_answer

quiz_results
- id
- user_id
- quiz_id
- score
- submitted_at

Users should:
- take quizzes
- submit answers
- see score immediately.

--------------------------------

8. DISCUSSION FORUM

Students can ask doubts and answer questions.

Tables:

questions
- id
- user_id
- title
- description
- created_at

answers
- id
- question_id
- user_id
- answer
- created_at

Users can:
- ask questions
- reply with answers
- view discussions.

--------------------------------

9. CLEAN CODE STRUCTURE

Organize backend logic properly:

/lib/supabaseClient.js
/services/notesService.js
/services/videoService.js
/services/quizService.js
/services/forumService.js
/components/UploadForm
/components/NotesList
/components/QuizComponent
/components/DiscussionSection

--------------------------------

10. USER EXPERIENCE

Add:
- loading indicators
- success messages
- error handling
- real time updates after upload

--------------------------------

OUTPUT REQUIRED

Return:
1. Database schema for Supabase
2. Storage bucket setup
3. Backend integration code
4. Frontend integration code
5. File structure for the project

Ensure the existing UI remains unchanged and only functionality is added.