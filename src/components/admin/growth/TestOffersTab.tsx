import React, { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Trash2, XCircle } from "lucide-react";
import { AdminButton, AdminIconButton, AdminModal, AdminTable, AdminTableHeader, AdminTableBody, AdminTableRow, AdminTableHead, AdminTableCell } from "../ui";

// Define local offer interface to avoid any
interface TestOffer {
  id: string;
  customerEmail: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export function TestOffersTab() {
  const [offers, setOffers] = useState<TestOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formValidHours, setFormValidHours] = useState("48");
  const [formSendEmail, setFormSendEmail] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/test-offers");
      const json = await res.json();
      if (res.ok && json.success) {
        setOffers(json.data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail) return;

    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/test-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: formEmail,
          validHours: parseFloat(formValidHours),
          sendEmail: formSendEmail
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsModalOpen(false);
        setFormEmail("");
        setFormSendEmail(false);
        fetchOffers();
      } else {
        alert(json.error?.message || "Error creating test offer");
      }
    } catch (e) {
      alert("Error connecting to server");
    } finally {
      setFormLoading(false);
    }
  };

  const handleExpire = async (id: string) => {
    if (!confirm("Expire this Test Offer?")) return;
    try {
      const res = await fetch(`/api/admin/test-offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "expire" })
      });
      if (res.ok) {
        fetchOffers();
      } else {
        const json = await res.json();
        alert(json.error?.message || "Failed to expire offer");
      }
    } catch (e) {
      alert("Error connecting to server");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this Test Offer permanently?")) return;
    try {
      const res = await fetch(`/api/admin/test-offers/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchOffers();
      } else {
        const json = await res.json();
        alert(json.error?.message || "Failed to delete offer");
      }
    } catch (e) {
      alert("Error connecting to server");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-3.5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
        <div>
          <h3 className="text-[13px] font-[650] uppercase tracking-wider text-[#142126]">Test Offers</h3>
          <p className="text-[12px] text-[#65737A]">Create controlled 25% offers to validate the post-purchase experience without a prior transaction.</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton variant="outline" size="sm" onClick={fetchOffers} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </AdminButton>
          <AdminButton variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Test Offer
          </AdminButton>
        </div>
      </div>

      <div className="bg-[#FFFFFF] border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
        {offers.length === 0 ? (
           <div className="py-12 text-center text-[#65737A] text-[12px]">No test offers found.</div>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>CUSTOMER</AdminTableHead>
                <AdminTableHead>CODE</AdminTableHead>
                <AdminTableHead>DISCOUNT</AdminTableHead>
                <AdminTableHead>CREATED</AdminTableHead>
                <AdminTableHead>EXPIRES</AdminTableHead>
                <AdminTableHead>STATUS</AdminTableHead>
                <AdminTableHead className="text-right">ACTIONS</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {offers.map(o => (
                <AdminTableRow key={o.id}>
                  <AdminTableCell className="font-medium text-[#142126]">{o.customerEmail}</AdminTableCell>
                  <AdminTableCell className="font-mono">{o.code}</AdminTableCell>
                  <AdminTableCell>25%</AdminTableCell>
                  <AdminTableCell>{new Date(o.createdAt).toLocaleDateString()}</AdminTableCell>
                  <AdminTableCell>{new Date(o.expiresAt).toLocaleString()}</AdminTableCell>
                  <AdminTableCell>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                      o.status === 'ACTIVE' ? 'bg-[#E8F8F2] text-[#16B77A]' : 'bg-[#F1F5F5] text-[#65737A]'
                    }`}>
                      {o.status} TEST
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {o.status === 'ACTIVE' && (
                        <AdminIconButton size="sm" variant="outline" onClick={() => handleExpire(o.id)} title="Expire">
                          <XCircle className="w-3.5 h-3.5" />
                        </AdminIconButton>
                      )}
                      <AdminIconButton size="sm" variant="danger" onClick={() => handleDelete(o.id)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </AdminIconButton>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        )}
      </div>

      <AdminModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create Test 25% Offer"
        description="Generate a controlled 25% offer for an existing contact."
      >
        <form onSubmit={handleCreateOffer} className="space-y-4 text-[12px]">
          <div>
            <label className="font-semibold block mb-1">Customer (Email)</label>
            <input 
              type="email" 
              required
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              placeholder="Existing contact email..."
              className="w-full border rounded p-2 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Discount</label>
            <input type="text" value="25%" readOnly className="w-full border rounded p-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="font-semibold block mb-1">Validity</label>
            <select 
              value={formValidHours} 
              onChange={e => setFormValidHours(e.target.value)}
              className="w-full border rounded p-2 focus:outline-hidden"
            >
              <option value="0.08333333333333333">5 Minutes</option>
              <option value="24">24 Hours</option>
              <option value="48">48 Hours</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="sendEmail" 
              checked={formSendEmail} 
              onChange={e => setFormSendEmail(e.target.checked)} 
            />
            <label htmlFor="sendEmail" className="font-medium">Send test email after creation</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <AdminButton type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? "Creating..." : "Create Test Offer"}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
