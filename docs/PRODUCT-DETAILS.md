PROJECT CONTEXT
I am building a Student Notes Sharing Platform. Currently my project only has the UI implemented (Dashboard, Library, Browse, Upload, Download buttons). None of the interactions are functional yet.

GOAL
I want to connect the project with Supabase backend so that uploading, storing, and displaying notes works properly.

TECH STACK
Frontend: (React / Next.js if detected in project)
Backend: Supabase (Database + Storage)

REQUIRED FEATURES
	1.	SUPABASE SETUP

	•	Connect the project to Supabase using the project URL and public anon key.
	•	Create a Supabase client configuration file.

	2.	DATABASE STRUCTURE
Create a table called notes with the following fields:

	•	id (uuid, primary key)
	•	title (text)
	•	subject (text)
	•	description (text)
	•	file_url (text)
	•	uploaded_by (text or uuid)
	•	created_at (timestamp)

	3.	FILE STORAGE

	•	Use Supabase Storage bucket called notes-files.
	•	When a user uploads a file, the file should be uploaded to this bucket.
	•	Generate the public file URL and store it in the file_url column of the notes table.

	4.	UPLOAD FEATURE
Make the Upload button functional:

	•	User selects a file (PDF, DOCX, PPT).
	•	Enter metadata like title, subject, description.
	•	Upload file to Supabase storage.
	•	Insert the metadata + file URL into the notes table.

	5.	BROWSE PAGE INTEGRATION
The Browse page should fetch notes from Supabase and display them dynamically:

	•	Title
	•	Subject
	•	Uploaded date
	•	Download button

	6.	DOWNLOAD FEATURE
The Download button should use the file_url stored in Supabase and allow users to download the uploaded file.
	7.	REAL-TIME UI UPDATE
After a new file is uploaded:

	•	It should immediately appear in the Browse page without refreshing.

	8.	ERROR HANDLING

	•	Show loading states during upload.
	•	Show success message after upload.
	•	Show error message if upload fails.

	9.	CLEAN CODE STRUCTURE
Organize the code properly:

	•	/lib/supabaseClient.js
	•	/services/uploadNote.js
	•	/components/UploadForm
	•	/components/NotesList

IMPORTANT
Do NOT change the existing UI design.
Only add the backend logic and functionality.