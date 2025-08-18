/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable default-case */
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import {
  FaCalendarAlt,
  FaUserTimes,
  FaHandPaper,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSearch,
  FaClock,
  FaMapMarkerAlt,
  FaMusic,
  FaFilter
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getRepetitions } from '../../../services/repetition.service';
import { getChoristesByPupitre } from '../../../services/accounts.service';

const AbsenceReport = () => {
  // State management
  const [allAbsences, setAllAbsences] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [choristes, setChoristes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination (0-based)
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // Filter state
  const [filterType, setFilterType] = useState('general');
  const [filterValue, setFilterValue] = useState('');
  const [choristeId, setChoristeId] = useState('');

  // Date filter state
  const [dateFilterType, setDateFilterType] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Filter options
  const filterOptions = [
    { value: 'general', label: 'Général' },
    { value: 'pupitre', label: 'Par pupitre' },
    { value: 'choriste', label: 'Par choriste' }
  ];

  const dateFilterOptions = [
    { value: 'all', label: 'Toutes les périodes' },
    { value: 'specific', label: 'Date précise' },
    { value: 'fromDate', label: 'Depuis une date donnée' },
    { value: 'season', label: 'Depuis le début de la saison' },
    { value: 'period', label: 'Période donnée' }
  ];

  const pupitreOptions = [
    { value: 'soprano', label: 'Soprano' },
    { value: 'alto', label: 'Alto' },
    { value: 'ténor', label: 'Ténor' },
    { value: 'basse', label: 'Basse' }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [repetitionsData, choristesData] = await Promise.all([getRepetitions(), getChoristesByPupitre()]);

      // Sort repetitions by date (most recent first)
      const sortedRepetitions = repetitionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRepetitions(sortedRepetitions);
      setChoristes(choristesData);

      // Process all absences from all repetitions
      const processedAbsences = processAllAbsences(sortedRepetitions);
      setAllAbsences(processedAbsences);
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire('Erreur', 'Erreur lors du chargement des données.', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  // Process all absences from all repetitions
  const processAllAbsences = (repetitionsData) => {
    let allAbsenceRecords = [];

    repetitionsData.forEach((repetition) => {
      // Get automatic absences
      if (repetition.absentChoristes && Array.isArray(repetition.absentChoristes)) {
        repetition.absentChoristes.forEach((absent) => {
          if (absent.choriste) {
            allAbsenceRecords.push({
              _id: `${repetition._id}_${absent.choriste._id}_auto`,
              choriste: {
                _id: absent.choriste._id,
                firstName: absent.choriste.firstName,
                lastName: absent.choriste.lastName,
                email: absent.choriste.email,
                pupitre: absent.choriste.pupitre
              },
              repetition: {
                _id: repetition._id,
                date: repetition.date,
                startTime: repetition.startTime,
                endTime: repetition.endTime,
                location: repetition.location,
                concert: repetition.concert
              },
              reason: absent.reason,
              isManual: false,
              addedAt: repetition.createdAt
            });
          }
        });
      }

      // Get manual absences
      if (repetition.manualPresences && Array.isArray(repetition.manualPresences)) {
        repetition.manualPresences
          .filter((manual) => manual.type === 'absent')
          .forEach((manual) => {
            if (manual.choriste) {
              allAbsenceRecords.push({
                _id: `${repetition._id}_${manual.choriste._id}_manual`,
                choriste: {
                  _id: manual.choriste._id,
                  firstName: manual.choriste.firstName,
                  lastName: manual.choriste.lastName,
                  email: manual.choriste.email,
                  pupitre: manual.choriste.pupitre
                },
                repetition: {
                  _id: repetition._id,
                  date: repetition.date,
                  startTime: repetition.startTime,
                  endTime: repetition.endTime,
                  location: repetition.location,
                  concert: repetition.concert
                },
                reason: manual.reason,
                isManual: true,
                addedBy: manual.addedBy ? `${manual.addedBy.firstName} ${manual.addedBy.lastName}` : 'Inconnu',
                addedAt: manual.addedAt
              });
            }
          });
      }
    });

    // Sort by date (most recent first)
    return allAbsenceRecords.sort((a, b) => new Date(b.repetition.date) - new Date(a.repetition.date));
  };

  // Get season start date
  const getSeasonStartDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (0 = January)

    // If current month is September (8) or later, use current year
    // If current month is before September, use previous year
    const seasonYear = currentMonth >= 8 ? currentYear : currentYear - 1;

    return new Date(seasonYear, 8, 1); // September 1st
  };

  // Apply all filters
  const getFilteredAbsences = () => {
    let filtered = [...allAbsences];

    // Apply date filters
    if (dateFilterType !== 'all') {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.repetition.date);

        switch (dateFilterType) {
          case 'specific':
            if (!specificDate) return true;
            return recordDate.toDateString() === new Date(specificDate).toDateString();

          case 'fromDate':
            if (!fromDate) return true;
            return recordDate >= new Date(fromDate);

          case 'season':
            return recordDate >= getSeasonStartDate();

          case 'period':
            if (!fromDate || !toDate) return true;
            return recordDate >= new Date(fromDate) && recordDate <= new Date(toDate);

          default:
            return true;
        }
      });
    }

    // Apply WHO filters
    if (filterType === 'pupitre' && filterValue) {
      filtered = filtered.filter((record) => record.choriste.pupitre === filterValue);

      // If choriste is also selected within pupitre
      if (choristeId) {
        filtered = filtered.filter((record) => record.choriste._id.toString() === choristeId);
      }
    }

    if (filterType === 'choriste' && choristeId) {
      filtered = filtered.filter((record) => record.choriste._id.toString() === choristeId);
    }

    return filtered;
  };

  // Filter records by search
  const getFilteredRecords = () => {
    const absences = getFilteredAbsences();
    if (!searchTerm.trim()) return absences;

    return absences.filter((record) => {
      const fullName = `${record.choriste.firstName} ${record.choriste.lastName}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        record.choriste.email?.toLowerCase().includes(search) ||
        record.reason.toLowerCase().includes(search) ||
        record.repetition.location.toLowerCase().includes(search)
      );
    });
  };

  // Pagination functions
  const getTotalItems = () => getFilteredRecords().length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedRecords = () => {
    const filtered = getFilteredRecords();
    const start = currentPage * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Reset filters when type changes
  const handleFilterTypeChange = (selected) => {
    setFilterType(selected.value);
    setFilterValue('');
    setChoristeId('');
    setCurrentPage(0);
  };

  // Handle date filter change
  const handleDateFilterChange = (selected) => {
    setDateFilterType(selected.value);
    setSpecificDate('');
    setFromDate('');
    setToDate('');
    setCurrentPage(0);
  };

  // Get choristes options based on selected pupitre
  const getChoristeOptions = () => {
    let availableChoristes = choristes;

    // If we're filtering by pupitre, only show choristes from that pupitre
    if (filterType === 'pupitre' && filterValue) {
      availableChoristes = choristes.filter((choriste) => choriste.pupitre === filterValue);
    }

    return availableChoristes.map((choriste) => ({
      value: choriste._id,
      label: `${choriste.firstName} ${choriste.lastName}`,
      pupitre: choriste.pupitre
    }));
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      borderColor: state.isFocused ? '#0d6efd' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none'
    })
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
        <Card.Header>
          <h4 className="mb-1 fw-bold text-dark">
            <FaCalendarAlt className="me-3 text-primary" />
            Consulter l'État des Absences aux Répétitions
          </h4>
          <p className="text-muted mb-0">Consultez les absences : général, par pupitre, par choriste, selon une période</p>
        </Card.Header>

        <Card.Body>
          {/* Filter Panel */}
          <Row className="mb-4">
            {/* WHO Filter */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaFilter className="me-2" />
                  Qui
                </Form.Label>
                <Select
                  value={filterOptions.find((opt) => opt.value === filterType)}
                  onChange={handleFilterTypeChange}
                  options={filterOptions}
                  styles={customSelectStyles}
                />
              </Form.Group>
            </Col>

            {filterType === 'pupitre' && (
              <>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Pupitre</Form.Label>
                    <Select
                      value={pupitreOptions.find((opt) => opt.value === filterValue)}
                      onChange={(selected) => {
                        setFilterValue(selected?.value || '');
                        setChoristeId('');
                        setCurrentPage(0);
                      }}
                      options={pupitreOptions}
                      placeholder="Choisir un pupitre..."
                      isClearable
                      styles={customSelectStyles}
                    />
                  </Form.Group>
                </Col>

                {filterValue && (
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Choriste (optionnel)</Form.Label>
                      <Select
                        value={getChoristeOptions().find((opt) => opt.value === choristeId)}
                        onChange={(selected) => {
                          setChoristeId(selected?.value || '');
                          setCurrentPage(0);
                        }}
                        options={getChoristeOptions()}
                        placeholder="Tous les choristes"
                        isClearable
                        isSearchable
                        styles={customSelectStyles}
                      />
                    </Form.Group>
                  </Col>
                )}
              </>
            )}

            {filterType === 'choriste' && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Choriste</Form.Label>
                  <Select
                    value={getChoristeOptions().find((opt) => opt.value === choristeId)}
                    onChange={(selected) => {
                      setChoristeId(selected?.value || '');
                      setCurrentPage(0);
                    }}
                    options={getChoristeOptions()}
                    placeholder="Sélectionner un choriste..."
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    formatOptionLabel={(option) => (
                      <div>
                        <div>{option.label}</div>
                        <small className="text-muted">{option.pupitre}</small>
                      </div>
                    )}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>

          {/* WHEN Filter */}
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <FaCalendarAlt className="me-2" />
                  Quand
                </Form.Label>
                <Select
                  value={dateFilterOptions.find((opt) => opt.value === dateFilterType)}
                  onChange={handleDateFilterChange}
                  options={dateFilterOptions}
                  styles={customSelectStyles}
                />
              </Form.Group>
            </Col>

            {dateFilterType === 'specific' && (
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date précise</Form.Label>
                  <Form.Control
                    type="date"
                    value={specificDate}
                    onChange={(e) => {
                      setSpecificDate(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </Form.Group>
              </Col>
            )}

            {dateFilterType === 'fromDate' && (
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Depuis le</Form.Label>
                  <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </Form.Group>
              </Col>
            )}

            {dateFilterType === 'season' && (
              <Col md={3}>
                <Alert variant="info" className="mb-0 py-2">
                  <small>
                    <strong>Début de saison:</strong>
                    <br />
                    {getSeasonStartDate().toLocaleDateString('fr-FR')}
                  </small>
                </Alert>
              </Col>
            )}

            {dateFilterType === 'period' && (
              <>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Du</Form.Label>
                    <Form.Control
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setCurrentPage(0);
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Au</Form.Label>
                    <Form.Control
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setCurrentPage(0);
                      }}
                    />
                  </Form.Group>
                </Col>
              </>
            )}

            <Col md={3}>
              <div className="d-flex align-items-end h-100">
                <Badge bg="primary" className="w-100 text-center py-2">
                  {getTotalItems()} absence{getTotalItems() !== 1 ? 's' : ''} trouvée{getTotalItems() !== 1 ? 's' : ''}
                </Badge>
              </div>
            </Col>
          </Row>

          {/* Search */}
          {getTotalItems() > 0 && (
            <div className="mb-3">
              <InputGroup style={{ maxWidth: '400px' }}>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher choriste, motif, lieu..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                />
              </InputGroup>
            </div>
          )}

          {/* Results */}
          {getTotalItems() === 0 ? (
            <Alert variant="success" className="text-center">
              <h6>✅ Aucune absence</h6>
              <p className="mb-0">
                {searchTerm ? 'Aucun résultat pour votre recherche.' : 'Aucune absence trouvée pour les critères sélectionnés.'}
              </p>
            </Alert>
          ) : (
            <>
              <Table hover responsive>
                <thead className="table-light">
                  <tr>
                    <th>Choriste</th>
                    <th>Répétition</th>
                    <th>Motif</th>
                    <th>Type</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedRecords().map((record) => (
                    <tr key={record._id}>
                      <td>
                        <div>
                          <strong>
                            {record.choriste.firstName} {record.choriste.lastName}
                          </strong>
                          <br />
                          {record.choriste.email && (
                            <>
                              <small className="text-muted">{record.choriste.email}</small>
                              <br />
                            </>
                          )}
                          <Badge bg="secondary" size="sm">
                            {record.choriste.pupitre}
                          </Badge>
                        </div>
                      </td>

                      <td>
                        <div>
                          <strong>{formatDateShort(record.repetition.date)}</strong>
                          <br />
                          <small className="text-muted">
                            <FaClock className="me-1" />
                            {record.repetition.startTime} - {record.repetition.endTime}
                          </small>
                          <br />
                          <small className="text-muted">
                            <FaMapMarkerAlt className="me-1" />
                            {record.repetition.location}
                          </small>
                          {record.repetition.concert && (
                            <>
                              <br />
                              <small className="text-primary">
                                <FaMusic className="me-1" />
                                {record.repetition.concert.title}
                              </small>
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="fw-semibold">{record.reason}</span>
                      </td>

                      <td>
                        <div className="d-flex gap-1">
                          <Badge bg="danger">
                            <FaUserTimes className="me-1" />
                            Absent
                          </Badge>
                          {record.isManual && (
                            <Badge bg="info">
                              <FaHandPaper className="me-1" />
                              Manuel
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td>
                        {record.isManual ? (
                          <div>
                            <small className="text-muted">
                              <strong>Ajouté par:</strong> {record.addedBy}
                              <br />
                              <strong>Le:</strong> {new Date(record.addedAt).toLocaleString('fr-FR')}
                            </small>
                          </div>
                        ) : (
                          <small className="text-muted">
                            Absence automatique
                            <br />
                            {new Date(record.addedAt).toLocaleString('fr-FR')}
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                <div className="d-flex align-items-center">
                  <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                    Lignes par page:
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
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AbsenceReport;
