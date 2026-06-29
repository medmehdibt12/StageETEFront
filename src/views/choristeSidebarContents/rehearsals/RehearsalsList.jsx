/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { getRepetitions, markRepetitionPresence, markRepetitionAbsence } from '../../../services/repetition.service';
import { Card, Row, Col, Button, Spinner, Form, InputGroup, Container, Badge } from 'react-bootstrap';
import { CheckCircle, XCircle, Clock, MapPin, Calendar, Search } from 'lucide-react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaUserCheck, FaCalendarAlt, FaBan } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { useAuth } from '../../../contexts/AuthContext';

const TIME_FILTER_OPTIONS = [
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Passées' },
  { value: 'all', label: 'Tous' }
];

const RehearsalsList = () => {
  const { user, refreshUser } = useAuth();

  // État pour le filtre "À venir / Passées / Tous" et pour la recherche par lieu
  const [timeFilter, setTimeFilter] = useState(TIME_FILTER_OPTIONS[0]);
  const [locationTerm, setLocationTerm] = useState('');
  const [repetitions, setRepetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingIds, setMarkingIds] = useState([]);

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const pageSizeOptions = [6, 12, 18, 30];

  useEffect(() => {
    fetchRepetitions();
  }, []);

  // ✅ RESET PAGINATION WHEN FILTERS CHANGE
  useEffect(() => {
    setCurrentPage(0);
  }, [timeFilter, locationTerm]);

  const fetchRepetitions = async () => {
    try {
      const data = await getRepetitions();
      setRepetitions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des répétitions :', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresence = async (id) => {
    setMarkingIds((prev) => [...prev, id]);

    try {
      await markRepetitionPresence(id);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Présence enregistrée',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      await Promise.all([fetchRepetitions(), refreshUser()]);
    } catch (error) {
      console.error('Error marking presence:', error);

      const errorMessage = error?.response?.data?.message || "Impossible d'enregistrer la présence.";

      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage
      });
    } finally {
      setMarkingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleMarkAbsence = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Motif d'absence",
      input: 'textarea',
      inputLabel: 'Pourquoi êtes-vous absent(e) ?',
      inputPlaceholder: 'Saisissez le motif ici…',
      showCancelButton: true,
      confirmButtonText: 'Valider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Le motif est requis.';
        }
        return null;
      }
    });

    if (!reason) return;

    setMarkingIds((prev) => [...prev, id]);

    try {
      await markRepetitionAbsence(id, reason);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Absence enregistrée',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      await Promise.all([fetchRepetitions(), refreshUser()]);
    } catch (error) {
      console.error('Error marking absence:', error);

      const errorMessage = error?.response?.data?.message || "Échec lors de l'enregistrement de l'absence.";

      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage
      });
    } finally {
      setMarkingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const isPastEnd = (dateStr, endTimeStr) => {
    const [endH, endM] = endTimeStr.split(':').map(Number);
    const endDate = new Date(dateStr);
    endDate.setHours(endH, endM, 0, 0);
    return endDate.getTime() <= Date.now();
  };

  const hasPassed75Percent = (dateStr, startTimeStr, endTimeStr) => {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startDate = new Date(dateStr);
    startDate.setHours(startH, startM, 0, 0);

    const endDate = new Date(dateStr);
    endDate.setHours(endH, endM, 0, 0);

    const durationMs = endDate.getTime() - startDate.getTime();
    const thresholdMs = startDate.getTime() + durationMs * 0.75;

    return Date.now() >= thresholdMs;
  };

  // ✅ GET TIME STATUS BADGE
  const getTimeStatus = (dateStr, startTimeStr, endTimeStr) => {
    const now = new Date();
    const repDate = new Date(dateStr);
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startTime = new Date(repDate);
    startTime.setHours(startH, startM, 0, 0);

    const endTime = new Date(repDate);
    endTime.setHours(endH, endM, 0, 0);

    if (now < startTime) {
      const diffHours = Math.ceil((startTime - now) / (1000 * 60 * 60));
      if (diffHours <= 24) {
        return (
          <Badge bg="warning" className="ms-2">
            Bientôt
          </Badge>
        );
      }
      return (
        <Badge bg="info" className="ms-2">
          À venir
        </Badge>
      );
    } else if (now >= startTime && now <= endTime) {
      return (
        <Badge bg="success" className="ms-2">
          En cours
        </Badge>
      );
    } else {
      return (
        <Badge bg="secondary" className="ms-2">
          Terminée
        </Badge>
      );
    }
  };

  // ✅ PRESENCE/ABSENCE CHECKING (no elimination logic)
  const getUserPresenceStatus = (rep) => {
    const userId = user?._id?.toString();
    if (!userId) return { isPresent: false, isAbsent: false };

    // 1. Check in presentChoristes (can be ObjectIds or populated objects)
    let isInPresentList = false;
    if (rep.presentChoristes && Array.isArray(rep.presentChoristes)) {
      isInPresentList = rep.presentChoristes.some((choriste) => {
        const choristeId = typeof choriste === 'object' && choriste._id ? choriste._id.toString() : choriste.toString();
        return choristeId === userId;
      });
    }

    // 2. Check in absentChoristes (array of objects with choriste field)
    let isInAbsentList = false;
    if (rep.absentChoristes && Array.isArray(rep.absentChoristes)) {
      isInAbsentList = rep.absentChoristes.some((absent) => {
        if (!absent.choriste) return false;
        const choristeId =
          typeof absent.choriste === 'object' && absent.choriste._id ? absent.choriste._id.toString() : absent.choriste.toString();
        return choristeId === userId;
      });
    }

    // 3. Check in manualPresences for 'present' type
    let manualPresent = false;
    if (rep.manualPresences && Array.isArray(rep.manualPresences)) {
      manualPresent = rep.manualPresences.some((manual) => {
        if (!manual.choriste || manual.type !== 'present') return false;
        const choristeId =
          typeof manual.choriste === 'object' && manual.choriste._id ? manual.choriste._id.toString() : manual.choriste.toString();
        return choristeId === userId;
      });
    }

    // 4. Check in manualPresences for 'absent' type
    let manualAbsent = false;
    if (rep.manualPresences && Array.isArray(rep.manualPresences)) {
      manualAbsent = rep.manualPresences.some((manual) => {
        if (!manual.choriste || manual.type !== 'absent') return false;
        const choristeId =
          typeof manual.choriste === 'object' && manual.choriste._id ? manual.choriste._id.toString() : manual.choriste.toString();
        return choristeId === userId;
      });
    }

    // Final determination
    const isPresent = isInPresentList || manualPresent;
    const isAbsent = isInAbsentList || manualAbsent;

    return { isPresent, isAbsent };
  };

  // 1) Filtrer par "À venir / Passées / Tous" en utilisant isPastEnd
  const filteredByTime = repetitions.filter((rep) => {
    const isPast = isPastEnd(rep.date, rep.endTime);
    if (timeFilter.value === 'upcoming') return !isPast;
    if (timeFilter.value === 'past') return isPast;
    return true; // "Tous"
  });

  // 2) Filtrer par lieu (case-insensitive)
  const filteredRepetitions = filteredByTime.filter((rep) => rep.location.toLowerCase().includes(locationTerm.toLowerCase()));

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const getTotalItems = () => filteredRepetitions.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
    const start = currentPage * itemsPerPage;
    return filteredRepetitions.slice(start, start + itemsPerPage);
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
          <FaUserCheck className="me-3 text-primary" />
          Mes Répétitions
        </h2>
        <p className="text-muted mb-4">Gérez votre présence aux répétitions de l'orchestre</p> */}

        {/* ✅ FILTERS SECTION */}
        <Row className="align-items-center g-3">
          <Col md={3}>
            <label className="form-label fw-semibold mb-2" style={{ fontSize: '14px' }}>
              Afficher :
            </label>
            <Select
              options={TIME_FILTER_OPTIONS}
              value={timeFilter}
              onChange={(opt) => setTimeFilter(opt)}
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
              Rechercher par lieu :
            </label>
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: '#f8f9fa', borderColor: '#e5e7eb' }}>
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Saisissez le lieu..."
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
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
                {getTotalItems()} répétition(s) {timeFilter.label.toLowerCase()}
                {locationTerm && ` pour "${locationTerm}"`}
              </small>
            </div>
          </Col>
        </Row>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des répétitions...</p>
        </div>
      ) : getTotalItems() === 0 ? (
        <div className="text-center py-5">
          <FaCalendarAlt size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucune répétition trouvée</h5>
          <p className="text-muted">
            {locationTerm
              ? `Aucune répétition ne correspond à "${locationTerm}"`
              : `Aucune répétition ${timeFilter.label.toLowerCase()} pour le moment`}
          </p>
        </div>
      ) : (
        <>
          {/* ✅ REPETITIONS GRID */}
          <Row className="g-4">
            {getPaginatedData().map((rep) => {
              const repDateStr = rep.date;
              const repStartTime = rep.startTime;
              const repEndTime = rep.endTime;

              const beyond75 = hasPassed75Percent(repDateStr, repStartTime, repEndTime);
              const pastEnd = isPastEnd(repDateStr, repEndTime);

              // ✅ SIMPLIFIED: Only check presence/absence (no elimination)
              const { isPresent: markedPresent, isAbsent: markedAbsent } = getUserPresenceStatus(rep);

              const isMarking = markingIds.includes(rep._id);

              // ✅ SIMPLIFIED: Check if automatically absent (past end and no action taken)
              const isAutoAbsent = pastEnd && !markedPresent && !markedAbsent;

              let actionButtons = null;

              // 1) Si l'utilisateur est en congé, on bloque tout
              if (user?.status === 'En congé') {
                actionButtons = (
                  <Button
                    variant="outline-secondary"
                    disabled
                    size="sm"
                    className="w-100"
                    style={{ borderRadius: '12px', fontWeight: '500' }}
                  >
                    🏖️ En congé
                  </Button>
                );

                // 2) Si l'action est en cours, on affiche un spinner
              } else if (isMarking) {
                actionButtons = (
                  <Button variant="outline-primary" disabled size="sm" className="w-100" style={{ borderRadius: '12px' }}>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Traitement...
                  </Button>
                );

                // 3) Auto-absent (past end, no action taken) - RED BUTTON
              } else if (isAutoAbsent) {
                actionButtons = (
                  <Button variant="danger" disabled size="sm" className="w-100" style={{ borderRadius: '12px', fontWeight: '500' }}>
                    <XCircle size={16} className="me-2" /> Absent (par défaut)
                  </Button>
                );

                // 4) Déjà marqué "Absent" - RED BUTTON
              } else if (markedAbsent) {
                actionButtons = (
                  <Button variant="danger" disabled size="sm" className="w-100" style={{ borderRadius: '12px', fontWeight: '500' }}>
                    <XCircle size={16} className="me-2" /> Absent
                  </Button>
                );

                // 5) Déjà marqué "Présent" - GREEN BUTTON
              } else if (markedPresent) {
                actionButtons = (
                  <Button variant="success" disabled size="sm" className="w-100" style={{ borderRadius: '12px', fontWeight: '500' }}>
                    <CheckCircle size={16} className="me-2" /> Présent
                  </Button>
                );

                // 6) Avant 75 % de la durée : les deux boutons sont actifs
              } else if (!beyond75 && !pastEnd && !rep.isCancelled) {
                actionButtons = (
                  <div className="d-grid gap-2">
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleMarkPresence(rep._id)}
                      style={{ borderRadius: '12px', fontWeight: '500' }}
                    >
                      <CheckCircle size={16} className="me-2" />
                      Je suis présent
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleMarkAbsence(rep._id)}
                      style={{ borderRadius: '12px', fontWeight: '500' }}
                    >
                      <XCircle size={16} className="me-2" />
                      Je suis absent
                    </Button>
                  </div>
                );

                // 7) À partir de 75 % de la durée, on désactive "Je suis présent"
              } else if (!rep.isCancelled) {
                actionButtons = (
                  <div className="d-grid gap-2">
                    <Button variant="outline-secondary" disabled size="sm" style={{ borderRadius: '12px', opacity: 0.6 }}>
                      <CheckCircle size={16} className="me-2" />
                      Trop tard pour marquer présent
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleMarkAbsence(rep._id)}
                      style={{ borderRadius: '12px', fontWeight: '500' }}
                    >
                      <XCircle size={16} className="me-2" />
                      Je suis absent
                    </Button>
                  </div>
                );
              } else {
                actionButtons = (
                  <Button variant="danger" disabled size="sm" className="w-100" style={{ borderRadius: '12px', fontWeight: '500' }}>
                    <XCircle size={16} className="me-2" /> Répétition Annulée
                  </Button>
                );
              }

              return (
                <Col key={rep._id} lg={6} xl={4}>
                  <Card
                    className="h-100 shadow-sm border-0"
                    style={{
                      borderRadius: '16px',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      // ✅ SIMPLIFIED: Visual indicator only for presence/absence
                      ...(isAutoAbsent && {
                        border: '2px solid #dc2626',
                        opacity: 0.85
                      }),
                      // ✅ GREEN border for present
                      ...(markedPresent && {
                        border: '2px solid #10b981'
                      }),
                      // ✅ RED border for absent
                      ...(markedAbsent && {
                        border: '2px solid #dc2626'
                      }),
                      // ✅ GRAY for cancelled
                      ...(rep.isCancelled && {
                        border: '2px solid #6b7280',
                        opacity: 0.8
                      })
                    }}
                    onMouseEnter={(e) => {
                      if (!isAutoAbsent) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                      }
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
                        background: rep.isCancelled
                          ? 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)' // Dark gray for cancelled
                          : isAutoAbsent
                            ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' // Red for auto-absent
                          : markedPresent
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Green for present
                            : markedAbsent
                              ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' // Red for absent
                              : pastEnd
                                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '16px 16px 0 0'
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <MapPin size={16} className="me-2" />
                        <span className="fw-semibold" style={{ fontSize: '15px' }}>
                          {rep.location}
                        </span>
                      </div>
                      {rep.isCancelled ? (
                        <Badge bg="danger" text="white" className="ms-2">
                          ANNULÉE
                        </Badge>
                      ) : isAutoAbsent ? (
                        <Badge bg="light" text="dark" className="ms-2">
                          Absent
                        </Badge>
                      ) : markedPresent ? (
                        <Badge bg="light" text="dark" className="ms-2">
                          Présent
                        </Badge>
                      ) : markedAbsent ? (
                        <Badge bg="light" text="dark" className="ms-2">
                          Absent
                        </Badge>
                      ) : (
                        getTimeStatus(repDateStr, repStartTime, repEndTime)
                      )}
                    </Card.Header>

                    {/* ✅ CARD BODY */}
                    <Card.Body className="p-4">
                      {/* ✅ CANCELLED NOTICE */}
                      {rep.isCancelled && (
                        <div className="alert alert-danger mb-3 p-3 shadow-xs" style={{ borderRadius: '12px', fontSize: '13px' }}>
                          <div className="d-flex align-items-center mb-1">
                            <FaBan size={16} className="me-2" />
                            <strong>Répétition annulée</strong>
                          </div>
                          {rep.cancellationReason && (
                            <div className="mt-1 ps-4 border-start border-danger-subtle">
                              <em>" {rep.cancellationReason} "</em>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ✅ SIMPLIFIED: Only auto-absent notice (no elimination) */}
                      {!rep.isCancelled && isAutoAbsent && (
                        <div className="alert alert-warning mb-3 p-3" style={{ borderRadius: '12px', fontSize: '13px' }}>
                          <div className="d-flex align-items-center">
                            <XCircle size={16} className="me-2" />
                            <strong>Marqué absent automatiquement</strong>
                          </div>
                          <small className="text-muted">Aucune action prise avant la fin de la répétition</small>
                        </div>
                      )}

                      <div className="rehearsal-details mb-4">
                        <div className="d-flex align-items-center mb-3">
                          <Calendar size={18} className="text-primary me-3" />
                          <div>
                            <div className="fw-semibold text-dark" style={{ fontSize: '16px' }}>
                              {new Date(repDateStr).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center">
                          <Clock size={18} className="text-warning me-3" />
                          <div>
                            <span className="text-muted" style={{ fontSize: '14px' }}>
                              {repStartTime} → {repEndTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ✅ ACTION BUTTONS */}
                      <div className="mt-auto">{actionButtons}</div>
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
                  <span className="d-none d-sm-inline">Répétitions par page:</span>
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

export default RehearsalsList;
