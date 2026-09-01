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
  FaTimes as FaClear,
  FaCalendarPlus
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  getAllRescheduleRequests,
  approveSameDayReschedule,
  rejectSameDayReschedule,
  acceptDifferentDayReschedule,
  rejectDifferentDayReschedule
} from '../../../services/reschedule.service';

const RescheduleCandidate = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  // 🔍 Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Angular Material style pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // ✅ Fusionne les deux types de demandes (même jour / jour différent) en une seule liste,
  // avec un champ "type" pour les distinguer à l'affichage et dans les actions possibles.
  const normalizeRequests = (response) => {
    const sameDay = (response.sameDayRequests || []).map((r) => ({
      ...r,
      type: 'sameDay'
    }));
    const differentDay = (response.differentDayRequests || []).map((r) => ({
      ...r,
      type: 'differentDay'
    }));
    // Les plus récentes en premier
    return [...sameDay, ...differentDay].sort(
      (a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0)
    );
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getAllRescheduleRequests();
      setRequests(normalizeRequests(response));
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

  // Handle approve with loading dialog (uniquement pour les demandes "même jour")
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

        // ✅ Retrait immédiat de la ligne, sans attendre le re-fetch complet
        setRequests((prev) => prev.filter((r) => r.candidateId !== candidateId));

        await Swal.fire({
          title: 'Approuvé!',
          text: `La demande de ${candidateName} a été approuvée et un email de confirmation a été envoyé.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        loadData(); // resynchronisation en arrière-plan, sans bloquer l'UI
      } catch (error) {
        Swal.fire('Erreur', "Erreur lors de l'approbation.", 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  // Handle reject with loading dialog (uniquement pour les demandes "même jour")
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

        setRequests((prev) => prev.filter((r) => r.candidateId !== candidateId));

        await Swal.fire({
          title: 'Rejeté',
          text: `La demande de ${candidateName} a été rejetée et le candidat a été informé par email.`,
          icon: 'info',
          confirmButtonText: 'OK'
        });

        loadData();
      } catch (error) {
        Swal.fire('Erreur', 'Erreur lors du rejet.', 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  // ✅ Accepter une demande "jour différent" : le candidat reste en liste d'attente
  const handleAcceptDifferentDay = async (candidateId, candidateName) => {
    const result = await Swal.fire({
      title: 'Confirmer',
      text: `Accepter la demande de ${candidateName} ? Il restera en liste d'attente pour une nouvelle date.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Accepter',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Traitement en cours...',
        text: 'Envoi de la confirmation par email',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        setProcessing(true);
        await acceptDifferentDayReschedule(candidateId);

        setRequests((prev) => prev.filter((r) => r.candidateId !== candidateId));

        await Swal.fire({
          title: 'Accepté !',
          text: `${candidateName} reste en liste d'attente et a été notifié(e) par email.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
        loadData();
      } catch (error) {
        Swal.fire('Erreur', "Erreur lors de l'acceptation.", 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  // ✅ Refuser une demande "jour différent" : aucune date compatible, fin de la candidature
  const handleRejectDifferentDay = async (candidateId, candidateName) => {
    const { value: reason } = await Swal.fire({
      title: 'Refuser',
      input: 'textarea',
      inputLabel: 'Raison (optionnel)',
      inputPlaceholder: 'Aucune date compatible pour cette session...',
      showCancelButton: true,
      confirmButtonText: 'Refuser',
      cancelButtonText: 'Annuler'
    });

    if (reason !== undefined) {
      Swal.fire({
        title: 'Traitement en cours...',
        text: "Envoi de l'email de refus",
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        setProcessing(true);
        await rejectDifferentDayReschedule(candidateId, reason);

        // ✅ C'est ici que la ligne "fatiha mahjoub" doit disparaître immédiatement
        setRequests((prev) => prev.filter((r) => r.candidateId !== candidateId));

        await Swal.fire({
          title: 'Refusé',
          text: `${candidateName} a été notifié(e) par email.`,
          icon: 'info',
          confirmButtonText: 'OK'
        });
        loadData();
      } catch (error) {
        Swal.fire('Erreur', 'Erreur lors du refus.', 'error');
      } finally {
        setProcessing(false);
      }
    }
  };

  // Bouton complémentaire : programmer manuellement dès maintenant (optionnel, en plus d'Accepter/Refuser)
  const handleGoToManualAssign = () => {
    navigate('/manager/manage-auditions');
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
    setCurrentPage(0);
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
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
                    <th>Type</th>
                    <th>Candidat</th>
                    <th>Ancien créneau</th>
                    <th>Créneau demandé</th>
                    <th>Motif</th>
                    <th>Date demande</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedRequests().map((request) => (
                    <tr key={request.candidateId}>
                      {/* ✅ Badge distinguant les deux types de demande */}
                      <td>
                        <Badge bg={request.type === 'sameDay' ? 'warning' : 'info'} text="dark">
                          {request.type === 'sameDay' ? 'Même jour' : 'Jour différent'}
                        </Badge>
                      </td>
                      <td>
                        <div>
                          <strong>
                            {request.candidate.firstName} {request.candidate.lastName}
                          </strong>
                          <br />
                          <small className="text-muted">{request.candidate.email}</small>
                        </div>
                      </td>
                      {/* ✅ Ancien créneau — vient de previousSlotDate/StartTime/EndTime (archivé côté backend) */}
                      <td>
                        {request.currentSlot ? (
                          <Badge bg="secondary">
                            {formatDate(request.currentSlot.date)} · {request.currentSlot.startTime} - {request.currentSlot.endTime}
                          </Badge>
                        ) : (
                          <span className="text-muted small">Non renseigné</span>
                        )}
                      </td>
                      {/* ✅ Créneau demandé — uniquement pertinent pour "même jour" */}
                      <td>
                        {request.type === 'sameDay' ? (
                          <Badge bg="primary">
                            {request.requestedTime} - {request.requestedEndTime || ''}
                          </Badge>
                        ) : (
                          <span className="text-muted small">Jour à redéfinir</span>
                        )}
                      </td>
                      {/* ✅ Motif donné par le candidat, s'il en a précisé un */}
                      <td>
                        {request.rescheduleReason ? (
                          <span className="fst-italic small">"{request.rescheduleReason}"</span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {formatDate(request.requestDate)}
                        </Badge>
                      </td>
                      {/* ✅ Actions différentes selon le type */}
                      <td>
                        {request.type === 'sameDay' ? (
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
                        ) : (
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() =>
                                handleAcceptDifferentDay(request.candidateId, `${request.candidate.firstName} ${request.candidate.lastName}`)
                              }
                              disabled={processing}
                              title="Accepter — reste en liste d'attente"
                            >
                              <FaCheck />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() =>
                                handleRejectDifferentDay(request.candidateId, `${request.candidate.firstName} ${request.candidate.lastName}`)
                              }
                              disabled={processing}
                              title="Refuser — aucune date compatible"
                            >
                              <FaTimes />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={handleGoToManualAssign}
                              title="Programmer manuellement dès maintenant"
                            >
                              <FaCalendarPlus />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {getTotalItems() === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        {searchTerm ? `Aucune demande trouvée pour "${searchTerm}"` : 'Aucune demande de reprogrammation.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              {getTotalPages() > 0 && (
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
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RescheduleCandidate;
