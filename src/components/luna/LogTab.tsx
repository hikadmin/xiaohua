'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Droplets, Heart, Activity, Plus,
  ChevronLeft, ChevronRight, Search, Calendar, Edit3, Trash2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  FLOW_LABELS, MOOD_LABELS, MOOD_EMOJIS,
  DEFAULT_SYMPTOMS, parseDate, formatDateStr,
  type DailyRecord, type CycleInfo,
} from './shared';

interface LogTabProps {
  today: Date;
  logTab: 'record' | 'history';
  setLogTab: React.Dispatch<React.SetStateAction<'record' | 'history'>>;
  currentFlow: number;
  setCurrentFlow: React.Dispatch<React.SetStateAction<number>>;
  currentMood: number;
  setCurrentMood: React.Dispatch<React.SetStateAction<number>>;
  selectedSymptoms: string[];
  setSelectedSymptoms: React.Dispatch<React.SetStateAction<string[]>>;
  customSymptoms: string[];
  noteText: string;
  setNoteText: React.Dispatch<React.SetStateAction<string>>;
  records: DailyRecord[];
  saveRecord: () => void;
  saveRecordForDate: (date: string) => void;
  updateRecord: (date: string) => void;
  setSymptomSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<{ open: boolean; recordId: string; date: string }>>;
  cycleInfo: CycleInfo;
  editingDate: string | null;
  setEditingDate: React.Dispatch<React.SetStateAction<string | null>>;
  selectedDate: string;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
}

function MiniCalendar({ selectedDate, onSelectDate, today }: {
  selectedDate: string; onSelectDate: (d: string) => void; today: Date;
}) {
  const { t } = useI18n();
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth() + 1);
  const weekdays = [t('week_sun'), t('week_mon'), t('week_tue'), t('week_wed'), t('week_thu'), t('week_fri'), t('week_sat')];
  const firstDay = new Date(vy, vm - 1, 1);
  const startDow = firstDay.getDay();
  const totalDays = new Date(vy, vm, 0).getDate();
  const todayStr = formatDateStr(today);
  const prev = () => { if (vm === 1) { setVm(12); setVy(vy - 1); } else setVm(vm - 1); };
  const next = () => { if (vm === 12) { setVm(1); setVy(vy + 1); } else setVm(vm + 1); };

  return (
    <div className="rounded-2xl p-3 mb-4" style={{ background: '#1a2027', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}><ChevronLeft size={16} style={{ color: '#a8a29e' }} /></button>
        <span className="text-sm font-medium">{vy}年{vm}月</span>
        <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}><ChevronRight size={16} style={{ color: '#a8a29e' }} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((w, i) => <div key={i} className="text-center text-[10px] py-1" style={{ color: '#6b7280' }}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const ds = `${vy}-${String(vm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSel = ds === selectedDate;
          const isT = ds === todayStr;
          return (
            <button key={day} className="aspect-square rounded-lg flex items-center justify-center text-xs transition-all relative"
              style={{ background: isSel ? '#e07a5f' : isT ? 'rgba(224,122,95,0.15)' : 'transparent', color: isSel ? '#0f1419' : isT ? '#e07a5f' : '#f0ece4', fontWeight: isSel || isT ? 700 : 400 }}
              onClick={() => onSelectDate(ds)}>
              {day}
              {isT && !isSel && <div className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ background: '#e07a5f' }} />}
            </button>
          );
        })}
      </div>
      <button className="w-full mt-2 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(224,122,95,0.1)', color: '#e07a5f' }} onClick={() => onSelectDate(todayStr)}>{t('log_today')}</button>
    </div>
  );
}

export default function LogTab({
  today, logTab, setLogTab, currentFlow, setCurrentFlow,
  currentMood, setCurrentMood, selectedSymptoms, setSelectedSymptoms,
  customSymptoms, noteText, setNoteText, records, saveRecord,
  saveRecordForDate, updateRecord, setSymptomSheetOpen, setDeleteConfirm,
  cycleInfo, editingDate, setEditingDate, selectedDate, setSelectedDate,
}: LogTabProps) {
  const { t } = useI18n();
  const allSymptoms = [...DEFAULT_SYMPTOMS, ...customSymptoms];
  const [historySearch, setHistorySearch] = useState('');
  const [filterYear, setFilterYear] = useState<number>(today.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const filteredRecords = useMemo(() => {
    let r = [...records];
    r = r.filter(x => parseInt(x.date.split('-')[0]) === filterYear);
    if (filterMonth > 0) r = r.filter(x => parseInt(x.date.split('-')[1]) === filterMonth);
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      r = r.filter(x => {
        const sym = JSON.parse(x.symptoms || '[]').join(' ').toLowerCase();
        return x.date.includes(q) || sym.includes(q) || (x.note || '').toLowerCase().includes(q) || MOOD_LABELS[x.mood]?.toLowerCase().includes(q) || FLOW_LABELS[x.flow]?.toLowerCase().includes(q);
      });
    }
    return r;
  }, [records, filterYear, filterMonth, historySearch]);

  const availableYears = useMemo(() => {
    const s = new Set(records.map(r => parseInt(r.date.split('-')[0])));
    s.add(today.getFullYear());
    return Array.from(s).sort((a, b) => b - a);
  }, [records, today]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowCalendar(false);
    const existing = records.find(r => r.date === date);
    if (existing) setEditingDate(date);
    else setEditingDate(null);
  };

  const handleSave = () => {
    if (editingDate) updateRecord(selectedDate);
    else if (selectedDate !== formatDateStr(today)) saveRecordForDate(selectedDate);
    else saveRecord();
  };

  const handleEditHistory = (rec: DailyRecord) => {
    setEditingDate(rec.date);
    setSelectedDate(rec.date);
    setLogTab('record');
  };

  const fl = [t('log_flow_none'), t('log_flow_spotting'), t('log_flow_light'), t('log_flow_medium'), t('log_flow_heavy')];
  const ml = ['', t('log_mood_happy'), t('log_mood_calm'), t('log_mood_shy'), t('log_mood_sad'), t('log_mood_irritable'), t('log_mood_anxious')];
  const sl: Record<string, string> = { '痛经': t('log_symptom_cramps'), '腰酸': t('log_symptom_backache'), '头痛': t('log_symptom_headache'), '疲劳': t('log_symptom_fatigue'), '腹胀': t('log_symptom_bloating'), '乳房胀痛': t('log_symptom_breast') };
  const sd = parseDate(selectedDate);
  const isToday = selectedDate === formatDateStr(today);

  return (
    <motion.div key="log" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="px-5 pt-12 pb-6">
      <div className="text-center mb-4">
        <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{t('log_health_record')}</p>
        <p className="text-sm mt-1" style={{ color: '#a8a29e' }}>{isToday ? t('log_today') : `${sd.getMonth() + 1}月${sd.getDate()}日`}</p>
      </div>
      <div className="flex rounded-[14px] p-1 mb-5" style={{ background: '#1a2027' }}>
        <button className={`flex-1 py-2.5 rounded-[10px] text-center text-sm font-medium transition-all ${logTab === 'record' ? 'text-[#f0ece4]' : 'text-[#6b7280]'}`} style={logTab === 'record' ? { background: '#232b35' } : {}} onClick={() => setLogTab('record')}>{t('log_record')}</button>
        <button className={`flex-1 py-2.5 rounded-[10px] text-center text-sm font-medium transition-all ${logTab === 'history' ? 'text-[#f0ece4]' : 'text-[#6b7280]'}`} style={logTab === 'history' ? { background: '#232b35' } : {}} onClick={() => setLogTab('history')}>{t('log_history')}</button>
      </div>

      {logTab === 'record' ? (
        <>
          {/* Date Selector */}
          <div className="mb-5">
            <button className="w-full flex items-center justify-between p-3.5 rounded-2xl" style={{ background: '#1a2027', border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => setShowCalendar(!showCalendar)}>
              <div className="flex items-center gap-2"><Calendar size={16} style={{ color: '#e07a5f' }} /><span className="text-sm">{t('log_select_date')}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: editingDate ? '#e07a5f' : '#f0ece4' }}>{isToday ? t('log_today') : `${sd.getMonth() + 1}月${sd.getDate()}日`}</span>
                {editingDate && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(224,122,95,0.2)', color: '#e07a5f' }}>{t('log_edit_record')}</span>}
                <ChevronRight size={16} style={{ color: '#6b7280', transform: showCalendar ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </button>
            <AnimatePresence>{showCalendar && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"><MiniCalendar selectedDate={selectedDate} onSelectDate={handleSelectDate} today={today} /></motion.div>}</AnimatePresence>
          </div>

          {/* Flow */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3"><Droplets size={14} style={{ color: '#e07a5f' }} /><p className="text-sm font-medium">{t('log_flow')}</p></div>
            <div className="flex gap-2 justify-between">
              {[0, 1, 2, 3, 4].map(level => (
                <button key={level} className="flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all flex-1" style={{ background: currentFlow === level ? 'rgba(224,122,95,0.15)' : '#1a2027', border: currentFlow === level ? '1.5px solid #e07a5f' : '1.5px solid rgba(255,255,255,0.06)' }} onClick={() => setCurrentFlow(level)}>
                  {level === 0 ? (
                    <div className="rounded-full transition-all flex items-center justify-center" style={{ width: 20, height: 20, background: 'transparent', border: currentFlow === 0 ? '2px solid #e07a5f' : '2px solid #4b5563', boxShadow: currentFlow === 0 ? '0 0 12px #e07a5f60' : 'none' }}>
                      <div className="rounded-full" style={{ width: 6, height: 6, background: currentFlow === 0 ? '#e07a5f' : 'transparent' }} />
                    </div>
                  ) : (
                    <div className="rounded-full transition-all" style={{ width: 14 + level * 4, height: 14 + level * 4, background: currentFlow === level ? '#e07a5f' : '#4b5563', boxShadow: currentFlow === level ? '0 0 12px #e07a5f60' : 'none' }} />
                  )}
                  <span className="text-[11px]" style={{ color: currentFlow === level ? '#e07a5f' : '#a8a29e' }}>{fl[level]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3"><Heart size={14} style={{ color: '#d4a574' }} /><p className="text-sm font-medium">{t('log_symptoms')}</p></div>
            <div className="flex flex-wrap gap-2">
              {allSymptoms.map(s => (
                <button key={s} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all" style={{ background: selectedSymptoms.includes(s) ? 'rgba(224,122,95,0.15)' : '#1a2027', border: selectedSymptoms.includes(s) ? '1.5px solid #e07a5f' : '1.5px solid rgba(255,255,255,0.06)', color: selectedSymptoms.includes(s) ? '#e07a5f' : '#f0ece4' }} onClick={() => setSelectedSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}>{sl[s] || s}</button>
              ))}
              <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm" style={{ background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.1)', color: '#6b7280' }} onClick={() => setSymptomSheetOpen(true)}><Plus size={14} />{t('log_custom_symptom')}</button>
            </div>
          </div>

          {/* Mood */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3"><Activity size={14} style={{ color: '#81b29a' }} /><p className="text-sm font-medium">{t('log_mood')}</p></div>
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5, 6].map(m => (
                <button key={m} className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all flex-1" style={{ background: currentMood === m ? 'rgba(224,122,95,0.15)' : 'transparent', border: currentMood === m ? '1px solid rgba(224,122,95,0.2)' : '1px solid transparent' }} onClick={() => setCurrentMood(m)}>
                  <span className="text-xl">{MOOD_EMOJIS[m]}</span>
                  <span className="text-[11px]" style={{ color: currentMood === m ? '#e07a5f' : '#6b7280' }}>{ml[m]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3"><FileText size={14} style={{ color: '#a8a29e' }} /><p className="text-sm font-medium">{t('log_note')}</p></div>
            <textarea className="w-full rounded-xl p-3 text-sm outline-none transition-all" style={{ background: '#1a2027', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4', resize: 'none' }} rows={3} placeholder={t('log_note_placeholder')} value={noteText} onChange={e => setNoteText(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'} />
          </div>

          <motion.button className="w-full py-4 rounded-2xl font-medium text-lg" style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)', color: '#0f1419' }} whileTap={{ scale: 0.97 }} onClick={handleSave}>
            {editingDate ? t('log_record_updated') : t('log_save')}
          </motion.button>
        </>
      ) : (
        <div>
          {/* Search */}
          <div className="mb-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6b7280' }} />
            <input type="text" className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#1a2027', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }} placeholder={t('log_search')} value={historySearch} onChange={e => setHistorySearch(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'} onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'} />
          </div>
          {/* Year/Month Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <select className="px-3 py-2 rounded-xl text-sm outline-none appearance-none cursor-pointer" style={{ background: '#1a2027', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }} value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
              {availableYears.map(y => <option key={y} value={y} style={{ background: '#1a2027' }}>{y}</option>)}
            </select>
            <select className="px-3 py-2 rounded-xl text-sm outline-none appearance-none cursor-pointer" style={{ background: '#1a2027', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }} value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
              <option value={0} style={{ background: '#1a2027' }}>{t('log_filter_all')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m} style={{ background: '#1a2027' }}>{m}月</option>)}
            </select>
            <div className="flex items-center px-3 py-2 rounded-xl text-xs flex-shrink-0" style={{ background: 'rgba(224,122,95,0.1)', color: '#e07a5f' }}>{filteredRecords.length} {t('common_days')}</div>
          </div>
          {/* Records */}
          <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#6b7280' }}><FileText size={40} className="mx-auto mb-3 opacity-30" /><p>{t('log_no_records')}</p><p className="text-xs mt-1">{t('log_no_records_tip')}</p></div>
            ) : filteredRecords.map(rec => {
              const d = parseDate(rec.date);
              const syms = JSON.parse(rec.symptoms || '[]');
              const isT = rec.date === formatDateStr(new Date());
              return (
                <motion.div key={rec.id} className="rounded-2xl p-4" style={{ background: isT ? 'rgba(224,122,95,0.08)' : '#232b35', border: isT ? '1px solid rgba(224,122,95,0.2)' : '1px solid rgba(255,255,255,0.06)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{d.getMonth() + 1}月{d.getDate()}日</span>
                      {isT && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(224,122,95,0.2)', color: '#e07a5f' }}>{t('log_today')}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: '#6b7280' }}>{MOOD_EMOJIS[rec.mood]} {ml[rec.mood]}</span>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 active:scale-90" style={{ background: 'rgba(224,122,95,0.08)' }} onClick={() => handleEditHistory(rec)}><Edit3 size={12} style={{ color: '#e07a5f' }} /></button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 active:scale-90" style={{ background: 'rgba(239,68,68,0.08)' }} onClick={() => setDeleteConfirm({ open: true, recordId: rec.id, date: rec.date })}><Trash2 size={12} style={{ color: '#ef4444' }} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs" style={{ color: '#6b7280' }}>{t('log_flow')}:</span>
                    <div className="flex gap-1">{rec.flow === 0 ? <div className="w-2 rounded-full" style={{ height: 8, background: 'rgba(224,122,95,0.3)', border: '1px dashed #e07a5f' }} /> : [1,2,3,4].map(l => <div key={l} className="w-2 rounded-full" style={{ height: 6+l*2, background: l <= rec.flow ? '#e07a5f' : 'rgba(255,255,255,0.06)' }} />)}</div>
                    <span className="text-xs" style={{ color: '#e07a5f' }}>{fl[rec.flow]}</span>
                  </div>
                  {syms.length > 0 && <div className="flex flex-wrap gap-1.5 mb-1">{syms.map((s: string, i: number) => <span key={i} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(224,122,95,0.1)', color: '#e07a5f' }}>{sl[s] || s}</span>)}</div>}
                  {rec.note && <p className="text-xs mt-2" style={{ color: '#a8a29e' }}>{rec.note}</p>}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
