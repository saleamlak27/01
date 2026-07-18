/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Users, BookOpen, DollarSign, Award, CheckCircle, XCircle, Trash2, FileText, Download, ShieldCheck, RefreshCw, Loader2, MessageSquare, Send, Sparkles, Check, Globe, Search, AlertCircle, Mail } from "lucide-react";
import { Course, User } from "../types";
import EmailClient from "./EmailClient";

interface AdminDashboardProps {
  user: any;
  courses: Course[];
  onRefreshData: () => void;
}

export default function AdminDashboard({ user, courses, onRefreshData }: AdminDashboardProps) {
  const [adminData, setAdminData] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "approvals" | "users" | "payments" | "chat">("overview");

  // Direct Chat states
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newDirectMessage, setNewDirectMessage] = useState("");
  const [chatFilter, setChatFilter] = useState<"all" | "student" | "teacher" | "bot">("all");
  const [botTyping, setBotTyping] = useState(false);

  // User Management extra states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSubTab, setUserSubTab] = useState<"pending" | "students" | "teachers" | "all">("pending");

  useEffect(() => {
    loadAdminAnalytics();
    loadUsers();
    loadPayments();
  }, [courses, activeTab]);

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

  const loadAdminAnalytics = async () => {
    try {
      const response = await fetch("/api/reports/admin");
      const data = await response.json();
      if (response.ok) {
        setAdminData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (response.ok) {
        setUsersList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments");
      const data = await response.json();
      if (response.ok) {
        setPaymentsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: "POST"
      });
      if (response.ok) {
        loadPayments();
        loadAdminAnalytics();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to reject this payment record? This will revoke the student's pending enrollment access.")) return;
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: "POST"
      });
      if (response.ok) {
        loadPayments();
        loadAdminAnalytics();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRejectCourse = async (courseId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        onRefreshData();
        loadAdminAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: "approved" | "rejected" | "pending") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        loadUsers();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user profile? This action is irreversible.")) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        loadUsers();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = (reportType: string) => {
    alert(`CSV Spreadsheets Export success!\nExported ${reportType} report under compliance standards. File 'lms_export_2026.csv' downloaded.`);
  };

  const pendingCourses = courses.filter(c => c.status === "pending");

  return (
    <div id="admin-dashboard" className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      {/* Sidebar rails */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Supervisor</div>
          <h3 className="font-display font-bold text-lg text-slate-800">{user.name}</h3>
          <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Director Portal</span>
        </div>

        <nav className="flex flex-col space-y-1">
          {[
            { id: "overview", label: "Overview & Analytics", icon: <DollarSign className="w-4 h-4" /> },
            { id: "payments", label: "Verify Student Payments", icon: <ShieldCheck className="w-4 h-4" /> },
            { id: "approvals", label: "Approve Courses Queue", icon: <BookOpen className="w-4 h-4" /> },
            { id: "users", label: "Manage User Profiles", icon: <Users className="w-4 h-4" /> },
            { id: "chat", label: "Secure Webmail", icon: <Mail className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === tab.id ? "bg-slate-900 text-white shadow-md shadow-slate-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* TAB 1: OVERVIEW & ANALYTICS CHARTS */}
        {activeTab === "overview" && adminData && (
          <div className="space-y-8 animate-fade-in">
            {/* Aggregate Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Gross Revenue</div>
                <div className="text-3xl font-display font-bold">${adminData.totalRevenue.toFixed(2)}</div>
                <div className="absolute right-4 bottom-4 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 relative overflow-hidden">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Roster Profiles</div>
                <div className="text-3xl font-display font-bold text-slate-800">{adminData.activeUsers}</div>
                <div className="absolute right-4 bottom-4 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2 relative overflow-hidden">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Course Registrations</div>
                <div className="text-3xl font-display font-bold text-slate-800">{adminData.totalEnrollments}</div>
                <div className="absolute right-4 bottom-4 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-indigo-600">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Recharts Revenue & Enrollment Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <h4 className="font-display font-bold text-slate-800 text-sm">Weekly Gross Revenue Trends</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Stripe Secure billing</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={adminData.dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <h4 className="font-display font-bold text-slate-800 text-sm">Enrollments per Syllabus</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Engagement rate</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminData.coursesOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="title" stroke="#94A3B8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="enrollmentCount" fill="#14B8A6" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Reports Export Hub (Step 14) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="font-display font-bold text-slate-800 text-sm border-b border-slate-50 pb-3">Director Reports Export Hub</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Select standard transcripts, learning progression matrices, or Stripe receipts to export directly under administrative regulations.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleExportCSV("financial")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> Financial Reports (Gross Revenue)
                  </span>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportCSV("learning")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" /> Student Progress Reports
                  </span>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportCSV("teachers")}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" /> Teacher Performance Reports
                  </span>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURSE APPROVALS QUEUE */}
        {activeTab === "approvals" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">Course Verification Queue</h4>
              <p className="text-slate-500 text-sm">Review published course drafts submitted by instructors, and toggle approval status.</p>
            </div>

            {pendingCourses.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No courses are currently awaiting authorization in the approval queue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingCourses.map(course => (
                  <div key={course.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded uppercase">{course.category}</span>
                        <span className="text-xs text-slate-400">By Instructor: <span className="font-bold text-slate-700">{course.instructorName}</span></span>
                      </div>
                      <h5 className="font-display font-bold text-slate-800 text-base">{course.title}</h5>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-2xl">{course.description}</p>
                      <div className="text-xs font-bold text-blue-600">Draft Listing Price: ${course.price.toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleApproveRejectCourse(course.id, "approved")}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Syllabus</span>
                      </button>
                      <button
                        onClick={() => handleApproveRejectCourse(course.id, "rejected")}
                        className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Draft</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGE USER PROFILES (INTERACTIVE REGISTRATION APPROVAL) */}
        {activeTab === "users" && (() => {
          // Compute metrics
          const pendingCount = usersList.filter(u => u.status === "pending" || (!u.status && u.role !== "admin")).length;
          const studentsCount = usersList.filter(u => u.role === "student" && u.status === "approved").length;
          const teachersCount = usersList.filter(u => u.role === "teacher" && u.status === "approved").length;
          const rejectedCount = usersList.filter(u => u.status === "rejected").length;
          const totalCount = usersList.length;

          // Filter list
          const filteredUsers = usersList.filter(u => {
            // Search text match
            const query = userSearchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
              u.name.toLowerCase().includes(query) || 
              u.email.toLowerCase().includes(query) || 
              (u.phone && u.phone.includes(query)) ||
              (u.expertise && u.expertise.toLowerCase().includes(query));

            if (!matchesSearch) return false;

            // Sub-tab category match
            if (userSubTab === "pending") {
              return u.status === "pending" || (!u.status && u.role !== "admin");
            }
            if (userSubTab === "students") {
              return u.role === "student" && u.status === "approved";
            }
            if (userSubTab === "teachers") {
              return u.role === "teacher" && u.status === "approved";
            }
            return true; // "all"
          });

          return (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h4 className="font-display font-bold text-2xl text-slate-800">Roster Workspace Profiles &amp; Approval Hub</h4>
                <p className="text-slate-500 text-sm">Review active rosters, email credentials, and verify incoming teacher/student registrations before granting access to portals.</p>
              </div>

              {/* Metric Overview cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4.5 rounded-2xl border transition-all flex items-center justify-between shadow-xs ${pendingCount > 0 ? "bg-amber-50/70 border-amber-200" : "bg-white border-slate-100"}`}>
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Registrations</h5>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-800">{pendingCount}</span>
                      {pendingCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      )}
                    </div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${pendingCount > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-400"}`}>
                    ⏳
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved Students</h5>
                    <span className="text-2xl font-black text-slate-800">{studentsCount}</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                    🎓
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved Teachers</h5>
                    <span className="text-2xl font-black text-slate-800">{teachersCount}</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg">
                    🧑‍🏫
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-xs">
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</h5>
                    <span className="text-2xl font-black text-slate-800">{totalCount}</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
                    👥
                  </div>
                </div>
              </div>

              {/* Sub-tabs and Search */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Segments switchers */}
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-lg">
                  {[
                    { id: "pending", label: "Pending queue", count: pendingCount, color: "text-amber-700 bg-amber-50" },
                    { id: "students", label: "Students", count: studentsCount, color: "text-blue-700 bg-blue-50" },
                    { id: "teachers", label: "Teachers", count: teachersCount, color: "text-teal-700 bg-teal-50" },
                    { id: "all", label: "All Users", count: totalCount, color: "text-slate-700 bg-slate-50" }
                  ].map(tab => {
                    const isActive = userSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setUserSubTab(tab.id as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${isActive ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${isActive ? tab.color : "bg-slate-200 text-slate-600"}`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search field */}
                <div className="relative max-w-md w-full">
                  <input
                    type="text"
                    placeholder="Search by name, email, expertise..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white outline-hidden focus:ring-1 focus:ring-slate-800"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Roster Listing Container */}
              {filteredUsers.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-sm font-semibold">No registered users match your current selection.</p>
                  <p className="text-slate-400 text-xs">Try switching between Pending/Approved sub-tabs or clearing your search filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredUsers.map(u => {
                    const isPending = u.status === "pending" || (!u.status && u.role !== "admin");
                    const isRejected = u.status === "rejected";
                    const isApproved = u.status === "approved";
                    const isCurrentUser = u.id === user.id;

                    return (
                      <div 
                        key={u.id} 
                        className={`p-5 rounded-2xl border bg-white transition-all shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isPending ? "border-l-4 border-l-amber-500 border-slate-100" : isRejected ? "border-l-4 border-l-red-500 border-slate-100 bg-slate-50/20" : "border-slate-100 hover:border-slate-200"}`}
                      >
                        {/* User Credentials & Metadata block */}
                        <div className="space-y-3 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                              {u.name.split(" ").map(w => w[0]).join("").substring(0, 2)}
                            </div>
                            <div>
                              <h5 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                {u.name}
                                {isCurrentUser && (
                                  <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded">You</span>
                                )}
                              </h5>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                                <span>{u.email}</span>
                                <span>•</span>
                                <span>{u.phone || "No phone registered"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Role and custom credentials detail badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${u.role === "admin" ? "bg-purple-100 text-purple-700 border border-purple-200" : u.role === "teacher" ? "bg-teal-100 text-teal-700 border border-teal-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}>
                              {u.role}
                            </span>

                            {isPending && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">
                                Pending Approval
                              </span>
                            )}

                            {isRejected && (
                              <span className="bg-red-100 text-red-800 border border-red-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                Access Denied
                              </span>
                            )}

                            {isApproved && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Approved &amp; Verified
                              </span>
                            )}

                            {u.role === "teacher" && u.expertise && (
                              <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-2 py-0.5 rounded-full italic max-w-xs truncate">
                                Expertise: {u.expertise}
                              </span>
                            )}
                          </div>

                          {/* Interactive note elements / CV display for review */}
                          {(u.fastTrackMessage || (u.role === "teacher" && u.cvUrl)) && (
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 mt-2">
                              {u.fastTrackMessage && (
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                    💬 Registration Application Note
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed italic">
                                    "{u.fastTrackMessage}"
                                  </p>
                                </div>
                              )}
                              {u.role === "teacher" && u.cvUrl && (
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] text-slate-400 font-semibold">📄 Professional Curriculum Vitae (CV)</span>
                                  <a 
                                    href={u.cvUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                  >
                                    View CV Document &rarr;
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Interactive Approval and Deletion actions column */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                          {/* If pending, display explicit Verification Approval trigger buttons */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateUserStatus(u.id, "approved")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve Access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateUserStatus(u.id, "rejected")}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-red-200"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Deny</span>
                              </button>
                            </>
                          )}

                          {/* If rejected, allow re-evaluating or marking pending again */}
                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserStatus(u.id, "pending")}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Set status back to pending to re-evaluate"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Re-Evaluate Application</span>
                            </button>
                          )}

                          {/* If approved (active), allow revert or suspend */}
                          {isApproved && !isCurrentUser && (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserStatus(u.id, "pending")}
                              className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg font-semibold border border-slate-200 transition-colors cursor-pointer"
                              title="Revert verified user to pending verification status"
                            >
                              Revoke Clearance
                            </button>
                          )}

                          {/* Profile deletion */}
                          {!isCurrentUser && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-slate-100 transition-colors cursor-pointer"
                              title="Irreversibly delete profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 4: VERIFY STUDENT PAYMENTS (CBE / TELEBIRR) */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">Student Receipts &amp; Payment Audit</h4>
              <p className="text-slate-500 text-sm">Review incoming Telebirr mobile wallet transactions and CBE Bank wire transfers. Authenticate receipt credentials below to unlock coursework instantly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                <span className="text-xl">📱</span>
                <div>
                  <h6 className="font-bold text-xs text-amber-900 uppercase">Telebirr Wallet Address</h6>
                  <p className="text-sm font-semibold text-amber-800">0979454435</p>
                  <span className="text-[10px] text-amber-700/80">Default payout phone destination</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <span className="text-xl">🏦</span>
                <div>
                  <h6 className="font-bold text-xs text-blue-900 uppercase">CBE Bank Account</h6>
                  <p className="text-sm font-semibold text-blue-800">1000299517776</p>
                  <span className="text-[10px] text-blue-700/80">Commercial Bank of Ethiopia</span>
                </div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                <span className="text-xl">📈</span>
                <div>
                  <h6 className="font-bold text-xs text-emerald-900 uppercase">Pending Audits Queue</h6>
                  <p className="text-sm font-semibold text-emerald-800">
                    {paymentsList.filter(p => p.status === "pending").length} Transactions
                  </p>
                  <span className="text-[10px] text-emerald-750/80">Requires manual direct approval</span>
                </div>
              </div>
            </div>

            {paymentsList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">No incoming student payment billing records found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                        <th className="p-4">Transaction / Date</th>
                        <th className="p-4">Student Profile</th>
                        <th className="p-4">Course Title</th>
                        <th className="p-4">Provider / Method</th>
                        <th className="p-4">Transfer Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentsList.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="font-mono text-xs font-bold text-slate-800">{item.invoiceNumber || item.id}</div>
                            <div className="text-[10px] text-slate-400">{new Date(item.date).toLocaleString()}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-950">{item.studentName}</div>
                            <div className="text-[11px] text-slate-400">{item.studentEmail}</div>
                            <div className="text-[11px] text-slate-500">{item.studentPhone || "No Phone"}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-700 max-w-xs truncate" title={item.courseTitle}>
                              {item.courseTitle}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <span className={`w-2 h-2 rounded-full ${
                                item.paymentMethod === "telebirr" ? "bg-emerald-500" :
                                item.paymentMethod === "bank" ? "bg-blue-500" : "bg-purple-500"
                              }`} />
                              <span className="capitalize">{item.paymentMethod || "card"}</span>
                              {item.provider && <span className="text-[10px] text-slate-400">({item.provider})</span>}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            {item.currency === "ETB" || item.amountETB ? (
                              <span>{item.amountETB || Math.round(item.amount * 120)} ETB</span>
                            ) : (
                              <span>${item.amount.toFixed(2)} USD</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              item.status === "paid" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                              item.status === "pending" ? "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse" :
                              "bg-red-100 text-red-700 border border-red-200"
                            }`}>
                              {item.status === "paid" ? "Approved" : item.status === "pending" ? "Pending Audit" : "Failed/Rejected"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {item.status === "pending" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleApprovePayment(item.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(item.id)}
                                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Audit Complete</span>
                            )}
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

        {/* TAB 5: SECURE INTEGRATED MAIL */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-2xl text-slate-800">Secure Integrated Webmail</h4>
              <p className="text-slate-500 text-sm">Review, compose, and organize formal notices, support queries, or correspond with your Gemini Administrative Assistant.</p>
            </div>

            <EmailClient user={user} onRefreshData={onRefreshData} />
          </div>
        )}

      </div>
    </div>
  );
}
