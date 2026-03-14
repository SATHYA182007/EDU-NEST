You are a senior product designer and full-stack engineer.

I built a student notes sharing platform called EduNest. Redesign the 
entire frontend so every page has a unique purpose and layout.

My stack: HTML, CSS, Vanilla JS, Supabase (auth, storage, database)

---

CURRENT PROBLEMS:
- Dashboard, My Library, and Browse all show the same note cards
- No clear user flow between pages
- Pages feel redundant and purposeless

---

REDESIGN ALL 5 PAGES:

### 1. DASHBOARD
- Greeting header with user name + date
- 4 stat cards: Total Uploads, Total Downloads, Views This Week, Streak Days
- Upload activity chart (bar chart, last 7 days) using vanilla JS canvas or SVG
- Recently uploaded notes (horizontal scroll row, max 5 cards)
- Trending subjects (tag pills with counts)
- Activity feed (right sidebar): "You uploaded X", "Someone downloaded Y"

### 2. MY LIBRARY
- Only shows notes uploaded by the logged-in user
- Table/list view with columns: Title, Subject, Uploads Date, Downloads, Status (Published/Draft)
- Inline actions per row: Edit, Delete, Toggle visibility
- Tabs at top: All | Published | Drafts | Archived
- Bulk select + bulk delete
- Empty state: illustrated prompt to upload first note

### 3. BROWSE
- Full search bar at top (large, prominent)
- Filter sidebar: Subject, Semester, File Type, Sort by (Trending / Newest / Most Downloaded)
- Note cards grid (3 columns): thumbnail, title, subject tag, uploader avatar + name, download count
- Trending section at top before grid
- Pagination or infinite scroll
- Empty state when no results match filters

### 4. UPLOAD
- Step-based form (3 steps):
  Step 1 — File drop zone (drag & drop or click), shows file name + size after selection
  Step 2 — Metadata: Title, Subject (dropdown), Semester, Tags (chip input), Description (textarea)
  Step 3 — Preview + Publish: show summary card of what the note will look like, Publish or Save as Draft buttons
- Progress indicator at top showing Step 1 / 2 / 3
- File type validation (PDF, DOCX, PPT only)

### 5. SETTINGS
- Left tab menu: Profile | Account | Notifications | Danger Zone
- Profile tab: avatar upload, display name, bio, university, course
- Account tab: email display, change password form
- Notifications tab: toggle switches for email alerts, download notifications, weekly digest
- Danger Zone tab: Delete account button (with confirmation modal)

---

SIDEBAR NAVIGATION (persistent across all pages):
- Logo top left: "EduNest" with a small nest/book icon
- Nav items with icons:
  🏠 Dashboard
  📚 My Library
  🔍 Browse
  ⬆️ Upload  ← highlighted as primary CTA
  ⚙️ Settings
- Bottom of sidebar: user avatar + name + logout button
- Active state: left accent bar + tinted background on active item
- Section labels: MAIN, LIBRARY, ACCOUNT

---

DESIGN SYSTEM:
- Dark theme: bg #0c0e14, surface #13161f, surface2 #1a1e2a
- Accent color: #6c63ff (purple)
- Green for success: #2dd4a0
- Amber for warnings: #f5a623
- Red for destructive: #ff5f6d
- Font: Syne (headings, bold labels) + DM Sans (body, UI)
- Border radius: 12px cards, 8px inputs/buttons
- Borders: rgba(255,255,255,0.07)
- Hover borders: rgba(255,255,255,0.14)
- Stat cards: colored glow in top-right corner (blurred circle)
- Buttons: primary (accent bg + glow shadow), ghost (border only), danger (red-tinted)

---

NOTE CARD COMPONENT:
- Rounded card, dark surface bg
- Top: subject color tag + file type badge (PDF / DOCX)
- Middle: note title (2 lines max, ellipsis), uploader name + avatar (small)
- Bottom: download count, date uploaded, Download button
- Hover: slight lift (translateY -2px) + border brightens
- Used ONLY in Browse page and Dashboard recent row

---

EMPTY STATES:
- Each page must have a unique empty state
- Use a simple SVG illustration or large emoji + heading + subtext + CTA button
- Examples:
  My Library empty: "You haven't uploaded anything yet" + Upload Now button
  Browse empty: "No notes match your search" + Clear Filters button

---

INTERACTIONS (vanilla JS):
- Sidebar nav switches active page (hide/show page divs)
- Upload form steps: Next/Back buttons update visible step
- My Library tabs filter the note rows shown
- Browse filters update the card grid (use hardcoded mock data)
- Settings tabs switch the visible settings panel
- Stat cards animate count up on page load
- Toast notification component (bottom right): "Note uploaded!", "Copied link", etc.

---

OUTPUT: Single self-contained HTML file. All CSS in <style>, all JS in 
<script>. No external dependencies except Google Fonts. Use mock/hardcoded 
data throughout. Make it look like a real funded startup product, not a 
student project. Think Notion + GitHub + Linear design quality.