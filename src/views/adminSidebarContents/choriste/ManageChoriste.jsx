import React, { useEffect, useState } from 'react';
import {
  Container,
  Table,
  Spinner,
  Alert,
  Button,
  Form,
  Row,
  Col,
  Pagination
} from 'react-bootstrap';
import { getAcceptedMemberships } from '../../../services/accounts.service';

function ManageChoriste() {
  const [choristers, setChoristers] = useState([]);
  const [filteredChoristers, setFilteredChoristers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const fetchChoristers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAcceptedMemberships();
      setChoristers(data);
      setFilteredChoristers(data);
    } catch {
      setError('Impossible de récupérer les choristes acceptés.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChoristers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = choristers.filter((ch) =>
      `${ch.firstName} ${ch.lastName}`.toLowerCase().includes(term)
    );
    setFilteredChoristers(filtered);
    setCurrentPage(1);
  }, [searchTerm, choristers]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const totalPages = Math.ceil(filteredChoristers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentChoristers = filteredChoristers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        />
        {Array.from({ length: totalPages }, (_, i) => (
          <Pagination.Item
            key={i + 1}
            active={i + 1 === currentPage}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        />
      </Pagination>
    );
  };

  return (
    <Container style={{ marginTop: 40 }}>
      <Row className="mb-4 align-items-center">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>

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

      {!loading && !error && currentChoristers.length === 0 && (
        <p className="text-center text-muted" style={{ fontSize: '1.1rem' }}>
          Aucun choriste correspondant à votre recherche.
        </p>
      )}

      {!loading && !error && currentChoristers.length > 0 && (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Genre</th>
              <th>Date de naissance</th>
              <th>Nationalité</th>
              <th>CIN</th>
              <th>Téléphone</th>
              <th>Situation pro</th>
              <th>Taille (cm)</th>
              <th>Pupitre</th>
            </tr>
          </thead>
          <tbody>
            {currentChoristers.map((ch) => (
              <tr key={ch._id}>
                <td>{ch.firstName} {ch.lastName}</td>
                <td>{ch.email}</td>
                <td>{ch.gender || 'N/A'}</td>
                <td>{formatDate(ch.birthDate)}</td>
                <td>{ch.nationality || 'N/A'}</td>
                <td>{ch.cin || 'N/A'}</td>
                <td>{ch.phone || 'N/A'}</td>
                <td>{ch.professionalSituation || 'N/A'}</td>
                <td>{ch.height || 'N/A'}</td>
                <td>{ch.pupitre || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {renderPagination()}
    </Container>
  );
}

export default ManageChoriste;
