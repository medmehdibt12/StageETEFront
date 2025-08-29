import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { getAcceptedMemberships } from '../../../services/accounts.service';
import {
  FaEnvelope,
  FaVenusMars,
  FaBirthdayCake,
  FaGlobe,
  FaIdCard,
  FaPhone,
  FaBriefcase,
  FaRulerVertical,
  FaSearch,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from 'react-icons/fa';

function ListChoriste() {
  const [choristers, setChoristers] = useState([]);
  const [filteredChoristers, setFilteredChoristers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const pageSizeOptions = [6, 12, 18, 24];

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

  // ✅ RESET PAGINATION WHEN SEARCH CHANGES
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = choristers.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.pupitre?.toLowerCase().includes(term)
    );
    setFilteredChoristers(filtered);
  }, [searchTerm, choristers]);

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const getTotalItems = () => filteredChoristers.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
    const start = currentPage * itemsPerPage;
    return filteredChoristers.slice(start, start + itemsPerPage);
  };

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0);
  };

  const goToFirstPage = () => setCurrentPage(0);
  const goToPreviousPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(getTotalPages() - 1, currentPage + 1));
  const goToLastPage = () => setCurrentPage(getTotalPages() - 1);

  const isFirstPage = () => currentPage === 0;
  const isLastPage = () => currentPage >= getTotalPages() - 1;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPhone = (phone, countryCode) => {
    if (!phone) return 'N/A';
    if (countryCode && phone) {
      return `${countryCode} ${phone}`;
    }
    return phone;
  };

  const getPupitreColor = (pupitre) => {
    switch (pupitre?.toLowerCase()) {
      case 'soprano':
        return 'primary';
      case 'alto':
        return 'success';
      case 'ténor':
        return 'warning';
      case 'basse':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getGenderColor = (gender) => {
    return gender === 'Homme' ? 'info' : 'warning';
  };

  return (
    <Container style={{ marginTop: '2rem' }}>
      {/* ✅ BEAUTIFUL HEADER */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="p-3 rounded-circle me-3" style={{ backgroundColor: '#c3a17d20' }}>
                  <FaUsers size={24} style={{ color: '#c3a17d' }} />
                </div>
                <div>
                  <h4 className="mb-1" style={{ color: '#4b2e2e', fontWeight: 600 }}>
                    Annuaire des Choristes
                  </h4>
                  <p className="text-muted mb-0">Découvrez tous les membres acceptés de notre choeur</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ✅ SEARCH AND STATS */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col lg={6}>
              <InputGroup className="mb-3 mb-lg-0">
                <InputGroup.Text
                  style={{
                    backgroundColor: '#f8f9fa',
                    borderColor: '#c3a17d',
                    color: '#c3a17d'
                  }}
                >
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher par nom, prénom, email ou pupitre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderColor: '#c3a17d',
                    fontSize: '14px'
                  }}
                />
              </InputGroup>
            </Col>
            <Col lg={6}>
              <div className="d-flex justify-content-lg-end gap-3">
                <Badge bg="primary" className="px-3 py-2">
                  <FaUsers className="me-2" />
                  {getTotalItems()} choriste{getTotalItems() !== 1 ? 's' : ''}
                </Badge>
                <Badge bg="secondary" className="px-3 py-2">
                  Page {currentPage + 1}/{getTotalPages() || 1}
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ✅ LOADING STATE */}
      {loading && (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <span className="ms-3 text-muted">Chargement des choristes...</span>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* ✅ ERROR STATE */}
      {error && (
        <Alert variant="danger" className="text-center shadow-sm">
          <h6>Erreur de chargement</h6>
          <p className="mb-3">{error}</p>
          <Button variant="outline-danger" size="sm" onClick={fetchChoristers}>
            <FaSearch className="me-2" />
            Réessayer
          </Button>
        </Alert>
      )}

      {/* ✅ NO RESULTS STATE */}
      {!loading && !error && getTotalItems() === 0 && (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <div className="text-center py-5">
              <FaUsers size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Aucun choriste trouvé</h5>
              <p className="text-muted mb-0">
                {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun choriste accepté dans le système.'}
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* ✅ CHORISTER CARDS */}
      {!loading && !error && getTotalItems() > 0 && (
        <>
          <Row xs={1} sm={2} lg={3} xl={4} className="g-4 mb-4">
            {getPaginatedData().map((choriste) => (
              <Col key={choriste._id}>
                <Card
                  className="h-100 shadow-sm"
                  style={{
                    borderRadius: 12,
                    borderColor: '#c3a17d',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(195, 161, 125, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  <Card.Body className="p-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Card.Title
                        style={{
                          color: '#4b2e2e',
                          fontWeight: 600,
                          fontSize: '1.2rem',
                          marginBottom: 0,
                          lineHeight: 1.3
                        }}
                      >
                        {choriste.firstName} {choriste.lastName}
                      </Card.Title>
                      <Badge bg={getPupitreColor(choriste.pupitre)} pill>
                        {choriste.pupitre || 'N/A'}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <FaEnvelope style={{ color: '#c3a17d', width: '16px' }} />
                        <small className="ms-2 text-muted text-truncate">{choriste.email}</small>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaPhone style={{ color: '#c3a17d', width: '16px' }} />
                        <small className="ms-2 text-muted">{formatPhone(choriste.phone, choriste.phoneCountryCode)}</small>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="border-top pt-3">
                      <Row className="g-2">
                        <Col md={6}>
                          <div className="d-flex align-items-center">
                            <FaVenusMars style={{ color: '#c3a17d', width: '14px' }} />
                            <Badge bg={getGenderColor(choriste.gender)} size="sm" className="ms-2">
                              {choriste.gender || 'N/A'}
                            </Badge>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="d-flex align-items-center">
                            <FaRulerVertical style={{ color: '#c3a17d', width: '14px' }} />
                            <small className="ms-2 text-muted">{choriste.height ? `${choriste.height}cm` : 'N/A'}</small>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="d-flex align-items-center">
                            <FaBirthdayCake style={{ color: '#c3a17d', width: '14px' }} />
                            <small className="ms-2 text-muted">{formatDate(choriste.birthDate)}</small>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="d-flex align-items-center">
                            <FaGlobe style={{ color: '#c3a17d', width: '14px' }} />
                            <small className="ms-2 text-muted">{choriste.nationality || 'N/A'}</small>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="d-flex align-items-center">
                            <FaIdCard style={{ color: '#c3a17d', width: '14px' }} />
                            <small className="ms-2 text-muted">{choriste.cin || choriste.identityNumber || 'N/A'}</small>
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="d-flex align-items-start">
                            <FaBriefcase style={{ color: '#c3a17d', width: '14px', marginTop: '2px' }} />
                            <small className="ms-2 text-muted" style={{ lineHeight: 1.3 }}>
                              {choriste.professionalSituation || 'N/A'}
                            </small>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ✅ RESPONSIVE PROFESSIONAL PAGINATION */}
          {getTotalPages() > 0 && (
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 bg-light gap-2">
                  <div className="d-flex align-items-center order-2 order-md-1">
                    <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                      <span className="d-none d-sm-inline">Choristes par page:</span>
                      <span className="d-sm-none">Par page:</span>
                    </span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto', fontSize: '13px' }}
                      value={itemsPerPage}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    >
                      {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-muted order-1 order-md-2" style={{ fontSize: '13px' }}>
                    {getStartIndex()}-{getEndIndex()} sur {getTotalItems()}
                  </div>

                  <div className="d-flex align-items-center order-3">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToFirstPage}
                      disabled={isFirstPage()}
                      className="me-1"
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isFirstPage() ? '#6c757d' : '#495057',
                        padding: '4px 8px'
                      }}
                      title="Première page"
                    >
                      <FaAngleDoubleLeft size={12} />
                    </Button>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={isFirstPage()}
                      className="me-2 me-md-3"
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isFirstPage() ? '#6c757d' : '#495057',
                        padding: '4px 8px'
                      }}
                      title="Page précédente"
                    >
                      <FaChevronLeft size={12} />
                    </Button>

                    <span className="mx-2 mx-md-3 text-muted" style={{ fontSize: '13px' }}>
                      <span className="d-none d-sm-inline">Page </span>
                      {currentPage + 1}
                      <span className="d-none d-sm-inline"> sur {getTotalPages()}</span>
                    </span>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={isLastPage()}
                      className="ms-2 ms-md-3 me-1"
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isLastPage() ? '#6c757d' : '#495057',
                        padding: '4px 8px'
                      }}
                      title="Page suivante"
                    >
                      <FaChevronRight size={12} />
                    </Button>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToLastPage}
                      disabled={isLastPage()}
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isLastPage() ? '#6c757d' : '#495057',
                        padding: '4px 8px'
                      }}
                      title="Dernière page"
                    >
                      <FaAngleDoubleRight size={12} />
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}

export default ListChoriste;
