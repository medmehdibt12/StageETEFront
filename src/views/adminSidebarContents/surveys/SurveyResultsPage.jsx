/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Row, Col, Tabs, Tab, Table, Modal, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';


import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { getSurveyResultats, updateSurveyStatut } from '../../../services/survey.service';
import SurveyResultCard from '../../../components/surveys/SurveyResultCard';
import SurveyStatusBadge from '../../../components/surveys/SurveyStatusBadge';
import { useAuth } from '../../../contexts/AuthContext';


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
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [searchText, setSearchText] = useState('');
  const [selectedRespondent, setSelectedRespondent] = useState(null);

  const isManagement = user?.role === 'admin' || user?.role === 'manager';


  useEffect(() => {
    // Permission check
    if (user && !isManagement) {
      toast.error('Accès refusé. Vous n\'avez pas les permissions pour voir les résultats.');
      navigate('/choriste/sondages');
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await getSurveyResultats(id);
        setData(res);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Impossible de charger les résultats.');
        if (err.response?.status === 403) navigate('/admin/surveys');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id, user, isManagement, navigate]);


  const handleClore = async () => {
    const result = await Swal.fire({
      title: 'Clôturer ce sondage ?',
      text: 'Les choristes ne pourront plus répondre.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2E6DA4',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Oui, clôturer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await updateSurveyStatut(id, 'clos');
        toast.success('Sondage clôturé avec succès.');
        window.location.reload();
      } catch {
        toast.error('Erreur lors de la clôture.');
      }
    }
  };

  const handleExportExcel = () => {
    if (!responsesDetaillees || responsesDetaillees.length === 0) {
      toast.info('Aucune donnée à exporter.');
      return;
    }

    try {
      const exportData = responsesDetaillees.map(item => {
        const row = {
          'Prénom': item.choriste.firstName,
          'Nom': item.choriste.lastName,
          'Pupitre': item.choriste.pupitre,
          'Date de soumission': new Date(item.soumisLe).toLocaleDateString('fr-FR')
        };

        questions.forEach(q => {
          const resp = item.reponses.find(r => String(r.questionId) === String(q._id || q.id));
          const rawVal = resp?.valeur;
          let displayVal = '-';
          
          if (Array.isArray(rawVal)) {
            displayVal = rawVal.map(v => {
              const option = q.options?.find(o => String(o.valeur) === String(v));
              return option ? option.label : v;
            }).join(', ');
          } else if (rawVal) {
            const option = q.options?.find(o => String(o.valeur) === String(rawVal));
            displayVal = option ? option.label : rawVal;
          }
          
          row[q.texte] = displayVal;
        });

        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Réponses');
      
      const fileName = `Resultats_Sondage_${survey?.titre || id}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success('Excel généré avec succès.');
    } catch (err) {
      console.error('Export Excel failed:', err);
      toast.error('Erreur lors de l\'export Excel.');
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

  const survey = data?.survey;
  const nbRepondants = data?.nbRepondants || 0;
  const nbChoristes = data?.nbChoristes || 0;
  const tauxParticipation = data?.tauxParticipation || 0;
  const resultats = data?.resultats || [];
  const responsesDetaillees = data?.reponsesDetaillees || [];
  
  const type = typeConfig[survey?.type] || typeConfig.autre;
  const pct = tauxParticipation || 0;
  
  // Robustly derive questions from survey or from results if survey.questions is missing
  const questions = (survey?.questions?.length ? survey.questions : resultats.map(r => ({
    id: r.questionId,
    _id: r.questionId,
    texte: r.question,
    type: r.type,
    options: survey?.questions?.find(sq => String(sq._id || sq.id) === String(r.questionId))?.options || []
  }))) || [];



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

          <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
            <button onClick={handleExportExcel} className="d-flex align-items-center gap-2" style={{
              background: '#15803d', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10,
              fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(21,128,61,0.2)'
            }}>
              📊 Excel
            </button>
            <button onClick={() => window.print()} className="d-flex align-items-center gap-2" style={{
              background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: 10,
              fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.2s'
            }}>
              🖨️ PDF
            </button>
            {survey?.statut === 'ouvert' && (
              <button onClick={handleClore} style={{
                background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', padding: '10px 18px',
                borderRadius: 10, fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.2s'
              }}>
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
          <KpiCard emoji="❓" label="Questions" value={questions.length}
            sub="dans ce sondage" color="#7c3aed" />
        </Col>

      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 survey-tabs"
        style={{ borderBottom: '2px solid #e2e8f0' }}
      >
        <Tab eventKey="stats" title={<span style={{ fontWeight: 600, padding: '0 10px' }}>📊 Statistiques</span>}>
          <div style={{ marginTop: 24 }}>
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
          </div>
        </Tab>

        <Tab eventKey="responses" title={<span style={{ fontWeight: 600, padding: '0 10px' }}>👥 Liste des réponses</span>}>
          <div style={{ marginTop: 24, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            {/* Search bar inside the tab */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher un participant..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                    fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2E6DA4'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                {data.reponsesDetaillees.filter(r => `${r.choriste.firstName} ${r.choriste.lastName}`.toLowerCase().includes(searchText.toLowerCase())).length} répondant(s) trouvé(s)
              </div>
            </div>

            {!responsesDetaillees || responsesDetaillees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem' }}>👥</div>
                <p style={{ marginTop: 10, fontSize: '0.9rem' }}>Aucun choriste n'a encore répondu.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover style={{ margin: 0 }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '16px 20px', border: 'none', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Choriste</th>
                      <th style={{ padding: '16px 20px', border: 'none', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pupitre</th>
                      {questions.map((q, idx) => (
                        <th key={String(q?._id || q?.id || idx)} style={{ padding: '16px 20px', border: 'none', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', minWidth: 150 }}>
                          {q?.texte || 'Question'}
                        </th>
                      ))}
                      <th style={{ padding: '16px 20px', border: 'none', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Soumis le</th>
                      <th style={{ padding: '16px 20px', border: 'none', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responsesDetaillees
                      .filter(item => {
                        const fullName = `${item?.choriste?.firstName || ''} ${item?.choriste?.lastName || ''}`.toLowerCase();
                        return fullName.includes(searchText.toLowerCase());
                      })
                      .map((item, idx) => (
                      <tr key={item?._id || idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1e293b' }}>
                          {item?.choriste?.firstName} {item?.choriste?.lastName}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                            background: { soprano: '#fdf2f8', alto: '#eef2ff', ténor: '#fffbeb', basse: '#f0fdf4' }[item?.choriste?.pupitre?.toLowerCase()] || '#f1f5f9',
                            color: { soprano: '#be185d', alto: '#4338ca', ténor: '#b45309', basse: '#15803d' }[item?.choriste?.pupitre?.toLowerCase()] || '#64748b',
                            textTransform: 'capitalize'
                          }}>
                            {item?.choriste?.pupitre}
                          </span>
                        </td>
                        {questions.map((q) => {
                          const qId = String(q?._id || q?.id);
                          const resp = (item?.reponses || []).find(r => String(r.questionId) === qId);
                          // Robust display for individual answers
                          const rawVal = resp?.valeur;
                          let displayVal = '-';
                          
                          if (Array.isArray(rawVal)) {
                            displayVal = rawVal.map(v => typeof v === 'object' ? (v.label || v.valeur) : v).join(', ');
                          } else if (rawVal) {
                            displayVal = typeof rawVal === 'object' ? (rawVal.valeur || rawVal.label) : rawVal;
                          }
                          
                          return (
                            <td key={qId} style={{ padding: '16px 20px', fontSize: '0.88rem', color: '#334155' }}>
                              {displayVal}
                            </td>
                          );
                        })}
                        <td style={{ padding: '16px 20px', fontSize: '0.8rem', color: '#94a3b8' }}>
                          {item?.soumisLe ? new Date(item.soumisLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedRespondent(item)}
                            style={{
                              padding: '6px 12px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 6,
                              color: '#2E6DA4', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            👁️ Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>


                </Table>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      <SurveyDetailModal
        show={!!selectedRespondent}
        onHide={() => setSelectedRespondent(null)}
        respondent={selectedRespondent}
        questions={questions}
      />

      <style>{`

        @media print {
          button { display: none !important; }
        }
      `}</style>
    </Container>
  );
};

export default SurveyResultsPage;

// 👁️ Nested Component for detailed single respondent view
const SurveyDetailModal = ({ show, onHide, respondent, questions }) => {
  if (!respondent) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
        <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
          Détails de participation
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '24px', background: '#f8fafc' }}>
        {/* Respondent Info */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eff6ff', color: '#2E6DA4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>👤</div>
          <div>
            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{respondent.choriste.firstName} {respondent.choriste.lastName}</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Pupitre : <span style={{ fontWeight: 600, color: '#334155' }}>{respondent.choriste.pupitre}</span></div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Soumis le</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
               {new Date(respondent.soumisLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Answers List */}
        <h6 style={{ fontWeight: 700, color: '#475569', marginBottom: 12, fontSize: '0.85rem', textTransform: 'uppercase' }}>Réponses au formulaire :</h6>
        {questions.map((q, i) => {
          const qId = String(q?._id || q?.id);
          const resp = (respondent?.reponses || []).find(r => String(r.questionId) === qId);
          const rawVal = resp?.valeur;
          
          let displayVal = '';
          if (Array.isArray(rawVal)) {
             displayVal = rawVal.map(v => {
               const option = q.options?.find(o => String(o.valeur) === String(v));
               return option ? option.label : v;
             }).join(', ');
          } else if (rawVal) {
             const option = q.options?.find(o => String(o.valeur) === String(rawVal));
             displayVal = option ? option.label : rawVal;
          } else {
             displayVal = '-';
          }

          return (
            <div key={qId} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 10 }}>


              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2E6DA4', background: '#eff6ff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{q.texte}</div>
              </div>
              <div style={{ marginLeft: 32, padding: '10px 14px', background: '#f1f5f9', borderRadius: 8, color: '#334155', fontSize: '0.88rem', border: '1px solid #e2e8f0' }}>
                {displayVal}
              </div>
            </div>
          );
        })}
      </Modal.Body>
      <Modal.Footer style={{ borderTop: '1px solid #f1f5f9' }}>
        <Button variant="outline-secondary" onClick={onHide} style={{ borderRadius: 8, fontWeight: 600 }}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

