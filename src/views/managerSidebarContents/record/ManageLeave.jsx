import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { getAllLeaves, acceptLeave } from '../../../services/conge.service';
import { FaCalendarAlt, FaUserAlt, FaClock, FaCommentDots } from 'react-icons/fa';
import Swal from 'sweetalert2';

function ManageLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true); // For initial loading
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null); // For tracking acceptance per item

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllLeaves();
      setLeaves(data);
    } catch {
      setError('Impossible de récupérer les demandes de congé.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (leaveId) => {
    setAcceptingId(leaveId);

    // Show SweetAlert loading popup
    Swal.fire({
      title: 'Veuillez patienter...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await acceptLeave(leaveId);
      await fetchLeaves();

      // Close loading
      Swal.close();

      // Show success toast
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Congé accepté avec succès',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      // Close loading
      Swal.close();

      // Show error toast
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: "Erreur lors de l'acceptation du congé",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success">Accepté</Badge>;
      case 'pending':
        return (
          <Badge bg="warning" text="dark">
            En attente
          </Badge>
        );
      case 'rejected':
        return <Badge bg="danger">Rejeté</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <Container style={{ marginTop: 40, maxWidth: 1200 }}>
      <h2 className="text-center mb-4 fw-bold text-black" style={{ fontSize: '1.5rem' }}>
        Demandes de Congé
      </h2>

      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 250 }}>
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
          <div className="mt-3">
            <Button variant="outline-danger" size="sm" onClick={fetchLeaves}>
              Réessayer
            </Button>
          </div>
        </Alert>
      )}

      {!loading && !error && leaves.length === 0 && (
        <div className="text-center text-muted fs-5">Aucune demande de congé pour le moment.</div>
      )}

      <Row xs={1} sm={2} md={2} lg={3} className="g-4">
        {leaves.map((leave) => (
          <Col key={leave._id}>
            <Card
              className="shadow-sm border-0 rounded-4"
              style={{
                minHeight: leave.status === 'approved' ? '140px' : '220px',
                transition: 'min-height 0.3s ease'
              }}
            >
              <Card.Body className="d-flex flex-column justify-content-between">
                <div>
                  <Card.Title className="mb-3 text-dark fs-5 fw-semibold d-flex align-items-center">
                    <FaUserAlt className="me-2 text-secondary" />
                    {leave.user?.firstName} {leave.user?.lastName}
                  </Card.Title>

                  <Card.Text className="text-muted mb-2">
                    <FaCalendarAlt className="me-2" />
                    <strong>Du:</strong> {formatDate(leave.startDate)} <strong>au</strong> {formatDate(leave.endDate)}
                  </Card.Text>

                  <Card.Text className="text-muted mb-2">
                    <FaClock className="me-2" />
                    <strong>Statut:</strong> {renderStatusBadge(leave.status)}
                  </Card.Text>

                  <Card.Text className="text-muted mb-3">
                    <FaCommentDots className="me-2" />
                    <strong>Raison:</strong> {leave.reason || 'Non spécifiée'}
                  </Card.Text>
                </div>

                {leave.status === 'pending' && (
                  <div className="d-flex justify-content-end">
                    <Button variant="primary" size="sm" onClick={() => handleAccept(leave._id)} disabled={acceptingId === leave._id}>
                      {acceptingId === leave._id ? <Spinner animation="border" size="sm" /> : 'Accepter'}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default ManageLeave;
