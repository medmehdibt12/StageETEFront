/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React from 'react';
import { Form, Button } from 'react-bootstrap';

const QUESTION_TYPES = [
  { value: 'texte', label: '✍️ Texte libre' },
  { value: 'radio', label: '🔘 Choix unique (radio)' },
  { value: 'checkbox', label: '☑️ Choix multiple (checkbox)' },
  { value: 'date', label: '📅 Date' },
  { value: 'time', label: '🕒 Heure' },
  { value: 'select', label: '📋 Liste déroulante' }
];

const needsOptions = (type) => ['radio', 'checkbox', 'select'].includes(type);

const cardStyle = {
  background: '#fff',
  border: '1.5px solid #e2e8f0',
  borderRadius: 16,
  padding: '20px',
  marginBottom: 16,
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  transition: 'all 0.2s ease-in-out'
};

const inputStyle = {
  borderRadius: 10,
  border: '1.5px solid #e2e8f0',
  fontSize: '0.88rem',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.20s ease'
};

const slugify = (text) => 
  text.toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '');

const SurveyQuestionEditor = ({ questions, setQuestions }) => {
  const genId = () => `q${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: genId(),
      texte: '',
      type: 'texte',
      options: [],
      obligatoire: false
    }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      const updated = { ...q, [field]: value };
      // reset options when switching to non-option type
      if (field === 'type' && !needsOptions(value)) updated.options = [];
      // add initial option when switching to option type
      if (field === 'type' && needsOptions(value) && updated.options.length === 0) {
        updated.options = [{ valeur: 'option_1', label: 'Option 1' }];
      }
      return updated;
    }));
  };

  const moveQuestion = (idx, dir) => {
    setQuestions(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const addOption = (qIdx) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const n = q.options.length + 1;
      return { ...q, options: [...q.options, { valeur: `option_${n}`, label: `Option ${n}` }] };
    }));
  };

  const removeOption = (qIdx, oIdx) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIdx) };
    }));
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return {
        ...q,
        options: q.options.map((o, j) => {
          if (j !== oIdx) return o;
          const updated = { ...o, [field]: value };
          // ✨ Auto-generate 'valeur' if 'label' is updated
          if (field === 'label') {
            updated.valeur = slugify(value) || `opt_${oIdx + 1}`;
          }
          return updated;
        })
      };
    }));
  };

  return (
    <div>
      {questions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Aucune question ajoutée. Cliquez sur + pour commencer.</p>
        </div>
      )}

      {questions.map((q, idx) => (
        <div key={q.id} style={cardStyle}>
          {/* Question header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: '#2E6DA4', fontSize: '0.85rem' }}>Question {idx + 1}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} title="Monter"
                style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '1rem', padding: '2px 6px', borderRadius: 6 }}>
                ↑
              </button>
              <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} title="Descendre"
                style={{ background: 'none', border: 'none', cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === questions.length - 1 ? 0.3 : 1, fontSize: '1rem', padding: '2px 6px', borderRadius: 6 }}>
                ↓
              </button>
              <button onClick={() => removeQuestion(idx)} title="Supprimer"
                style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontSize: '0.85rem', fontWeight: 600 }}>
                🗑️
              </button>
            </div>
          </div>

          {/* Question text */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'block' }}>Texte de la question *</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Ex: Quelles dates vous conviennent ?"
              value={q.texte}
              onChange={e => updateQuestion(idx, 'texte', e.target.value)}
            />
          </div>

          {/* Type + Required row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'block' }}>Type de réponse</label>
              <select
                value={q.type}
                onChange={e => updateQuestion(idx, 'type', e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              >
                {QUESTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#374151', userSelect: 'none' }}>
                <div
                  onClick={() => updateQuestion(idx, 'obligatoire', !q.obligatoire)}
                  style={{
                    width: 38, height: 20, borderRadius: 10, background: q.obligatoire ? '#2E6DA4' : '#d1d5db',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: q.obligatoire ? 20 : 2, width: 16, height: 16,
                    borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                Obligatoire
                {q.obligatoire && <span style={{ color: '#dc2626', fontWeight: 700 }}>*</span>}
              </label>
            </div>
          </div>

          {/* Options for radio / checkbox / select */}
          {needsOptions(q.type) && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Options de réponse</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.7rem', fontWeight: 700, color: '#64748b' 
                    }}>
                      {oIdx + 1}
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        style={inputStyle}
                        placeholder="Texte de l'option..."
                        value={opt.label}
                        onChange={e => updateOption(idx, oIdx, 'label', e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => removeOption(idx, oIdx)}
                      style={{ 
                        background: '#fef2f2', border: '1.5px solid #fee2e2', color: '#ef4444', 
                        borderRadius: 8, width: 36, height: 36, display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                      title="Supprimer l'option"
                    >
                      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addOption(idx)}
                style={{ border: 'none', background: 'none', color: '#2E6DA4', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                + Ajouter une option
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addQuestion}
        style={{
          width: '100%', padding: '12px', border: '2px dashed #cbd5e1', borderRadius: 12, background: 'transparent',
          color: '#2E6DA4', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}
        onMouseEnter={e => {e.currentTarget.style.borderColor = '#2E6DA4'; e.currentTarget.style.background = '#eff6ff';}}
        onMouseLeave={e => {e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'transparent';}}
      >
        + Ajouter une question
      </button>
    </div>
  );
};

export default SurveyQuestionEditor;
