import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { declareLeave } from '../../../services/conge.service';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';

const MySwal = withReactContent(Swal);

const DeclareLeave = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('User ID is required. Please log in again.');
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

    setLoading(true);
    try {
      await declareLeave(userId, { startDate, endDate, reason });

      // Show SweetAlert2 toast success notification
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Congé déclaré avec succès.',
        showConfirmButton: false,
        timer: 3000,
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
    return <p>Chargement des informations utilisateur...</p>;
  }

  return (
    <Container style={{ maxWidth: 600, marginTop: 50, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <Card
        className="shadow-lg"
        style={{
          borderRadius: '1rem',
          padding: '2rem',
          backgroundColor: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Card.Body>
          <h2 className="text-center mb-4" style={{ fontWeight: 700, fontSize: '2.25rem', color: '#222' }}>
            Déclarer un congé
          </h2>

          {error && (
            <Alert variant="danger" className="rounded-3" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="startDate">
              <Form.Label style={{ fontWeight: 600, fontSize: '1.1rem', color: '#444' }}>Date de début</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-4" controlId="endDate">
              <Form.Label style={{ fontWeight: 600, fontSize: '1.1rem', color: '#444' }}>Date de fin</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </Form.Group>

            <Form.Group className="mb-5" controlId="reason">
              <Form.Label style={{ fontWeight: 600, fontSize: '1.1rem', color: '#444' }}>Raison (optionnel)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Entrez une raison si vous le souhaitez"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Form.Group>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-100 fw-semibold"
              style={{ fontSize: '1.2rem', padding: '12px', borderRadius: '0.7rem' }}
            >
              {loading ? 'Déclaration en cours...' : 'Déclarer le congé'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DeclareLeave;
