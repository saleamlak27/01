/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Award, Clock, FileText, CheckCircle, Compass, CreditCard, ChevronRight, MessageSquare, Loader2, Sparkles, AlertCircle, Send, Globe, Check, Mail } from "lucide-react";
import { Course, Enrollment, Certificate, Payment, AppNotification } from "../types";
import EmailClient from "./EmailClient";

interface StudentDashboardProps {
  user: any;
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  payments: Payment[];
  notifications: AppNotification[];
  onSelectCourse: (course: Course) => void;
  onViewCertificate: (cert: Certificate) => void;
  onRefreshData: () => void;
}

export default function StudentDashboard({
  user,
  courses,
  enrollments,
  certificates,
  payments,
  notifications,
  onSelectCourse,
  onViewCertificate,
  onRefreshData
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "courses" | "certificates" | "billing" | "advisor" | "chat">("dashboard");
  
  // AI Advisor state
  const [advisorInput, setAdvisorInput] = useState("");
  const [advisorOutput, setAdvisorOutput] = useState("");
  const [advisorRecIds, setAdvisorRecIds] = useState<string[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [oneClickLoadingId, setOneClickLoadingId] = useState<string | null>(null);

  // Chat and messaging states disabled in favor of Secure Webmail System
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newDirectMessage, setNewDirectMessage] = useState("");
  const [chatFilter, setChatFilter] = useState<"all" | "teacher" | "admin" | "bot">("all");
  const [botTyping, setBotTyping] = useState(false);

  const completedCount = enrollments.filter(e => e.progress >= 100).length;
  const inProgressCount = enrollments.filter(e => e.progress < 100).length;

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

  const handleAskAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorInput.trim()) return;
    setAdvisorLoading(true);
    setAdvisorOutput("");
    setAdvisorRecIds([]);

    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile: {
            name: user.name,
            enrolledCourses: enrollments.map(e => {
              const c = courses.find(course => course.id === e.courseId);
              return c?.title || e.courseId;
            }),
            completedCourses: enrollments.filter(e => e.progress >= 100).map(e => e.courseId)
          },
          interests: advisorInput
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAdvisorOutput(data.recommendationText);
        setAdvisorRecIds(data.recommendedCourseIds || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setAdvisorOutput("Could not consult the Advisor model at this time. Please check your network connection.");
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleOneClickEnroll = async (courseId: string) => {
    setOneClickLoadingId(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id })
      });
      if (response.ok) {
        onRefreshData();
        alert("Enrolled successfully in course with AI Advisor 1-Click!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOneClickLoadingId(null);
    }
  };

  return (
    <div id="student-dashboard" className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      
      {/* Side Navigation Rail */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workspace</div>
          <h3 className="font-display font-bold text-lg text-slate-800">{user.name}</h3>
          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Student Portal</span>
        </div>

        <nav className="flex flex-col space-y-1">
          {[
            { id: "dashboard", label: "Dashboard Home", icon: <Compass className="w-4 h-4" /> },
            { id: "courses", label: "My Enrolled Courses", icon: <BookOpen className="w-4 h-4" /> },
            { id: "certificates", label: "Credentials Vault", icon: <Award className="w-4 h-4" /> },
            { id: "chat", label: "Secure Webmail", icon: <Mail className="w-4 h-4" /> },
            { id: "billing", label: "Billing Receipts", icon: <CreditCard className="w-4 h-4" /> },
            { id: "advisor", label: "AI Study Advisor", icon: <Sparkles className="w-4 h-4 text-amber-500 fill-amber-100" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-500" /> Enrolled
                </div>
                <div className="text-2xl font-display font-bold text-slate-800">{enrollments.length}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed
                </div>
                <div className="text-2xl font-display font-bold text-slate-800">{completedCount}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> In Progress
                </div>
                <div className="text-2xl font-display font-bold text-slate-800">{inProgressCount}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" /> Certifications
                </div>
                <div className="text-2xl font-display font-bold text-slate-800">{certificates.length}</div>
              </div>
            </div>

            {/* Dashboard Course list */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Course Progression Track</h4>
              
              {enrollments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm">You are not enrolled in any courses yet. Explore our course catalog!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {enrollments.map(enr => {
                    const course = courses.find(c => c.id === enr.courseId);
                    if (!course) return null;
                    const isPending = enr.status === "pending_payment";
                    return (
                      <div key={enr.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 last:border-0">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="font-display font-bold text-slate-800 text-sm">{course.title}</h5>
                            {isPending && (
                              <span className="bg-amber-50 text-amber-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase border border-amber-200 flex items-center gap-1">
                                ⏳ Pending CBE/telebirr Receipt Audit
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 w-full max-w-md">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${isPending ? 0 : enr.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{isPending ? 0 : enr.progress}% Completed</span>
                          </div>
                        </div>
                        {isPending ? (
                          <div className="text-[11px] font-bold text-amber-700 bg-amber-50/50 border border-amber-100 px-3 py-1.5 rounded-xl flex items-center gap-1 text-center shrink-0">
                            🔒 Locked - Awaiting Verification
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectCourse(course)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <span>{enr.progress >= 100 ? "Review Lectures" : "Continue Study"}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications and Timeline activity logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="font-display font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>Timeline Alerts</span>
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-xs">No recent notifications.</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${notif.read ? "bg-slate-50/50 border-slate-100 text-slate-500" : "bg-blue-50/30 border-blue-100 text-blue-900"}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${notif.read ? "bg-slate-300" : "bg-blue-500"}`}></div>
                        <div className="space-y-1 flex-1">
                          <p>{notif.text}</p>
                          <span className="text-[10px] text-slate-400 block">{new Date(notif.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Study Assistant Quick Widget */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> AI Assisted Learning
                  </span>
                  <h4 className="font-display font-bold text-xl leading-tight">Consult with Gemini AI Tutor</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Ask questions, verify formulas, compile test runs, or generate modular practice quizzes automatically in real-time. Navigate inside any of your enrolled courses syllabus to get started!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("advisor")}
                  className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Launch AI Career Planner</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY ENROLLED COURSES */}
        {activeTab === "courses" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">Your Enrolled Syllabus</h4>
              <p className="text-slate-500 text-sm">Review notes, complete assignments, and schedule quiz checks.</p>
            </div>

            {enrollments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">You are not registered in any course syllabus yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrollments.map(enr => {
                  const course = courses.find(c => c.id === enr.courseId);
                  if (!course) return null;
                  const isPending = enr.status === "pending_payment";
                  return (
                    <div key={enr.id} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between relative">
                      {isPending && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider z-10 shadow-xs">
                          Pending Approval
                        </div>
                      )}
                      <div className="relative h-32 overflow-hidden bg-slate-100">
                        <img src={course.thumbnail} alt={course.title} referrerPolicy="no-referrer" className={`w-full h-full object-cover ${isPending ? 'grayscale blur-xs' : ''}`} />
                        <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {course.category}
                        </span>
                      </div>
                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h5 className="font-display font-bold text-slate-800 text-base line-clamp-1">{course.title}</h5>
                          <p className="text-slate-400 text-xs">Instructor: {course.instructorName}</p>
                        </div>
                        
                        {isPending ? (
                          <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-800 space-y-1">
                            <p className="font-bold">🔐 CBE / telebirr Verification Pending</p>
                            <p className="text-[10px] leading-relaxed text-amber-700/90">Our administrative department is auditing the transfer. It will be unlocked shortly!</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-baseline text-xs text-slate-500 font-bold">
                              <span>Syllabus Completed:</span>
                              <span>{enr.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${enr.progress}%` }}></div>
                            </div>
                          </div>
                        )}

                        <button
                          disabled={isPending}
                          onClick={() => onSelectCourse(course)}
                          className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isPending 
                              ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isPending ? "Awaiting Payment Verification" : "Resume Classroom Lecture"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CREDENTIALS VAULT */}
        {activeTab === "certificates" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">Your Digital Certifications</h4>
              <p className="text-slate-500 text-sm">Download verified PDF transcripts of your finished educational courses.</p>
            </div>

            {certificates.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No certificates earned yet. Achieve 100% course completions to automatically issue awards!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map(cert => (
                  <div key={cert.id} className="bg-white rounded-2xl border-4 border-amber-500/30 p-6 flex flex-col justify-between space-y-6 shadow-xs relative">
                    <div className="absolute top-4 right-4 w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center border border-amber-500 text-amber-600">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest block">Verifiable Credential</span>
                      <h5 className="font-display font-bold text-slate-800 text-base leading-snug">{cert.courseName}</h5>
                      <p className="text-slate-500 text-xs">Instructor: {cert.instructorName}</p>
                      <div className="p-2.5 bg-slate-50 rounded-xl font-mono text-[9px] text-slate-400 border border-slate-100 flex items-center justify-between">
                        <span>CODE: {cert.verificationCode}</span>
                        <span>ISSUED: {cert.completionDate}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onViewCertificate(cert)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Print / Download Credential PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BILLING RECEIPTS */}
        {activeTab === "billing" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">Payment Billing Archives</h4>
              <p className="text-slate-500 text-sm">Download your Stripe invoice receipts, single-course buyouts, and memberships.</p>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No transaction receipts logged under this account profile.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                        <th className="p-4">Invoice Number</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Billing Plan</th>
                        <th className="p-4">Method</th>
                        <th className="p-4 text-right">Amount Charged</th>
                        <th className="p-4 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono text-xs text-slate-900">{pay.invoiceNumber}</td>
                          <td className="p-4 text-xs">{new Date(pay.date).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                              {pay.plan || "course buyout"}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-medium">
                            {pay.paymentMethod === "telebirr" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                📱 telebirr ({pay.provider || "Telebirr"})
                              </span>
                            ) : pay.paymentMethod === "bank" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                🏦 Bank ({pay.provider || "CBE"})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                💳 Card (Stripe)
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right font-display font-bold text-slate-900">
                            {pay.currency === "ETB" ? (
                              <span className="text-emerald-600">{(pay.amountETB || Math.round(pay.amount * 120)).toLocaleString()} ETB</span>
                            ) : (
                              <span>${pay.amount.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                const detailString = pay.paymentMethod === "telebirr" 
                                  ? `Simulated through telebirr mobile wallet (ETB Payment).` 
                                  : pay.paymentMethod === "bank"
                                  ? `Simulated through direct bank wire transfer via ${pay.provider || "Ethiopian Bank"}.`
                                  : `Charged through Stripe secure gate.`;
                                alert(`Invoice Receipt Detail:\n\nInvoice No: ${pay.invoiceNumber}\nDate: ${new Date(pay.date).toLocaleDateString()}\nCourse Buyout: ${pay.plan || "Syllabus Plan"}\nAmount Charged: ${pay.currency === "ETB" ? (pay.amountETB?.toLocaleString() || Math.round(pay.amount * 120)) + " ETB" : "$" + pay.amount.toFixed(2)}\n\nPayment Status: ${pay.status.toUpperCase()}\nMethod: ${pay.paymentMethod?.toUpperCase() || "CARD"}\n\n${detailString}`);
                              }}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AI STUDY ADVISOR */}
        {activeTab === "advisor" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">AI Career path Advisor</h4>
              <p className="text-slate-500 text-sm">Tell Gemini your career objectives and let AI formulate optimized course schedules.</p>
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-6 border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-2 text-amber-400">
                <Sparkles className="w-6 h-6 fill-amber-400/10" />
                <h5 className="font-display font-bold text-lg">Integrated Gemini Educational Advisor</h5>
              </div>

              <form onSubmit={handleAskAdvisor} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Describe your Career Goals or Interests</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. I want to build advanced Machine Learning models in healthcare, or learn modern frontend reactivity..."
                    value={advisorInput}
                    onChange={(e) => setAdvisorInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-white placeholder-slate-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={advisorLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-blue-800"
                >
                  {advisorLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Formulating study schedules...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Career Interests</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Recommendation Response Output */}
              {advisorOutput && (
                <div className="pt-6 border-t border-slate-800 space-y-6">
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 text-sm text-slate-200 leading-relaxed font-sans space-y-2">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <MessageSquare className="w-4 h-4" /> Gemini AI Assessment
                    </div>
                    <p>{advisorOutput}</p>
                  </div>

                  {/* Matching Course Cards */}
                  {advisorRecIds.length > 0 && (
                    <div className="space-y-3">
                      <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Course Syllabus:</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {courses
                          .filter(c => advisorRecIds.includes(c.id))
                          .map(recC => {
                            const isEnrolled = enrollments.some(e => e.courseId === recC.id);
                            return (
                              <div key={recC.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between space-y-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase">{recC.category}</span>
                                  <h6 className="font-display font-bold text-white text-sm line-clamp-1">{recC.title}</h6>
                                  <p className="text-slate-400 text-xs">${recC.price.toFixed(2)}</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={isEnrolled || oneClickLoadingId === recC.id}
                                  onClick={() => handleOneClickEnroll(recC.id)}
                                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${isEnrolled ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                                >
                                  {oneClickLoadingId === recC.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : isEnrolled ? (
                                    <span>Enrolled Already</span>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>1-Click Fast Enroll</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SECURE INTEGRATED MAIL */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">Secure Integrated Webmail</h4>
              <p className="text-slate-500 text-sm">Review incoming letters from faculty, draft reports, and communicate with your Gemini Academic Copilot securely.</p>
            </div>

            <EmailClient user={user} onRefreshData={onRefreshData} />
          </div>
        )}

      </div>
    </div>
  );
}
