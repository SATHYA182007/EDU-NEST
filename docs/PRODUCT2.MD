Build a complete, single-file HTML/CSS/JS educational notes-sharing 
platform called "EduNest" with the following specifications:

## BRAND & IDENTITY
- Name: EduNest
- Logo: Small square icon + "EduNest" in bold Sora font
- Tagline: "Your Academic Library"
- Color Accent: Blue (#4f8ef7) with purple secondary (#a78bfa)

## THEME SYSTEM
- Dark/Light theme toggle button in the top bar (sun/moon icons)
- Dark: background #0d0f14, surface #13161e, text #e8ecf4
- Light: background #f0f2f7, surface #ffffff, text #111827
- All colors via CSS variables, smooth transition on toggle
- Default: Dark theme

## LAYOUT
- Fixed left sidebar (240px wide)
- Top search bar
- Secondary filter sidebar (220px)
- Main scrollable content grid

## SIDEBAR NAVIGATION (all must work via JS page switching)
MAIN section:
- Dashboard (grid icon) → shows stats cards + recent activity
- Browse (search icon) → shows library grid (default page)

LIBRARY section:
- My Library (bookmark icon) → shows user's saved notes
- Upload (upload icon) → shows upload form with drag & drop

ACCOUNT section:
- Settings (gear icon) → shows profile, theme, notification settings

- Bottom: user card with avatar "S", name "SATHYA M", role "Computer 
  Science", logout button

## PAGES TO BUILD

### 1. BROWSE PAGE (default)
- Search bar at top: "Search by topic, course, or subject..."
- Trending tag filter: "🔥 Trending in Computer Science"
- Note cards grid (3 columns):
  Each card has: file type badge (PDF/DOCX/PPT), thumbnail area, 
  title, subject tag, author avatar + name, download count
- Sample notes:
  * "Advanced Database Systems Complete Study Guide" - CS - Alex R. - 342 downloads - PDF
  * "Discrete Mathematics Midterm Cheat Sheet" - Math - Sarah J. - 891 downloads - DOCX  
  * "Quantum Mechanics Lecture Notes Week 1" - Physics - Tom W. - 124 downloads - PDF
  * "Macroeconomics Graph Summary" - Business - Maya K. - 203 downloads - PDF
  * "Intro to Cell Biology Final Presentation" - Biology - Chris L. - 567 downloads - PPT
  * "Operating Systems Memory Management" - CS - Alex R. - 445 downloads - PDF
- Filter sidebar: Sort By (Trending/Newest/Most Downloaded radio), 
  Subject checkboxes, File Type checkboxes, Semester checkboxes

### 2. DASHBOARD PAGE
- Welcome header: "Good morning, Sathya M 👋"
- 4 stat cards: Total Downloads, Notes Uploaded, Saved Notes, 
  Study Streak
- Recent Activity feed
- Recommended Notes section

### 3. MY LIBRARY PAGE
- Grid of saved/bookmarked notes (same card style as Browse)
- Empty state if no saves: illustration + "No saved notes yet"
- Filter by subject tabs at top

### 4. UPLOAD PAGE
- Drag & drop file zone (dashed border, upload icon)
- Form fields: Title, Subject (dropdown), Semester (dropdown), 
  Description, Tags
- File type indicator after upload
- Submit button: "Upload Note"
- Success toast notification on submit

### 5. SETTINGS PAGE
- Profile section: avatar, name, email, edit button
- Appearance section: Dark/Light theme toggle (synced with topbar)
- Notifications section: toggle switches for email/push notifications
- Account section: Change password, Delete account (danger zone)

## FILTER SIDEBAR (Browse page only)
- Sort By: radio buttons (Trending selected by default)
- Subject: checkboxes (Computer Science, Mathematics, Physics, 
  Business, Biology)
- File Type: checkboxes (PDF Documents, Word Documents, 
  Presentations)
- Semester: checkboxes (Semester 1-2, 3-4, 5-6, 7-8)

## DESIGN REQUIREMENTS
- Font: Sora (headings) + DM Sans (body) from Google Fonts
- Cards: rounded corners (14px), subtle shadow, hover lift effect
- Smooth page transitions (fade in)
- Professional dark/light theme throughout
- File type badges: PDF=red, DOCX=blue, PPT=orange, colored pills
- Active nav item highlighted with accent color
- All interactions smooth with CSS transitions
- Mobile-responsive sidebar (collapsible)
- Custom scrollbar styling

## TECHNICAL
- Single HTML file (no frameworks, no build tools)
- Vanilla JS for all interactivity
- CSS custom properties for theming
- Page switching via JS (hide/show sections, no page reload)
- Theme persisted in localStorage
- Search filters notes in real-time by title/subject