/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import Select from 'react-select';
import {
  FaCalendarAlt,
  FaEdit,
  FaBell,
  FaClock,
  FaMapMarkerAlt,
  FaMusic,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEnvelope,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaFilter,
  FaBan,
  FaUsers,
  FaUserTie
} from 'react-icons/fa';
import Joi from 'joi';
import Swal from 'sweetalert2';
import { getRepetitionsForManager, modifyRepetitionForAllChoristes } from '../../../services/repetition.service';

const ManagerNotifications = () => {
  // State management
  const [repetitions, setRepetitions] = useState([]);
  const [managerInfo, setManagerInfo] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // FILTER STATE
  const [selectedFilter, setSelectedFilter] = useState({ value: 'a-venir', label: 'À venir' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRepetition, setSelectedRepetition] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    newStartTime: '',
    newEndTime: '',
    newLocation: '',
    urgentMessage: '',
    reason: ''
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // FILTER OPTIONS
  const filterOptions = [
    { value: 'a-venir', label: 'À venir' },
    { value: 'passee', label: 'Passées' },
    { value: 'toutes', label: 'Toutes' }
  ];

  // JOI VALIDATION SCHEMA
  const validationSchema = Joi.object({
    newStartTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .allow('')
      .messages({
        'string.pattern.base': "Format d'heure invalide (HH:MM)"
      }),
    newEndTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .allow('')
      .messages({
        'string.pattern.base': "Format d'heure invalide (HH:MM)"
      }),
    newLocation: Joi.string().min(3).max(100).trim().required().messages({
      'string.min': 'Le lieu doit contenir au moins 3 caractères',
      'string.max': 'Le lieu ne peut pas dépasser 100 caractères',
      'string.empty': 'Nouveau lieu est requis',
      'any.required': 'Nouveau lieu est requis'
    }),
    urgentMessage: Joi.string().min(10).max(500).trim().required().messages({
      'string.min': 'Le message urgent doit contenir au moins 10 caractères',
      'string.max': 'Le message urgent ne peut pas dépasser 500 caractères',
      'string.empty': 'Message urgent est requis',
      'any.required': 'Message urgent est requis'
    }),
    reason: Joi.string().max(200).trim().allow('').messages({
      'string.max': 'Le motif ne peut pas dépasser 200 caractères'
    })
  });

  // Load data on component mount
  useEffect(() => {
    loadRepetitions();
  }, []);

  // RESET PAGINATION WHEN FILTER CHANGES
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedFilter]);

  const loadRepetitions = async () => {
    try {
      setLoading(true);
      const data = await getRepetitionsForManager();
      setRepetitions(data.repetitions);
      setManagerInfo(data.managerInfo);
    } catch (error) {
      console.error('Error loading repetitions:', error);
      Swal.fire('Erreur', 'Erreur lors du chargement des répétitions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // SMART TIME-BASED FILTERING WITH BUSINESS HOURS LOGIC
  const getFilteredRepetitions = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (selectedFilter.value) {
      case 'a-venir':
        return repetitions.filter((rep) => {
          const repDate = new Date(rep.date);
          repDate.setHours(0, 0, 0, 0);

          // Future dates: always show
          if (repDate > today) {
            return true;
          }

          // Today: only show if current time is before business end (18:00)
          if (repDate.getTime() === today.getTime()) {
            return currentHour < 18;
          }

          // Past dates: never show
          return false;
        });

      case 'passee':
        return repetitions.filter((rep) => {
          const repDate = new Date(rep.date);
          repDate.setHours(0, 0, 0, 0);

          // Past dates: always show
          if (repDate < today) {
            return true;
          }

          // Today: only show if current time is after business end (18:00)
          if (repDate.getTime() === today.getTime()) {
            return currentHour >= 18;
          }

          // Future dates: never show
          return false;
        });

      case 'toutes':
        return repetitions;

      default:
        return repetitions.filter((rep) => {
          const repDate = new Date(rep.date);
          repDate.setHours(0, 0, 0, 0);

          if (repDate > today) {
            return true;
          }

          if (repDate.getTime() === today.getTime()) {
            return currentHour < 18;
          }

          return false;
        });
    }
  };

  // CHECK IF REPETITION IS MODIFIABLE (Enhanced Logic)
  const isRepetitionModifiable = (repetitionDate) => {
    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const repDate = new Date(repetitionDate);
    repDate.setHours(0, 0, 0, 0);

    // Past dates: never modifiable
    if (repDate < today) {
      return false;
    }

    // Today: only modifiable if before business end (18:00)
    if (repDate.getTime() === today.getTime()) {
      return currentHour < 18;
    }

    // Future dates: always modifiable
    return true;
  };

  // CHECK IF REPETITION IS CONSIDERED PAST
  const isRepetitionPast = (repetitionDate) => {
    return !isRepetitionModifiable(repetitionDate);
  };

  // ✅ UPDATED: Enhanced validation with time comparison
  const validateForm = () => {
    const errors = {};

    // Basic Joi validation
    const { error } = validationSchema.validate(formData, { abortEarly: false });
    if (error) {
      error.details.forEach((detail) => {
        errors[detail.path[0]] = detail.message;
      });
    }

    // BUSINESS HOURS VALIDATION (8:00 - 18:00)
    if (formData.newStartTime) {
      const startHour = parseInt(formData.newStartTime.split(':')[0]);
      if (startHour < 8 || startHour > 16) {
        errors.newStartTime = "L'heure de début doit être entre 08:00 et 16:00";
      }
    }

    if (formData.newEndTime) {
      const endHour = parseInt(formData.newEndTime.split(':')[0]);
      if (endHour < 9 || endHour > 18) {
        errors.newEndTime = "L'heure de fin doit être entre 09:00 et 18:00";
      }
    }

    // ✅ NEW: Time comparison validation
    if (formData.newStartTime && formData.newEndTime) {
      const [startH, startM] = formData.newStartTime.split(':').map(Number);
      const [endH, endM] = formData.newEndTime.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        errors.newEndTime = "L'heure de fin doit être après l'heure de début";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time validation on change
  useEffect(() => {
    if (showModal && selectedRepetition) {
      validateForm();
    }
  }, [formData, showModal, selectedRepetition]);

  // AUTO-CALCULATE END TIME (+2:30 HOURS)
  const calculateEndTime = (startTime) => {
    if (!startTime) return '';

    const [hours, minutes] = startTime.split(':').map(Number);

    // Add 2 hours and 30 minutes
    let endHours = hours + 2;
    let endMinutes = minutes + 30;

    // Handle minute overflow
    if (endMinutes >= 60) {
      endHours += 1;
      endMinutes -= 60;
    }

    // Handle hour overflow (24-hour format)
    if (endHours >= 24) {
      endHours -= 24;
    }

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Open modification modal
  const handleModifyClick = (repetition) => {
    setSelectedRepetition(repetition);
    setValidationErrors({});

    // Pre-fill form with existing modification if any
    if (repetition.myModification) {
      const mod = repetition.myModification.modifications;
      setFormData({
        newStartTime: mod.newStartTime || repetition.startTime,
        newEndTime: mod.newEndTime || repetition.endTime,
        newLocation: mod.newLocation || repetition.location,
        urgentMessage: mod.urgentMessage || '',
        reason: mod.reason || ''
      });
    } else {
      // Pre-fill with current repetition values
      setFormData({
        newStartTime: repetition.startTime,
        newEndTime: repetition.endTime,
        newLocation: repetition.location,
        urgentMessage: '',
        reason: ''
      });
    }

    setShowModal(true);
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRepetition(null);
    setValidationErrors({});
    setFormData({
      newStartTime: '',
      newEndTime: '',
      newLocation: '',
      urgentMessage: '',
      reason: ''
    });
  };

  // ✅ UPDATED: Handle input change with auto end time (but allow manual override)
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'newStartTime') {
      // Auto-calculate end time when start time changes
      const autoEndTime = calculateEndTime(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        newEndTime: autoEndTime
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // DETECT MEANINGFUL CHANGES
  const hasChanges = () => {
    if (!selectedRepetition) return false;

    return (
      formData.newStartTime !== selectedRepetition.startTime ||
      formData.newEndTime !== selectedRepetition.endTime ||
      formData.newLocation.trim() !== selectedRepetition.location.trim() ||
      formData.urgentMessage.trim() !== ''
    );
  };

  // Submit modification
  const handleSubmitModification = async (e) => {
    e.preventDefault();

    if (!selectedRepetition) return;

    // Validate form
    if (!validateForm()) {
      Swal.fire('Erreur de validation', 'Veuillez corriger les erreurs dans le formulaire.', 'error');
      return;
    }

    // Check for changes
    if (!hasChanges()) {
      Swal.fire('Attention', 'Aucune modification détectée.', 'warning');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data (only send changed values)
      const modificationData = {};

      if (formData.newStartTime !== selectedRepetition.startTime) {
        modificationData.newStartTime = formData.newStartTime;
      }
      if (formData.newEndTime !== selectedRepetition.endTime) {
        modificationData.newEndTime = formData.newEndTime;
      }
      if (formData.newLocation.trim() !== selectedRepetition.location.trim()) {
        modificationData.newLocation = formData.newLocation.trim();
      }
      if (formData.urgentMessage.trim()) {
        modificationData.urgentMessage = formData.urgentMessage.trim();
      }
      if (formData.reason.trim()) {
        modificationData.reason = formData.reason.trim();
      }

      const result = await modifyRepetitionForAllChoristes(selectedRepetition._id, modificationData);

      // Success
      Swal.fire({
        title: `${result.message}`,
        text: `Tous les choristes concernés de cette répétition ont été notifiés de cette modification.`,
        icon: 'success',
        timer: 4000
      });

      handleCloseModal();
      await loadRepetitions(); // Reload to show updated status
    } catch (error) {
      console.error('Error submitting modification:', error);
      Swal.fire('Erreur', error.response?.data?.message || "Erreur lors de l'envoi de la notification.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // PAGINATION FUNCTIONS (UPDATED FOR FILTERED DATA)
  const filteredRepetitions = getFilteredRepetitions();
  const getTotalItems = () => filteredRepetitions.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedRepetitions = () => {
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // GET MODIFIED SCHEDULE FOR DISPLAY
  const getModifiedSchedule = (repetition) => {
    if (!repetition.hasMyModification) return null;

    const mod = repetition.myModification.modifications;
    return {
      startTime: mod.newStartTime || repetition.startTime,
      endTime: mod.newEndTime || repetition.endTime,
      location: mod.newLocation || repetition.location
    };
  };

  if (loading) {
    return (
      <Container style={{ marginTop: '2rem' }}>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: '2rem', maxWidth: '1400px' }}>
      <Card className="shadow-sm">
        <Card.Header>
          <Row>
            <Col>
              <h4 className="mb-1 fw-bold text-dark">
                <FaBell className="me-3 text-primary" />
                Notifications urgentes - Manager
              </h4>
              <p className="text-muted mb-0">
                <FaUsers className="me-2" />
                Informez rapidement tous les choristes des changements importants
              </p>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body>
          {/* FILTER SECTION */}
          <div style={{ maxWidth: 240, marginBottom: '1rem' }}>
            <Select
              options={filterOptions}
              value={selectedFilter}
              onChange={(opt) => {
                setSelectedFilter(opt);
                setCurrentPage(0);
              }}
              isSearchable={false}
              placeholder="Afficher : "
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: '32px',
                  fontSize: '0.9rem'
                }),
                singleValue: (provided) => ({
                  ...provided,
                  marginLeft: 8
                }),
                menu: (provided) => ({
                  ...provided,
                  fontSize: '0.9rem'
                })
              }}
            />
          </div>

          {filteredRepetitions.length === 0 ? (
            <Alert variant="info" className="text-center py-5">
              <FaCalendarAlt size={40} className="mb-3 opacity-50" />
              <h6>Aucune répétition {selectedFilter.label.toLowerCase()}</h6>
              <p className="mb-0">
                {selectedFilter.value === 'a-venir'
                  ? "Il n'y a actuellement aucune répétition programmée à venir."
                  : selectedFilter.value === 'passee'
                    ? 'Aucune répétition passée trouvée.'
                    : 'Aucune répétition trouvée.'}
              </p>
            </Alert>
          ) : (
            <>
              <div className="mb-3">
                <Alert variant="warning" className="d-flex align-items-center">
                  <FaExclamationTriangle className="me-2" />
                  <div>
                    <strong>Important :</strong> Utilisez cette fonction uniquement pour des informations urgentes (changement d'horaire, de
                    lieu, etc.).
                    <span className="text-primary ms-2">
                      <FaUsers className="me-1" />
                      <strong>Tous les choristes</strong> recevront un email immédiatement.
                    </span>
                    {selectedFilter.value === 'passee' && (
                      <span className="text-danger ms-2">
                        <FaBan className="me-1" />
                        Les répétitions passées ne peuvent pas être modifiées.
                      </span>
                    )}
                  </div>
                </Alert>
              </div>

              <Table bordered hover responsive>
                <thead className="table-light">
                  <tr>
                    <th>Répétition</th>
                    <th>Horaire Original</th>
                    <th>Horaire Modifié</th>
                    <th>Lieu Original</th>
                    <th>Lieu Modifié</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedRepetitions().map((repetition) => {
                    const modifiedSchedule = getModifiedSchedule(repetition);
                    const isPast = isRepetitionPast(repetition.date);
                    const isToday = new Date(repetition.date).toDateString() === new Date().toDateString();

                    return (
                      <tr key={repetition._id} className={isPast ? 'table-secondary' : ''}>
                        <td>
                          <div>
                            <strong>{formatDateShort(repetition.date)}</strong>
                            {isPast && (
                              <Badge bg="secondary" className="ms-2">
                                {isToday ? 'Fermé' : 'Passée'}
                              </Badge>
                            )}
                            <br />
                            <small className="text-muted">{formatDate(repetition.date)}</small>
                            {repetition.concert && (
                              <>
                                <br />
                                <small className="text-primary">
                                  <FaMusic className="me-1" />
                                  {repetition.concert.title}
                                </small>
                              </>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center">
                            <FaClock className="me-2 text-muted" />
                            <span>
                              {repetition.startTime} - {repetition.endTime}
                            </span>
                          </div>
                        </td>

                        <td>
                          {modifiedSchedule &&
                          (modifiedSchedule.startTime !== repetition.startTime || modifiedSchedule.endTime !== repetition.endTime) ? (
                            <div className="d-flex align-items-center">
                              <FaClock className="me-2 text-success" />
                              <span className="text-success fw-bold">
                                {modifiedSchedule.startTime} - {modifiedSchedule.endTime}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        <td>
                          <div className="d-flex align-items-center">
                            <FaMapMarkerAlt className="me-2 text-muted" />
                            <span>{repetition.location}</span>
                          </div>
                        </td>

                        <td>
                          {modifiedSchedule && modifiedSchedule.location !== repetition.location ? (
                            <div className="d-flex align-items-center">
                              <FaMapMarkerAlt className="me-2 text-success" />
                              <span className="text-success fw-bold">{modifiedSchedule.location}</span>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        <td>
                          {repetition.hasMyModification ? (
                            <div>
                              <Badge bg="success" className="d-flex align-items-center w-fit">
                                <FaCheckCircle className="me-1" />
                                Modifié
                              </Badge>
                              <small className="text-muted d-block mt-1">
                                {new Date(repetition.myModification.modifiedAt).toLocaleDateString('fr-FR')}
                              </small>
                            </div>
                          ) : (
                            <Badge bg="secondary">Non modifié</Badge>
                          )}
                        </td>

                        <td>
                          {isPast ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled
                              className="d-flex align-items-center"
                              title={
                                isToday ? 'Modification fermée après 18h00' : 'Cette répétition est passée et ne peut plus être modifiée'
                              }
                            >
                              <FaBan className="me-1" />
                              {isToday ? 'Fermé' : 'Passée'}
                            </Button>
                          ) : (
                            <Button
                              variant={repetition.hasMyModification ? 'warning' : 'primary'}
                              size="sm"
                              onClick={() => handleModifyClick(repetition)}
                              className="d-flex align-items-center"
                            >
                              <FaEdit className="me-1" />
                              {repetition.hasMyModification ? 'Re-modifier' : 'Modifier'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {/* Responsive Pagination Only */}
              {getTotalPages() > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
                  <div className="d-flex align-items-center order-2 order-md-1">
                    <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                      <span className="d-none d-sm-inline">Comptes par page:</span>
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
        </Card.Body>
      </Card>

      {/* MODAL */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBell className="me-2 text-primary" />
            Modifier Répétition - Manager
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmitModification}>
          <Modal.Body>
            {selectedRepetition && (
              <>
                <Alert variant="info" className="mb-4">
                  <strong>Répétition du {formatDate(selectedRepetition.date)}</strong>
                  <br />
                  <small>
                    <FaUsers className="me-2" />
                    <strong>Tous les choristes</strong> recevront un email avec les modifications.
                  </small>
                </Alert>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaClock className="me-2" />
                        Nouvelle heure de début
                      </Form.Label>
                      <Form.Control
                        type="time"
                        name="newStartTime"
                        value={formData.newStartTime}
                        onChange={handleInputChange}
                        isInvalid={!!validationErrors.newStartTime}
                      />
                      <Form.Control.Feedback type="invalid">{validationErrors.newStartTime}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaClock className="me-2" />
                        Nouvelle heure de fin
                      </Form.Label>
                      <Form.Control
                        type="time"
                        name="newEndTime"
                        value={formData.newEndTime}
                        onChange={handleInputChange}
                        isInvalid={!!validationErrors.newEndTime}
                        // ✅ REMOVED: readOnly prop - now end time can be modified
                      />
                      <Form.Control.Feedback type="invalid">{validationErrors.newEndTime}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <FaMapMarkerAlt className="me-2" />
                    Nouveau lieu
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="newLocation"
                    value={formData.newLocation}
                    onChange={handleInputChange}
                    placeholder="Nouveau lieu de répétition"
                    isInvalid={!!validationErrors.newLocation}
                    required
                  />
                  <Form.Control.Feedback type="invalid">{validationErrors.newLocation}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <FaEnvelope className="me-2" />
                    Message urgent (obligatoire)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="urgentMessage"
                    value={formData.urgentMessage}
                    onChange={handleInputChange}
                    placeholder="Ex: Changement de dernière minute, veuillez noter les nouvelles informations..."
                    isInvalid={!!validationErrors.urgentMessage}
                    required
                  />
                  <Form.Control.Feedback type="invalid">{validationErrors.urgentMessage}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Ce message sera envoyé à tous les choristes ({formData.urgentMessage.length}/500 caractères)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Motif du changement (optionnel)</Form.Label>
                  <Form.Control
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Ex: Problème de salle, absence du chef..."
                    isInvalid={!!validationErrors.reason}
                  />
                  <Form.Control.Feedback type="invalid">{validationErrors.reason}</Form.Control.Feedback>
                  <Form.Text className="text-muted">{formData.reason.length}/200 caractères</Form.Text>
                </Form.Group>

                {selectedRepetition.hasMyModification && (
                  <Alert variant="warning">
                    <strong>Note :</strong> Vous avez déjà modifié cette répétition le{' '}
                    {new Date(selectedRepetition.myModification.modifiedAt).toLocaleDateString('fr-FR')}. Cette nouvelle modification
                    remplacera la précédente.
                  </Alert>
                )}

                {/* PREVIEW CHANGES */}
                {hasChanges() && (
                  <Alert variant="success">
                    <h6>Aperçu des modifications :</h6>
                    <ul className="mb-0">
                      {formData.newStartTime !== selectedRepetition.startTime && (
                        <li>
                          Heure de début: {selectedRepetition.startTime} → {formData.newStartTime}
                        </li>
                      )}
                      {formData.newEndTime !== selectedRepetition.endTime && (
                        <li>
                          Heure de fin: {selectedRepetition.endTime} → {formData.newEndTime}
                        </li>
                      )}
                    </ul>
                  </Alert>
                )}
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                submitting ||
                !formData.urgentMessage.trim() ||
                !formData.newLocation.trim() ||
                Object.keys(validationErrors).length > 0 ||
                !hasChanges()
              }
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <FaBell className="me-2" />
                  Notifier Tous les Choristes
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManagerNotifications;
