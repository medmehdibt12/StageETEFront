/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React from 'react';
import { Form } from 'react-bootstrap';


/**
 * SurveyQuestionRenderer — renders the appropriate input for a question type.
 * Used in the choriste survey form.
 *
 * Props:
 *  - question: { id, texte, type, options, obligatoire }
 *  - value: current answer value
 *  - onChange: (questionId, value) => void
 *  - readOnly: boolean (for readonly view)
 *  - error: string | undefined
 */
const SurveyQuestionRenderer = ({ question, value, onChange, readOnly = false, error }) => {
  const inputStyle = {
    borderRadius: 10,
    border: error ? '1.5px solid #dc2626' : '1.5px solid #e2e8f0',
    fontSize: '0.9rem',
    padding: '10px 14px',
    transition: 'border-color 0.2s'
  };

  const wrapStyle = {
    border: '1px dashed transparent', // Make it visible if needed for debugging: '#e2e8f0'
    padding: '4px',
    borderRadius: 12
  };


  return (
    <div style={wrapStyle}>
      {(() => {
        const hasOptions = question.options && question.options.length > 0;
        
        switch (question.type) {

    case 'texte':
      return (
        <div>
          <textarea
            rows={3}
            disabled={readOnly}
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder="Votre réponse..."
            style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
          />
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>}
        </div>
      );

    case 'radio':
      if (!hasOptions) return (
        <textarea rows={2} disabled={readOnly} value={value || ''} onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Répondez ici..." style={{ ...inputStyle, width: '100%' }} />
      );
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((opt) => {
            const selected = value === opt.valeur;
            return (
              <label
                key={opt.valeur}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: readOnly ? 'default' : 'pointer',
                  padding: '10px 16px', borderRadius: 10, border: selected ? '2px solid #2E6DA4' : '1.5px solid #e2e8f0',
                  background: selected ? '#eff6ff' : '#fff', transition: 'all 0.15s', userSelect: 'none'
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', border: selected ? '5px solid #2E6DA4' : '2px solid #9ca3af',
                  backgroundColor: '#fff', flexShrink: 0, transition: 'all 0.15s'
                }} />
                <input type="radio" name={question.id} value={opt.valeur} checked={selected} disabled={readOnly}
                  onChange={() => onChange(question.id, opt.valeur)} style={{ display: 'none' }} />
                <span style={{ fontSize: '0.88rem', color: '#1e293b' }}>{opt.label}</span>
              </label>
            );
          })}
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>{error}</div>}
        </div>
      );


    case 'checkbox':
      if (!hasOptions) return (
        <textarea rows={2} disabled={readOnly} value={value || ''} onChange={(e) => onChange(question.id, e.target.value)}
          placeholder="Répondez ici..." style={{ ...inputStyle, width: '100%' }} />
      );
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((opt) => {
            const vals = value || [];
            const checked = vals.includes(opt.valeur);
            return (
              <label
                key={opt.valeur}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: readOnly ? 'default' : 'pointer',
                  padding: '10px 16px', borderRadius: 10, border: checked ? '2px solid #2E6DA4' : '1.5px solid #e2e8f0',
                  background: checked ? '#eff6ff' : '#fff', transition: 'all 0.15s', userSelect: 'none'
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: 4, border: checked ? '2px solid #2E6DA4' : '2px solid #9ca3af',
                  backgroundColor: checked ? '#2E6DA4' : '#fff', flexShrink: 0, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>✓</span>}
                </span>
                <input type="checkbox" checked={checked} disabled={readOnly} style={{ display: 'none' }}
                  onChange={(e) => {
                    if (readOnly) return;
                    const newVals = e.target.checked ? [...vals, opt.valeur] : vals.filter(v => v !== opt.valeur);
                    onChange(question.id, newVals);
                  }} />
                <span style={{ fontSize: '0.88rem', color: '#1e293b' }}>{opt.label}</span>
              </label>
            );
          })}
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>{error}</div>}
        </div>
      );


    case 'date':
      return (
        <div>
          <input
            type="date"
            disabled={readOnly}
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            style={{ ...inputStyle, width: '100%', minHeight: '42px' }}
          />
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>}
        </div>
      );


    case 'time':
      return (
        <div>
          <input
            type="time"
            disabled={readOnly}
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>}
        </div>
      );

    case 'select':
      return (
        <div>
          <select
            disabled={readOnly}
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            style={{ ...inputStyle, width: '100%', background: '#fff' }}
          >
            <option value="">-- Sélectionnez une option --</option>
            {question.options?.map((opt) => (
              <option key={opt.valeur} value={opt.valeur}>{opt.label}</option>
            ))}
          </select>
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>}
        </div>
      );

    default:
      // Safety fallback: if type is unknown (like 'voyage' or 'disponibilite'), show a text area
      return (
        <div>
          <textarea
            rows={3}
            disabled={readOnly}
            value={value || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            placeholder="Votre réponse..."
            style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
          />
          {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>}
        </div>
      );

        }
      })()}
    </div>
  );
};


export default SurveyQuestionRenderer;
