/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Award, Users, DollarSign, Bell, LogOut, ChevronRight, CheckCircle, CreditCard, ShieldCheck, Sparkles, Star, Printer, X, Loader2 } from "lucide-react";
import { Course, Enrollment, Certificate, Payment, AppNotification, Submission, UserRole } from "./types";

import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import AdminDashboard from "./components/AdminDashboard";
import LearningInterface from "./components/LearningInterface";
import PendingApprovalView from "./components/PendingApprovalView";

export default function App() {
  // Navigation & Router
  const [view, setView] = useState<"landing" | "auth" | "student" | "teacher" | "admin" | "classroom">("landing");
  const [authRoleTrigger, setAuthRoleTrigger] = useState<"student" | "teacher">("student");

  // Core App states
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Selected Active Course inside classroom
  const [classroomCourse, setClassroomCourse] = useState<Course | null>(null);

  // Stripe Checkout Modal state
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null);
  const [stripeCardName, setStripeCardName] = useState("");
  const [stripeCardNum, setStripeCardNum] = useState("4242 4242 4242 4242");
  const [stripeExpiry, setStripeExpiry] = useState("12/28");
  const [stripeCvc, setStripeCvc] = useState("123");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0); // 0.1 for 10%
  const [couponFeedback, setCouponFeedback] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Ethiopian Payments & Telebirr states
  const [paymentMethod, setPaymentMethod] = useState<"card" | "telebirr" | "bank">("card");
  const [teleMobile, setTeleMobile] = useState("0979454435");
  const [teleOtp, setTeleOtp] = useState("");
  const [teleSentOtp, setTeleSentOtp] = useState("");
  const [teleStep, setTeleStep] = useState<"phone" | "otp" | "success">("phone");
  const [teleCountdown, setTeleCountdown] = useState(0);
  const [selectedBank, setSelectedBank] = useState("CBE");
  const [bankAccountNum, setBankAccountNum] = useState("1000299517776");
  const [bankReference, setBankReference] = useState("");
  const [bankStep, setBankStep] = useState<"input" | "success">("input");
  const [smsToast, setSmsToast] = useState<{ show: boolean; message: string } | null>(null);

  // Certificate PDF viewer modal
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);

  // Notifications bell popover state
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCourses();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (user) {
      syncUserData();
    }
  }, [user]);

  useEffect(() => {
    let timer: any;
    if (teleCountdown > 0) {
      timer = setTimeout(() => setTeleCountdown(teleCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [teleCountdown]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`/api/courses?search=${searchQuery}`);
      const data = await response.json();
      if (response.ok) {
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/notifications/${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncUserData = async () => {
    if (!user) return;
    try {
      // Sync user profile status
      const resUser = await fetch(`/api/users/${user.id}`);
      const dataUser = await resUser.json();
      if (resUser.ok) {
        setUser(dataUser);
      }

      // Sync notifications
      fetchNotifications();

      if (user.role === UserRole.STUDENT) {
        // Fetch Student enrollments
        const resEnr = await fetch(`/api/students/${user.id}/enrollments`);
        const dataEnr = await resEnr.json();
        if (resEnr.ok) setEnrollments(dataEnr);

        // Fetch student certificates
        const resCert = await fetch(`/api/students/${user.id}/certificates`);
        const dataCert = await resCert.json();
        if (resCert.ok) setCertificates(dataCert);

        // Fetch payments
        const resPay = await fetch(`/api/students/${user.id}/payments`);
        const dataPay = await resPay.json();
        if (resPay.ok) setPayments(dataPay);

      } else if (user.role === UserRole.TEACHER) {
        // Fetch Teacher submissions
        const resSub = await fetch(`/api/teachers/${user.id}/submissions`);
        const dataSub = await resSub.json();
        if (resSub.ok) setSubmissions(dataSub);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setTimeout(() => {
      fetchCourses();
    }, 100);
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === UserRole.STUDENT) {
      setView("student");
    } else if (authenticatedUser.role === UserRole.TEACHER) {
      setView("teacher");
    } else if (authenticatedUser.role === UserRole.ADMIN) {
      setView("admin");
    }
  };

  // Click on "Enroll" triggering Checkout or Login flow
  const handleEnrollClick = (course: Course) => {
    if (!user) {
      setAuthRoleTrigger("student");
      setView("auth");
      return;
    }
    
    // Check if student already enrolled
    const alreadyEnrolled = enrollments.some(e => e.courseId === course.id);
    if (alreadyEnrolled) {
      setClassroomCourse(course);
      setView("classroom");
      return;
    }

    // Otherwise trigger Stripe Checkout simulator modal
    setCheckoutCourse(course);
    setStripeCardName(user.name);
    setCouponCode("");
    setCouponDiscount(0);
    setCouponFeedback("");
    setShowStripeModal(true);
  };

  const applyPromoCode = () => {
    if (couponCode.toUpperCase() === "LEARN10") {
      setCouponDiscount(0.1);
      setCouponFeedback("LEARN10 coupon active! 10% discount applied successfully.");
    } else {
      setCouponFeedback("Invalid promo coupon.");
    }
  };

  const handleSendTelebirrOtp = () => {
    if (!teleMobile.match(/^(09|07|\+251)\d{8}$/)) {
      alert("Please enter a valid Ethiopian mobile phone number (e.g., 0912345678 or +251912345678).");
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setTeleSentOtp(code);
    setTeleCountdown(45);
    setTeleStep("otp");
    
    // Display simulated phone SMS popup
    setSmsToast({
      show: true,
      message: `💬 SMS from Telebirr: Your EduSphere OTP is ${code}. Please enter this code to authorize payment.`
    });
  };

  const handleCompleteStripeCheckout = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!checkoutCourse || !user) return;
    setCheckoutLoading(true);

    try {
      const finalPrice = checkoutCourse.price * (1 - couponDiscount);
      const finalPriceETB = Math.round(finalPrice * 120);

      const enrollBody: any = {
        studentId: user.id,
        amount: finalPrice,
        paymentMethod: paymentMethod,
        currency: paymentMethod === "card" ? "USD" : "ETB",
        amountETB: paymentMethod === "card" ? undefined : finalPriceETB,
      };

      if (paymentMethod === "card") {
        enrollBody.provider = "Stripe";
      } else if (paymentMethod === "telebirr") {
        enrollBody.provider = "Telebirr";
        enrollBody.phone = teleMobile;
      } else if (paymentMethod === "bank") {
        enrollBody.provider = selectedBank;
        enrollBody.accountNumber = bankAccountNum;
        enrollBody.reference = bankReference;
      }

      // 1. Log Enrollment (which records billing in database with options)
      const responseEnr = await fetch(`/api/courses/${checkoutCourse.id}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollBody)
      });

      // 2. Also log checkout record
      await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          courseId: checkoutCourse.id,
          plan: "single-course"
        })
      });

      if (responseEnr.ok) {
        setShowStripeModal(false);
        setCheckoutCourse(null);
        syncUserData();
        
        let successMessage = `Payment successful!\nYou are now officially enrolled in "${checkoutCourse.title}" course.`;
        if (paymentMethod === "telebirr") {
          successMessage = `🎉 Telebirr payment successful!\nYou paid ${finalPriceETB} ETB and are enrolled in "${checkoutCourse.title}".`;
        } else if (paymentMethod === "bank") {
          successMessage = `🎉 Bank transfer payment verified!\nYou paid ${finalPriceETB} ETB via ${selectedBank} and are enrolled in "${checkoutCourse.title}".`;
        }
        
        alert(successMessage);
        setView("student");
        
        // Reset states
        setTeleStep("phone");
        setTeleMobile("0979454435");
        setTeleOtp("");
        setBankStep("input");
        setBankAccountNum("1000299517776");
        setBankReference("");
        setSmsToast(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEnrollments([]);
    setCertificates([]);
    setPayments([]);
    setView("landing");
  };

  return (
    <div 
      id="app-root" 
      className="min-h-screen flex flex-col justify-between font-sans text-slate-800 bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ 
        backgroundImage: `linear-gradient(to bottom, rgba(248, 250, 252, 0.92), rgba(248, 250, 252, 0.96)), url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1920&q=80')` 
      }}
    >
      
      {/* simulated SMS Push Toast Banner */}
      {smsToast && (
        <div className="fixed top-5 right-5 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-800 z-[999] animate-bounce flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-extrabold shadow-md shrink-0">
            💬
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SMS Simulator Node</span>
              <span className="text-[9px] text-slate-500 font-mono">Just Now</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-slate-100">{smsToast.message}</p>
            <div className="pt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (teleStep === "otp" && teleSentOtp) {
                    setTeleOtp(teleSentOtp);
                    setSmsToast(null);
                  }
                }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] font-bold text-white transition-all cursor-pointer"
              >
                Auto-fill Code
              </button>
              <button
                type="button"
                onClick={() => setSmsToast(null)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Header Navigation */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 sm:px-8 flex justify-between items-center z-40 shadow-xs">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView("landing")}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-slate-800 tracking-tight leading-none">New-Tech school of world</h1>
            <h5 className="text-[11px] text-blue-600 font-bold uppercase mt-1">Dev. By saleamlak.D</h5>
          </div>
        </div>

        {/* Dynamic header routes actions */}
        <div className="flex items-center space-x-6">
          <button onClick={() => setView("landing")} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer hidden sm:block">
            Home Catalogue
          </button>

          {user ? (
            <div className="flex items-center space-x-4">
              
              {/* Dashboard redirection link based on role */}
              <button
                onClick={() => {
                  if (user.role === UserRole.STUDENT) setView("student");
                  else if (user.role === UserRole.TEACHER) setView("teacher");
                  else if (user.role === UserRole.ADMIN) setView("admin");
                }}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Go to Portal Workspace &rarr;
              </button>

              {/* Notification bell Popover trigger */}
              <div className="relative">
                <button
                  id="notif-bell-btn"
                  onClick={() => setShowNotifPopover(!showNotifPopover)}
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-500 relative cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white"></span>
                  )}
                </button>

                {/* Notifications panel dropdown drawer */}
                {showNotifPopover && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl p-4 space-y-3 z-50 animate-fade-in">
                    <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                      <span className="text-xs font-bold text-slate-800">Timeline Alerts</span>
                      <button onClick={() => setShowNotifPopover(false)} className="text-[10px] text-slate-400 font-bold hover:underline cursor-pointer">
                        Close
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <p className="text-slate-400 text-xs italic text-center py-4">No recent messages.</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="pt-2 flex justify-between items-start gap-2 text-xs">
                            <div className="space-y-1">
                              <p className="text-slate-700 leading-snug">{n.text}</p>
                              <span className="text-[10px] text-slate-400 block">{new Date(n.timestamp).toLocaleString()}</span>
                            </div>
                            <button
                              onClick={() => handleDismissNotification(n.id)}
                              className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User profile capsule and Logout trigger */}
              <div className="flex items-center space-x-2 border-l border-slate-100 pl-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">{user.name}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{user.role}</div>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                  title="Logout session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                id="header-sign-in"
                onClick={() => { setAuthRoleTrigger("student"); setView("auth"); }}
                className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 cursor-pointer"
              >
                Sign In
              </button>
              <button
                id="header-start-free"
                onClick={() => { setAuthRoleTrigger("student"); setView("auth"); }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Start Learning
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container Core Router */}
      <main className="flex-1 py-10 px-6 sm:px-8 max-w-7xl w-full mx-auto">
        {view === "landing" && (
          <LandingPage
            courses={courses}
            onSearch={handleSearch}
            onEnroll={handleEnrollClick}
            onAuthTrigger={(role) => {
              setAuthRoleTrigger(role);
              setView("auth");
            }}
            onSelectCourse={(course) => {
              handleEnrollClick(course);
            }}
            isLoggedIn={!!user}
          />
        )}

        {view === "auth" && (
          <AuthPage
            onAuthSuccess={handleAuthSuccess}
            defaultRole={authRoleTrigger}
          />
        )}

        {view === "student" && user && (
          user.status === "pending" || user.status === "rejected" ? (
            <PendingApprovalView
              user={user}
              onLogout={handleLogout}
              onRefresh={syncUserData}
            />
          ) : (
            <StudentDashboard
              user={user}
              courses={courses}
              enrollments={enrollments}
              certificates={certificates}
              payments={payments}
              notifications={notifications}
              onSelectCourse={(course) => {
                setClassroomCourse(course);
                setView("classroom");
              }}
              onViewCertificate={(cert) => {
                setActiveCertificate(cert);
                setShowCertModal(true);
              }}
              onRefreshData={syncUserData}
            />
          )
        )}

        {view === "teacher" && user && (
          user.status === "pending" || user.status === "rejected" ? (
            <PendingApprovalView
              user={user}
              onLogout={handleLogout}
              onRefresh={syncUserData}
            />
          ) : (
            <TeacherDashboard
              user={user}
              courses={courses}
              submissions={submissions}
              onRefreshData={syncUserData}
            />
          )
        )}

        {view === "admin" && user && (
          <AdminDashboard
            user={user}
            courses={courses}
            onRefreshData={fetchCourses}
          />
        )}

        {view === "classroom" && user && classroomCourse && (
          <LearningInterface
            user={user}
            course={classroomCourse}
            onRefreshData={syncUserData}
            onClose={() => setView(user.role === UserRole.STUDENT ? "student" : "teacher")}
          />
        )}
      </main>

      {/* STRIPE SECURE CHECKOUT PORTAL MODAL SIMULATOR (Step 12) */}
      {showStripeModal && checkoutCourse && (
        <div id="stripe-checkout-modal" className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl border border-slate-100 animate-fade-in relative">
            <button
              type="button"
              onClick={() => { 
                setShowStripeModal(false); 
                setCheckoutCourse(null); 
                setTeleStep("phone");
                setTeleMobile("0979454435");
                setTeleOtp("");
                setBankStep("input");
                setBankAccountNum("1000299517776");
                setBankReference("");
                setSmsToast(null);
              }}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                EduSphere Secure Gateway
              </span>
              <h4 className="font-display font-extrabold text-2xl text-slate-800">Choose Payment Method</h4>
              <p className="text-slate-500 text-sm">Register instantly inside: <span className="font-bold text-slate-700">"{checkoutCourse.title}"</span></p>
            </div>

            {/* Payment method selector tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${paymentMethod === "card" ? "bg-white text-blue-600 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
              >
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("telebirr");
                  setTeleMobile("0979454435");
                }}
                className={`py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${paymentMethod === "telebirr" ? "bg-white text-emerald-600 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
              >
                telebirr
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("bank");
                  setBankAccountNum("1000299517776");
                  if (!bankReference) setBankReference(`TXN-CBE-${Math.floor(100000 + Math.random() * 900000)}`);
                }}
                className={`py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${paymentMethod === "bank" ? "bg-white text-indigo-600 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-800"}`}
              >
                Ethiopia Banks
              </button>
            </div>

            {/* Course Summary pricing cards */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center text-sm font-semibold text-slate-700">
              <span>Syllabus Registration Fee</span>
              <div className="text-right">
                {couponDiscount > 0 && (
                  <span className="text-xs text-slate-400 line-through mr-2">
                    {paymentMethod === "card" ? `$${checkoutCourse.price.toFixed(2)}` : `${Math.round(checkoutCourse.price * 120)} ETB`}
                  </span>
                )}
                <span className={`text-lg font-display font-bold ${paymentMethod === "card" ? "text-blue-600" : paymentMethod === "telebirr" ? "text-emerald-600" : "text-indigo-600"}`}>
                  {paymentMethod === "card" 
                    ? `$${(checkoutCourse.price * (1 - couponDiscount)).toFixed(2)}` 
                    : `${Math.round(checkoutCourse.price * (1 - couponDiscount) * 120)} ETB`
                  }
                </span>
                {paymentMethod !== "card" && (
                  <span className="block text-[10px] text-slate-400 font-mono">Rate: 1 USD ~ 120 ETB</span>
                )}
              </div>
            </div>

            {/* Promo Coupon Module */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500">Apply Promo Coupon (Try: LEARN10)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="LEARN10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-gray-800 bg-white"
                />
                <button
                  type="button"
                  onClick={applyPromoCode}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
              {couponFeedback && (
                <span className={`text-[10px] font-bold block ${couponDiscount > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {couponFeedback}
                </span>
              )}
            </div>

            {/* CONDITIONAL BILLING FIELDS */}
            <form onSubmit={handleCompleteStripeCheckout} className="space-y-4">
              
              {paymentMethod === "card" && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Cardholder Full Name</label>
                    <input
                      type="text"
                      value={stripeCardName}
                      onChange={(e) => setStripeCardName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                      required={paymentMethod === "card"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Card number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={stripeCardNum}
                        onChange={(e) => setStripeCardNum(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                        required={paymentMethod === "card"}
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Expiration</label>
                      <input
                        type="text"
                        value={stripeExpiry}
                        onChange={(e) => setStripeExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                        placeholder="MM/YY"
                        required={paymentMethod === "card"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">CVC Security</label>
                      <input
                        type="text"
                        value={stripeCvc}
                        onChange={(e) => setStripeCvc(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                        placeholder="123"
                        required={paymentMethod === "card"}
                      />
                    </div>
                  </div>

                  <button
                    id="complete-stripe-checkout-btn"
                    type="submit"
                    disabled={checkoutLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-blue-800"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing secure checkout...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Pay ${(checkoutCourse.price * (1 - couponDiscount)).toFixed(2)} & Enroll Now</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {paymentMethod === "telebirr" && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">t</div>
                    <div>
                      <h5 className="text-xs font-bold text-emerald-800">telebirr Mobile Payment</h5>
                      <p className="text-[10px] text-emerald-600 leading-snug">Pay using Ethiopia's premium mobile money network.</p>
                    </div>
                  </div>

                  {teleStep === "phone" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Ethiopian Mobile Number</label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="e.g. 0912345678"
                            value={teleMobile}
                            onChange={(e) => setTeleMobile(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm text-gray-800 font-mono"
                            required={paymentMethod === "telebirr"}
                          />
                          <span className="absolute left-3 top-3 text-xs text-slate-400 font-semibold font-mono">🇪🇹</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">Supports formats: 09xxxxxxxx, 07xxxxxxxx, or +251xxxxxxxxx</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendTelebirrOtp}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Send telebirr OTP Verification Code</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                        <p className="text-xs text-slate-600">Simulated verification SMS code dispatched to <span className="font-bold text-slate-800">{teleMobile}</span></p>
                        {teleCountdown > 0 ? (
                          <span className="text-[10px] text-slate-400 block font-mono">Resend available in {teleCountdown}s</span>
                        ) : (
                          <button type="button" onClick={handleSendTelebirrOtp} className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer">Resend SMS Code</button>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Enter 4-Digit OTP Code</label>
                        <input
                          type="text"
                          placeholder="XXXX"
                          maxLength={6}
                          value={teleOtp}
                          onChange={(e) => setTeleOtp(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-center text-lg tracking-widest font-bold text-slate-800 font-mono"
                          required={paymentMethod === "telebirr"}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setTeleStep("phone")}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={checkoutLoading}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {checkoutLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Enrolling...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-300" />
                              <span>Authorize telebirr Payment</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-2.5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">🏦</div>
                    <div>
                      <h5 className="text-xs font-bold text-indigo-800">Ethiopian Bank Transfer</h5>
                      <p className="text-[10px] text-indigo-600 leading-snug">Simulate mobile banking transfer and automated receipt audit.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Select Bank Provider</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => {
                          setSelectedBank(e.target.value);
                          const randomRef = `TXN-${e.target.value.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
                          setBankReference(randomRef);
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800 bg-white"
                        required={paymentMethod === "bank"}
                      >
                        <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                        <option value="Awash">Awash International Bank</option>
                        <option value="Dashen">Dashen Bank / Amole</option>
                        <option value="Abyssinia">Bank of Abyssinia (BoA)</option>
                        <option value="Coop">Cooperative Bank of Oromia</option>
                        <option value="Nib">Nib International Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Bank Account Number / Wallet ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 1000123456789"
                        value={bankAccountNum}
                        onChange={(e) => setBankAccountNum(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs text-gray-800 font-mono"
                        required={paymentMethod === "bank"}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <label className="block text-xs font-semibold text-slate-500">Transaction Reference Code</label>
                        <button
                          type="button"
                          onClick={() => {
                            const ref = `TXN-${selectedBank.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
                            setBankReference(ref);
                          }}
                          className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                        >
                          Generate New
                        </button>
                      </div>
                      <input
                        type="text"
                        value={bankReference}
                        onChange={(e) => setBankReference(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs text-gray-800 font-mono"
                        required={paymentMethod === "bank"}
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">A transaction ref has been pre-simulated for the demo. Click verify to audit instantly.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer pt-2 mt-4"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Transfer Receipt...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-300" />
                          <span>Verify Transfer & Enroll</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* VERIFIABLE CLASSIC DIGITAL CERTIFICATE PDF VIEWER (Step 10) */}
      {showCertModal && activeCertificate && (
        <div id="certificate-print-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 md:p-12 space-y-8 shadow-2xl relative border border-slate-100 animate-fade-in my-8">
            <button
              onClick={() => { setShowCertModal(false); setActiveCertificate(null); }}
              className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print trigger */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:hidden">
              <div className="space-y-1">
                <h4 className="font-display font-bold text-slate-800 text-lg">Official Certificate Viewer</h4>
                <p className="text-slate-500 text-xs">Verify credentials online using the cryptographic SHA reference signature below.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate Document</span>
              </button>
            </div>

            {/* High Fidelity Certificate canvas container */}
            <div className="p-8 md:p-12 border-8 border-amber-500/30 rounded-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/20 via-white to-white text-center space-y-8 relative overflow-hidden font-serif">
              {/* watermark stamps */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none">
                <Award className="w-96 h-96 text-amber-500" />
              </div>

              <div className="space-y-2 relative z-10">
                <div className="text-amber-600 uppercase tracking-widest text-xs font-bold font-sans">Certificate of Completion</div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 italic leading-snug">New-Tech Scholar Award</h2>
                <div className="w-40 h-0.5 bg-amber-500/50 mx-auto my-4"></div>
              </div>

              <div className="space-y-4 text-slate-600 relative z-10 font-sans">
                <p className="text-sm">This official learning credential is proudly awarded to:</p>
                <h3 className="text-2xl md:text-4xl font-bold font-serif text-slate-900 italic tracking-wide">{activeCertificate.studentName}</h3>
                <p className="text-xs max-w-xl mx-auto leading-relaxed">
                  For outstanding academic performance and successfully achieving 100% course progression standards inside the curriculum of:
                </p>
                <h4 className="text-lg md:text-xl font-bold font-serif text-blue-900 italic">"{activeCertificate.courseName}"</h4>
                <p className="text-xs">Under professional academic direction of Instructor <span className="font-bold">{activeCertificate.instructorName}</span></p>
              </div>

              {/* Stamp and signature columns */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 text-slate-500 text-xs font-sans relative z-10">
                <div className="space-y-1 text-center">
                  <div className="font-semibold text-slate-700 italic">Director Board</div>
                  <div className="w-32 h-px bg-slate-200 mx-auto my-1.5"></div>
                  <div className="text-[10px] text-slate-400">New-Tech Academy Director</div>
                </div>
                <div className="space-y-1 text-center flex flex-col justify-end items-center">
                  <div className="flex items-center gap-1 text-amber-600 font-bold uppercase text-[10px] tracking-wider mb-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Verifiable Credential</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Date Issued: {activeCertificate.completionDate}</div>
                </div>
              </div>

              {/* verification SHA code */}
              <div className="pt-6 font-mono text-[9px] text-slate-400 border-t border-dashed border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>Unique ID: {activeCertificate.id}</span>
                <span>Cryptographic verification reference: {activeCertificate.verificationCode}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic educational statistics footer */}
      <footer className="bg-slate-900 text-white py-4 px-6 text-center text-xs border-t border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-400">
          <span>&copy; 2026 New-Tech school of world. All rights reserved.</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure TLS Encrypted & SSL Certified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
