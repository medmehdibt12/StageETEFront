/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Container, Spinner, Alert, Tabs, Tab, Table, Form, InputGroup, Button, Card, Row, Col, Badge } from 'react-bootstrap';
import { MdEmail } from 'react-icons/md';
import {
  FaGlobe,
  FaUserAlt,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUsers,
  FaMusic,
  FaFilter,
  FaTrash,
  FaMicrophone,
  FaRuler
} from 'react-icons/fa';
import { Search, Calendar, MapPin, Download, FileSpreadsheet } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { getConcerts, getFinalParticipantsForConcert, deleteFromFinalParticipants } from '../../../services/concert.service';

const FinalParticipants = () => {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(new Set());

  // Onglet actif parmi : "Toutes", "soprano", "alto", "ténor", "basse"
  const [activeTab, setActiveTab] = useState('Toutes');

  // ** État pour la recherche par nom **
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // Les valeurs "officielles" des pupitres
  const PUPITRE_VALUES = ['soprano', 'alto', 'ténor', 'basse'];

  // ✅ PUPITRE COLORS
  const getPupitreColor = (pupitre) => {
    const colors = {
      soprano: '#e11d48',
      alto: '#f59e0b',
      ténor: '#10b981',
      basse: '#3b82f6'
    };
    return colors[pupitre?.toLowerCase()] || '#6b7280';
  };

  // Charger la liste des concerts pour le sélecteur
  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const data = await getConcerts();
        const formatted = data.map((concert) => ({
          value: concert._id,
          label: `${concert.title} — ${new Date(concert.dateHeure).toLocaleDateString('fr-TN')}`,
          concert: concert
        }));
        setConcerts(formatted);
      } catch {
        setError('Erreur lors du chargement des concerts.');
      }
    };
    fetchConcerts();
  }, []);

  // Dès qu'un concert est sélectionné, charger ses participants
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedConcert) {
        setParticipants([]);
        return;
      }
      setLoading(true);
      try {
        const response = await getFinalParticipantsForConcert(selectedConcert.value);
        setParticipants(response.data || []);
        setError('');
        setActiveTab('Toutes');
        setCurrentPage(0);
      } catch {
        setError('Erreur lors du chargement des participants.');
        setParticipants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [selectedConcert]);

  // ✅ RESET PAGINATION WHEN TAB OR SEARCH CHANGES
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, searchTerm]);

  // ✅ NEW: Handle delete participant
  const handleDeleteParticipant = async (participant) => {
    const result = await Swal.fire({
      title: 'Supprimer Participant',
      text: `Supprimer ${participant.firstName} ${participant.lastName} de la liste des participants finaux ?`,
      html: `
        <p>Supprimer <strong>${participant.firstName} ${participant.lastName}</strong> de la liste des participants finaux ?</p>
        <div class="alert alert-warning mt-3">
          <small><strong>Note:</strong> Utilisez cette fonction si le choriste ne s'est pas présenté le jour du concert.</small>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      setDeleting((prev) => new Set([...prev, participant._id]));

      try {
        await deleteFromFinalParticipants(selectedConcert.value, participant._id, 'No-show on concert day');

        Swal.fire({
          title: 'Participant Supprimé',
          text: `${participant.firstName} ${participant.lastName} a été supprimé et marqué absent.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Reload participants
        const response = await getFinalParticipantsForConcert(selectedConcert.value);
        setParticipants(response.data || []);
      } catch (error) {
        Swal.fire('Erreur', 'Erreur lors de la suppression du participant.', 'error');
      } finally {
        setDeleting((prev) => {
          const newSet = new Set(prev);
          newSet.delete(participant._id);
          return newSet;
        });
      }
    }
  };

  // Grouper temporairement par pupitre pour calculer les totaux
  const countsByPupitre = PUPITRE_VALUES.reduce((acc, pup) => {
    acc[pup] = participants.filter((c) => c.pupitre?.toLowerCase() === pup.toLowerCase()).length;
    return acc;
  }, {});

  // Total de participants toutes catégories confondues
  const totalCount = participants.length;

  // ** Filtrer selon onglet + recherche par nom **
  const getFilteredList = () => {
    let filtered = [];
    if (activeTab === 'Toutes') {
      filtered = participants;
    } else {
      filtered = participants.filter((c) => c.pupitre?.toLowerCase() === activeTab.toLowerCase());
    }

    // Appliquer le filtre par nom si searchTerm n'est pas vide
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        return fullName.includes(term);
      });
    }

    return filtered;
  };

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const filteredParticipants = getFilteredList();
  const getTotalItems = () => filteredParticipants.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
    const start = currentPage * itemsPerPage;
    return filteredParticipants.slice(start, start + itemsPerPage);
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

  // ✅ UPDATED: Excel export function
  const handleExportExcel = () => {
    if (!selectedConcert || getTotalItems() === 0) return;

    // Prepare data for Excel
    const excelData = filteredParticipants.map((p, index) => ({
      '#': index + 1,
      Nom: p.lastName || '',
      Prénom: p.firstName || '',
      Email: p.email || '',
      Pupitre: p.pupitre ? p.pupitre.charAt(0).toUpperCase() + p.pupitre.slice(1) : '',
      Taille: p.height || 'Non spécifié'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 }, // #
      { wch: 20 }, // Nom
      { wch: 20 }, // Prénom
      { wch: 30 }, // Email
      { wch: 12 }, // Pupitre
      { wch: 15 } // Taille
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Participants Finaux');

    // Generate filename
    const concertTitle = selectedConcert.concert?.title || 'Concert';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Participants_Finaux_${concertTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <Container fluid className="py-2 py-md-4 px-2 px-md-3">
      {/* ✅ RESPONSIVE HEADER SECTION */}
      {/* <div className="mb-3 mb-md-4">
        <Row className="align-items-center">
          <Col>
            <h2 className="fw-bold text-dark mb-1 fs-3 fs-md-2">
              <FaUsers className="me-2 me-md-3 text-primary" />
              <span className="d-none d-md-inline">Participants Finaux (Validés)</span>
              <span className="d-md-none">Participants Finaux</span>
            </h2>
            <p className="text-muted mb-0 small d-none d-md-block">
              Consultez la liste des participants validés et confirmés pour chaque concert
            </p>
          </Col>
        </Row>
      </div> */}

      {/* ✅ RESPONSIVE CONCERT SELECTOR CARD */}
      <Card className="shadow-sm border-0 mb-3 mb-md-4" style={{ borderRadius: '12px' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center mb-2 mb-md-3">
                <FaMusic className="text-primary me-2" size={18} />
                <h5 className="mb-0 fw-semibold fs-6 fs-md-5">Sélectionner un concert</h5>
              </div>
              <Select
                options={concerts}
                value={selectedConcert}
                onChange={(val) => setSelectedConcert(val)}
                placeholder="Choisissez un concert..."
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    boxShadow: 'none',
                    minHeight: '44px',
                    fontSize: '14px',
                    '&:hover': { borderColor: '#3b82f6' },
                    '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' }
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    fontSize: '13px',
                    padding: '10px 14px'
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: '#9ca3af'
                  })
                }}
              />
            </Col>
            {selectedConcert && (
              <Col md={4} className="mt-3 mt-md-0">
                <Card className="bg-light border-0">
                  <Card.Body className="p-2 p-md-3">
                    <div className="d-flex align-items-center mb-2">
                      <Calendar size={14} className="text-info me-2" />
                      <small className="text-muted fw-semibold">Détails du concert</small>
                    </div>
                    <div className="small">
                      <div className="fw-semibold text-dark mb-1 text-truncate">{selectedConcert.concert?.title}</div>
                      <div className="d-flex align-items-center text-muted">
                        <MapPin size={12} className="me-1 flex-shrink-0" />
                        <span className="text-truncate">{selectedConcert.concert?.location}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* ✅ LOADING STATE */}
      {loading && (
        <div className="text-center py-4 py-md-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des participants...</p>
        </div>
      )}

      {/* ✅ ERROR STATE */}
      {error && (
        <Alert variant="danger" className="text-center border-0" style={{ borderRadius: '12px' }}>
          <Alert.Heading className="h6 mb-2">Erreur de chargement</Alert.Heading>
          {error}
        </Alert>
      )}

      {/* ✅ NO CONCERT SELECTED */}
      {!loading && !selectedConcert && (
        <div className="text-center py-4 py-md-5">
          <FaMusic size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucun concert sélectionné</h5>
          <p className="text-muted d-none d-md-block">Veuillez choisir un concert dans la liste ci-dessus</p>
        </div>
      )}

      {/* ✅ NO PARTICIPANTS */}
      {!loading && selectedConcert && participants.length === 0 && (
        <div className="text-center py-4 py-md-5">
          <FaUsers size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucun participant validé</h5>
          <p className="text-muted d-none d-md-block">Aucun participant n'a encore été validé pour ce concert</p>
        </div>
      )}

      {/* ✅ RESPONSIVE PARTICIPANTS SECTION */}
      {!loading && selectedConcert && participants.length > 0 && (
        <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
          <Card.Header className="bg-white border-0 pt-3 pt-md-4 px-3 px-md-4 pb-0">
            <Row className="align-items-center">
              <Col>
                <h5 className="fw-semibold mb-0 fs-6 fs-md-5">
                  <FaFilter className="text-primary me-2" />
                  <span className="d-none d-md-inline">Filtrer les participants validés</span>
                  <span className="d-md-none">Participants validés</span>
                </h5>
              </Col>
              <Col xs="auto">
                <div className="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
                  <Badge bg="success" className="fs-6 small">
                    {totalCount} validés
                  </Badge>
                  {/* ✅ RESPONSIVE: Excel export button */}
                  {selectedConcert && participants.length > 0 && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleExportExcel}
                      style={{ borderRadius: '10px', fontWeight: '500' }}
                      className="d-flex align-items-center"
                    >
                      <FileSpreadsheet size={14} className="me-1 me-md-2" />
                      <span className="d-none d-sm-inline">Exporter Excel</span>
                      <span className="d-sm-none">Excel</span>
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </Card.Header>

          <Card.Body className="p-3 p-md-4">
            {/* ✅ RESPONSIVE SEARCH BAR */}
            <Row className="mb-3 mb-md-4">
              <Col>
                <Form.Label className="fw-semibold mb-2 text-dark small">Rechercher un participant</Form.Label>
                <InputGroup>
                  <InputGroup.Text
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderColor: '#e5e7eb',
                      borderRadius: '10px 0 0 10px'
                    }}
                  >
                    <Search size={14} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Nom ou prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      borderColor: '#e5e7eb',
                      borderRadius: '0 10px 10px 0',
                      fontSize: '14px'
                    }}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* ✅ RESPONSIVE TABS WITH COUNTS */}
            <Tabs
              activeKey={activeTab}
              onSelect={(tabKey) => setActiveTab(tabKey)}
              className="mb-3 mb-md-4"
              style={{ borderBottom: '2px solid #f1f5f9' }}
            >
              <Tab
                eventKey="Toutes"
                title={
                  <span className="d-flex align-items-center">
                    <FaUsers className="me-1 me-md-2" size={12} />
                    <span className="d-none d-md-inline">Toutes les tessitures</span>
                    <span className="d-md-none">Toutes</span>
                    <Badge bg="secondary" className="ms-1 ms-md-2 small">
                      {totalCount}
                    </Badge>
                  </span>
                }
              />

              {PUPITRE_VALUES.map((pup) => (
                <Tab
                  key={pup}
                  eventKey={pup}
                  title={
                    <span className="d-flex align-items-center">
                      <span className="text-capitalize">{pup}</span>
                      <Badge bg="primary" className="ms-1 ms-md-2 small">
                        {countsByPupitre[pup]}
                      </Badge>
                    </span>
                  }
                />
              ))}
            </Tabs>

            {/* ✅ FILTERED RESULTS INFO */}
            {getTotalItems() !== totalCount && getTotalItems() > 0 && (
              <Alert variant="info" className="border-0 mb-3" style={{ borderRadius: '10px' }}>
                <small>
                  <strong>{getTotalItems()}</strong> résultat(s) trouvé(s)
                  {searchTerm && ` pour "${searchTerm}"`}
                  {activeTab !== 'Toutes' && ` dans la tessiture ${activeTab}`}
                </small>
              </Alert>
            )}

            {/* ✅ RESPONSIVE PARTICIPANTS TABLE */}
            {getTotalItems() > 0 ? (
              <>
                <div
                  className="table-responsive"
                  style={{
                    borderRadius: '10px',
                    overflow: 'auto',
                    maxWidth: '100%'
                  }}
                >
                  <Table className="mb-0 align-middle" bordered style={{ minWidth: '700px' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="py-2 py-md-3 px-2 px-md-4" style={{ fontWeight: '600', fontSize: '13px' }}>
                          #
                        </th>
                        <th className="py-2 py-md-3 px-2 px-md-4" style={{ fontWeight: '600', fontSize: '13px' }}>
                          Participant
                        </th>
                        <th className="py-2 py-md-3 px-2 px-md-4 d-none d-md-table-cell" style={{ fontWeight: '600', fontSize: '13px' }}>
                          Contact
                        </th>
                        <th className="py-2 py-md-3 px-2 px-md-4" style={{ fontWeight: '600', fontSize: '13px' }}>
                          Pupitre
                        </th>
                        <th className="py-2 py-md-3 px-2 px-md-4 " style={{ fontWeight: '600', fontSize: '13px' }}>
                          Taille(cm)
                        </th>
                        <th className="py-2 py-md-3 px-2 px-md-4" style={{ fontWeight: '600', fontSize: '13px' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData().map((choriste, index) => {
                        const isDeleting = deleting.has(choriste._id);

                        return (
                          <tr key={choriste._id}>
                            <td className="py-2 py-md-3 px-2 px-md-4">
                              <Badge bg="light" text="dark" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                                {getStartIndex() + index}
                              </Badge>
                            </td>
                            <td className="py-2 py-md-3 px-2 px-md-4">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: getPupitreColor(choriste.pupitre),
                                    color: 'white'
                                  }}
                                >
                                  <FaUserAlt size={12} />
                                </div>
                                <div className="min-w-0">
                                  <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '14px' }}>
                                    {choriste.firstName} {choriste.lastName}
                                  </div>
                                  {/* ✅ Show email on mobile under name */}
                                  <div className="d-md-none">
                                    <small className="text-muted text-truncate d-block" style={{ fontSize: '12px' }}>
                                      {choriste.email}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 py-md-3 px-2 px-md-4 d-none d-md-table-cell">
                              <div className="d-flex align-items-center">
                                <MdEmail className="me-2 text-primary flex-shrink-0" size={14} />
                                <span style={{ fontSize: '13px' }} className="text-truncate">
                                  {choriste.email}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 py-md-3 px-2 px-md-4">
                              <div className="d-flex align-items-center">
                                <FaMicrophone
                                  className="me-1 me-md-2 flex-shrink-0"
                                  size={12}
                                  style={{ color: getPupitreColor(choriste.pupitre) }}
                                />
                                <Badge
                                  style={{
                                    backgroundColor: getPupitreColor(choriste.pupitre),
                                    fontSize: '11px',
                                    fontWeight: '500'
                                  }}
                                >
                                  {choriste.pupitre ? choriste.pupitre.charAt(0).toUpperCase() + choriste.pupitre.slice(1) : 'N/A'}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-2 py-md-3 px-2 px-md-4">
                              <div className="d-flex align-items-center">
                                <FaRuler className="me-2 text-success flex-shrink-0" size={12} />
                                <span style={{ fontSize: '13px' }} className="text-truncate">
                                  {choriste.height || <em className="text-muted">Non spécifié</em>}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 py-md-3 px-2 px-md-4">
                              {isDeleting ? (
                                <Button variant="outline-secondary" size="sm" disabled style={{ borderRadius: '6px' }}>
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  <span className="d-none d-md-inline">Suppression...</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteParticipant(choriste)}
                                  style={{ borderRadius: '6px' }}
                                  title="Supprimer de la liste (marquer absent)"
                                >
                                  <FaTrash size={11} className="me-0 me-md-1" />
                                  <span className="d-none d-md-inline">Supprimer</span>
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* ✅ RESPONSIVE PAGINATION */}
                {getTotalPages() > 0 && (
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 mt-3 bg-light rounded gap-2">
                    <div className="d-flex align-items-center">
                      <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                        <span className="d-none d-md-inline">Participants par page:</span>
                        <span className="d-md-none">Par page:</span>
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

                    <div className="text-muted" style={{ fontSize: '13px' }}>
                      {getStartIndex()}-{getEndIndex()} sur {getTotalItems()}
                    </div>

                    <div className="d-flex align-items-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToFirstPage}
                        disabled={isFirstPage()}
                        className="me-1"
                        style={{ border: 'none', backgroundColor: 'transparent' }}
                      >
                        <FaAngleDoubleLeft size={12} />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={isFirstPage()}
                        className="me-2 me-md-3"
                        style={{ border: 'none', backgroundColor: 'transparent' }}
                      >
                        <FaChevronLeft size={12} />
                      </Button>
                      <span className="mx-2 mx-md-3 text-muted" style={{ fontSize: '13px' }}>
                        <span className="d-none d-md-inline">Page </span>
                        {currentPage + 1}
                        <span className="d-none d-md-inline"> sur {getTotalPages()}</span>
                      </span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={isLastPage()}
                        className="ms-2 ms-md-3 me-1"
                        style={{ border: 'none', backgroundColor: 'transparent' }}
                      >
                        <FaChevronRight size={12} />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={isLastPage()}
                        style={{ border: 'none', backgroundColor: 'transparent' }}
                      >
                        <FaAngleDoubleRight size={12} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 py-md-5">
                <Search size={48} className="text-muted mb-3" />
                <h6 className="text-muted">Aucun résultat trouvé</h6>
                <p className="text-muted mb-0 small">
                  {searchTerm ? `Aucun participant ne correspond à "${searchTerm}"` : `Aucun participant dans la tessiture ${activeTab}`}
                </p>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default FinalParticipants;
