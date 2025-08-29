/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Button, Badge, Form, InputGroup, Alert, Table } from 'react-bootstrap';
import { getAllLeaves, acceptLeave } from '../../../services/conge.service';
import {
  FaCalendarAlt,
  FaUserAlt,
  FaClock,
  FaCommentDots,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUserClock,
  FaFilter,
  FaCheck,
  FaTimes,
  FaHourglassHalf
} from 'react-icons/fa';
import { Search, Calendar, MessageSquare, User, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Acceptés' }
  // { value: 'rejected', label: 'Rejetés' }
];

function ManageLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const pageSizeOptions = [6, 12, 18, 24];

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllLeaves();
      // Sort by most recent first
      const sortedData = data.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
      setLeaves(sortedData);
    } catch {
      setError('Impossible de récupérer les demandes de congé.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ RESET PAGINATION WHEN FILTERS CHANGE
  useEffect(() => {
    setCurrentPage(0);
  }, [searchName, statusFilter]);

  const handleAccept = async (leaveId) => {
    setAcceptingId(leaveId);

    const result = await Swal.fire({
      title: "Confirmer l'acceptation",
      text: 'Voulez-vous vraiment accepter cette demande de congé ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, accepter',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    });

    if (!result.isConfirmed) {
      setAcceptingId(null);
      return;
    }

    try {
      await acceptLeave(leaveId);
      await fetchLeaves();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Congé accepté avec succès',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: "Erreur lors de l'acceptation du congé",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDurationInDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge bg="success" className="d-flex align-items-center">
            <FaCheck size={12} className="me-1" />
            Accepté
          </Badge>
        );
      case 'pending':
        return (
          <Badge bg="warning" text="dark" className="d-flex align-items-center">
            <FaHourglassHalf size={12} className="me-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge bg="danger" className="d-flex align-items-center">
            <FaTimes size={12} className="me-1" />
            Rejeté
          </Badge>
        );
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Filter leaves by searchName and status
  const getFilteredLeaves = () => {
    let filtered = leaves;

    // Filter by name
    if (searchName.trim()) {
      filtered = filtered.filter((leave) => {
        const fullName = `${leave.user?.firstName ?? ''} ${leave.user?.lastName ?? ''}`.toLowerCase();
        return fullName.includes(searchName.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter.value !== 'all') {
      filtered = filtered.filter((leave) => leave.status === statusFilter.value);
    }

    return filtered;
  };

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const filteredLeaves = getFilteredLeaves();
  const getTotalItems = () => filteredLeaves.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
    const start = currentPage * itemsPerPage;
    return filteredLeaves.slice(start, start + itemsPerPage);
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

  // Get status counts
  const statusCounts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length
  };

  return (
    <Container fluid className="py-4" style={{ maxWidth: '1400px' }}>
      {/* ✅ HEADER SECTION */}
      {/* <div className="mb-4">
        <Row className="align-items-center">
          <Col>
            <h2 className="fw-bold text-dark mb-1">
              <FaUserClock className="me-3 text-primary" />
              Gestion des Congés
            </h2>
            <p className="text-muted mb-0">Gérez les demandes de congé des membres de l'orchestre</p>
          </Col>
          <Col xs="auto">
            <Row className="g-2">
              <Col>
                <div className="text-center">
                  <div className="fw-bold text-primary fs-4">{statusCounts.pending}</div>
                  <small className="text-muted">En attente</small>
                </div>
              </Col>
              <Col>
                <div className="text-center">
                  <div className="fw-bold text-success fs-4">{statusCounts.approved}</div>
                  <small className="text-muted">Acceptés</small>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div> */}

      {/* ✅ FILTERS SECTION */}
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <Row className="align-items-center g-3">
            <Col md={4}>
              <label className="form-label fw-semibold mb-2 text-dark">
                <Search size={16} className="me-2" />
                Rechercher par nom
              </label>
              <InputGroup>
                <InputGroup.Text style={{ backgroundColor: '#f8f9fa', borderColor: '#e5e7eb' }}>
                  <Search size={16} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Tapez le nom ou prénom..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  disabled={loading}
                  style={{
                    borderColor: '#e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <label className="form-label fw-semibold mb-2 text-dark">
                <FaFilter className="me-2" />
                Filtrer par statut
              </label>
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
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
                  })
                }}
              />
            </Col>
            <Col md={3}>
              <div className="mt-4">
                <small className="text-muted">
                  {getTotalItems()} demande(s)
                  {searchName && ` pour "${searchName}"`}
                  {statusFilter.value !== 'all' && ` • ${statusFilter.label}`}
                </small>
              </div>
            </Col>
            <Col xs="auto">
              <Row>
                <Col>
                  <div className="text-center">
                    <div className="fw-bold text-primary fs-4">{statusCounts.pending}</div>
                    <small className="text-muted">En attente</small>
                  </div>
                </Col>
                <Col>
                  <div className="text-center">
                    <div className="fw-bold text-success fs-4">{statusCounts.approved}</div>
                    <small className="text-muted">Acceptés</small>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ✅ LOADING STATE */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des demandes de congé...</p>
        </div>
      )}

      {/* ✅ ERROR STATE */}
      {error && (
        <Alert variant="danger" className="text-center border-0" style={{ borderRadius: '12px' }}>
          <Alert.Heading className="h6 mb-2">Erreur de chargement</Alert.Heading>
          {error}
        </Alert>
      )}

      {/* ✅ NO RESULTS */}
      {!loading && !error && getTotalItems() === 0 && (
        <div className="text-center py-5">
          <FaUserClock size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucune demande trouvée</h5>
          <p className="text-muted">
            {searchName ? `Aucune demande ne correspond à "${searchName}"` : 'Aucune demande de congé pour le moment'}
          </p>
        </div>
      )}

      {/* ✅ LEAVES CARDS */}
      {!loading && !error && getTotalItems() > 0 && (
        <>
          <Row className="g-4">
            {getPaginatedData().map((leave) => (
              <Col key={leave._id} lg={6} xl={4}>
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
                      background:
                        leave.status === 'approved'
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : leave.status === 'pending'
                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '16px 16px 0 0'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <User size={16} className="me-2" />
                      <span className="fw-semibold" style={{ fontSize: '15px' }}>
                        {leave.user?.firstName} {leave.user?.lastName}
                      </span>
                    </div>
                    {renderStatusBadge(leave.status)}
                  </Card.Header>

                  {/* ✅ CARD BODY */}
                  <Card.Body className="p-4">
                    <div className="leave-details mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <Calendar size={18} className="text-primary me-3" />
                        <div>
                          <div className="fw-semibold text-dark" style={{ fontSize: '14px' }}>
                            Du {formatDateShort(leave.startDate)} au {formatDateShort(leave.endDate)}
                          </div>
                          <small className="text-muted">{getDurationInDays(leave.startDate, leave.endDate)} jour(s)</small>
                        </div>
                      </div>

                      {leave.reason && (
                        <div className="d-flex align-items-start">
                          <MessageSquare size={18} className="text-info me-3 mt-1" />
                          <div>
                            <div className="text-muted" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                              {leave.reason}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ✅ ACTION BUTTON */}
                    {leave.status === 'pending' && (
                      <div className="mt-auto">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAccept(leave._id)}
                          disabled={acceptingId === leave._id}
                          className="w-100"
                          style={{ borderRadius: '12px', fontWeight: '500' }}
                        >
                          {acceptingId === leave._id ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Traitement...
                            </>
                          ) : (
                            <>
                              <FaCheck className="me-2" />
                              Accepter la demande
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Responsive Pagination Only */}
          {getTotalPages() > 1 && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
              <div className="d-flex align-items-center order-2 order-md-1">
                <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                  <span className="d-none d-sm-inline">Demandes par page:</span>
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
}

export default ManageLeave;
