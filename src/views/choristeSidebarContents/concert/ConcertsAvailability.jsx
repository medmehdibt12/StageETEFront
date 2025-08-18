/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useState } from 'react';
import { getConcerts, markConcertAvailability, getConcertAttendanceEligibility } from '../../../services/concert.service';
import { Card, Row, Col, Button, Spinner, Form, InputGroup, Container, Badge } from 'react-bootstrap';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { useAuth } from '../../../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, MapPin, Calendar, Search, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaMusic, FaCalendarCheck } from 'react-icons/fa';

const TIME_FILTER_OPTIONS = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passés' },
  { value: 'all', label: 'Tous' }
];

const ConcertsAvailability = () => {
  const { user } = useAuth();

  // État pour la recherche et le filtre temps
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState(TIME_FILTER_OPTIONS[0]);

  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingIds, setMarkingIds] = useState([]);
  const [eligibilityMap, setEligibilityMap] = useState({});

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const pageSizeOptions = [6, 12, 18, 30];

  useEffect(() => {
    fetchConcerts();
  }, []);

  // ✅ RESET PAGINATION WHEN FILTERS CHANGE
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedTimeFilter, searchTerm]);

  const fetchConcerts = async () => {
    try {
      const data = await getConcerts();
      setConcerts(data);

      // Construire la map d'éligibilité pour chaque concert
      const updatedMap = {};
      for (const concert of data) {
        try {
          const res = await getConcertAttendanceEligibility(concert._id, user._id);
          updatedMap[concert._id] = res.eligible;
        } catch {
          updatedMap[concert._id] = false;
        }
      }
      setEligibilityMap(updatedMap);
    } catch (err) {
      console.error('Erreur chargement concerts :', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAvailable = async (id) => {
    setMarkingIds((prev) => [...prev, id]);
    try {
      await markConcertAvailability(id);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Disponibilité enregistrée',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      await fetchConcerts();
    } catch (err) {
      Swal.fire('Erreur', err?.response?.data?.message || 'Échec', 'error');
    } finally {
      setMarkingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // ✅ GET TIME STATUS BADGE
  const getTimeStatus = (dateHeure) => {
    const now = new Date();
    const concertDate = new Date(dateHeure);
    const diffHours = Math.ceil((concertDate - now) / (1000 * 60 * 60));

    if (concertDate < now) {
      return (
        <Badge bg="secondary" className="ms-2">
          Terminé
        </Badge>
      );
    } else if (diffHours <= 24) {
      return (
        <Badge bg="danger" className="ms-2">
          Demain
        </Badge>
      );
    } else if (diffHours <= 168) {
      // 7 days
      return (
        <Badge bg="warning" className="ms-2">
          Cette semaine
        </Badge>
      );
    } else {
      return (
        <Badge bg="info" className="ms-2">
          À venir
        </Badge>
      );
    }
  };

  // Filtrer par date (À venir / Passés / Tous)
  const now = new Date();
  const byTimeFilter = (concert) => {
    const concertDate = new Date(concert.dateHeure);
    if (selectedTimeFilter.value === 'upcoming') {
      return concertDate > now;
    } else if (selectedTimeFilter.value === 'past') {
      return concertDate <= now;
    }
    return true; // "all"
  };

  // Filtrer par terme de recherche (titre de concert)
  const bySearchTerm = (concert) => concert.title.toLowerCase().includes(searchTerm.toLowerCase());

  // Appliquer les deux filtres
  const filteredConcerts = concerts
    .filter((c) => byTimeFilter(c) && bySearchTerm(c))
    .sort((a, b) => {
      // Sort upcoming concerts ascending, past concerts descending
      if (selectedTimeFilter.value === 'upcoming') {
        return new Date(a.dateHeure) - new Date(b.dateHeure);
      } else if (selectedTimeFilter.value === 'past') {
        return new Date(b.dateHeure) - new Date(a.dateHeure);
      }
      return new Date(a.dateHeure) - new Date(b.dateHeure);
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

  return (
    <Container fluid className="p-4" style={{ maxWidth: '1400px' }}>
      {/* ✅ HEADER SECTION */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">
          <FaCalendarCheck className="me-3 text-primary" />
          Mes Disponibilités de Concert
        </h2>
        <p className="text-muted mb-4">Confirmez votre disponibilité pour les concerts à venir</p>

        {/* ✅ FILTERS SECTION */}
        <Row className="align-items-center g-3">
          <Col md={3}>
            <label className="form-label fw-semibold mb-2" style={{ fontSize: '14px' }}>
              Afficher :
            </label>
            <Select
              options={TIME_FILTER_OPTIONS}
              value={selectedTimeFilter}
              onChange={(opt) => setSelectedTimeFilter(opt)}
              isSearchable={false}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: 'none',
                  fontSize: '14px',
                  minHeight: '40px',
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
            <label className="form-label fw-semibold mb-2" style={{ fontSize: '14px' }}>
              Rechercher par titre :
            </label>
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: '#f8f9fa', borderColor: '#e5e7eb' }}>
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Saisissez le titre du concert..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderColor: '#e5e7eb',
                  fontSize: '14px'
                }}
              />
            </InputGroup>
          </Col>
          <Col md={5} className="text-end">
            <div className="mt-4">
              <small className="text-muted">
                {getTotalItems()} concert(s) {selectedTimeFilter.label.toLowerCase()}
                {searchTerm && ` pour "${searchTerm}"`}
              </small>
            </div>
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
              : `Aucun concert ${selectedTimeFilter.label.toLowerCase()} pour le moment`}
          </p>
        </div>
      ) : (
        <>
          {/* ✅ CONCERTS GRID */}
          <Row className="g-4">
            {getPaginatedData().map((concert) => {
              const isAvailable = concert.availableChoristes?.includes(user._id);
              const isMarking = markingIds.includes(concert._id);
              const concertDate = new Date(concert.dateHeure);
              const isFuture = concertDate > now;
              const isEligible = eligibilityMap[concert._id];
              const isPast = concertDate <= now;

              return (
                <Col key={concert._id} lg={6} xl={4}>
                  <Card
                    className="h-100 shadow-sm border-0"
                    style={{
                      borderRadius: '16px',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
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
                          : isAvailable
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '16px 16px 0 0'
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <FaMusic className="me-2" size={16} />
                        <span className="fw-semibold" style={{ fontSize: '15px' }}>
                          {concert.title}
                        </span>
                      </div>
                      {getTimeStatus(concert.dateHeure)}
                    </Card.Header>

                    {/* ✅ CARD BODY */}
                    <Card.Body className="p-4">
                      <div className="concert-details mb-4">
                        <div className="d-flex align-items-center mb-3">
                          <Calendar size={18} className="text-primary me-3" />
                          <div>
                            <div className="fw-semibold text-dark" style={{ fontSize: '16px' }}>
                              {concertDate.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center mb-3">
                          <Clock size={18} className="text-warning me-3" />
                          <span className="text-muted" style={{ fontSize: '14px' }}>
                            {concertDate.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="d-flex align-items-center mb-3">
                          <MapPin size={18} className="text-success me-3" />
                          <span className="text-muted" style={{ fontSize: '14px' }}>
                            {concert.location}
                          </span>
                        </div>

                        {concert.poster && (
                          <div className="d-flex align-items-center mb-3">
                            <ImageIcon size={18} className="text-info me-3" />
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
                      </div>

                      {/* ✅ ACTION BUTTONS */}
                      <div className="mt-auto">
                        {isAvailable ? (
                          <Button
                            variant="success"
                            disabled
                            size="sm"
                            className="w-100"
                            style={{ borderRadius: '12px', fontWeight: '500' }}
                          >
                            <CheckCircle size={16} className="me-2" />
                            Disponibilité confirmée
                          </Button>
                        ) : user?.status === 'En congé' ? (
                          <Button
                            variant="outline-secondary"
                            disabled
                            size="sm"
                            className="w-100"
                            style={{ borderRadius: '12px', fontWeight: '500' }}
                          >
                            🏖️ En congé
                          </Button>
                        ) : isFuture ? (
                          isEligible ? (
                            isMarking ? (
                              <Button variant="outline-primary" disabled size="sm" className="w-100" style={{ borderRadius: '12px' }}>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Traitement...
                              </Button>
                            ) : (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleMarkAvailable(concert._id)}
                                className="w-100"
                                style={{ borderRadius: '12px', fontWeight: '500' }}
                              >
                                <CheckCircle size={16} className="me-2" />
                                Je suis disponible
                              </Button>
                            )
                          ) : (
                            <Button
                              variant="outline-danger"
                              disabled
                              size="sm"
                              className="w-100"
                              style={{ borderRadius: '12px', fontWeight: '500' }}
                            >
                              <AlertTriangle size={16} className="me-2" />
                              Taux de présence insuffisant
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="outline-secondary"
                            disabled
                            size="sm"
                            className="w-100"
                            style={{ borderRadius: '12px', opacity: 0.6 }}
                          >
                            <XCircle size={16} className="me-2" />
                            Concert terminé
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* ✅ PROFESSIONAL PAGINATION */}
          {getTotalPages() > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 mt-4 border-top bg-light rounded">
              <div className="d-flex align-items-center">
                <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                  Concerts par page:
                </span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
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

              <div className="text-muted" style={{ fontSize: '14px' }}>
                {getStartIndex()}-{getEndIndex()} sur {getTotalItems()}
              </div>

              <div className="d-flex align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={isFirstPage()}
                  className="me-1"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                >
                  <FaAngleDoubleLeft />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={isFirstPage()}
                  className="me-3"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                >
                  <FaChevronLeft />
                </Button>
                <span className="mx-3 text-muted" style={{ fontSize: '14px' }}>
                  Page {currentPage + 1} sur {getTotalPages()}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={isLastPage()}
                  className="ms-3 me-1"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                >
                  <FaChevronRight />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={isLastPage()}
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                >
                  <FaAngleDoubleRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default ConcertsAvailability;
