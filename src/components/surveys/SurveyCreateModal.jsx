/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { createSurvey, updateSurveyStatut, getSurveyTemplates } from '../../services/survey.service';
import SurveyQuestionEditor from './SurveyQuestionEditor';

const TEMPLATES = [
  { type: 'disponibilite', emoji: '📅', label: 'Disponibilité', description: 'Planifier une répétition ou un concert' },
  { type: 'voyage', emoji: '✈️', label: 'Voyage', description: 'Organiser un déplacement du chœur' },
  { type: 'restaurant', emoji: '🍽️', label: 'Restaurant', description: 'Organiser une sortie conviviale' },
  { type: 'autre', emoji: '📝', label: 'Personnalisé', description: 'Créer depuis zéro' }
];

const PUPITRES = ['soprano', 'alto', 'ténor', 'basse'];

const typeColors = {
  disponibilite: '#2E6DA4', voyage: '#7c3aed', restaurant: '#f97316', autre: '#6b7280'
};

const STEP_LABELS = ['Informations', 'Questions', 'Récapitulatif'];

const stepStyle = (active, done) => ({
  width: 32, height: 32, borderRadius: '50%',
  background: done ? '#22c55e' : active ? '#2E6DA4' : '#e2e8f0',
  color: done || active ? '#fff' : '#9ca3af',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, transition: 'all 0.3s'
});

const SurveyCreateModal = ({ show, onHide, onCreated }) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Step 1 state
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [ciblePupitres, setCiblePupitres] = useState([]);

  // Step 2 state
  const [questions, setQuestions] = useState([]);

  // Step 3 state
  const [publishNow, setPublishNow] = useState(false);

  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setStep(1);
    setTitre(''); setDescription(''); setType(''); setDateDebut(''); setDateFin(''); setCiblePupitres([]);
    setQuestions([]); setPublishNow(false); setErrors({});
  };

  const handleClose = () => { resetForm(); onHide(); };

  const togglePupitre = (p) => {
    setCiblePupitres(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const loadTemplate = async () => {
    if (!type || type === 'autre') {
      toast.info('Les templates prédéfinis sont pour disponibilité, voyage et restaurant.');
      return;
    }
    setLoadingTemplate(true);
    try {
      const templates = await getSurveyTemplates();
      const tpl = Array.isArray(templates) ? templates.find(t => t.type === type) : templates[type];
      if (tpl?.questions) {
        setQuestions(tpl.questions.map((q, i) => ({ ...q, id: q.id || `q${i + 1}` })));
        toast.success('Template chargé ! Vous pouvez modifier les questions.');
      } else {
        toast.warning('Aucun template trouvé pour ce type.');
      }
    } catch {
      toast.error('Erreur lors du chargement du template.');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const validateStep1 = () => {
    const e = {};
    if (!titre.trim()) e.titre = 'Le titre est obligatoire.';
    if (!type) e.type = 'Veuillez choisir un type.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    if (questions.length === 0) {
      toast.warning('Ajoutez au moins une question.');
      return false;
    }
    const allFilled = questions.every(q => q.texte.trim());
    if (!allFilled) {
      toast.warning('Veuillez remplir le texte de toutes les questions.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        titre: titre.trim(),
        description: description.trim(),
        type,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
        ciblePupitres,
        questions: questions.map((q, i) => ({
          id: q.id || `q${i + 1}`,
          texte: q.texte,
          type: q.type,
          options: q.options || [],
          obligatoire: q.obligatoire || false
        }))
      };

      const created = await createSurvey(payload);

      if (publishNow && created._id) {
        await updateSurveyStatut(created._id, 'actif');
        toast.success('Sondage créé et publié avec succès ! 🚀');
      } else {
        toast.success('Sondage enregistré en brouillon.');
      }

      onCreated?.();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du sondage.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.9rem', padding: '10px 14px', transition: 'border-color 0.2s', width: '100%', fontFamily: 'inherit', outline: 'none'
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered scrollable>
      <Modal.Header closeButton style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px' }}>
        <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
          📋 Créer un sondage
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '24px', minHeight: 400 }}>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <React.Fragment key={n}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
                  <div style={stepStyle(active, done)}>
                    {done ? '✓' : n}
                  </div>
                  <span style={{ fontSize: '0.73rem', marginTop: 4, color: active ? '#2E6DA4' : done ? '#22c55e' : '#9ca3af', fontWeight: active || done ? 600 : 400 }}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? '#22c55e' : '#e2e8f0', margin: '0 8px', marginBottom: 20, transition: 'background 0.4s' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 1: General Info */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }`}</style>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6, display: 'block' }}>
                Titre du sondage <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input style={{ ...inputStyle, borderColor: errors.titre ? '#dc2626' : '#e2e8f0' }} type="text" placeholder="Ex: Sondage de disponibilité – Répétition mars"
                value={titre} onChange={e => { setTitre(e.target.value); setErrors(p => ({ ...p, titre: undefined })); }} />
              {errors.titre && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{errors.titre}</div>}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6, display: 'block' }}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Description optionnelle du sondage..."
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Type — template cards */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 8, display: 'block' }}>
                Type de sondage <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {errors.type && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: 6 }}>{errors.type}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {TEMPLATES.map(t => {
                  const selected = type === t.type;
                  const color = typeColors[t.type];
                  return (
                    <div key={t.type} onClick={() => { setType(t.type); setErrors(p => ({ ...p, type: undefined })); }}
                      style={{ padding: '12px 14px', borderRadius: 12, border: selected ? `2px solid ${color}` : '2px solid #e2e8f0',
                        background: selected ? `${color}11` : '#fff', cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.4rem' }}>{t.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: selected ? color : '#374151' }}>{t.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Template load button */}
            {type && type !== 'autre' && (
              <div style={{ marginBottom: 16 }}>
                <button onClick={loadTemplate} disabled={loadingTemplate}
                  style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #2E6DA4', background: '#eff6ff', color: '#2E6DA4', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {loadingTemplate ? <><span className="spinner-border spinner-border-sm" /> Chargement...</> : '⚡ Partir d\'un template'}
                </button>
              </div>
            )}

            {/* Dates */}
            <Row style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6, display: 'block' }}>Date de début</label>
                <input style={inputStyle} type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
              </Col>
              <Col xs={12} md={6} style={{ marginTop: window.innerWidth < 768 ? 12 : 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6, display: 'block' }}>Date de clôture</label>
                <input style={inputStyle} type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
              </Col>
            </Row>

            {/* Target pupitres */}
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 8, display: 'block' }}>
                Cibler des pupitres <span style={{ fontWeight: 400, color: '#9ca3af' }}>(laisser vide = tout le monde)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PUPITRES.map(p => {
                  const checked = ciblePupitres.includes(p);
                  return (
                    <div key={p} onClick={() => togglePupitre(p)}
                      style={{ padding: '6px 16px', borderRadius: 20, border: checked ? '2px solid #2E6DA4' : '1.5px solid #e2e8f0',
                        background: checked ? '#eff6ff' : '#fff', color: checked ? '#2E6DA4' : '#6b7280', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: checked ? 600 : 400, transition: 'all 0.15s', textTransform: 'capitalize' }}>
                      {checked ? '✓ ' : ''}{p}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Question Editor */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h6 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Éditeur de questions</h6>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{questions.length} question{questions.length > 1 ? 's' : ''}</span>
            </div>
            <SurveyQuestionEditor questions={questions} setQuestions={setQuestions} />
          </div>
        )}

        {/* STEP 3: Summary */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', marginBottom: 20 }}>
              <h6 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>📋 Récapitulatif</h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Titre : </span><span style={{ fontSize: '0.88rem' }}>{titre}</span></div>
                {description && <div><span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Description : </span><span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{description}</span></div>}
                <div><span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Type : </span>
                  <span>{TEMPLATES.find(t => t.type === type)?.emoji} {TEMPLATES.find(t => t.type === type)?.label}</span>
                </div>
                <div><span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Questions : </span><span>{questions.length}</span></div>
                {ciblePupitres.length > 0 && <div><span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Pupitres ciblés : </span><span style={{ textTransform: 'capitalize' }}>{ciblePupitres.join(', ')}</span></div>}
                {dateFin && <div><span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Clôture : </span><span>{new Date(dateFin).toLocaleDateString('fr-FR')}</span></div>}
              </div>
            </div>

            {/* Questions preview */}
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 20 }}>
              {questions.map((q, i) => (
                <div key={q.id} style={{ padding: '10px 14px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: '#2E6DA4', fontSize: '0.8rem' }}>Q{i + 1}</span>
                  {q.obligatoire && <span style={{ color: '#dc2626', marginLeft: 4, fontWeight: 700 }}>*</span>}
                  <span style={{ fontSize: '0.87rem', color: '#374151', marginLeft: 6 }}>{q.texte}</span>
                  <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#9ca3af', background: '#f1f5f9', padding: '2px 6px', borderRadius: 6 }}>{q.type}</span>
                </div>
              ))}
            </div>

            {/* Publication choice */}
            <div style={{ borderRadius: 12, border: '2px solid', borderColor: publishNow ? '#22c55e' : '#e2e8f0', overflow: 'hidden' }}>
              <div onClick={() => setPublishNow(false)}
                style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', background: !publishNow ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: !publishNow ? '5px solid #6b7280' : '2px solid #d1d5db', background: '#fff', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>📝 Enregistrer en brouillon</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Le sondage ne sera pas visible par les choristes</div>
                </div>
              </div>
              <div onClick={() => setPublishNow(true)}
                style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', background: publishNow ? '#f0fdf4' : '#fff' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: publishNow ? '5px solid #22c55e' : '2px solid #d1d5db', background: '#fff', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: publishNow ? '#15803d' : '#374151' }}>🚀 Publier directement</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Immédiatement visible par les choristes concernés</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outline-secondary" size="sm" onClick={step === 1 ? handleClose : () => setStep(s => s - 1)}
          style={{ borderRadius: 8, fontWeight: 500 }}>
          {step === 1 ? 'Annuler' : '← Retour'}
        </Button>

        {step < 3 ? (
          <Button size="sm" onClick={goNext} style={{ borderRadius: 8, background: '#2E6DA4', border: 'none', fontWeight: 600, padding: '8px 20px' }}>
            Suivant →
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={submitting}
            style={{ borderRadius: 8, background: publishNow ? '#22c55e' : '#2E6DA4', border: 'none', fontWeight: 600, padding: '8px 20px' }}>
            {submitting ? <><Spinner animation="border" size="sm" className="me-2" />Enregistrement...</> : publishNow ? '🚀 Créer et publier' : '💾 Enregistrer en brouillon'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SurveyCreateModal;
