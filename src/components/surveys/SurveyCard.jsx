/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import SurveyStatusBadge from './SurveyStatusBadge';

const typeConfig = {
  disponibilite: { emoji: '📅', label: 'Disponibilité', color: '#2E6DA4', bg: '#dbeafe' },
  voyage: { emoji: '✈️', label: 'Voyage', color: '#7c3aed', bg: '#ede9fe' },
  restaurant: { emoji: '🍽️', label: 'Restaurant', color: '#c2410c', bg: '#ffedd5' },
  autre: { emoji: '📝', label: 'Personnalisé', color: '#4b5563', bg: '#f3f4f6' }
};

const SurveyCard = ({ survey, onPublish, onClore, onDelete, onEdit, isAdmin = true }) => {
  const navigate = useNavigate();
  const type = typeConfig[survey.type] || typeConfig.autre;
  const { statut } = survey;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  const isExpiringSoon = survey.dateFin && (() => {
    const diff = new Date(survey.dateFin) - new Date();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  })();

  return (
    <Card
      className="h-100 border-0 shadow-sm"
      style={{
        borderRadius: 16,
        transition: 'transform 0.2s, box-shadow 0.2s',
        overflow: 'hidden',
        cursor: 'default'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.08)'; }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, background: type.color, borderRadius: '16px 16px 0 0' }} />

      <Card.Body className="d-flex flex-column p-3 p-md-4" style={{ gap: 12 }}>
        {/* Type badge + Status */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
            borderRadius: 20, background: type.bg, color: type.color, fontSize: '0.75rem', fontWeight: 600
          }}>
            {type.emoji} {type.label}
          </span>
          <SurveyStatusBadge statut={statut} pulse />
        </div>

        {/* Title */}
        <div>
          <h5 className="fw-bold mb-1" style={{ fontSize: '1rem', color: '#1e293b', lineHeight: 1.3 }}>
            {survey.titre}
          </h5>
          {survey.description && (
            <p className="text-muted mb-0" style={{ fontSize: '0.83rem', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {survey.description}
            </p>
          )}
        </div>

        {/* Meta info */}
        <div className="d-flex flex-wrap gap-2">
          {survey.dateFin && (
            <span style={{
              fontSize: '0.75rem',
              color: isExpiringSoon ? '#dc2626' : '#6b7280',
              fontWeight: isExpiringSoon ? 600 : 400
            }}>
              {isExpiringSoon ? '⚠️ ' : '📅 '}
              Clôture : {formatDate(survey.dateFin)}
            </span>
          )}
          {survey.ciblePupitres?.length > 0 ? (
            <div className="d-flex flex-wrap gap-1">
              {survey.ciblePupitres.map(p => (
                <span key={p} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12,
                  background: '#e0e7ff', color: '#4338ca', fontWeight: 500 }}>
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>👥 Tous les choristes</span>
          )}
        </div>

        {/* Already answered badge (choriste view) */}
        {!isAdmin && survey._dejaRepondu && (
          <div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem',
              background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
              ✓ Répondu
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-grow-1" />

        {/* Actions */}
        {isAdmin ? (
          <div className="d-flex flex-wrap gap-2 pt-2 border-top">
            {statut === 'brouillon' && (
              <>
                <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.78rem' }} onClick={() => onEdit?.(survey)}>
                  Modifier
                </Button>
                <Button size="sm" variant="success" style={{ fontSize: '0.78rem' }} onClick={() => onPublish?.(survey)}>
                  Publier
                </Button>
                <Button size="sm" variant="outline-danger" style={{ fontSize: '0.78rem' }} onClick={() => onDelete?.(survey)}>
                  🗑️
                </Button>
              </>
            )}
            {statut === 'actif' && (
              <>
                <Button size="sm" style={{ fontSize: '0.78rem', background: '#2E6DA4', border: 'none', color: '#fff' }}
                  onClick={() => navigate(`/admin/surveys/${survey._id}/resultats`)}>
                  📊 Voir résultats
                </Button>
                <Button size="sm" variant="outline-danger" style={{ fontSize: '0.78rem' }} onClick={() => onClore?.(survey)}>
                  🔒 Clôturer
                </Button>
              </>
            )}
            {statut === 'clos' && (
              <Button size="sm" variant="outline-secondary" style={{ fontSize: '0.78rem' }}
                onClick={() => navigate(`/admin/surveys/${survey._id}/resultats`)}>
                📊 Voir résultats
              </Button>
            )}
          </div>
        ) : (
          <div className="pt-2 border-top">
            {survey._dejaRepondu ? (
              <Button size="sm" variant="outline-secondary" className="w-100" style={{ fontSize: '0.83rem' }}
                onClick={() => navigate(`/choriste/sondages/${survey._id}/repondre`)}>
                👁️ Voir mes réponses
              </Button>
            ) : (
              <Button size="sm" className="w-100" style={{ fontSize: '0.83rem', background: '#2E6DA4', border: 'none' }}
                onClick={() => navigate(`/choriste/sondages/${survey._id}/repondre`)}>
                📝 Répondre
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SurveyCard;
