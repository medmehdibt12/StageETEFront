/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { getSurveyResultats, updateSurveyStatut } from '../../../services/survey.service';
import SurveyResultCard from '../../../components/surveys/SurveyResultCard';
import SurveyStatusBadge from '../../../components/surveys/SurveyStatusBadge';

const typeConfig = {
  disponibilite: { emoji: '📅', label: 'Disponibilité', color: '#2E6DA4', bg: '#dbeafe' },
  voyage: { emoji: '✈️', label: 'Voyage', color: '#7c3aed', bg: '#ede9fe' },
  restaurant: { emoji: '🍽️', label: 'Restaurant', color: '#c2410c', bg: '#ffedd5' },
  autre: { emoji: '📝', label: 'Personnalisé', color: '#4b5563', bg: '#f3f4f6' }
};

const KpiCard = ({ emoji, label, value, sub, color }) => (
  <div style={{
    background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16
  }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
      {emoji}
    </div>
    <div>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const SurveyResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await getSurveyResultats(id);
        setData(res);
      } catch {
        toast.error('Impossible de charger les résultats.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  const handleClore = async () => {
    const result = await Swal.fire({
      title: 'Clôturer ce sondage ?',
      text: 'Les choristes ne pourront plus répondre.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🔒 Clôturer'
    });
    if (!result.isConfirmed) return;
    try {
      await updateSurveyStatut(id, 'clos');
      toast.success('Sondage clôturé.');
      setData(prev => prev ? { ...prev, survey: { ...prev.survey, statut: 'clos' } } : prev);
    } catch {
      toast.error('Erreur lors de la clôture.');
    }
  };

  const handleExport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spinner animation="border" style={{ color: '#2E6DA4' }} />
        <p style={{ color: '#9ca3af', marginTop: 12 }}>Chargement des résultats...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
        <div style={{ fontSize: '3rem' }}>📭</div>
        <p style={{ marginTop: 12 }}>Aucune donnée disponible.</p>
      </div>
    );
  }

  const { survey, nbRepondants, nbChoristes, tauxParticipation, resultats } = data;
  const type = typeConfig[survey?.type] || typeConfig.autre;
  const pct = tauxParticipation || 0;

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '1.5rem', maxWidth: 1100 }}>
      {/* Back button */}
      <button onClick={() => navigate('/admin/surveys')}
        style={{ background: 'none', border: 'none', color: '#2E6DA4', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Retour aux sondages
      </button>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '22px 28px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: type.bg, color: type.color, fontSize: '0.82rem', fontWeight: 700 }}>
                {type.emoji} {type.label}
              </span>
              <SurveyStatusBadge statut={survey?.statut} pulse />
            </div>
            <h2 style={{ fontWeight: 800, color: '#1e293b', margin: 0, fontSize: '1.4rem' }}>{survey?.titre}</h2>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleExport}
              style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              🖨️ Exporter PDF
            </button>
            {survey?.statut === 'actif' && (
              <button onClick={handleClore}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                🔒 Clôturer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <Row xs={1} md={3} className="g-3 mb-4">
        <Col>
          <KpiCard emoji="👥" label="Participants" value={`${nbRepondants} / ${nbChoristes}`}
            sub="choristes ont répondu" color="#2E6DA4" />
        </Col>
        <Col>
          <KpiCard emoji="📊" label="Taux de participation" value={`${pct}%`}
            sub="taux de réponse global" color="#22c55e" />
        </Col>
        <Col>
          <KpiCard emoji="❓" label="Questions" value={resultats?.length || 0}
            sub="dans ce sondage" color="#7c3aed" />
        </Col>
      </Row>

      {/* Participation bar */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 22px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151' }}>Progression de la participation</span>
          <span style={{ fontWeight: 700, color: pct >= 75 ? '#15803d' : pct >= 40 ? '#d97706' : '#dc2626', fontSize: '0.88rem' }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 12, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 8, width: `${pct}%`,
            background: pct >= 75 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : pct >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>0%</span>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>100%</span>
        </div>
      </div>

      {/* Per-question results */}
      {!resultats || resultats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '2.5rem' }}>📭</div>
          <p style={{ marginTop: 10, fontSize: '0.9rem' }}>Aucune réponse enregistrée pour l'instant.</p>
        </div>
      ) : (
        <div>
          <h5 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Résultats par question</h5>
          {resultats.map((r, i) => (
            <SurveyResultCard key={r.questionId} questionResult={r} index={i} />
          ))}
        </div>
      )}

      <style>{`
        @media print {
          button { display: none !important; }
        }
      `}</style>
    </Container>
  );
};

export default SurveyResultsPage;
