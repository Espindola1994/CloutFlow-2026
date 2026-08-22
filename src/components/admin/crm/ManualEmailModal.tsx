"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Mail, 
  Send, 
  Eye, 
  Code, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ShieldAlert,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { CANONICAL_EMAIL_TEMPLATES, EmailTemplateDefinition, interpolateTemplate } from "@/services/crm/templates";
import { AdminBadge } from "../ui";

interface ManualEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName?: string | null;
  target?: string | null;
  platform?: string | null;
  orderId?: string | null;
  quantity?: number | null;
  service?: string | null;
  isSuppressed?: boolean;
  onSuccess?: () => void;
}

export function ManualEmailModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  target,
  platform,
  orderId,
  quantity,
  service,
  isSuppressed,
  onSuccess
}: ManualEmailModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("PAYMENT_RECEIVED");
  const [category, setCategory] = useState<"transactional" | "marketing" | "support">("transactional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  // Template variables mapping
  const templateVariables: Record<string, string | number> = {
    customer_name: recipientName || "Customer",
    email: recipientEmail,
    instagram: target ? `@${target.replace(/^@/, "")}` : "@customer",
    target: target || "your profile",
    quantity: quantity || 1000,
    plan_name: service ? `${quantity || 1000} ${service}` : "Growth Plan",
    service: service || "Followers Boost",
    order_id: orderId || "CF-10001",
    platform: platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Instagram",
    order_status: "Processing"
  };

  const handleSelectTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = CANONICAL_EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setCategory(tmpl.category);
      setSubject(tmpl.defaultSubject);
      setBody(tmpl.defaultBody);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      handleSelectTemplate(selectedTemplateId);
      setPreviewMode(false);
    }
  }, [isOpen, selectedTemplateId, handleSelectTemplate]);

  if (!isOpen) return null;

  const interpolatedSubject = interpolateTemplate(subject, templateVariables);
  const interpolatedBody = interpolateTemplate(body, templateVariables);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and email body are required.");
      return;
    }

    if (category === "marketing" && isSuppressed) {
      toast.error("Blocked: Customer has unsubscribed from marketing emails.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/crm/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: recipientEmail,
          templateId: selectedTemplateId,
          category,
          subject,
          body,
          orderId: orderId || undefined,
          variables: templateVariables
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.data?.status === "BLOCKED_SEND_DISABLED"
            ? "Email logged (Marketing send globally disabled in safe mode)"
            : "Email dispatched successfully!"
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.data?.reason || data.error?.message || "Failed to send email");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9E2E3] bg-[#FAFCFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F8F8A]/10 border border-[#0F8F8A]/20 flex items-center justify-center text-[#0F8F8A]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#142126] flex items-center gap-2">
                Manual Email Dispatch
                <AdminBadge variant={category === "marketing" ? "warning" : category === "support" ? "info" : "success"} size="sm">
                  {category.toUpperCase()}
                </AdminBadge>
              </h3>
              <p className="text-xs text-[#65737A]">
                Recipient: <span className="font-semibold text-[#142126]">{recipientEmail}</span>
                {recipientName ? ` (${recipientName})` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A979D] hover:text-[#142126] p-2 rounded-lg hover:bg-[#F1F5F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suppression Alert */}
        {isSuppressed && (
          <div className="bg-[#FFF4F2] border-b border-[#FECDCA] px-6 py-2.5 flex items-center gap-2 text-xs text-[#B42318] font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Customer is Marketing-Suppressed (Unsubscribed). Marketing emails are strictly blocked. Support & Transactional emails remain permitted.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Template Selector & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#142126] mb-1.5">
                Template Preset
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3 py-2 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A]"
              >
                {CANONICAL_EMAIL_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category.toUpperCase()}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142126] mb-1.5">
                Email Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3 py-2 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A]"
              >
                <option value="transactional">Transactional (Order updates, receipts)</option>
                <option value="support">Support (Customer inquiry, username verification)</option>
                <option value="marketing">Marketing (Promotions, cart recovery)</option>
              </select>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold text-[#142126] mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full bg-[#FAFCFC] border border-[#D9E2E3] rounded-lg px-3.5 py-2.5 text-xs text-[#142126] font-medium focus:outline-hidden focus:border-[#0F8F8A]"
            />
          </div>

          {/* Toolbar & Mode Toggle */}
          <div className="flex items-center justify-between border-b border-[#D9E2E3] pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  !previewMode ? "bg-[#0F8F8A] text-white" : "text-[#65737A] hover:text-[#142126]"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                HTML Editor
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  previewMode ? "bg-[#0F8F8A] text-white" : "text-[#65737A] hover:text-[#142126]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
            </div>

            <div className="text-[11px] text-[#8A979D]">
              Supported variables: <code className="text-[#0F8F8A]">{"{customer_name}"}</code>, <code className="text-[#0F8F8A]">{"{order_id}"}</code>, <code className="text-[#0F8F8A]">{"{target}"}</code>, <code className="text-[#0F8F8A]">{"{service}"}</code>
            </div>
          </div>

          {/* Editor vs Preview */}
          {!previewMode ? (
            <div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full font-mono text-xs bg-[#FAFCFC] border border-[#D9E2E3] rounded-xl p-4 text-[#142126] focus:outline-hidden focus:border-[#0F8F8A]"
                placeholder="Write your email HTML content here..."
              />
            </div>
          ) : (
            <div className="border border-[#D9E2E3] rounded-xl p-6 bg-[#F8FAFA] min-h-[300px]">
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 max-w-xl mx-auto shadow-xs">
                <div className="border-b border-[#F3F4F6] pb-3 mb-4">
                  <div className="text-xs text-[#6B7280]">To: <span className="font-semibold text-[#111827]">{recipientEmail}</span></div>
                  <div className="text-xs text-[#6B7280] mt-1">Subject: <span className="font-bold text-[#111827]">{interpolatedSubject}</span></div>
                </div>
                <div 
                  className="prose prose-sm text-[#374151] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: interpolatedBody }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#D9E2E3] bg-[#FAFCFC] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-xs font-semibold text-[#65737A] hover:text-[#142126] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || (category === "marketing" && isSuppressed)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F8F8A] hover:bg-[#0D7A76] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Dispatch Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
