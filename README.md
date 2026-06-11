# InternBridge

An elegant, unified Placement & Internship Portal designed to connect students with verified employers through real-time tracking, moderation workflows, and an AI-powered resume matching engine.

---

## Project Description

**InternBridge** replaces disjointed job boards with a single, high-fidelity command center. Crafted with a premium, pitch-black and gold aesthetics-focused design system, it accommodates distinct portals for students, company representatives, and administrators. 

The application facilitates a seamless recruitment workflow: students build rich portfolios and submit resumes; companies manage placements and evaluate applications sorted by match scoring; and administrators moderate incoming listings and verify employer organizations, ensuring a trusted ecosystem for all participants.

---

## Features Implemented

### 👤 Role-Based Dashboards
* **Students**:
  * Create custom profiles with academic history (Education relation) and skill tags.
  * Upload resumes securely (PDF support).
  * Browse active, admin-approved internships with filter controls.
  * Apply with a single click and track statuses: `Pending`, `Shortlisted`, or `Rejected`.
* **Companies**:
  * Establish company details (location, website, description, and logo).
  * Post new internship listings specifying requirements, stipend, duration, and locations.
  * Review applications on a dedicated manager dashboard.
  * Sort candidates based on dynamic match suitability.
* **Administrators**:
  * Track platform analytics (student/company sign-ups, active jobs, pending lists).
  * Moderate new internship postings (Approve & Publish / Reject).
  * Verify company registrants to authenticate posting privileges.

### 🧠 AI-Powered Resume Match Score
* Dynamic match calculation engine comparing candidate skill lists, custom bio statements, and profile context against internship requirements and descriptions.
* Generates a 0-100% score to help companies instantly identify optimal candidate alignments.

### 📁 Advanced Media & Verification Workflows
* **Asset Uploading**: Integrated file uploads for resumes and brand logos (supporting Cloudinary cloud storage).
* **OTP Verification**: Multi-step verification mechanism generating mock OTPs upon administrative approval of company profiles.

### 🔒 Authentication & Security
* Secure, stateless authentication utilizing JSON Web Tokens (JWT) stored in HTTP-only cookies.
* Cryptographic password hashing using BcryptJS.

---

## Technology Stack Used

* **Frontend Framework**: Next.js 16 (App Router)
* **Core Library**: React 19
* **Database & ORM**: PostgreSQL, Prisma ORM
* **Styling**: Tailwind CSS v4 & custom Vanilla CSS Modules (configured with custom HSL tokens, glassmorphism, and premium micro-animations)
* **Authentication**: JWT (JSON Web Tokens), JS-Cookies, BcryptJS
* **Cloud Asset Management**: Cloudinary API (with local fallback storage capabilities)
* **Runtime**: Node.js

---

## Installation Steps

Follow these instructions to configure and run InternBridge locally:

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd internBridge
   ```

2. **Install Project Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` (or `.env.local`) file in the root directory and populate it with the following configuration:
   ```env
   # PostgreSQL database connection string
   DATABASE_URL="postgresql://username:password@localhost:5432/internbridge?schema=public"

   # JSON Web Token signature secret
   JWT_SECRET="your-ultra-secure-jwt-secret-key"

   # Local server app URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Cloudinary credentials (Optional: For cloud asset uploads)
   CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
   CLOUDINARY_API_KEY="your_cloudinary_api_key"
   CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
   ```

4. **Initialize Database Schema**:
   Generate the Prisma Client and push the relational schema to your database instance:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```

6. **Access the Application**:
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```text
internBridge/
├── prisma/                  # Database schema definitions and migrations
│   ├── schema.prisma        # Main Prisma model relations schema
│   └── companies_schema.sql # Raw database script backups
├── public/                  # Static assets & public uploads directory
│   ├── uploads/             # Local resume PDF storage fallback
│   └── *.png, *.svg         # Background assets and icon SVGs
├── src/
│   ├── app/                 # Next.js App Router pages, styles, and API routes
│   │   ├── api/             # API Endpoints (auth, stats, uploads, applications, jobs)
│   │   ├── dashboard/       # Personal dashboards (admin/, company/, student/)
│   │   ├── internships/     # Internship listing layout & detail views ([id]/)
│   │   ├── login/           # Authentication login page
│   │   ├── register/        # Account registration page
│   │   ├── globals.css      # Core design tokens, theme variables, & Tailwind imports
│   │   ├── layout.js        # Root application wrapper and font configurations
│   │   └── page.js          # Marketing landing page
│   ├── components/          # Reusable UI component modules (Navbar, Footer, JobCard, Sidebar)
│   ├── context/             # Global React state providers (AuthContext)
│   └── lib/                 # Backend utilities (Prisma Client, JWT auth, Cloudinary, Matcher)
├── package.json             # Node.js project manifest & scripts
└── README.md                # Project documentation (this file)
```

---

## Screenshots

* **Landing Page**: Pitch-black theme displaying active metrics, key feature summaries, and user role selection cards.
* **Student Dashboard**: Interactive layout showing applied internships, match ratings, and resume status.
* **Company Hub**: Portal displaying incoming applications, student profiles, match scores, and tools for updating candidate status.
* **Admin moderating deck**: High-level system statistics card display alongside unverified companies list and pending internships queue.

---

## Future Enhancements

* **Intelligent PDF Resume Parser**: Automatic extraction of key resume terms to pre-populate student profiles.
* **Direct Messaging Service**: Real-time interactive chat between shortlisted students and hiring managers.
* **Automated Scheduler**: Integrated calendar setups (Google Calendar/Outlook) to schedule interviews directly.
* **Enhanced Analytics Dashboards**: Dynamic graphs (using Recharts or Chart.js) depicting registration trends and hiring conversion metrics.
