# WorkSetu - Location-Based Job Matching Platform

A secure web platform connecting daily-wage workers with employers using AI-based recommendations.

## 📋 Project Overview

WorkSetu helps daily-wage workers (helpers, masons, electricians, painters, etc.) find jobs safely and efficiently. The platform eliminates middlemen, reduces fraud, and provides location-based job matching with AI recommendations.

## 🎯 Key Features

- **Secure OTP Authentication** - Phone number-based login
- **Location-Based Matching** - Find jobs near you
- **AI Recommendations** - Smart job suggestions based on skills and location
- **Trust Score System** - Build credibility through ratings
- **Mobile-Friendly** - Works perfectly on smartphones
- **Multi-User Support** - Separate dashboards for Workers, Employers, and Admin

## 🛠️ Technology Stack

- **Frontend:** HTML5, Tailwind CSS, JavaScript
- **Backend:** Firebase (Authentication, Firestore, Hosting)
- **Icons:** Font Awesome 6
- **Development:** Visual Studio Code

## 📁 Project Structure

```
WorkSetu/
├── index.html                    # Landing page
├── pages/
│   ├── login.html               # Login with OTP
│   ├── register.html            # Registration form
│   ├── worker-dashboard.html    # Worker dashboard (to be created)
│   ├── employer-dashboard.html  # Employer dashboard (to be created)
│   ├── admin-dashboard.html     # Admin panel (to be created)
│   ├── post-job.html            # Job posting form (to be created)
│   ├── browse-jobs.html         # Job browsing page (to be created)
│   └── job-details.html         # Job details page (to be created)
├── js/
│   ├── firebase-config.js       # Firebase configuration (to be created)
│   ├── auth.js                  # Authentication logic (to be created)
│   ├── worker.js                # Worker functions (to be created)
│   ├── employer.js              # Employer functions (to be created)
│   ├── admin.js                 # Admin functions (to be created)
│   └── recommendations.js       # AI recommendation logic (to be created)
├── css/
│   └── styles.css               # Custom CSS (optional)
└── assets/
    └── images/                  # Images and icons
```

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Code editor (VS Code recommended)
- Firebase account (free tier is sufficient)

### Installation Steps

1. **Download the Project**
   - Download all files and maintain the folder structure

2. **Open in Browser**
   - Open `index.html` in your web browser
   - The landing page should load with Tailwind CSS styling

3. **Test Navigation**
   - Click on "Register" or "Login" buttons
   - Forms should be functional (currently in demo mode)

### Setting Up Firebase (Next Steps)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "WorkSetu"
3. Enable Authentication → Phone Number sign-in
4. Create a Firestore Database
5. Get your Firebase config and add it to `js/firebase-config.js`

## 📱 Current Features (Completed)

✅ Landing Page with modern UI
✅ Login Page with OTP interface
✅ Registration Page for Workers and Employers
✅ Responsive design (mobile-friendly)
✅ User type selection (Worker/Employer)
✅ Form validations

## 🔜 Next Steps (To Be Implemented)

1. **Firebase Integration**
   - Phone authentication
   - Firestore database setup
   - User data storage

2. **Dashboards**
   - Worker dashboard with job recommendations
   - Employer dashboard with posted jobs
   - Admin dashboard for monitoring

3. **Job Features**
   - Job posting form
   - Job browsing with filters
   - Apply to jobs functionality

4. **AI Recommendation System**
   - Skill-based matching
   - Location proximity calculation
   - Job history analysis

5. **Trust & Security**
   - Trust score calculation
   - Rating system
   - Complaint management

## 💡 Usage Guide

### For Workers

1. Register with your mobile number
2. Add your skills and experience
3. Browse nearby jobs or get AI recommendations
4. Apply to jobs
5. Build your trust score through completed work

### For Employers

1. Register your business
2. Post job requirements
3. Review worker applications
4. Hire and rate workers
5. Build trust through fair practices

## 🎨 Design Features

- **Clean & Modern UI** - Professional look with Tailwind CSS
- **Intuitive Navigation** - Easy to understand and use
- **Mobile-First** - Optimized for smartphone users
- **Accessibility** - High contrast and readable fonts

## 🔐 Security Features

- OTP-based authentication
- Phone number verification
- Trust score system
- Role-based access control
- Fraud detection (planned)

## 📝 Development Notes

### Current Status: Phase 1 - Basic Structure ✅

- Landing page created
- Login/Register pages functional (UI only)
- User type selection working
- Forms validated on client-side

### Working in Demo Mode

The current version works in "demo mode" - forms validate but don't actually save data. Firebase integration is the next step to make it fully functional.

## 🤝 Contributing

This is a college project by Ankush Sharma (Roll No. 45) from St. John College of Humanities and Sciences.

## 📄 License

This project is created for educational purposes as part of B.Sc. Computer Science coursework (2025-2026).

## 📞 Support

For issues or questions, please contact:
- **Name:** Ankush Sharma
- **Roll Number:** 45
- **College:** St. John College of Humanities and Sciences

## 🙏 Acknowledgments

- Tailwind CSS for the beautiful styling
- Font Awesome for icons
- Firebase for backend services (to be integrated)

---

**Note:** This project is currently in development. Firebase integration and remaining pages will be added in subsequent phases.
