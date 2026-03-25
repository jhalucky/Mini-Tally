import React, { useState, useEffect } from 'react';
import {
  getAllClients, addClient, updateClient, deleteClient
} from '../db/database';
import { INDIAN_STATES } from '../data/states';
import { UserPlus, Pencil, Trash2 } from 'lucide-react';

const EMPTY_FORM = {
  name: '', company: '', gstin: '', address: '',
  city: '', state: '', stateCode: '', phone: '', email: '',
};

function ClientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const handleStateChange = (stateName) => {
    const found = INDIAN_STATES.find(s => s.name === stateName);
    setForm(f => ({ ...f, state: stateName, stateCode: found ? found.code : '' }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return alert("Name required");
    onSave(form);
  };

  return (
    <div className="bg-white border p-4 sm:p-6 w-full max-w-xl mx-2">

      <h3 className="text-sm font-bold mb-4">
        {initial?.id ? "Edit Client" : "Add Client"}
      </h3>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <input placeholder="Name" value={form.name} onChange={e => set('name')(e.target.value)} className="border px-2 py-2 text-sm" />
        <input placeholder="Company" value={form.company} onChange={e => set('company')(e.target.value)} className="border px-2 py-2 text-sm" />

        <input placeholder="GSTIN" value={form.gstin} onChange={e => set('gstin')(e.target.value)} className="border px-2 py-2 text-sm sm:col-span-2" />

        <textarea placeholder="Address" value={form.address} onChange={e => set('address')(e.target.value)} className="border px-2 py-2 text-sm sm:col-span-2" />

        <input placeholder="City" value={form.city} onChange={e => set('city')(e.target.value)} className="border px-2 py-2 text-sm" />

        <select value={form.state} onChange={e => handleStateChange(e.target.value)} className="border px-2 py-2 text-sm">
          <option value="">State</option>
          {INDIAN_STATES.map(s => (
            <option key={s.code} value={s.name}>{s.name}</option>
          ))}
        </select>

        <input placeholder="State Code" value={form.stateCode} onChange={e => set('stateCode')(e.target.value)} className="border px-2 py-2 text-sm" />
        <input placeholder="Phone" value={form.phone} onChange={e => set('phone')(e.target.value)} className="border px-2 py-2 text-sm" />

      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button onClick={handleSubmit} className="border px-4 py-2 text-sm w-full sm:w-auto">
          {initial?.id ? "Update" : "Save"}
        </button>

        <button onClick={onCancel} className="border px-4 py-2 text-sm w-full sm:w-auto">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ClientManager({ selectorMode = false, onSelect, onClose }) {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const all = await getAllClients();
    setClients(all);
  };

  const handleSave = async (form) => {
    if (form.id) {
      await updateClient(form);
    } else {
      await addClient(form);
    }
    setShowForm(false);
    setEditing(null);
    loadClients();
  };

  const handleEdit = (client) => {
    setEditing(client);
    setShowForm(true);
  };

  const handleDelete = async (client) => {
    if (!confirm("Delete client?")) return;
    await deleteClient(client.id);
    loadClients();
  };

  return (
    <div className="space-y-4 px-2 sm:px-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="font-bold text-base sm:text-lg">Clients</h2>

        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="border px-3 py-2 text-sm w-full sm:w-auto"
        >
          + Add Client
        </button>
      </div>

      {/* Client List */}
      <div className="space-y-2">
        {clients.map(client => (
          <div
            key={client.id}
            className={`border p-3 flex flex-col sm:flex-row sm:justify-between gap-2 ${
              selectorMode ? "cursor-pointer hover:bg-gray-100" : ""
            }`}
            onClick={selectorMode ? () => onSelect(client) : undefined}
          >

            {/* Left */}
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">
                {client.company || client.name}
              </div>

              <div className="text-xs text-gray-500 break-words">
                {client.address} {client.city && `, ${client.city}`}
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex gap-2 justify-end sm:justify-start">
              <button onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>
                <Pencil size={14} />
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleDelete(client); }}>
                <Trash2 size={14} />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-2">

          <ClientForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />

        </div>
      )}

    </div>
  );
}