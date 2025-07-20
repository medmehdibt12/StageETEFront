/* eslint-disable react/prop-types */
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
import Select from 'react-select';
import Swal from 'sweetalert2';
import { getMembershipSubmissions, acceptMembership, refuseMembership } from '../../../services/accounts.service';
import { listAuditionParameters, generateAuditions } from '../../../services/auditions.service';
import './ManageMembership.css';

const ManageMembership = () => {
  const [pendingMemberships, setPendingMemberships] = useState([]);
  const [scheduledTestMemberships, setScheduledTestMemberships] = useState([]);
  const [filterTextPending, setFilterTextPending] = useState('');
  const [filterTextScheduled, setFilterTextScheduled] = useState('');
  const [alphabeticFilter, setAlphabeticFilter] = useState(null);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
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

  // Create the alphabetic filter options
  const alphabeticOptions = [
    { value: '', label: 'Tous les candidats' },
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
      value: letter,
      label: `Prénoms commençant par "${letter}"`
    }))
  ];

  // Custom styles for the Select component
  const alphabeticSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '42px',
      borderRadius: '8px',
      border: state.isFocused ? '2px solid #007bff' : '1px solid #e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
      '&:hover': {
        borderColor: '#007bff'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
      color: state.isSelected ? 'white' : '#212529',
      padding: '10px 15px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: state.isSelected ? '#007bff' : '#e9ecef'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d',
      fontSize: '0.9rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#212529',
      fontSize: '0.9rem'
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e2e8f0'
    })
  };

  // Smart sortable header component
  const SortableHeader = ({ field, children, currentSort, direction, onSort }) => (
    <th
      onClick={() => onSort(field)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        padding: '12px 8px'
      }}
      className="sortable-header"
      onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
      onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
    >
      <div className="d-flex align-items-center justify-content-between">
        <span style={{ fontWeight: '600' }}>{children}</span>
        <span className="sort-indicator" style={{ fontSize: '12px', marginLeft: '8px' }}>
          {currentSort === field ? (
            <span style={{ color: '#007bff' }}>{direction === 'asc' ? '▲' : '▼'}</span>
          ) : (
            <span style={{ opacity: 0.4, color: '#6c757d' }}>⇅</span>
          )}
        </span>
      </div>
    </th>
  );

  // Sort handler
  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  // Simplified filtering with sorting (only name and height)
  const getFilteredMemberships = (memberships, filterText, sortField, sortDirection, alphabeticFilter) => {
    let filtered = [...memberships];

    // Apply text filter
    if (filterText) {
      filtered = filtered.filter((m) => {
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        const email = m.email.toLowerCase();
        const nationality = m.nationality?.toLowerCase() || '';
        const searchText = filterText.toLowerCase();

        return fullName.includes(searchText) || email.includes(searchText) || nationality.includes(searchText);
      });
    }

    // Apply alphabetic filter
    if (alphabeticFilter) {
      filtered = filtered.filter((member) => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        return fullName.startsWith(alphabeticFilter.toLowerCase());
      });
    }

    // Apply sorting - SIMPLIFIED VERSION (only name and height)
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal, bVal;

        switch (sortField) {
          case 'name':
            aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
            bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
            break;
          case 'height':
            aVal = parseInt(a.height) || 0;
            bVal = parseInt(b.height) || 0;
            break;
          default:
            return 0;
        }

        // Handle different data types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        const result = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? result : -result;
      });
    }

    return filtered;
  };

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
      setAvailableAuditions(auditions); // Show ALL auditions, no filtering
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
    setOpenDetails((prev) => {
      // If clicking on already open details, close it
      if (prev[id]) {
        return {};
      }
      // Otherwise, close all and open only the clicked one
      return { [id]: true };
    });
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

      // ✅ Pass just the selectedAuditionId
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

  const renderMembershipTable = (memberships, isLoading, filterText, setFilterText, tabType) => {
    // Get filtered and sorted memberships
    const filteredMemberships = getFilteredMemberships(memberships, filterText, sortField, sortDirection, alphabeticFilter?.value || '');

    return (
      <>
        <Row className="mb-3 align-items-center">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Rechercher par prénom, taille..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </InputGroup>
          </Col>

          <Col md={4}>
            <Select
              value={alphabeticFilter}
              onChange={setAlphabeticFilter}
              options={alphabeticOptions}
              placeholder="Filtrer par première lettre"
              isClearable={true}
              isSearchable={false}
              styles={alphabeticSelectStyles}
              className="alphabetic-select"
              classNamePrefix="alphabetic-select"
            />
          </Col>

          <Col md={4} className="text-md-end mt-3 mt-md-0 d-flex justify-content-end gap-2">
            {(sortField || alphabeticFilter) && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSortField('');
                  setSortDirection('asc');
                  setAlphabeticFilter(null);
                }}
                title="Réinitialiser tous les filtres"
              >
                ↻ Reset
              </Button>
            )}
            {tabType === 'pending' && (
              <Button variant="primary" onClick={handleAcceptAll} disabled={memberships.length === 0}>
                <FaUserCheck className="me-2" />
                Accepter tout pour test
              </Button>
            )}
          </Col>
        </Row>

        {/* Active filters info - SIMPLIFIED */}
        {(sortField || alphabeticFilter) && (
          <Alert variant="info" className="py-2 mb-3">
            <small>
              {alphabeticFilter && (
                <span>
                  Filtre: <strong>{alphabeticFilter.label}</strong>
                </span>
              )}
              {alphabeticFilter && sortField && ' • '}
              {sortField && (
                <span>
                  Trié par:{' '}
                  <strong>
                    {sortField === 'name' && 'Prénom'}
                    {sortField === 'height' && 'Taille'}
                  </strong>{' '}
                  ({sortDirection === 'asc' ? 'Croissant' : 'Décroissant'})
                </span>
              )}
            </small>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Chargement des candidatures...</p>
          </div>
        ) : filteredMemberships.length === 0 ? (
          <div className="empty-state p-5 text-center">
            <div className="empty-icon mb-3">📋</div>
            <h5>Aucune candidature {tabType === 'pending' ? 'en attente' : 'avec test programmé'}</h5>
            <p className="text-muted">
              {filterText || alphabeticFilter
                ? 'Aucun résultat pour ces filtres'
                : tabType === 'pending'
                  ? 'Toutes les candidatures ont été traitées'
                  : "Aucun test n'est programmé actuellement"}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table bordered responsive className="membership-table" style={{ backgroundColor: 'white' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <SortableHeader field="name" currentSort={sortField} direction={sortDirection} onSort={handleSort}>
                    Prénom et Nom
                  </SortableHeader>
                  <SortableHeader field="height" currentSort={sortField} direction={sortDirection} onSort={handleSort}>
                    Taille
                  </SortableHeader>
                  <th style={{ fontWeight: '600', padding: '12px 8px' }}>Genre</th>
                  <th style={{ fontWeight: '600', padding: '12px 8px' }}>Date de naissance</th>
                  <th style={{ fontWeight: '600', padding: '12px 8px' }}>Connaissances musicales</th>
                  <th style={{ fontWeight: '600', padding: '12px 8px' }}>Active dans autre chœur</th>
                  <th style={{ fontWeight: '600', padding: '12px 8px' }}>Détails</th>
                  {tabType === 'scheduled' && <th style={{ fontWeight: '600', padding: '12px 8px' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map((member) => (
                  <React.Fragment key={member._id}>
                    <tr className={openDetails[member._id] ? 'active-row' : ''} style={{ transition: 'all 0.2s ease' }}>
                      <td className="fw-bold" style={{ padding: '12px 8px' }}>
                        {member.firstName} {member.lastName}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{member.height} cm</td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge bg={member.gender === 'Homme' ? 'info' : 'danger'} pill>
                          {member.gender}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{new Date(member.birthDate).toLocaleDateString('fr-TN')}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge bg={member.hasMusicalKnowledge ? 'warning' : 'secondary'} className="status-badge">
                          {member.hasMusicalKnowledge ? 'Oui' : 'Non'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge bg={member.isActiveInOtherChoir ? 'warning' : 'secondary'} className="status-badge">
                          {member.isActiveInOtherChoir ? 'Oui' : 'Non'}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
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
                        <td style={{ padding: '12px 8px' }}>
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
                      <td colSpan={tabType === 'scheduled' ? 8 : 7} className="p-0">
                        {openDetails[member._id] && (
                          <div className="details-container">
                            <div className="details-header">
                              <h5 className="mb-0">Détails du candidat</h5>
                            </div>

                            <div className="details-content">
                              <Row>
                                <Col lg={4}>
                                  <div className="details-section">
                                    <div className="details-section-header">
                                      <FaUser className="icon" />
                                      <h6>Informations personnelles</h6>
                                    </div>
                                    <div className="details-section-content">
                                      <div className="info-item">
                                        <span className="info-label">Email</span>
                                        <span className="info-value">{member.email}</span>
                                      </div>
                                      <div className="info-item">
                                        <span className="info-label">Situation professionnelle</span>
                                        <span className="info-value">{member.professionalSituation}</span>
                                      </div>
                                      <div className="info-item">
                                        <span className="info-label">Téléphone</span>
                                        <span className="info-value">
                                          {member.phoneCountryCode} {member.phone}
                                        </span>
                                      </div>
                                      <div className="info-item">
                                        <span className="info-label">Nationalité</span>
                                        <span className="info-value">{member.nationality}</span>
                                      </div>
                                    </div>
                                  </div>
                                </Col>

                                <Col lg={4}>
                                  <div className="details-section">
                                    <div className="details-section-header">
                                      <FaMusic className="icon" />
                                      <h6>Informations musicales</h6>
                                    </div>
                                    <div className="details-section-content">
                                      <div className="info-item">
                                        <span className="info-label">Connaissances musicales</span>
                                        <Badge bg={member.hasMusicalKnowledge ? 'warning' : 'secondary'} className="status-badge">
                                          {member.hasMusicalKnowledge ? 'Oui' : 'Non'}
                                        </Badge>
                                      </div>

                                      {member.hasMusicalKnowledge && (
                                        <div className="info-item">
                                          <span className="info-label">Expérience musicale</span>
                                          <span className="info-value experience-text">{member.musicalExperience || '—'}</span>
                                        </div>
                                      )}

                                      <div className="info-item">
                                        <span className="info-label">Active dans autre chœur</span>
                                        <Badge bg={member.isActiveInOtherChoir ? 'warning' : 'secondary'} className="status-badge">
                                          {member.isActiveInOtherChoir ? 'Oui' : 'Non'}
                                        </Badge>
                                      </div>

                                      {member.isActiveInOtherChoir && (
                                        <div className="info-item">
                                          <span className="info-label">Nom du ou des chœur(s)</span>
                                          <span className="info-value">{member.otherChoir || '—'}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Col>

                                <Col lg={4}>
                                  <div className="details-section">
                                    <div className="details-section-header">
                                      <FaUserCheck className="icon" />
                                      <h6>Parrainage</h6>
                                    </div>
                                    <div className="details-section-content">
                                      <div className="info-item">
                                        <span className="info-label">Statut</span>
                                        <Badge bg={member.isSponsored ? 'success' : 'secondary'} className="status-badge">
                                          {member.isSponsored ? 'Parrainé' : 'Non parrainé'}
                                        </Badge>
                                      </div>
                                      {member.isSponsored && member.sponsorName && (
                                        <div className="info-item">
                                          <span className="info-label">Nom du parrain</span>
                                          <span className="info-value">{member.sponsorName}</span>
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

            {/* Results Summary */}
            {/* <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Affichage de {filteredMemberships.length} sur {memberships.length} candidat{memberships.length > 1 ? 's' : ''}
              </small>
              {filteredMemberships.length > 0 && <small className="text-muted">Cliquez sur "Nom" ou "Taille" pour trier</small>}
            </div> */}
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
            <p className="mb-0">Date actuelle: {new Date().toLocaleString('fr-FR')}</p>
          </Alert>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>Période</th>
                    <th>Horaires</th>
                    <th>Capacité</th>
                    <th>Pause</th>
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
                        {new Date(audition.startDate).toLocaleDateString('fr-FR')} →{' '}
                        {new Date(audition.endDate).toLocaleDateString('fr-FR')}
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
                      <td>{audition.debutPause && audition.finPause ? `${audition.debutPause} - ${audition.finPause}` : 'Aucune pause'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
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
              {renderMembershipTable(pendingMemberships, isLoadingPending, filterTextPending, setFilterTextPending, 'pending')}
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
                scheduledTestMemberships,
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
