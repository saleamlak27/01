/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Users, Video, Plus, Check, Trash2, Edit3, Award, Send, CheckCircle, 
  FileText, ChevronDown, ChevronRight, Loader2, Sparkles, VideoIcon, ClipboardList, 
  Globe, MessageSquare, FileSpreadsheet, Clock, Calendar, HelpCircle, Lock, 
  ShieldCheck, AlertCircle, Upload, Eye, RefreshCw, FolderOpen, Link, Mail
} from "lucide-react";
import { Course, CourseModule, Lesson, Submission, Assignment, UploadedResource } from "../types";
import EmailClient from "./EmailClient";

interface TeacherDashboardProps {
  user: any;
  courses: Course[];
  submissions: Submission[];
  onRefreshData: () => void;
}

export default function TeacherDashboard({
  user,
  courses,
  submissions,
  onRefreshData
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "submissions" | "live" | "chat" | "grades" | "exams" | "files">("courses");
  const myCourses = courses.filter(c => c.instructorId === user.id);

  // New Course state
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Web Development");
  const [newPrice, setNewPrice] = useState("99");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [newCourseSource, setNewCourseSource] = useState<"local_device" | "google_drive" | "youtube">("local_device");
  const [newCourseFormat, setNewCourseFormat] = useState<"pdf" | "doc" | "excel" | "video">("pdf");
  const [newCourseResourceUrl, setNewCourseResourceUrl] = useState("");
  const [courseCreateLoading, setCourseCreateLoading] = useState(false);

  // Course Syllabus Architecture State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [syllabusStructure, setSyllabusStructure] = useState<{ modules: any[] }>({ modules: [] });
  const [syllabusLoading, setSyllabusLoading] = useState(false);

  // Add Module/Lesson State
  const [showAddModule, setShowAddModule] = useState(false);
  const [modTitle, setModTitle] = useState("");
  
  const [showAddLesson, setShowAddLesson] = useState<string | null>(null); // moduleId
  const [lesTitle, setLesTitle] = useState("");
  const [lesContent, setLesContent] = useState("");
  const [lesDuration, setLesDuration] = useState("12:00");

  // Lesson attachment resource source & formats
  const [lesSource, setLesSource] = useState<"local_device" | "google_drive" | "youtube">("local_device");
  const [lesFormat, setLesFormat] = useState<"pdf" | "doc" | "excel" | "video">("pdf");
  const [lesUrl, setLesUrl] = useState("");

  // AI Quiz state
  const [aiQuizLoading, setAiQuizLoading] = useState(false);
  const [aiQuizSuccess, setAiQuizSuccess] = useState<string | null>(null);

  // Grading assignment state
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState("95");
  const [gradeFeedback, setGradeFeedback] = useState("Outstanding work!");
  const [gradingLoading, setGradingLoading] = useState(false);

  // Live Class Scheduler State
  const [showLiveScheduler, setShowLiveScheduler] = useState(false);
  const [liveCourseId, setLiveCourseId] = useState("");
  const [liveTitle, setLiveTitle] = useState("");
  const [liveScheduleDate, setLiveScheduleDate] = useState("2026-07-18T15:00");
  const [liveLink, setLiveLink] = useState("https://meet.google.com/abc-defg-hij");
  const [liveLoading, setLiveLoading] = useState(false);

  // --- SOCIAL MEDIA INTEGRATIONS & DIRECT CHAT PORT STATE ---
  const [telegram, setTelegram] = useState(user.telegram || "");
  const [instagram, setInstagram] = useState(user.instagram || "");
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialSuccess, setSocialSuccess] = useState(false);

  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newDirectMessage, setNewDirectMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFilter, setChatFilter] = useState<"all" | "student" | "teacher" | "admin" | "bot">("all");
  const [botTyping, setBotTyping] = useState(false);

  // --- EXCEL GRADING & ADMIN REVIEW PIPELINE STATE ---
  const [excelCourseId, setExcelCourseId] = useState("");
  const [studentsInCourse, setStudentsInCourse] = useState<any[]>([]);
  const [gradeReportsList, setGradeReportsList] = useState<any[]>([]);
  const [gradeMatrix, setGradeMatrix] = useState<Record<string, { score: number, grade: string, remarks: string }>>({});
  const [dragActive, setDragActive] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState<string | null>(null);

  // --- EXAMS ENGINE, TIMETABLE & ELIGIBILITY STATE ---
  const [examsList, setExamsList] = useState<any[]>([]);
  const [examCourseId, setExamCourseId] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examStartTime, setExamStartTime] = useState("2026-07-18T10:00");
  const [examEndTime, setExamEndTime] = useState("2026-07-22T18:00");
  const [examDuration, setExamDuration] = useState("120");
  const [examQuestions, setExamQuestions] = useState<{ text: string, options: string[], correctAnswer: string }[]>([
    { text: "What is the primary goal of regression in Machine Learning?", options: ["Predict continuous values", "Classify discrete classes", "Clustering similar users", "Generate synthetic images"], correctAnswer: "Predict continuous values" }
  ]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuestionCorrect, setNewQuestionCorrect] = useState("");
  
  const [eligibilityRequests, setEligibilityRequests] = useState<any[]>([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [examSubmitLoading, setExamSubmitLoading] = useState(false);

  // Exam Eligibility & Timestamps Management
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedExamStartTime, setSelectedExamStartTime] = useState("");
  const [selectedExamEndTime, setSelectedExamEndTime] = useState("");
  const [selectedExamDuration, setSelectedExamDuration] = useState("");
  const [updateTimingLoading, setUpdateTimingLoading] = useState(false);
  const [updateTimingSuccess, setUpdateTimingSuccess] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  // File & Resource Management state variables
  const [resourcesList, setResourcesList] = useState<UploadedResource[]>([]);
  const [resourceCourseId, setResourceCourseId] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceSource, setResourceSource] = useState<"local_device" | "google_drive" | "external_link">("local_device");
  const [resourceFormat, setResourceFormat] = useState<"pdf" | "doc" | "excel" | "video" | "link">("pdf");
  const [resourceUrl, setUrlInput] = useState("");
  const [resourceFileName, setResourceFileName] = useState("");
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesSaving, setResourcesSaving] = useState(false);
  const [resourcesSuccess, setResourcesSuccess] = useState<string | null>(null);

  const fetchAllStudents = async () => {
    try {
      const usersRes = await fetch("/api/emails/contacts/directory");
      const allUsers = await usersRes.json();
      const students = allUsers.filter((u: any) => u.role === "student");
      setAllStudents(students);
    } catch (e) {
      console.error("Error fetching students:", e);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      const exam = examsList.find(e => e.id === selectedExamId);
      if (exam) {
        const formatForDatetimeLocal = (isoString: string) => {
          if (!isoString) return "";
          const date = new Date(isoString);
          const pad = (n: number) => n.toString().padStart(2, "0");
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };
        setSelectedExamStartTime(formatForDatetimeLocal(exam.startTime));
        setSelectedExamEndTime(formatForDatetimeLocal(exam.endTime));
        setSelectedExamDuration(exam.durationMinutes.toString());
      }
    }
  }, [selectedExamId, examsList]);

  useEffect(() => {
    if (examsList.length > 0 && !selectedExamId) {
      setSelectedExamId(examsList[0].id);
    }
  }, [examsList]);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseSyllabus(selectedCourse.id);
    }
  }, [selectedCourse, courses]);

  // Sync Chat Port contacts and messages
  useEffect(() => {
    if (activeTab === "chat") {
      fetchContacts();
    } else if (activeTab === "grades") {
      fetchTeacherGradeReports();
      if (myCourses.length > 0 && !excelCourseId) {
        setExcelCourseId(myCourses[0].id);
      }
    } else if (activeTab === "exams") {
      fetchEligibilityRequests();
      fetchAllStudents();
      if (myCourses.length > 0 && !examCourseId) {
        setExamCourseId(myCourses[0].id);
      }
    } else if (activeTab === "files") {
      fetchTeacherResources();
      if (myCourses.length > 0 && !resourceCourseId) {
        setResourceCourseId(myCourses[0].id);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (excelCourseId) {
      fetchStudentsForCourse(excelCourseId);
    }
  }, [excelCourseId]);

  useEffect(() => {
    if (examCourseId) {
      fetchExams(examCourseId);
    }
  }, [examCourseId]);

  const fetchContacts = async () => {
    // No-op: chat disabled
  };

  const fetchChatMessages = async (contactId: string) => {
    // No-op: chat disabled
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    // No-op: chat disabled
  };

  const handleSaveSocials = async () => {
    setSocialSaving(true);
    setSocialSuccess(false);
    try {
      const res = await fetch(`/api/users/${user.id}/socials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram, instagram })
      });
      if (res.ok) {
        setSocialSuccess(true);
        setTimeout(() => setSocialSuccess(false), 3000);
        // Refresh local memory properties
        user.telegram = telegram;
        user.instagram = instagram;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSocialSaving(false);
    }
  };

  // --- EXCEL GRADING INTERACTION CONTROLLERS ---
  const fetchTeacherGradeReports = async () => {
    try {
      const res = await fetch(`/api/teachers/${user.id}/grades`);
      const data = await res.json();
      if (res.ok) {
        setGradeReportsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentsForCourse = async (courseId: string) => {
    setExcelLoading(true);
    try {
      // Fetch all enrollments
      const res = await fetch("/api/reports/admin");
      const adminReport = await res.json();
      
      // Let's get students who have signed up or enrolled
      const usersRes = await fetch("/api/emails/contacts/directory");
      const allUsers = await usersRes.json();
      const students = allUsers.filter((u: any) => u.role === "student");
      
      setStudentsInCourse(students);

      // Pre-populate grade matrix
      const matrix: Record<string, { score: number, grade: string, remarks: string }> = {};
      students.forEach((s: any) => {
        matrix[s.id] = {
          score: 85,
          grade: "A",
          remarks: "Regular attendance and solid submissions."
        };
      });
      setGradeMatrix(matrix);
    } catch (e) {
      console.error(e);
    } finally {
      setExcelLoading(false);
    }
  };

  const handleUpdateMatrix = (studentId: string, field: "score" | "grade" | "remarks", value: any) => {
    setGradeMatrix(prev => {
      const cell = { ...prev[studentId] };
      if (field === "score") {
        const val = Number(value) || 0;
        cell.score = Math.min(100, Math.max(0, val));
        // Auto grade mapping
        if (cell.score >= 90) cell.grade = "A";
        else if (cell.score >= 80) cell.grade = "B+";
        else if (cell.score >= 70) cell.grade = "B";
        else if (cell.score >= 60) cell.grade = "C";
        else cell.grade = "D";
      } else {
        cell[field] = value;
      }
      return {
        ...prev,
        [studentId]: cell
      };
    });
  };

  const handleMockExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelLoading(true);
    // Simulate real parsing of Excel/CSV grades spreadsheet
    setTimeout(() => {
      const mappedMatrix = { ...gradeMatrix };
      studentsInCourse.forEach((student, idx) => {
        // Mock random CSV excel records import
        const randomScore = Math.floor(Math.random() * 25) + 75; // 75 - 100
        let g = "A";
        if (randomScore < 80) g = "B";
        else if (randomScore < 90) g = "B+";

        mappedMatrix[student.id] = {
          score: randomScore,
          grade: g,
          remarks: "Successfully linked and parsed from Microsoft Excel Grade Sheet."
        };
      });
      setGradeMatrix(mappedMatrix);
      setExcelSuccess("Excel worksheet linked! Successfully imported and mapped grades roster.");
      setTimeout(() => setExcelSuccess(null), 4000);
      setExcelLoading(false);
    }, 1200);
  };

  const handleSubmitGradesReport = async () => {
    const course = courses.find(c => c.id === excelCourseId);
    if (!course) return;

    setExcelLoading(true);
    const gradesArray = studentsInCourse.map(student => ({
      studentId: student.id,
      studentName: student.name,
      score: gradeMatrix[student.id]?.score || 0,
      grade: gradeMatrix[student.id]?.grade || "F",
      remarks: gradeMatrix[student.id]?.remarks || ""
    }));

    try {
      const res = await fetch("/api/teachers/grades/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: excelCourseId,
          courseTitle: course.title,
          teacherId: user.id,
          teacherName: user.name,
          grades: gradesArray
        })
      });
      if (res.ok) {
        setExcelSuccess("Grades list submitted to Admin! Roster locked pending Director verification.");
        setTimeout(() => setExcelSuccess(null), 5000);
        fetchTeacherGradeReports();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExcelLoading(false);
    }
  };

  // --- EXAMS, TIMETABLES & ELIGIBILITY WORKFLOWS ---
  const fetchExams = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/exams`);
      const data = await res.json();
      if (res.ok) {
        setExamsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEligibilityRequests = async () => {
    setEligibilityLoading(true);
    try {
      const res = await fetch(`/api/teachers/${user.id}/eligibility-requests`);
      const data = await res.json();
      if (res.ok) {
        setEligibilityRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleReviewEligibility = async (eligId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/eligibility/${eligId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchEligibilityRequests();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddExamQuestion = () => {
    if (!newQuestionText.trim() || !newQuestionCorrect.trim()) {
      alert("Please provide the question statement and a correct answer mapping.");
      return;
    }
    setExamQuestions(prev => [
      ...prev,
      {
        text: newQuestionText,
        options: newQuestionOptions.filter(opt => opt.trim() !== ""),
        correctAnswer: newQuestionCorrect
      }
    ]);
    setNewQuestionText("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewQuestionCorrect("");
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCourseId || !examTitle || examQuestions.length === 0) {
      alert("Please specify exam title and build at least one question.");
      return;
    }
    setExamSubmitLoading(true);
    try {
      const res = await fetch(`/api/courses/${examCourseId}/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          description: examDescription,
          startTime: new Date(examStartTime).toISOString(),
          endTime: new Date(examEndTime).toISOString(),
          durationMinutes: Number(examDuration),
          questions: examQuestions
        })
      });
      if (res.ok) {
        alert("Term Examination published! Scheduled timetable details sent to students.");
        setExamTitle("");
        setExamDescription("");
        setExamQuestions([]);
        fetchExams(examCourseId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExamSubmitLoading(false);
    }
  };

  const handleUpdateExamTimestamps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    setUpdateTimingLoading(true);
    setUpdateTimingSuccess(false);
    try {
      const res = await fetch(`/api/exams/${selectedExamId}/update-timestamps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedExamStartTime,
          endTime: selectedExamEndTime,
          durationMinutes: Number(selectedExamDuration)
        })
      });
      if (res.ok) {
        setUpdateTimingSuccess(true);
        setTimeout(() => setUpdateTimingSuccess(false), 3000);
        if (examCourseId) {
          fetchExams(examCourseId);
        }
      }
    } catch (error) {
      console.error("Error updating exam timestamps:", error);
    } finally {
      setUpdateTimingLoading(false);
    }
  };

  const handleToggleStudentEligibility = async (studentId: string, currentStatus: string) => {
    if (!selectedExamId) return;
    const nextStatus = currentStatus === "approved" ? "rejected" : "approved";
    try {
      const res = await fetch(`/api/exams/${selectedExamId}/toggle-student-eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          status: nextStatus
        })
      });
      if (res.ok) {
        fetchEligibilityRequests();
      }
    } catch (error) {
      console.error("Error toggling student eligibility:", error);
    }
  };

  // --- FILE HUB / RESOURCE MANAGEMENT HANDLERS ---
  const fetchTeacherResources = async () => {
    setResourcesLoading(true);
    try {
      const res = await fetch(`/api/teachers/${user.id}/resources`);
      const data = await res.json();
      if (res.ok) {
        setResourcesList(data);
      }
    } catch (e) {
      console.error("Error fetching resources:", e);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceCourseId || !resourceTitle) return;
    setResourcesSaving(true);
    setResourcesSuccess(null);

    let finalUrl = resourceUrl;
    if (resourceSource === "local_device") {
      finalUrl = finalUrl || `https://example.com/uploads/${resourceFileName || "document-" + Date.now()}`;
    }

    try {
      const res = await fetch(`/api/courses/${resourceCourseId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resourceTitle,
          source: resourceSource,
          format: resourceFormat,
          url: finalUrl,
          fileName: resourceSource === "local_device" ? resourceFileName : undefined
        })
      });

      if (res.ok) {
        setResourceTitle("");
        setUrlInput("");
        setResourceFileName("");
        setResourcesSuccess("Resource uploaded successfully! Enrolled students have been notified.");
        fetchTeacherResources();
        setTimeout(() => setResourcesSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Error uploading resource:", error);
    } finally {
      setResourcesSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this resource file?")) return;
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchTeacherResources();
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
    }
  };

  const loadCourseSyllabus = async (courseId: string) => {
    setSyllabusLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/structure`);
      const data = await response.json();
      if (response.ok) {
        setSyllabusStructure(data);
      }
    } catch (err) {
      console.error("Error loading syllabus:", err);
    } finally {
      setSyllabusLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    setCourseCreateLoading(true);

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          instructorId: user.id,
          instructorName: user.name,
          category: newCategory,
          price: Number(newPrice) || 0,
          thumbnail: newThumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60",
          resourceSource: newCourseSource,
          resourceFormat: newCourseFormat,
          resourceUrl: newCourseResourceUrl
        })
      });

      if (response.ok) {
        setNewTitle("");
        setNewDesc("");
        setNewCourseResourceUrl("");
        setNewCourseSource("local_device");
        setNewCourseFormat("pdf");
        setShowCreateCourse(false);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCourseCreateLoading(false);
    }
  };

  const handleAddModule = async () => {
    if (!selectedCourse || !modTitle) return;
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: modTitle })
      });
      if (response.ok) {
        setModTitle("");
        setShowAddModule(false);
        loadCourseSyllabus(selectedCourse.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!selectedCourse || !lesTitle) return;
    try {
      const response = await fetch(`/api/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lesTitle,
          courseId: selectedCourse.id,
          content: lesContent || "Welcome to this syllabus lecture content.",
          duration: lesDuration || "15:00",
          resourceSource: lesSource,
          resourceFormat: lesFormat,
          resourceUrl: lesUrl || "https://example.com/materials/attachment"
        })
      });
      if (response.ok) {
        setLesTitle("");
        setLesContent("");
        setLesDuration("12:00");
        setLesUrl("");
        setShowAddLesson(null);
        loadCourseSyllabus(selectedCourse.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Quiz Generator call
  const handleGenerateAIQuiz = async (lesson: Lesson) => {
    if (!selectedCourse) return;
    setAiQuizLoading(true);
    setAiQuizSuccess(null);

    try {
      const response = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: lesson.title,
          lessonContent: lesson.content,
          courseId: selectedCourse.id
        })
      });

      if (response.ok) {
        setAiQuizSuccess(`AI Quiz generated successfully for lesson: "${lesson.title}"!`);
        setTimeout(() => setAiQuizSuccess(null), 4000);
      } else {
        alert("Failed to generate AI Quiz. Please make sure Gemini API Key is configured.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiQuizLoading(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGradingLoading(true);

    try {
      const response = await fetch(`/api/submissions/${gradingSubmission.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: Number(gradeScore) || 100,
          feedback: gradeFeedback
        })
      });

      if (response.ok) {
        setGradingSubmission(null);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGradingLoading(false);
    }
  };

  const handleScheduleLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveCourseId || !liveTitle || !liveLink) return;
    setLiveLoading(true);

    try {
      const response = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: liveCourseId,
          courseName: courses.find(c => c.id === liveCourseId)?.title || "Course Room",
          title: liveTitle,
          scheduledAt: new Date(liveScheduleDate).toISOString(),
          link: liveLink
        })
      });

      if (response.ok) {
        setLiveTitle("");
        setShowLiveScheduler(false);
        alert("Live lecture scheduled successfully and students notified!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div id="teacher-dashboard" className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      
      {/* Sidebar Nav */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Advisor</div>
          <h3 className="font-display font-bold text-lg text-slate-800">{user.name}</h3>
          <span className="inline-block bg-teal-50 text-teal-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Instructor Portal</span>
        </div>

        <nav className="flex flex-col space-y-1">
          {[
            { id: "courses", label: "My Syllabuses", icon: <BookOpen className="w-4 h-4" /> },
            { id: "submissions", label: "Grade Workspace", icon: <ClipboardList className="w-4 h-4" /> },
            { id: "files", label: "File Management", icon: <FolderOpen className="w-4 h-4" /> },
            { id: "live", label: "Live Zooms / Meets", icon: <Video className="w-4 h-4" /> },
            { id: "chat", label: "Secure Webmail", icon: <Mail className="w-4 h-4" /> },
            { id: "grades", label: "Excel Grading", icon: <FileSpreadsheet className="w-4 h-4" /> },
            { id: "exams", label: "Exams Board", icon: <Calendar className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedCourse(null); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === tab.id && !selectedCourse ? "bg-teal-600 text-white shadow-md shadow-teal-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Panel Content */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* SYLLABUS DETAIL EDITOR (NESTED INSIDE TAB COURSES) */}
        {selectedCourse ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1">
                <button onClick={() => setSelectedCourse(null)} className="text-xs font-bold text-teal-600 hover:underline mb-1 flex items-center cursor-pointer">
                  &larr; Back to Course Catalog
                </button>
                <h4 className="font-display font-bold text-2xl text-slate-800">{selectedCourse.title}</h4>
                <p className="text-slate-500 text-sm">Design learning pathways, upload resources, and deploy AI-assisted practice tests.</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAddModule(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Module Block</span>
                </button>
              </div>
            </div>

            {aiQuizSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>{aiQuizSuccess}</span>
              </div>
            )}

            {/* Modules List container */}
            {syllabusLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : syllabusStructure.modules.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-4">
                <p className="text-slate-500 font-medium">Syllabus is empty. Create your first module block to construct lesson lectures.</p>
                <button onClick={() => setShowAddModule(true)} className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl cursor-pointer">
                  Initialize Module One
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {syllabusStructure.modules.map(mod => (
                  <div key={mod.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h5 className="font-display font-bold text-slate-800 text-base">{mod.title}</h5>
                      <button
                        onClick={() => setShowAddLesson(mod.id)}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Lesson Block</span>
                      </button>
                    </div>

                    {/* Module Lessons list */}
                    {mod.lessons.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">No lessons in this module block yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {mod.lessons.map((lesson: Lesson) => (
                          <div key={lesson.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h6 className="font-display font-semibold text-slate-800 text-sm">{lesson.title}</h6>
                                {lesson.resourceSource && (
                                  <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    {lesson.resourceSource === "google_drive" ? "🤖 Google Drive" : lesson.resourceSource === "youtube" ? "📺 YouTube" : "📁 Local Disk"}
                                  </span>
                                )}
                                {lesson.resourceFormat && (
                                  <span className="text-[9px] font-extrabold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full uppercase">
                                    {lesson.resourceFormat}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-slate-400">
                                <span>Duration: {lesson.duration || "10:00"}</span>
                                <span>&bull;</span>
                                <span className="line-clamp-1 max-w-sm">{lesson.content || "Empty content"}</span>
                              </div>
                            </div>
                            
                            {/* AI Quiz Generator trigger */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleGenerateAIQuiz(lesson)}
                                disabled={aiQuizLoading}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                {aiQuizLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                                )}
                                <span>Deploy AI Quiz</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Lesson inline form */}
                    {showAddLesson === mod.id && (
                      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <div className="text-xs font-bold text-teal-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Configure New Lesson Block & Resources</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Lesson Title</label>
                            <input
                              type="text"
                              placeholder="e.g., 1.3 Supervised Neural Networks"
                              value={lesTitle}
                              onChange={(e) => setLesTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white shadow-xs focus:ring-1 focus:ring-teal-500 outline-hidden"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Lecture Duration</label>
                            <input
                              type="text"
                              placeholder="e.g. 15:00"
                              value={lesDuration}
                              onChange={(e) => setLesDuration(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white shadow-xs focus:ring-1 focus:ring-teal-500 outline-hidden"
                            />
                          </div>

                          {/* Requirement 1: Course Resource Locations Selector */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Resource Storage Location</label>
                            <select
                              value={lesSource}
                              onChange={(e: any) => setLesSource(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white shadow-xs focus:ring-1 focus:ring-teal-500 outline-hidden"
                            >
                              <option value="local_device">📁 Local PC Storage Device</option>
                              <option value="google_drive">🤖 Google Drive Cloud</option>
                              <option value="youtube">📺 YouTube Streaming Video</option>
                            </select>
                          </div>

                          {/* Requirement 2: Upload different file formats */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Resource File Format Attachment</label>
                            <select
                              value={lesFormat}
                              onChange={(e: any) => setLesFormat(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white shadow-xs focus:ring-1 focus:ring-teal-500 outline-hidden"
                            >
                              <option value="pdf">📄 Portable PDF Document (.pdf)</option>
                              <option value="doc">📝 Microsoft Word Document (.docx)</option>
                              <option value="excel">📊 Microsoft Excel Grade Sheet (.xlsx)</option>
                              <option value="video">🎥 MP4 High-Definition Video (.mp4)</option>
                            </select>
                          </div>

                          <div className="col-span-1 sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">
                              {lesSource === "google_drive" ? "Google Drive Sharable Link" : lesSource === "youtube" ? "YouTube Video Embed URL" : "Resource Attachment URL"}
                            </label>
                            <input
                              type="text"
                              placeholder={lesSource === "google_drive" ? "https://drive.google.com/file/d/..." : lesSource === "youtube" ? "https://youtube.com/watch?v=..." : "https://example.com/materials/attachment.pdf"}
                              value={lesUrl}
                              onChange={(e) => setLesUrl(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white shadow-xs focus:ring-1 focus:ring-teal-500 outline-hidden"
                            />
                          </div>

                          {lesSource === "local_device" && (
                            <div className="col-span-1 sm:col-span-2 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-100/30 flex flex-col items-center justify-center text-center gap-2">
                              <Upload className="w-6 h-6 text-slate-400" />
                              <div className="text-xs text-slate-600 font-semibold">Drag & Drop Lesson File Here</div>
                              <div className="text-[10px] text-slate-400">Supports PDF, DOCX, XLSX, and MP4 up to 500MB</div>
                              <input type="file" className="hidden" id="lecture-file-picker" onChange={() => setLesUrl("https://example.com/uploads/" + Date.now() + "." + lesFormat)} />
                              <label htmlFor="lecture-file-picker" className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-slate-50">
                                Select File from Local Disk
                              </label>
                            </div>
                          )}

                          <div className="col-span-1 sm:col-span-2 space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Lesson Content Description & Goals</label>
                            <textarea
                              placeholder="Outline core objectives, lab questions, and theoretical backgrounds here..."
                              rows={3}
                              value={lesContent}
                              onChange={(e) => setLesContent(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white shadow-xs focus:ring-1 focus:ring-teal-500 outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 text-xs pt-2">
                          <button onClick={() => setShowAddLesson(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer">
                            Cancel
                          </button>
                          <button onClick={() => handleAddLesson(mod.id)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-teal-100">
                            Publish Lesson Block
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Module Modal View */}
            {showAddModule && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
                <div className="text-sm font-bold text-slate-800">Add New Course Module Block</div>
                <input
                  type="text"
                  placeholder="Module Title (e.g. Module 3: Intermediate Optimizations)"
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button onClick={() => setShowAddModule(false)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleAddModule} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg cursor-pointer">
                    Create Module
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* GENERAL TABS */
          <>
            {/* TAB 1: MY COURSE CATALOG SYLLABUSES */}
            {activeTab === "courses" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-2xl text-slate-800">Your Course Catalog</h4>
                    <p className="text-slate-500 text-sm">Review approvals, construct syllabus curriculum, and generate lectures.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateCourse(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Course Blueprint</span>
                  </button>
                </div>

                {/* Create Course Form Block */}
                {showCreateCourse && (
                  <form onSubmit={handleCreateCourse} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
                    <h5 className="font-display font-bold text-slate-800 text-base">New Course Blueprint</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Course Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Cybersecurity Essentials"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                        >
                          <option value="Artificial Intelligence">Artificial Intelligence</option>
                          <option value="Web Development">Web Development</option>
                          <option value="Design">Design</option>
                          <option value="Cybersecurity">Cybersecurity</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                        <textarea
                          placeholder="Enter a descriptive pitch for students detailing the learning milestones..."
                          rows={3}
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Price ($USD)</label>
                        <input
                          type="number"
                          placeholder="99"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Thumbnail Cover URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={newThumbnail}
                          onChange={(e) => setNewThumbnail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                        />
                      </div>

                      {/* Course Resource Location Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Course Resource Location</label>
                        <select
                          value={newCourseSource}
                          onChange={(e: any) => setNewCourseSource(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800 focus:ring-1 focus:ring-teal-500 outline-hidden"
                        >
                          <option value="local_device">📁 Local Storage PC Device</option>
                          <option value="google_drive">🤖 Google Drive Cloud</option>
                          <option value="youtube">📺 YouTube Streaming Video</option>
                        </select>
                      </div>

                      {/* Course File Format Attachment */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Resource File Format</label>
                        <select
                          value={newCourseFormat}
                          onChange={(e: any) => setNewCourseFormat(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800 focus:ring-1 focus:ring-teal-500 outline-hidden"
                        >
                          <option value="pdf">📄 Portable PDF Document (.pdf)</option>
                          <option value="doc">📝 Microsoft Word Document (.docx)</option>
                          <option value="excel">📊 Microsoft Excel Grade Sheet (.xlsx)</option>
                          <option value="video">🎥 MP4 High-Definition Video (.mp4)</option>
                        </select>
                      </div>

                      {/* Course Resource Link */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          {newCourseSource === "google_drive" ? "Google Drive Shared Syllabus Link" : newCourseSource === "youtube" ? "YouTube Video Embed / Lecture URL" : "Resource Materials Web Link"}
                        </label>
                        <input
                          type="text"
                          placeholder={newCourseSource === "google_drive" ? "https://drive.google.com/file/d/..." : newCourseSource === "youtube" ? "https://youtube.com/watch?v=..." : "https://example.com/syllabus.pdf"}
                          value={newCourseResourceUrl}
                          onChange={(e) => setNewCourseResourceUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800 focus:ring-1 focus:ring-teal-500 outline-hidden"
                        />
                      </div>

                      {/* Local Upload Drop Area */}
                      {newCourseSource === "local_device" && (
                        <div className="sm:col-span-2 p-5 border border-dashed border-teal-300 rounded-2xl bg-teal-50/20 flex flex-col items-center justify-center text-center gap-2">
                          <Upload className="w-8 h-8 text-teal-500" />
                          <div className="text-xs text-slate-700 font-bold">Drag & Drop Course Syllabus File Here</div>
                          <div className="text-[10px] text-slate-400">Upload PDF, DOCX, XLSX, or MP4 Video syllabus structures (Up to 500MB)</div>
                          <input 
                            type="file" 
                            className="hidden" 
                            id="course-blueprint-picker" 
                            onChange={() => setNewCourseResourceUrl("https://example.com/uploads/syllabus-" + Date.now() + "." + newCourseFormat)} 
                          />
                          <label 
                            htmlFor="course-blueprint-picker" 
                            className="px-4 py-1.5 bg-teal-600 text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-teal-700 transition-all"
                          >
                            Browse Files
                          </label>
                          {newCourseResourceUrl && (
                            <div className="mt-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Syllabus file attached successfully!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowCreateCourse(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={courseCreateLoading}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                      >
                        {courseCreateLoading ? "Saving..." : "Submit to Administrator"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Course Grid */}
                {myCourses.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No courses published yet. Submit your first course blueprint!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myCourses.map(course => (
                      <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h5 className="font-display font-bold text-slate-800 text-base">{course.title}</h5>
                            <p className="text-slate-400 text-xs">Price: ${course.price.toFixed(2)} &bull; Rating: {course.rating.toFixed(1)}</p>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${course.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : course.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            {course.status}
                          </span>
                        </div>
                        
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{course.description}</p>

                        {/* Course Source and Format indicators */}
                        {(course.resourceSource || course.resourceFormat) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {course.resourceSource && (
                              <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full flex items-center gap-1 uppercase">
                                {course.resourceSource === "google_drive" ? "🤖 Google Drive" : course.resourceSource === "youtube" ? "📺 YouTube" : "📁 Local Disk"}
                              </span>
                            )}
                            {course.resourceFormat && (
                              <span className="text-[9px] font-extrabold bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full uppercase">
                                Format: {course.resourceFormat}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => setSelectedCourse(course)}
                            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Design Syllabus Structure</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GRADE ASSIGNMENT SUBMISSIONS */}
            {activeTab === "submissions" && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-2xl text-slate-800">Student Assignment Grading</h4>
                  <p className="text-slate-500 text-sm">Review, mark up scores, and give written feedback back to your class rosters.</p>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No student assignment solutions are awaiting review at this time.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm text-slate-600">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                            <th className="p-4">Student</th>
                            <th className="p-4">Solution Work link</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Score / Feedback</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {submissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-semibold text-slate-900">{sub.studentName}</td>
                              <td className="p-4">
                                <a href={sub.workUrl} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline text-xs flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Student File</span>
                                </a>
                              </td>
                              <td className="p-4 text-xs">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sub.status === "graded" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700 animate-pulse"}`}>
                                  {sub.status}
                                </span>
                              </td>
                              <td className="p-4 text-xs max-w-xs">
                                {sub.status === "graded" ? (
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800">Score: {sub.score}/100</div>
                                    <div className="text-slate-400 line-clamp-1 italic">"{sub.feedback}"</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Not graded yet</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => {
                                    setGradingSubmission(sub);
                                    setGradeScore(sub.score?.toString() || "95");
                                    setGradeFeedback(sub.feedback || "");
                                  }}
                                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  {sub.status === "graded" ? "Change Score" : "Grade Work"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Grade Feedback inline form modal overlay */}
                {gradingSubmission && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleGradeSubmission} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                      <h5 className="font-display font-bold text-slate-800 text-base">Grade Assignment Submittal</h5>
                      <p className="text-slate-500 text-xs">Provide a score and feedback for student: <span className="font-bold">{gradingSubmission.studentName}</span></p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Score (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={gradeScore}
                            onChange={(e) => setGradeScore(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Instructor Review Comments</label>
                          <textarea
                            rows={3}
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                            placeholder="Provide constructive feedback..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 text-xs pt-2">
                        <button
                          type="button"
                          onClick={() => setGradingSubmission(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={gradingLoading}
                          className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg cursor-pointer"
                        >
                          {gradingLoading ? "Saving..." : "Grade Submission"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LIVE CLASS SCHEDULER (Google Meet / Zoom scheduler) */}
            {activeTab === "live" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-2xl text-slate-800">Schedule Live Lecture Zoom / Meet</h4>
                    <p className="text-slate-500 text-sm">Schedule interactive video stream lessons and broadcast invitations to rosters.</p>
                  </div>
                  <button
                    onClick={() => setShowLiveScheduler(true)}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Schedule Lecture</span>
                  </button>
                </div>

                {showLiveScheduler && (
                  <form onSubmit={handleScheduleLiveClass} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 max-w-xl animate-fade-in">
                    <h5 className="font-display font-bold text-slate-800 text-base">Schedule New Video Lesson</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Select Course Syllabus</label>
                        <select
                          value={liveCourseId}
                          onChange={(e) => setLiveCourseId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                          required
                        >
                          <option value="">-- Choose Course --</option>
                          {myCourses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Lecture Room Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Live Q&A: Deep Neural Network Optimizations"
                          value={liveTitle}
                          onChange={(e) => setLiveTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Scheduled Time (UTC-7)</label>
                          <input
                            type="datetime-local"
                            value={liveScheduleDate}
                            onChange={(e) => setLiveScheduleDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Google Meet / Zoom URL</label>
                          <input
                            type="text"
                            placeholder="https://meet.google.com/..."
                            value={liveLink}
                            onChange={(e) => setLiveLink(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 text-xs pt-2">
                      <button
                        type="button"
                        onClick={() => setShowLiveScheduler(false)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={liveLoading}
                        className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg cursor-pointer"
                      >
                        {liveLoading ? "Scheduling..." : "Schedule Session"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="text-sm font-bold text-slate-800">Upcoming Live Rooms Info</div>
                  <p className="text-slate-400 text-xs">Students will find a click-to-join trigger inside their course classrooms. Ensure links remain active during live lectures.</p>
                </div>
              </div>
            )}

            {/* TAB 4: DIRECT STUDENT CHAT PORT & SOCIAL-MEDIA SYNCHRONIZER */}
            {activeTab === "chat" && (
              <div className="space-y-6 animate-fade-in">
                {/* Profile social media linkages (Req 3) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-teal-600" />
                    <h4 className="font-display font-bold text-lg text-slate-800">Public Social-Media Connections</h4>
                  </div>
                  <p className="text-slate-500 text-xs">Link your official social accounts so students can reach you instantly on external channels.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase">Telegram Messenger Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">@</span>
                        <input
                          type="text"
                          placeholder="e.g. jethiopiateacher"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 focus:ring-1 focus:ring-teal-500 outline-hidden bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase">Instagram Profile Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">@</span>
                        <input
                          type="text"
                          placeholder="e.g. code_ethiopia"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 focus:ring-1 focus:ring-teal-500 outline-hidden bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    {socialSuccess ? (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> Linked profiles successfully updated on the server!
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Your linked handles will render on course page layouts.</span>
                    )}
                    <button
                      onClick={handleSaveSocials}
                      disabled={socialSaving}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {socialSaving ? "Updating Links..." : "Save Public Handles"}
                    </button>
                  </div>
                </div>

                {/* Integrated Secure Webmail System */}
                <EmailClient user={user} onRefreshData={onRefreshData} />
              </div>
            )}

            {/* TAB 5: EXCEL LINKED GRADE SHEET & ADMIN SUBMISSION PIPELINE (Req 4) */}
            {activeTab === "grades" && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-lg text-slate-800">Excel-Linked Academic Grading Workspace</h4>
                      <p className="text-slate-500 text-xs">Select your course, import local Microsoft Excel grade rosters directly, or customize grade distributions before locking and sending to the central administrator for review.</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-slate-600 font-semibold">Syllabus Course:</label>
                      <select
                        value={excelCourseId}
                        onChange={(e) => setExcelCourseId(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white"
                      >
                        {myCourses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {excelSuccess && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{excelSuccess}</span>
                    </div>
                  )}

                  {/* Requirement 4: Excel sheet linkage simulation block */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Excel Roster Link Trigger */}
                    <div className="md:col-span-1 p-5 bg-teal-50/40 rounded-2xl border border-dashed border-teal-200 flex flex-col items-center text-center justify-center space-y-3">
                      <FileSpreadsheet className="w-10 h-10 text-teal-600" />
                      <div>
                        <div className="text-xs font-bold text-teal-800">Excel Spreadsheet Linkage</div>
                        <p className="text-[10px] text-teal-600 mt-1">Upload student marks CSV or Excel file formats to auto-map scores to registered participants instantly.</p>
                      </div>
                      
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        id="excel-grade-upload"
                        onChange={handleMockExcelUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="excel-grade-upload"
                        className="px-4 py-2 bg-white text-teal-700 hover:bg-teal-50 border border-teal-200 text-xs font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Link Excel File</span>
                      </label>
                    </div>

                    {/* Right: Informative instructions on approval */}
                    <div className="md:col-span-2 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-800">Administrative Approval Pipeline</div>
                        <div className="space-y-1.5 text-[11px] text-slate-500">
                          <p className="flex items-start gap-1.5">
                            <span className="text-teal-600 font-extrabold">1.</span> Update individual grade matrices below or import from CSV.
                          </p>
                          <p className="flex items-start gap-1.5">
                            <span className="text-teal-600 font-extrabold">2.</span> Click "Lock & Submit to Director" to lock editing rights.
                          </p>
                          <p className="flex items-start gap-1.5">
                            <span className="text-teal-600 font-extrabold">3.</span> The academic administrator reviews the report. Once approved, scores go live on pupil portfolios.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={handleSubmitGradesReport}
                          disabled={excelLoading || studentsInCourse.length === 0}
                          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-teal-700 cursor-pointer disabled:bg-slate-300"
                        >
                          {excelLoading ? "Submitting..." : "Lock & Submit to Admin"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Grade distribution matrix */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="text-xs font-bold text-slate-800">Interactive Student Grading Distribution</div>
                    <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-full">{studentsInCourse.length} Pupil(s) listed</span>
                  </div>

                  {studentsInCourse.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs italic">
                      No pupils found in database registry. Ensure students are enrolled.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs text-slate-600">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-800">
                            <th className="p-3">Student Name</th>
                            <th className="p-3 w-32">Term Score (0-100)</th>
                            <th className="p-3 w-28">Assigned Grade</th>
                            <th className="p-3">Lecturer Remarks / Feedbacks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentsInCourse.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50/30">
                              <td className="p-3 font-semibold text-slate-900">{student.name}</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={gradeMatrix[student.id]?.score || 0}
                                  onChange={(e) => handleUpdateMatrix(student.id, "score", e.target.value)}
                                  className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-gray-800"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={gradeMatrix[student.id]?.grade || "A"}
                                  onChange={(e) => handleUpdateMatrix(student.id, "grade", e.target.value)}
                                  className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-extrabold text-teal-700 bg-teal-50 text-center"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  placeholder="Provide student feedback..."
                                  value={gradeMatrix[student.id]?.remarks || ""}
                                  onChange={(e) => handleUpdateMatrix(student.id, "remarks", e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-gray-800"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Submitted records ledger list */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="text-sm font-bold text-slate-800">Historic Grades Reports Ledger</div>
                  <div className="space-y-3">
                    {gradeReportsList.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">No reports submitted to directors yet.</p>
                    ) : (
                      gradeReportsList.map(report => (
                        <div key={report.id} className="p-4 border border-slate-100 rounded-xl flex items-center justify-between text-xs bg-slate-50/50">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800">{report.courseTitle}</div>
                            <div className="text-slate-400">Submitted at: {new Date(report.submittedAt).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-500">{report.grades.length} Grades mapped</span>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${report.status === "approved" ? "bg-emerald-100 text-emerald-800" : report.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800 animate-pulse"}`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: EXAM BOARD, TIMETABLES & STUDENT ELIGIBILITY SEATING (Req 5, 6) */}
            {activeTab === "exams" && (
              <div className="space-y-6 animate-fade-in">
                {/* Eligibility review requests list */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <h4 className="font-display font-bold text-lg text-slate-800">Student Exam Seating Eligibility Approval</h4>
                  </div>
                  <p className="text-slate-500 text-xs">Verify student eligibility parameters before approving active hall tickets. Only approved students can access term examination interfaces.</p>

                  <div className="space-y-3">
                    {eligibilityLoading ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic">Checking live databases for request tickets...</div>
                    ) : eligibilityRequests.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-xs text-center border">
                        No pending seating eligibility approval requests at this moment.
                      </div>
                    ) : (
                      eligibilityRequests.map(elig => (
                        <div key={elig.id} className="p-4 border border-slate-100 rounded-xl flex flex-wrap items-center justify-between text-xs bg-slate-50/50 gap-3">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900">{elig.studentName}</div>
                            <div className="text-slate-400 flex items-center gap-1.5 text-[10px]">
                              <span>Exam ID: {elig.examId.substring(0, 8)}...</span>
                              <span>&bull;</span>
                              <span>Fee payment approval verified</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {elig.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleReviewEligibility(elig.id, "rejected")}
                                  className="px-3 py-1 bg-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold rounded-lg cursor-pointer text-[10px]"
                                >
                                  Decline Seating
                                </button>
                                <button
                                  onClick={() => handleReviewEligibility(elig.id, "approved")}
                                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer text-[10px]"
                                >
                                  Grant Eligibility
                                </button>
                              </>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${elig.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                                {elig.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Manual Exam Eligibility & Window Editor Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <div>
                      <h4 className="font-display font-bold text-lg text-slate-800">Interactive Exam Window & Eligibility Customizer</h4>
                      <p className="text-slate-500 text-xs">Directly edit active window schedules or toggle individual seating eligibility states on a student-by-student basis.</p>
                    </div>
                  </div>

                  {/* Exam Selection Dropdown */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-semibold text-slate-600">Active Published Exam:</label>
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white focus:ring-1 focus:ring-teal-500 outline-hidden w-full sm:w-80"
                    >
                      <option value="">-- Choose Exam --</option>
                      {examsList.map(e => (
                        <option key={e.id} value={e.id}>{e.title}</option>
                      ))}
                    </select>
                  </div>

                  {selectedExamId ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                      {/* Left: Timetable start/end timestamp definition */}
                      <form onSubmit={handleUpdateExamTimestamps} className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <span>Define Specific Timestamps</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Set precise times when students are allowed to start and finish this exam paper.</p>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Window Starts Timestamp</label>
                            <input
                              type="datetime-local"
                              value={selectedExamStartTime}
                              onChange={(e) => setSelectedExamStartTime(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs text-gray-800 bg-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Window Closes Timestamp</label>
                            <input
                              type="datetime-local"
                              value={selectedExamEndTime}
                              onChange={(e) => setSelectedExamEndTime(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs text-gray-800 bg-white"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Duration Minutes</label>
                            <input
                              type="number"
                              value={selectedExamDuration}
                              onChange={(e) => setSelectedExamDuration(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 bg-white"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {updateTimingSuccess && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                              <Check className="w-4 h-4" /> Timestamps saved!
                            </span>
                          )}
                          <div className="flex-1" />
                          <button
                            type="submit"
                            disabled={updateTimingLoading}
                            className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            {updateTimingLoading ? "Saving..." : "Update Exam Window"}
                          </button>
                        </div>
                      </form>

                      {/* Right: Manual Student Eligibility Seating Grid */}
                      <div className="space-y-4">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-teal-600" />
                          <span>Toggle Seating Eligibility</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Clicking toggle will instantly grant or restrict a student's access, overriding automatic prerequisites.</p>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                                <th className="p-3">Student</th>
                                <th className="p-3">Email</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {allStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">No students registered in directories.</td>
                                </tr>
                              ) : (
                                allStudents.map(student => {
                                  const eligRecord = eligibilityRequests.find(r => r.examId === selectedExamId && r.studentId === student.id);
                                  const currentStatus = eligRecord ? eligRecord.status : "not applied";
                                  const isApproved = currentStatus === "approved";

                                  return (
                                    <tr key={student.id} className="hover:bg-slate-50/50">
                                      <td className="p-3 font-semibold text-slate-800">{student.name}</td>
                                      <td className="p-3 text-slate-400 text-[11px]">{student.email}</td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${isApproved ? "bg-emerald-50 text-emerald-700" : currentStatus === "rejected" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                                          {currentStatus}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleStudentEligibility(student.id, currentStatus)}
                                          className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-colors cursor-pointer ${isApproved ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-teal-50 text-teal-700 hover:bg-teal-100"}`}
                                        >
                                          {isApproved ? "Revoke" : "Approve"}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 italic bg-slate-50/30">
                      Please select an upcoming published exam to view specific window start/end timestamps and manage seating eligibility.
                    </div>
                  )}
                </div>

                {/* Create Exam Form + Timetable schedulers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Form: Timetable scheduler & Basic details */}
                  <form onSubmit={handleCreateExam} className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>Term Exam Timetable Scheduler</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Syllabus Course</label>
                        <select
                          value={examCourseId}
                          onChange={(e) => setExamCourseId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800"
                        >
                          {myCourses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Exam Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Midterm General Examination"
                          value={examTitle}
                          onChange={(e) => setExamTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Description / Instruction Rules</label>
                        <textarea
                          placeholder="Instructions, materials allowed..."
                          value={examDescription}
                          onChange={(e) => setExamDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                          rows={2}
                        />
                      </div>

                      {/* Timetable starts and ends dates (Req 6) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1 text-teal-700">
                          <Calendar className="w-3.5 h-3.5" /> Timetable Window Starts
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={examStartTime}
                          onChange={(e) => setExamStartTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1 text-rose-700">
                          <Lock className="w-3.5 h-3.5" /> Timetable Window Closes
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={examEndTime}
                          onChange={(e) => setExamEndTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Syllabus Seating Duration (Minutes)</label>
                        <input
                          type="number"
                          required
                          value={examDuration}
                          onChange={(e) => setExamDuration(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={examSubmitLoading || examQuestions.length === 0}
                      className="w-full mt-2 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all disabled:bg-slate-300"
                    >
                      {examSubmitLoading ? "Deploying Examination..." : `Publish Exam (${examQuestions.length} Questions)`}
                    </button>
                  </form>

                  {/* Right: Question Composer Area */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-teal-600" />
                      <span>Syllabus Exam Question Builder</span>
                    </div>

                    {/* Question items list preview */}
                    <div className="space-y-2 max-h-[180px] overflow-y-auto divide-y divide-slate-50">
                      {examQuestions.length === 0 ? (
                        <p className="text-slate-400 text-xs italic">No questions added yet. Construct your exam papers below.</p>
                      ) : (
                        examQuestions.map((q, idx) => (
                          <div key={idx} className="py-2 text-xs">
                            <div className="font-semibold text-slate-800">Q{idx + 1}: {q.text}</div>
                            <div className="text-slate-400 grid grid-cols-2 gap-1.5 mt-1 pl-2">
                              {q.options.map((o, oidx) => (
                                <span key={oidx} className={o === q.correctAnswer ? "text-teal-600 font-bold" : ""}>
                                  &bull; {o}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New question constructor form */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Draft New Query Statement</div>
                      <input
                        type="text"
                        placeholder="Question content (e.g., What does CBE stand for?)"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {newQuestionOptions.map((opt, oidx) => (
                          <input
                            key={oidx}
                            type="text"
                            placeholder={`Choice ${oidx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const opts = [...newQuestionOptions];
                              opts[oidx] = e.target.value;
                              setNewQuestionOptions(opts);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-500 uppercase">Correct Answer (Must match exactly one Choice above)</label>
                        <input
                          type="text"
                          placeholder="e.g. Commercial Bank of Ethiopia"
                          value={newQuestionCorrect}
                          onChange={(e) => setNewQuestionCorrect(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-teal-200 rounded-lg text-xs bg-teal-50/20 text-teal-800 font-semibold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddExamQuestion}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        + Push Question to Exam
                      </button>
                    </div>
                  </div>
                </div>

                {/* Published exams list list */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="text-sm font-bold text-slate-800">Active Published Exams & Timetables</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {examsList.length === 0 ? (
                      <p className="text-slate-400 text-xs italic md:col-span-2">No active examination rosters published.</p>
                    ) : (
                      examsList.map(ex => {
                        const starts = new Date(ex.startTime).toLocaleString();
                        const ends = new Date(ex.endTime).toLocaleString();
                        return (
                          <div key={ex.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 text-xs space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-900">{ex.title}</span>
                              <span className="bg-teal-50 text-teal-700 font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-full">{ex.durationMinutes} Mins</span>
                            </div>
                            <p className="text-slate-400 line-clamp-1 italic">"{ex.description}"</p>
                            
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-medium">
                              <div>📅 Opens: <span className="font-semibold text-slate-700">{starts}</span></div>
                              <div>🔒 Closes: <span className="font-semibold text-slate-700">{ends}</span></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: FILE MANAGEMENT */}
            {activeTab === "files" && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-2xl text-slate-800">Syllabus Course Materials & File Hub</h4>
                  <p className="text-slate-500 text-sm">Upload materials, link external lecture videos, or share cloud assets to sync directly with student classroom dashboards.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Upload / Add Resource Form */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                      <Upload className="w-4 h-4 text-teal-600" />
                      <span>Add Syllabus Material</span>
                    </div>

                    <form onSubmit={handleUploadResource} className="space-y-4 text-xs">
                      {/* Course Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Target Course Syllabus</label>
                        <select
                          value={resourceCourseId}
                          onChange={(e) => setResourceCourseId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-gray-800 outline-hidden focus:ring-1 focus:ring-teal-500"
                          required
                        >
                          <option value="">-- Choose Course --</option>
                          {myCourses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </div>

                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Resource Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lecture 2.1 Notes - Core Optimization"
                          value={resourceTitle}
                          onChange={(e) => setResourceTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 outline-hidden focus:ring-1 focus:ring-teal-500"
                        />
                      </div>

                      {/* Source Segmented Control */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Resource Source</label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                          {(["local_device", "google_drive", "external_link"] as const).map((src) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => {
                                setResourceSource(src);
                                setResourceFormat(src === "external_link" ? "link" : "pdf");
                              }}
                              className={`py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${resourceSource === src ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                            >
                              {src === "local_device" ? "📁 Device" : src === "google_drive" ? "🤖 Drive" : "🔗 URL"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Format Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Format</label>
                        <select
                          value={resourceFormat}
                          onChange={(e) => setResourceFormat(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-gray-800 outline-hidden focus:ring-1 focus:ring-teal-500"
                        >
                          {resourceSource === "external_link" ? (
                            <>
                              <option value="link">🔗 Webpage / Article</option>
                              <option value="video">🎥 Streaming Lecture / Video</option>
                            </>
                          ) : (
                            <>
                              <option value="pdf">📄 PDF Document (.pdf)</option>
                              <option value="doc">📝 Word Document (.docx)</option>
                              <option value="excel">📊 Excel spreadsheet (.xlsx)</option>
                              <option value="video">🎥 MP4 Lesson Video (.mp4)</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Conditional inputs */}
                      {resourceSource === "local_device" ? (
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Local Document File</label>
                          <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 text-center space-y-2">
                            <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                            <div className="text-[10px] text-slate-500">
                              {resourceFileName ? (
                                <span className="text-teal-600 font-bold break-all flex items-center justify-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> {resourceFileName}
                                </span>
                              ) : (
                                "Upload PDF, DOC, or XLS documents"
                              )}
                            </div>
                            <input
                              type="file"
                              id="device-resource-file-input"
                              className="hidden"
                              accept={
                                resourceFormat === "pdf" ? ".pdf" :
                                resourceFormat === "doc" ? ".doc,.docx" :
                                resourceFormat === "excel" ? ".xls,.xlsx" :
                                resourceFormat === "video" ? ".mp4" :
                                ".pdf,.doc,.docx,.xls,.xlsx"
                              }
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setResourceFileName(file.name);
                                  setUrlInput(`https://example.com/uploads/${file.name}`);
                                }
                              }}
                              required={!resourceFileName}
                            />
                            <label
                              htmlFor="device-resource-file-input"
                              className="inline-block px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Choose File
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase">
                            {resourceSource === "google_drive" ? "Google Drive Sharable Link" : "Resource External URL"}
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              required
                              placeholder={resourceSource === "google_drive" ? "https://drive.google.com/..." : "https://youtube.com/watch?v=..."}
                              value={resourceUrl}
                              onChange={(e) => setUrlInput(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-gray-800 outline-hidden focus:ring-1 focus:ring-teal-500"
                            />
                            <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          </div>
                          <p className="text-[10px] text-slate-400">Make sure links are publicly viewable by students.</p>
                        </div>
                      )}

                      {/* Success / Error notification */}
                      {resourcesSuccess && (
                        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-medium text-[11px] animate-pulse">
                          {resourcesSuccess}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={resourcesSaving || !resourceCourseId}
                        className="w-full py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-xl font-bold transition-all disabled:bg-slate-200 cursor-pointer"
                      >
                        {resourcesSaving ? "Publishing..." : "Add Resource Material"}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Files / Resources directory registry */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-2">
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-teal-600" />
                        <span>Syllabus Material Directory</span>
                      </div>
                    </div>

                    {/* Resources List Container */}
                    {resourcesLoading ? (
                      <div className="py-12 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                      </div>
                    ) : resourcesList.length === 0 ? (
                      <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/20">
                        <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-slate-400 text-xs italic">No course materials uploaded or linked in your portal directories yet.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                                <th className="p-3">Title / File</th>
                                <th className="p-3">Course</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Source</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {resourcesList.map((resItem) => {
                                return (
                                  <tr key={resItem.id} className="hover:bg-slate-50/50">
                                    <td className="p-3">
                                      <div className="space-y-0.5">
                                        <div className="font-semibold text-slate-800">{resItem.title}</div>
                                        {resItem.fileName && (
                                          <div className="text-[10px] text-slate-400 font-mono">File: {resItem.fileName}</div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3 text-slate-600 font-medium">{resItem.courseTitle}</td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-teal-50 text-teal-700">
                                        {resItem.format}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full font-semibold text-[9px] bg-slate-100 text-slate-600">
                                        {resItem.source === "local_device" ? "📁 Local PC" : resItem.source === "google_drive" ? "🤖 GDrive" : "🔗 URL Link"}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <a
                                          href={resItem.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          referrerPolicy="no-referrer"
                                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                          title="View Resource"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                          onClick={() => handleDeleteResource(resItem.id)}
                                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                                          title="Delete Material"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
