import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateForm, resetForm, setSavedId, setSaving,
  addMessage, setLoading, setInteractions
} from './store';
import { agentChat, saveInteraction, updateInteraction, listInteractions } from './api';

const sentimentEmoji = { Positive: '😊', Neutral: '😐', Negative: '😟' };

function SectionCard({ children, style }) {
  return <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', marginBottom: 14, ...style }}>{children}</div>;
}
function FieldLabel({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{children}</div>;
}
function TextInput({ value, onChange, placeholder, style }) {
  return (
    <input value={value || ''} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', color: '#111827', ...style }} />
  );
}
function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea rows={rows} value={value || ''} onChange={onChange} placeholder={placeholder}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', resize: 'vertical', color: '#111827' }} />
  );
}

function LogForm({ aiFollowUps }) {
  const dispatch = useDispatch();
  const { form, isSaving, saveSuccess, savedId } = useSelector(s => s.interaction);

  const handleSave = async () => {
    dispatch(setSaving(true));
    try {
      if (savedId) { await updateInteraction(savedId, form); }
      else { const res = await saveInteraction(form); dispatch(setSavedId(res.data.id)); }
    } catch (e) { console.error(e); }
    dispatch(setSaving(false));
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>HCP Name</FieldLabel>
          <TextInput value={form.hcp_name} onChange={e => dispatch(updateForm({ hcp_name: e.target.value }))} placeholder="Search or select HCP..." />
        </div>
        <div>
          <FieldLabel>Interaction Type</FieldLabel>
          <div style={{ position: 'relative' }}>
            <select value={form.interaction_type || 'Meeting'} onChange={e => dispatch(updateForm({ interaction_type: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', appearance: 'none', background: '#fff', color: '#111827' }}>
              {['Meeting','Call','Email','Conference','Virtual','Other'].map(t => <option key={t}>{t}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>▾</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FieldLabel>Date</FieldLabel>
          <TextInput value={form.date} onChange={e => dispatch(updateForm({ date: e.target.value }))} placeholder="DD-MM-YYYY" />
        </div>
        <div>
          <FieldLabel>Time</FieldLabel>
          <TextInput value={form.time || ''} onChange={e => dispatch(updateForm({ time: e.target.value }))} placeholder="HH:MM" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Attendees</FieldLabel>
        <TextInput value={form.attendees || ''} onChange={e => dispatch(updateForm({ attendees: e.target.value }))} placeholder="Enter names or search..." />
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Topics Discussed</FieldLabel>
        <div style={{ position: 'relative' }}>
          <TextArea value={form.topics_discussed} onChange={e => dispatch(updateForm({ topics_discussed: e.target.value }))} placeholder="Enter key discussion points..." rows={3} />
          <span style={{ position: 'absolute', bottom: 8, right: 10, color: '#9ca3af', fontSize: 15 }}>🎤</span>
        </div>
        <div style={{ marginTop: 5 }}>
          <span style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer' }}>✨ Summarize from Voice Note (Requires Consent)</span>
        </div>
      </div>

      <SectionCard>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Materials Shared / Samples Distributed</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <FieldLabel>Materials Shared</FieldLabel>
            <button style={btnOutline}>🔍 Search/Add</button>
          </div>
          {form.materials_shared
            ? <div style={{ fontSize: 13, color: '#374151' }}>{form.materials_shared}</div>
            : <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No materials added.</div>}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '10px 0' }} />
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <FieldLabel>Samples Distributed</FieldLabel>
            <button style={btnOutline}>⊕ Add Sample</button>
          </div>
          {form.samples_distributed
            ? <div style={{ fontSize: 13, color: '#374151' }}>{form.samples_distributed}</div>
            : <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No samples added.</div>}
        </div>
      </SectionCard>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Observed/Inferred HCP Sentiment</FieldLabel>
        <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
          {['Positive','Neutral','Negative'].map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
              <input type="radio" name="sentiment" value={s} checked={form.sentiment === s}
                onChange={() => dispatch(updateForm({ sentiment: s }))}
                style={{ accentColor: s === 'Positive' ? '#22c55e' : s === 'Negative' ? '#ef4444' : '#f59e0b' }} />
              {sentimentEmoji[s]} {s}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Outcomes</FieldLabel>
        <TextArea value={form.outcomes} onChange={e => dispatch(updateForm({ outcomes: e.target.value }))} placeholder="Key outcomes or agreements..." />
      </div>

      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Follow-up Actions</FieldLabel>
        <TextArea value={form.follow_up_actions} onChange={e => dispatch(updateForm({ follow_up_actions: e.target.value }))} placeholder="Enter next steps or tasks..." />
        {aiFollowUps && aiFollowUps.length > 0 && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>AI Suggested Follow-ups:</div>
            {aiFollowUps.map((f, i) => (
              <div key={i} style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer', marginBottom: 3, display: 'flex', alignItems: 'flex-start', gap: 4 }}
                onClick={() => dispatch(updateForm({ follow_up_actions: (form.follow_up_actions ? form.follow_up_actions + '\n' : '') + f }))}>
                <span>+</span><span>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button style={btnPrimary} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : savedId ? '✏️ Update Interaction' : '💾 Save Interaction'}
        </button>
        <button style={btnSecondary} onClick={() => dispatch(resetForm())}>Reset</button>
      </div>
      {saveSuccess && (
        <div style={{ marginTop: 10, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#166534' }}>
          ✅ Saved! (ID #{savedId})
        </div>
      )}
    </div>
  );
}

function ChatPanel({ onFollowUpsExtracted }) {
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector(s => s.chat);
  const { form, savedId } = useSelector(s => s.interaction);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    dispatch(addMessage({ role: 'user', text }));
    dispatch(setLoading(true));
    try {
      const res = await agentChat(text, savedId, form);
      const { message, extracted_data, action, interaction_id } = res.data;
      if (extracted_data && Object.keys(extracted_data).length > 0) {
        const clean = {};
        Object.entries(extracted_data).forEach(([k, v]) => { if (v && v !== 'null' && v !== null) clean[k] = v; });
        dispatch(updateForm(clean));
      }
      if (interaction_id) dispatch(setSavedId(interaction_id));
      const lines = message.split('\n').filter(l => /^[\*\-•]/.test(l.trim()));
      if (lines.length > 0 && onFollowUpsExtracted) onFollowUpsExtracted(lines.map(l => l.replace(/^[\*\-•]\s*/, '').trim()));
      const hint = action === 'log' ? ' ✅ Form auto-filled!' : action === 'edit' ? ' ✏️ Form updated!' : '';
      dispatch(addMessage({ role: 'ai', text: message + hint }));
    } catch (e) {
      dispatch(addMessage({ role: 'ai', text: '⚠️ Error connecting to AI. Make sure backend is running.' }));
    }
    dispatch(setLoading(false));
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)', borderLeft: '1px solid #e5e7eb', background: '#fff', position: 'sticky', top: 57 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🤖</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>AI Assistant</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Log interaction via chat</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#1d4ed8', lineHeight: 1.6 }}>
            Log interaction details here (e.g., "Met Dr. Smith, discussed Prodo-X efficacy, positive sentiment, shared brochure") or ask for help.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user'
            ? { background: '#1e40af', color: '#fff', borderRadius: '12px 12px 4px 12px', padding: '9px 13px', fontSize: 13, alignSelf: 'flex-end', maxWidth: '88%', lineHeight: 1.5 }
            : { background: '#f9fafb', border: '1px solid #e5e7eb', borderLeft: '3px solid #22c55e', borderRadius: '12px 12px 12px 4px', padding: '9px 13px', fontSize: 13, alignSelf: 'flex-start', maxWidth: '92%', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {m.text}
          </div>
        ))}
        {isLoading && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderLeft: '3px solid #22c55e', borderRadius: '12px 12px 12px 4px', padding: '9px 13px', fontSize: 13, alignSelf: 'flex-start', opacity: 0.7 }}>
            ⏳ Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #e5e7eb' }}>
        <input style={{ flex: 1, padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontFamily: 'Inter, sans-serif', fontSize: 13, outline: 'none' }}
          value={input} placeholder="Describe Interaction..."
          onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
        <button onClick={send} disabled={isLoading}
          style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 6, padding: '0 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          ▲ Log
        </button>
      </div>
    </div>
  );
}

function HistoryTab({ onEdit }) {
  const dispatch = useDispatch();
  const { interactions } = useSelector(s => s.interaction);
  if (!interactions.length) return <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>No interactions logged yet.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {interactions.map(i => (
        <SectionCard key={i.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{i.hcp_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{i.date}</div>
            </div>
            <span style={{ background: i.sentiment === 'Positive' ? '#dcfce7' : i.sentiment === 'Negative' ? '#fee2e2' : '#fef9c3', color: i.sentiment === 'Positive' ? '#166534' : i.sentiment === 'Negative' ? '#991b1b' : '#854d0e', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
              {sentimentEmoji[i.sentiment]} {i.sentiment}
            </span>
          </div>
          {i.topics_discussed && <div style={{ fontSize: 13, marginTop: 8 }}><strong>Topics:</strong> {i.topics_discussed}</div>}
          {i.outcomes && <div style={{ fontSize: 13, marginTop: 4 }}><strong>Outcomes:</strong> {i.outcomes}</div>}
          <button style={{ ...btnOutline, marginTop: 10 }}
            onClick={() => { dispatch(updateForm(i)); dispatch(setSavedId(i.id)); onEdit(); }}>✏️ Edit</button>
        </SectionCard>
      ))}
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('log');
  const [aiFollowUps, setAiFollowUps] = useState([]);
  const { interactions } = useSelector(s => s.interaction);

  useEffect(() => {
    listInteractions().then(res => dispatch(setInteractions(res.data))).catch(console.error);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>⚕</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1e40af' }}>CRM HCP Module</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ id: 'log', label: '📝 Log Interaction' }, { id: 'history', label: `📋 History (${interactions.length})` }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'history') listInteractions().then(r => dispatch(setInteractions(r.data))); }}
              style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid ' + (tab === t.id ? '#1e40af' : '#e5e7eb'), background: tab === t.id ? '#1e40af' : '#fff', color: tab === t.id ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'log' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 'calc(100vh - 57px)' }}>
          <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(100vh - 57px)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Log HCP Interaction</h2>
            <SectionCard>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 16 }}>Interaction Details</div>
              <LogForm aiFollowUps={aiFollowUps} />
            </SectionCard>
          </div>
          <ChatPanel onFollowUpsExtracted={setAiFollowUps} />
        </div>
      ) : (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Interaction History</h2>
          <HistoryTab onEdit={() => setTab('log')} />
        </div>
      )}
    </div>
  );
}

const btnPrimary = { background: '#1e40af', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 20px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13 };
const btnSecondary = { background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 6, padding: '9px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13 };
const btnOutline = { background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 };
