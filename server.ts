/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { readDB, writeDB } from "./src/server/db.ts";
import { getAITutorResponse, generateAIQuiz, getAICourseRecommendation } from "./src/server/ai.ts";
import { User, UserRole, Course, CourseModule, Lesson, Assignment, Submission, Quiz, Question, Enrollment, Certificate, Payment, Message, LiveClass, AppNotification, StudentGrade, GradeReport, Exam, ExamQuestion, ExamEligibility, ExamSubmission, UploadedResource, EmailMessage } from "./src/types.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and form parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- API ROUTES ---

  // Auth: Register
  app.post("/api/register", (req, res) => {
    const { name, email, phone, role, expertise, cvUrl, password, fastTrackMessage } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Name, email, and role are required." });
    }

    const db = readDB();
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone,
      role: role as UserRole,
      expertise,
      cvUrl,
      status: (role === UserRole.ADMIN) ? "approved" : "pending",
      fastTrackMessage
    };

    db.users.push(newUser);

    // Create a notification for the new user
    const welcomeNotification: AppNotification = {
      id: `not-${Date.now()}`,
      userId: newUser.id,
      text: `Welcome to the Learning Management System, ${name}! Your registration status is pending administrator verification.`,
      timestamp: new Date().toISOString(),
      read: false
    };
    db.notifications.push(welcomeNotification);

    // Send Welcome secure email
    const welcomeEmailBody = `Dear ${name},

Thank you for registering an account with our Learning Management System.

Account Details:
----------------
Full Name: ${name}
Registered Email: ${email}
Assigned Role: ${role}
Clearance Status: ${role === "admin" ? "Approved" : "Pending Administrator Verification"}

${role !== "admin" 
  ? `Our administrative board will review your application and credential files shortly. You will receive an official approval email once your clearance is verified.` 
  : `Your administrator profile is active. You may log in to manage courses, verify payments, and oversee users.`}

Best regards,
LMS Admissions & Registrar
`;

    const welcomeEmail: EmailMessage = {
      id: `email-reg-${Date.now()}`,
      senderEmail: "registrar@newtech.edu",
      senderName: "LMS Registrar & Admissions",
      receiverEmail: email,
      receiverName: name,
      subject: `📧 Welcome to the LMS: Registration Confirmation`,
      body: welcomeEmailBody,
      timestamp: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      isDraft: false,
      isTrash: false,
      attachments: []
    };
    if (!db.emails) db.emails = [];
    db.emails.push(welcomeEmail);

    writeDB(db);
    res.status(201).json(newUser);
  });

  // Auth: Login
  app.post("/api/login", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials. If you are new, please register!" });
    }

    res.json(user);
  });

  // Auth: Logout
  app.post("/api/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Auth: Forgot Password - Triggers secure recovery token email dispatch
  app.post("/api/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    // For security reasons, if user doesn't exist we still respond with success
    // but in our integrated simulation system, we want to make sure they can find the email,
    // so we will show an error only if we want to guide them. Let's return error to guide the user,
    // as it's a closed learning environment.
    if (!user) {
      return res.status(404).json({ error: "No registered user found with this email address." });
    }

    const token = `TOK-${Math.floor(Math.random() * 900000) + 100000}`;
    
    // Save token to database
    (user as any).recoveryToken = token;

    // Send integrated password recovery email
    const recoveryEmailBody = `Dear ${user.name},

We received a request to recover your secure LMS account credentials.

Your secure verification recovery token is:
--------------------------------------------
${token}
--------------------------------------------

To finalize your password reset:
1. Return to the password reset form inside the application.
2. Enter this verification token code.
3. Choose and submit your new account password.

If you did not initiate this request, you can safely disregard this correspondence. Your account remains completely secure.

Sincerely,
LMS Account Security Office
`;

    const recoveryEmail: EmailMessage = {
      id: `email-recovery-${Date.now()}`,
      senderEmail: "security@newtech.edu",
      senderName: "LMS Account Security",
      receiverEmail: user.email,
      receiverName: user.name,
      subject: `🔑 Secure Account Password Recovery Token`,
      body: recoveryEmailBody,
      timestamp: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      isDraft: false,
      isTrash: false,
      attachments: []
    };

    if (!db.emails) db.emails = [];
    db.emails.push(recoveryEmail);

    writeDB(db);
    res.json({ success: true, message: "A secure recovery email has been sent to your inbox." });
  });

  // Auth: Reset Password - Verifies recovery token and updates credentials
  app.post("/api/reset-password", (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "Email, token, and new password are all required." });
    }

    const db = readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return res.status(404).json({ error: "No registered user found with this email address." });
    }

    if ((user as any).recoveryToken !== token) {
      return res.status(400).json({ error: "Invalid or expired recovery verification token." });
    }

    // Update password and clear token
    (user as any).password = newPassword;
    delete (user as any).recoveryToken;

    // Send password reset success email
    const successEmailBody = `Dear ${user.name},

Your secure LMS account password has been updated successfully.

Change Details:
---------------
Status: PASSWORD RESET COMPLETED
Timestamp: ${new Date().toLocaleString()}
IP Reference: Secure Internal App Session

If you did not make this change, please contact LMS Account Security immediately.

Best regards,
LMS Account Security Office
`;

    const successEmail: EmailMessage = {
      id: `email-reset-success-${Date.now()}`,
      senderEmail: "security@newtech.edu",
      senderName: "LMS Account Security",
      receiverEmail: user.email,
      receiverName: user.name,
      subject: `🔒 Account Password Updated Successfully`,
      body: successEmailBody,
      timestamp: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      isDraft: false,
      isTrash: false,
      attachments: []
    };
    db.emails.push(successEmail);

    writeDB(db);
    res.json({ success: true, message: "Your password has been reset successfully. You can now log in." });
  });

  // Get Current Profile
  app.get("/api/users/:id", (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  // Update User Profile (e.g. while pending or general)
  app.put("/api/users/:id", (req, res) => {
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    db.users[userIndex] = {
      ...db.users[userIndex],
      ...req.body
    };
    writeDB(db);
    res.json(db.users[userIndex]);
  });

  // Admin: Update User Registration Status
  app.put("/api/admin/users/:id/status", (req, res) => {
    const { status } = req.body;
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Valid status required." });
    }

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    db.users[userIndex].status = status;

    // Create custom notification
    const notification: AppNotification = {
      id: `not-${Date.now()}`,
      userId: req.params.id,
      text: `Your platform account clearance has been ${status.toUpperCase()} by the administrative board.`,
      timestamp: new Date().toISOString(),
      read: false
    };
    db.notifications.push(notification);

    // Send account clearance email
    const student = db.users[userIndex];
    const statusEmailBody = `Dear ${student.name},

Your platform account registration review has been completed by the administrative board.

Review Result:
--------------
Status: ${status.toUpperCase()}
Timestamp: ${new Date().toLocaleString()}

${status === "approved" 
  ? `Your account is now fully cleared. You may sign in and begin exploring your learning tracks or study modules.` 
  : `Your registration could not be verified. If you wish to appeal, please contact registrar@newtech.edu.`}

Best regards,
LMS Administrative Board
`;

    const statusEmail: EmailMessage = {
      id: `email-status-${Date.now()}`,
      senderEmail: "admin@edu.com",
      senderName: "LMS Administrative Board",
      receiverEmail: student.email,
      receiverName: student.name,
      subject: `🔑 LMS Account Clearance Review: ${status.toUpperCase()}`,
      body: statusEmailBody,
      timestamp: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      isDraft: false,
      isTrash: false,
      attachments: []
    };
    if (!db.emails) db.emails = [];
    db.emails.push(statusEmail);

    writeDB(db);
    res.json(db.users[userIndex]);
  });

  // User Management for Admin Portal
  app.get("/api/admin/users", (req, res) => {
    const db = readDB();
    res.json(db.users);
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    const db = readDB();
    db.users = db.users.filter(u => u.id !== req.params.id);
    writeDB(db);
    res.json({ success: true, message: "User deleted successfully." });
  });

  // Courses: Get All (including filtering/approval status check)
  app.get("/api/courses", (req, res) => {
    const db = readDB();
    const { category, search, status } = req.query;
    
    let filtered = db.courses;

    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }

    if (category && category !== "All") {
      filtered = filtered.filter(c => c.category === category);
    }

    if (search) {
      const s = (search as string).toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(s) || 
        c.description.toLowerCase().includes(s) ||
        c.instructorName.toLowerCase().includes(s)
      );
    }

    res.json(filtered);
  });

  // Courses: Create
  app.post("/api/courses", (req, res) => {
    const { title, description, instructorId, instructorName, category, price, thumbnail } = req.body;
    if (!title || !description || !instructorId) {
      return res.status(400).json({ error: "Title, description, and instructor context are required." });
    }

    const db = readDB();
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      description,
      instructorId,
      instructorName: instructorName || "Instructor",
      category: category || "General",
      price: Number(price) || 0,
      rating: 5.0,
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60",
      status: "pending" // Admin must approve
    };

    db.courses.push(newCourse);
    writeDB(db);
    res.status(201).json(newCourse);
  });

  // Courses: Update (e.g. Approve/Reject or edit course content)
  app.put("/api/courses/:id", (req, res) => {
    const db = readDB();
    const courseIndex = db.courses.findIndex(c => c.id === req.params.id);
    if (courseIndex === -1) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updatedCourse = {
      ...db.courses[courseIndex],
      ...req.body
    };

    db.courses[courseIndex] = updatedCourse;

    // Send notifications to instructor if approved/rejected
    if (req.body.status && req.body.status !== db.courses[courseIndex].status) {
      const notification: AppNotification = {
        id: `not-${Date.now()}`,
        userId: updatedCourse.instructorId,
        text: `Your course "${updatedCourse.title}" has been ${req.body.status} by the administrator.`,
        timestamp: new Date().toISOString(),
        read: false
      };
      db.notifications.push(notification);
    }

    writeDB(db);
    res.json(updatedCourse);
  });

  // Courses: Delete
  app.delete("/api/courses/:id", (req, res) => {
    const db = readDB();
    db.courses = db.courses.filter(c => c.id !== req.params.id);
    // clean up associated lessons/modules if needed
    writeDB(db);
    res.json({ success: true, message: "Course deleted successfully." });
  });

  // Get Course Structure (Modules & Lessons)
  app.get("/api/courses/:courseId/structure", (req, res) => {
    const db = readDB();
    const courseId = req.params.courseId;
    
    const courseModules = db.modules
      .filter(m => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);

    const modulesWithLessons = courseModules.map(m => {
      const lessons = db.lessons
        .filter(l => l.moduleId === m.id)
        .sort((a, b) => a.order - b.order);
      return {
        ...m,
        lessons
      };
    });

    res.json({ modules: modulesWithLessons });
  });

  // Add Module to Course
  app.post("/api/courses/:courseId/modules", (req, res) => {
    const { title, order } = req.body;
    if (!title) return res.status(400).json({ error: "Module title is required" });

    const db = readDB();
    const newModule: CourseModule = {
      id: `mod-${Date.now()}`,
      courseId: req.params.courseId,
      title,
      order: Number(order) || (db.modules.filter(m => m.courseId === req.params.courseId).length + 1)
    };

    db.modules.push(newModule);
    writeDB(db);
    res.status(201).json(newModule);
  });

  // Add Lesson to Module
  app.post("/api/modules/:moduleId/lessons", (req, res) => {
    const { title, courseId, videoUrl, pdfUrl, content, duration, order, resourceSource, resourceFormat, resourceUrl } = req.body;
    if (!title || !courseId) return res.status(400).json({ error: "Lesson title and course ID are required." });

    const db = readDB();
    const newLesson: Lesson = {
      id: `les-${Date.now()}`,
      moduleId: req.params.moduleId,
      courseId,
      title,
      videoUrl: videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      pdfUrl: pdfUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      content: content || "No content provided yet.",
      duration: duration || "10:00",
      order: Number(order) || (db.lessons.filter(l => l.moduleId === req.params.moduleId).length + 1),
      resourceSource,
      resourceFormat,
      resourceUrl
    };

    db.lessons.push(newLesson);

    // Notify enrolled students of course updates
    const enrollments = db.enrollments.filter(e => e.courseId === courseId);
    enrollments.forEach(enr => {
      db.notifications.push({
        id: `not-${Date.now()}-${enr.studentId}`,
        userId: enr.studentId,
        text: `New lesson added: "${title}" in your course!`,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    writeDB(db);
    res.status(201).json(newLesson);
  });

  // Get Assignments & Submissions
  app.get("/api/courses/:courseId/assignments", (req, res) => {
    const db = readDB();
    const courseId = req.params.courseId;
    const assignments = db.assignments.filter(a => a.courseId === courseId);
    res.json(assignments);
  });

  app.post("/api/lessons/:lessonId/assignments", (req, res) => {
    const { title, instructions, maxPoints, courseId } = req.body;
    if (!title || !instructions || !courseId) {
      return res.status(400).json({ error: "Title, instructions and courseId are required" });
    }

    const db = readDB();
    const newAssignment: Assignment = {
      id: `asg-${Date.now()}`,
      lessonId: req.params.lessonId,
      courseId,
      title,
      instructions,
      maxPoints: Number(maxPoints) || 100
    };

    db.assignments.push(newAssignment);
    writeDB(db);
    res.status(201).json(newAssignment);
  });

  // Submit Assignment Work
  app.post("/api/assignments/:assignmentId/submit", (req, res) => {
    const { studentId, studentName, workUrl, courseId } = req.body;
    if (!studentId || !workUrl || !courseId) {
      return res.status(400).json({ error: "Student profile context and assignment solution are required." });
    }

    const db = readDB();
    const newSubmission: Submission = {
      id: `sub-${Date.now()}`,
      assignmentId: req.params.assignmentId,
      courseId,
      studentId,
      studentName,
      workUrl,
      status: "submitted",
      submittedAt: new Date().toISOString()
    };

    db.submissions.push(newSubmission);

    // Notify instructor
    const course = db.courses.find(c => c.id === courseId);
    if (course) {
      db.notifications.push({
        id: `not-${Date.now()}`,
        userId: course.instructorId,
        text: `Student ${studentName} submitted an assignment work for "${course.title}".`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    writeDB(db);
    res.status(201).json(newSubmission);
  });

  // Get Submissions for Teachers
  app.get("/api/teachers/:teacherId/submissions", (req, res) => {
    const db = readDB();
    // find courses this teacher owns
    const myCourses = db.courses.filter(c => c.instructorId === req.params.teacherId).map(c => c.id);
    const submissions = db.submissions.filter(s => myCourses.includes(s.courseId));
    res.json(submissions);
  });

  // Grade Submission
  app.post("/api/submissions/:submissionId/grade", (req, res) => {
    const { score, feedback } = req.body;
    if (score === undefined) return res.status(400).json({ error: "Score is required" });

    const db = readDB();
    const subIndex = db.submissions.findIndex(s => s.id === req.params.submissionId);
    if (subIndex === -1) return res.status(404).json({ error: "Submission not found" });

    db.submissions[subIndex].score = Number(score);
    db.submissions[subIndex].feedback = feedback;
    db.submissions[subIndex].status = "graded";

    // Notify student
    db.notifications.push({
      id: `not-${Date.now()}`,
      userId: db.submissions[subIndex].studentId,
      text: `Your submission has been graded. Score: ${score}. Feedback: ${feedback || "None"}`,
      timestamp: new Date().toISOString(),
      read: false
    });

    writeDB(db);
    res.json(db.submissions[subIndex]);
  });

  // Get Student Enrollments & Course Progress
  app.get("/api/students/:studentId/enrollments", (req, res) => {
    const db = readDB();
    const enrollments = db.enrollments.filter(e => e.studentId === req.params.studentId);
    res.json(enrollments);
  });

  // Enroll in Course (Manual or post-Checkout)
  app.post("/api/courses/:courseId/enroll", (req, res) => {
    const { studentId, plan, paymentMethod, provider, amount, currency, amountETB } = req.body;
    if (!studentId) return res.status(400).json({ error: "Student ID required" });

    const db = readDB();
    const alreadyEnrolled = db.enrollments.find(e => e.studentId === studentId && e.courseId === req.params.courseId);
    if (alreadyEnrolled) {
      return res.json(alreadyEnrolled);
    }

    const course = db.courses.find(c => c.id === req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const isPendingApproval = paymentMethod === "telebirr" || paymentMethod === "bank";

    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      studentId,
      courseId: req.params.courseId,
      progress: 0,
      completedLessons: [],
      enrolledAt: new Date().toISOString(),
      status: isPendingApproval ? "pending_payment" : "active"
    };

    db.enrollments.push(newEnrollment);

    // Record invoice / billing
    const finalPrice = amount !== undefined ? Number(amount) : course.price;
    const finalPriceETB = amountETB || Math.round(finalPrice * 120);
    const invoiceNum = `INV-2026-${Math.floor(Math.random() * 90000) + 10000}`;
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      studentId,
      courseId: req.params.courseId,
      amount: finalPrice,
      status: isPendingApproval ? "pending" : "paid",
      date: new Date().toISOString(),
      invoiceNumber: invoiceNum,
      plan: plan || "single-course",
      paymentMethod: paymentMethod || "card",
      provider: provider || (paymentMethod === "telebirr" ? "Telebirr" : "Stripe"),
      currency: currency || (isPendingApproval ? "ETB" : "USD"),
      amountETB: isPendingApproval ? finalPriceETB : undefined
    };
    db.payments.push(newPayment);

    // Notify user
    let notificationText = `Congratulations! You enrolled successfully in "${course.title}".`;
    if (paymentMethod === "telebirr") {
      notificationText = `📱 Telebirr payment of ${finalPriceETB} ETB is pending verification! Our automated audit system is validating receipt ${invoiceNum}.`;
    } else if (paymentMethod === "bank") {
      notificationText = `🏦 CBE Bank transfer of ${finalPriceETB} ETB via account ${provider} is pending verification. Transaction: ${invoiceNum}.`;
    }

    db.notifications.push({
      id: `not-${Date.now()}`,
      userId: studentId,
      text: notificationText,
      timestamp: new Date().toISOString(),
      read: false
    });

    // Send integrated billing receipt email to student
    const student = db.users.find(u => u.id === studentId);
    if (student) {
      const receiptBody = `Dear ${student.name},

Thank you for your enrollment in "${course.title}".

Here is your secure transaction billing receipt:
----------------------------------------------
Invoice Reference: ${invoiceNum}
Date: ${new Date().toLocaleString()}
Plan Option: ${plan || "Single-Course Access"}
Payment Method: ${paymentMethod || "Card Processing"}
Verification Provider: ${provider || (paymentMethod === "telebirr" ? "Telebirr" : "Stripe")}
Total Paid Amount: ${isPendingApproval ? `${finalPriceETB} ETB` : `$${finalPrice} USD`}
Enrollment Status: ${isPendingApproval ? "Pending Verification Review" : "Fully Activated & Enrolled"}

${isPendingApproval 
  ? `Please allow some time for our administrative board to verify your payment receipt. You will receive an official approval notification letter once confirmed.` 
  : `Your course materials have been fully unlocked. You may access your study dashboard immediately to begin learning.`}

If you have any academic or administrative inquiries, please compose a secure email to registrar@newtech.edu within the integrated webmail system.

Sincerely,
LMS Registrar & Billing Office
`;

      const receiptEmail: EmailMessage = {
        id: `email-receipt-${Date.now()}`,
        senderEmail: "billing@newtech.edu",
        senderName: "LMS Registrar & Billing",
        receiverEmail: student.email,
        receiverName: student.name,
        subject: `📄 Secure Enrollment & Billing Receipt: ${course.title} (${invoiceNum})`,
        body: receiptBody,
        timestamp: new Date().toISOString(),
        isRead: false,
        isStarred: false,
        isDraft: false,
        isTrash: false,
        attachments: []
      };
      if (!db.emails) db.emails = [];
      db.emails.push(receiptEmail);
    }

    writeDB(db);
    res.status(201).json(newEnrollment);
  });

  // Get All Student Payments for Admin Verification
  app.get("/api/admin/payments", (req, res) => {
    const db = readDB();
    const detailedPayments = db.payments.map(p => {
      const student = db.users.find(u => u.id === p.studentId);
      const course = db.courses.find(c => c.id === p.courseId);
      return {
        ...p,
        studentName: student ? student.name : "Unknown Student",
        studentEmail: student ? student.email : "N/A",
        studentPhone: student ? student.phone : "N/A",
        courseTitle: course ? course.title : "Direct Registration"
      };
    });
    res.json(detailedPayments);
  });

  // Approve a Payment
  app.post("/api/admin/payments/:paymentId/approve", (req, res) => {
    const db = readDB();
    const payment = db.payments.find(p => p.id === req.params.paymentId);
    if (!payment) return res.status(404).json({ error: "Payment record not found." });

    payment.status = "paid";
    
    // Activate the corresponding student enrollment
    if (payment.courseId) {
      const enrollment = db.enrollments.find(e => e.studentId === payment.studentId && e.courseId === payment.courseId);
      if (enrollment) {
        enrollment.status = "active";
      }
    }

    const course = db.courses.find(c => c.id === payment.courseId);
    const courseTitle = course ? course.title : "your syllabus";
    db.notifications.push({
      id: `not-${Date.now()}`,
      userId: payment.studentId,
      text: `✅ Payment Verified! Your payment of ${payment.amountETB || Math.round(payment.amount * 120)} ETB has been approved by the Admin. Enjoy learning "${courseTitle}"!`,
      timestamp: new Date().toISOString(),
      read: false
    });

    // Send payment approval confirmation email
    const student = db.users.find(u => u.id === payment.studentId);
    if (student) {
      const approvalEmailBody = `Dear ${student.name},

We are pleased to inform you that your payment of ${payment.amountETB || Math.round(payment.amount * 120)} ETB has been audited and approved by our administrative board.

Enrollment Details:
-------------------
Course Title: ${courseTitle}
Invoice Reference: ${payment.invoiceNumber}
Payment Provider: ${payment.provider}
Clearance Status: FULLY VERIFIED & ACTIVATED

You now have unrestricted, full access to all lessons, quizzes, and file attachments of "${courseTitle}".

Welcome aboard, and we wish you an excellent and productive learning journey!

Best regards,
LMS Administrative & Billing Board
`;

      const approvalEmail: EmailMessage = {
        id: `email-approve-${Date.now()}`,
        senderEmail: "billing@newtech.edu",
        senderName: "LMS Registrar & Billing",
        receiverEmail: student.email,
        receiverName: student.name,
        subject: `✅ Payment Approved & Verified: ${courseTitle}`,
        body: approvalEmailBody,
        timestamp: new Date().toISOString(),
        isRead: false,
        isStarred: false,
        isDraft: false,
        isTrash: false,
        attachments: []
      };
      if (!db.emails) db.emails = [];
      db.emails.push(approvalEmail);
    }

    writeDB(db);
    res.json({ success: true, payment });
  });

  // Reject / Fail a Payment
  app.post("/api/admin/payments/:paymentId/reject", (req, res) => {
    const db = readDB();
    const payment = db.payments.find(p => p.id === req.params.paymentId);
    if (!payment) return res.status(404).json({ error: "Payment record not found." });

    payment.status = "failed";

    // Remove enrollment
    if (payment.courseId) {
      db.enrollments = db.enrollments.filter(e => !(e.studentId === payment.studentId && e.courseId === payment.courseId));
    }

    const course = db.courses.find(c => c.id === payment.courseId);
    const courseTitle = course ? course.title : "your syllabus";
    db.notifications.push({
      id: `not-${Date.now()}`,
      userId: payment.studentId,
      text: `❌ Payment Rejected. Your payment of ${payment.amountETB || Math.round(payment.amount * 120)} ETB could not be verified. Please contact system admin.`,
      timestamp: new Date().toISOString(),
      read: false
    });

    // Send payment rejection notification email
    const student = db.users.find(u => u.id === payment.studentId);
    if (student) {
      const rejectEmailBody = `Dear ${student.name},

We regret to inform you that your manual payment transfer of ${payment.amountETB || Math.round(payment.amount * 120)} ETB for the course "${courseTitle}" could not be verified and has been rejected by our administrative board.

Transaction Reference: ${payment.invoiceNumber}
Status: REJECTED / AUDIT FAILURE

If you believe this is a clerical mistake, or if you made a bank/telebirr transfer that is valid, please compose a secure email to registrar@newtech.edu with your payment receipt image reference, or resubmit your payment request.

Sincerely,
LMS Administrative & Billing Board
`;

      const rejectEmail: EmailMessage = {
        id: `email-reject-${Date.now()}`,
        senderEmail: "billing@newtech.edu",
        senderName: "LMS Registrar & Billing",
        receiverEmail: student.email,
        receiverName: student.name,
        subject: `❌ Payment Verification Failed: ${courseTitle}`,
        body: rejectEmailBody,
        timestamp: new Date().toISOString(),
        isRead: false,
        isStarred: false,
        isDraft: false,
        isTrash: false,
        attachments: []
      };
      if (!db.emails) db.emails = [];
      db.emails.push(rejectEmail);
    }

    writeDB(db);
    res.json({ success: true, payment });
  });

  // Sync payments for specific student
  app.get("/api/students/:studentId/payments", (req, res) => {
    const db = readDB();
    const history = db.payments.filter(p => p.studentId === req.params.studentId);
    res.json(history);
  });

  // Mark Lesson Completed and recalculate progress / auto-generate certificate
  app.post("/api/lessons/:lessonId/complete", (req, res) => {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) return res.status(400).json({ error: "Student ID and course ID required" });

    const db = readDB();
    const enrIndex = db.enrollments.findIndex(e => e.studentId === studentId && e.courseId === courseId);
    if (enrIndex === -1) return res.status(404).json({ error: "Enrollment not found" });

    const enrollment = db.enrollments[enrIndex];
    if (!enrollment.completedLessons.includes(req.params.lessonId)) {
      enrollment.completedLessons.push(req.params.lessonId);
    }

    // Calculate progress %
    const totalLessons = db.lessons.filter(l => l.courseId === courseId).length;
    const progressPercent = totalLessons > 0 ? Math.round((enrollment.completedLessons.length / totalLessons) * 100) : 100;
    enrollment.progress = Math.min(progressPercent, 100);

    // Check certificate eligibility (>= 100%)
    let newlyGeneratedCertificate: Certificate | null = null;
    if (enrollment.progress >= 100) {
      const alreadyHasCert = db.certificates.some(c => c.studentId === studentId && c.courseId === courseId);
      if (!alreadyHasCert) {
        const student = db.users.find(u => u.id === studentId);
        const course = db.courses.find(c => c.id === courseId);
        const code = `CERT-${courseId.toUpperCase().replace("COURSE-", "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        newlyGeneratedCertificate = {
          id: `cert-${Date.now()}`,
          studentId,
          studentName: student?.name || "Student Name",
          courseId,
          courseName: course?.title || "LMS Certified Course",
          instructorName: course?.instructorName || "LMS Faculty",
          completionDate: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
          verificationCode: code
        };

        db.certificates.push(newlyGeneratedCertificate);

        db.notifications.push({
          id: `not-${Date.now()}`,
          userId: studentId,
          text: `🎉 Amazing! You have completed "${course?.title}" and your digital certificate is generated!`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }

    writeDB(db);
    res.json({ enrollment, certificate: newlyGeneratedCertificate });
  });

  // Get Certificates
  app.get("/api/students/:studentId/certificates", (req, res) => {
    const db = readDB();
    const certs = db.certificates.filter(c => c.studentId === req.params.studentId);
    res.json(certs);
  });

  app.get("/api/certificates/verify/:code", (req, res) => {
    const db = readDB();
    const cert = db.certificates.find(c => c.verificationCode === req.params.code);
    if (!cert) return res.status(404).json({ error: "Certificate verification failed. Code invalid." });
    res.json(cert);
  });

  // Quizzes API
  app.get("/api/courses/:courseId/quizzes", (req, res) => {
    const db = readDB();
    const courseQuizzes = db.quizzes.filter(q => q.courseId === req.params.courseId);
    res.json(courseQuizzes);
  });

  // Create custom Quiz manually (by teacher)
  app.post("/api/courses/:courseId/quizzes", (req, res) => {
    const { title, questions, lessonId } = req.body;
    if (!title || !questions) return res.status(400).json({ error: "Title and questions list are required" });

    const db = readDB();
    const quizId = `quiz-${Date.now()}`;
    const formattedQuestions = questions.map((q: any, idx: number) => ({
      id: `q-${Date.now()}-${idx}`,
      quizId,
      text: q.text,
      type: q.type || "multiple-choice",
      options: q.options || [],
      correctAnswer: q.correctAnswer
    }));

    const newQuiz: Quiz = {
      id: quizId,
      courseId: req.params.courseId,
      lessonId,
      title,
      questions: formattedQuestions
    };

    db.quizzes.push(newQuiz);
    writeDB(db);
    res.status(201).json(newQuiz);
  });

  // Submit and grade a Quiz
  app.post("/api/quizzes/:quizId/submit", (req, res) => {
    const { answers, studentId, studentName, courseId } = req.body; // Map of questionId -> studentChoice
    if (!answers) return res.status(400).json({ error: "Submissions answers are missing." });

    const db = readDB();
    const quiz = db.quizzes.find(q => q.id === req.params.quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    let score = 0;
    const details = quiz.questions.map(q => {
      const studentAnswer = answers[q.id]?.toString().trim().toLowerCase();
      const correctAnswer = q.correctAnswer.toString().trim().toLowerCase();
      const isCorrect = studentAnswer === correctAnswer;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        text: q.text,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect
      };
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);

    // Save exam activity results in student history via notifications/logs
    db.notifications.push({
      id: `not-${Date.now()}`,
      userId: studentId,
      text: `Completed Quiz "${quiz.title}". Scored ${score}/${quiz.questions.length} (${percentage}%).`,
      timestamp: new Date().toISOString(),
      read: false
    });

    writeDB(db);
    res.json({
      score,
      totalQuestions: quiz.questions.length,
      percentage,
      feedback: percentage >= 80 ? "Superb job! Master level comprehension." : percentage >= 50 ? "Good work, review the slide deck to score higher next time!" : "Review the lesson resources and retry.",
      details
    });
  });

  // Group Study Chats
  app.get("/api/messages/:courseId", (req, res) => {
    const db = readDB();
    const list = db.messages.filter(m => m.courseId === req.params.courseId);
    res.json(list);
  });

  app.post("/api/messages", (req, res) => {
    const { senderId, senderName, receiverId, receiverName, courseId, text } = req.body;
    if (!senderId || !text) return res.status(400).json({ error: "Sender ID and text are required" });

    const db = readDB();
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId,
      senderName: senderName || "Anonymous User",
      receiverId: receiverId || "group",
      receiverName: receiverName || "Study Group",
      courseId,
      text,
      timestamp: new Date().toISOString()
    };

    db.messages.push(newMessage);
    writeDB(db);
    res.status(201).json(newMessage);
  });

  // Live classes Scheduler (Zoom / Meet)
  app.get("/api/live-classes", (req, res) => {
    const db = readDB();
    res.json(db.liveClasses);
  });

  app.post("/api/live-classes", (req, res) => {
    const { courseId, courseName, title, scheduledAt, link } = req.body;
    if (!courseId || !title || !scheduledAt || !link) {
      return res.status(400).json({ error: "Required fields missing for scheduling live classes." });
    }

    const db = readDB();
    const newLive: LiveClass = {
      id: `live-${Date.now()}`,
      courseId,
      courseName: courseName || "General Course Session",
      title,
      scheduledAt,
      link,
      recordingsUrl: "https://example.com/recordings/live-soon.mp4"
    };

    db.liveClasses.push(newLive);

    // Notify enrolled students of scheduled live lecture
    const enrolledStudents = db.enrollments.filter(e => e.courseId === courseId).map(e => e.studentId);
    enrolledStudents.forEach(stuId => {
      db.notifications.push({
        id: `not-${Date.now()}-${stuId}`,
        userId: stuId,
        text: `New Live Class scheduled: "${title}" on ${new Date(scheduledAt).toLocaleString()}.`,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    writeDB(db);
    res.status(201).json(newLive);
  });

  // Billing Payments & Invoices History
  app.get("/api/payments/:studentId", (req, res) => {
    const db = readDB();
    const history = db.payments.filter(p => p.studentId === req.params.studentId);
    res.json(history);
  });

  // Stripe Checkout Simulator
  app.post("/api/payments/checkout", (req, res) => {
    const { studentId, courseId, plan } = req.body;
    if (!studentId) return res.status(400).json({ error: "Student ID context is required" });

    const db = readDB();
    let price = 29.00; // default subscription monthly
    let desc = "LMS Subscription Plan";

    if (plan === "yearly") {
      price = 199.00;
      desc = "LMS Unlimited Yearly Membership";
    } else if (courseId) {
      const course = db.courses.find(c => c.id === courseId);
      if (course) {
        price = course.price;
        desc = `Course: "${course.title}"`;
      }
    }

    // Stripe mock invoice creation
    const invoiceNum = `INV-2026-${Math.floor(Math.random() * 90000) + 10000}`;
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      studentId,
      courseId,
      amount: price,
      status: "paid",
      date: new Date().toISOString(),
      invoiceNumber: invoiceNum,
      plan: plan || "single-course"
    };

    db.payments.push(newPayment);

    // Auto enroll in course if single course checkout
    if (courseId) {
      const alreadyEnrolled = db.enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
      if (!alreadyEnrolled) {
        db.enrollments.push({
          id: `enr-${Date.now()}`,
          studentId,
          courseId,
          progress: 0,
          completedLessons: [],
          enrolledAt: new Date().toISOString()
        });
      }
    } else {
      // User subscribed to subscription tier, auto-enroll them in all approved courses as a vip feature!
      db.courses.forEach(c => {
        if (c.status === "approved") {
          const alreadyEnrolled = db.enrollments.find(e => e.studentId === studentId && e.courseId === c.id);
          if (!alreadyEnrolled) {
            db.enrollments.push({
              id: `enr-${Date.now()}`,
              studentId,
              courseId: c.id,
              progress: 0,
              completedLessons: [],
              enrolledAt: new Date().toISOString()
            });
          }
        }
      });
    }

    db.notifications.push({
      id: `not-${Date.now()}`,
      userId: studentId,
      text: `Receipt generated for "${desc}". Charged $${price}. Invoice ${invoiceNum} sent to email.`,
      timestamp: new Date().toISOString(),
      read: false
    });

    writeDB(db);
    res.json({ success: true, payment: newPayment });
  });

  // Notifications API
  app.get("/api/notifications/:userId", (req, res) => {
    const db = readDB();
    const list = db.notifications
      .filter(n => n.userId === req.params.userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(list);
  });

  app.post("/api/notifications/:id/read", (req, res) => {
    const db = readDB();
    const nIdx = db.notifications.findIndex(n => n.id === req.params.id);
    if (nIdx !== -1) {
      db.notifications[nIdx].read = true;
      writeDB(db);
    }
    res.json({ success: true });
  });

  // Reports & Analytics API
  app.get("/api/reports/admin", (req, res) => {
    const db = readDB();
    // revenue analytics mock-calculation
    const totalRev = db.payments.reduce((acc, curr) => acc + curr.amount, 0);
    const activeUsers = db.users.length;
    const enrolls = db.enrollments.length;

    // Daily revenue graph dataset
    const dailyRevenue = [
      { date: "Mon", revenue: 450, enrollments: 4 },
      { date: "Tue", revenue: 890, enrollments: 8 },
      { date: "Wed", revenue: 320, enrollments: 3 },
      { date: "Thu", revenue: 1450, enrollments: 12 },
      { date: "Fri", revenue: 980, enrollments: 9 },
      { date: "Sat", revenue: totalRev > 4000 ? totalRev - 4000 : totalRev, enrollments: 15 },
      { date: "Today", revenue: totalRev, enrollments: enrolls },
    ];

    res.json({
      totalRevenue: totalRev,
      activeUsers,
      totalEnrollments: enrolls,
      dailyRevenue,
      coursesOverview: db.courses.map(c => ({
        id: c.id,
        title: c.title,
        enrollmentCount: db.enrollments.filter(e => e.courseId === c.id).length,
        rating: c.rating
      }))
    });
  });

  // --- SERVER-SIDE GEMINI AI ENDPOINTS ---

  // AI Tutor Helper Route
  app.post("/api/ai/tutor", async (req, res) => {
    const { lessonContent, lessonTitle, userMessage, history } = req.body;
    if (!userMessage) return res.status(400).json({ error: "Message content required." });

    const response = await getAITutorResponse(
      lessonContent || "No specific lesson material selected.",
      lessonTitle || "General LMS Course Room",
      userMessage,
      history || []
    );

    res.json({ text: response });
  });

  // AI Quiz Maker Route
  app.post("/api/ai/generate-quiz", async (req, res) => {
    const { lessonTitle, lessonContent, courseId } = req.body;
    if (!lessonTitle || !courseId) {
      return res.status(400).json({ error: "Lesson title and Course ID context are required." });
    }

    const quizQuestions = await generateAIQuiz(lessonTitle, lessonContent || "Machine Learning and fullstack development concepts");
    
    // Auto-save the quiz in the DB so students can instantly take it!
    const db = readDB();
    const quizId = `quiz-ai-${Date.now()}`;
    const newQuiz: Quiz = {
      id: quizId,
      courseId,
      title: `AI-Generated Test: ${lessonTitle}`,
      questions: quizQuestions.map((q, idx) => ({
        id: `q-ai-${idx}-${Date.now()}`,
        quizId,
        text: q.text,
        type: q.type || "multiple-choice",
        options: q.options || [],
        correctAnswer: q.correctAnswer
      }))
    };

    db.quizzes.push(newQuiz);
    writeDB(db);

    res.status(201).json(newQuiz);
  });

  // AI Course Advisor Route
  app.post("/api/ai/recommend", async (req, res) => {
    const { userProfile, interests } = req.body;
    if (!interests) return res.status(400).json({ error: "Interests and objectives are required." });

    const db = readDB();
    const studentProfile = userProfile || { name: "Learner", enrolledCourses: [], completedCourses: [] };
    const availableCourses = db.courses
      .filter(c => c.status === "approved")
      .map(c => ({ id: c.id, title: c.title, category: c.category, description: c.description }));

    const recommendations = await getAICourseRecommendation(studentProfile, availableCourses, interests);
    res.json(recommendations);
  });


  // --- SOCIAL MEDIA INTEGRATIONS & PROFILE UPDATE ---
  app.post("/api/users/:id/socials", (req, res) => {
    const { telegram, instagram } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });
    
    db.users[userIndex].telegram = telegram;
    db.users[userIndex].instagram = instagram;
    writeDB(db);
    res.json({ success: true, user: db.users[userIndex] });
  });

  // --- SECURED INTEGRATED EMAIL SYSTEM API ---

  // Get emails (incoming, outgoing, drafts, trash) for a specific user email
  app.get("/api/emails/:email", (req, res) => {
    const db = readDB();
    const userEmail = req.params.email.toLowerCase().trim();
    
    if (!db.emails) db.emails = [];

    const filtered = db.emails.filter(e => 
      e.senderEmail.toLowerCase().trim() === userEmail ||
      e.receiverEmail.toLowerCase().trim() === userEmail
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(filtered);
  });

  // Toggle Star status
  app.put("/api/emails/:id/star", (req, res) => {
    const db = readDB();
    if (!db.emails) db.emails = [];
    const email = db.emails.find(e => e.id === req.params.id);
    if (!email) return res.status(404).json({ error: "Email not found" });

    email.isStarred = !email.isStarred;
    writeDB(db);
    res.json(email);
  });

  // Mark as Read/Unread
  app.put("/api/emails/:id/read", (req, res) => {
    const db = readDB();
    if (!db.emails) db.emails = [];
    const email = db.emails.find(e => e.id === req.params.id);
    if (!email) return res.status(404).json({ error: "Email not found" });

    email.isRead = req.body.isRead !== undefined ? req.body.isRead : true;
    writeDB(db);
    res.json(email);
  });

  // Mark as Trash or permanently delete
  app.delete("/api/emails/:id", (req, res) => {
    const db = readDB();
    if (!db.emails) db.emails = [];
    const emailIndex = db.emails.findIndex(e => e.id === req.params.id);
    if (emailIndex === -1) return res.status(404).json({ error: "Email not found" });

    const email = db.emails[emailIndex];
    if (req.query.permanent === "true" || email.isTrash) {
      db.emails.splice(emailIndex, 1);
    } else {
      email.isTrash = true;
    }
    writeDB(db);
    res.json({ success: true });
  });

  // Get active contacts/directory for autocomplete
  app.get("/api/emails/contacts/directory", (req, res) => {
    const db = readDB();
    const directory = db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    }));
    directory.push({
      id: "ai-copilot",
      name: "Gemini Academic Copilot",
      email: "copilot@newtech.edu",
      role: "bot" as any
    });
    res.json(directory);
  });

  // Send / Save draft email
  app.post("/api/emails/send", async (req, res) => {
    const { senderEmail, senderName, receiverEmail, subject, body, attachments, isDraft } = req.body;
    if (!senderEmail || !receiverEmail || !subject) {
      return res.status(400).json({ error: "Sender email, receiver email, and subject are required." });
    }

    const db = readDB();
    if (!db.emails) db.emails = [];

    let finalReceiverName = receiverEmail;
    const recipientUser = db.users.find(u => u.email.toLowerCase().trim() === receiverEmail.toLowerCase().trim());
    if (recipientUser) {
      finalReceiverName = recipientUser.name;
    } else if (receiverEmail.toLowerCase().trim() === "copilot@newtech.edu") {
      finalReceiverName = "Gemini Academic Copilot";
    }

    const newEmail: EmailMessage = {
      id: `email-${Date.now()}`,
      senderEmail,
      senderName,
      receiverEmail,
      receiverName: finalReceiverName,
      subject,
      body,
      timestamp: new Date().toISOString(),
      isRead: false,
      isStarred: false,
      isDraft: !!isDraft,
      isTrash: false,
      attachments: attachments || []
    };

    db.emails.push(newEmail);

    if (!isDraft) {
      if (recipientUser) {
        db.notifications.push({
          id: `not-mail-${Date.now()}`,
          userId: recipientUser.id,
          text: `📧 New integrated email from ${senderName}: "${subject}"`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      if (receiverEmail.toLowerCase().trim() === "copilot@newtech.edu") {
        res.status(201).json(newEmail);
        
        setTimeout(async () => {
          const freshDb = readDB();
          if (!freshDb.emails) freshDb.emails = [];
          
          let aiText = "Thank you for reaching out to the Gemini Academic Copilot team.";
          try {
            const prompt = `You are the Gemini Academic Copilot, an advanced AI research assistant integrated inside the school's secure internal email network.
You have received an email from "${senderName}" (${senderEmail}) with subject "${subject}".
Email Body:
"${body}"

Compose a professional, well-formatted, extremely helpful, and warm academic reply email. Provide direct tips, guidance, formulas, or general encouragement. Keep it styled like a professional email, starting with "Dear ${senderName}," and signing off as "Gemini Academic Copilot". Do NOT use markdown code blocks for the overall email, use clear spacing.`;

            const response = await getAITutorResponse(
              "LMS Internal secure email responder",
              "Academic Co-Pilot Support",
              prompt,
              []
            );
            if (response) {
              aiText = response;
            }
          } catch (e) {
            console.error("AI Email generation error:", e);
            aiText = `Dear ${senderName},\n\nThank you for writing to the Gemini Academic Copilot. I have received your message regarding "${subject}".\n\nAs your integrated academic assistant, I am always ready to review your course submissions, suggest readings, or write custom study guides. Please specify which course syllabus or topics you'd like to work on, and I'll generate a personalized study roadmap for you!\n\nBest of luck with your studies,\nGemini Academic Copilot\nNew-Tech School Platform`;
          }

          const responseEmail: EmailMessage = {
            id: `email-ai-reply-${Date.now()}`,
            senderEmail: "copilot@newtech.edu",
            senderName: "Gemini Academic Copilot",
            receiverEmail: senderEmail,
            receiverName: senderName,
            subject: `Re: ${subject}`,
            body: aiText,
            timestamp: new Date().toISOString(),
            isRead: false,
            isStarred: false,
            isDraft: false,
            isTrash: false,
            attachments: []
          };

          freshDb.emails.push(responseEmail);
          
          const originalSenderUser = freshDb.users.find(u => u.email.toLowerCase().trim() === senderEmail.toLowerCase().trim());
          if (originalSenderUser) {
            freshDb.notifications.push({
              id: `not-mail-ai-${Date.now()}`,
              userId: originalSenderUser.id,
              text: `🤖 Gemini Academic Copilot replied to your email: "${subject}"`,
              timestamp: new Date().toISOString(),
              read: false
            });
          }

          writeDB(freshDb);
        }, 1000);
        return;
      }
    }

    writeDB(db);
    res.status(201).json(newEmail);
  });

  // --- COURSE GRADING REPORTS & EXCEL LINKAGE ---
  app.post("/api/teachers/grades/submit", (req, res) => {
    const { courseId, courseTitle, teacherId, teacherName, grades } = req.body;
    if (!courseId || !teacherId || !grades || !Array.isArray(grades)) {
      return res.status(400).json({ error: "Required grade report details are missing." });
    }
    const db = readDB();
    const newReport: GradeReport = {
      id: `report-${Date.now()}`,
      courseId,
      courseTitle,
      teacherId,
      teacherName,
      status: "pending",
      grades,
      submittedAt: new Date().toISOString()
    };
    db.gradeReports.push(newReport);

    db.users.filter(u => u.role === "admin").forEach(admin => {
      db.notifications.push({
        id: `not-${Date.now()}-${admin.id}`,
        userId: admin.id,
        text: `🎓 New official Course Grades list submitted for "${courseTitle}" by ${teacherName}. Needs Admin audit!`,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    writeDB(db);
    res.status(201).json(newReport);
  });

  app.get("/api/teachers/:teacherId/grades", (req, res) => {
    const db = readDB();
    const list = db.gradeReports.filter(r => r.teacherId === req.params.teacherId);
    res.json(list);
  });

  app.get("/api/admin/grades/pending", (req, res) => {
    const db = readDB();
    const list = db.gradeReports.filter(r => r.status === "pending");
    res.json(list);
  });

  app.post("/api/admin/grades/:reportId/review", (req, res) => {
    const { status, feedback } = req.body; 
    if (!status) return res.status(400).json({ error: "Review status is required." });

    const db = readDB();
    const report = db.gradeReports.find(r => r.id === req.params.reportId);
    if (!report) return res.status(404).json({ error: "Grade report not found." });

    report.status = status;
    report.feedback = feedback;
    report.reviewedAt = new Date().toISOString();

    db.notifications.push({
      id: `not-${Date.now()}-${report.teacherId}`,
      userId: report.teacherId,
      text: `🔔 Your submitted Grade list for "${report.courseTitle}" has been ${status} by the Admin.`,
      timestamp: new Date().toISOString(),
      read: false
    });

    if (status === "approved") {
      report.grades.forEach(grade => {
        db.notifications.push({
          id: `not-${Date.now()}-${grade.studentId}`,
          userId: grade.studentId,
          text: `🎉 Your final result for "${report.courseTitle}" is now officially published! Score: ${grade.score}% (${grade.grade}).`,
          timestamp: new Date().toISOString(),
          read: false
        });
      });
    }

    writeDB(db);
    res.json({ success: true, report });
  });

  app.get("/api/students/:studentId/grades", (req, res) => {
    const db = readDB();
    const studentId = req.params.studentId;
    const studentGradesList: any[] = [];
    db.gradeReports.filter(r => r.status === "approved").forEach(report => {
      const g = report.grades.find(g => g.studentId === studentId);
      if (g) {
        studentGradesList.push({
          courseId: report.courseId,
          courseTitle: report.courseTitle,
          teacherName: report.teacherName,
          score: g.score,
          grade: g.grade,
          remarks: g.remarks,
          publishedAt: report.reviewedAt
        });
      }
    });
    res.json(studentGradesList);
  });

  // --- EXAMS ENGINE ---
  app.post("/api/courses/:courseId/exams", (req, res) => {
    const { title, description, startTime, endTime, durationMinutes, questions } = req.body;
    if (!title || !startTime || !endTime || !durationMinutes || !questions) {
      return res.status(400).json({ error: "Exam parameters are missing." });
    }
    const db = readDB();
    const course = db.courses.find(c => c.id === req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found." });

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      courseId: req.params.courseId,
      courseTitle: course.title,
      title,
      description: description || "",
      startTime,
      endTime,
      durationMinutes: Number(durationMinutes),
      questions: questions.map((q: any, idx: number) => ({
        id: `eq-${Date.now()}-${idx}`,
        text: q.text,
        options: q.options || [],
        correctAnswer: q.correctAnswer
      }))
    };
    db.exams.push(newExam);

    db.enrollments.filter(e => e.courseId === req.params.courseId).forEach(enr => {
      db.notifications.push({
        id: `not-${Date.now()}-${enr.studentId}`,
        userId: enr.studentId,
        text: `📅 New Exam Scheduled: "${title}" under "${course.title}". Check start timetable details!`,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    writeDB(db);
    res.status(201).json(newExam);
  });

  app.get("/api/courses/:courseId/exams", (req, res) => {
    const db = readDB();
    const list = db.exams.filter(e => e.courseId === req.params.courseId);
    res.json(list);
  });

  app.get("/api/exams/all", (req, res) => {
    const db = readDB();
    res.json(db.exams);
  });

  // --- EXAM ELIGIBILITY APIS ---
  app.post("/api/exams/:examId/apply-eligibility", (req, res) => {
    const { studentId, studentName, studentEmail, courseId, examTitle } = req.body;
    if (!studentId) return res.status(400).json({ error: "Student Context Missing." });

    const db = readDB();
    const existing = db.examEligibilities.find(el => el.examId === req.params.examId && el.studentId === studentId);
    if (existing) {
      return res.json(existing);
    }

    const newApplication: ExamEligibility = {
      id: `elig-${Date.now()}`,
      examId: req.params.examId,
      examTitle,
      courseId,
      studentId,
      studentName,
      studentEmail,
      status: "pending",
      checkedAt: new Date().toISOString()
    };
    db.examEligibilities.push(newApplication);

    const course = db.courses.find(c => c.id === courseId);
    if (course) {
      db.notifications.push({
        id: `not-${Date.now()}-${course.instructorId}`,
        userId: course.instructorId,
        text: `⏳ Student ${studentName} requested Eligibility Approval to take "${examTitle}".`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    writeDB(db);
    res.status(201).json(newApplication);
  });

  app.get("/api/teachers/:teacherId/eligibility-requests", (req, res) => {
    const db = readDB();
    const teacherCourses = db.courses.filter(c => c.instructorId === req.params.teacherId).map(c => c.id);
    const requests = db.examEligibilities.filter(el => teacherCourses.includes(el.courseId));
    res.json(requests);
  });

  app.post("/api/eligibility/:eligId/review", (req, res) => {
    const { status } = req.body; 
    if (!status) return res.status(400).json({ error: "Roster review status is required" });

    const db = readDB();
    const application = db.examEligibilities.find(el => el.id === req.params.eligId);
    if (!application) return res.status(404).json({ error: "Eligibility application not found." });

    application.status = status;
    application.checkedAt = new Date().toISOString();

    db.notifications.push({
      id: `not-${Date.now()}-${application.studentId}`,
      userId: application.studentId,
      text: `🎓 Exam eligibility for "${application.examTitle}" was ${status} by your advisor.`,
      timestamp: new Date().toISOString(),
      read: false
    });

    writeDB(db);
    res.json({ success: true, eligibility: application });
  });

  app.post("/api/exams/:examId/update-timestamps", (req, res) => {
    const { startTime, endTime, durationMinutes } = req.body;
    const db = readDB();
    const exam = db.exams.find(e => e.id === req.params.examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    if (startTime) exam.startTime = new Date(startTime).toISOString();
    if (endTime) exam.endTime = new Date(endTime).toISOString();
    if (durationMinutes !== undefined) exam.durationMinutes = Number(durationMinutes);

    writeDB(db);
    res.json({ success: true, exam });
  });

  app.post("/api/exams/:examId/toggle-student-eligibility", (req, res) => {
    const { studentId, status } = req.body;
    if (!studentId || !status) {
      return res.status(400).json({ error: "Missing studentId or status." });
    }

    const db = readDB();
    const exam = db.exams.find(e => e.id === req.params.examId);
    if (!exam) return res.status(404).json({ error: "Exam not found." });

    const student = db.users.find(u => u.id === studentId);
    if (!student) return res.status(404).json({ error: "Student not found." });

    let eligibility = db.examEligibilities.find(el => el.examId === req.params.examId && el.studentId === studentId);
    
    if (eligibility) {
      eligibility.status = status;
      eligibility.checkedAt = new Date().toISOString();
    } else {
      eligibility = {
        id: `elig-${Date.now()}`,
        examId: exam.id,
        examTitle: exam.title,
        courseId: exam.courseId,
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        status: status,
        checkedAt: new Date().toISOString()
      };
      db.examEligibilities.push(eligibility);
    }

    db.notifications.push({
      id: `not-${Date.now()}-${studentId}`,
      userId: studentId,
      text: `🎓 Exam eligibility for "${exam.title}" was updated to ${status} by your instructor.`,
      timestamp: new Date().toISOString(),
      read: false
    });

    writeDB(db);
    res.json({ success: true, eligibility });
  });

  app.get("/api/students/:studentId/eligibility-status", (req, res) => {
    const db = readDB();
    const list = db.examEligibilities.filter(el => el.studentId === req.params.studentId);
    res.json(list);
  });

  // --- EXAM RESPONSES & SUBMISSION ENGINE ---
  app.post("/api/exams/:examId/submit-responses", (req, res) => {
    const { studentId, studentName, answers } = req.body; 
    if (!studentId || !answers) {
      return res.status(400).json({ error: "Responses are empty." });
    }
    const db = readDB();
    const exam = db.exams.find(e => e.id === req.params.examId);
    if (!exam) return res.status(404).json({ error: "Exam session not found." });

    let correct = 0;
    exam.questions.forEach(q => {
      const studAns = answers[q.id]?.toString().trim().toLowerCase();
      const correctAns = q.correctAnswer.toString().trim().toLowerCase();
      if (studAns === correctAns) {
        correct++;
      }
    });

    const pct = exam.questions.length > 0 ? Math.round((correct / exam.questions.length) * 100) : 100;

    const submission: ExamSubmission = {
      id: `exsub-${Date.now()}`,
      examId: exam.id,
      studentId,
      studentName,
      score: correct,
      totalQuestions: exam.questions.length,
      percentage: pct,
      answers,
      submittedAt: new Date().toISOString()
    };
    db.examSubmissions.push(submission);

    db.notifications.push({
      id: `not-${Date.now()}-${studentId}`,
      userId: studentId,
      text: `📝 Final Exam "${exam.title}" graded. Scored: ${correct}/${exam.questions.length} (${pct}%).`,
      timestamp: new Date().toISOString(),
      read: false
    });

    writeDB(db);
    res.status(201).json(submission);
  });

  app.get("/api/students/:studentId/exam-submissions", (req, res) => {
    const db = readDB();
    const list = db.examSubmissions.filter(es => es.studentId === req.params.studentId);
    res.json(list);
  });

  // --- COURSE RESOURCES FILE MANAGEMENT APIS ---
  app.get("/api/teachers/:teacherId/resources", (req, res) => {
    const db = readDB();
    const teacherCourseIds = db.courses
      .filter(c => c.instructorId === req.params.teacherId)
      .map(c => c.id);
    const resources = (db.uploadedResources || []).filter(r => teacherCourseIds.includes(r.courseId));
    res.json(resources);
  });

  app.post("/api/courses/:courseId/resources", (req, res) => {
    const { title, source, format, url, fileName } = req.body;
    if (!title || !source || !format) {
      return res.status(400).json({ error: "Title, source, and format are required fields." });
    }

    const db = readDB();
    const course = db.courses.find(c => c.id === req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    const newResource: UploadedResource = {
      id: `res-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      title,
      source,
      format,
      url: url || "https://example.com/materials/dummy",
      fileName: fileName || undefined,
      uploadedAt: new Date().toISOString()
    };

    if (!db.uploadedResources) {
      db.uploadedResources = [];
    }
    db.uploadedResources.push(newResource);

    // Push notification to enrolled students
    const enrollments = db.enrollments.filter(e => e.courseId === course.id);
    enrollments.forEach(enroll => {
      db.notifications.push({
        id: `not-${Date.now()}-${enroll.studentId}`,
        userId: enroll.studentId,
        text: `📁 A new resource "${title}" has been uploaded to "${course.title}".`,
        timestamp: new Date().toISOString(),
        read: false
      });
    });

    writeDB(db);
    res.status(201).json(newResource);
  });

  app.delete("/api/resources/:resourceId", (req, res) => {
    const db = readDB();
    if (!db.uploadedResources) db.uploadedResources = [];
    db.uploadedResources = db.uploadedResources.filter(r => r.id !== req.params.resourceId);
    writeDB(db);
    res.json({ success: true });
  });



  // --- VITE DEV AND PRODUCTION STATIC SERVERS ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Educational LMS running on port ${PORT}`);
  });
}

startServer();
