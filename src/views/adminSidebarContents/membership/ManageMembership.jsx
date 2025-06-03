import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Badge } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { getMembershipSubmissions, sendTestDates } from '../../../services/accounts.service';

function ManageMembership() {
  const [memberships, setMemberships] = useState([]);

  const fetchMemberships = async () => {
    try {
      const data = await getMembershipSubmissions();
      setMemberships(data);
    } catch {
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

  const handleAcceptAll = async () => {
    const { value: dates } = await Swal.fire({
      title: 'Choisissez les dates de test',
      html: `<input type="date" id="swal-input1" class="swal2-input">` + `<input type="date" id="swal-input2" class="swal2-input">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Envoyer dates',
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const startDate = document.getElementById('swal-input1').value;
        const endDate = document.getElementById('swal-input2').value;
        if (!startDate || !endDate) {
          Swal.showValidationMessage('Les deux dates sont requises.');
          return null;
        }
        if (endDate < startDate) {
          Swal.showValidationMessage('La date de fin doit être postérieure à la date de début.');
          return null;
        }
        return { startDate, endDate };
      }
    });
    if (!dates) return;
    Swal.fire({
      title: 'Envoi des dates de test...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
    try {
      await sendTestDates(dates.startDate, dates.endDate);
      Swal.fire({
        icon: 'success',
        title: 'Dates envoyées',
        text: 'Les dates de test ont été envoyées.',
        confirmButtonText: 'OK'
      });
      fetchMemberships();
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible d’envoyer les dates de test.'
      });
    }
  };

  // const handleRefuse = async (id) => {
  //   const { value: reason } = await Swal.fire({
  //     title: 'Motif du refus',
  //     input: 'textarea',
  //     inputLabel: 'Entrez le motif',
  //     showCancelButton: true,
  //     confirmButtonText: 'Envoyer',
  //     inputValidator: (value) => {
  //       if (!value.trim()) return 'Le motif ne peut pas être vide.';
  //     }
  //   });
  //   if (!reason) return;
  //   Swal.fire({
  //     title: 'Traitement du refus...',
  //     allowOutsideClick: false,
  //     didOpen: () => Swal.showLoading()
  //   });
  //   try {
  //     await refuseMembership(id, reason);
  //     Swal.fire({
  //       icon: 'success',
  //       title: 'Rejeté',
  //       text: 'Email de refus envoyé.',
  //       confirmButtonText: 'OK'
  //     });
  //     fetchMemberships();
  //   } catch {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Erreur',
  //       text: 'Échec du refus.'
  //     });
  //   }
  // };

  return (
    <Container style={{ marginTop: '40px' }}>
      {/* <h2 className="text-center mb-4" style={{ color: '#4b2e2e' }}>
        Gestion des candidatures des choristes
      </h2> */}

      {memberships.length > 0 && (
        <div className="text-center mb-4">
          <Button variant="primary" onClick={handleAcceptAll}>
            Accepter tout pour test
          </Button>
        </div>
      )}

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
                    <strong>Nationalité :</strong> {m.nationality}
                    <br />
                    <strong>CIN :</strong> {m.cin}
                    <br />
                    <strong>Taille :</strong> {m.height} cm
                    <br />
                    <strong>Situation pro :</strong> {m.professionalSituation}
                    <br />
                    <strong>Téléphone :</strong> {m.phone}
                  </Card.Text>
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
