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
  FaFilter
} from 'react-icons/fa';
import { Search, Calendar, MapPin, Download } from 'lucide-react';

import { getConcerts, getFinalParticipantsForConcert } from '../../../services/concert.service';

const FinalParticipants = () => {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Onglet actif parmi : "Toutes", "soprano", "alto", "ténor", "basse"
  const [activeTab, setActiveTab] = useState('Toutes');

  // ** État pour la recherche par nom **
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const pageSizeOptions = [5, 10, 25, 50];

  // Les valeurs "officielles" des pupitres
  const PUPITRE_VALUES = ['soprano', 'alto', 'ténor', 'basse'];

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
        const data = await getFinalParticipantsForConcert(selectedConcert.value);
        setParticipants(data);
        setError('');
        // Remettre l'onglet sur "Toutes" à chaque sélection de concert
        setActiveTab('Toutes');
        setCurrentPage(0); // ✅ Reset pagination
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

  // ✅ EXPORT FUNCTION
  const handleExport = () => {
    if (!selectedConcert || getTotalItems() === 0) return;

    const csvContent = [
      ['Nom', 'Prénom', 'Email', 'Pupitre', 'Nationalité'],
      ...getPaginatedData().map((p) => [p.lastName, p.firstName, p.email, p.pupitre || '-', p.nationality || '-'])
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants_${selectedConcert.label.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container fluid className="py-4" style={{ maxWidth: '1400px' }}>
      {/* ✅ HEADER SECTION */}
      <div className="mb-4">
        <Row className="align-items-center">
          <Col>
            <h2 className="fw-bold text-dark mb-1">
              <FaUsers className="me-3 text-primary" />
              Participants Finaux
            </h2>
            <p className="text-muted mb-0">Consultez la liste des participants confirmés pour chaque concert</p>
          </Col>
          {selectedConcert && participants.length > 0 && (
            <Col xs="auto">
              <Button variant="outline-primary" size="sm" onClick={handleExport} style={{ borderRadius: '12px', fontWeight: '500' }}>
                <Download size={16} className="me-2" />
                Exporter
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* ✅ CONCERT SELECTOR CARD */}
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center mb-3">
                <FaMusic className="text-primary me-2" size={20} />
                <h5 className="mb-0 fw-semibold">Sélectionner un concert</h5>
              </div>
              <Select
                options={concerts}
                value={selectedConcert}
                onChange={(val) => setSelectedConcert(val)}
                placeholder="Choisissez un concert dans la liste..."
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    boxShadow: 'none',
                    minHeight: '48px',
                    fontSize: '15px',
                    '&:hover': { borderColor: '#3b82f6' },
                    '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' }
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    fontSize: '14px',
                    padding: '12px 16px'
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: '#9ca3af'
                  })
                }}
              />
            </Col>
            {selectedConcert && (
              <Col md={4}>
                <Card className="bg-light border-0">
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center mb-2">
                      <Calendar size={16} className="text-info me-2" />
                      <small className="text-muted fw-semibold">Détails du concert</small>
                    </div>
                    <div className="small">
                      <div className="fw-semibold text-dark mb-1">{selectedConcert.concert?.title}</div>
                      <div className="d-flex align-items-center text-muted">
                        <MapPin size={12} className="me-1" />
                        {selectedConcert.concert?.location}
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
        <div className="text-center py-5">
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
        <div className="text-center py-5">
          <FaMusic size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucun concert sélectionné</h5>
          <p className="text-muted">Veuillez choisir un concert dans la liste ci-dessus</p>
        </div>
      )}

      {/* ✅ NO PARTICIPANTS */}
      {!loading && selectedConcert && participants.length === 0 && (
        <div className="text-center py-5">
          <FaUsers size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucun participant</h5>
          <p className="text-muted">Aucun participant confirmé pour ce concert</p>
        </div>
      )}

      {/* ✅ PARTICIPANTS SECTION */}
      {!loading && selectedConcert && participants.length > 0 && (
        <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
          <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
            <Row className="align-items-center">
              <Col>
                <h5 className="fw-semibold mb-0">
                  <FaFilter className="text-primary me-2" />
                  Filtrer les participants
                </h5>
              </Col>
              <Col xs="auto">
                <Badge bg="primary" className="fs-6">
                  {totalCount} participants au total
                </Badge>
              </Col>
            </Row>
          </Card.Header>

          <Card.Body className="p-4">
            {/* ✅ SEARCH BAR */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Label className="fw-semibold mb-2 text-dark">Rechercher un participant</Form.Label>
                <InputGroup>
                  <InputGroup.Text
                    style={{
                      backgroundColor: '#f8f9fa',
                      borderColor: '#e5e7eb',
                      borderRadius: '12px 0 0 12px'
                    }}
                  >
                    <Search size={16} className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Tapez le nom ou prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      borderColor: '#e5e7eb',
                      borderRadius: '0 12px 12px 0',
                      fontSize: '14px'
                    }}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* ✅ TABS WITH COUNTS */}
            <Tabs
              activeKey={activeTab}
              onSelect={(tabKey) => setActiveTab(tabKey)}
              className="mb-4"
              style={{ borderBottom: '2px solid #f1f5f9' }}
            >
              <Tab
                eventKey="Toutes"
                title={
                  <span className="d-flex align-items-center">
                    <FaUsers className="me-2" size={14} />
                    Toutes les tessitures
                    <Badge bg="secondary" className="ms-2">
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
                      {pup.charAt(0).toUpperCase() + pup.slice(1)}
                      <Badge bg="primary" className="ms-2">
                        {countsByPupitre[pup]}
                      </Badge>
                    </span>
                  }
                />
              ))}
            </Tabs>

            {/* ✅ FILTERED RESULTS INFO */}
            {getTotalItems() !== totalCount && getTotalItems() > 0 && (
              <Alert variant="info" className="border-0 mb-3" style={{ borderRadius: '12px' }}>
                <small>
                  <strong>{getTotalItems()}</strong> résultat(s) trouvé(s)
                  {searchTerm && ` pour "${searchTerm}"`}
                  {activeTab !== 'Toutes' && ` dans la tessiture ${activeTab}`}
                </small>
              </Alert>
            )}

            {/* ✅ PARTICIPANTS TABLE */}
            {getTotalItems() > 0 ? (
              <>
                <div className="table-responsive" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <Table className="mb-0 align-middle">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="border-0 py-3 px-4" style={{ fontWeight: '600', fontSize: '14px' }}>
                          #
                        </th>
                        <th className="border-0 py-3 px-4" style={{ fontWeight: '600', fontSize: '14px' }}>
                          Participant
                        </th>
                        <th className="border-0 py-3 px-4" style={{ fontWeight: '600', fontSize: '14px' }}>
                          Contact
                        </th>
                        <th className="border-0 py-3 px-4" style={{ fontWeight: '600', fontSize: '14px' }}>
                          Nationalité
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData().map((choriste, index) => (
                        <tr key={choriste._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td className="border-0 py-3 px-4">
                            <Badge bg="light" text="dark" style={{ fontFamily: 'monospace' }}>
                              {getStartIndex() + index}
                            </Badge>
                          </td>
                          <td className="border-0 py-3 px-4">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  backgroundColor: '#e5e7eb',
                                  color: '#6b7280'
                                }}
                              >
                                <FaUserAlt size={14} />
                              </div>
                              <div>
                                <div className="fw-semibold text-dark" style={{ fontSize: '15px' }}>
                                  {choriste.firstName} {choriste.lastName}
                                </div>
                                {choriste.pupitre && (
                                  <small className="text-muted">
                                    {choriste.pupitre.charAt(0).toUpperCase() + choriste.pupitre.slice(1)}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border-0 py-3 px-4">
                            <div className="d-flex align-items-center">
                              <MdEmail className="me-2 text-primary" size={16} />
                              <span style={{ fontSize: '14px' }}>{choriste.email}</span>
                            </div>
                          </td>
                          <td className="border-0 py-3 px-4">
                            <div className="d-flex align-items-center">
                              <FaGlobe className="me-2 text-success" size={14} />
                              <span style={{ fontSize: '14px' }}>
                                {choriste.nationality || <em className="text-muted">Non spécifié</em>}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* ✅ PROFESSIONAL PAGINATION */}
                {getTotalPages() > 1 && (
                  <div className="d-flex justify-content-between align-items-center p-3 mt-3 bg-light rounded">
                    <div className="d-flex align-items-center">
                      <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                        Participants par page:
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
                        style={{ border: 'none', backgroundColor: 'transparent' }}
                      >
                        <FaAngleDoubleLeft />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={isFirstPage()}
                        className="me-3"
                        style={{ border: 'none', backgroundColor: 'transparent' }}
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
                        style={{ border: 'none', backgroundColor: 'transparent' }}
                      >
                        <FaChevronRight />
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={isLastPage()}
                        style={{ border: 'none', backgroundColor: 'transparent' }}
                      >
                        <FaAngleDoubleRight />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-5">
                <Search size={48} className="text-muted mb-3" />
                <h6 className="text-muted">Aucun résultat trouvé</h6>
                <p className="text-muted mb-0">
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
