/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CreditCard, Shield, CheckCircle, Loader2, X } from "lucide-react";
import { Course } from "../types";

interface PaymentModalProps {
  course?: Course;
  plan?: "monthly" | "yearly" | "single-course";
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ course, plan, userId, onClose, onSuccess }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [cardName, setCardName] = useState("Alex Rivera");
  const [loading, setLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [error, setError] = useState("");

  const getPriceAndDesc = () => {
    if (plan === "monthly") return { price: 29.00, desc: "LMS Monthly Subscription - Unlimited Courses Access" };
    if (plan === "yearly") return { price: 199.00, desc: "LMS Annual Subscription - Premium Pass" };
    if (course) return { price: course.price, desc: `Enrolling in Course: "${course.title}"` };
    return { price: 29.00, desc: "General Subscription" };
  };

  const { price, desc } = getPriceAndDesc();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !cardName) {
      setError("Please complete all credit card fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userId,
          courseId: course?.id,
          plan: plan || "single-course"
        })
      });

      if (!response.ok) {
        throw new Error("Simulated payment failed. Please try again.");
      }

      setPaymentDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="stripe-payment-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col">
        {/* Modal Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-6 h-6" />
            <h3 className="font-display font-semibold text-lg">Secure Stripe Checkout</h3>
          </div>
          <button id="close-payment-btn" onClick={onClose} className="p-1 hover:bg-blue-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {paymentDone ? (
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="font-display font-bold text-xl text-gray-800">Payment Successful!</h4>
            <p className="text-gray-500 text-sm">Your invoice receipt has been generated. You are now fully enrolled!</p>
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mt-2" />
          </div>
        ) : (
          <form id="payment-form" onSubmit={handleCheckout} className="p-6 space-y-5">
            {/* Purchase Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Item Details</div>
              <div className="text-gray-800 font-medium text-sm mt-1">{desc}</div>
              <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-slate-200">
                <span className="text-sm font-semibold text-gray-600">Total Price:</span>
                <span className="text-2xl font-display font-bold text-blue-600">${price.toFixed(2)}</span>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

            {/* Simulated Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm focus:outline-hidden text-gray-800"
                  placeholder="e.g. Alex Rivera"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 font-mono">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm focus:outline-hidden font-mono text-gray-800"
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Expiration</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm focus:outline-hidden font-mono text-gray-800"
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">CVC Code</label>
                  <input
                    type="password"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm focus:outline-hidden font-mono text-gray-800"
                    placeholder="123"
                    maxLength={3}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400 justify-center">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Stripe Test Mode Integration Enabled</span>
            </div>

            <button
              id="confirm-payment-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:bg-blue-400 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Auth...</span>
                </>
              ) : (
                <span>Pay and Complete Registration</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
