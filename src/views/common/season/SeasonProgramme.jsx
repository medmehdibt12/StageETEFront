/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useState } from 'react';
import { getConcerts } from '../../../services/concert.service';
import { Spinner, Button, Card, Row, Col, Badge, Container, InputGroup, Form } from 'react-bootstrap';
import Select from 'react-select';
import ConcertDetailsModal from './ConcertDetailsModal';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMusic,
  FaClock,
  FaInfoCircle,
  FaImage,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from 'react-icons/fa';
import { Search } from 'lucide-react';

const SeasonProgramme = () => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState({ value: 'upcoming', label: 'À venir' });

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const pageSizeOptions = [6, 12, 18, 30];

  // ✅ Modal de détails du concert (Programme / Calendrier / Écouter)
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const statusOptions = [
    { value: 'upcoming', label: 'À venir' },
    { value: 'past', label: 'Passé' }
  ];

  useEffect(() => {
    fetchConcerts();
  }, []);

  // ✅ RESET PAGINATION WHEN FILTERS CHANGE
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterStatus]);

  const fetchConcerts = async () => {
    try {
      const data = await getConcerts();
      setConcerts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des concerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConcerts = concerts
    .filter((concert) => {
      const now = new Date();
      const concertDate = new Date(concert.dateHeure);
      const matchesStatus =
        (filterStatus.value === 'upcoming' && concertDate >= now) || (filterStatus.value === 'past' && concertDate < now);
      const matchesSearch = concert.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Sort upcoming concerts ascending, past concerts descending
      if (filterStatus.value === 'upcoming') {
        return new Date(a.dateHeure) - new Date(b.dateHeure);
      } else {
        return new Date(b.dateHeure) - new Date(a.dateHeure);
      }
    });

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const getTotalItems = () => filteredConcerts.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
    const start = currentPage * itemsPerPage;
    return filteredConcerts.slice(start, start + itemsPerPage);
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

  const formatFullDate = (iso) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

  // ✅ CHECK IF CONCERT IS TODAY, TOMORROW, OR THIS WEEK
  const getConcertTimeBadge = (dateHeure) => {
    const now = new Date();
    const concertDate = new Date(dateHeure);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const concertDay = new Date(concertDate.getFullYear(), concertDate.getMonth(), concertDate.getDate());

    if (concertDay.getTime() === today.getTime()) {
      return (
        <Badge bg="danger" className="ms-2">
          Aujourd'hui
        </Badge>
      );
    } else if (concertDay.getTime() === tomorrow.getTime()) {
      return (
        <Badge bg="warning" className="ms-2">
          Demain
        </Badge>
      );
    } else if (concertDay <= nextWeek && concertDay > today) {
      return (
        <Badge bg="info" className="ms-2">
          Cette semaine
        </Badge>
      );
    }
    return null;
  };

  // ✅ Ouvre le nouveau modal à onglets (Programme / Calendrier / Écouter)
  const handleShowDetails = (concert) => {
    setSelectedConcert(concert);
    setShowDetailsModal(true);
  };

  return (
    <Container fluid className="p-4" style={{ maxWidth: '1400px' }}>
      {/* ✅ HEADER SECTION */}
      <div className="mb-4">
        {/* <h2 className="fw-bold text-dark mb-1">
          <FaMusic className="me-3 text-primary" />
          Programme de la Saison
        </h2>
        <p className="text-muted mb-4">Découvrez tous les concerts de l'</p> */}

        {/* ✅ FILTERS SECTION */}
        <Row className="align-items-center g-3">
          <Col md={3}>
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={setFilterStatus}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: 'none',
                  fontSize: '14px',
                  '&:hover': { borderColor: '#d1d5db' }
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: '14px'
                })
              }}
            />
          </Col>
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: '#f8f9fa', borderColor: '#e5e7eb' }}>
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Rechercher par nom de concert..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderColor: '#e5e7eb',
                  fontSize: '14px',
                  padding: '10px 16px'
                }}
              />
            </InputGroup>
          </Col>
          <Col md={5} className="text-end">
            <small className="text-muted">
              {getTotalItems()} concert(s) {filterStatus.label.toLowerCase()}
              {searchTerm && ` pour "${searchTerm}"`}
            </small>
          </Col>
        </Row>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des concerts...</p>
        </div>
      ) : getTotalItems() === 0 ? (
        <div className="text-center py-5">
          <FaMusic size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucun concert trouvé</h5>
          <p className="text-muted">
            {searchTerm
              ? `Aucun concert ne correspond à "${searchTerm}"`
              : `Aucun concert ${filterStatus.label.toLowerCase()} pour le moment`}
          </p>
        </div>
      ) : (
        <>
          {/* ✅ CONCERTS GRID */}
          <Row className="g-4">
            {getPaginatedData().map((concert) => {
              const concertDate = new Date(concert.dateHeure);
              const isPast = concertDate < new Date();

              return (
                <Col key={concert._id} lg={6} xl={4}>
                  <Card
                    className="h-100 shadow-sm border-0"
                    style={{
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* ✅ CARD HEADER */}
                    <Card.Header
                      className="border-0 text-white d-flex align-items-center justify-content-between"
                      style={{
                        background: isPast
                          ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '0.375rem 0.375rem 0 0'
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-2" size={16} />
                        <span className="fw-semibold" style={{ fontSize: '15px' }}>
                          {concertDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {!isPast && getConcertTimeBadge(concert.dateHeure)}
                      {isPast && (
                        <Badge bg="light" text="dark">
                          Terminé
                        </Badge>
                      )}
                    </Card.Header>

                    {/* ✅ CARD BODY */}
                    <Card.Body className="p-4">
                      <h5 className="card-title fw-bold text-dark mb-3" style={{ fontSize: '18px', lineHeight: '1.3' }}>
                        {concert.title}
                      </h5>

                      <div className="concert-details">
                        <div className="d-flex align-items-center mb-2">
                          <FaClock className="text-warning me-2" size={14} />
                          <span className="text-muted" style={{ fontSize: '14px' }}>
                            {formatTime(concert.dateHeure)}
                          </span>
                        </div>

                        <div className="d-flex align-items-center mb-2">
                          <FaMapMarkerAlt className="text-success me-2" size={14} />
                          <span className="text-muted" style={{ fontSize: '14px' }}>
                            {concert.location}
                          </span>
                        </div>

                        {concert.poster && (
                          <div className="d-flex align-items-center mb-3">
                            <FaImage className="text-info me-2" size={14} />
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/uploads/posters/${concert.poster}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                              style={{ fontSize: '14px' }}
                            >
                              Voir l'affiche
                            </a>
                          </div>
                        )}

                        <div className="text-muted mb-3" style={{ fontSize: '13px' }}>
                          <strong>{concert.programme?.length || 0}</strong> œuvre(s) au programme
                        </div>
                      </div>
                    </Card.Body>

                    {/* ✅ CARD FOOTER */}
                    <Card.Footer className="border-0 bg-white p-4 pt-0">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowDetails(concert)}
                        className="w-100 fw-semibold"
                        style={{
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaInfoCircle className="me-2" size={14} />
                        Voir le programme
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* ✅ RESPONSIVE: Professional Pagination */}
          {getTotalPages() > 1 && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 mt-4 border-top bg-light rounded gap-2">
              <div className="d-flex align-items-center order-2 order-md-1">
                <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                  <span className="d-none d-sm-inline">Concerts par page:</span>
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
          )}
        </>
      )}

      {/* ✅ Modal de détails du concert : Programme / Calendrier / Écouter */}
      <ConcertDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        concert={selectedConcert}
      />
    </Container>
  );
};

export default SeasonProgramme;