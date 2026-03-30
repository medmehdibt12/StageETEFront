/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { getSurveys, updateSurveyStatut, deleteSurvey } from '../../../services/survey.service';
import SurveyCard from '../../../components/surveys/SurveyCard';
import SurveyCreateModal from '../../../components/surveys/SurveyCreateModal';

const FILTERS = [
  { key: 'tous', label: 'Tous' },
  { key: 'brouillon', label: '📝 Brouillon' },
  { key: 'actif', label: '✅ Actif' },
  { key: 'clos', label: '🔒 Clôturé' }
];

const SurveyListPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('tous');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSurveys();
      setSurveys(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Impossible de charger les sondages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const filtered = surveys.filter(s => {
    const matchFilter = activeFilter === 'tous' || s.statut === activeFilter;
    const matchSearch = s.titre?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    tous: surveys.length,
    brouillon: surveys.filter(s => s.statut === 'brouillon').length,
    actif: surveys.filter(s => s.statut === 'actif').length,
    clos: surveys.filter(s => s.statut === 'clos').length
  };

  const handlePublish = async (survey) => {
    const result = await Swal.fire({
      title: 'Publier ce sondage ?',
      text: `"${survey.titre}" sera visible par les choristes concernés.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🚀 Publier',
      cancelButtonText: 'Annuler'
    });
    if (!result.isConfirmed) return;
    try {
      await updateSurveyStatut(survey._id, 'actif');
      toast.success('Sondage publié avec succès !');
      fetchSurveys();
    } catch {
      toast.error('Erreur lors de la publication.');
    }
  };

  const handleClore = async (survey) => {
    const result = await Swal.fire({
      title: 'Clôturer ce sondage ?',
      text: 'Les choristes ne pourront plus répondre.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🔒 Clôturer',
      cancelButtonText: 'Annuler'
    });
    if (!result.isConfirmed) return;
    try {
      await updateSurveyStatut(survey._id, 'clos');
      toast.success('Sondage clôturé.');
      fetchSurveys();
    } catch {
      toast.error('Erreur lors de la clôture.');
    }
  };

  const handleDelete = async (survey) => {
    const result = await Swal.fire({
      title: 'Supprimer ce sondage ?',
      text: 'Cette action est irréversible. Toutes les réponses seront supprimées.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    });
    if (!result.isConfirmed) return;
    try {
      await deleteSurvey(survey._id);
      toast.success('Sondage supprimé.');
      fetchSurveys();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '1.5rem', maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: '#1e293b', margin: 0, fontSize: '1.5rem' }}>📋 Sondages</h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.88rem', marginTop: 2 }}>
            Créez et gérez les sondages du chœur
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '10px 22px', borderRadius: 10, border: 'none', background: '#2E6DA4',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(46,109,164,0.3)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 8
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          + Créer un sondage
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 8, border: '1.5px solid #e2e8f0', padding: '7px 12px', flex: 1, minWidth: 200 }}>
            <span style={{ color: '#9ca3af' }}>🔍</span>
            <input
              type="text" placeholder="Rechercher un sondage..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.88rem', width: '100%' }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => {
              const active = activeFilter === f.key;
              return (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: active ? '2px solid #2E6DA4' : '1.5px solid #e2e8f0',
                    background: active ? '#eff6ff' : '#fff', color: active ? '#2E6DA4' : '#6b7280',
                    fontWeight: active ? 700 : 500, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}>
                  {f.label}
                  <span style={{ background: active ? '#dbeafe' : '#f1f5f9', color: active ? '#2E6DA4' : '#9ca3af', borderRadius: 10, padding: '0 6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner animation="border" style={{ color: '#2E6DA4' }} />
          <p style={{ color: '#9ca3af', marginTop: 12, fontSize: '0.9rem' }}>Chargement des sondages...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
          <h5 style={{ fontWeight: 600, color: '#374151' }}>Aucun sondage trouvé</h5>
          <p style={{ fontSize: '0.88rem' }}>
            {surveys.length === 0 ? 'Créez votre premier sondage pour commencer.' : 'Essayez d\'autres filtres.'}
          </p>
          {surveys.length === 0 && (
            <button onClick={() => setShowCreate(true)}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#2E6DA4', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              + Créer un sondage
            </button>
          )}
        </div>
      ) : (
        <Row xs={1} md={2} xl={3} className="g-3">
          {filtered.map(s => (
            <Col key={s._id}>
              <SurveyCard
                survey={s}
                isAdmin
                onPublish={handlePublish}
                onClore={handleClore}
                onDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Create Modal */}
      <SurveyCreateModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        onCreated={fetchSurveys}
      />
    </Container>
  );
};

export default SurveyListPage;
