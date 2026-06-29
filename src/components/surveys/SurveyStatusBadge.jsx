/* eslint-disable prettier/prettier */
import React from 'react';
import { Badge } from 'react-bootstrap';

const statusConfig = {
  brouillon: { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  actif: { label: 'Actif', color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  clos: { label: 'Clôturé', color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' }
};

const SurveyStatusBadge = ({ statut, pulse = false, size = 'sm' }) => {
  const config = statusConfig[statut] || statusConfig.brouillon;
  const isActive = statut === 'actif';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        borderRadius: '20px',
        border: `1px solid ${config.border}`,
        backgroundColor: config.bg,
        color: config.color,
        fontSize: size === 'sm' ? '0.75rem' : '0.85rem',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      {pulse && isActive && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            display: 'inline-block',
            boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
            animation: 'surveyPulse 1.5s ease-in-out infinite'
          }}
        />
      )}
      {statut === 'brouillon' && '📝'}
      {statut === 'actif' && !pulse && '✅'}
      {statut === 'clos' && '🔒'}
      {' '}{config.label}
      <style>{`
        @keyframes surveyPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 0 5px rgba(34,197,94,0.1); }
        }
      `}</style>
    </span>
  );
};

export default SurveyStatusBadge;
