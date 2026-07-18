import React, { useState, useEffect } from "react";
import { 
  Mail, Inbox, Star, Send, FileText, Trash2, Search, AlertCircle, 
  Plus, CornerUpLeft, Paperclip, ChevronRight, Download, User, 
  Clock, ArrowLeft, RefreshCw, CheckCircle, Eye, EyeOff
} from "lucide-react";
import { EmailMessage, EmailAttachment } from "../types";

interface EmailClientProps {
  user: { id: string; name: string; email: string; role: string };
  onRefreshData?: () => void;
}

export default function EmailClient({ user, onRefreshData }: EmailClientProps) {
  // Navigation folders
  type Folder = "inbox" | "starred" | "sent" | "drafts" | "trash";
  const [activeFolder, setActiveFolder] = useState<Folder>("inbox");
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [directory, setDirectory] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<EmailAttachment[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  
  // Feedback states
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    fetchEmails();
    fetchDirectory();
  }, [user.email]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emails/${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (res.ok) {
        setEmails(data);
      }
    } catch (err) {
      console.error("Error loading secure emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectory = async () => {
    try {
      const res = await fetch("/api/emails/contacts/directory");
      const data = await res.json();
      if (res.ok) {
        setDirectory(data);
      }
    } catch (err) {
      console.error("Error loading school directory:", err);
    }
  };

  const handleStarToggle = async (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/emails/${emailId}/star`, { method: "PUT" });
      if (res.ok) {
        // Update local state
        setEmails(prev => prev.map(email => 
          email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
        ));
        if (selectedEmail && selectedEmail.id === emailId) {
          setSelectedEmail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
        }
      }
    } catch (err) {
      console.error("Error toggling star:", err);
    }
  };

  const handleMarkAsRead = async (emailId: string, isRead: boolean) => {
    try {
      const res = await fetch(`/api/emails/${emailId}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead })
      });
      if (res.ok) {
        setEmails(prev => prev.map(email => 
          email.id === emailId ? { ...email, isRead } : email
        ));
        if (selectedEmail && selectedEmail.id === emailId) {
          setSelectedEmail(prev => prev ? { ...prev, isRead } : null);
        }
        if (onRefreshData) onRefreshData(); // refresh parent notifications if needed
      }
    } catch (err) {
      console.error("Error toggling read status:", err);
    }
  };

  const handleDeleteEmail = async (emailId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const targetEmail = emails.find(em => em.id === emailId);
    const isAlreadyTrash = targetEmail?.isTrash;
    
    if (isAlreadyTrash && !confirm("Permanently delete this email? This action is irreversible.")) {
      return;
    }

    try {
      const url = `/api/emails/${emailId}${isAlreadyTrash ? "?permanent=true" : ""}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setEmails(prev => prev.filter(em => em.id !== emailId));
        if (selectedEmail && selectedEmail.id === emailId) {
          setSelectedEmail(null);
        }
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Error deleting email:", err);
    }
  };

  const handleSelectEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead && email.receiverEmail.toLowerCase().trim() === user.email.toLowerCase().trim()) {
      handleMarkAsRead(email.id, true);
    }
  };

  const handleSendEmail = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!toEmail || !subject || !body) {
      setSendError("Recipient email, subject, and body content are required.");
      return;
    }

    setSendingEmail(true);
    setSendError("");
    setSendSuccess(false);

    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderEmail: user.email,
          senderName: user.name,
          receiverEmail: toEmail.trim(),
          subject: subject.trim(),
          body: body,
          attachments: composeAttachments,
          isDraft: isDraft
        })
      });

      if (res.ok) {
        setSendSuccess(true);
        setToEmail("");
        setSubject("");
        setBody("");
        setComposeAttachments([]);
        setIsComposing(false);
        fetchEmails();
        
        setTimeout(() => {
          setSendSuccess(false);
        }, 3000);
      } else {
        const errData = await res.json();
        setSendError(errData.error || "Failed to transmit message. Make sure the recipient email is correct.");
      }
    } catch (err) {
      console.error("Send mail error:", err);
      setSendError("An internal network failure blocked this email dispatch.");
    } finally {
      setSendingEmail(false);
    }
  };

  const addAttachment = () => {
    if (!newAttachmentName || !newAttachmentUrl) return;
    const sizeStr = `${Math.floor(Math.random() * 800) + 50} KB`;
    setComposeAttachments(prev => [
      ...prev,
      { name: newAttachmentName.trim(), url: newAttachmentUrl.trim(), size: sizeStr }
    ]);
    setNewAttachmentName("");
    setNewAttachmentUrl("");
    setShowAddAttachment(false);
  };

  const removeComposeAttachment = (index: number) => {
    setComposeAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReply = (email: EmailMessage) => {
    setToEmail(email.senderEmail);
    setSubject(email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`);
    setBody(`\n\n--- On ${new Date(email.timestamp).toLocaleString()}, ${email.senderName} wrote:\n> ${email.body.split("\n").join("\n> ")}`);
    setIsComposing(true);
    setSelectedEmail(null);
  };

  // Filter logic based on folders & search
  const getFilteredEmails = () => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = emails;

    // First filter by folder
    if (activeFolder === "inbox") {
      filtered = emails.filter(e => 
        e.receiverEmail.toLowerCase().trim() === user.email.toLowerCase().trim() && 
        !e.isTrash && 
        !e.isDraft
      );
    } else if (activeFolder === "starred") {
      filtered = emails.filter(e => e.isStarred && !e.isTrash);
    } else if (activeFolder === "sent") {
      filtered = emails.filter(e => 
        e.senderEmail.toLowerCase().trim() === user.email.toLowerCase().trim() && 
        !e.isTrash && 
        !e.isDraft
      );
    } else if (activeFolder === "drafts") {
      filtered = emails.filter(e => e.isDraft && !e.isTrash);
    } else if (activeFolder === "trash") {
      filtered = emails.filter(e => e.isTrash);
    }

    // Search query match
    if (query) {
      filtered = filtered.filter(e => 
        e.subject.toLowerCase().includes(query) ||
        e.body.toLowerCase().includes(query) ||
        e.senderName.toLowerCase().includes(query) ||
        e.senderEmail.toLowerCase().includes(query) ||
        e.receiverName.toLowerCase().includes(query) ||
        e.receiverEmail.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredList = getFilteredEmails();
  const unreadCount = emails.filter(e => 
    e.receiverEmail.toLowerCase().trim() === user.email.toLowerCase().trim() && 
    !e.isRead && 
    !e.isTrash && 
    !e.isDraft
  ).length;

  return (
    <div id="email-client-container" className="bg-slate-50 min-h-[580px] rounded-3xl border border-slate-150 overflow-hidden flex flex-col md:flex-row shadow-sm animate-fade-in font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <div className="w-full md:w-60 bg-slate-900 text-slate-300 p-5 shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div className="space-y-6">
          
          {/* Header block with email credentials */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
                📧
              </div>
              <div>
                <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">Secure Mail</h4>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">{user.email}</div>
              </div>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl text-[10px] text-slate-400 flex items-center gap-1.5 border border-slate-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Workspace Port: Active &amp; Secured</span>
            </div>
          </div>

          {/* Action trigger: Compose */}
          <button
            type="button"
            onClick={() => {
              setIsComposing(true);
              setSelectedEmail(null);
            }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compose Email</span>
          </button>

          {/* Folders navigation list */}
          <div className="space-y-1">
            {[
              { id: "inbox", label: "Inbox Queue", icon: Inbox, count: unreadCount, badgeColor: "bg-blue-500 text-white" },
              { id: "starred", label: "Starred Messages", icon: Star },
              { id: "sent", label: "Sent Archives", icon: Send },
              { id: "drafts", label: "Draft Notebooks", icon: FileText },
              { id: "trash", label: "Trash Bin", icon: Trash2 }
            ].map(folder => {
              const IconComp = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolder(folder.id as Folder);
                    setSelectedEmail(null);
                    setIsComposing(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${isActive ? "bg-slate-800 text-white font-bold border border-slate-700" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{folder.label}</span>
                  </div>
                  {folder.count !== undefined && folder.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${folder.badgeColor}`}>
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory helper list */}
        <div className="pt-6 border-t border-slate-800 mt-6 hidden md:block">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Quick Address Directory</div>
          <div className="max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin">
            {directory.map(contact => (
              <button
                key={contact.id}
                type="button"
                onClick={() => {
                  setToEmail(contact.email);
                  setIsComposing(true);
                  setSelectedEmail(null);
                }}
                className="w-full text-left hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-slate-400 hover:text-white"
              >
                <div className="w-5 h-5 rounded bg-slate-800 text-[9px] font-black flex items-center justify-center uppercase">
                  {contact.name.charAt(0)}
                </div>
                <div className="truncate min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-slate-300 truncate">{contact.name}</div>
                  <div className="text-[8px] text-slate-500 truncate font-mono">{contact.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE LISTING & VIEW PANES WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 md:flex-row">
        
        {/* A. EMAILS LIST VIEW */}
        {(!selectedEmail && !isComposing) ? (
          <div className="w-full flex flex-col min-w-0 h-[580px] bg-white">
            
            {/* List Header Search area */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search secure emails by subject, keyword, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
              </div>
              
              <button
                type="button"
                onClick={fetchEmails}
                className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-all border border-slate-200 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Synchronize mail servers"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Emails listing stack */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-16 text-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">Synchronizing with system secure mail channels...</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <Mail className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-sm font-semibold">No emails found in this category.</p>
                  <p className="text-slate-400 text-xs">Verify your active correspondence or click Compose to initiate a secure thread.</p>
                </div>
              ) : (
                filteredList.map(email => {
                  const isSentByMe = email.senderEmail.toLowerCase().trim() === user.email.toLowerCase().trim();
                  const showUnread = !email.isRead && !isSentByMe;
                  
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`p-4.5 transition-all hover:bg-slate-50/75 flex items-start gap-4 cursor-pointer relative ${showUnread ? "bg-blue-50/15 font-semibold" : ""}`}
                    >
                      {/* Leftside border indicator for unread */}
                      {showUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                      )}

                      {/* Sender / Receiver Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                        {(isSentByMe ? email.receiverName : email.senderName).charAt(0).toUpperCase()}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h5 className={`text-xs text-slate-800 truncate max-w-[150px] ${showUnread ? "font-black" : "font-semibold"}`}>
                            {isSentByMe ? `To: ${email.receiverName}` : email.senderName}
                          </h5>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(email.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <div className={`text-xs text-slate-950 truncate ${showUnread ? "font-bold" : ""}`}>
                            {email.subject}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                            {email.body}
                          </p>
                        </div>

                        {/* Badges indicator (star, attachment, drafts) */}
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleStarToggle(email.id, e)}
                            className="text-slate-300 hover:text-amber-400 transition-colors"
                          >
                            <Star className={`w-3.5 h-3.5 ${email.isStarred ? "text-amber-400 fill-amber-400" : ""}`} />
                          </button>

                          {email.attachments && email.attachments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.2 rounded-full border border-slate-200">
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>{email.attachments.length} files</span>
                            </span>
                          )}

                          {email.isDraft && (
                            <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 rounded-full font-extrabold uppercase">
                              Draft
                            </span>
                          )}

                          {email.receiverEmail.toLowerCase().trim() === "copilot@newtech.edu" && (
                            <span className="text-[8px] bg-purple-100 text-purple-800 border border-purple-200 px-1.5 rounded-full font-extrabold uppercase tracking-wide">
                              🤖 AI Copilot
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete actions trigger */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEmail(email.id, e)}
                        className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors shrink-0 self-center cursor-pointer"
                        title="Move to trash folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : selectedEmail ? (
          <div className="w-full flex flex-col min-w-0 h-[580px] bg-white animate-fade-in">
            {/* B. READING EMAIL CORRESPONDENCE PANE */}
            {/* Toolbar back action */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Inbox List</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleStarToggle(selectedEmail.id, e)}
                  className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors cursor-pointer"
                  title="Star email"
                >
                  <Star className={`w-3.5 h-3.5 ${selectedEmail.isStarred ? "text-amber-500 fill-amber-500" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleReply(selectedEmail)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEmail(selectedEmail.id)}
                  className="p-2 border border-red-100 hover:bg-red-50 text-red-500 rounded-xl transition-colors cursor-pointer"
                  title="Move to Trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Email headers detailed block */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-display font-black text-slate-900 text-lg leading-snug">
                  {selectedEmail.subject}
                </h3>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {selectedEmail.senderName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800">{selectedEmail.senderName}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        From: <span className="text-slate-600">{selectedEmail.senderEmail}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        To: <span className="text-slate-600">{selectedEmail.receiverEmail} ({selectedEmail.receiverName})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-100 self-end sm:self-auto">
                    📅 {new Date(selectedEmail.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Email Content Body formatted cleanly */}
              <div className="p-2.5 rounded-xl border-l-2 border-slate-200">
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                  {selectedEmail.body}
                </p>
              </div>

              {/* Attachments Section if they exist */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block">📄 Secured Email Attachments ({selectedEmail.attachments.length})</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEmail.attachments.map((file, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="truncate min-w-0">
                            <div className="font-bold text-slate-700 truncate">{file.name}</div>
                            {file.size && <div className="text-[9px] text-slate-400 font-mono">{file.size}</div>}
                          </div>
                        </div>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-1.5 hover:bg-slate-200 text-blue-600 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Open attached resource URL securely"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isComposing ? (
          <form onSubmit={(e) => handleSendEmail(e, false)} className="w-full flex flex-col min-w-0 h-[580px] bg-white animate-fade-in">
            {/* C. COMPOSE NEW EMAIL CORRESPONDENCE PANE */}
            {/* Header toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Discard Compose</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSendEmail(e, true)}
                  disabled={sendingEmail}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Mail</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compose Workspace fields */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {sendError && (
                <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{sendError}</span>
                </div>
              )}

              {/* Recipient email search selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">To (Secure System Recipient Address):</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah.jenkins@edu.com or copilot@newtech.edu"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-800"
                  />
                  
                  {/* Select addresses Quick Suggestions trigger */}
                  <div className="absolute right-2 top-1.5 flex gap-1">
                    {[
                      { label: "AI Copilot", value: "copilot@newtech.edu" },
                      { label: "Admin Office", value: "admin@edu.com" }
                    ].map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setToEmail(sug.value)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-[9px] font-bold text-slate-600 hover:text-blue-600 rounded transition-colors"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject:</label>
                <input
                  type="text"
                  required
                  placeholder="Enter the primary theme or inquiry of this message..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-800 font-bold"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Secure Message Body:</label>
                <textarea
                  required
                  placeholder="Compose your structured message, queries, homework submission remarks, or compliance reports..."
                  rows={9}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-800 font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Attachment simulator section */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">📄 Attach Syllabus or Curriculum Assets</span>
                  <button
                    type="button"
                    onClick={() => setShowAddAttachment(!showAddAttachment)}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddAttachment ? "Close Attachment Panel" : "Attach File URL"}</span>
                  </button>
                </div>

                {showAddAttachment && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3 mt-2 animate-fade-in text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">File Display Name:</label>
                        <input
                          type="text"
                          placeholder="e.g. My_Project_Revision_1.pdf"
                          value={newAttachmentName}
                          onChange={(e) => setNewAttachmentName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Resource URL (Local or Google Drive Link):</label>
                        <input
                          type="text"
                          placeholder="https://drive.google.com/..."
                          value={newAttachmentUrl}
                          onChange={(e) => setNewAttachmentUrl(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addAttachment}
                        disabled={!newAttachmentName || !newAttachmentUrl}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                      >
                        Confirm File Attachment
                      </button>
                    </div>
                  </div>
                )}

                {/* Listing added attachments */}
                {composeAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {composeAttachments.map((file, index) => (
                      <span key={index} className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-150 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                        <Paperclip className="w-2.5 h-2.5 shrink-0" />
                        <span className="max-w-[150px] truncate">{file.name} ({file.size})</span>
                        <button
                          type="button"
                          onClick={() => removeComposeAttachment(index)}
                          className="text-red-500 hover:text-red-700 font-extrabold text-xs pl-1 shrink-0"
                          title="Remove attachment"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
