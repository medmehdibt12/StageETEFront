/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { declareLeave } from '../../../services/conge.service';
import { Container, Form, Button, Alert, Card, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { FaCalendarPlus, FaCalendarAlt, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { Calendar, MessageSquare, User, Clock, Send } from 'lucide-react';

const MySwal = withReactContent(Swal);

const DeclareLeave = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Calculate duration in days
  const getDurationInDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // 1) Si l'utilisateur est en congé, on n'affiche ni formulaire ni bouton
  if (user?.status === 'En congé') {
    return (
      <Container fluid className="py-5" style={{ maxWidth: '800px' }}>
        <Card className="shadow-sm border-0 text-center" style={{ borderRadius: '16px' }}>
          <Card.Body className="p-5">
            <div className="mb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706'
                }}
              >
                <FaExclamationTriangle size={32} />
              </div>
              <h3 className="fw-bold text-dark mb-3">Vous êtes actuellement en congé</h3>
              <p className="text-muted fs-5 mb-4">Impossible de déclarer un nouveau congé pendant cette période.</p>
              <Badge bg="warning" text="dark" className="px-3 py-2 fs-6">
                <Clock size={16} className="me-2" />
                Statut: En congé
              </Badge>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Identifiant utilisateur requis. Veuillez vous reconnecter.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Veuillez renseigner la date de début et la date de fin.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('La date de fin doit être postérieure ou égale à la date de début.');
      return;
    }

    // Check if start date is in the past
    if (new Date(startDate) < new Date(today)) {
      setError('La date de début ne peut pas être dans le passé.');
      return;
    }

    setLoading(true);
    try {
      await declareLeave(userId, { startDate, endDate, reason });

      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Congé déclaré avec succès',
        text: "Votre demande sera examinée par l'administration",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });

      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      setError(err.message || 'Erreur lors de la déclaration du congé.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 text-muted">Chargement des informations utilisateur...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-5" style={{ maxWidth: '900px' }}>
      {/* ✅ HEADER SECTION */}
      <div className="mb-4">
        <Row className="align-items-center">
          <Col>
            <h2 className="fw-bold text-dark mb-1">
              <FaCalendarPlus className="me-3 text-primary" />
              Déclarer un Congé
            </h2>
            <p className="text-muted mb-0">Soumettez votre demande de congé à l'administration</p>
          </Col>
          <Col xs="auto">
            {/* <Badge bg="info" className="px-3 py-2">
              <User size={16} className="me-2" />
              {user.firstName} {user.lastName}
            </Badge> */}
          </Col>
        </Row>
      </div>

      <Row>
        <Col lg={8}>
          {/* ✅ MAIN FORM CARD */}
          <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
              <h5 className="fw-semibold mb-0">
                <Calendar className="me-2 text-primary" size={20} />
                Informations du congé
              </h5>
            </Card.Header>

            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="border-0 mb-4" style={{ borderRadius: '12px' }}>
                  <FaExclamationTriangle className="me-2" />
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold mb-2 text-dark">
                        <FaCalendarAlt className="me-2 text-primary" />
                        Date de début
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={today}
                        required
                        style={{
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb',
                          fontSize: '14px',
                          padding: '12px 16px'
                        }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold mb-2 text-dark">
                        <FaCalendarAlt className="me-2 text-primary" />
                        Date de fin
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || today}
                        required
                        style={{
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb',
                          fontSize: '14px',
                          padding: '12px 16px'
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-2 text-dark">
                    <MessageSquare className="me-2 text-primary" size={16} />
                    Raison du congé
                    <small className="text-muted ms-2">(optionnel)</small>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Expliquez brièvement la raison de votre congé..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      fontSize: '14px',
                      padding: '12px 16px',
                      resize: 'vertical'
                    }}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button
                    type="submit"
                    disabled={loading || !startDate || !endDate}
                    variant="primary"
                    size="lg"
                    style={{
                      borderRadius: '12px',
                      fontWeight: '600',
                      padding: '14px 32px',
                      fontSize: '16px'
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Déclaration en cours...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="me-2" />
                        Soumettre la demande
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* ✅ SUMMARY SIDEBAR */}
          <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-light border-0 pt-4 px-4 pb-3">
              <h6 className="fw-semibold mb-0 text-dark">
                <FaInfoCircle className="me-2 text-info" />
                Résumé de la demande
              </h6>
            </Card.Header>
            <Card.Body className="p-4">
              {/* <div className="mb-3">
                <small className="text-muted text-uppercase fw-semibold">Demandeur</small>
                <div className="mt-1">
                  <div className="fw-semibold text-dark">
                    {user.firstName} {user.lastName}
                  </div>
                  <small className="text-muted">{user.email}</small>
                </div>
              </div> */}

              {startDate && (
                <div className="mb-3">
                  <small className="text-muted text-uppercase fw-semibold">Date de début</small>
                  <div className="mt-1 fw-semibold text-dark">
                    {new Date(startDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {endDate && (
                <div className="mb-3">
                  <small className="text-muted text-uppercase fw-semibold">Date de fin</small>
                  <div className="mt-1 fw-semibold text-dark">
                    {new Date(endDate).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {startDate && endDate && (
                <div className="mb-3">
                  <small className="text-muted text-uppercase fw-semibold">Durée</small>
                  <div className="mt-1">
                    <Badge bg="primary" className="px-2 py-1">
                      {getDurationInDays()} jour(s)
                    </Badge>
                  </div>
                </div>
              )}

              {reason && (
                <div className="mb-3">
                  <small className="text-muted text-uppercase fw-semibold">Raison</small>
                  <div className="mt-1 text-dark" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                    {reason}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* ✅ INFO CARD */}
          <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h6 className="fw-semibold mb-3 text-dark">
                <FaInfoCircle className="me-2 text-info" />
                Informations importantes
              </h6>
              <ul className="list-unstyled mb-0" style={{ fontSize: '14px' }}>
                <li className="mb-2 text-muted">
                  <FaCheck className="me-2 text-success" />
                  Votre demande sera examinée par l'administration
                </li>
                <li className="mb-2 text-muted">
                  <FaCheck className="me-2 text-success" />
                  Vous recevrez une notification par email
                </li>
                <li className="mb-0 text-muted">
                  <FaCheck className="me-2 text-success" />
                  Les dates ne peuvent pas être dans le passé
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DeclareLeave;
