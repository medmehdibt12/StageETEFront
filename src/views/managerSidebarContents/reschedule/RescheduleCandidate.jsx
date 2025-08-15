/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Spinner, Badge, InputGroup, Form } from 'react-bootstrap';
import {
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSearch,
  FaTimes as FaClear
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getSameDayRescheduleRequests, approveSameDayReschedule, rejectSameDayReschedule } from '../../../services/reschedule.service';

const RescheduleCandidate = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 🔍 Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Angular Material style pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const pageSizeOptions = [5, 10, 25, 50];

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getSameDayRescheduleRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      Swal.fire('Erreur', 'Impossible de charger les demandes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔍 Filter requests based on search term
  const getFilteredRequests = () => {
    if (!searchTerm.trim()) return requests;

    return requests.filter((request) => {
      const fullName = `${request.candidate.firstName} ${request.candidate.lastName}`.toLowerCase();
      const email = request.candidate.email.toLowerCase();
      const search = searchTerm.toLowerCase();

      return fullName.includes(search) || email.includes(search);
    });
  };

  // Handle approve with loading dialog
  const handleApprove = async (candidateId, candidateName) => {
    const result = await Swal.fire({
      title: 'Confirmer',
      text: `Approuver la demande de ${candidateName} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Approuver',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      // 🎯 Show loading dialog
      Swal.fire({
        title: 'Traitement en cours...',
        text: "Approbation et envoi de l'email de confirmation",
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        setProcessing(true);
        await approveSameDayReschedule(candidateId);

        // 🎯 Close loading and show success
        await Swal.fire({
          title: 'Approuvé!',
          text: `La demande de ${candidateName} a été approuvée et un email de confirmation a été envoyé.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        await loadData();
      } catch (error) {
        // 🎯 Close loading and show error
        Swal.fire('Erreur', "Erreur lors de l'approbation.", 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  // Handle reject with loading dialog
  const handleReject = async (candidateId, candidateName) => {
    const { value: reason } = await Swal.fire({
      title: 'Rejeter',
      input: 'textarea',
      inputLabel: 'Raison (optionnel)',
      inputPlaceholder: 'Créneau non disponible...',
      showCancelButton: true,
      confirmButtonText: 'Rejeter',
      cancelButtonText: 'Annuler'
    });

    if (reason !== undefined) {
      // 🎯 Show loading dialog
      Swal.fire({
        title: 'Traitement en cours...',
        text: "Rejet de la demande et envoi de l'email de notification",
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        setProcessing(true);
        await rejectSameDayReschedule(candidateId, reason);

        // 🎯 Close loading and show success
        await Swal.fire({
          title: 'Rejeté',
          text: `La demande de ${candidateName} a été rejetée et le candidat a été informé par email.`,
          icon: 'info',
          confirmButtonText: 'OK'
        });

        await loadData();
      } catch (error) {
        // 🎯 Close loading and show error
        Swal.fire('Erreur', 'Erreur lors du rejet.', 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  // 🔍 Updated pagination logic with filtered data
  const getTotalItems = () => getFilteredRequests().length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedRequests = () => {
    const filteredRequests = getFilteredRequests();
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  };

  // 🔍 Handle search change and reset pagination
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  // 🔍 Clear search
  const clearSearch = () => {
    setSearchTerm('');
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Container style={{ marginTop: '2rem' }}>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Demandes de Reprogrammation</h5>
          <Badge bg="primary" className="fs-6">
            {getTotalItems()} demande{getTotalItems() !== 1 ? 's' : ''}
            {searchTerm && ` (${requests.length} total)`}
          </Badge>
        </Card.Header>

        <Card.Body>
          {/* 🔍 Search Bar */}
          {/* 🔍 Search Bar */}
          <div className="mb-3 d-flex justify-content-start">
            <InputGroup style={{ maxWidth: '400px' }}>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Rechercher par nom ou email du candidat..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th>Candidat</th>
                    <th>Créneau actuel</th>
                    <th>Créneau demandé</th>
                    <th>Date demande</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedRequests().map((request) => (
                    <tr key={request.candidateId}>
                      <td>
                        <div>
                          <strong>
                            {request.candidate.firstName} {request.candidate.lastName}
                          </strong>
                          <br />
                          <small className="text-muted">{request.candidate.email}</small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="secondary">
                          {request.currentSlot?.startTime} - {request.currentSlot?.endTime}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="primary">
                          {request.requestedTime} -{' '}
                          {request.requestedTime
                            ? `${(parseInt(request.requestedTime.split(':')[0]) + 1).toString().padStart(2, '0')}:${request.requestedTime.split(':')[1]}`
                            : ''}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="warning" text="dark">
                          {formatDate(request.requestDate)}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() =>
                              handleApprove(request.candidateId, `${request.candidate.firstName} ${request.candidate.lastName}`)
                            }
                            disabled={processing}
                            title="Approuver"
                          >
                            <FaCheck />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() =>
                              handleReject(request.candidateId, `${request.candidate.firstName} ${request.candidate.lastName}`)
                            }
                            disabled={processing}
                            title="Rejeter"
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getTotalItems() === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        {searchTerm ? `Aucune demande trouvée pour "${searchTerm}"` : 'Aucune demande de reprogrammation.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              {getTotalItems() > 0 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                  <div className="d-flex align-items-center">
                    <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                      Demandes par page:
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
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RescheduleCandidate;
