import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Table,
  Badge,
  Spinner,
  Alert,
  InputGroup,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import Select from 'react-select';
import {
  FaEdit,
  FaTrash,
  FaHandPaper,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaEye,
  FaTools,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSearch
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getRepetitions, getMyChoristesStatus, addManualPresence, removeManualPresence } from '../../../services/repetition.service';

const PresenceList = () => {
  // State management
  const [repetitions, setRepetitions] = useState([]);
  const [selectedRepetition, setSelectedRepetition] = useState(null);
  const [choristesData, setChoristesData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 🔍 Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Angular Material style pagination (0-based like RescheduleCandidate)
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // Manual presence modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedChoriste, setSelectedChoriste] = useState(null);
  const [manualType, setManualType] = useState('present');
  const [manualReason, setManualReason] = useState('');

  // React-Select options for presence type
  const presenceTypeOptions = [
    { value: 'present', label: '✅ Présent', color: '#28a745' },
    { value: 'absent', label: '❌ Absent', color: '#dc3545' }
  ];

  // Load repetitions on component mount
  useEffect(() => {
    loadRepetitions();
  }, []);

  const loadRepetitions = async () => {
    try {
      const data = await getRepetitions();
      // Sort by date (most recent first)
      const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRepetitions(sortedData);
    } catch (error) {
      console.error('Error loading repetitions:', error);
      Swal.fire('Erreur', 'Erreur lors du chargement des répétitions.', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadChoristesStatus = async (repetitionValue) => {
    if (!repetitionValue) {
      setChoristesData(null);
      return;
    }

    try {
      const data = await getMyChoristesStatus(repetitionValue);
      setChoristesData(data);
      setCurrentPage(0); // Reset pagination
    } catch (error) {
      console.error('Error loading choristes status:', error);
      Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors du chargement des choristes.', 'error');
      setChoristesData(null);
    }
  };

  // Handle repetition selection
  const handleRepetitionChange = async (selectedOption) => {
    setSelectedRepetition(selectedOption);
    if (selectedOption) {
      await loadChoristesStatus(selectedOption.value);
    } else {
      setChoristesData(null);
    }
  };

  // 🔍 Filter choristes based on search term
  const getFilteredChoristes = () => {
    if (!choristesData?.choristes) return [];
    if (!searchTerm.trim()) return choristesData.choristes;

    return choristesData.choristes.filter((choriste) => {
      const fullName = `${choriste.firstName} ${choriste.lastName}`.toLowerCase();
      const email = choriste.email.toLowerCase();
      const search = searchTerm.toLowerCase();

      return fullName.includes(search) || email.includes(search);
    });
  };

  // 🔍 Handle search change and reset pagination
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleManualPresence = (choriste) => {
    setSelectedChoriste(choriste);
    const currentType = choriste.status === 'present' ? 'present' : 'absent';
    setManualType(currentType);
    setManualReason(choriste.isManual ? choriste.manualReason : '');
    setShowManualModal(true);
  };

  const submitManualPresence = async () => {
    if (!manualReason.trim()) {
      Swal.fire('Erreur', 'Le motif est requis.', 'error');
      return;
    }

    try {
      setProcessing(true);

      await addManualPresence(selectedRepetition.value, {
        choristeId: selectedChoriste._id,
        type: manualType,
        reason: manualReason.trim()
      });

      Swal.fire(
        'Succès',
        `Présence manuelle "${manualType}" ajoutée pour ${selectedChoriste.firstName} ${selectedChoriste.lastName}.`,
        'success'
      );

      // Reload data
      await loadChoristesStatus(selectedRepetition.value);

      // Close modal
      setShowManualModal(false);
      setSelectedChoriste(null);
      setManualReason('');
    } catch (error) {
      console.error('Error adding manual presence:', error);
      Swal.fire('Erreur', error.response?.data?.message || "Erreur lors de l'ajout de la présence manuelle.", 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveManualPresence = async (choriste) => {
    const result = await Swal.fire({
      title: 'Supprimer la présence manuelle?',
      text: `Revenir au statut automatique pour ${choriste.firstName} ${choriste.lastName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        setProcessing(true);

        await removeManualPresence(selectedRepetition.value, choriste._id);

        Swal.fire(
          'Succès',
          `Présence manuelle supprimée pour ${choriste.firstName} ${choriste.lastName}. Retour au statut automatique.`,
          'success'
        );

        // Reload data
        await loadChoristesStatus(selectedRepetition.value);
      } catch (error) {
        console.error('Error removing manual presence:', error);
        Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors de la suppression.', 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  const getStatusBadge = (choriste) => {
    const statusConfig = {
      present: { label: 'Présent', variant: 'success', icon: <FaUserCheck className="me-1" /> },
      absent: { label: 'Absent', variant: 'danger', icon: <FaUserTimes className="me-1" /> },
      'no-response': { label: 'Pas de réponse', variant: 'warning', icon: <FaClock className="me-1" /> }
    };

    const config = statusConfig[choriste.status] || statusConfig['no-response'];

    return (
      <div className="d-flex flex-wrap gap-1">
        <Badge bg={config.variant} className="d-flex align-items-center">
          {config.icon}
          {config.label}
        </Badge>
        {choriste.isManual && (
          <Badge bg="info" variant="info" className="d-flex align-items-center">
            <FaHandPaper className="me-1" />
            Manuel
          </Badge>
        )}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Convert repetitions to react-select options
  const repetitionOptions = repetitions.map((rep) => ({
    value: rep._id,
    label: `${formatDate(rep.date)} - ${rep.startTime} à ${rep.endTime} - ${rep.location}`,
    date: rep.date,
    startTime: rep.startTime,
    endTime: rep.endTime,
    location: rep.location
  }));

  // 🔍 Updated pagination logic with filtered data (0-based like RescheduleCandidate)
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

  // Custom styles for react-select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '45px',
      borderColor: state.isFocused ? '#0d6efd' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#0d6efd' : '#adb5bd'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#0d6efd' : state.isFocused ? '#f8f9fa' : 'white',
      color: state.isSelected ? 'white' : '#212529',
      '&:active': {
        backgroundColor: '#0d6efd'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6c757d'
    })
  };

  const presenceTypeSelectStyles = {
    ...customSelectStyles,
    option: (base, state) => {
      const option = presenceTypeOptions.find((opt) => opt.value === state.data.value);
      return {
        ...base,
        backgroundColor: state.isSelected ? option?.color : state.isFocused ? '#f8f9fa' : 'white',
        color: state.isSelected ? 'white' : '#212529',
        '&:active': {
          backgroundColor: option?.color
        }
      };
    }
  };

  if (initialLoading) {
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
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1 fw-bold text-dark">
              <FaEye className="me-3 text-primary" />
              Gestion des Présences - Chef de Pupitre
            </h4>
            <p className="text-muted mb-0">Visualisez et gérez les présences de votre pupitre</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            {choristesData && (
              <Badge bg="primary" className="fs-6">
                {getTotalItems()} choriste{getTotalItems() !== 1 ? 's' : ''}
                {searchTerm && ` (${choristesData.choristes.length} total)`}
              </Badge>
            )}
          </div>
        </Card.Header>

        <Card.Body>
          {/* Repetition Selector with React-Select */}
          <Row className="mb-4">
            <Col>
              <Form.Group>
                <Form.Label className="fw-semibold mb-2">Sélectionner une répétition</Form.Label>
                <Select
                  value={selectedRepetition}
                  onChange={handleRepetitionChange}
                  options={repetitionOptions}
                  placeholder="-- Choisir une répétition --"
                  isClearable
                  styles={customSelectStyles}
                  formatOptionLabel={(option) => (
                    <div className="py-1">
                      <div className="fw-semibold text-dark">{formatDate(option.date)}</div>
                      <small className="text-muted">
                        {option.startTime} - {option.endTime} • {option.location}
                      </small>
                    </div>
                  )}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Repetition Info */}
          {selectedRepetition && choristesData && (
            <Alert variant="info" className="border-0 mb-4" style={{ backgroundColor: '#e3f2fd' }}>
              <Row>
                <Col md={8}>
                  <h6 className="mb-1">
                    <strong>Répétition:</strong> {formatDate(choristesData.repetition.date)}
                    de {choristesData.repetition.startTime} à {choristesData.repetition.endTime}
                  </h6>
                  <div className="text-muted">
                    <strong>Lieu:</strong> {choristesData.repetition.location}
                  </div>
                </Col>
                <Col md={4} className="text-md-end">
                  <Badge bg="primary" className="me-2 p-2">
                    Pupitre: {choristesData.chefPupitre}
                  </Badge>
                </Col>
              </Row>
            </Alert>
          )}

          {choristesData && (
            <>
              {/* 🔍 Search Bar */}
              <div className="mb-3 d-flex justify-content-start">
                <InputGroup style={{ maxWidth: '400px' }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom ou email du choriste..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </div>

              {/* Choristes Table */}
              {getTotalItems() === 0 ? (
                <Alert variant="info" className="text-center">
                  <FaUserCheck className="mb-2" style={{ fontSize: '2rem', opacity: 0.5 }} />
                  <h6>{searchTerm ? `Aucun choriste trouvé pour "${searchTerm}"` : 'Aucun choriste trouvé'}</h6>
                  <p className="mb-0">
                    {searchTerm ? 'Essayez avec un autre terme de recherche.' : 'Aucun choriste dans votre pupitre pour cette répétition.'}
                  </p>
                </Alert>
              ) : (
                <>
                  <Table bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Choriste</th>
                        <th>Statut</th>
                        <th>Détails</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedChoristes().map((choriste) => (
                        <tr key={choriste._id}>
                          <td>
                            <div>
                              <strong>
                                {choriste.firstName} {choriste.lastName}
                              </strong>
                              <br />
                              <small className="text-muted">{choriste.email}</small>
                            </div>
                          </td>

                          <td>{getStatusBadge(choriste)}</td>

                          <td>
                            {choriste.isManual ? (
                              <div>
                                <div className="fw-semibold text-dark">{choriste.manualReason}</div>
                                <small className="text-muted">
                                  Par: {choriste.addedBy} | Le: {new Date(choriste.addedAt).toLocaleString('fr-FR')}
                                </small>
                              </div>
                            ) : choriste.automaticReason ? (
                              <div className="text-muted">
                                <strong>{choriste.automaticReason}</strong>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>

                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip>{choriste.isManual ? 'Modifier manuel' : 'Ajouter manuel'}</Tooltip>}
                              >
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleManualPresence(choriste)}
                                  disabled={processing}
                                  title={choriste.isManual ? 'Modifier manuel' : 'Ajouter manuel'}
                                >
                                  {choriste.isManual ? <FaEdit /> : <FaTools />}
                                </Button>
                              </OverlayTrigger>

                              {choriste.isManual && (
                                <OverlayTrigger placement="top" overlay={<Tooltip>Supprimer manuel</Tooltip>}>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleRemoveManualPresence(choriste)}
                                    disabled={processing}
                                    title="Supprimer manuel"
                                  >
                                    <FaTrash />
                                  </Button>
                                </OverlayTrigger>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination - Exact RescheduleCandidate Style */}
                  <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                    <div className="d-flex align-items-center">
                      <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                        Choristes par page:
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
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstPage() ? '#6c757d' : '#495057'
                        }}
                        title="Première page"
                      >
                        <FaAngleDoubleLeft />
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={isFirstPage()}
                        className="me-3"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstPage() ? '#6c757d' : '#495057'
                        }}
                        title="Page précédente"
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
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastPage() ? '#6c757d' : '#495057'
                        }}
                        title="Page suivante"
                      >
                        <FaChevronRight />
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={isLastPage()}
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastPage() ? '#6c757d' : '#495057'
                        }}
                        title="Dernière page"
                      >
                        <FaAngleDoubleRight />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Professional Manual Presence Modal */}
      <Modal show={showManualModal} onHide={() => !processing && setShowManualModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="h5 fw-semibold">
            <FaHandPaper className="me-2 text-primary" />
            Modifier la présence - {selectedChoriste?.firstName} {selectedChoriste?.lastName}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Statut</Form.Label>
                <Select
                  value={presenceTypeOptions.find((option) => option.value === manualType)}
                  onChange={(selected) => setManualType(selected.value)}
                  options={presenceTypeOptions}
                  isDisabled={processing}
                  styles={presenceTypeSelectStyles}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>Choriste:</strong> {selectedChoriste?.firstName} {selectedChoriste?.lastName}
                  <br />
                  <strong>Email:</strong> {selectedChoriste?.email}
                </small>
              </div>
            </Col>
          </Row>

          <Form.Group>
            <Form.Label className="fw-semibold">
              Motif de la modification manuelle <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="Ex: Arrivée en retard, problème technique, etc."
              disabled={processing}
              isInvalid={manualReason.trim() === ''}
            />
            <Form.Control.Feedback type="invalid">Le motif est requis.</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="border-top bg-light">
          <Button variant="outline-secondary" onClick={() => setShowManualModal(false)} disabled={processing}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submitManualPresence} disabled={processing || !manualReason.trim()}>
            {processing ? (
              <>
                <Spinner size="sm" className="me-2" />
                Traitement...
              </>
            ) : (
              'Confirmer'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PresenceList;
