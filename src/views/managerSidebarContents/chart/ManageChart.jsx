/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Table, Badge, Form, InputGroup, Spinner, Modal } from 'react-bootstrap';
import Select from 'react-select'; // ✅ NEW: Import react-select
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaFileAlt,
  FaCheckCircle,
  FaSave,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaCalendarAlt,
  FaChartBar,
  FaFilter // ✅ NEW: Filter icon
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import {
  getCommitmentCharts,
  getCommitmentChartById,
  createCommitmentChart,
  updateCommitmentChart,
  toggleCommitmentChartStatus,
  deleteCommitmentChart
} from '../../../services/commitment.service';

const ManageChart = () => {
  // State management
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [previewChart, setPreviewChart] = useState(null);

  // Filter and pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(null); // ✅ NEW: Year filter state
  const [filteredCharts, setFilteredCharts] = useState([]);

  const pageSizeOptions = [5, 10, 25, 50];

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      isActive: false
    }
  });

  const watchedValues = watch();

  // ✅ NEW: Generate year options for react-select
  const getYearOptions = () => {
    const uniqueYears = [...new Set(charts.map((chart) => chart.year))].sort((a, b) => b - a);
    return [
      { value: null, label: 'Toutes les années' },
      ...uniqueYears.map((year) => ({
        value: year,
        label: year.toString()
      }))
    ];
  };

  // ✅ NEW: Custom styles for react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '38px',
      borderColor: state.isFocused ? '#667eea' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(102, 126, 234, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#667eea'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#667eea' : state.isFocused ? 'rgba(102, 126, 234, 0.1)' : 'white',
      color: state.isSelected ? 'white' : '#333',
      '&:hover': {
        backgroundColor: state.isSelected ? '#667eea' : 'rgba(102, 126, 234, 0.1)'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d'
    })
  };

  // Load data on component mount
  useEffect(() => {
    loadCharts();
  }, []);

  // ✅ UPDATED: Filter charts when search query or year filter changes
  useEffect(() => {
    let filtered = charts;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (chart) =>
          chart.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chart.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chart.year.toString().includes(searchQuery)
      );
    }

    // Apply year filter
    if (selectedYear && selectedYear.value !== null) {
      filtered = filtered.filter((chart) => chart.year === selectedYear.value);
    }

    setFilteredCharts(filtered);
    setCurrentPage(0);
  }, [searchQuery, selectedYear, charts]);

  const loadCharts = async () => {
    try {
      setLoading(true);
      const response = await getCommitmentCharts();
      setCharts(response.data);
      setFilteredCharts(response.data);
    } catch (error) {
      console.error('Error loading charts:', error);
      Swal.fire('Erreur', 'Erreur lors du chargement des chartes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingChart(null);
    reset({
      title: '',
      content: '',
      isActive: false
    });
    setShowModal(true);
  };

  const openEditModal = async (chart) => {
    try {
      setSubmitting(true);
      const response = await getCommitmentChartById(chart._id);
      const chartData = response.data;

      setEditingChart(chartData);
      reset({
        title: chartData.title,
        content: chartData.content,
        isActive: chartData.isActive
      });
      setShowModal(true);
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors du chargement de la charte.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openPreviewModal = (chart) => {
    setPreviewChart(chart);
    setShowPreviewModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingChart(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      if (editingChart) {
        await updateCommitmentChart(editingChart._id, data);
        Swal.fire('Succès', 'Charte mise à jour avec succès.', 'success');
      } else {
        await createCommitmentChart(data);
        Swal.fire('Succès', 'Charte créée avec succès.', 'success');
      }

      closeModal();
      loadCharts();
    } catch (error) {
      // Handle duplicate title/year validation
      if (error.message && error.message.includes('existe déjà')) {
        Swal.fire({
          icon: 'error',
          title: 'Titre déjà existant',
          text: 'Une charte avec ce titre existe déjà pour cette année. Veuillez choisir un autre titre.',
          confirmButtonColor: '#d33'
        });
      }
      // Handle duplicate year validation
      else if (error.message && error.message.includes("Une charte existe déjà pour l'année")) {
        Swal.fire({
          icon: 'error',
          title: 'Année déjà utilisée',
          text: `Une charte existe déjà pour l'année ${new Date().getFullYear()}. Vous ne pouvez créer qu'une seule charte par année.`,
          confirmButtonColor: '#d33'
        });
      } else {
        Swal.fire('Erreur', error.message || 'Une erreur est survenue', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (chart) => {
    const action = chart.isActive ? 'désactiver' : 'activer';
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} cette charte ?`,
      text: chart.isActive
        ? 'Cette charte ne sera plus utilisée pour les nouvelles signatures.'
        : 'Cette charte deviendra la charte officielle pour cette année.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: chart.isActive ? '#dc3545' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Oui, ${action}`,
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await toggleCommitmentChartStatus(chart._id);
        Swal.fire('Succès', `Charte ${chart.isActive ? 'désactivée' : 'activée'} avec succès.`, 'success');
        loadCharts();
      } catch (error) {
        Swal.fire('Erreur', error.message, 'error');
      }
    }
  };

  const handleDelete = async (chart) => {
    if (chart.isActive) {
      Swal.fire('Erreur', 'Impossible de supprimer une charte active.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Supprimer cette charte ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await deleteCommitmentChart(chart._id);
        Swal.fire('Succès', 'Charte supprimée avec succès.', 'success');
        loadCharts();
      } catch (error) {
        Swal.fire('Erreur', error.message, 'error');
      }
    }
  };

  // ✅ NEW: Clear all filters function
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedYear(null);
  };

  // ✅ RESPONSIVE: Pagination helpers
  const getPaginatedCharts = () => {
    const startIndex = currentPage * itemsPerPage;
    return filteredCharts.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalItems = () => filteredCharts.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const isFirstPage = () => currentPage === 0;
  const isLastPage = () => currentPage >= getTotalPages() - 1;

  const goToFirstPage = () => setCurrentPage(0);
  const goToPreviousPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(getTotalPages() - 1, currentPage + 1));
  const goToLastPage = () => setCurrentPage(getTotalPages() - 1);

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0);
  };

  // Format date helper
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate estimated reading time
  const calculateReadingTime = (content) => {
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  // Count articles in content
  const countArticles = (content) => {
    const articleMatches = content.match(/Article\s+\d+/gi);
    return articleMatches ? articleMatches.length : 0;
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
    <Container style={{ marginTop: '2rem' }}>
      {/* Header */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom">
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0 text-dark">
                <FaFileAlt className="me-2 text-primary" />
                Gestion des chartes d'engagement
              </h4>
              <small className="text-muted">Gérez les chartes d'engagement dynamiques par année</small>
            </Col>
          </Row>
        </Card.Header>

        {/* Statistics */}
        <Card.Body className="bg-light">
          <Row className="g-3">
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-3">
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                      <FaFileAlt className="text-primary" size={24} />
                    </div>
                  </div>
                  <h3 className="fw-bold mb-1 text-primary">{charts.length}</h3>
                  <p className="text-muted mb-0 small">Total des chartes</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-3">
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3">
                      <FaCheckCircle className="text-success" size={24} />
                    </div>
                  </div>
                  <h3 className="fw-bold mb-1 text-success">{charts.filter((c) => c.isActive).length}</h3>
                  <p className="text-muted mb-0 small">Chartes actives</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-3">
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <div className="rounded-circle bg-info bg-opacity-10 p-3">
                      <FaChartBar className="text-info" size={24} />
                    </div>
                  </div>
                  <h3 className="fw-bold mb-1 text-info">{[...new Set(charts.map((c) => c.year))].length}</h3>
                  <p className="text-muted mb-0 small">Années couvertes</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="text-center p-3">
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                      <FaCalendarAlt className="text-warning" size={24} />
                    </div>
                  </div>
                  <h3 className="fw-bold mb-1 text-warning">{new Date().getFullYear()}</h3>
                  <p className="text-muted mb-0 small">Année actuelle</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ✅ UPDATED: Search and Filters */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Rechercher par titre"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <div className="d-flex align-items-center gap-2">
                <FaFilter className="text-muted" />
                <Select
                  options={getYearOptions()}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  placeholder="Filtrer par année"
                  isClearable
                  styles={selectStyles}
                  className="flex-grow-1"
                />
              </div>
            </Col>

            <Col md={3}>
              <Button variant="primary" onClick={openCreateModal} className="w-100 fw-bold shadow-sm">
                <FaPlus className="me-2" />
                Nouvelle Charte
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Charts Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {filteredCharts.length === 0 ? (
            <div className="text-center py-5">
              <FaFileAlt size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Aucune charte trouvée</h5>
              <p className="text-muted">
                {searchQuery || selectedYear ? 'Aucune charte ne correspond à vos filtres.' : "Créez votre première charte d'engagement."}
              </p>
              {(searchQuery || selectedYear) && (
                <Button variant="outline-primary" onClick={clearAllFilters} className="mt-2">
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Année</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedCharts().map((chart) => (
                    <tr key={chart._id}>
                      <td>
                        <div>
                          <strong>{chart.title}</strong>
                          <br />
                          {/* <small className="text-muted">
                            {countArticles(chart.content)} articles • {calculateReadingTime(chart.content)} min de lecture
                          </small> */}
                          <small className="text-muted">{countArticles(chart.content)} articles</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="px-3">
                          {chart.year}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={chart.isActive ? 'success' : 'secondary'}>
                          {chart.isActive ? (
                            <>
                              <FaCheckCircle className="me-1" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </td>
                      <td>
                        <small>{formatDate(chart.createdAt)}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button size="sm" variant="outline-info" onClick={() => openPreviewModal(chart)} title="Prévisualiser">
                            <FaEye />
                          </Button>
                          <Button size="sm" variant="outline-primary" onClick={() => openEditModal(chart)} title="Modifier">
                            <FaEdit />
                          </Button>
                          <Button
                            size="sm"
                            variant={chart.isActive ? 'outline-warning' : 'outline-success'}
                            onClick={() => handleToggleStatus(chart)}
                            title={chart.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {chart.isActive ? <FaToggleOff /> : <FaToggleOn />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(chart)}
                            disabled={chart.isActive}
                            title={chart.isActive ? 'Impossible de supprimer une charte active' : 'Supprimer'}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* ✅ RESPONSIVE: Pagination */}
              {getTotalPages() > 0 && (
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
                  <div className="d-flex align-items-center order-2 order-md-1">
                    <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                      <span className="d-none d-sm-inline">Chartes par page:</span>
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

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={closeModal} size="xl" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileAlt className="me-2" />
            {editingChart ? 'Modifier la Charte' : 'Nouvelle Charte'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Row>
              <Col md={9}>
                <Form.Group className="mb-3">
                  <Form.Label>Titre *</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('title', {
                      required: 'Le titre est requis'
                    })}
                    isInvalid={!!errors.title}
                    placeholder="Ex: Charte d'engagement 2024"
                  />
                  <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Année</Form.Label>
                  <Form.Control type="number" value={new Date().getFullYear()} disabled className="bg-light" />
                  <Form.Text className="text-muted">Année automatique</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Contenu de la charte *</Form.Label>
              <Form.Control
                as="textarea"
                rows={15}
                {...register('content', {
                  required: 'Le contenu est requis'
                })}
                isInvalid={!!errors.content}
                placeholder="Saisissez le contenu de la charte d'engagement..."
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
              />
              <Form.Control.Feedback type="invalid">{errors.content?.message}</Form.Control.Feedback>
              {watchedValues.content && (
                <Form.Text className="text-muted">
                  {countArticles(watchedValues.content)} articles •{calculateReadingTime(watchedValues.content)} min de lecture •
                  {watchedValues.content.length} caractères
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check type="checkbox" {...register('isActive')} label="Activer cette charte immédiatement" />
              <Form.Text className="text-muted">Si activée, cette charte remplacera toute autre charte active pour cette année.</Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              <FaTimes className="me-1" />
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {editingChart ? 'Mise à jour...' : 'Création...'}
                </>
              ) : (
                <>
                  <FaSave className="me-1" />
                  {editingChart ? 'Mettre à jour' : 'Créer'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye className="me-2" />
            Prévisualisation - {previewChart?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewChart && (
            <div>
              <div className="mb-3">
                <Row>
                  <Col sm={6}>
                    <strong>Année:</strong> {previewChart.year}
                  </Col>
                  <Col sm={6}>
                    <strong>Statut:</strong>{' '}
                    <Badge bg={previewChart.isActive ? 'success' : 'secondary'}>{previewChart.isActive ? 'Active' : 'Inactive'}</Badge>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col sm={6}>
                    <strong>Articles:</strong> {countArticles(previewChart.content)}
                  </Col>
                  {/* <Col sm={6}>
                    <strong>Temps de lecture:</strong> {calculateReadingTime(previewChart.content)} min
                  </Col> */}
                </Row>
              </div>
              <hr />
              <div
                style={{
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  fontFamily: 'Georgia, serif',
                  lineHeight: '1.6'
                }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{previewChart.content}</pre>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageChart;
