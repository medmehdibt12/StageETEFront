/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useState } from 'react';
import {
  getConcerts,
  markConcertAvailability,
  getConcertAttendanceEligibility,
  markConcertAbsence
} from '../../../services/concert.service';
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

  // ✅ ADD: Elimination and absence tracking
  const [eliminationMap, setEliminationMap] = useState({});
  const [concertStatusMap, setConcertStatusMap] = useState({});

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

      // ✅ UPDATED: Build elimination map and concert status
      const updatedEliminationMap = {};
      const updatedStatusMap = {};

      for (const concert of data) {
        try {
          const res = await getConcertAttendanceEligibility(concert._id, user._id);

          // Store elimination info
          if (res.reason === 'eliminated_from_concert') {
            updatedEliminationMap[concert._id] = {
              isEliminated: true,
              eliminationType: res.eliminationType,
              eliminationDate: res.eliminationDate,
              message: res.message
            };
          } else {
            updatedEliminationMap[concert._id] = { isEliminated: false };
          }

          // ✅ NEW: Store concert status (available, absent, etc.)
          const isAvailable = concert.availableChoristes?.includes(user._id);
          const isAbsent = concert.absentChoristes?.some((absent) => absent.choriste?.toString() === user._id?.toString());

          updatedStatusMap[concert._id] = {
            isAvailable,
            isAbsent,
            absentReason: isAbsent
              ? concert.absentChoristes?.find((absent) => absent.choriste?.toString() === user._id?.toString())?.reason
              : null
          };
        } catch {
          updatedEliminationMap[concert._id] = { isEliminated: false };
          updatedStatusMap[concert._id] = {
            isAvailable: concert.availableChoristes?.includes(user._id),
            isAbsent: false,
            absentReason: null
          };
        }
      }

      setEliminationMap(updatedEliminationMap);
      setConcertStatusMap(updatedStatusMap);
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

  // ✅ NEW: Handle marking absence
  const handleMarkAbsent = async (id) => {
    const result = await Swal.fire({
      title: 'Marquer comme Absent',
      text: 'Confirmer votre absence pour ce concert ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Je suis absent',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      setMarkingIds((prev) => [...prev, id]);
      try {
        await markConcertAbsence(id, 'manual_absence');
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Absence enregistrée',
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

  // ✅ NEW: Get absence reason message
  const getAbsenceReasonMessage = (reason) => {
    switch (reason) {
      case 'did_not_mark_disponibilite':
        return "Absent (n'a pas marqué sa disponibilité)";
      case 'removed_by_admin':
        return 'Absent (retiré par admin)';
      case 'removed_by_chef':
        return 'Absent (retiré par chef de pupitre)';
      case 'manual_absence':
        return 'Absent (marqué manuellement)';
      default:
        return 'Absent';
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
        {/* <h2 className="fw-bold text-dark mb-1">
          <FaCalendarCheck className="me-3 text-primary" />
          Mes Disponibilités de Concert
        </h2>
        <p className="text-muted mb-4">Confirmez votre disponibilité pour les concerts à venir</p> */}

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
              const concertDate = new Date(concert.dateHeure);
              const isFuture = concertDate > now;
              const isPast = concertDate <= now;
              const isMarking = markingIds.includes(concert._id);

              // ✅ Get status info
              const elimination = eliminationMap[concert._id] || { isEliminated: false };
              const status = concertStatusMap[concert._id] || {
                isAvailable: false,
                isAbsent: false,
                absentReason: null
              };

              // ✅ NEW: Determine if auto-absent (past concert, not available, not eliminated, not manually absent)
              const isAutoAbsent = isPast && !status.isAvailable && !elimination.isEliminated && !status.isAbsent;

              return (
                <Col key={concert._id} lg={6} xl={4}>
                  <Card
                    className="h-100 shadow-sm border-0"
                    style={{
                      borderRadius: '16px',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      // ✅ UPDATED: Visual styling for different states
                      ...(elimination.isEliminated && {
                        opacity: 0.8,
                        border: '2px solid #dc2626'
                      }),
                      ...(status.isAbsent && {
                        opacity: 0.9,
                        border: '2px solid #dc2626'
                      }),
                      ...(isAutoAbsent && {
                        opacity: 0.85,
                        border: '2px solid #6b7280'
                      }),
                      ...(status.isAvailable &&
                        !elimination.isEliminated && {
                          border: '2px solid #10b981'
                        })
                    }}
                    onMouseEnter={(e) => {
                      if (!elimination.isEliminated && !status.isAbsent && !isAutoAbsent) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* ✅ UPDATED CARD HEADER */}
                    <Card.Header
                      className="border-0 text-white d-flex align-items-center justify-content-between"
                      style={{
                        background: elimination.isEliminated
                          ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' // Red for eliminated
                          : status.isAbsent
                            ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' // Red for absent
                            : isAutoAbsent
                              ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' // Gray for auto-absent
                              : isPast
                                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100())'
                                : status.isAvailable
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Green for available
                                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue default
                        borderRadius: '16px 16px 0 0'
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <FaMusic className="me-2" size={16} />
                        <span className="fw-semibold" style={{ fontSize: '15px' }}>
                          {concert.title}
                        </span>
                      </div>
                      {/* ✅ UPDATED: Show appropriate badge */}
                      {elimination.isEliminated ? (
                        <Badge bg="light" text="dark" className="ms-2">
                          Éliminé
                        </Badge>
                      ) : status.isAbsent ? (
                        <Badge bg="light" text="dark" className="ms-2">
                          Absent
                        </Badge>
                      ) : isAutoAbsent ? (
                        <Badge bg="light" text="dark" className="ms-2">
                          Absent
                        </Badge>
                      ) : status.isAvailable ? (
                        <Badge bg="light" text="dark" className="ms-2">
                          Disponible
                        </Badge>
                      ) : (
                        getTimeStatus(concert.dateHeure)
                      )}
                    </Card.Header>

                    {/* ✅ CARD BODY */}
                    <Card.Body className="p-4">
                      {/* ✅ UPDATED: Show appropriate notices */}
                      {elimination.isEliminated && (
                        <div className="alert alert-danger mb-3 p-3" style={{ borderRadius: '12px', fontSize: '13px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <AlertTriangle size={16} className="me-2" />
                            <strong>Éliminé de ce concert</strong>
                          </div>
                          <div>
                            <div className="mb-1">
                              <strong>Raison:</strong>{' '}
                              {elimination.eliminationType === 'absence_threshold' ? 'Assiduité insuffisante' : 'Mesure disciplinaire'}
                            </div>
                            <div>
                              <strong>Date:</strong> {new Date(elimination.eliminationDate).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ✅ NEW: Show absence notice */}
                      {status.isAbsent && (
                        <div className="alert alert-warning mb-3 p-3" style={{ borderRadius: '12px', fontSize: '13px' }}>
                          <div className="d-flex align-items-center mb-2">
                            <XCircle size={16} className="me-2" />
                            <strong>Marqué comme absent</strong>
                          </div>
                          <div>
                            <strong>Raison:</strong> {getAbsenceReasonMessage(status.absentReason)}
                          </div>
                        </div>
                      )}

                      {/* ✅ NEW: Show auto-absent notice */}
                      {isAutoAbsent && (
                        <div className="alert alert-secondary mb-3 p-3" style={{ borderRadius: '12px', fontSize: '13px' }}>
                          <div className="d-flex align-items-center">
                            <XCircle size={16} className="me-2" />
                            <strong>Absent par défaut</strong>
                          </div>
                          <small className="text-muted">Disponibilité non marquée avant la fin du concert</small>
                        </div>
                      )}

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

                      {/* ✅ UPDATED ACTION BUTTONS - WITH ABSENCE FUNCTIONALITY */}
                      <div className="mt-auto">
                        {elimination.isEliminated ? (
                          <Button variant="danger" disabled size="sm" className="w-100" style={{ borderRadius: '12px', fontWeight: '500' }}>
                            <AlertTriangle size={16} className="me-2" />
                            Éliminé de ce concert
                          </Button>
                        ) : status.isAbsent ? (
                          <Button variant="danger" disabled size="sm" className="w-100" style={{ borderRadius: '12px', fontWeight: '500' }}>
                            <XCircle size={16} className="me-2" />
                            {getAbsenceReasonMessage(status.absentReason)}
                          </Button>
                        ) : status.isAvailable ? (
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
                          // ✅ UPDATED: Show both disponible and absent buttons for future concerts
                          isMarking ? (
                            <Button variant="outline-primary" disabled size="sm" className="w-100" style={{ borderRadius: '12px' }}>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Traitement...
                            </Button>
                          ) : (
                            <div className="d-grid gap-2">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleMarkAvailable(concert._id)}
                                style={{ borderRadius: '12px', fontWeight: '500' }}
                              >
                                <CheckCircle size={16} className="me-2" />
                                Je suis disponible
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleMarkAbsent(concert._id)}
                                style={{ borderRadius: '12px', fontWeight: '500' }}
                              >
                                <XCircle size={16} className="me-2" />
                                Je suis absent
                              </Button>
                            </div>
                          )
                        ) : // ✅ UPDATED: Show appropriate message for past concerts
                        isAutoAbsent ? (
                          <Button
                            variant="secondary"
                            disabled
                            size="sm"
                            className="w-100"
                            style={{ borderRadius: '12px', fontWeight: '500' }}
                          >
                            <XCircle size={16} className="me-2" />
                            Absent (par défaut)
                          </Button>
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
    </Container>
  );
};

export default ConcertsAvailability;
