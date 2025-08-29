/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Spinner, Badge, InputGroup, Form, Row, Col, Modal, Alert } from 'react-bootstrap';
import Select from 'react-select';
import {
  FaExclamationTriangle,
  FaBan,
  FaSearch,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaPaperPlane,
  FaUsers,
  FaChartLine,
  FaCalendarAlt,
  FaPercentage,
  FaEnvelope,
  FaCheckCircle, // ✅ Validation icon
  FaUserTimes // ✅ NEW: Absent icon
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  getConcertAbsenceReport,
  sendWarningNotifications,
  eliminateChoristeForAbsence,
  eliminateChoristeForDisciplinary
} from '../../../services/elimination.service';
import { getConcerts, validateChoristeForConcert } from '../../../services/concert.service';

const ManageEliminations = () => {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChoriste, setSelectedChoriste] = useState(null);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Track eliminated choristes
  const [eliminatedChoristes, setEliminatedChoristes] = useState(new Set());
  // ✅ Track validated choristes
  const [validatedChoristes, setValidatedChoristes] = useState(new Set());
  // ✅ NEW: Track absent choristes
  const [absentChoristes, setAbsentChoristes] = useState(new Set());

  // Pagination (5 per page as requested)
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // Load concerts on mount
  useEffect(() => {
    loadConcerts();
  }, []);

  const loadConcerts = async () => {
    try {
      setLoading(true);
      const response = await getConcerts();
      const sortedConcerts = (response.data || response.concerts || response || []).sort(
        (a, b) => new Date(b.dateHeure) - new Date(a.dateHeure)
      );
      setConcerts(sortedConcerts);
    } catch (error) {
      console.error('Error loading concerts:', error);
      Swal.fire('Erreur', 'Impossible de charger les concerts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadConcertAnalysis = async (concertId) => {
    try {
      setLoading(true);
      const response = await getConcertAbsenceReport(concertId);
      setAnalysisData(response.data);

      // ✅ UPDATED: Track eliminated, validated, and absent choristes
      const eliminated = new Set();
      const validated = new Set();
      const absent = new Set();

      response.data.analysis.forEach((item) => {
        // Check elimination status
        if (item.choriste.eliminationRecords) {
          const isEliminatedFromThisConcert = item.choriste.eliminationRecords.some(
            (record) => record.concertId?.toString() === concertId.toString()
          );
          if (isEliminatedFromThisConcert) {
            eliminated.add(item.choriste._id);
          }
        }

        // ✅ Check validation status
        if (item.validationStatus === 'validated') {
          validated.add(item.choriste._id);
        }

        // ✅ NEW: Check absence status
        if (item.validationStatus === 'absent') {
          absent.add(item.choriste._id);
        }
      });

      setEliminatedChoristes(eliminated);
      setValidatedChoristes(validated);
      setAbsentChoristes(absent); // ✅ NEW

      setCurrentPage(0);
      setSearchTerm('');
    } catch (error) {
      console.error('Error loading analysis:', error);
      Swal.fire('Erreur', "Impossible de charger l'analyse des absences.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Format concert options for react-select
  const getConcertOptions = () => {
    return concerts.map((concert) => ({
      value: concert._id,
      label: `${concert.title} - ${formatDate(concert.dateHeure)}`
    }));
  };

  // Handle concert selection with react-select
  const handleConcertChange = (selectedOption) => {
    const concertId = selectedOption?.value || null;
    setSelectedConcert(concertId);
    if (concertId) {
      loadConcertAnalysis(concertId);
    } else {
      setAnalysisData(null);
      setEliminatedChoristes(new Set());
      setValidatedChoristes(new Set());
      setAbsentChoristes(new Set()); // ✅ NEW: Reset absent set
    }
  };

  // Filter choristes based on search term
  const getFilteredChoristes = () => {
    if (!analysisData?.analysis) return [];

    if (!searchTerm.trim()) return analysisData.analysis;

    return analysisData.analysis.filter((item) => {
      const fullName = `${item.choriste.firstName} ${item.choriste.lastName}`.toLowerCase();
      const email = item.choriste.email.toLowerCase();
      const search = searchTerm.toLowerCase();

      return fullName.includes(search) || email.includes(search);
    });
  };

  // Pagination functions
  const getTotalItems = () => getFilteredChoristes().length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedChoristes = () => {
    const filteredChoristes = getFilteredChoristes();
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredChoristes.slice(startIndex, endIndex);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
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

  // ✅ Validate choriste for concert
  const handleValidateChoriste = async (choriste) => {
    const result = await Swal.fire({
      title: 'Valider Choriste',
      text: `Valider ${choriste.firstName} ${choriste.lastName} pour ce concert ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Valider',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#28a745'
    });

    if (result.isConfirmed) {
      try {
        setProcessing(true);
        await validateChoristeForConcert(selectedConcert, choriste._id);

        // Add to validated set
        setValidatedChoristes((prev) => new Set([...prev, choriste._id]));

        Swal.fire({
          title: 'Choriste Validé!',
          text: `${choriste.firstName} ${choriste.lastName} a été validé pour ce concert.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Reload analysis to get updated data
        loadConcertAnalysis(selectedConcert);
      } catch (error) {
        Swal.fire('Erreur', 'Erreur lors de la validation du choriste.', 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  // ✅ Send individual warning to a specific choriste
  const handleSendIndividualWarning = async (choriste) => {
    const result = await Swal.fire({
      title: 'Envoyer un Avertissement',
      text: `Envoyer un avertissement à ${choriste.firstName} ${choriste.lastName} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#f59e0b'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Envoi en cours...',
        text: "Envoi de la notification d'avertissement...",
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        await sendWarningNotifications(selectedConcert, [choriste._id]);

        Swal.fire({
          title: 'Avertissement Envoyé!',
          text: `L'avertissement a été envoyé à ${choriste.firstName} ${choriste.lastName}.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        Swal.fire('Erreur', "Erreur lors de l'envoi de l'avertissement.", 'error');
      }
    }
  };

  // Send warnings to ALL at-risk choristes (existing function)
  const handleSendWarnings = async () => {
    if (!analysisData) return;

    // Exclude eliminated and absent choristes from warnings
    const atRiskChoristes = analysisData.analysis.filter(
      (item) => item.isAtRisk && !eliminatedChoristes.has(item.choriste._id) && !absentChoristes.has(item.choriste._id) // ✅ NEW: Exclude absent choristes
    );

    if (atRiskChoristes.length === 0) {
      Swal.fire('Information', 'Aucun choriste à risque non-éliminé/non-absent trouvé.', 'info');
      return;
    }

    const result = await Swal.fire({
      title: 'Envoyer des Avertissements',
      text: `Envoyer des avertissements à ${atRiskChoristes.length} choriste(s) à risque ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Envoi en cours...',
        text: "Envoi des notifications d'avertissement...",
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        const choristeIds = atRiskChoristes.map((item) => item.choriste._id);
        await sendWarningNotifications(selectedConcert, choristeIds);

        Swal.fire({
          title: 'Avertissements Envoyés!',
          text: `${atRiskChoristes.length} avertissement(s) envoyé(s) avec succès.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        Swal.fire('Erreur', "Erreur lors de l'envoi des avertissements.", 'error');
      }
    }
  };

  // Eliminate choriste for absence
  const handleEliminateForAbsence = async (choriste) => {
    const { value: notes } = await Swal.fire({
      title: 'Éliminer pour Absence',
      text: `Éliminer ${choriste.firstName} ${choriste.lastName} ?`,
      input: 'textarea',
      inputLabel: 'Notes (optionnel)',
      inputPlaceholder: 'Taux de présence insuffisant...',
      showCancelButton: true,
      confirmButtonText: 'Éliminer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545'
    });

    if (notes !== undefined) {
      Swal.fire({
        title: 'Élimination en cours...',
        text: 'Traitement et envoi de la notification...',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        await eliminateChoristeForAbsence(choriste._id, selectedConcert, notes);

        // Mark choriste as eliminated
        setEliminatedChoristes((prev) => new Set([...prev, choriste._id]));

        Swal.fire({
          title: 'Choriste Éliminé',
          text: `${choriste.firstName} ${choriste.lastName} a été éliminé(e) et notifié(e) par email.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Reload analysis
        loadConcertAnalysis(selectedConcert);
      } catch (error) {
        Swal.fire('Erreur', "Erreur lors de l'élimination.", 'error');
      }
    }
  };

  // Eliminate choriste for disciplinary reasons
  const handleEliminateForDisciplinary = async (choriste) => {
    if (!selectedConcert) {
      Swal.fire('Erreur', 'Veuillez sélectionner un concert.', 'error');
      return;
    }

    const { value: notes } = await Swal.fire({
      title: 'Élimination Disciplinaire',
      text: `Éliminer ${choriste.firstName} ${choriste.lastName} du concert sélectionné ?`,
      input: 'textarea',
      inputLabel: 'Raison (obligatoire)',
      inputPlaceholder: 'Comportement inapproprié...',
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'Une raison est obligatoire pour une élimination disciplinaire.';
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Éliminer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545'
    });

    if (notes) {
      Swal.fire({
        title: 'Élimination en cours...',
        text: 'Traitement et envoi de la notification...',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        await eliminateChoristeForDisciplinary(choriste._id, selectedConcert, notes);

        // Mark choriste as eliminated
        setEliminatedChoristes((prev) => new Set([...prev, choriste._id]));

        Swal.fire({
          title: 'Choriste Éliminé',
          text: `${choriste.firstName} ${choriste.lastName} a été éliminé(e) et notifié(e) par email.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Reload analysis
        loadConcertAnalysis(selectedConcert);
      } catch (error) {
        Swal.fire('Erreur', "Erreur lors de l'élimination.", 'error');
      }
    }
  };

  // Show choriste details
  const showChoristeDetails = (choriste) => {
    setSelectedChoriste(choriste);
    setShowDetailsModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
      '&:hover': {
        borderColor: '#80bdff'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d'
    })
  };

  // ✅ UPDATED: Get statistics including validation and absence data
  const getUpdatedStatistics = () => {
    if (!analysisData) return null;

    const nonEliminatedAnalysis = analysisData.analysis.filter((item) => !eliminatedChoristes.has(item.choriste._id));

    const nonEliminatedAtRisk = nonEliminatedAnalysis.filter((item) => item.isAtRisk && !absentChoristes.has(item.choriste._id)).length; // ✅ Exclude absent from at-risk count

    const nonEliminatedGood = nonEliminatedAnalysis.filter((item) => !item.isAtRisk && !absentChoristes.has(item.choriste._id)).length; // ✅ Exclude absent from good count

    // ✅ Validation statistics
    const availableForValidation = analysisData.analysis.filter((item) => item.hasMarkedDisponibilite).length;
    const validatedCount = validatedChoristes.size;
    const absentCount = absentChoristes.size; // ✅ NEW
    const pendingValidation = availableForValidation - validatedCount - eliminatedChoristes.size - absentCount; // ✅ Subtract absent count

    return {
      totalChoristes: analysisData.totalChoristes,
      activeChoristes: nonEliminatedAnalysis.length - absentCount, // ✅ Subtract absent count
      eliminatedCount: eliminatedChoristes.size,
      absentCount, // ✅ NEW
      atRiskCount: nonEliminatedAtRisk,
      goodAttendanceCount: nonEliminatedGood,
      threshold: analysisData.threshold,
      // ✅ Validation stats
      availableForValidation,
      validatedCount,
      pendingValidation
    };
  };

  // ✅ NEW: Get absence reason message
  const getAbsenceReasonMessage = (reason) => {
    switch (reason) {
      case 'removed_by_admin':
        return 'Absent (retiré par admin)';
      case 'removed_by_chef':
        return 'Absent (retiré par chef)';
      case 'manual_absence':
        return 'Absent (marqué manuellement)';
      case 'did_not_mark_disponibilite':
        return 'Absent (pas de disponibilité)';
      default:
        return 'Absent';
    }
  };

  const stats = getUpdatedStatistics();

  return (
    <Container style={{ marginTop: '2rem' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h4 className="mb-3">
                <FaBan className="me-2 text-danger" />
                Gestion des éliminations & validations
              </h4>

              {/* Concert Selection with react-select */}
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Sélectionner un Concert</Form.Label>
                    <Select
                      options={getConcertOptions()}
                      value={getConcertOptions().find((option) => option.value === selectedConcert) || null}
                      onChange={handleConcertChange}
                      placeholder="-- Choisir un concert --"
                      isClearable
                      isSearchable
                      isDisabled={loading}
                      styles={selectStyles}
                      noOptionsMessage={() => 'Aucun concert trouvé'}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analysis Results */}
      {analysisData && stats && (
        <>
          {/* ✅ UPDATED: Statistics Cards with validation and absence tracking */}
          <Row className="mb-4">
            <Col md={2}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <FaUsers className="text-primary mb-2" size={24} />
                  <h4 className="mb-1">{stats.totalChoristes}</h4>
                  <small className="text-muted">Total Choristes</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <FaUsers className="text-info mb-2" size={24} />
                  <h4 className="mb-1 text-info">{stats.availableForValidation}</h4>
                  <small className="text-muted">Disponibles</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <FaCheckCircle className="text-success mb-2" size={24} />
                  <h4 className="mb-1 text-success">{stats.validatedCount}</h4>
                  <small className="text-muted">Validés</small>
                </Card.Body>
              </Card>
            </Col>
            {/* ✅ NEW: Absent count card */}
            <Col md={2}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <FaUserTimes className="text-warning mb-2" size={24} />
                  <h4 className="mb-1 text-warning">{stats.absentCount}</h4>
                  <small className="text-muted">Absents</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <FaBan className="text-danger mb-2" size={24} />
                  <h4 className="mb-1 text-danger">{stats.eliminatedCount}</h4>
                  <small className="text-muted">Éliminés</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center border-0 shadow-sm">
                <Card.Body>
                  <FaPercentage className="text-info mb-2" size={24} />
                  <h4 className="mb-1 text-info">{stats.threshold}%</h4>
                  <small className="text-muted">Seuil Requis</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Table */}
          <Card className="shadow-sm border-0">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
              <h5 className="mb-0">Analyse & Validation - {analysisData.concert.title}</h5>
              <div className="d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
                {/* Show count of non-eliminated, non-absent at-risk choristes */}
                {stats.atRiskCount > 0 && (
                  <Button variant="warning" size="sm" onClick={handleSendWarnings} disabled={processing} className="w-100 w-sm-auto">
                    <FaPaperPlane className="me-1" />
                    <span className="d-none d-md-inline">Envoyer Avertissements</span>
                    <span className="d-md-none">Avertissements</span> ({stats.atRiskCount})
                  </Button>
                )}
              </div>
            </Card.Header>

            <Card.Body className="p-0">
              {/* Search Bar */}
              <div className="p-3 border-bottom">
                <InputGroup style={{ maxWidth: '400px' }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control type="text" placeholder="Rechercher par nom ou email..." value={searchTerm} onChange={handleSearchChange} />
                </InputGroup>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <>
                  <Table hover bordered responsive className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Choriste</th>
                        <th>Taux de Présence</th>
                        <th>Présences/Total</th>
                        <th>Statut Assiduité</th>
                        <th>Statut Concert</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedChoristes().map((item) => {
                        // Check if choriste is eliminated, validated, or absent
                        const isEliminated = eliminatedChoristes.has(item.choriste._id);
                        const isValidated = validatedChoristes.has(item.choriste._id);
                        const isAbsent = absentChoristes.has(item.choriste._id); // ✅ NEW

                        // ✅ UPDATED: Determine concert status including absence
                        let concertStatus = 'Non disponible';
                        let concertStatusVariant = 'secondary';

                        if (item.hasMarkedDisponibilite) {
                          if (isEliminated) {
                            concertStatus = 'Éliminé';
                            concertStatusVariant = 'danger';
                          } else if (isAbsent) {
                            // ✅ NEW: Check absent status
                            concertStatus = getAbsenceReasonMessage(item.absentInfo?.reason);
                            concertStatusVariant = 'warning';
                          } else if (isValidated) {
                            concertStatus = 'Validé';
                            concertStatusVariant = 'success';
                          } else {
                            concertStatus = 'À valider';
                            concertStatusVariant = 'info';
                          }
                        } else if (isEliminated) {
                          concertStatus = 'Éliminé';
                          concertStatusVariant = 'danger';
                        } else if (isAbsent) {
                          // ✅ NEW: Check absent status for non-available
                          concertStatus = getAbsenceReasonMessage(item.absentInfo?.reason);
                          concertStatusVariant = 'warning';
                        }

                        return (
                          <tr key={item.choriste._id} className={isEliminated || isAbsent ? 'table-secondary' : ''}>
                            <td>
                              <div>
                                <strong>
                                  {item.choriste.firstName} {item.choriste.lastName}
                                </strong>
                                <br />
                                <small className="text-muted">{item.choriste.email}</small>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="progress me-2" style={{ width: '80px', height: '8px' }}>
                                  <div
                                    className={`progress-bar ${
                                      isEliminated || isAbsent // ✅ UPDATED: Include absent
                                        ? 'bg-secondary'
                                        : item.attendanceRate >= item.threshold
                                          ? 'bg-success'
                                          : item.attendanceRate >= item.threshold * 0.8
                                            ? 'bg-warning'
                                            : 'bg-danger'
                                    }`}
                                    style={{
                                      width:
                                        item.attendanceRate === 0 && !isEliminated && !isAbsent // ✅ UPDATED: Include absent
                                          ? '3px' // Fixed width for 0% to show red
                                          : `${Math.min(item.attendanceRate, 100)}%`
                                    }}
                                  ></div>
                                </div>
                                <span className="fw-bold">{item.attendanceRate.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td>
                              <Badge bg="info">
                                {item.attendedRepetitions}/{item.totalRepetitions}
                              </Badge>
                            </td>
                            <td>
                              {/* ✅ UPDATED: Show appropriate status */}
                              <Badge bg={isEliminated || isAbsent ? 'danger' : item.isAtRisk ? 'warning' : 'success'} className="px-3">
                                {isEliminated ? 'Éliminé' : isAbsent ? 'Absent' : item.isAtRisk ? 'À Risque' : 'Bon'}
                              </Badge>
                            </td>
                            {/* ✅ UPDATED: Concert status column with absence support */}
                            <td>
                              <Badge bg={concertStatusVariant} className="px-3">
                                {concertStatus}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button size="sm" variant="outline-info" onClick={() => showChoristeDetails(item)} title="Voir détails">
                                  <FaEye />
                                </Button>

                                {/* ✅ Validate button for available choristes (not absent, not eliminated) */}
                                {item.hasMarkedDisponibilite && !isEliminated && !isValidated && !isAbsent && (
                                  <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={() => handleValidateChoriste(item.choriste)}
                                    disabled={processing}
                                    title="Valider pour le concert"
                                  >
                                    <FaCheckCircle />
                                  </Button>
                                )}

                                {/* Individual warning button for at-risk choristes (not eliminated, not absent) */}
                                {item.isAtRisk && !isEliminated && !isAbsent && (
                                  <Button
                                    size="sm"
                                    variant="outline-warning"
                                    onClick={() => handleSendIndividualWarning(item.choriste)}
                                    disabled={processing}
                                    title="Envoyer un avertissement"
                                  >
                                    <FaEnvelope />
                                  </Button>
                                )}

                                {/* ✅ UPDATED: Disable elimination buttons if already eliminated, validated, or absent */}
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleEliminateForAbsence(item.choriste)}
                                  disabled={processing || isEliminated || isValidated || isAbsent} // ✅ UPDATED: Include isAbsent
                                  title={
                                    isEliminated
                                      ? 'Déjà éliminé'
                                      : isAbsent
                                        ? 'Choriste absent'
                                        : isValidated
                                          ? "Choriste validé - impossible d'éliminer"
                                          : 'Éliminer pour absence'
                                  }
                                >
                                  <FaBan />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {getTotalItems() === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            {searchTerm ? `Aucun choriste trouvé pour "${searchTerm}"` : 'Aucun choriste trouvé.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>

                  {/* ✅ RESPONSIVE PAGINATION */}
                  {getTotalItems() > 0 && (
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
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
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Détails - {selectedChoriste?.choriste.firstName} {selectedChoriste?.choriste.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedChoriste && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Email:</strong> {selectedChoriste.choriste.email}
                </Col>
                <Col md={6}>
                  <strong>Taux de présence:</strong>{' '}
                  <Badge
                    bg={
                      eliminatedChoristes.has(selectedChoriste.choriste._id) || absentChoristes.has(selectedChoriste.choriste._id) // ✅ UPDATED: Include absent
                        ? 'secondary'
                        : selectedChoriste.isAtRisk
                          ? 'danger'
                          : 'success'
                    }
                  >
                    {selectedChoriste.attendanceRate.toFixed(1)}%
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Seuil requis:</strong> <Badge bg="secondary">{selectedChoriste.threshold}%</Badge>
                </Col>
                <Col md={6}>
                  <strong>Statut:</strong>{' '}
                  <Badge
                    bg={
                      eliminatedChoristes.has(selectedChoriste.choriste._id)
                        ? 'danger'
                        : absentChoristes.has(selectedChoriste.choriste._id) // ✅ NEW: Check absent status
                          ? 'warning'
                          : selectedChoriste.isAtRisk
                            ? 'warning'
                            : 'success'
                    }
                  >
                    {eliminatedChoristes.has(selectedChoriste.choriste._id)
                      ? 'Éliminé'
                      : absentChoristes.has(selectedChoriste.choriste._id) // ✅ NEW: Show absent status
                        ? 'Absent'
                        : selectedChoriste.isAtRisk
                          ? 'À Risque'
                          : 'Bon'}
                  </Badge>
                </Col>
              </Row>

              {/* ✅ NEW: Show absence details if choriste is absent */}
              {selectedChoriste.absentInfo && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Alert variant="warning">
                      <strong>Informations d'absence:</strong>
                      <br />
                      <strong>Raison:</strong> {getAbsenceReasonMessage(selectedChoriste.absentInfo.reason)}
                      <br />
                      <strong>Marqué absent le:</strong> {new Date(selectedChoriste.absentInfo.markedAt).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(selectedChoriste.absentInfo.markedAt).toLocaleTimeString('fr-FR')}
                    </Alert>
                  </Col>
                </Row>
              )}

              <h6>Détail des Répétitions:</h6>
              <Table size="sm" bordered>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lieu</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChoriste.repetitionDetails.map((rep, index) => (
                    <tr key={index}>
                      <td>{formatDate(rep.date)}</td>
                      <td>{rep.location}</td>
                      <td>
                        <Badge bg={rep.attended ? 'success' : 'danger'}>{rep.attended ? 'Présent' : 'Absent'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageEliminations;
