/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Container, Button, Table, Badge, Form, Card, Row, Col, InputGroup, Spinner, Modal, Tabs, Tab, Alert } from 'react-bootstrap';
import {
  FaSearch,
  FaCalendarAlt,
  FaUserCheck,
  FaChevronDown,
  FaChevronUp,
  FaMusic,
  FaUser,
  FaQuoteLeft,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getMembershipSubmissions, sendTestDates, acceptMembership, refuseMembership } from '../../../services/accounts.service';
import { listAuditionParameters, generateAuditions } from '../../../services/auditions.service';
import './ManageMembership.css';

const ManageMembership = () => {
  const [pendingMemberships, setPendingMemberships] = useState([]);
  const [scheduledTestMemberships, setScheduledTestMemberships] = useState([]);
  const [filterTextPending, setFilterTextPending] = useState('');
  const [filterTextScheduled, setFilterTextScheduled] = useState('');
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(true);
  const [showTestDatesModal, setShowTestDatesModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [openDetails, setOpenDetails] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availableAuditions, setAvailableAuditions] = useState([]);
  const [selectedAuditionId, setSelectedAuditionId] = useState('');
  const [isLoadingAuditions, setIsLoadingAuditions] = useState(false);

  const fetchMemberships = async () => {
    setIsLoadingPending(true);
    setIsLoadingScheduled(true);

    try {
      // Fetch pending memberships
      const pendingData = await getMembershipSubmissions('Pending');
      setPendingMemberships(pendingData);

      // Fetch scheduled test memberships
      const scheduledData = await getMembershipSubmissions('TestScheduled');
      setScheduledTestMemberships(scheduledData);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de récupérer les candidatures.'
      });
    } finally {
      setIsLoadingPending(false);
      setIsLoadingScheduled(false);
    }
  };

  const fetchAvailableAuditions = async () => {
    setIsLoadingAuditions(true);
    try {
      const auditions = await listAuditionParameters();
      const now = new Date(); // Using the provided current date

      // Filter auditions based on criteria
      const filteredAuditions = auditions.filter((audition) => {
        const startDate = new Date(audition.startDate);
        return audition.candidateCount >= pendingMemberships.length && new Date(audition.startDate) >= now;
      });

      setAvailableAuditions(filteredAuditions);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Impossible de récupérer les paramètres d'audition."
      });
    } finally {
      setIsLoadingAuditions(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [refreshTrigger]);

  const toggleDetails = (id) => {
    setOpenDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAcceptAll = async () => {
    if (pendingMemberships.length === 0) {
      return Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Aucun candidat en attente.'
      });
    }

    await fetchAvailableAuditions();
    setSelectedAuditionId('');
    setShowTestDatesModal(true);
  };

  const handleAuditionSelect = (auditionId) => {
    setSelectedAuditionId(auditionId);
  };

  const submitAuditionSelection = async () => {
    if (!selectedAuditionId) {
      return Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: "Veuillez sélectionner un planning d'audition."
      });
    }

    try {
      Swal.fire({
        title: 'Génération du planning...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Just pass the selectedAuditionId - this matches your service implementation
      await generateAuditions(selectedAuditionId);

      setShowTestDatesModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Les candidats ont été programmés pour les auditions.'
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de programmer les auditions.'
      });
    }
  };

  const handleAcceptMember = async (id) => {
    Swal.fire({
      title: 'Accepter ce candidat?',
      text: 'Êtes-vous sûr de vouloir accepter ce candidat?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, accepter',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({ title: 'Acceptation en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          await acceptMembership(id);
          Swal.fire({
            icon: 'success',
            title: 'Candidat accepté',
            text: 'Le candidat a été accepté avec succès.'
          });
          setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "Impossible d'accepter le candidat."
          });
        }
      }
    });
  };

  const openRefuseModal = (id) => {
    setCurrentMemberId(id);
    setRefuseReason('');
    setShowRefuseModal(true);
  };

  const handleRefuseMember = async () => {
    if (!refuseReason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez fournir une raison de refus.'
      });
      return;
    }

    setShowRefuseModal(false);

    try {
      Swal.fire({ title: 'Refus en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await refuseMembership(currentMemberId, refuseReason);
      Swal.fire({
        icon: 'success',
        title: 'Candidat refusé',
        text: 'Le candidat a été refusé avec succès.'
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de refuser le candidat.'
      });
    }
  };

  // Filter memberships by full name
  const filteredPendingMemberships = pendingMemberships.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(filterTextPending.toLowerCase());
  });

  const filteredScheduledMemberships = scheduledTestMemberships.filter((m) => {
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    return fullName.includes(filterTextScheduled.toLowerCase());
  });

  const renderMembershipTable = (memberships, isLoading, filterText, setFilterText, tabType) => {
    return (
      <>
        <Row className="mb-3 align-items-center">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Rechercher par nom"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            {tabType === 'pending' && (
              <Button variant="primary" onClick={handleAcceptAll} disabled={memberships.length === 0}>
                <FaUserCheck className="me-2" />
                Accepter tout pour test
              </Button>
            )}
          </Col>
        </Row>

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement des candidatures...</p>
          </div>
        ) : memberships.length === 0 ? (
          <div className="empty-state p-5 text-center">
            <div className="empty-icon mb-3">📋</div>
            <h5>Aucune candidature {tabType === 'pending' ? 'en attente' : 'avec test programmé'}</h5>
            <p className="text-muted">
              {tabType === 'pending' ? 'Toutes les candidatures ont été traitées' : "Aucun test n'est programmé actuellement"}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover responsive className="membership-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Genre</th>
                  <th>Date de naissance</th>
                  <th>Nationalité</th>
                  <th>Détails</th>
                  {tabType === 'scheduled' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {memberships.map((member) => (
                  <React.Fragment key={member._id}>
                    <tr className={openDetails[member._id] ? 'active-row' : ''}>
                      <td className="fw-bold">
                        {member.firstName} {member.lastName}
                      </td>
                      <td>{member.email}</td>
                      <td>
                        <Badge bg={member.gender === 'Homme' ? 'info' : 'danger'} pill>
                          {member.gender}
                        </Badge>
                      </td>
                      <td>{new Date(member.birthDate).toLocaleDateString('fr-TN')}</td>
                      <td>{member.nationality}</td>
                      <td>
                        <Button
                          variant={openDetails[member._id] ? 'outline-danger' : 'outline-primary'}
                          size="sm"
                          className="details-toggle-btn"
                          onClick={() => toggleDetails(member._id)}
                        >
                          {openDetails[member._id] ? (
                            <>
                              Masquer <FaChevronUp className="ms-1" />
                            </>
                          ) : (
                            <>
                              Voir détails <FaChevronDown className="ms-1" />
                            </>
                          )}
                        </Button>
                      </td>
                      {tabType === 'scheduled' && (
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleAcceptMember(member._id)}
                              title="Accepter"
                            >
                              <FaCheck />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => openRefuseModal(member._id)} title="Refuser">
                              <FaTimes />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                    <tr className={openDetails[member._id] ? 'details-visible' : 'details-hidden'}>
                      <td colSpan={tabType === 'scheduled' ? 7 : 6} className="p-0">
                        {openDetails[member._id] && (
                          <div className="details-container">
                            <div className="details-header">
                              <h5 className="mb-0">Détails du candidat</h5>
                            </div>

                            <div className="details-content">
                              <Row>
                                <Col lg={6}>
                                  <div className="details-section">
                                    <div className="details-section-header">
                                      <FaUser className="icon" />
                                      <h6>Informations personnelles</h6>
                                    </div>
                                    <div className="details-section-content">
                                      <Row>
                                        <Col sm={6}>
                                          <div className="info-item">
                                            <span className="info-label">Taille</span>
                                            <span className="info-value">{member.height} cm</span>
                                          </div>
                                        </Col>
                                        <Col sm={6}>
                                          <div className="info-item">
                                            <span className="info-label">Téléphone</span>
                                            <span className="info-value">{member.phone}</span>
                                          </div>
                                        </Col>
                                      </Row>
                                      <div className="info-item">
                                        <span className="info-label">Situation professionnelle</span>
                                        <span className="info-value">{member.professionalSituation}</span>
                                      </div>
                                    </div>
                                  </div>
                                </Col>

                                <Col lg={6}>
                                  <div className="details-section">
                                    <div className="details-section-header">
                                      <FaMusic className="icon" />
                                      <h6>Informations musicales</h6>
                                    </div>
                                    <div className="details-section-content">
                                      <div className="info-item">
                                        <span className="info-label">Connaissances musicales</span>
                                        <Badge bg={member.hasMusicalKnowledge ? 'success' : 'secondary'} className="status-badge">
                                          {member.hasMusicalKnowledge ? 'Oui' : 'Non'}
                                        </Badge>
                                      </div>

                                      {member.hasMusicalKnowledge && (
                                        <div className="info-item">
                                          <span className="info-label">Expérience</span>
                                          <span className="info-value experience-text">{member.musicalExperience || '—'}</span>
                                        </div>
                                      )}

                                      <div className="info-item">
                                        <span className="info-label">Active dans autre chorale</span>
                                        <Badge bg={member.isActiveInOtherChoir ? 'warning' : 'secondary'} className="status-badge">
                                          {member.isActiveInOtherChoir ? 'Oui' : 'Non'}
                                        </Badge>
                                      </div>

                                      {member.isActiveInOtherChoir && (
                                        <div className="info-item">
                                          <span className="info-label">Chorale</span>
                                          <span className="info-value">{member.otherChoir || '—'}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Col>
                              </Row>

                              {member.motivation && (
                                <div className="motivation-section">
                                  <div className="motivation-header">
                                    <FaQuoteLeft className="quote-icon" />
                                    <h6>Motivation</h6>
                                  </div>
                                  <div className="motivation-content">
                                    <p>{member.motivation}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </>
    );
  };

  // New Test Dates Modal with Audition Selection
  const renderTestDatesModal = () => (
    <Modal show={showTestDatesModal} onHide={() => setShowTestDatesModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Sélectionner un planning d'audition</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoadingAuditions ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement des plannings disponibles...</p>
          </div>
        ) : availableAuditions.length === 0 ? (
          <Alert variant="warning">
            <Alert.Heading>Aucun planning disponible</Alert.Heading>
            <p>
              Il n'y a pas de planning d'audition qui peut accueillir {pendingMemberships.length} candidat
              {pendingMemberships.length > 1 ? 's' : ''} ou les dates sont déjà passées.
            </p>
            <hr />
            <p className="mb-0">Date actuelle: {new Date('2025-07-15 15:39:26').toLocaleString('fr-FR')}</p>
          </Alert>
        ) : (
          <>
            {/* <Alert variant="info" className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  Nombre de candidats en attente: <strong>{pendingMemberships.length}</strong>
                </span>
                <small>Date actuelle: {new Date('2025-07-15 15:39:26').toLocaleString('fr-FR')}</small>
              </div>
            </Alert> */}
            <Table hover>
              <thead>
                <tr>
                  <th></th>
                  <th>Période</th>
                  <th>Horaires</th>
                  <th>Capacité</th>
                  <th>Durée/Pause</th>
                </tr>
              </thead>
              <tbody>
                {availableAuditions.map((audition) => (
                  <tr
                    key={audition._id}
                    className={selectedAuditionId === audition._id ? 'table-primary' : ''}
                    onClick={() => handleAuditionSelect(audition._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <Form.Check
                        type="radio"
                        checked={selectedAuditionId === audition._id}
                        onChange={() => handleAuditionSelect(audition._id)}
                      />
                    </td>
                    <td>
                      {new Date(audition.startDate).toLocaleDateString('fr-FR')} → {new Date(audition.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      {audition.sessionStartTime} - {audition.sessionEndTime}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {audition.candidateCount} places
                        {audition.candidateCount === pendingMemberships.length && (
                          <Badge bg="warning" className="ms-2">
                            Capacité exacte
                          </Badge>
                        )}
                        {audition.candidateCount > pendingMemberships.length && (
                          <Badge bg="success" className="ms-2">
                            +{audition.candidateCount - pendingMemberships.length} places
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      {audition.slotDurationMinutes}min / {audition.breakDurationMinutes}min
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowTestDatesModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={submitAuditionSelection} disabled={!selectedAuditionId || isLoadingAuditions}>
          Confirmer la sélection
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <Container className="membership-container">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="text-white d-flex justify-content-between align-items-center">
          <div>
            <Badge bg="light" text="primary" pill className="me-2">
              En attente: {pendingMemberships.length}
            </Badge>
            <Badge bg="light" text="success" pill>
              Tests programmés: {scheduledTestMemberships.length}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 nav-tabs-custom">
            <Tab
              eventKey="pending"
              title={
                <span>
                  <Badge bg="primary" pill className="me-2">
                    {pendingMemberships.length}
                  </Badge>
                  En attente
                </span>
              }
            >
              {renderMembershipTable(filteredPendingMemberships, isLoadingPending, filterTextPending, setFilterTextPending, 'pending')}
            </Tab>

            <Tab
              eventKey="scheduled"
              title={
                <span>
                  <Badge bg="success" pill className="me-2">
                    {scheduledTestMemberships.length}
                  </Badge>
                  Tests programmés
                </span>
              }
            >
              {renderMembershipTable(
                filteredScheduledMemberships,
                isLoadingScheduled,
                filterTextScheduled,
                setFilterTextScheduled,
                'scheduled'
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Test Dates Modal */}
      {renderTestDatesModal()}

      {/* Refuse Modal */}
      <Modal show={showRefuseModal} onHide={() => setShowRefuseModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Refuser le candidat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Motif de refus <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Veuillez indiquer la raison du refus..."
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
              />
              <Form.Text className="text-muted">Cette raison sera communiquée au candidat.</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRefuseModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleRefuseMember}>
            Refuser le candidat
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManageMembership;
