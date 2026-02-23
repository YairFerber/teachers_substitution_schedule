# 🍎 Teacher Schedule App: User Manual

Welcome to the **Teacher Schedule App**. This manual provides a comprehensive guide to managing your school's schedule, absences, and substitutions with ease and precision.

---

## 📑 Table of Contents
1. [🔐 Getting Started](#-getting-started)
2. [👥 Teacher Management](#-teacher-management)
3. [📅 Schedule & Substitutions](#-schedule--substitutions)
4. [⚡ Daily Substitution Organizer](#-daily-substitution-organizer)
5. [📊 Reports & Exports](#-reports--exports)
6. [⚙️ Data & Administrative Tools](#-data--administrative-tools)

---

## 🔐 Getting Started

### Accessing the App
The application is available in two versions:
- **🌐 Online**: Accessible via your school's custom URL (e.g., Vercel).
- **💻 Desktop**: A standalone application for offline use.

### Logging In
1. Enter your **Username** (usually your last name in Hebrew or a designated code).
2. Enter your **4-digit PIN**.
3. Click **Login**.

> [!TIP]
> **Admins** have full access to management tools, while **Teachers** can only view their own schedules and reports.

---

## 👥 Teacher Management

### The Teachers Dashboard
Navigate to **Admin > Teachers** to see the full staff list.
- **Regular Teachers**: Staff with permanent weekly schedules.
- **Substitutes**: Dedicated staff available for daily coverage.

### Managing Teacher Profiles
Click on any teacher's name to open their **Profile Card**:
- **Edit Info**: Update name, email, phone, and login username.
- **Reset PIN**: Admins can view or change a teacher's login PIN.

---

## 📅 Schedule & Substitutions

### Permanent Weekly Template
In the Teacher Profile, use the **Weekly Template** view to set a teacher's recurring schedule.
- Click any "Plus" icon to add a class.
- Select the **Subject**, **Class**, and **Period Type** (Regular, Stay, Individual, or Meeting).

### Managing Weekly Absences
Switch to the **Manage Substitutions** tab to handle specific dates.
1. Use the **Week Navigator** (< >) to select the correct week.
2. Click on a scheduled class.
3. Select **Mark as Absent**. The cell will turn **🔴 Red**.

### Assigning a Substitute
Once a slot is marked absent (Red):
1. Click the Red cell.
2. Select **Assign Substitute**.
3. A list of available teachers will appear, color-coded by their availability:
    - 🟢 **FREE**: No periods scheduled.
    - 🟡 **STAY**: On a "Stay" period.
    - 🟣 **INDIVIDUAL**: On an "Individual" period.
    - 🆔 **מ"מ**: Official substitute teacher.
4. Select a teacher and confirm. The cell will turn **🟢 Green**.

---

## ⚡ Daily Substitution Organizer

The **Daily Organizer** (`/admin/daily`) is the "Command Center" for the school morning. It shows a grid of every teacher and every period for a single day.

### Workflow:
1. **DatePicker**: Select the day (e.g., "Sunday, 22/02").
2. **Add Teacher**: Use the sidebar to find a teacher. Upon selection, you will be asked:
    - **יומי (Daily)**: Mark the entire day absent immediately.
    - **שעתי (Hourly)**: Add the teacher to the grid and mark specific hours manually.
3. **Marking Specific Hours**: For "Hourly" mode, click on a class cell and select the absence type (Sick/Vacation/Duty).
4. **The Matrix**: Click **Red** cells (Absences) to assign coverage instantly from the real-time availability list.

---

## 📊 Reports & Exports

### Monthly Substitution Report
Navigate to **Admin > Reports** to view all coverage data:
- **Tab 1: דוח יומי (Daily Report)**: A chronological list of all events, sorted by date.
- **Tab 2: שעות מילוי מקום**: Summary matrix of all monthly coverage.
- **Matrix Symbols**: 
    - **X**: Indicates a **Daily Absence**.
    - **Number**: Indicates the count of **Hourly Absences** for that day.

### Exporting Data
Every report includes professional export options:
- 📄 **Export to PDF**: Generates a clean, print-ready document.
- 📗 **Export to Excel**: Downloads a formatted `.xlsx` file for data analysis.

---

## ⚙️ Data & Administrative Tools

### School-Wide Data Import
To set up a new school year or semester:
1. Go to **Admin > Data**.
2. Upload your school's **Master Schedule (Excel)**.
3. The app will automatically create all teachers, classes, and schedules in seconds.

### Database Backup
Use the **Download Database** button to keep a local backup of all school data, including historical substitutions.

---

## 🛠️ Developer Notes (Admin)
### Sync & Types
After major updates (like V1.2), ensure you run:
`npx prisma generate`
to keep your local environment in sync with the database schema.

---

> [!IMPORTANT]
> **Timezone Sync**: The app uses UTC-safe logic. Ensure your computer's date and time are set correctly for the most accurate scheduling experience.

---
*© 2026 Teacher Schedule Management Systems. All rights reserved.*
