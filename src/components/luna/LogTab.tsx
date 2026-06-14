'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Droplets, Heart, Activity, Plus, X } from 'lucide-react';
import {
  formatDateChinese, FLOW_LABELS, MOOD_LABELS, MOOD_EMOJIS,
  DEFAULT_SYMPTOMS, parseDate,
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
  setSymptomSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<{ open: boolean; recordId: string; date: string }>>;
  cycleInfo: CycleInfo;
  themeColor: string;
}

export default function LogTab({
  today, logTab, setLogTab, currentFlow, setCurrentFlow,
  currentMood, setCurrentMood, selectedSymptoms, setSelectedSymptoms,
  customSymptoms, noteText, setNoteText, records, saveRecord,
  setSymptomSheetOpen, setDeleteConfirm, cycleInfo, themeColor,
}: LogTabProps) {
  const allSymptoms = [...DEFAULT_SYMPTOMS, ...customSymptoms];

  return (
    <motion.div
      key="log"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="px-5 pt-12 pb-6"
    >
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-2xl font-light" style={{ fontFamily: 'Georgia, serif' }}>健康记录</p>
        <p className="text-sm mt-1" style={{ color: '#a8a29e' }}>{formatDateChinese(today)}</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-[14px] p-1 mb-5" style={{ background: '#1a2027' }}>
        <button
          className={`flex-1 py-2.5 rounded-[10px] text-center text-sm font-medium transition-all ${logTab === 'record' ? 'text-[#f0ece4]' : 'text-[#6b7280]'}`}
          style={logTab === 'record' ? { background: '#232b35' } : {}}
          onClick={() => setLogTab('record')}>
          记录
        </button>
        <button
          className={`flex-1 py-2.5 rounded-[10px] text-center text-sm font-medium transition-all ${logTab === 'history' ? 'text-[#f0ece4]' : 'text-[#6b7280]'}`}
          style={logTab === 'history' ? { background: '#232b35' } : {}}
          onClick={() => setLogTab('history')}>
          历史记录
        </button>
      </div>

      {logTab === 'record' ? (
        <>
          {/* Flow Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={14} style={{ color: themeColor }} />
              <p className="text-sm font-medium">流量</p>
            </div>
            <div className="flex gap-2 justify-between">
              {[0, 1, 2, 3, 4].map(level => (
                <button
                  key={level}
                  className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl transition-all flex-1"
                  style={{
                    background: currentFlow === level ? `${themeColor}26` : '#1a2027',
                    border: currentFlow === level ? `1.5px solid ${themeColor}` : '1.5px solid rgba(255,255,255,0.06)',
                  }}
                  onClick={() => setCurrentFlow(level)}>
                  {level === 0 ? (
                    <div className="rounded-full transition-all flex items-center justify-center"
                      style={{
                        width: 18,
                        height: 18,
                        border: currentFlow === 0 ? `2px solid ${themeColor}` : '2px solid #4b5563',
                        background: 'transparent',
                        boxShadow: currentFlow === 0 ? `0 0 12px ${themeColor}60` : 'none',
                      }}>
                      <div style={{ width: 6, height: 2, background: currentFlow === 0 ? themeColor : '#4b5563', borderRadius: 1 }} />
                    </div>
                  ) : (
                    <div className="rounded-full transition-all"
                      style={{
                        width: 14 + level * 4,
                        height: 14 + level * 4,
                        background: currentFlow === level ? themeColor : '#4b5563',
                        boxShadow: currentFlow === level ? `0 0 12px ${themeColor}60` : 'none',
                      }} />
                  )}
                  <span className="text-xs" style={{ color: currentFlow === level ? themeColor : '#a8a29e' }}>
                    {FLOW_LABELS[level]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} style={{ color: '#d4a574' }} />
              <p className="text-sm font-medium">症状</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSymptoms.map(symptom => (
                <button
                  key={symptom}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: selectedSymptoms.includes(symptom) ? `${themeColor}26` : '#1a2027',
                    border: selectedSymptoms.includes(symptom) ? `1.5px solid ${themeColor}` : '1.5px solid rgba(255,255,255,0.06)',
                    color: selectedSymptoms.includes(symptom) ? themeColor : '#f0ece4',
                  }}
                  onClick={() => {
                    setSelectedSymptoms(prev =>
                      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
                    );
                  }}>
                  {symptom}
                </button>
              ))}
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: 'transparent', border: '1.5px dashed rgba(255,255,255,0.1)', color: '#6b7280' }}
                onClick={() => setSymptomSheetOpen(true)}>
                <Plus size={14} />
                自定义
              </button>
            </div>
          </div>

          {/* Mood Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} style={{ color: '#81b29a' }} />
              <p className="text-sm font-medium">情绪</p>
            </div>
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5, 6].map(mood => (
                <button
                  key={mood}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all flex-1"
                  style={{
                    background: currentMood === mood ? `${themeColor}26` : 'transparent',
                    border: currentMood === mood ? `1px solid ${themeColor}33` : '1px solid transparent',
                  }}
                  onClick={() => setCurrentMood(mood)}>
                  <span className='text-xl'>{MOOD_EMOJIS[mood]}</span>
                  <span className="text-[11px]" style={{ color: currentMood === mood ? themeColor : '#6b7280' }}>
                    {MOOD_LABELS[mood]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Note Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} style={{ color: '#a8a29e' }} />
              <p className="text-sm font-medium">备注</p>
            </div>
            <textarea
              className="w-full rounded-xl p-3 text-sm outline-none transition-all"
              style={{
                background: '#1a2027',
                border: '1.5px solid rgba(255,255,255,0.06)',
                color: '#f0ece4',
                resize: 'none',
              }}
              rows={3}
              placeholder="记录更多细节..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onFocus={e => e.currentTarget.style.borderColor = `${themeColor}40`}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            />
          </div>

          {/* Save Button */}
          <motion.button
            className="w-full py-4 rounded-2xl font-medium text-lg"
            style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`, color: '#0f1419' }}
            whileTap={{ scale: 0.97 }}
            onClick={saveRecord}
          >
            保存记录
          </motion.button>
        </>
      ) : (
        /* History Section */
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-12" style={{ color: '#6b7280' }}>
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p>暂无记录</p>
              <p className="text-xs mt-1">点击「记录」开始记录吧</p>
            </div>
          ) : (
            records.map(record => {
              const d = parseDate(record.date);
              const symptoms = JSON.parse(record.symptoms || '[]');
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = record.date === todayStr;
              return (
                <motion.div
                  key={record.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: isToday ? `${themeColor}14` : '#232b35',
                    border: isToday ? `1px solid ${themeColor}33` : '1px solid rgba(255,255,255,0.06)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{d.getMonth() + 1}月{d.getDate()}日</span>
                      {isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${themeColor}33`, color: themeColor }}>
                          今天
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: '#6b7280' }}>
                        {MOOD_EMOJIS[record.mood]} {MOOD_LABELS[record.mood]}
                      </span>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                        style={{ background: 'rgba(239,68,68,0.08)' }}
                        onClick={() => setDeleteConfirm({ open: true, recordId: record.id, date: record.date })}>
                        <X size={12} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs" style={{ color: '#6b7280' }}>流量:</span>
                    {record.flow === 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: `${themeColor}1a`, color: themeColor }}>
                        {FLOW_LABELS[0]}
                      </span>
                    ) : (
                      <>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(l => (
                            <div key={l} className="w-2 rounded-full" style={{
                              height: 6 + l * 2,
                              background: l <= record.flow ? themeColor : 'rgba(255,255,255,0.06)',
                            }} />
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: themeColor }}>{FLOW_LABELS[record.flow]}</span>
                      </>
                    )}
                  </div>
                  {symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {symptoms.map((s: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: `${themeColor}1a`, color: themeColor }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {record.note && (
                    <p className="text-xs mt-2" style={{ color: '#a8a29e' }}>{record.note}</p>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
}
