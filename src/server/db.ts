/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { 
  User, UserRole, Course, CourseModule, Lesson, 
  Assignment, Submission, Quiz, Question, 
  Enrollment, Certificate, Payment, Message, 
  LiveClass, AppNotification, GradeReport, Exam,
  ExamEligibility, ExamSubmission, UploadedResource, EmailMessage
} from "../types";

const DB_FILE = path.join(process.cwd(), "db.json");

interface Database {
  users: User[];
  courses: Course[];
  modules: CourseModule[];
  lessons: Lesson[];
  assignments: Assignment[];
  submissions: Submission[];
  quizzes: Quiz[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  payments: Payment[];
  messages: Message[];
  liveClasses: LiveClass[];
  notifications: AppNotification[];
  gradeReports: GradeReport[];
  exams: Exam[];
  examEligibilities: ExamEligibility[];
  examSubmissions: ExamSubmission[];
  uploadedResources: UploadedResource[];
  emails: EmailMessage[];
}

const DEFAULT_DB: Database = {
  uploadedResources: [],
  emails: [
    {
      id: "email-welcome-1",
      senderEmail: "directorate@edu.com",
      senderName: "LMS Directorate Block",
      receiverEmail: "student@edu.com",
      receiverName: "Standard Student",
      subject: "Welcome to New-Tech School Portal Workspace!",
      body: "Hello Standard Student,\n\nWelcome to your integrated LMS secure webmail account. This mailbox is built in-house with end-to-end security to coordinate curriculum, course material, grades, and instructor interactions.\n\nPlease explore your courses, schedule live lectures, and take AI-powered dynamic quizzes. Let us know if you have any questions.\n\nWarm regards,\nThe Administration Board",
      timestamp: "2026-07-18T08:00:00.000Z",
      isRead: false,
      isStarred: true,
      attachments: [
        { name: "Academic_Calendar_2026.pdf", url: "https://example.com/calendar.pdf", size: "420 KB" }
      ]
    },
    {
      id: "email-welcome-2",
      senderEmail: "directorate@edu.com",
      senderName: "LMS Directorate Block",
      receiverEmail: "sarah.jenkins@edu.com",
      receiverName: "Dr. Sarah Jenkins",
      subject: "Faculty Curriculum Verification Note",
      body: "Dear Dr. Sarah Jenkins,\n\nWe have approved your roster profile and designated you as the lead Machine Learning & AI Instructor.\n\nPlease make sure your curriculum files, live schedules, and assignments are updated. We have also enabled automated AI Quiz generation based on the lesson materials you supply to your classes.\n\nBest of luck,\nThe Board of Directors",
      timestamp: "2026-07-18T08:15:00.000Z",
      isRead: false,
      isStarred: true
    }
  ],
  users: [
    {
      id: "teacher-1",
      name: "Dr. Sarah Jenkins",
      email: "sarah.jenkins@edu.com",
      phone: "+1 (555) 019-2834",
      role: UserRole.TEACHER,
      expertise: "Machine Learning & Artificial Intelligence",
      cvUrl: "https://example.com/cv/sarah_jenkins.pdf",
      status: "approved"
    },
    {
      id: "teacher-2",
      name: "Prof. Alan Kovac",
      email: "alan.kovac@edu.com",
      phone: "+1 (555) 014-9988",
      role: UserRole.TEACHER,
      expertise: "Full-Stack Web Engineering & Cybersecurity",
      cvUrl: "https://example.com/cv/alan_kovac.pdf",
      status: "approved"
    },
    {
      id: "student-1",
      name: "Alex Rivera",
      email: "student@edu.com", // Convenient login for testing
      phone: "+1 (555) 012-3456",
      role: UserRole.STUDENT,
      status: "approved"
    },
    {
      id: "admin-1",
      name: "Director Marcus Vance",
      email: "admin@edu.com", // Convenient login for testing
      phone: "+1 (555) 011-2233",
      role: UserRole.ADMIN,
      status: "approved"
    }
  ],
  courses: [
    {
      id: "course-ml",
      title: "Introduction to Practical Machine Learning",
      description: "Learn the fundamentals of Machine Learning, neural networks, and decision trees. Build real-world classification and prediction models from scratch using Python and Scikit-Learn.",
      instructorId: "teacher-1",
      instructorName: "Dr. Sarah Jenkins",
      category: "Artificial Intelligence",
      price: 99.00,
      rating: 4.8,
      thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60",
      status: "approved"
    },
    {
      id: "course-web",
      title: "Full-Stack Web Engineering with React & Node",
      description: "Go from beginner to advanced full-stack developer. Master React, Tailwind CSS, custom server-side APIs in Express, and database models with robust persistence and security.",
      instructorId: "teacher-2",
      instructorName: "Prof. Alan Kovac",
      category: "Web Development",
      price: 149.00,
      rating: 4.9,
      thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop&q=60",
      status: "approved"
    },
    {
      id: "course-design",
      title: "User Experience (UX) & Interface Design Fundamentals",
      description: "Understand user psychology, typography, grid structures, and interactive animation. Learn to craft distinctive, modern digital products that balance function and gorgeous aesthetics.",
      instructorId: "teacher-1",
      instructorName: "Dr. Sarah Jenkins",
      category: "Design",
      price: 79.00,
      rating: 4.7,
      thumbnail: "https://images.unsplash.com/photo-1561070791-26c113006238?w=800&auto=format&fit=crop&q=60",
      status: "approved"
    }
  ],
  modules: [
    // ML Course Modules
    { id: "mod-ml-1", courseId: "course-ml", title: "Module 1: Foundations of Machine Learning", order: 1 },
    { id: "mod-ml-2", courseId: "course-ml", title: "Module 2: Supervised Learning & Models", order: 2 },
    // Web Course Modules
    { id: "mod-web-1", courseId: "course-web", title: "Module 1: Advanced Frontend & State Patterns", order: 1 },
    { id: "mod-web-2", courseId: "course-web", title: "Module 2: Backend Architecture & REST APIs", order: 2 }
  ],
  lessons: [
    // ML Lessons
    {
      id: "les-ml-1",
      moduleId: "mod-ml-1",
      courseId: "course-ml",
      title: "1.1 Introduction to AI, ML, and Deep Learning",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Free public test video
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      content: "Welcome to Machine Learning! In this lesson, we will cover the core distinctions between Artificial Intelligence, Machine Learning algorithms, and Deep Learning neural networks. You will learn about data processing pipelines, weights, biases, and general prediction mechanisms.",
      duration: "10:15",
      order: 1
    },
    {
      id: "les-ml-2",
      moduleId: "mod-ml-1",
      courseId: "course-ml",
      title: "1.2 Linear Regression and the Loss Function",
      videoUrl: "https://www.w3schools.com/html/movie.mp4",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      content: "Today we dive deep into the math behind Linear Regression. We define the Least Squares Loss function and explain how gradient descent adjusts weights iteratively to find the optimal global minima.",
      duration: "14:45",
      order: 2
    },
    // Web Lessons
    {
      id: "les-web-1",
      moduleId: "mod-web-1",
      courseId: "course-web",
      title: "1.1 Reconciling State: React Fiber and Concurrent Rendering",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      content: "Understand how React 19 handles reconciliation behind the scenes. We will analyze the virtual DOM diffing engine, Fiber tree lifecycle, and concurrent state schedulers to prevent performance bottlenecks.",
      duration: "18:20",
      order: 1
    }
  ],
  assignments: [
    {
      id: "asg-ml-1",
      lessonId: "les-ml-1",
      courseId: "course-ml",
      title: "Assignment 1: Building a Simple Predictor in Python",
      instructions: "Implement a simple single-variable linear predictor in pure Python (no libraries). Define a class with fit() and predict() methods. Train it using a small list of x and y coordinates, calculate the Mean Squared Error, and write a summary paragraph of your findings in a text file or PDF to submit here.",
      maxPoints: 100
    }
  ],
  submissions: [
    {
      id: "sub-1",
      assignmentId: "asg-ml-1",
      courseId: "course-ml",
      studentId: "student-1",
      studentName: "Alex Rivera",
      workUrl: "https://example.com/submissions/alex_rivera_predictor.pdf",
      score: 95,
      feedback: "Excellent implemention of the fit() method using mathematical formulas. Clean variable naming and readable code style.",
      status: "graded",
      submittedAt: "2026-07-15T14:30:00Z"
    }
  ],
  quizzes: [
    {
      id: "quiz-ml-1",
      courseId: "course-ml",
      lessonId: "les-ml-1",
      title: "Lesson 1.1 Comprehension Check",
      questions: [
        {
          id: "q-ml-1-1",
          quizId: "quiz-ml-1",
          text: "Which of the following describes a subfield of Artificial Intelligence focusing on algorithms that learn from data?",
          type: "multiple-choice",
          options: [
            "Machine Learning",
            "Natural Language Processing only",
            "Linear Cryptanalysis",
            "Relational Database Algebra"
          ],
          correctAnswer: "Machine Learning"
        },
        {
          id: "q-ml-1-2",
          quizId: "quiz-ml-1",
          text: "Supervised learning requires both input data and their corresponding ground-truth labels.",
          type: "true-false",
          options: ["True", "False"],
          correctAnswer: "True"
        },
        {
          id: "q-ml-1-3",
          quizId: "quiz-ml-1",
          text: "Complete the blank: Gradient ______ is the optimization algorithm used to minimize the loss function.",
          type: "fill-blank",
          options: [],
          correctAnswer: "descent"
        }
      ]
    }
  ],
  enrollments: [
    {
      id: "enr-1",
      studentId: "student-1",
      courseId: "course-ml",
      progress: 50,
      completedLessons: ["les-ml-1"],
      enrolledAt: "2026-07-10T10:00:00Z"
    }
  ],
  certificates: [],
  payments: [
    {
      id: "pay-1",
      studentId: "student-1",
      courseId: "course-ml",
      amount: 99.00,
      status: "paid",
      date: "2026-07-10T10:00:00Z",
      invoiceNumber: "INV-2026-001",
      plan: "single-course"
    }
  ],
  messages: [
    {
      id: "msg-1",
      senderId: "teacher-1",
      senderName: "Dr. Sarah Jenkins",
      receiverId: "group",
      receiverName: "Intro to ML Study Group",
      courseId: "course-ml",
      text: "Hello class! Welcome to the Practical Machine Learning course. Please check the assignments section for the first project details.",
      timestamp: "2026-07-12T09:00:00Z"
    },
    {
      id: "msg-2",
      senderId: "student-1",
      senderName: "Alex Rivera",
      receiverId: "group",
      receiverName: "Intro to ML Study Group",
      courseId: "course-ml",
      text: "Thanks Dr. Sarah! Excited to be here. I've already started working on Assignment 1.",
      timestamp: "2026-07-12T10:15:00Z"
    }
  ],
  liveClasses: [
    {
      id: "live-1",
      courseId: "course-ml",
      courseName: "Introduction to Practical Machine Learning",
      title: "Live Q&A: Linear Regression & Project 1 Deep Dive",
      scheduledAt: "2026-07-18T15:00:00-07:00", // Scheduled soon based on 2026-07-17T22:34 local time
      link: "https://meet.google.com/abc-defg-hij",
      recordingsUrl: "https://example.com/recordings/ml-live-qa-1.mp4",
      attendees: []
    }
  ],
  notifications: [
    {
      id: "not-1",
      userId: "student-1",
      text: "Welcome to Educational Learning Management System! Explore the courses catalog and enroll.",
      timestamp: "2026-07-10T10:05:00Z",
      read: false
    }
  ],
  gradeReports: [],
  exams: [
    {
      id: "exam-ml-final",
      courseId: "course-ml",
      courseTitle: "Introduction to Practical Machine Learning",
      title: "Term Final Examination - Neural Networks & Classifiers",
      description: "Comprehensive final evaluation of machine learning architectures, mathematical proofs, and model tuning. Only approved and eligible students may enter the examination board.",
      startTime: "2026-07-18T10:00:00.000Z",
      endTime: "2026-07-22T18:00:00.000Z",
      durationMinutes: 120,
      questions: [
        {
          id: "ex-q1",
          text: "What is the primary objective of gradient descent in optimization?",
          options: ["Minimize the objective/loss function", "Maximize accuracy directly", "Increase model weights indefinitely", "Convert categorical labels to numbers"],
          correctAnswer: "Minimize the objective/loss function"
        },
        {
          id: "ex-q2",
          text: "Which regularization method adds the absolute value of coefficients as a penalty term to the loss function?",
          options: ["L1 Regularization (Lasso)", "L2 Regularization (Ridge)", "ElasticNet only", "Dropout neural regularization"],
          correctAnswer: "L1 Regularization (Lasso)"
        },
        {
          id: "ex-q3",
          text: "True or False: Overfitting occurs when a machine learning model learns the noise in the training data rather than the underlying distribution.",
          options: ["True", "False"],
          correctAnswer: "True"
        }
      ]
    }
  ],
  examEligibilities: [
    {
      id: "elig-1",
      examId: "exam-ml-final",
      examTitle: "Term Final Examination - Neural Networks & Classifiers",
      courseId: "course-ml",
      studentId: "student-1",
      studentName: "Alex Rivera",
      studentEmail: "student@edu.com",
      status: "approved",
      checkedAt: "2026-07-17T20:00:00Z"
    }
  ],
  examSubmissions: []
};

// Helper function to read DB from file
export function readDB(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || [],
        courses: parsed.courses || [],
        modules: parsed.modules || [],
        lessons: parsed.lessons || [],
        assignments: parsed.assignments || [],
        submissions: parsed.submissions || [],
        quizzes: parsed.quizzes || [],
        enrollments: parsed.enrollments || [],
        certificates: parsed.certificates || [],
        payments: parsed.payments || [],
        messages: parsed.messages || [],
        liveClasses: parsed.liveClasses || [],
        notifications: parsed.notifications || [],
        gradeReports: parsed.gradeReports || [],
        exams: parsed.exams || [],
        examEligibilities: parsed.examEligibilities || [],
        examSubmissions: parsed.examSubmissions || [],
        uploadedResources: parsed.uploadedResources || [],
        emails: parsed.emails || []
      };
    }
  } catch (error) {
    console.error("Error reading database file, using fallback template:", error);
  }
  // Initialize with fallback and save
  writeDB(DEFAULT_DB);
  return DEFAULT_DB;
}

// Helper function to write DB to file
export function writeDB(db: Database): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}
