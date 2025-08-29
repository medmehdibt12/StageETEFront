/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable default-case */
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Form, Table, Badge, Spinner, Alert, InputGroup, Modal } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
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
  FaFilter,
  FaEye,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUsers,
  FaChartLine,
  FaPercentage,
  FaFileExcel
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getComprehensiveAbsenceReport } from '../../../services/repetition.service';
import { sendComprehensiveWarningNotifications } from '../../../services/elimination.service';
import { getChoristesByPupitre } from '../../../services/accounts.service';

const AbsenceReport = () => {
  // State management
  const [choristesData, setChoristesData] = useState([]);
  const [choristes, setChoristes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [noDataFound, setNoDataFound] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState('');
  const [threshold, setThreshold] = useState(70);

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

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChoriste, setSelectedChoriste] = useState(null);

  // Individual processing states
  const [sendingWarnings, setSendingWarnings] = useState({});

  // Filter options
  const filterOptions = [
    { value: 'general', label: 'Général' },
    { value: 'pupitre', label: 'Par pupitre' },
    { value: 'choriste', label: 'Par choriste' }
  ];

  const dateFilterOptions = [
    { value: 'all', label: 'Toutes les périodes' },
    { value: 'date', label: 'Date précise' },
    { value: 'dateFrom', label: 'Depuis une date donnée' },
    { value: 'season', label: 'Depuis le début de la saison' },
    { value: 'dateRange', label: 'Période donnée' }
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

  // Load data when filters change (without loading spinner)
  useEffect(() => {
    if (!initialLoading) {
      loadComprehensiveDataSilently();
    }
  }, [filterType, filterValue, choristeId, dateFilterType, specificDate, fromDate, toDate]);

  const loadInitialData = async () => {
    try {
      const choristesData = await getChoristesByPupitre();
      setChoristes(choristesData);

      // Load initial comprehensive data
      await loadComprehensiveData();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Swal.fire('Erreur', 'Erreur lors du chargement des données.', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadComprehensiveData = async () => {
    try {
      setLoading(true);
      await fetchComprehensiveData();
    } catch (error) {
      console.error('Error loading comprehensive data:', error);
      Swal.fire('Erreur', 'Erreur lors du chargement des données complètes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Silent loading for filter changes (no spinner)
  const loadComprehensiveDataSilently = async () => {
    try {
      await fetchComprehensiveData();
    } catch (error) {
      console.error('Error loading comprehensive data silently:', error);
      setChoristesData([]);
      setNoDataFound(true);
      setNoDataMessage('Erreur lors du chargement des données.');
    }
  };

  // Common data fetching logic
  const fetchComprehensiveData = async () => {
    const params = {};

    // ✅ DETERMINE BASE FILTER TYPE
    let baseFilterType = 'general';
    if (choristeId) {
      baseFilterType = 'choriste';
      params.choristeId = choristeId;
    } else if (filterType === 'pupitre' && filterValue) {
      baseFilterType = 'pupitre';
      params.pupitre = filterValue;
    }

    // ✅ COMBINE WITH DATE FILTER
    switch (dateFilterType) {
      case 'date':
        if (specificDate) {
          params.filterType = baseFilterType === 'general' ? 'date' : baseFilterType;
          params.date = specificDate;
          if (baseFilterType !== 'general') {
            params.dateFilter = 'date';
          }
        } else {
          params.filterType = baseFilterType;
        }
        break;

      case 'dateFrom':
        if (fromDate) {
          params.filterType = baseFilterType === 'general' ? 'dateFrom' : baseFilterType;
          params.dateFrom = fromDate;
          if (baseFilterType !== 'general') {
            params.dateFilter = 'dateFrom';
          }
        } else {
          params.filterType = baseFilterType;
        }
        break;

      case 'season':
        params.filterType = baseFilterType === 'general' ? 'season' : baseFilterType;
        if (baseFilterType !== 'general') {
          params.dateFilter = 'season';
        }
        break;

      case 'dateRange':
        if (fromDate && toDate) {
          params.filterType = baseFilterType === 'general' ? 'dateRange' : baseFilterType;
          params.dateFrom = fromDate;
          params.dateTo = toDate;
          if (baseFilterType !== 'general') {
            params.dateFilter = 'dateRange';
          }
        } else {
          params.filterType = baseFilterType;
        }
        break;

      case 'all':
      default:
        params.filterType = baseFilterType;
        break;
    }

    console.log('Sending params:', params);

    const response = await getComprehensiveAbsenceReport(params);

    if (response.noDataFound) {
      setChoristesData([]);
      setNoDataFound(true);
      setNoDataMessage(response.message || 'Aucune donnée trouvée pour les critères sélectionnés.');
      setThreshold(70);
    } else {
      setChoristesData(response.choristesData || []);
      setNoDataFound(false);
      setNoDataMessage('');
      setThreshold(response.statistics?.threshold || 70);
    }

    setCurrentPage(0);
  };

  // ✅ UPDATED: Excel Export Function (removed global rate and status)
  const handleExportToExcel = () => {
    if (getTotalItems() === 0) {
      Swal.fire('Aucune donnée', 'Aucune donnée à exporter.', 'warning');
      return;
    }

    try {
      // Get filtered data for export
      const dataToExport = getFilteredRecords();

      // ✅ UPDATED: Create main data sheet without global rate and status
      const mainData = dataToExport.map((record, index) => ({
        'N°': index + 1,
        Prénom: record.choriste.firstName,
        Nom: record.choriste.lastName,
        Email: record.choriste.email,
        Pupitre: record.choriste.pupitre,
        'Taux Présence Répétitions (%)': record.repetitionStats.attendanceRate,
        'Présences Répétitions': record.repetitionStats.attendedRepetitions,
        'Total Répétitions': record.repetitionStats.totalRepetitions,
        'Absences Répétitions': record.repetitionStats.absencesCount,
        'Taux Présence Concerts (%)': record.concertStats.attendanceRate,
        'Présences Concerts': record.concertStats.availableConcerts,
        'Total Concerts': record.concertStats.totalConcerts,
        'Absences Concerts': record.concertStats.absencesCount
        // ✅ REMOVED: 'Taux Global (%)': record.overallAttendanceRate,
        // ✅ REMOVED: 'Statut': record.isAtRisk ? 'À Risque' : 'Bon'
      }));

      // Create detailed absences data
      let detailedAbsences = [];
      dataToExport.forEach((record) => {
        // Add repetition absences
        record.repetitionAbsences?.forEach((absence) => {
          detailedAbsences.push({
            Choriste: `${record.choriste.firstName} ${record.choriste.lastName}`,
            Type: 'Répétition',
            Date: new Date(absence.date).toLocaleDateString('fr-FR'),
            'Lieu/Concert': `${absence.location} - ${absence.concertTitle}`,
            Motif: absence.reason,
            Manuel: absence.isManual ? 'Oui' : 'Non'
          });
        });

        // Add concert absences
        record.concertAbsences?.forEach((absence) => {
          detailedAbsences.push({
            Choriste: `${record.choriste.firstName} ${record.choriste.lastName}`,
            Type: 'Concert',
            Date: new Date(absence.dateHeure).toLocaleDateString('fr-FR'),
            'Lieu/Concert': absence.title,
            Motif: absence.reason,
            Manuel: ''
          });
        });
      });

      // Create summary statistics
      const summaryData = [
        { Statistique: 'Nombre total de choristes', Valeur: getTotalItems() },
        { Statistique: 'Seuil de présence requis (%)', Valeur: threshold },
        { Statistique: 'Choristes à risque', Valeur: dataToExport.filter((r) => r.isAtRisk).length },
        { Statistique: 'Choristes avec bon taux', Valeur: dataToExport.filter((r) => !r.isAtRisk).length },
        {
          Statistique: 'Taux moyen répétitions (%)',
          Valeur:
            dataToExport.length > 0
              ? (dataToExport.reduce((sum, r) => sum + r.repetitionStats.attendanceRate, 0) / dataToExport.length).toFixed(1)
              : 0
        },
        {
          Statistique: 'Taux moyen concerts (%)',
          Valeur:
            dataToExport.length > 0
              ? (dataToExport.reduce((sum, r) => sum + r.concertStats.attendanceRate, 0) / dataToExport.length).toFixed(1)
              : 0
        }
      ];

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Main data sheet
      const mainSheet = XLSX.utils.json_to_sheet(mainData);
      XLSX.utils.book_append_sheet(workbook, mainSheet, 'Rapport Absences');

      // Summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Statistiques');

      // Detailed absences sheet (only if there are absences)
      if (detailedAbsences.length > 0) {
        const detailSheet = XLSX.utils.json_to_sheet(detailedAbsences);
        XLSX.utils.book_append_sheet(workbook, detailSheet, 'Détail Absences');
      }

      // Generate filename with current date and filters
      const today = new Date().toISOString().split('T')[0];
      let filename = `Rapport_Absences_${today}`;

      // Add filter info to filename
      if (filterType === 'pupitre' && filterValue) {
        filename += `_${filterValue}`;
      } else if (filterType === 'choriste' && choristeId) {
        const selectedChoriste = choristes.find((c) => c._id === choristeId);
        if (selectedChoriste) {
          filename += `_${selectedChoriste.firstName}_${selectedChoriste.lastName}`;
        }
      }

      if (dateFilterType !== 'all') {
        filename += `_${dateFilterType}`;
      }

      filename += '.xlsx';

      // Save the file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Swal.fire('Erreur', "Erreur lors de l'export Excel.", 'error');
    }
  };

  // Get season start date
  const getSeasonStartDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const seasonYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    return new Date(seasonYear, 8, 1);
  };

  // Filter records by search
  const getFilteredRecords = () => {
    if (!searchTerm.trim()) return choristesData;

    return choristesData.filter((record) => {
      const fullName = `${record.choriste.firstName} ${record.choriste.lastName}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      return (
        fullName.includes(search) ||
        record.choriste.email?.toLowerCase().includes(search) ||
        record.choriste.pupitre?.toLowerCase().includes(search)
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
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Reset filters when type changes (no loading spinner)
  const handleFilterTypeChange = (selected) => {
    setFilterType(selected.value);
    setFilterValue('');
    setChoristeId('');
    setCurrentPage(0);
  };

  // Handle date filter change (no loading spinner)
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

    if (filterType === 'pupitre' && filterValue) {
      availableChoristes = choristes.filter((choriste) => choriste.pupitre === filterValue);
    }

    return availableChoristes.map((choriste) => ({
      value: choriste._id,
      label: `${choriste.firstName} ${choriste.lastName}`,
      pupitre: choriste.pupitre
    }));
  };

  // Handle visualize details
  const handleVisualizeDetails = (choristeData) => {
    setSelectedChoriste(choristeData);
    setShowDetailsModal(true);
  };

  // Handle individual warning
  const handleSendIndividualWarning = async (choristeData) => {
    const choristeId = choristeData.choriste._id;

    const result = await Swal.fire({
      title: 'Envoyer un avertissement',
      html: `Envoyer un avertissement à <strong>${choristeData.choriste.firstName} ${choristeData.choriste.lastName}</strong> ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        setSendingWarnings((prev) => ({ ...prev, [choristeId]: true }));

        await sendComprehensiveWarningNotifications([choristeId]);

        Swal.fire({
          title: 'Avertissement envoyé',
          text: `Avertissement envoyé avec succès à ${choristeData.choriste.firstName} ${choristeData.choriste.lastName}.`,
          icon: 'success'
        });
      } catch (error) {
        console.error('Error sending individual warning:', error);
        Swal.fire('Erreur', "Erreur lors de l'envoi de l'avertissement.", 'error');
      } finally {
        setSendingWarnings((prev) => {
          const newState = { ...prev };
          delete newState[choristeId];
          return newState;
        });
      }
    }
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
      '&:hover': {
        borderColor: '#80bdff'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6c757d'
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
    <Container style={{ marginTop: '2rem' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <h4 className="mb-3">
                <FaCalendarAlt className="me-2 text-primary" />
                Rapport complet des absences
              </h4>
              <p className="text-muted mb-0">Analysez les absences aux répétitions et la disponibilité aux concerts</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter Panel */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="mb-3">
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
          <Row className="mb-3">
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

            {dateFilterType === 'date' && (
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

            {dateFilterType === 'dateFrom' && (
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

            {dateFilterType === 'dateRange' && (
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
                  {getTotalItems()} choriste{getTotalItems() !== 1 ? 's' : ''} trouvé{getTotalItems() !== 1 ? 's' : ''}
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Loading State (only for initial load) */}
      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Chargement des données...</p>
        </div>
      )}

      {/* No Data Found State */}
      {!loading && noDataFound && (
        <Alert variant="warning" className="text-center">
          <h6>Aucune donnée trouvée</h6>
          <p className="mb-0">{noDataMessage}</p>
        </Alert>
      )}

      {/* Main Results */}
      {!loading && !noDataFound && (
        <Card className="shadow-sm border-0">
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">Analyse des Absences</h5>
            {/* Export Excel Button */}
            {getTotalItems() > 0 && (
              <Button variant="success" size="sm" onClick={handleExportToExcel} className="d-flex align-items-center">
                <FaFileExcel className="me-2" />
                <span className="d-none d-md-inline">Exporter Excel</span>
                <span className="d-md-none">Excel</span>
              </Button>
            )}
          </Card.Header>

          <Card.Body className="p-0">
            {/* Search Bar */}
            {getTotalItems() > 0 && (
              <div className="p-3 border-bottom">
                <InputGroup style={{ maxWidth: '400px' }}>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(0);
                    }}
                  />
                </InputGroup>
              </div>
            )}

            {/* No Results After Search */}
            {getTotalItems() === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-0">
                  {searchTerm ? `Aucun choriste trouvé pour "${searchTerm}"` : 'Aucun choriste trouvé pour les critères sélectionnés.'}
                </p>
              </div>
            ) : (
              <>
                <Table bordered hover responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Choriste</th>
                      <th>
                        <div className="d-flex align-items-center">
                          <div>
                            <div>Taux de Présence</div>
                            <small className="text-muted fw-normal">📝 Répétitions</small>
                          </div>
                        </div>
                      </th>
                      <th>
                        <div className="d-flex align-items-center">
                          <div>
                            <div>Présences/Total</div>
                            <small className="text-muted fw-normal">📝 Répétitions</small>
                          </div>
                        </div>
                      </th>
                      <th>
                        <div className="d-flex align-items-center">
                          <div>
                            <div>Taux de Présence</div>
                            <small className="text-muted fw-normal">🎵 Concerts</small>
                          </div>
                        </div>
                      </th>
                      <th>
                        <div className="d-flex align-items-center">
                          <div>
                            <div>Présence/Total</div>
                            <small className="text-muted fw-normal">🎵 Concerts</small>
                          </div>
                        </div>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedRecords().map((record) => (
                      <tr key={record.choriste._id}>
                        <td>
                          <div>
                            <strong>
                              {record.choriste.firstName} {record.choriste.lastName}
                            </strong>
                            <br />
                            <small className="text-muted">{record.choriste.email}</small>
                            <br />
                            <Badge bg="secondary" size="sm">
                              {record.choriste.pupitre}
                            </Badge>
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress me-2" style={{ width: '80px', height: '8px' }}>
                              <div
                                className={`progress-bar ${
                                  record.repetitionStats.attendanceRate >= threshold
                                    ? 'bg-success'
                                    : record.repetitionStats.attendanceRate >= threshold * 0.8
                                      ? 'bg-warning'
                                      : 'bg-danger'
                                }`}
                                style={{
                                  width:
                                    record.repetitionStats.attendanceRate === 0
                                      ? '3px'
                                      : `${Math.min(record.repetitionStats.attendanceRate, 100)}%`
                                }}
                              ></div>
                            </div>
                            <span className="fw-bold">{record.repetitionStats.attendanceRate}%</span>
                            {record.repetitionStats.attendanceRate < threshold && <FaExclamationTriangle className="text-warning ms-2" />}
                          </div>
                        </td>

                        <td>
                          <Badge bg="info" className="px-3">
                            {record.repetitionStats.attendedRepetitions}/{record.repetitionStats.totalRepetitions}
                          </Badge>
                          {record.repetitionStats.absencesCount > 0 && (
                            <div className="mt-1">
                              <small className="text-danger">
                                {record.repetitionStats.absencesCount} absence{record.repetitionStats.absencesCount !== 1 ? 's' : ''}
                              </small>
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress me-2" style={{ width: '80px', height: '8px' }}>
                              <div
                                className={`progress-bar ${
                                  record.concertStats.attendanceRate >= 70
                                    ? 'bg-success'
                                    : record.concertStats.attendanceRate >= 50
                                      ? 'bg-warning'
                                      : 'bg-danger'
                                }`}
                                style={{
                                  width:
                                    record.concertStats.attendanceRate === 0
                                      ? '3px'
                                      : `${Math.min(record.concertStats.attendanceRate, 100)}%`
                                }}
                              ></div>
                            </div>
                            <span className="fw-bold">{record.concertStats.attendanceRate}%</span>
                            {record.concertStats.attendanceRate < 70 && <FaExclamationTriangle className="text-warning ms-2" />}
                          </div>
                        </td>

                        <td>
                          <Badge bg="info" className="px-3">
                            {record.concertStats.availableConcerts}/{record.concertStats.totalConcerts}
                          </Badge>
                          {record.concertStats.absencesCount > 0 && (
                            <div className="mt-1">
                              <small className="text-danger">
                                {record.concertStats.absencesCount} absence{record.concertStats.absencesCount !== 1 ? 's' : ''}
                              </small>
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="d-flex gap-1">
                            <Button size="sm" variant="outline-info" onClick={() => handleVisualizeDetails(record)} title="Voir détails">
                              <FaEye />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline-warning"
                              onClick={() => handleSendIndividualWarning(record)}
                              disabled={sendingWarnings[record.choriste._id]}
                              title="Envoyer un avertissement"
                            >
                              {sendingWarnings[record.choriste._id] ? <Spinner animation="border" size="sm" /> : <FaEnvelope />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Professional Pagination */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
                  <div className="d-flex align-items-center order-2 order-md-1">
                    <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                      <span className="d-none d-sm-inline">Choristes par page:</span>
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
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Enhanced Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Détails des Absences - {selectedChoriste?.choriste.firstName} {selectedChoriste?.choriste.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedChoriste && (
            <>
              {/* Professional Summary Cards */}
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="border-info h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-2">
                        <FaCalendarAlt className="text-primary me-2" />
                        <h6 className="text-primary mb-0">Répétitions</h6>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Taux de présence:</span>
                        <Badge
                          bg={
                            selectedChoriste.repetitionStats.attendanceRate >= threshold
                              ? 'success'
                              : selectedChoriste.repetitionStats.attendanceRate >= threshold * 0.8
                                ? 'warning'
                                : 'danger'
                          }
                          className="px-3"
                        >
                          {selectedChoriste.repetitionStats.attendanceRate}%
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Présences:</span>
                        <Badge bg="info" className="px-3">
                          {selectedChoriste.repetitionStats.attendedRepetitions}/{selectedChoriste.repetitionStats.totalRepetitions}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Absences:</span>
                        <Badge bg="danger" className="px-3">
                          {selectedChoriste.repetitionStats.absencesCount}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-success h-100">
                    <Card.Body>
                      <div className="d-flex align-items-center mb-2">
                        <FaMusic className="text-success me-2" />
                        <h6 className="text-success mb-0">Concerts</h6>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Taux de présences:</span>
                        <Badge
                          bg={
                            selectedChoriste.concertStats.attendanceRate >= 70
                              ? 'success'
                              : selectedChoriste.concertStats.attendanceRate >= 50
                                ? 'warning'
                                : 'danger'
                          }
                          className="px-3"
                        >
                          {selectedChoriste.concertStats.attendanceRate}%
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Présences:</span>
                        <Badge bg="info" className="px-3">
                          {selectedChoriste.concertStats.availableConcerts}/{selectedChoriste.concertStats.totalConcerts}
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>Absences:</span>
                        <Badge bg="danger" className="px-3">
                          {selectedChoriste.concertStats.absencesCount}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Repetition Absences */}
              {selectedChoriste.repetitionAbsences?.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-danger">
                    <FaTimesCircle className="me-2" />
                    Absences aux Répétitions ({selectedChoriste.repetitionAbsences.length})
                  </h6>
                  <div className="table-responsive">
                    <Table size="sm" striped bordered>
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Lieu</th>
                          <th>Concert</th>
                          <th>Motif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedChoriste.repetitionAbsences.map((absence, index) => (
                          <tr key={index}>
                            <td>{formatDate(absence.date)}</td>
                            <td>{absence.location}</td>
                            <td>
                              <small className="text-primary">{absence.concertTitle}</small>
                            </td>
                            <td>
                              <span className="text-danger">{absence.reason}</span>
                              {absence.isManual && (
                                <Badge bg="info" size="sm" className="ms-2">
                                  Manuel
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Concert Absences */}
              {selectedChoriste.concertAbsences?.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-warning">
                    <FaUserTimes className="me-2" />
                    Absences aux Concerts ({selectedChoriste.concertAbsences.length})
                  </h6>
                  <div className="table-responsive">
                    <Table size="sm" striped bordered>
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Concert</th>
                          <th>Motif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedChoriste.concertAbsences.map((absence, index) => (
                          <tr key={index}>
                            <td>{formatDate(absence.dateHeure)}</td>
                            <td>
                              <small className="text-primary">{absence.title}</small>
                            </td>
                            <td>
                              <span className="text-danger">{absence.reason}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              {/* No Absences */}
              {selectedChoriste.repetitionAbsences?.length === 0 && selectedChoriste.concertAbsences?.length === 0 && (
                <Alert variant="success" className="text-center">
                  <FaCheckCircle className="me-2" />
                  Aucune absence enregistrée
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AbsenceReport;
