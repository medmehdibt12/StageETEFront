/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const typeLabel = { texte: 'Texte libre', radio: 'Choix unique', checkbox: 'Choix multiple', date: 'Date', select: 'Liste déroulante' };

const COLORS = ['#2E6DA4', '#7c3aed', '#f97316', '#16a34a', '#dc2626', '#0891b2', '#d97706'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', fontSize: '0.83rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{d.name}</div>
        <div style={{ color: '#6b7280' }}>{d.count} réponse{d.count > 1 ? 's' : ''} &bull; <strong style={{ color: '#2E6DA4' }}>{d.pct}%</strong></div>
      </div>
    );
  }
  return null;
};

const SurveyResultCard = ({ questionResult, index }) => {
  const { question, type, reponses, nbReponses } = questionResult;
  const [showAll, setShowAll] = useState(false);

  const isChart = ['radio', 'checkbox', 'select'].includes(type);
  const isTexte = type === 'texte';
  const isDate = type === 'date';

  const chartData = isChart
    ? (reponses || []).map(r => ({ name: r.label || r.valeur, count: r.count, pct: r.pourcentage || 0 }))
    : [];

  const textResponses = (reponses || []).map(r => r.valeur || r.label).filter(Boolean);
  const visibleTexts = showAll ? textResponses : textResponses.slice(0, 5);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        padding: '20px 24px',
        marginBottom: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        animation: 'fadeSlideIn 0.4s ease forwards',
        animationDelay: `${index * 80}ms`,
        opacity: 0
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-bar-fill {
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#2E6DA4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
              {index + 1}
            </span>
            <h6 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{question}</h6>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', padding: '2px 8px', background: '#f1f5f9', borderRadius: 6 }}>
            {typeLabel[type] || type}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2E6DA4' }}>{nbReponses}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>réponses</div>
        </div>
      </div>

      {/* Chart for radio / checkbox / select */}
      {isChart && chartData.length > 0 && (
        <div>
          {/* Custom horizontal progress bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chartData.map((item, i) => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.83rem', color: '#374151', fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: '0.83rem', color: '#6b7280' }}>
                    {item.count} &bull; <strong style={{ color: COLORS[i % COLORS.length] }}>{item.pct}%</strong>
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div
                    className="result-bar-fill"
                    style={{ height: '100%', borderRadius: 8, width: `${item.pct}%`, background: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recharts Bar Chart (optional visual) */}
          {chartData.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 44)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Text responses (free text) */}
      {isTexte && (
        <div>
          {textResponses.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucune réponse texte.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {visibleTexts.map((txt, i) => (
                <span key={i} style={{ padding: '6px 12px', borderRadius: 20, background: '#f1f5f9', color: '#374151', fontSize: '0.83rem', border: '1px solid #e2e8f0', maxWidth: '100%', wordBreak: 'break-word' }}>
                  "{txt}"
                </span>
              ))}
            </div>
          )}
          {textResponses.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{ marginTop: 10, border: 'none', background: 'none', color: '#2E6DA4', fontSize: '0.83rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              {showAll ? 'Voir moins' : `+${textResponses.length - 5} réponses de plus`}
            </button>
          )}
        </div>
      )}

      {/* Date responses */}
      {isDate && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(reponses || []).map((r, i) => (
            <span key={i} style={{ padding: '5px 12px', borderRadius: 20, background: '#eff6ff', color: '#2E6DA4', fontSize: '0.83rem', border: '1px solid #bfdbfe', fontWeight: 500 }}>
              📅 {r.valeur || r.label} {r.count > 1 && <strong>×{r.count}</strong>}
            </span>
          ))}
          {(!reponses || reponses.length === 0) && (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>Aucune réponse.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyResultCard;
