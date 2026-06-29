/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { getSurveys, getMaReponse } from '../../../services/survey.service';
import SurveyCard from '../../../components/surveys/SurveyCard';

const ChoristerSurveyListPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseMap, setResponseMap] = useState({});

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSurveys();
      const list = Array.isArray(data) ? data : [];
      setSurveys(list);

      // Check response status for each survey in parallel
      const checks = await Promise.allSettled(
        list.map(async (s) => {
          try {
            await getMaReponse(s._id);
            return { id: s._id, repondu: true };
          } catch {
            return { id: s._id, repondu: false };
          }
        })
      );

      const map = {};
      checks.forEach(c => {
        if (c.status === 'fulfilled') map[c.value.id] = c.value.repondu;
      });
      setResponseMap(map);
    } catch {
      toast.error('Impossible de charger les sondages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const enriched = surveys.map(s => ({ ...s, _dejaRepondu: responseMap[s._id] || false }));
  const pending = enriched.filter(s => !s._dejaRepondu);
  const done = enriched.filter(s => s._dejaRepondu);

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '1.5rem', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontWeight: 800, color: '#1e293b', margin: 0, fontSize: '1.5rem' }}>📋 Mes Sondages</h2>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.88rem', marginTop: 2 }}>
          Participez aux sondages ouverts par l'administration
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner animation="border" style={{ color: '#2E6DA4' }} />
          <p style={{ color: '#9ca3af', marginTop: 12, fontSize: '0.9rem' }}>Chargement des sondages...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📭</div>
          <h5 style={{ fontWeight: 600, color: '#374151' }}>Aucun sondage disponible</h5>
          <p style={{ fontSize: '0.88rem' }}>Il n'y a pas de sondage actif vous concernant pour le moment.</p>
        </div>
      ) : (
        <>
          {/* Summary banner */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
            borderRadius: 14, border: '1px solid #bfdbfe', padding: '16px 22px',
            marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>⏳</span>
              <div>
                <div style={{ fontWeight: 800, color: '#2E6DA4', fontSize: '1.2rem' }}>{pending.length}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>En attente</div>
              </div>
            </div>
            <div style={{ width: 1, background: '#bfdbfe', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>✅</span>
              <div>
                <div style={{ fontWeight: 800, color: '#15803d', fontSize: '1.2rem' }}>{done.length}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Complétés</div>
              </div>
            </div>
            <div style={{ width: 1, background: '#bfdbfe', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>📊</span>
              <div>
                <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '1.2rem' }}>{surveys.length}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Total</div>
              </div>
            </div>
          </div>

          {/* Pending surveys */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h5 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>⏳ À compléter</h5>
                <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 12, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {pending.length}
                </span>
              </div>
              <Row xs={1} md={2} xl={3} className="g-3">
                {pending.map(s => (
                  <Col key={s._id}>
                    <SurveyCard survey={s} isAdmin={false} />
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Completed surveys */}
          {done.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h5 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>✅ Complétés</h5>
                <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 12, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {done.length}
                </span>
              </div>
              <Row xs={1} md={2} xl={3} className="g-3">
                {done.map(s => (
                  <Col key={s._id}>
                    <SurveyCard survey={s} isAdmin={false} />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default ChoristerSurveyListPage;
