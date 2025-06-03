import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Button, Form, Pagination } from 'react-bootstrap';
import { getAcceptedMemberships } from '../../../services/accounts.service';
import { FaEnvelope, FaVenusMars, FaBirthdayCake, FaGlobe, FaIdCard, FaPhone, FaBriefcase, FaRulerVertical, FaMusic } from 'react-icons/fa';

const ITEMS_PER_PAGE = 6;

function ListChoriste() {
  const [choristers, setChoristers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchChoristers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAcceptedMemberships();
      setChoristers(data);
    } catch {
      setError('Impossible de récupérer les choristes acceptés.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChoristers();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredChoristers = choristers.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(filteredChoristers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentChoristers = filteredChoristers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container style={{ marginTop: 40, maxWidth: 1200 }}>
      <Form.Group className="mb-4 d-flex" controlId="searchChoriste">
        <Form.Control
          type="text"
          placeholder="Rechercher par nom ou prénom"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset page on search
          }}
          style={{ maxWidth: '320px' }}
        />
      </Form.Group>

      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 250 }}>
          <Spinner animation="border" variant="secondary" />
        </div>
      )}

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
          <div className="mt-3">
            <Button variant="outline-danger" size="sm" onClick={fetchChoristers}>
              Réessayer
            </Button>
          </div>
        </Alert>
      )}

      {!loading && !error && filteredChoristers.length === 0 && (
        <p className="text-center text-muted" style={{ fontSize: '1.1rem' }}>
          Aucun choriste trouvé.
        </p>
      )}

      <Row xs={1} sm={2} md={2} lg={3} className="g-4">
        {currentChoristers.map((choriste) => (
          <Col key={choriste._id}>
            <Card
              className="h-100 shadow-sm"
              style={{
                borderRadius: 12,
                borderColor: '#c3a17d',
                transition: 'box-shadow 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 20px rgba(195, 161, 125, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)')}
            >
              <Card.Body>
                <Card.Title style={{ color: '#4b2e2e', fontWeight: 600, fontSize: '1.3rem', marginBottom: 15 }}>
                  {choriste.firstName} {choriste.lastName}
                </Card.Title>
                <Card.Text style={{ fontSize: '0.95rem', color: '#4b2e2e', lineHeight: 1.5 }}>
                  <FaEnvelope style={{ marginRight: 6, color: '#a67c00' }} />
                  {choriste.email}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaVenusMars style={{ marginRight: 6 }} />
                  <strong>Genre:</strong> {choriste.gender || 'N/A'}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaBirthdayCake style={{ marginRight: 6 }} />
                  <strong>Date de naissance:</strong> {formatDate(choriste.birthDate)}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaGlobe style={{ marginRight: 6 }} />
                  <strong>Nationalité:</strong> {choriste.nationality || 'N/A'}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaIdCard style={{ marginRight: 6 }} />
                  <strong>CIN:</strong> {choriste.cin || 'N/A'}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaPhone style={{ marginRight: 6 }} />
                  <strong>Téléphone:</strong> {choriste.phone || 'N/A'}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaBriefcase style={{ marginRight: 6 }} />
                  <strong>Situation pro.:</strong> {choriste.professionalSituation || 'N/A'}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaRulerVertical style={{ marginRight: 6 }} />
                  <strong>Taille:</strong> {choriste.height ? `${choriste.height} cm` : 'N/A'}
                </Card.Text>
                <Card.Text style={{ fontSize: '0.9rem', color: '#6b4a22' }}>
                  <FaMusic style={{ marginRight: 6 }} />
                  <strong>Pupitre:</strong> {choriste.pupitre || 'N/A'}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      {filteredChoristers.length > ITEMS_PER_PAGE && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            {[...Array(totalPages)].map((_, idx) => (
              <Pagination.Item key={idx + 1} active={currentPage === idx + 1} onClick={() => handlePageChange(idx + 1)}>
                {idx + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </div>
      )}
    </Container>
  );
}

export default ListChoriste;
