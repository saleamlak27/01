/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  expertise?: string;
  cvUrl?: string;
  telegram?: string;
  instagram?: string;
  status?: "pending" | "approved" | "rejected";
  fastTrackMessage?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  price: number;
  rating: number;
  thumbnail: string;
  status: "approved" | "pending" | "rejected";
  resourceSource?: "local_device" | "google_drive" | "youtube";
  resourceFormat?: "pdf" | "doc" | "excel" | "video";
  resourceUrl?: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  videoUrl?: string;
  pdfUrl?: string;
  content?: string;
  duration?: string; // e.g. "15:00"
  order: number;
  resourceSource?: string; // "local_device" | "google_drive" | "youtube"
  resourceFormat?: string; // "pdf" | "doc" | "excel" | "video"
  resourceUrl?: string;
}

export interface Assignment {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  instructions: string;
  maxPoints: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  workUrl: string;
  score?: number;
  feedback?: string;
  status: "submitted" | "graded";
  submittedAt: string;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  type: "multiple-choice" | "true-false" | "fill-blank";
  options: string[]; // Options for MC, empty for fill-blank
  correctAnswer: string; // The correct answer text
}

export interface Quiz {
  id: string;
  lessonId?: string;
  courseId: string;
  title: string;
  questions: Question[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  progress: number; // 0 to 100
  completedLessons: string[]; // Lesson IDs
  enrolledAt: string;
  status?: "active" | "pending_payment";
}

export interface Certificate {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  verificationCode: string;
}

export interface Payment {
  id: string;
  studentId: string;
  courseId?: string; // Optional if it's a subscription
  amount: number;
  status: "paid" | "failed" | "pending";
  date: string;
  invoiceNumber: string;
  plan?: "monthly" | "yearly" | "single-course";
  paymentMethod?: "card" | "telebirr" | "bank";
  provider?: string;
  currency?: "USD" | "ETB";
  amountETB?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // "group" or individual user ID
  receiverName: string;
  courseId?: string; // If related to a course chat group
  text: string;
  timestamp: string;
}

export interface EmailAttachment {
  name: string;
  url: string;
  size?: string;
}

export interface EmailMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  receiverName: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  isStarred?: boolean;
  isDraft?: boolean;
  isTrash?: boolean;
  attachments?: EmailAttachment[];
}

export interface LiveClass {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  scheduledAt: string;
  link: string;
  recordingsUrl?: string;
  attendees?: string[]; // studentIds
}

export interface AppNotification {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface StudentGrade {
  studentId: string;
  studentName: string;
  score: number;
  grade: string;
  remarks: string;
}

export interface GradeReport {
  id: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  status: "pending" | "approved" | "rejected";
  grades: StudentGrade[];
  submittedAt: string;
  reviewedAt?: string;
  feedback?: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Exam {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationMinutes: number;
  questions: ExamQuestion[];
}

export interface ExamEligibility {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: "pending" | "approved" | "rejected";
  checkedAt: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<string, string>;
  submittedAt: string;
}

export interface UploadedResource {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  source: "local_device" | "google_drive" | "external_link";
  format: "pdf" | "doc" | "excel" | "video" | "link";
  url: string;
  fileName?: string;
  uploadedAt: string;
}


