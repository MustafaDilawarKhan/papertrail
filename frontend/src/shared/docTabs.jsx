// Open-document tab system for the Library reader.
// State lives in localStorage so tabs persist across reloads and navigations.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon, navigate } from './components';

const STORAGE_KEY = 'pt.openTabs.v1';
const MAX_TABS = 20;

// ─── Storage helpers ──────────────────────────────────────────────────────────
function readTabs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function writeTabs(tabs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs)); } catch {}
  // Notify other hook instances in the same tab.
  window.dispatchEvent(new CustomEvent('pt:tabs-changed'));
}

// ─── Imperative API (usable outside React) ────────────────────────────────────
export function openTabImperative(doc) {
  if (!doc?.id) return;
  const prev = readTabs();
  const exists = prev.find(t => t.id === doc.id);
  let next;
  if (exists) {
    next = prev.map(t => t.id === doc.id ? { ...t, ...doc } : t);
  } else {
    next = [...prev, { id: doc.id, name: doc.name || 'Untitled', type: doc.type || 'DOC', openedAt: Date.now() }].slice(-MAX_TABS);
  }
  writeTabs(next);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDocTabs(activeId) {
  const [tabs, setTabs] = useState(readTabs);

  useEffect(() => {
    const onChange = () => setTabs(readTabs());
    window.addEventListener('pt:tabs-changed', onChange);
    window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) onChange(); });
    return () => {
      window.removeEventListener('pt:tabs-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const openTab = useCallback((doc) => {
    if (!doc?.id) return;
    setTabs(prev => {
      const exists = prev.find(t => t.id === doc.id);
      let next;
      if (exists) {
        next = prev.map(t => t.id === doc.id ? { ...t, ...doc } : t);
      } else {
        next = [...prev, { id: doc.id, name: doc.name || 'Untitled', type: doc.type || 'DOC', openedAt: Date.now() }].slice(-MAX_TABS);
      }
      writeTabs(next);
      return next;
    });
  }, []);

  const closeTab = useCallback((id) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const next = prev.filter(t => t.id !== id);
      writeTabs(next);
      // If closing the active tab, navigate to neighbor (or library).
      if (id === activeId) {
        const neighbor = next[idx] || next[idx - 1];
        if (neighbor) navigate(`/library/doc/${neighbor.id}`);
        else navigate('/library');
      }
      return next;
    });
  }, [activeId]);

  const reorderTab = useCallback((fromIdx, toIdx) => {
    setTabs(prev => {
      if (fromIdx === toIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, moved);
      writeTabs(next);
      return next;
    });
  }, []);

  const closeAll = useCallback(() => { writeTabs([]); setTabs([]); navigate('/library'); }, []);

  return { tabs, openTab, closeTab, reorderTab, closeAll };
}

// ─── File-type icon + colour ──────────────────────────────────────────────────
function typeMeta(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'PDF')   return { icon: 'picture_as_pdf', color: '#ef4444', bg: '#fef2f2' };
  if (t === 'DOCX' || t === 'DOC') return { icon: 'description',   color: '#2563eb', bg: '#eff6ff' };
  if (t === 'MD')    return { icon: 'article',        color: '#0891b2', bg: '#ecfeff' };
  if (t === 'TXT')   return { icon: 'notes',          color: '#64748b', bg: '#f1f5f9' };
  if (t === 'IPYNB') return { icon: 'code',           color: '#f59e0b', bg: '#fffbeb' };
  if (t === 'PPTX' || t === 'PPT') return { icon: 'slideshow',     color: '#dc2626', bg: '#fef2f2' };
  if (t === 'XLSX' || t === 'XLS' || t === 'CSV') return { icon: 'table_chart', color: '#16a34a', bg: '#f0fdf4' };
  return { icon: 'insert_drive_file', color: '#64748b', bg: '#f1f5f9' };
}

// ─── Tab bar component ────────────────────────────────────────────────────────
export function DocTabBar({ activeId, tabs, onClose, onReorder }) {
  const scrollRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  // Auto-scroll active tab into view when it changes.
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-tab-id="${activeId}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  // Keyboard shortcuts: Cmd/Ctrl+W close, Cmd/Ctrl+Tab cycle.
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === 'w' && activeId) {
        e.preventDefault();
        onClose(activeId);
      } else if (e.key === 'Tab' && tabs.length > 1) {
        e.preventDefault();
        const i = tabs.findIndex(t => t.id === activeId);
        const next = e.shiftKey ? (i - 1 + tabs.length) % tabs.length : (i + 1) % tabs.length;
        navigate(`/library/doc/${tabs[next].id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, tabs, onClose]);

  if (!tabs.length) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: '#f7f8fa', borderBottom: '1px solid #e5e7eb',
      height: 44, paddingLeft: 8, paddingRight: 8,
      flexShrink: 0,
    }}>
      <div ref={scrollRef} style={{
        display: 'flex', alignItems: 'flex-end', gap: 2,
        flex: 1, overflowX: 'auto', overflowY: 'hidden',
        scrollbarWidth: 'thin', paddingTop: 6,
      }}>
        {tabs.map((tab, idx) => (
          <DocTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeId}
            isDragging={dragIdx === idx}
            isDragOver={overIdx === idx && dragIdx !== null && dragIdx !== idx}
            onSelect={() => navigate(`/library/doc/${tab.id}`)}
            onClose={() => onClose(tab.id)}
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); if (overIdx !== idx) setOverIdx(idx); }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== idx) onReorder(dragIdx, idx);
              setDragIdx(null); setOverIdx(null);
            }}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            onMiddleClick={() => onClose(tab.id)}
          />
        ))}
      </div>
      <button
        title="Open another document"
        onClick={() => navigate('/library')}
        style={{
          alignSelf: 'center', width: 28, height: 28, marginLeft: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 7,
          cursor: 'pointer', color: '#6b7280',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; }}
      >
        <Icon name="add" size={16} />
      </button>
    </div>
  );
}

function DocTab({ tab, isActive, isDragging, isDragOver, onSelect, onClose, onDragStart, onDragOver, onDrop, onDragEnd, onMiddleClick }) {
  const [hov, setHov] = useState(false);
  const meta = typeMeta(tab.type);
  return (
    <div
      data-tab-id={tab.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseDown={(e) => { if (e.button === 1) { e.preventDefault(); onMiddleClick(); } }}
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 8,
        height: 36, paddingLeft: 10, paddingRight: 6,
        minWidth: 140, maxWidth: 220,
        background: isActive ? '#fff' : hov ? '#eef0f3' : 'transparent',
        borderTopLeftRadius: 8, borderTopRightRadius: 8,
        border: '1px solid',
        borderColor: isActive ? '#e5e7eb' : 'transparent',
        borderBottomColor: isActive ? '#fff' : 'transparent',
        marginBottom: -1,
        boxShadow: isActive ? '0 -1px 0 #4A7CFF inset' : 'none',
        cursor: 'pointer',
        flexShrink: 0,
        opacity: isDragging ? 0.4 : 1,
        transition: 'background 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {isDragOver && (
        <div style={{
          position: 'absolute', left: -2, top: 4, bottom: 4, width: 2,
          background: '#4A7CFF', borderRadius: 2,
        }} />
      )}
      {/* File icon chip */}
      <div style={{
        width: 18, height: 18, borderRadius: 4,
        background: meta.bg, color: meta.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={meta.icon} size={12} />
      </div>
      {/* Title + type */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: 12, fontWeight: isActive ? 600 : 500,
          color: isActive ? '#111827' : '#374151',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.15,
        }}>{tab.name}</div>
        <div style={{
          fontSize: 9, fontWeight: 600,
          color: isActive ? meta.color : '#9ca3af',
          letterSpacing: '0.05em', textTransform: 'uppercase',
          lineHeight: 1.1, marginTop: 1,
        }}>{tab.type}</div>
      </div>
      {/* Close */}
      <button
        title="Close (Ctrl+W)"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          width: 18, height: 18, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', borderRadius: 4, cursor: 'pointer',
          background: 'transparent', color: '#9ca3af',
          opacity: isActive || hov ? 1 : 0,
          transition: 'opacity 0.12s ease, background 0.12s ease',
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#111827'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}
