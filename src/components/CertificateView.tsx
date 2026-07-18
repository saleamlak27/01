/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from "react";
import { Award, Download, Printer, ShieldCheck, Calendar, User, BookOpen, X } from "lucide-react";
import { Certificate } from "../types";

interface CertificateViewProps {
  certificate: Certificate;
  onClose: () => void;
}

export default function CertificateView({ certificate, onClose }: CertificateViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Create simple print window helper or trigger native print if possible.
    // For iframe sandboxes, we provide a beautiful layout. Let's do a mock PDF download success message and native print.
    if (printContent) {
      window.print();
    }
  };

  return (
    <div id="certificate-viewer" className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="max-w-4xl w-full bg-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-700 flex flex-col space-y-6">
        
        {/* Certificate Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-700 pb-4">
          <div>
            <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span>Digital Certificate of Completion</span>
            </h3>
            <p className="text-slate-400 text-xs mt-1">Verified credential authorized by Educational Management System</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="bg-white text-slate-900 p-6 md:p-12 rounded-2xl border-8 border-double border-amber-600 relative overflow-hidden shadow-inner font-sans">
          
          {/* Aesthetic Watermark Frame */}
          <div className="absolute inset-4 border border-amber-200/50 pointer-events-none"></div>
          
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-amber-500"></div>
          <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-amber-500"></div>
          <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-amber-500"></div>
          <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-amber-500"></div>

          <div className="text-center space-y-6 relative z-10 py-6">
            {/* Logo/Insignia */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center border-2 border-amber-500 text-amber-600">
                <Award className="w-12 h-12 stroke-[1.5]" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-4xl font-extrabold text-amber-800 tracking-wider uppercase">Certificate of Completion</h1>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">This credential is proudly conferred upon</p>
            </div>

            {/* Student Name */}
            <div className="py-4 border-b border-slate-200 max-w-lg mx-auto">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 italic">{certificate.studentName}</h2>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
              <p className="text-slate-600 leading-relaxed text-sm">
                for successfully fulfilling all curriculum requirements, laboratories, exams, and projects prescribed for the learning program:
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-blue-900 leading-tight">{certificate.courseName}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Under the instruction and advisory of</p>
              <p className="text-base font-medium text-slate-700">{certificate.instructorName}</p>
            </div>

            {/* Footer Signatures, Date and QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 items-end max-w-2xl mx-auto">
              {/* Date */}
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1">{certificate.completionDate}</p>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Date of Issuance</span>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-2">
                <div className="w-20 h-20 bg-slate-50 p-1 border border-slate-200 rounded-lg flex items-center justify-center">
                  {/* Visual simulated QR code */}
                  <div className="w-full h-full bg-slate-100 flex flex-col justify-between p-1.5 font-mono text-[6px] text-slate-400 overflow-hidden select-none leading-none">
                    <div className="flex justify-between">
                      <span className="border border-slate-800 w-3 h-3 bg-slate-800"></span>
                      <span>...::...</span>
                      <span className="border border-slate-800 w-3 h-3 bg-slate-800"></span>
                    </div>
                    <div className="text-center tracking-tight truncate"> verified </div>
                    <div className="flex justify-between items-end">
                      <span className="border border-slate-800 w-3 h-3 bg-slate-800"></span>
                      <span>......</span>
                      <span className="border border-slate-500 w-2 h-2"></span>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">Scan to Verify</span>
              </div>

              {/* Signature */}
              <div className="text-center space-y-1">
                <p className="text-sm font-serif font-bold italic border-b border-slate-200 pb-1 text-slate-800">Director Marcus Vance</p>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Authorized Signature</span>
              </div>
            </div>

            {/* Validation Details */}
            <div className="pt-6 flex justify-center items-center space-x-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-mono tracking-wider">VERIFICATION KEY: {certificate.verificationCode}</span>
            </div>

          </div>
        </div>

        {/* Certificate Guide */}
        <div className="text-slate-400 text-xs text-center">
          <p>You can print this document directly. It will fit on a standard A4 landscape sheet.</p>
        </div>

      </div>
    </div>
  );
}
