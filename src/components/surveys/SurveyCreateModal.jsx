/* eslint-disable prettier/prettier */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
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
  const [isExpressMode, setIsExpressMode] = useState(false);

  const [errors, setErrors] = useState({});

  // 🪄 Auto-load template when type changes
  useEffect(() => {
    if (type && type !== 'autre' && show) {
      loadTemplate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const resetForm = () => {
    setStep(1);
    setTitre(''); setDescription(''); setType(''); setDateDebut(''); setDateFin(''); setCiblePupitres([]);
    setQuestions([]); setPublishNow(false); setIsExpressMode(false); setErrors({});
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
        setQuestions(tpl.questions.map((q, i) => {
          let fixedType = q.type;
          const text = q.texte.toLowerCase();

          // Auto-correct from 'texte' to specific pickers if relevant keywords are found
          if (q.type === 'texte') {
            const hasPluralDates = text.includes('dates');
            const hasSingleDate = text.includes('date') && !hasPluralDates;

            if (hasSingleDate || text.includes('expiration') || text.includes('naissance')) {
              fixedType = 'date';
            } else if (hasPluralDates || text.includes('disponibilité')) {
              fixedType = 'checkbox';
              q.options = [
                { valeur: 'date_1', label: 'Proposer une date...' },
                { valeur: 'date_2', label: 'Proposer une autre date...' }
              ];
            } else if (text.includes('heure') || text.includes('départ') || text.includes('arrivée') || text.includes('time')) {
              fixedType = 'time';
            } else if ((text.includes('choisi') || text.includes('préférence') || text.includes('menu')) && q.options?.length > 0) {
              fixedType = 'radio';
            }
          }

          return { ...q, type: fixedType, id: q.id || `q${i + 1}` };
        }));
        toast.success('Template CSO chargé et optimisé ! ✨');
      } else {
        toast.warning('Aucun template trouvé pour ce type.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement du template.');
    } finally {
      setLoadingTemplate(false);
    }
  };

    const validateStep1 = () => {
      const e = {};
      if (!titre.trim()) e.titre = 'Le titre est obligatoire.';
      if (!type) e.type = 'Veuillez choisir un type.';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!dateDebut) {
        e.dateDebut = "La date de début est obligatoire.";
      } else {
        const [y, m, d_num] = dateDebut.split('-');
        const d = new Date(y, m - 1, d_num);
        d.setHours(0, 0, 0, 0);
        
        if (d < today) {
          e.dateDebut = "La date de début doit être aujourd'hui ou une date ultérieure.";
        }
      }

      if (!dateFin) {
        e.dateFin = "La date de clôture est obligatoire.";
      } else if (dateDebut && dateFin) {
        const [sy, sm, sd] = dateDebut.split('-');
        const start = new Date(sy, sm - 1, sd);
        start.setHours(0, 0, 0, 0);
        
        const [ey, em, ed] = dateFin.split('-');
        const end = new Date(ey, em - 1, ed);
        end.setHours(0, 0, 0, 0);
        
        if (end <= start) {
          e.dateFin = "La date de clôture doit être après la date de début.";
        }
      } else if (!dateDebut && dateFin) {
        const [ey, em, ed] = dateFin.split('-');
        const end = new Date(ey, em - 1, ed);
        end.setHours(0, 0, 0, 0);
        
        if (end <= today) {
          e.dateFin = "La date de clôture doit être après aujourd'hui.";
        }
      }

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

    if (step === 1 && isExpressMode) {
      setStep(3);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        type,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
        ciblePupitres,
      };

      // In express mode, we let the backend fill everything
      // In standard mode, we send what the user edited
      if (!isExpressMode) {
        payload.titre = titre.trim();
        payload.description = description.trim();
        payload.questions = questions.map((q, i) => ({
          id: q.id || `q${i + 1}`,
          texte: q.texte,
          type: q.type,
          options: q.options || [],
          obligatoire: q.obligatoire || false
        }));
      }

      const created = await createSurvey(payload);

      if (publishNow && created._id) {
        await updateSurveyStatut(created._id, 'actif');
        toast.success('Sondage créé et publié avec succès !');
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
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: 6, display: 'block' }}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Description optionnelle du sondage..."
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
                      style={{
                        padding: '12px 14px', borderRadius: 12, border: selected ? `2px solid ${color}` : '2px solid #e2e8f0',
                        background: selected ? `${color}11` : '#fff', cursor: 'pointer', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 10
                      }}>
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

            {/* Express Mode Toggle */}
            {type && type !== 'autre' && (
              <div style={{
                marginBottom: 20, padding: '14px 18px', borderRadius: 12, border: '1px solid #e2e8f0',
                background: isExpressMode ? '#f0f9ff' : '#fff', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isExpressMode ? '#0369a1' : '#374151' }}>✨ Mode Express</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Utiliser les questions standards sans passer par l'éditeur</div>
                </div>
                <Form.Check
                  type="switch"
                  id="express-mode-switch"
                  checked={isExpressMode}
                  onChange={(e) => setIsExpressMode(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>
            )}

            {/* Dates Block */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: 6 }}>
                📅 Période de validité
              </div>
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#475569', marginBottom: 4, display: 'block' }}>Date de début</label>
                  <input style={{ ...inputStyle, borderColor: errors.dateDebut ? '#dc2626' : '#e2e8f0' }} type="date" value={dateDebut} onChange={e => { setDateDebut(e.target.value); setErrors(p => ({ ...p, dateDebut: undefined })); }} />
                  {errors.dateDebut && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{errors.dateDebut}</div>}
                </Col>
                <Col xs={12} md={6}>
                  <label style={{ fontWeight: 600, fontSize: '0.82rem', color: '#475569', marginBottom: 4, display: 'block' }}>Date de clôture</label>
                  <input style={{ ...inputStyle, borderColor: errors.dateFin ? '#dc2626' : '#e2e8f0' }} type="date" value={dateFin} onChange={e => { setDateFin(e.target.value); setErrors(p => ({ ...p, dateFin: undefined })); }} />
                  {errors.dateFin && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4 }}>{errors.dateFin}</div>}
                </Col>
              </Row>
            </div>

            {/* Target pupitres */}
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#475569', marginBottom: 10, display: 'block' }}>
                Cibler des pupitres <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(laisser vide = tout le monde)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {PUPITRES.map(p => {
                  const checked = ciblePupitres.includes(p);
                  const colors = {
                    soprano: { border: '#fce7f3', bg: '#fdf2f8', dark: '#be185d' },
                    alto: { border: '#e0e7ff', bg: '#eef2ff', dark: '#4338ca' },
                    ténor: { border: '#fef3c7', bg: '#fffbeb', dark: '#b45309' },
                    basse: { border: '#dcfce7', bg: '#f0fdf4', dark: '#15803d' }
                  }[p] || { border: '#e2e8f0', bg: '#f8fafc', dark: '#64748b' };

                  return (
                    <div key={p} onClick={() => togglePupitre(p)}
                      style={{
                        padding: '8px 20px', borderRadius: 24, border: '2px solid',
                        borderColor: checked ? colors.dark : '#f1f5f9',
                        background: checked ? colors.bg : '#fff',
                        color: checked ? colors.dark : '#64748b',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: checked ? 700 : 500,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        textTransform: 'capitalize',
                        boxShadow: checked ? `0 2px 8px ${colors.border}` : 'none'
                      }}>
                      {checked ? '● ' : '○ '}{p}
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
              {isExpressMode ? (
                <div style={{ padding: '20px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '2px dashed #e2e8f0', color: '#64748b' }}>
                  <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: 4 }}>⚡</span>
                  <span style={{ fontSize: '0.85rem' }}>Les questions par défaut du template seront ajoutées automatiquement.</span>
                </div>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} style={{ padding: '10px 14px', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#2E6DA4', fontSize: '0.8rem' }}>Q{i + 1}</span>
                    {q.obligatoire && <span style={{ color: '#dc2626', marginLeft: 4, fontWeight: 700 }}>*</span>}
                    <span style={{ fontSize: '0.87rem', color: '#374151', marginLeft: 6 }}>{q.texte}</span>
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#9ca3af', background: '#f1f5f9', padding: '2px 6px', borderRadius: 6 }}>{q.type}</span>
                  </div>
                ))
              )}
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
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: publishNow ? '#15803d' : '#374151' }}>Publier directement</div>
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
            {submitting ? <><Spinner animation="border" size="sm" className="me-2" />Enregistrement...</> : publishNow ? 'Créer et publier' : '💾 Enregistrer en brouillon'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SurveyCreateModal;
