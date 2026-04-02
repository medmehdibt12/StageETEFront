import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Spinner, Accordion, Button, Badge } from 'react-bootstrap';
import { Music, FileText, Video, PlayCircle, DownloadCloud, Eye, Calendar, MapPin, Info } from 'lucide-react';
import { getCurrentConcertOeuvres } from '../../../services/concert.service';
import { BACKEND_URL } from '../../../utils/axiosInstance';

const CurrentConcertOeuvres = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCurrentConcertOeuvres();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Error fetching current concert oeuvres:', err);
      if (err.response && err.response.status === 404) {
        setError('Aucun concert à venir programmé.');
      } else {
        setError('Une erreur est survenue lors du chargement des données.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non définie';
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5 text-center">
        <Card className="shadow-sm border-0 p-5">
          <Info size={48} className="text-muted mb-3 mx-auto" />
          <h4 className="text-secondary">{error}</h4>
          <p className="text-muted">Revenez plus tard pour consulter votre prochain carnet de chant.</p>
        </Card>
      </Container>
    );
  }

  if (!data || !data.concert) return null;

  const { concert, oeuvres } = data;

  return (
    <Container fluid className="px-4 py-4" style={{ maxWidth: '1200px' }}>
      {/* Header / Concert Detail */}
      <Card className="shadow-sm border-0 overflow-hidden mb-5 rounded-lg bg-white">
        <Row className="g-0">
          <Col md={4} lg={3}>
            {concert.poster ? (
              <img
                src={`${BACKEND_URL}/uploads/posters/${concert.poster}`}
                alt={concert.title}
                className="img-fluid w-100 h-100"
                style={{ objectFit: 'cover', minHeight: '200px' }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x600?text=CSO+Concert';
                }}
              />
            ) : (
              <div className="bg-light d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: '200px' }}>
                <Music size={48} opacity={0.3} />
              </div>
            )}
          </Col>
          <Col md={8} lg={9}>
            <Card.Body className="p-4 h-100 d-flex flex-column justify-content-center">
              <div className="d-flex align-items-start justify-content-between mb-3 text-start">
                <div>
                  <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill uppercase tracking-wider small fw-bold">
                    PROCHAIN CONCERT
                  </Badge>
                  <h2 className="fw-bold text-dark mb-1">{concert.title}</h2>
                </div>
              </div>

              <Row className="text-muted mt-2">
                <Col sm={6} className="d-flex align-items-center mb-3 mb-sm-0">
                  <div className="bg-primary-subtle p-2 rounded-circle me-3 text-primary">
                    <Calendar size={20} />
                  </div>
                  <div className="text-start">
                    <div className="small text-uppercase fw-bold text-muted" style={{ fontSize: '0.7rem' }}>
                      Date et Heure
                    </div>
                    <div className="fw-semibold">{formatDate(concert.dateHeure)}</div>
                  </div>
                </Col>
                <Col sm={6} className="d-flex align-items-center">
                  <div className="bg-primary-subtle p-2 rounded-circle me-3 text-primary">
                    <MapPin size={20} />
                  </div>
                  <div className="text-start">
                    <div className="small text-uppercase fw-bold text-muted" style={{ fontSize: '0.7rem' }}>
                      Lieu
                    </div>
                    <div className="fw-semibold">{concert.location || 'Lieu non spécifié'}</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Col>
        </Row>
      </Card>

      {/* Program / Oeuvres List */}
      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary p-2 rounded-lg me-3 text-white shadow-sm">
          <Music size={24} />
        </div>
        <h3 className="fw-bold m-0 text-dark text-start">Programme du Concert</h3>
      </div>

      <Accordion defaultActiveKey="0" className="shadow-sm border-0">
        {oeuvres && oeuvres.length > 0 ? (
          oeuvres.map((oeuvre, idx) => (
            <Accordion.Item eventKey={idx.toString()} key={oeuvre._id} className="border-0 mb-3 shadow-sm rounded overflow-hidden">
              <Accordion.Header className="bg-white border-0 py-2 custom-accordion-header">
                <div className="d-flex flex-column w-100 pe-3 text-start">
                  <span className="fw-bold text-dark fs-5">{oeuvre.title}</span>
                  <span className="text-primary small fw-semibold fst-italic">
                    {Array.isArray(oeuvre.composers) ? oeuvre.composers.join(', ') : oeuvre.composers || '-'}
                  </span>
                </div>
              </Accordion.Header>
              <Accordion.Body className="bg-white p-4 pt-2 border-top border-light">
                <Row className="g-4">
                  {oeuvre.pupitreMedia &&
                    oeuvre.pupitreMedia.map((media, mIdx) => (
                      <React.Fragment key={`${oeuvre._id}-media-${mIdx}`}>
                        {/* Partition */}
                        {media.partition && (
                          <Col md={6} lg={4}>
                            <div className="media-resource-card p-3 rounded-lg border bg-light h-100 d-flex flex-column">
                              <div className="d-flex align-items-start justify-content-between mb-3 text-start">
                                <div className="d-flex align-items-center">
                                  <div className="bg-white p-2 rounded shadow-xs me-3 text-danger">
                                    <FileText size={20} />
                                  </div>
                                  <div>
                                    <div className="fw-bold text-dark small">Partition</div>
                                    <Badge bg="light" text="dark" className="border text-uppercase" style={{ fontSize: '0.65rem' }}>
                                      {media.pupitre}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-auto d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="flex-fill d-flex align-items-center justify-content-center"
                                  onClick={() => window.open(`${BACKEND_URL}/uploads/media/${media.partition}`, '_blank')}
                                >
                                  <Eye size={14} className="me-2" /> Aperçu
                                </Button>
                                <a
                                  href={`${BACKEND_URL}/uploads/media/${media.partition}`}
                                  download={media.partition}
                                  className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <DownloadCloud size={14} className="me-2" /> Télécharger
                                </a>
                              </div>
                            </div>
                          </Col>
                        )}

                        {/* Paroles */}
                        {media.paroles && (
                          <Col md={6} lg={4}>
                            <div className="media-resource-card p-3 rounded-lg border bg-light h-100 d-flex flex-column">
                              <div className="d-flex align-items-start justify-content-between mb-3 text-start">
                                <div className="d-flex align-items-center">
                                  <div className="bg-white p-2 rounded shadow-xs me-3 text-info">
                                    <FileText size={20} />
                                  </div>
                                  <div>
                                    <div className="fw-bold text-dark small">Paroles</div>
                                    <Badge bg="light" text="dark" className="border text-uppercase" style={{ fontSize: '0.65rem' }}>
                                      {media.pupitre}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-auto d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="flex-fill d-flex align-items-center justify-content-center"
                                  onClick={() => window.open(`${BACKEND_URL}/uploads/media/${media.paroles}`, '_blank')}
                                >
                                  <Eye size={14} className="me-2" /> Aperçu
                                </Button>
                                <a
                                  href={`${BACKEND_URL}/uploads/media/${media.paroles}`}
                                  download={media.paroles}
                                  className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <DownloadCloud size={14} className="me-2" /> Télécharger
                                </a>
                              </div>
                            </div>
                          </Col>
                        )}

                        {/* Audio */}
                        {media.audio && (
                          <Col md={12} lg={4}>
                            <div className="media-resource-card p-3 rounded-lg border bg-light h-100">
                              <div className="d-flex align-items-center mb-3 text-start">
                                <div className="bg-white p-2 rounded shadow-xs me-3 text-success">
                                  <Music size={20} />
                                </div>
                                <div>
                                  <div className="fw-bold text-dark small">Enregistrement Sonore</div>
                                  <Badge bg="light" text="dark" className="border text-uppercase" style={{ fontSize: '0.65rem' }}>
                                    {media.pupitre}
                                  </Badge>
                                </div>
                              </div>
                              <audio controls className="w-100 mt-2 shadow-xs rounded" style={{ height: '35px' }}>
                                <source src={`${BACKEND_URL}/uploads/media/${media.audio}`} type="audio/mpeg" />
                                Votre navigateur ne supporte pas l'élément audio.
                              </audio>
                            </div>
                          </Col>
                        )}

                        {/* Vidéo */}
                        {media.video && (
                          <Col md={12} className="text-start">
                            <div className="media-resource-card p-3 rounded-lg border bg-light">
                              <div className="d-flex align-items-center mb-3">
                                <div className="bg-white p-2 rounded shadow-xs me-3 text-warning">
                                  <Video size={20} />
                                </div>
                                <div>
                                  <div className="fw-bold text-dark small">Support Vidéo</div>
                                  <Badge bg="light" text="dark" className="border text-uppercase" style={{ fontSize: '0.65rem' }}>
                                    {media.pupitre}
                                  </Badge>
                                </div>
                              </div>
                              {media.video.startsWith('http') ? (
                                <Button
                                  variant="outline-primary"
                                  className="w-100 d-flex align-items-center justify-content-center fw-bold"
                                  onClick={() => window.open(media.video, '_blank')}
                                >
                                  <PlayCircle size={18} className="me-2" /> Visionner sur plateforme externe
                                </Button>
                              ) : (
                                <video controls className="w-100 rounded border bg-dark" style={{ maxHeight: '350px' }}>
                                  <source src={`${BACKEND_URL}/uploads/media/${media.video}`} type="video/mp4" />
                                  Votre navigateur ne supporte pas la balise vidéo.
                                </video>
                              )}
                            </div>
                          </Col>
                        )}
                      </React.Fragment>
                    ))}
                </Row>
              </Accordion.Body>
            </Accordion.Item>
          ))
        ) : (
          <div className="text-center py-4 text-muted">Aunuce œuvre n'est associée à ce concert.</div>
        )}
      </Accordion>
    </Container>
  );
};

export default CurrentConcertOeuvres;
