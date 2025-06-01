import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Badge } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { getMembershipSubmissions, acceptMembership, refuseMembership } from '../../../services/accounts.service';

function ManageMembership() {
  const [memberships, setMemberships] = useState([]);

  const fetchMemberships = async () => {
    try {
      const data = await getMembershipSubmissions();
      setMemberships(data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de récupérer les candidatures.'
      });
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const handleAccept = async (id) => {
    Swal.fire({
      title: "Traitement de l'acceptation...",
      text: 'Veuillez patienter.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await acceptMembership(id);
      Swal.fire({
        icon: 'success',
        title: 'Accepté avec succès',
        text: 'Les coordonnées ont été envoyées.',
        confirmButtonText: 'OK'
      });
      fetchMemberships();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Échec de l’acceptation.'
      });
    }
  };

  const handleRefuse = async (id) => {
    const { value: reason } = await Swal.fire({
      title: 'Motif du refus',
      input: 'textarea',
      inputLabel: 'Veuillez entrer la raison du refus',
      inputPlaceholder: 'Tapez votre raison ici...',
      inputAttributes: {
        'aria-label': 'Raison du refus',
        maxlength: 500
      },
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      confirmButtonColor: '#a52a2a',
      cancelButtonText: 'Annuler',
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'Le motif ne peut pas être vide.';
        }
      }
    });

    if (reason) {
      Swal.fire({
        title: 'Traitement du refus...',
        text: 'Veuillez patienter.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await refuseMembership(id, reason);
        Swal.fire({
          icon: 'success',
          title: 'Rejeté avec succès',
          text: 'Un email avec le motif de refus a été envoyé.',
          confirmButtonText: 'OK'
        });
        fetchMemberships();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Échec du refus.'
        });
      }
    }
  };

  return (
    <Container style={{ marginTop: '40px' }}>
      <h2 className="text-center mb-4" style={{ color: '#4b2e2e' }}>
        {/* Gestion des candidatures des choristes */}
      </h2>

      {memberships.length === 0 ? (
        <p className="text-center">Aucune candidature en attente.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {memberships.map((m) => (
            <Col key={m._id}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>
                    {m.firstName} {m.lastName}
                  </Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">{m.email}</Card.Subtitle>

                  <div className="mb-2">
                    <Badge bg="secondary" className="me-2">
                      {m.gender}
                    </Badge>
                    <Badge bg="info">{new Date(m.birthDate).toLocaleDateString('fr-TN')}</Badge>
                  </div>

                  <Card.Text>
                    <strong>Nationalité:</strong> {m.nationality}
                    <br />
                    <strong>CIN:</strong> {m.cin}
                    <br />
                    <strong>Taille:</strong> {m.height} cm
                    <br />
                    <strong>Situation pro:</strong> {m.professionalSituation}
                    <br />
                    <strong>Téléphone:</strong> {m.phone}
                  </Card.Text>

                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="dark" size="sm" onClick={() => handleAccept(m._id)}>
                      Accepter
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleRefuse(m._id)}>
                      Refuser
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default ManageMembership;
