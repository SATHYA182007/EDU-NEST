# EduNest
EduNest is a collaborative student learning platform that enables users to share and access study materials, take quizzes, rate educational content, and enhance learning through videos in a structured environment.

## 🚀 Getting Started

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Build the latest changes**:
   If you make edits in the `frontend/src` folder and want them to reflect in the main `index.html` file in the root, run:
   ```bash
   npm run build
   cp -r dist/* ../
   ```

## 🛠 Project Structure
- **/frontend**: Source code for the modern React application (Redesign).
- **/frontend-old**: Backup of the original project.
- **/backend**: Server logic for file handling and database.
- **index.html**: The production-ready entry point for your new website.
