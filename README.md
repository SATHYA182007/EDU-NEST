# EduNest - Student Notes Sharing Platform

This project has been redesigned into a professional, high-end SaaS platform.

## 🚀 Accessing the Redesign

### **1. Opening the Ready-to-Use Website**
The finalized, built version of the website is located in the root directory. You can access it immediately by opening:
👉 `index.html` (in the root directory)

### **2. Development Mode (For Future Edits)**
If you want to continue editing the code using the modern React + Tailwind system, follow these steps:

1. **Open your terminal** and go to the frontend directory:
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
