import React, { useState } from "react";
import { Clock, RefreshCw, LogOut, CheckCircle, Phone, Award, ShieldAlert, Send, FileText, Sparkles, MessageSquare } from "lucide-react";
import { User } from "../types";

interface PendingApprovalViewProps {
  user: User;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
}

export default function PendingApprovalView({ user, onLogout, onRefresh }: PendingApprovalViewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form states for profile editing
  const [phone, setPhone] = useState(user.phone || "");
  const [expertise, setExpertise] = useState(user.expertise || "");
  const [cvUrl, setCvUrl] = useState(user.cvUrl || "");
  const [fastTrackMessage, setFastTrackMessage] = useState(user.fastTrackMessage || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Chat/Bot state
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: "user" | "bot"; text: string }>>([
    {
      id: "welcome",
      sender: "bot",
      text: `Hello ${user.name}! I am the New-Tech school platform AI coordinator. Your profile is currently awaiting validation. Is there anything I can help clarify?`
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);

  const handleManualCheck = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          expertise: user.role === "teacher" ? expertise : undefined,
          cvUrl: user.role === "teacher" ? cvUrl : undefined,
          fastTrackMessage
        })
      });
      if (response.ok) {
        setSaveSuccess(true);
        setEditMode(false);
        await onRefresh();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = { id: `msg-${Date.now()}`, sender: "user" as const, text: userInput };
    setChatMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setBotTyping(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonContent: `You are the New-Tech School Platform Registration Support Assistant AI. The current user is ${user.name}, who is a newly registered ${user.role}. Their account status is currently: ${user.status || "pending"}. Their specialty/expertise is "${user.expertise || "N/A"}". Help guide them with FAQs. Tell them how admin approvals work (Admins verify teacher CVs and ensure student tuition payments or details are valid). Encourage them to write a clear message in the 'Interactive Message to Admin' section. Keep answers polite, warm, supportive, and informative.`,
          lessonTitle: "Verification Assistant",
          userMessage: userInput,
          history: chatMessages.slice(-5).map(m => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text
          }))
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { id: `msg-bot-${Date.now()}`, sender: "bot", text: data.text }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: `msg-err-${Date.now()}`,
        sender: "bot",
        text: "I am having trouble connecting with the main database. Verification usually takes less than 24 hours. Feel free to refresh the portal to check status."
      }]);
    } finally {
      setBotTyping(false);
    }
  };

  const isRejected = user.status === "rejected";

  return (
    <div id="pending-approval-view" className="max-w-5xl mx-auto space-y-8 animate-fade-in my-4">
      {/* Top Banner Alert */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm ${isRejected ? "bg-red-50/75 border-red-200" : "bg-amber-50/75 border-amber-200 animate-pulse-slow"}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${isRejected ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
            {isRejected ? <ShieldAlert className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h3 className={`font-display font-black text-lg ${isRejected ? "text-red-950" : "text-amber-950"}`}>
              {isRejected ? "Platform Registration Clearance Denied" : "LMS Workspace Awaiting Director Approval"}
            </h3>
            <p className={`text-xs max-w-xl leading-relaxed ${isRejected ? "text-red-800" : "text-amber-800"}`}>
              {isRejected 
                ? "Your academic profile did not meet New-Tech school eligibility guidelines. Please update your registered CV details, leave a fast-track note, or contact the helpline below to initiate a re-evaluation."
                : "Welcome aboard! Newly registered student and instructor profiles start in a restricted security tier. An institutional director is currently reviewing your registration parameters for platform clearance."
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isRefreshing}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${isRejected ? "bg-red-600 hover:bg-red-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Querying..." : "Sync Verification Status"}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Sign out of restricted session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Verification Progress and Profile Editor */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Interactive Progress Tracker Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <h4 className="font-display font-bold text-slate-800 text-base">Clearance Lifecycle Progress</h4>
            
            <div className="relative pl-6 border-l border-slate-150 space-y-6">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-xs"></div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Step 1: Secure Account Registration <span className="text-[10px] text-emerald-600 font-extrabold font-mono bg-emerald-50 px-1.5 py-0.2 rounded">Done</span>
                  </span>
                  <p className="text-[11px] text-slate-400">Database entry compiled under email identity {user.email}.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center shadow-xs ${isRejected ? "bg-red-500" : "bg-emerald-500"}`}></div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Step 2: Verification Note &amp; Roster Verification 
                    {isRejected ? (
                      <span className="text-[10px] text-red-600 font-extrabold font-mono bg-red-50 px-1.5 py-0.2 rounded">Failed</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-extrabold font-mono bg-emerald-50 px-1.5 py-0.2 rounded">Verified</span>
                    )}
                  </span>
                  <p className="text-[11px] text-slate-400">Reviewing registered {user.role === "teacher" ? "CV assets and credentials" : "enrollment eligibility"}.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center shadow-xs ${isRejected ? "bg-red-500" : "bg-amber-400 animate-pulse"}`}></div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">Step 3: Director General Clearance Grant</span>
                  <p className="text-[11px] text-slate-400">
                    {isRejected 
                      ? "Clearance denied. Please review comments or resubmit information." 
                      : "Awaiting final administrative signoff to launch portal workspaces."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Profile details and live editing */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-slate-800 text-base">Your Registered Roster Profile</h4>
                <p className="text-[11px] text-slate-400">Review and update submitted credentials instantly to notify directors.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditMode(!editMode)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {editMode ? "Cancel Editing" : "Modify Credentials"}
              </button>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-xs font-semibold">
                ✓ Credentials updated successfully! The verification board has been notified.
              </div>
            )}

            {!editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Identity Name</span>
                  <p className="font-bold text-slate-700">{user.name}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Active Email</span>
                  <p className="font-bold text-slate-700">{user.email}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Phone Identifier</span>
                  <p className="font-bold text-slate-700">{phone || "No phone registered"}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Platform Role tier</span>
                  <p className="font-black text-blue-600 uppercase tracking-wider">{user.role}</p>
                </div>

                {user.role === "teacher" && (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100 md:col-span-2">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Instructional Expertise</span>
                      <p className="font-semibold text-slate-700">{expertise || "Not specified"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100 md:col-span-2">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Curriculum Vitae (CV) Asset</span>
                      <p className="font-medium text-slate-600 truncate">
                        {cvUrl ? (
                          <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
                            {cvUrl}
                          </a>
                        ) : (
                          "No CV registered"
                        )}
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100 md:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Fast-Track Review Request Note</span>
                  <p className="text-slate-600 italic">
                    {fastTrackMessage ? `"${fastTrackMessage}"` : "No special notes provided to admin."}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 012-3456"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {user.role === "teacher" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Expertise Specialty</label>
                        <input
                          type="text"
                          value={expertise}
                          onChange={(e) => setExpertise(e.target.value)}
                          placeholder="e.g. Data Science, Web"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">CV File Link</label>
                        <input
                          type="text"
                          value={cvUrl}
                          onChange={(e) => setCvUrl(e.target.value)}
                          placeholder="https://example.com/my-cv.pdf"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Interactive Fast-Track Message to Admin</label>
                    <textarea
                      value={fastTrackMessage}
                      onChange={(e) => setFastTrackMessage(e.target.value)}
                      placeholder="Briefly state why you need urgent platform clearance..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-slate-50 text-slate-500 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    {loading ? "Saving changes..." : "Save & Notify Admin"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Chat with AI Verification Assistant */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-[520px]">
            {/* Header */}
            <div className="bg-slate-900 p-4.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md">
                  🤖
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs">AI Verification Assistant</h4>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[9px] text-slate-400 font-medium">LMS Support Online</span>
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-xs ${msg.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-slate-100 text-slate-700 rounded-bl-none"}`}>
                    <p className="font-medium whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {botTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl text-slate-400 text-xs flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Helpline quick triggers */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white shrink-0 flex flex-wrap gap-1.5">
              {[
                "How long does approval take?",
                "What CV do you require?",
                "How to expedite verification?"
              ].map((faq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUserInput(faq);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-[10px] font-semibold text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                >
                  {faq}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Ask registration helper..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={botTyping || !userInput.trim()}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Helpline Contact details Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
        <div className="space-y-1">
          <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">☎ Institution Hotline Help Desk</span>
          <p className="font-semibold text-slate-500">+1 (555) 011-8899</p>
          <p className="text-[10px] text-slate-400">Available Monday - Friday, 8:00 AM - 5:00 PM UTC.</p>
        </div>
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">✉ Verification Board Support Email</span>
          <p className="font-semibold text-slate-500">verification@newtech.edu</p>
          <p className="text-[10px] text-slate-400">Standard response turnaround is under 12 hours.</p>
        </div>
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">📍 Institutional Location Roster</span>
          <p className="font-semibold text-slate-500">Directorate Block, New-Tech Campus</p>
          <p className="text-[10px] text-slate-400">In-person credentials verification office, Suite 402B.</p>
        </div>
      </div>
    </div>
  );
}
