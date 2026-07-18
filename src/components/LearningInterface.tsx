/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, FastForward, Maximize2, FileText, CheckSquare, BrainCircuit, Sparkles, Send, Loader2, MessageSquare, Clock, Plus, HelpCircle, Check, X, Timer, CheckCircle } from "lucide-react";
import { Course, Lesson, Quiz, Question } from "../types";

interface LearningInterfaceProps {
  user: any;
  course: Course;
  onRefreshData: () => void;
  onClose: () => void;
}

export default function LearningInterface({ user, course, onRefreshData, onClose }: LearningInterfaceProps) {
  const [syllabus, setSyllabus] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"video" | "quiz" | "assignment" | "chat">("video");

  // Video Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);

  // Notes state
  const [studentNotes, setStudentNotes] = useState<{ id: string; timestamp: string; text: string }[]>([]);
  const [newNoteText, setNewNoteText] = useState("");

  // AI Tutor chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);

  // Quiz Engine state
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [quizTimer, setQuizTimer] = useState(600); // 10 minutes
  const [isQuizTimerRunning, setIsQuizTimerRunning] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Assignment submissions state
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [workUrl, setWorkUrl] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Group Discussion Chat Room state
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [groupInput, setGroupInput] = useState("");
  const [groupMsgLoading, setGroupMsgLoading] = useState(false);

  useEffect(() => {
    loadCourseSyllabus();
    loadQuizzes();
    loadAssignments();
    loadEnrollmentsAndCompleted();
    loadGroupChat();
  }, [course]);

  // Quiz timer count-down hook
  useEffect(() => {
    let interval: any = null;
    if (isQuizTimerRunning && quizTimer > 0) {
      interval = setInterval(() => {
        setQuizTimer(prev => prev - 1);
      }, 1000);
    } else if (quizTimer === 0 && isQuizTimerRunning) {
      handleQuizSubmission();
    }
    return () => clearInterval(interval);
  }, [isQuizTimerRunning, quizTimer]);

  const loadCourseSyllabus = async () => {
    try {
      const response = await fetch(`/api/courses/${course.id}/structure`);
      const data = await response.json();
      if (response.ok && data.modules.length > 0) {
        setSyllabus(data);
        // Default to first lesson if none selected
        if (data.modules[0].lessons.length > 0) {
          setSelectedLesson(data.modules[0].lessons[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadQuizzes = async () => {
    try {
      const response = await fetch(`/api/courses/${course.id}/quizzes`);
      const data = await response.json();
      if (response.ok) {
        setCourseQuizzes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch(`/api/courses/${course.id}/assignments`);
      const data = await response.json();
      if (response.ok) {
        setCourseAssignments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadEnrollmentsAndCompleted = async () => {
    try {
      const response = await fetch(`/api/students/${user.id}/enrollments`);
      const data = await response.json();
      if (response.ok) {
        const activeEnr = data.find((e: any) => e.courseId === course.id);
        if (activeEnr) {
          setCompletedLessonIds(activeEnr.completedLessons || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroupChat = async () => {
    try {
      const response = await fetch(`/api/messages/${course.id}`);
      const data = await response.json();
      if (response.ok) {
        setGroupMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Video playback mechanics
  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleSpeedChange = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen?.();
    }
  };

  // Add notes linked to video timestamps
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const timestampStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    setStudentNotes([
      ...studentNotes,
      {
        id: `note-${Date.now()}`,
        timestamp: timestampStr,
        text: newNoteText
      }
    ]);
    setNewNoteText("");
  };

  // Mark lesson finished & auto trigger certificate checks
  const handleCompleteLesson = async () => {
    if (!selectedLesson) return;
    try {
      const response = await fetch(`/api/lessons/${selectedLesson.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: user.id, courseId: course.id })
      });
      const data = await response.json();
      if (response.ok) {
        // Update list
        setCompletedLessonIds(data.enrollment.completedLessons || []);
        onRefreshData();
        if (data.certificate) {
          alert(`🎉 Outstanding achievement! You've achieved 100% course progression! Your digital certificate [${data.certificate.verificationCode}] has been generated.`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Tutor chat conversation with Gemini
  const handleSendAITutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    
    const nextMsgs = [...chatMessages, { role: "user" as const, text: userMsg }];
    setChatMessages(nextMsgs);
    setAiChatLoading(true);

    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: selectedLesson?.title || course.title,
          lessonContent: selectedLesson?.content || course.description,
          userMessage: userMsg,
          history: chatMessages
        })
      });

      const data = await response.json();
      if (response.ok) {
        setChatMessages([...nextMsgs, { role: "model", text: data.text }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setChatMessages([...nextMsgs, { role: "model", text: "AI Tutor connection error. Please make sure your Gemini API credentials are set." }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  // Take Quiz mechanics
  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setQuizResults(null);
    setQuizTimer(600);
    setIsQuizTimerRunning(true);
    setActiveWorkspaceTab("quiz");
  };

  const handleQuizAnswerSelect = (questionId: string, answer: string) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answer
    });
  };

  const handleQuizSubmission = async () => {
    if (!activeQuiz) return;
    setIsQuizTimerRunning(false);
    setQuizSubmitting(true);

    try {
      const response = await fetch(`/api/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: quizAnswers,
          studentId: user.id,
          studentName: user.name,
          courseId: course.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        setQuizResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Submit assignments
  const handleSubmitAssignment = async (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    if (!workUrl.trim()) return;
    setSubmitLoading(true);
    setSubmitSuccess(false);

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          workUrl: workUrl.trim(),
          courseId: course.id
        })
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setWorkUrl("");
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Study Group Messenger
  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupInput.trim()) return;

    const text = groupInput.trim();
    setGroupInput("");
    setGroupMsgLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          senderName: user.name,
          courseId: course.id,
          text
        })
      });

      if (response.ok) {
        loadGroupChat();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGroupMsgLoading(false);
    }
  };

  return (
    <div id="learning-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in relative min-h-[85vh]">
      
      {/* LEFT COLUMN: syllabus structural navigation sidebar (3 cols) */}
      <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-5 flex flex-col space-y-6 h-[80vh] overflow-y-auto">
        <div className="border-b border-slate-100 pb-3">
          <button onClick={onClose} className="text-xs font-bold text-blue-600 hover:underline flex items-center mb-1 cursor-pointer">
            &larr; Exit to Dashboard
          </button>
          <h4 className="font-display font-bold text-slate-800 text-base leading-tight line-clamp-2">{course.title}</h4>
        </div>

        {/* Modules Accordion Syllabus */}
        {syllabus ? (
          <div className="space-y-4">
            {syllabus.modules.map((mod: any) => (
              <div key={mod.id} className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{mod.title}</div>
                <div className="space-y-1">
                  {mod.lessons.map((les: Lesson) => {
                    const isCompleted = completedLessonIds.includes(les.id);
                    const isCurrent = selectedLesson?.id === les.id;
                    return (
                      <button
                        key={les.id}
                        onClick={() => { setSelectedLesson(les); setActiveWorkspaceTab("video"); }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${isCurrent ? "bg-blue-50 text-blue-800 border border-blue-100" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        <span className="line-clamp-1">{les.title}</span>
                        {isCompleted && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-xs italic">Loading Course Syllabus...</p>
        )}

        {/* Exams & practice test links list */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam & Assessments</div>
          {courseQuizzes.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No quizzes deployed yet.</p>
          ) : (
            courseQuizzes.map(quiz => (
              <button
                key={quiz.id}
                onClick={() => handleStartQuiz(quiz)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border border-dashed transition-all cursor-pointer ${activeQuiz?.id === quiz.id && activeWorkspaceTab === "quiz" ? "bg-amber-50 text-amber-900 border-amber-300" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <span className="line-clamp-1">{quiz.title}</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Assignments list */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignments Due</div>
          {courseAssignments.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No assignments.</p>
          ) : (
            courseAssignments.map(asg => (
              <button
                key={asg.id}
                onClick={() => setActiveWorkspaceTab("assignment")}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border transition-all cursor-pointer ${activeWorkspaceTab === "assignment" ? "bg-indigo-50 text-indigo-900 border-indigo-200" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <span className="line-clamp-1">{asg.title}</span>
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* CENTER COLUMN: active workspace player or exam dashboard (6 cols) */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Workspace Tab Switcher */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 w-fit">
          <button
            onClick={() => setActiveWorkspaceTab("video")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${activeWorkspaceTab === "video" ? "bg-blue-600 text-white" : "text-slate-500"}`}
          >
            Video Lectures
          </button>
          <button
            onClick={() => setActiveWorkspaceTab("chat")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer ${activeWorkspaceTab === "chat" ? "bg-blue-600 text-white" : "text-slate-500"}`}
          >
            Study Group Chat
          </button>
        </div>

        {/* SUBTAB 1: LECTURE PLAYER WITH TIME NOTES */}
        {activeWorkspaceTab === "video" && selectedLesson && (
          <div className="space-y-6 animate-fade-in">
            {/* Custom Video Box */}
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative group border border-slate-800 shadow-lg">
              <video
                ref={videoRef}
                src={selectedLesson.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onClick={handleTogglePlay}
                className="w-full h-full object-contain"
              />
              
              {/* Media Player Controls Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                <div className="flex items-center space-x-4">
                  <button onClick={handleTogglePlay} className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={handleSpeedChange} className="p-1 hover:bg-white/10 rounded-full transition-colors font-semibold cursor-pointer">
                    {playbackSpeed}x
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={handleFullscreen} className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lesson details & Action button bar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <h5 className="font-display font-bold text-slate-800 text-lg">{selectedLesson.title}</h5>
                <p className="text-slate-500 text-xs leading-relaxed">{selectedLesson.content}</p>
              </div>

              <div className="shrink-0 flex items-center space-x-2">
                <button
                  onClick={handleCompleteLesson}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${completedLessonIds.includes(selectedLesson.id) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{completedLessonIds.includes(selectedLesson.id) ? "Lesson Completed!" : "Complete Lesson"}</span>
                </button>
              </div>
            </div>

            {/* Timestamped learning Notes section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h5 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> Time-stamped Learning Notes
              </h5>
              
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Record timestamped lecture notes here..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">
                  Pin Note
                </button>
              </form>

              {studentNotes.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No notes pinned yet. Record notes linked to lecture timelines.</p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto divide-y divide-slate-50">
                  {studentNotes.map(note => (
                    <div key={note.id} className="pt-2 flex items-baseline space-x-3 text-xs">
                      <span className="font-mono font-bold text-blue-600 shrink-0">[{note.timestamp}]</span>
                      <p className="text-slate-600 leading-normal">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: QUIZ ASSESSMENT MODULE */}
        {activeWorkspaceTab === "quiz" && activeQuiz && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h5 className="font-display font-bold text-slate-800 text-base">{activeQuiz.title}</h5>
                <p className="text-slate-400 text-xs">Answer all queries correctly to verify curriculum progression.</p>
              </div>

              {/* Quiz Countdown Timer display */}
              {!quizResults && isQuizTimerRunning && (
                <div className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
                  <Timer className="w-4 h-4" />
                  <span>{Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, "0")}</span>
                </div>
              )}
            </div>

            {/* Quiz Results Feedback panel */}
            {quizResults ? (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 text-blue-950 rounded-xl border border-blue-100 space-y-3 text-center">
                  <h6 className="font-display font-extrabold text-2xl">Your Score: {quizResults.percentage}%</h6>
                  <p className="text-xs font-bold text-blue-800 uppercase">Results logged: {quizResults.score} / {quizResults.totalQuestions} questions correct</p>
                  <p className="text-sm text-blue-700 italic">"{quizResults.feedback}"</p>
                </div>

                <div className="space-y-4">
                  <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Answer Review Matrix</h6>
                  {quizResults.details.map((detail: any, idx: number) => (
                    <div key={idx} className={`p-4 rounded-xl border text-xs space-y-2 ${detail.isCorrect ? "bg-emerald-50/50 border-emerald-200 text-emerald-950" : "bg-red-50/50 border-red-200 text-red-950"}`}>
                      <p className="font-bold">{idx + 1}. {detail.text}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 font-semibold">
                        <div>Your Choice: <span className="underline">{detail.studentAnswer || "No Answer"}</span></div>
                        <div>Correct Answer: <span className="font-bold">{detail.correctAnswer}</span></div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setActiveQuiz(null); setQuizResults(null); }}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Finish Assessment
                </button>
              </div>
            ) : (
              /* ACTIVE EXAM QUESTIONS LIST */
              <div className="space-y-6">
                {activeQuiz.questions.map((q: Question, qIdx: number) => (
                  <div key={q.id} className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">{qIdx + 1}. {q.text}</p>
                    
                    {/* Render MC options */}
                    {q.type === "multiple-choice" || q.type === "true-false" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleQuizAnswerSelect(q.id, opt)}
                            className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer ${quizAnswers[q.id] === opt ? "bg-blue-50 border-blue-500 text-blue-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700"}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Fill in blank text box */
                      <input
                        type="text"
                        placeholder="Type short answer (lowercase)..."
                        value={quizAnswers[q.id] || ""}
                        onChange={(e) => handleQuizAnswerSelect(q.id, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={handleQuizSubmission}
                  disabled={quizSubmitting}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-amber-400"
                >
                  {quizSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Submit & Grade Exam</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: ASSIGNMENTS WORKSPACE */}
        {activeWorkspaceTab === "assignment" && courseAssignments.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h5 className="font-display font-bold text-slate-800 text-base">{courseAssignments[0].title}</h5>
              <p className="text-slate-400 text-xs">Maximum Points available: {courseAssignments[0].maxPoints || 100}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs leading-relaxed text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">Instructions & Specs</span>
              <p>{courseAssignments[0].instructions}</p>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Your solution assignment has been uploaded and submitted successfully! The teacher will grade it shortly.</span>
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmitAssignment(e, courseAssignments[0].id)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500">Submit Work PDF / GitHub Link URL</label>
                  <input
                    type="text"
                    value={workUrl}
                    onChange={(e) => setWorkUrl(e.target.value)}
                    placeholder="https://github.com/myusername/project-repo"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Simulate upload: paste reference URL or report file link.</span>
                </div>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {submitLoading ? "Uploading..." : "Submit Solution Work"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* SUBTAB 4: GROUP STUDY DISCUSSION CHAT */}
        {activeWorkspaceTab === "chat" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-md space-y-4 animate-fade-in flex flex-col justify-between min-h-[50vh] max-h-[60vh]">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-baseline">
              <h5 className="font-display font-bold text-slate-800 text-sm">Classroom Discussion Thread</h5>
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Group chat</span>
            </div>

            {/* Message feeds */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-80">
              {groupMessages.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-8">Class discussion is empty. Type a question to start!</p>
              ) : (
                groupMessages.map(m => {
                  const isMe = m.senderId === user.id;
                  return (
                    <div key={m.id} className={`flex flex-col space-y-1 text-xs max-w-xs ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                      <span className="text-[10px] font-bold text-slate-400">{m.senderName}</span>
                      <div className={`p-3 rounded-2xl leading-normal ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-50 text-slate-800 rounded-bl-none border border-slate-100"}`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendGroupMessage} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Ask a question or post a note to the class..."
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" disabled={groupMsgLoading} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0">
                Post Msg
              </button>
            </form>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: AI Tutor companion chat assistant side-card (3 cols) */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 flex flex-col justify-between h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="space-y-2 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-1.5 text-amber-400">
            <BrainCircuit className="w-5 h-5 fill-amber-400/10" />
            <h5 className="font-display font-bold text-sm tracking-tight">Gemini AI Study Tutor</h5>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Your live learning companion. Ask for code fixes, math equations, or concept summaries linked to: <span className="font-bold text-white">"{selectedLesson?.title || "Course Details"}"</span>
          </p>
        </div>

        {/* Message Feed container */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 scrollbar-thin">
          {chatMessages.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-amber-400 mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-[180px] mx-auto italic">
                "Hi Alex! Ask me to explain supervised models, linear loss formulas, or solve lab assignments."
              </p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div key={idx} className={`flex flex-col space-y-0.5 text-[11px] max-w-[200px] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}>
                  <span className="text-[9px] font-bold text-slate-500 capitalize">{isUser ? "You" : "AI Tutor"}</span>
                  <div className={`p-2.5 rounded-xl leading-relaxed whitespace-pre-line ${isUser ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50"}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          {aiChatLoading && (
            <div className="mr-auto text-[11px] text-slate-500 flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Gemini is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendAITutor} className="flex gap-1.5 pt-3 border-t border-slate-800">
          <input
            type="text"
            placeholder="Ask AI Tutor..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={aiChatLoading}
            className="px-2.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
}
