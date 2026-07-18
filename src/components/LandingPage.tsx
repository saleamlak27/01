/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, ShieldCheck, Video, Users, Smartphone, Globe, Award, Star, BookOpen, Clock, ArrowRight } from "lucide-react";
import { Course } from "../types";

interface LandingPageProps {
  courses: Course[];
  onSearch: (query: string) => void;
  onEnroll: (course: Course) => void;
  onAuthTrigger: (role: "student" | "teacher") => void;
  onSelectCourse: (course: Course) => void;
  isLoggedIn: boolean;
}

export default function LandingPage({ 
  courses, 
  onSearch, 
  onEnroll, 
  onAuthTrigger, 
  onSelectCourse,
  isLoggedIn 
}: LandingPageProps) {
  const [searchVal, setSearchVal] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  const approvedCourses = courses.filter(c => c.status === "approved");

  const features = [
    { icon: <Users className="w-6 h-6 text-purple-600" />, title: "Expert Teachers", desc: "Learn from Ph.D. researchers, software practitioners, and industry authorities." },
    { icon: <Video className="w-6 h-6 text-teal-600" />, title: "Online Classes", desc: "Interact dynamically with schedule Zoom lectures and instant class recordings." },
    { icon: <Award className="w-6 h-6 text-amber-600" />, title: "Digital Certifications", desc: "Validate accomplishments with high-fidelity, printable, and verifiable credentials." },
    { icon: <Clock className="w-6 h-6 text-indigo-600" />, title: "Lifetime Access", desc: "Study fully at your own target pace. Review slides, labs, and syllabus indefinitely." },
    { icon: <Smartphone className="w-6 h-6 text-rose-600" />, title: "Mobile Learning", desc: "Fully responsive viewport scales. Learn on phone, tablet, or desktop systems." },
    { icon: <Globe className="w-6 h-6 text-emerald-600" />, title: "Global Community Support", desc: "Engage inside real-time group chat study threads directly with instructors." }
  ];

  const testimonials = [
    { 
      name: "Amina Okoro", 
      role: "Full-Stack Developer (Nigeria)", 
      text: "The structured course modules and global support network empowered me to master advanced system architectures quickly.", 
      rating: 5, 
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&auto=format&fit=crop&q=80" 
    },
    { 
      name: "Yohannes Alemu", 
      role: "AI Engineer (Ethiopia)", 
      text: "The digital certifications immediately validated my machine learning skills on an international level.", 
      rating: 5, 
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" 
    },
    { 
      name: "Dr. Tariku Zewdu", 
      role: "Volcanology Lead (Ethiopia)", 
      text: "The high-performance computing lessons helped us build robust simulation suites for active magma tracking.", 
      rating: 5, 
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" 
    },
    { 
      name: "Mei-Ling Chen", 
      role: "Data Scientist (China)", 
      text: "Outstanding depth in data science. The curriculum is perfectly paced for modern professional roles.", 
      rating: 5, 
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80" 
    },
    { 
      name: "Oliver Harrison", 
      role: "UX Researcher (United Kingdom)", 
      text: "Exceptional platform design. The real-time interactive tasks secured my career transition instantly.", 
      rating: 5, 
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" 
    },
    { 
      name: "Sophia Martinez", 
      role: "Cloud Architect (USA)", 
      text: "Highly flexible syllabus and advanced lab environments that make self-paced learning truly efficient.", 
      rating: 5, 
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" 
    }
  ];

  return (
    <div id="landing-page" className="flex flex-col space-y-16 animate-fade-in">
      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center text-white py-24 px-6 rounded-3xl overflow-hidden shadow-2xl mx-4 sm:mx-8 border border-purple-500/20"
        style={{ 
          backgroundImage: `linear-gradient(to bottom right, rgba(15, 23, 42, 0.94), rgba(88, 28, 135, 0.88), rgba(15, 23, 42, 0.96)), url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1920&q=80')` 
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 via-indigo-500 to-slate-900"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-purple-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            Empowering Modern Learning
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Master Cutting-Edge Skills with <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-300 to-teal-300">Adaptive AI Guidance</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light">
            Enroll in premium professional courses, schedule live classes, solve challenging exams, and earn verified, printable certifications with AI Tutor companionship.
          </p>

          {/* Search Bar */}
          <form id="hero-search-form" onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-300 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="What skill do you want to learn today?"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-transparent pl-11 pr-4 py-3 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-0 border-none"
              />
            </div>
            <button
              id="hero-search-btn"
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              id="start-learning-cta"
              onClick={() => onAuthTrigger("student")}
              className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-purple-500/10"
            >
              Start Learning Path
            </button>
            <button
              id="become-instructor-cta"
              onClick={() => onAuthTrigger("teacher")}
              className="px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500 border border-slate-600 text-white font-semibold rounded-xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Become Instructor
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-slate-800">Designed for Educational Excellence</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Everything you need to deliver, manage, and complete dynamic online classes and earn career-ready qualifications.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                {feat.icon}
              </div>
              <h3 className="font-display font-semibold text-slate-800 text-lg">{feat.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-3xl font-bold text-slate-800">Our Premium Catalog</h2>
            <p className="text-slate-500">Acquire skills on an advanced, industry-aligned schedule.</p>
          </div>
        </div>

        {approvedCourses.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No courses are currently available. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {approvedCourses.map((course) => (
              <div 
                key={course.id} 
                className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col cursor-pointer"
                onClick={() => onSelectCourse(course)}
              >
                {/* Course Thumbnail */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                    {course.category}
                  </span>
                </div>

                {/* Course Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                      <span>By {course.instructorName}</span>
                    </div>
                    <h3 className="font-display font-bold text-slate-800 text-lg leading-tight group-hover:text-purple-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Rating & Pricing Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-slate-700">{course.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl font-display font-extrabold text-purple-600">${course.price.toFixed(2)}</span>
                      <button
                        id={`enroll-btn-${course.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEnroll(course);
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Enroll Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-16 px-6 sm:px-8 rounded-3xl mx-4 sm:mx-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl font-bold text-slate-800">What Our Students Say</h2>
            <p className="text-slate-500">Achieving milestones across web engineering, neural architecture, and UX layout designs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={test.avatar}
                    alt={test.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-display font-semibold text-slate-800 text-sm">{test.name}</h4>
                    <p className="text-slate-400 text-xs">{test.role}</p>
                  </div>
                </div>
                <div className="flex space-x-0.5">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-500 text-sm leading-relaxed italic">"{test.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="border-t border-slate-100 pt-12 pb-6 max-w-7xl mx-auto w-full px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-800">New-Tech school of world</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Our educational ecosystem integrates state-of-the-art interactive modules, live stream Zoom schedules, digital certificates, and responsive learning interfaces.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-slate-800 mb-3">Company</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#about" className="hover:text-purple-600 transition-colors">About Us</a></li>
              <li><a href="#careers" className="hover:text-purple-600 transition-colors">Careers</a></li>
              <li><a href="#press" className="hover:text-purple-600 transition-colors">Press Room</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-slate-800 mb-3">Support & Legal</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#faq" className="hover:text-purple-600 transition-colors">Frequently Asked Questions</a></li>
              <li><a href="#privacy" className="hover:text-purple-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-purple-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm text-slate-800 mb-3">Contact</h4>
            <p className="text-xs text-slate-500 leading-loose">
              Email: sale73d9@gmail.com<br />
              Developer Region: Europe-West2<br />
              Timezone Reference: UTC-7
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-2">
          <span>&copy; 2026 New-Tech school of world. All rights reserved.</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secured Stripe & SSL Authentication verified</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
