/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { getSurveyById } from '../../../services/survey.service';
import SurveyQuestionRenderer from '../../../components/surveys/SurveyQuestionRenderer';
import SurveyStatusBadge from '../../../components/surveys/SurveyStatusBadge';
import useSurveyReponse from '../../../hooks/useSurveyReponse';

const typeConfig = {
  disponibilite: { emoji: '📅', label: 'Disponibilité', color: '#2E6DA4' },
  voyage: { emoji: '✈️', label: 'Voyage', color: '#7c3aed' },
  restaurant: { emoji: '🍽️', label: 'Restaurant', color: '#c2410c' },
  autre: { emoji: '📝', label: 'Personnalisé', color: '#4b5563' }
};

const ConfirmationScreen = ({ onBack }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
    <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>🎉</div>
    <h3 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Merci pour votre participation !</h3>
    <p style={{ color: '#6b7280', fontSize: '0.95rem', maxWidth: 400, margin: '0 auto 28px' }}>
      Vos réponses ont bien été enregistrées. L'administration vous remercie pour votre participation.
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <button onClick={onBack}
        style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
        ← Retour aux sondages
      </button>
    </div>
    <style>{`
      @keyframes popIn {
        from { transform: scale(0.3); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `}</style>
  </div>
);

const ReadonlyView = ({ survey, existingReponse }) => {
  const questions = survey?.questions || [];

  const getAnswerDisplay = (q) => {
    const r = existingReponse?.reponses?.find(r => r.questionId === q.id);
    const val = r?.valeur;
    if (!val) return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Non renseigné</span>;
    if (Array.isArray(val)) {
      const labels = val.map(v => q.options?.find(o => o.valeur === v)?.label || v);
      return labels.join(', ');
    }
    if (q.type === 'radio' || q.type === 'select') {
      return q.options?.find(o => o.valeur === val)?.label || val;
    }
    return val;
  };

  return (
    <div>
      <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.2rem' }}>✅</span>
        <div>
          <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>Vous avez déjà participé à ce sondage</div>
          <div style={{ color: '#166534', fontSize: '0.82rem' }}>Voici un résumé de vos réponses.</div>
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', color: '#2E6DA4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{q.texte}{q.obligatoire && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}</div>
          </div>
          <div style={{ marginLeft: 34, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, color: '#374151', fontSize: '0.88rem' }}>
            {getAnswerDisplay(q)}
          </div>
        </div>
      ))}
    </div>
  );
};

const SurveyFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [dejaRepondu, setDejaRepondu] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const {
    answers, handleChange, handleSubmit, submitting, submitted,
    checkDejaRepondu, existingReponse, error, validate
  } = useSurveyReponse(id);

  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      try {
        const [surveyData, alreadyAnswered] = await Promise.all([
          getSurveyById(id),
          checkDejaRepondu()
        ]);
        setSurvey(surveyData);
        setDejaRepondu(alreadyAnswered);
      } catch {
        toast.error('Impossible de charger ce sondage.');
      } finally {
        setLoadingPage(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const questions = survey?.questions || [];
  const type = typeConfig[survey?.type] || typeConfig.autre;

  const isExpiringSoon = survey?.dateFin && (() => {
    const diff = new Date(survey.dateFin) - new Date();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  })();

  const answeredCount = questions.filter(q => {
    const v = answers[q.id];
    return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
  }).length;

  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const onSubmit = async () => {
    const errs = validate(questions);
    if (Object.keys(errs).length > 0) {
      setValidationErrors(errs);
      toast.warning('Veuillez répondre à toutes les questions obligatoires.');
      return;
    }
    setValidationErrors({});
    await handleSubmit();
  };

  if (loadingPage) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spinner animation="border" style={{ color: '#2E6DA4' }} />
        <p style={{ color: '#9ca3af', marginTop: 12 }}>Chargement du sondage...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
        <div style={{ fontSize: '3rem' }}>🔍</div>
        <p style={{ marginTop: 12 }}>Sondage introuvable.</p>
      </div>
    );
  }

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '1.5rem', maxWidth: 800 }}>
      {/* Back */}
      <button onClick={() => navigate('/choriste/sondages')}
        style={{ background: 'none', border: 'none', color: '#2E6DA4', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Retour aux sondages
      </button>

      {/* Survey header card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '22px 28px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `4px solid ${type.color}` }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: `${type.color}18`, color: type.color, fontSize: '0.8rem', fontWeight: 600 }}>
            {type.emoji} {type.label}
          </span>
          <SurveyStatusBadge statut={survey.statut} />
        </div>
        <h2 style={{ fontWeight: 800, color: '#1e293b', margin: 0, fontSize: '1.3rem', marginBottom: 6 }}>{survey.titre}</h2>
        {survey.description && <p style={{ color: '#6b7280', margin: 0, fontSize: '0.88rem' }}>{survey.description}</p>}

        {survey.dateFin && (
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
            background: isExpiringSoon ? '#fee2e2' : '#f1f5f9', color: isExpiringSoon ? '#dc2626' : '#6b7280',
            fontSize: '0.8rem', fontWeight: isExpiringSoon ? 700 : 400 }}>
            {isExpiringSoon ? '⚠️' : '📅'}
            {isExpiringSoon ? 'Clôture imminente' : 'Clôture'} : {new Date(survey.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Confirmed */}
      {submitted ? (
        <ConfirmationScreen onBack={() => navigate('/choriste/sondages')} />
      ) : dejaRepondu ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '22px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <ReadonlyView survey={survey} existingReponse={existingReponse} />
        </div>
      ) : (
        <>
          {/* Progress bar */}
          {questions.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 500 }}>
                  {answeredCount} / {questions.length} questions répondues
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2E6DA4' }}>{progressPct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 6, width: `${progressPct}%`, background: 'linear-gradient(90deg, #2E6DA4, #3b82f6)', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {/* Questions */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {questions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0' }}>Aucune question dans ce sondage.</p>
            ) : (
              <>
                {questions.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: i < questions.length - 1 ? 28 : 0, paddingBottom: i < questions.length - 1 ? 28 : 0, borderBottom: i < questions.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    {/* Question label */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', color: '#2E6DA4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                        {i + 1}
                      </span>
                      <label style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem', lineHeight: 1.4 }}>
                        {q.texte}
                        {q.obligatoire && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
                      </label>
                    </div>

                    {/* Renderer */}
                    <div style={{ marginLeft: 38 }}>
                      <SurveyQuestionRenderer
                        question={q}
                        value={answers[q.id]}
                        onChange={handleChange}
                        error={validationErrors[q.id]}
                      />
                    </div>
                  </div>
                ))}

                {/* API error */}
                {error && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginTop: 16, color: '#dc2626', fontSize: '0.85rem', fontWeight: 500 }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Submit */}
                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/choriste/sondages')}
                    style={{ padding: '10px 22px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button onClick={onSubmit} disabled={submitting}
                    style={{
                      padding: '10px 28px', borderRadius: 10, border: 'none',
                      background: submitting ? '#94a3b8' : '#2E6DA4', color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                      cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      boxShadow: submitting ? 'none' : '0 4px 14px rgba(46,109,164,0.3)', transition: 'all 0.2s'
                    }}>
                    {submitting ? (
                      <><span className="spinner-border spinner-border-sm" /> Envoi en cours...</>
                    ) : '🚀 Envoyer mes réponses'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Container>
  );
};

export default SurveyFormPage;
