import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Spinner, Accordion, Button, Badge } from 'react-bootstrap';
import { Music, FileText, Video, PlayCircle, DownloadCloud, Eye, Calendar, MapPin, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        setError('Pas de concert programmé pour votre pupitre pour le moment. Revenez bientôt !');
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-0 p-5 rounded-xl bg-gradient-to-br from-white to-light">
            <div className="bg-primary-subtle p-4 rounded-circle d-inline-flex mb-4">
              <Music2 size={64} className="text-primary" />
            </div>
            <h3 className="fw-bold text-dark mb-3">{error}</h3>
            <p className="text-muted fs-5">
              Votre carnet de chant sera disponible dès qu'un concert sera planifié pour votre pupitre.
            </p>
            <Button 
              variant="outline-primary" 
              className="mt-3 px-4 py-2 rounded-pill fw-bold"
              onClick={fetchData}
            >
              Actualiser la page
            </Button>
          </Card>
        </motion.div>
      </Container>
    );
  }

  if (!data || !data.concert) return null;

  const { concert, oeuvres } = data;

  return (
    <Container fluid className="px-4 py-4" style={{ maxWidth: '1200px' }}>
      {/* Header / Concert Detail */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="shadow-lg border-0 overflow-hidden mb-5 rounded-xl bg-white">
          <Row className="g-0">
            <Col md={4} lg={3}>
              <div className="h-100 overflow-hidden">
                {concert.poster ? (
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
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
              </div>
            </Col>
            <Col md={8} lg={9}>
              <Card.Body className="p-4 h-100 d-flex flex-column justify-content-center">
                <div className="d-flex align-items-start justify-content-between mb-3 text-start">
                  <div>
                    <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill uppercase tracking-wider small fw-bold shadow-sm">
                      PROCHAIN CONCERT
                    </Badge>
                    <h2 className="fw-bold text-dark mb-1 display-6">{concert.title}</h2>
                  </div>
                </div>

                <Row className="text-muted mt-2">
                  <Col sm={6} className="d-flex align-items-center mb-3 mb-sm-0">
                    <div className="bg-primary-subtle p-3 rounded-circle me-3 text-primary shadow-sm">
                      <Calendar size={24} />
                    </div>
                    <div className="text-start">
                      <div className="small text-uppercase fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                        Date et Heure
                      </div>
                      <div className="fw-semibold fs-5">{formatDate(concert.dateHeure)}</div>
                    </div>
                  </Col>
                  <Col sm={6} className="d-flex align-items-center">
                    <div className="bg-primary-subtle p-3 rounded-circle me-3 text-primary shadow-sm">
                      <MapPin size={24} />
                    </div>
                    <div className="text-start">
                      <div className="small text-uppercase fw-bold text-muted" style={{ fontSize: '0.75rem' }}>
                        Lieu
                      </div>
                      <div className="fw-semibold fs-5">{concert.location || 'Lieu non spécifié'}</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Program / Oeuvres List */}
      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary p-2 rounded-lg me-3 text-white shadow-sm">
          <Music size={24} />
        </div>
        <h3 className="fw-bold m-0 text-dark text-start">Programme du Concert</h3>
      </div>

      <AnimatePresence>
        <Accordion defaultActiveKey="0" className="border-0 bg-transparent">
          {oeuvres && oeuvres.length > 0 ? (
            oeuvres.map((oeuvre, idx) => (
              <motion.div
                key={oeuvre._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <Accordion.Item eventKey={idx.toString()} className="border-0 mb-4 shadow rounded-xl overflow-hidden bg-white">
                  <Accordion.Header className="bg-white border-0 py-3 custom-accordion-header">
                    <div className="d-flex flex-column w-100 pe-3 text-start">
                      <span className="fw-bold text-dark fs-4 mb-1">{oeuvre.title}</span>
                      <span className="text-primary small fw-semibold fst-italic letter-spacing-wide">
                        {Array.isArray(oeuvre.composers) ? oeuvre.composers.join(', ') : oeuvre.composers || '-'}
                      </span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="bg-white p-4 pt-3 border-top border-light">
                    <Row className="g-4">
                      {oeuvre.pupitreMedia &&
                        oeuvre.pupitreMedia.map((media, mIdx) => (
                          <React.Fragment key={`${oeuvre._id}-media-${mIdx}`}>
                            {/* Partition */}
                            {media.partition && (
                              <Col md={6} lg={4}>
                                <motion.div 
                                  whileHover={{ y: -5 }}
                                  className="media-resource-card p-4 rounded-xl border border-light bg-light h-100 d-flex flex-column shadow-xs"
                                >
                                  <div className="d-flex align-items-start justify-content-between mb-3 text-start">
                                    <div className="d-flex align-items-center">
                                      <div className="bg-white p-3 rounded-lg shadow-sm me-3 text-danger">
                                        <FileText size={24} />
                                      </div>
                                      <div>
                                        <div className="fw-bold text-dark">Partition</div>
                                        <Badge bg="white" text="dark" className="border px-2 py-1 text-uppercase mt-1 shadow-sm" style={{ fontSize: '0.65rem' }}>
                                          {media.pupitre}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-auto d-flex gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="flex-fill d-flex align-items-center justify-content-center fw-bold transition-all"
                                      onClick={() => window.open(`${BACKEND_URL}/uploads/media/${media.partition}`, '_blank')}
                                    >
                                      <Eye size={16} className="me-2" /> Aperçu
                                    </Button>
                                    <a
                                      href={`${BACKEND_URL}/uploads/media/${media.partition}`}
                                      download={media.partition}
                                      className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <DownloadCloud size={16} className="me-2" /> Télécharger
                                    </a>
                                  </div>
                                </motion.div>
                              </Col>
                            )}

                            {/* Paroles */}
                            {media.paroles && (
                              <Col md={6} lg={4}>
                                <motion.div 
                                  whileHover={{ y: -5 }}
                                  className="media-resource-card p-4 rounded-xl border border-light bg-light h-100 d-flex flex-column shadow-xs"
                                >
                                  <div className="d-flex align-items-start justify-content-between mb-3 text-start">
                                    <div className="d-flex align-items-center">
                                      <div className="bg-white p-3 rounded-lg shadow-sm me-3 text-info">
                                        <FileText size={24} />
                                      </div>
                                      <div>
                                        <div className="fw-bold text-dark">Paroles</div>
                                        <Badge bg="white" text="dark" className="border px-2 py-1 text-uppercase mt-1 shadow-sm" style={{ fontSize: '0.65rem' }}>
                                          {media.pupitre}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-auto d-flex gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="flex-fill d-flex align-items-center justify-content-center fw-bold transition-all"
                                      onClick={() => window.open(`${BACKEND_URL}/uploads/media/${media.paroles}`, '_blank')}
                                    >
                                      <Eye size={16} className="me-2" /> Aperçu
                                    </Button>
                                    <a
                                      href={`${BACKEND_URL}/uploads/media/${media.paroles}`}
                                      download={media.paroles}
                                      className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <DownloadCloud size={16} className="me-2" /> Télécharger
                                    </a>
                                  </div>
                                </motion.div>
                              </Col>
                            )}

                            {/* Audio */}
                            {media.audio && (
                              <Col md={12} lg={4}>
                                <motion.div 
                                  whileHover={{ y: -5 }}
                                  className="media-resource-card p-4 rounded-xl border border-light bg-light h-100 shadow-xs"
                                >
                                  <div className="d-flex align-items-center mb-3 text-start">
                                    <div className="bg-white p-3 rounded-lg shadow-sm me-3 text-success">
                                      <Music size={24} />
                                    </div>
                                    <div>
                                      <div className="fw-bold text-dark">Enregistrement Sonore</div>
                                      <Badge bg="white" text="dark" className="border px-2 py-1 text-uppercase mt-1 shadow-sm" style={{ fontSize: '0.65rem' }}>
                                        {media.pupitre}
                                      </Badge>
                                    </div>
                                  </div>
                                  <audio controls className="w-100 mt-2 shadow-sm rounded-pill" style={{ height: '40px' }}>
                                    <source src={`${BACKEND_URL}/uploads/media/${media.audio}`} type="audio/mpeg" />
                                    Votre navigateur ne supporte pas l'élément audio.
                                  </audio>
                                </motion.div>
                              </Col>
                            )}

                            {/* Vidéo */}
                            {media.video && (
                              <Col md={12} className="text-start">
                                <motion.div 
                                  whileHover={{ scale: 1.01 }}
                                  className="media-resource-card p-4 rounded-xl border border-light bg-light shadow-xs"
                                >
                                  <div className="d-flex align-items-center mb-3">
                                    <div className="bg-white p-3 rounded-lg shadow-sm me-3 text-warning">
                                      <Video size={24} />
                                    </div>
                                    <div>
                                      <div className="fw-bold text-dark">Support Vidéo</div>
                                      <Badge bg="white" text="dark" className="border px-2 py-1 text-uppercase mt-1 shadow-sm" style={{ fontSize: '0.65rem' }}>
                                        {media.pupitre}
                                      </Badge>
                                    </div>
                                  </div>
                                  {media.video.startsWith('http') ? (
                                    <Button
                                      variant="outline-primary"
                                      className="w-100 d-flex align-items-center justify-content-center fw-bold rounded-pill py-3 shadow-sm transition-all"
                                      onClick={() => window.open(media.video, '_blank')}
                                    >
                                      <PlayCircle size={22} className="me-2" /> Visionner sur plateforme externe
                                    </Button>
                                  ) : (
                                    <div className="overflow-hidden rounded-xl border shadow-sm bg-dark">
                                      <video controls className="w-100" style={{ maxHeight: '450px' }}>
                                        <source src={`${BACKEND_URL}/uploads/media/${media.video}`} type="video/mp4" />
                                        Votre navigateur ne supporte pas la balise vidéo.
                                      </video>
                                    </div>
                                  )}
                                </motion.div>
                              </Col>
                            )}

                            {/* Enregistrement Concert Chœur */}
                            {media.choirRecording && (
                              <Col md={12} lg={4}>
                                <motion.div 
                                  whileHover={{ y: -5 }}
                                  className="media-resource-card p-4 rounded-xl border border-light bg-light h-100 shadow-xs"
                                  style={{ borderLeft: '4px solid #8e44ad' }}
                                >
                                  <div className="d-flex align-items-center mb-3 text-start">
                                    <div className="bg-white p-3 rounded-lg shadow-sm me-3 text-purple" style={{ color: '#8e44ad' }}>
                                      <Music size={24} />
                                    </div>
                                    <div>
                                      <div className="fw-bold text-dark">Enregistrement Concert</div>
                                      <Badge bg="white" text="dark" className="border px-2 py-1 text-uppercase mt-1 shadow-sm" style={{ fontSize: '0.65rem' }}>
                                        {media.pupitre}
                                      </Badge>
                                    </div>
                                  </div>
                                  <audio controls className="w-100 mt-2 shadow-sm rounded-pill" style={{ height: '40px' }}>
                                    <source src={`${BACKEND_URL}/uploads/media/${media.choirRecording}`} type="audio/mpeg" />
                                    Votre navigateur ne supporte pas l'élément audio.
                                  </audio>
                                </motion.div>
                              </Col>
                            )}

                            {/* Vidéo Concert Chœur */}
                            {media.choirVideo && (
                              <Col md={12} className="text-start">
                                <motion.div 
                                  whileHover={{ scale: 1.01 }}
                                  className="media-resource-card p-4 rounded-xl border border-light bg-light shadow-xs"
                                  style={{ borderLeft: '4px solid #e74c3c' }}
                                >
                                  <div className="d-flex align-items-center mb-3">
                                    <div className="bg-white p-3 rounded-lg shadow-sm me-3 text-danger">
                                      <Video size={24} />
                                    </div>
                                    <div>
                                      <div className="fw-bold text-dark">Vidéo Concert Chœur</div>
                                      <Badge bg="white" text="dark" className="border px-2 py-1 text-uppercase mt-1 shadow-sm" style={{ fontSize: '0.65rem' }}>
                                        {media.pupitre}
                                      </Badge>
                                    </div>
                                  </div>
                                  {media.choirVideo.startsWith('http') ? (
                                    <Button
                                      variant="outline-danger"
                                      className="w-100 d-flex align-items-center justify-content-center fw-bold rounded-pill py-3 shadow-sm transition-all"
                                      onClick={() => window.open(media.choirVideo, '_blank')}
                                    >
                                      <PlayCircle size={22} className="me-2" /> Visionner le concert (Lien externe)
                                    </Button>
                                  ) : (
                                    <div className="overflow-hidden rounded-xl border shadow-sm bg-dark">
                                      <video controls className="w-100" style={{ maxHeight: '450px' }}>
                                        <source src={`${BACKEND_URL}/uploads/media/${media.choirVideo}`} type="video/mp4" />
                                        Votre navigateur ne supporte pas la balise vidéo.
                                      </video>
                                    </div>
                                  )}
                                </motion.div>
                              </Col>
                            )}
                          </React.Fragment>
                        ))}
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-5 text-muted bg-white shadow-sm rounded-xl"
            >
              <Music2 size={48} className="mb-3 opacity-20" />
              <div className="fs-5 fw-semibold">Aucune œuvre n'est associée à ce concert.</div>
            </motion.div>
          )}
        </Accordion>
      </AnimatePresence>
    </Container>
  );
};

export default CurrentConcertOeuvres;
