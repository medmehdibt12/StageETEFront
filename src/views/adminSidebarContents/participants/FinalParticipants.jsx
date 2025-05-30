import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { MdEmail } from 'react-icons/md';
import { FaVenusMars, FaPhone, FaGlobe, FaMusic } from 'react-icons/fa';

import { getConcerts, getFinalParticipantsForConcert } from '../../../services/concert.service';

const FinalParticipants = () => {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch concerts
  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const data = await getConcerts();
        const formattedConcerts = data.map((concert) => ({
          value: concert._id,
          label: `${concert.title} — ${new Date(concert.dateHeure).toLocaleDateString('fr-TN')}`
        }));
        setConcerts(formattedConcerts);
      } catch (err) {
        setError('Erreur lors du chargement des concerts.');
      }
    };
    fetchConcerts();
  }, []);

  // Fetch participants for selected concert
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedConcert) return;
      setLoading(true);
      try {
        const data = await getFinalParticipantsForConcert(selectedConcert.value);
        setParticipants(data);
        setError('');
      } catch (err) {
        setError('Erreur lors du chargement des participants.');
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [selectedConcert]);

  // Group by pupitre
  const groupedByPupitre = participants.reduce((acc, choriste) => {
    const pupitre = choriste.pupitre || 'Non défini';
    acc[pupitre] = acc[pupitre] || [];
    acc[pupitre].push(choriste);
    return acc;
  }, {});

  return (
    <Container style={{ marginTop: '40px' }}>
      <h2 className="text-center mb-4" style={{ color: '#4b2e2e' }}>
        Liste Finale des Participants au Concert
      </h2>

      {/* Select Concert */}
      <div className="mb-4" style={{ maxWidth: 500, margin: '0 auto' }}>
        <label className="form-label fw-bold">Choisir un concert</label>
        <Select
          options={concerts}
          value={selectedConcert}
          onChange={setSelectedConcert}
          placeholder="Sélectionnez un concert..."
          isClearable
          styles={{
            control: (base) => ({
              ...base,

              boxShadow: 'none'
            })
          }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="secondary" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {/* No Participants */}
      {!loading && selectedConcert && Object.keys(groupedByPupitre).length === 0 && (
        <p className="text-center">Aucun participant disponible pour ce concert.</p>
      )}

      {/* Participants grouped by pupitre */}
      {!loading &&
        Object.entries(groupedByPupitre).map(([pupitre, choristes]) => (
          <div key={pupitre} className="mb-5">
            <h4
              className="mb-3 d-flex align-items-center justify-content-between flex-wrap"
              style={{ borderBottom: '1px solid black', paddingBottom: '4px' }}
            >
              <span className="d-flex align-items-center text-capitalize text-dark" style={{ fontSize: '1rem' }}>
                <FaMusic className="me-1 text-primary" size={16} />
                {pupitre}
              </span>
              <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.8rem', padding: '0.25em 0.5em' }}>
                {choristes.length} membre{choristes.length > 1 ? 's' : ''}
              </span>
            </h4>

            <Row xs={1} sm={2} md={3} className="g-4">
              {choristes.map((choriste) => (
                <Col key={choriste._id}>
                  <Card style={{ borderColor: '#8b5e3c', borderWidth: '2px' }} className="shadow-sm">
                    <Card.Body>
                      <Card.Title style={{ color: '#4b2e2e' }}>
                        {choriste.firstName} {choriste.lastName}
                      </Card.Title>
                      <Card.Text className="text-muted" style={{ fontSize: '0.95rem' }}>
                        <p>
                          <MdEmail className="me-2 text-secondary" /> <strong>Email:</strong> {choriste.email}
                        </p>
                        <p>
                          <FaVenusMars className="me-2 text-secondary" /> <strong>Genre:</strong> {choriste.gender}
                        </p>
                        <p>
                          <FaPhone className="me-2 text-secondary" /> <strong>Téléphone:</strong> {choriste.phone}
                        </p>
                        <p>
                          <FaGlobe className="me-2 text-secondary" /> <strong>Nationalité:</strong> {choriste.nationality}
                        </p>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}
    </Container>
  );
};

export default FinalParticipants;
