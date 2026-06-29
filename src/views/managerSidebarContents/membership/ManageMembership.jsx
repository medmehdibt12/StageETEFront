/* eslint-disable default-case */
/* eslint-disable react/prop-types */

/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import {
  Container,
  Button,
  Table,
  Badge,
  Form,
  Card,
  Row,
  Col,
  InputGroup,
  Spinner,
  Modal,
  Tabs,
  Tab,
  Alert,
  Dropdown
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaClock,
  FaCalendarAlt,
  FaUserCheck,
  FaChevronDown,
  FaChevronUp,
  FaMusic,
  FaUser,
  FaQuoteLeft,
  FaCheck,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUsers,
  FaEye,
  FaCheckDouble
} from 'react-icons/fa';
import Select from 'react-select';
import Swal from 'sweetalert2';
import {
  getMembershipSubmissions,
  getScheduledCandidatesWithSlots,
  // acceptMembership,
  refuseMembership,
  acceptAllRetenuCandidates
} from '../../../services/accounts.service';
import './ManageMembership.css';

const ManageMembership = () => {
  // State for different tabs
  const [pendingMemberships, setPendingMemberships] = useState([]);
  const [scheduledMemberships, setScheduledMemberships] = useState([]);
  const [auditionedMemberships, setAuditionedMemberships] = useState([]);

  // Loading states
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(true);
  const [isLoadingAuditioned, setIsLoadingAuditioned] = useState(true);
  const [isBulkAccepting, setIsBulkAccepting] = useState(false);

  // Filter states for each tab
  const [filterTextPending, setFilterTextPending] = useState('');
  const [filterTextScheduled, setFilterTextScheduled] = useState('');
  const [filterTextAuditioned, setFilterTextAuditioned] = useState('');
  const [alphabeticFilter, setAlphabeticFilter] = useState(null);

  // Tab 2 specific filters
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Tab 3 specific filter for evaluation decisions
  const [selectedDecision, setSelectedDecision] = useState(null);

  // Sorting states
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // UI states
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedEvaluationData, setSelectedEvaluationData] = useState(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [openDetails, setOpenDetails] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pagination states for each tab
  const [pendingPagination, setPendingPagination] = useState({
    currentPage: 0,
    itemsPerPage: 5
  });
  const [scheduledPagination, setScheduledPagination] = useState({
    currentPage: 0,
    itemsPerPage: 5
  });
  const [auditionedPagination, setAuditionedPagination] = useState({
    currentPage: 0,
    itemsPerPage: 5
  });

  const pageSizeOptions = [5, 10, 25, 50, 100];

  // Create the alphabetic filter options
  const alphabeticOptions = [
    { value: '', label: 'Tous les candidats' },
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
      value: letter,
      label: `Prénoms commençant par "${letter}"`
    }))
  ];

  // Decision filter options for Tab 3
  const decisionOptions = [
    { value: '', label: 'Toutes les décisions' },
    { value: 'Retenu', label: 'Retenu' },
    { value: 'Non Retenu', label: 'Non Retenu' },
    { value: 'En Attente', label: 'En Attente' }
  ];

  // Custom styles for Select components
  const selectStyles = {
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

  // Sortable header component
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

  // Updated filtering and sorting function with date/time filters
  const getFilteredMemberships = (
    memberships,
    filterText,
    sortField,
    sortDirection,
    alphabeticFilter,
    decisionFilter = null,
    dateFilter = null,
    timeFilter = null
  ) => {
    let filtered = [...memberships];

    // Apply date filter (NEW)
    if (dateFilter) {
      filtered = filtered.filter((member) => member.auditionDate === dateFilter);
    }

    // Apply time filter (NEW)
    if (timeFilter) {
      filtered = filtered.filter((member) => `${member.auditionStartTime}-${member.auditionEndTime}` === timeFilter);
    }

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

    // Apply decision filter for auditioned tab
    if (decisionFilter) {
      filtered = filtered.filter((member) => {
        if (!member.evaluationData) return false;
        return member.evaluationData.decision === decisionFilter;
      });
    }

    // Apply sorting
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
          case 'date':
            aVal = a.auditionDate ? new Date(a.auditionDate) : new Date(0);
            bVal = b.auditionDate ? new Date(b.auditionDate) : new Date(0);
            break;
          case 'time':
            aVal = a.auditionStartTime || '';
            bVal = b.auditionStartTime || '';
            break;
          default:
            return 0;
        }

        // Handle different data types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (aVal instanceof Date && bVal instanceof Date) {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        const result = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? result : -result;
      });
    }

    return filtered;
  };

  // Generate filter options from actual scheduled data
  const generateFilterOptions = () => {
    if (scheduledMemberships.length === 0) {
      setAvailableDates([]);
      setAvailableTimeSlots([]);
      return;
    }

    // Extract unique dates
    const uniqueDates = [
      ...new Set(scheduledMemberships.filter((member) => member.auditionDate).map((member) => member.auditionDate))
    ].sort();

    // Extract unique time ranges
    const uniqueTimeSlots = [
      ...new Set(
        scheduledMemberships
          .filter((member) => member.auditionStartTime && member.auditionEndTime)
          .map((member) => `${member.auditionStartTime}-${member.auditionEndTime}`)
      )
    ].sort();

    // Format date options
    const dateOptions = uniqueDates.map((date) => ({
      value: date,
      label: new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }));

    // Format time slot options
    const timeSlotOptions = uniqueTimeSlots.map((slot) => ({
      value: slot,
      label: slot
    }));

    setAvailableDates(dateOptions);
    setAvailableTimeSlots(timeSlotOptions);
  };

  // Get count of candidates with "Retenu" decision
  const getRetenuCandidatesCount = () => {
    return auditionedMemberships.filter((member) => member.evaluationData && member.evaluationData.decision === 'Retenu').length;
  };

  // Pagination helpers
  const getPaginationForTab = (tab) => {
    switch (tab) {
      case 'pending':
        return pendingPagination;
      case 'scheduled':
        return scheduledPagination;
      case 'auditioned':
        return auditionedPagination;
      default:
        return pendingPagination;
    }
  };

  const setPaginationForTab = (tab, pagination) => {
    switch (tab) {
      case 'pending':
        setPendingPagination(pagination);
        break;
      case 'scheduled':
        setScheduledPagination(pagination);
        break;
      case 'auditioned':
        setAuditionedPagination(pagination);
        break;
    }
  };

  const getPaginatedData = (data, tab) => {
    const pagination = getPaginationForTab(tab);
    const startIndex = pagination.currentPage * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength, tab) => {
    const pagination = getPaginationForTab(tab);
    return Math.ceil(dataLength / pagination.itemsPerPage);
  };

  const handlePageChange = (tab, newPage) => {
    const pagination = getPaginationForTab(tab);
    setPaginationForTab(tab, { ...pagination, currentPage: newPage });
  };

  const handlePageSizeChange = (tab, newSize) => {
    const pagination = getPaginationForTab(tab);
    setPaginationForTab(tab, { currentPage: 0, itemsPerPage: newSize });
  };

  // Search highlighting function
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #fff3cd; padding: 2px 4px; border-radius: 3px;">$1</mark>');
  };

  // Fetch memberships data
  const fetchMemberships = async () => {
    setIsLoadingPending(true);
    setIsLoadingScheduled(true);
    setIsLoadingAuditioned(true);

    try {
      // Fetch pending memberships
      const pendingData = await getMembershipSubmissions('Pending');
      setPendingMemberships(pendingData);

      // Fetch ALL scheduled memberships (no filters)
      const scheduledData = await getScheduledCandidatesWithSlots({});
      setScheduledMemberships(scheduledData);

      // Fetch auditioned memberships (those with evaluations)
      const auditionedData = await getMembershipSubmissions('Auditioned');
      setAuditionedMemberships(auditionedData);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de récupérer les candidatures.'
      });
    } finally {
      setIsLoadingPending(false);
      setIsLoadingScheduled(false);
      setIsLoadingAuditioned(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [refreshTrigger]);

  // Generate filter options when scheduled data changes
  useEffect(() => {
    if (activeTab === 'scheduled' && !isLoadingScheduled) {
      generateFilterOptions();
    }
  }, [scheduledMemberships, activeTab, isLoadingScheduled]);

  const toggleDetails = (id) => {
    setOpenDetails((prev) => {
      if (prev[id]) {
        return {};
      }
      return { [id]: true };
    });
  };

  // ✅ Simplified bulk accept - just loading + background polling
  const handleBulkAcceptRetenu = async () => {
    const retenuCount = getRetenuCandidatesCount();

    if (retenuCount === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Aucun candidat retenu',
        text: 'Il n\'y a actuellement aucun candidat avec le statut "Retenu".'
      });
      return;
    }

    Swal.fire({
      title: 'Accepter tous les candidats retenus?',
      html: `
      <p>Vous êtes sur le point d'accepter <strong>${retenuCount} candidat(s)</strong> retenu(s).</p>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Oui, accepter ${retenuCount} candidat(s)`,
      cancelButtonText: 'Annuler',
      width: '500px'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsBulkAccepting(true);

        try {
          // Show processing dialog
          Swal.fire({
            title: 'Acceptation en cours...',
            html: `
            <div>
              <p>Mise à jour de ${retenuCount} candidat(s)...</p>
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          `,
            allowOutsideClick: false,
            showConfirmButton: false
          });

          // Process acceptance
          const response = await acceptAllRetenuCandidates();

          if (response.success) {
            // Success with background info
            Swal.fire({
              icon: 'success',
              title: 'Candidats acceptés avec succès!',
              html: `
      <div>
        <p><strong>${response.totalProcessed} candidat(s)</strong> ont été acceptés.</p>
        <p style="color: #28a745; font-size: 14px; margin-top: 10px;">
          Les invitations à signer la charte sont envoyées.
        </p>
      </div>
    `,
              confirmButtonText: 'Parfait!',
              confirmButtonColor: '#28a745'
            });

            // Refresh data to show updated status
            setRefreshTrigger((prev) => prev + 1);
          } else {
            throw new Error(response.message || 'Erreur inconnue');
          }
        } catch (error) {
          // console.error('Bulk accept error:', error);
          Swal.fire({
            icon: 'error',
            title: "Erreur lors de l'acceptation",
            text: error.message || 'Une erreur est survenue. Veuillez réessayer.',
            confirmButtonColor: '#dc3545'
          });
        } finally {
          setIsBulkAccepting(false);
        }
      }
    });
  };

  const openRefuseModal = (id) => {
    setCurrentMemberId(id);
    setRefuseReason('');
    setShowRefuseModal(true);
  };

  const openEvaluationModal = (evaluationData) => {
    setSelectedEvaluationData(evaluationData);
    setShowEvaluationModal(true);
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

  const clearSearch = (tab) => {
    switch (tab) {
      case 'pending':
        setFilterTextPending('');
        break;
      case 'scheduled':
        setFilterTextScheduled('');
        break;
      case 'auditioned':
        setFilterTextAuditioned('');
        break;
    }
    handlePageChange(tab, 0);
  };

  // Format date helper
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMembershipTable = (memberships, isLoading, filterText, setFilterText, tabType) => {
    const decisionFilter = tabType === 'auditioned' ? selectedDecision?.value || '' : null;

    // Updated filteredMemberships call with date/time filters
    const filteredMemberships = getFilteredMemberships(
      memberships,
      filterText,
      sortField,
      sortDirection,
      alphabeticFilter?.value || '',
      decisionFilter,
      tabType === 'scheduled' ? selectedDate?.value : null,
      tabType === 'scheduled' ? selectedTimeRange?.value : null
    );

    const paginatedData = getPaginatedData(filteredMemberships, tabType);
    const pagination = getPaginationForTab(tabType);
    const totalPages = getTotalPages(filteredMemberships.length, tabType);
    const isFirstPage = pagination.currentPage === 0;
    const isLastPage = pagination.currentPage >= totalPages - 1;
    const startIndex = filteredMemberships.length === 0 ? 0 : pagination.currentPage * pagination.itemsPerPage + 1;
    const endIndex = Math.min((pagination.currentPage + 1) * pagination.itemsPerPage, filteredMemberships.length);

    const shouldShowTable = true;

    return (
      <>
        {/* ✅ RESPONSIVE: Search and Filter Controls */}
        <Row className="mb-3 align-items-center g-3">
          <Col lg={3} md={6} sm={12}>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Rechercher par nom..."
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  handlePageChange(tabType, 0);
                }}
                className="pe-5"
                style={{
                  borderRadius: '20px',
                  border: '1px solid #dee2e6',
                  paddingLeft: '40px'
                }}
              />
              <FaSearch
                className="position-absolute text-muted"
                style={{
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '14px'
                }}
              />
              {filterText && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => clearSearch(tabType)}
                  className="position-absolute p-0 text-muted"
                  style={{
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    lineHeight: 1,
                    textDecoration: 'none'
                  }}
                  title="Effacer la recherche"
                >
                  ×
                </Button>
              )}
            </div>
          </Col>

          <Col lg={3} md={6} sm={12}>
            <Select
              value={alphabeticFilter}
              onChange={(selected) => {
                setAlphabeticFilter(selected);
                handlePageChange(tabType, 0);
              }}
              options={alphabeticOptions}
              placeholder="Filtrer par première lettre"
              isClearable={true}
              isSearchable={false}
              styles={selectStyles}
            />
          </Col>

          {/* Tab 2 specific filters */}
          {tabType === 'scheduled' && (
            <>
              <Col lg={3} md={6} sm={12}>
                <Select
                  value={selectedDate}
                  onChange={(selected) => {
                    setSelectedDate(selected);
                    handlePageChange(tabType, 0);
                  }}
                  options={availableDates}
                  placeholder="Date"
                  isClearable={true}
                  isSearchable={false}
                  styles={selectStyles}
                />
              </Col>
              <Col lg={3} md={6} sm={12}>
                <Select
                  value={selectedTimeRange}
                  onChange={(selected) => {
                    setSelectedTimeRange(selected);
                    handlePageChange(tabType, 0);
                  }}
                  options={availableTimeSlots}
                  placeholder="Heure"
                  isClearable={true}
                  isSearchable={false}
                  styles={selectStyles}
                />
              </Col>
            </>
          )}

          {/* Tab 3 specific filter for decisions */}
          {tabType === 'auditioned' && (
            <>
              <Col lg={3} md={6} sm={12}>
                <Select
                  value={selectedDecision}
                  onChange={(selected) => {
                    setSelectedDecision(selected);
                    handlePageChange(tabType, 0);
                  }}
                  options={decisionOptions}
                  placeholder="Filtrer par décision"
                  isClearable={true}
                  isSearchable={false}
                  styles={selectStyles}
                />
              </Col>
              <Col lg={3} md={6} sm={12} className="text-end">
                {/* Bulk Accept Button for Auditioned Tab */}
                <Button
                  variant="success"
                  onClick={handleBulkAcceptRetenu}
                  disabled={getRetenuCandidatesCount() === 0 || isBulkAccepting}
                  size="sm"
                  className="w-100 w-lg-auto"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}
                >
                  {isBulkAccepting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <FaCheckDouble className="me-1" />
                      <span className="d-none d-sm-inline">Accepter les retenus ({getRetenuCandidatesCount()})</span>
                      <span className="d-sm-none">Accepter ({getRetenuCandidatesCount()})</span>
                    </>
                  )}
                </Button>
              </Col>
            </>
          )}

          {/* For other tabs, add empty column to maintain grid */}
          {tabType !== 'auditioned' && tabType !== 'scheduled' && <Col lg={6} md={12} sm={12}></Col>}
        </Row>

        {/* Table */}
        {shouldShowTable && (
          <>
            {isLoading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Chargement des candidatures...</p>
              </div>
            ) : filteredMemberships.length === 0 ? (
              <div className="empty-state p-5 text-center">
                <div className="empty-icon mb-3">📋</div>
                <h5>Aucune candidature trouvée</h5>
                <p className="text-muted">
                  {filterText ||
                  alphabeticFilter ||
                  (tabType === 'scheduled' && (selectedDate || selectedTimeRange)) ||
                  (tabType === 'auditioned' && selectedDecision)
                    ? 'Aucun résultat pour ces filtres'
                    : tabType === 'pending'
                      ? 'Toutes les candidatures ont été traitées'
                      : tabType === 'scheduled'
                        ? "Aucun test n'est programmé actuellement"
                        : "Aucune audition n'a été effectuée"}
                </p>
              </div>
            ) : (
              <div className="border rounded overflow-hidden">
                {/* 🖥️ DESKTOP TABLE VIEW */}
                <div className="desktop-table-view">
                  <Table hover bordered responsive className="mb-0" style={{ backgroundColor: 'white' }}>
                  <thead>
                    <tr>
                      <SortableHeader field="name" currentSort={sortField} direction={sortDirection} onSort={handleSort}>
                        Prénom et Nom
                      </SortableHeader>
                      <SortableHeader field="height" currentSort={sortField} direction={sortDirection} onSort={handleSort}>
                        Taille
                      </SortableHeader>
                      <th style={{ fontWeight: '600', padding: '12px 8px' }}>Genre</th>
                      <th style={{ fontWeight: '600', padding: '12px 8px' }}>Date de naissance</th>
                      {tabType === 'scheduled' && (
                        <>
                          <SortableHeader field="date" currentSort={sortField} direction={sortDirection} onSort={handleSort}>
                            Date d'audition
                          </SortableHeader>
                          <SortableHeader field="time" currentSort={sortField} direction={sortDirection} onSort={handleSort}>
                            Heure d'audition
                          </SortableHeader>
                        </>
                      )}
                      {tabType === 'auditioned' && <th style={{ fontWeight: '600', padding: '12px 8px' }}>Évaluation</th>}
                      <th style={{ fontWeight: '600', padding: '12px 8px' }}>Connaissances musicales</th>
                      <th style={{ fontWeight: '600', padding: '12px 8px' }}>Active dans autre chœur</th>
                      <th style={{ fontWeight: '600', padding: '12px 8px' }}>Détails</th>
                      {tabType === 'auditioned' && <th style={{ fontWeight: '600', padding: '12px 8px' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((member) => {
                      const fullName = `${member.firstName} ${member.lastName}`;
                      const highlightedName = filterText ? highlightSearchTerm(fullName, filterText) : fullName;

                      return (
                        <React.Fragment key={member._id}>
                          <tr className={openDetails[member._id] ? 'active-row' : ''}>
                            <td className="fw-bold" style={{ padding: '12px 8px' }}>
                              <span dangerouslySetInnerHTML={{ __html: highlightedName }} />
                              {member.convocationStatus === 'RescheduleRequested' && (
                                <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: '0.75rem' }}>
                                  Report demandé (autre date)
                                </Badge>
                              )}
                              {member.convocationStatus === 'RescheduledSameDay' && (
                                <Badge bg="info" className="ms-2" style={{ fontSize: '0.75rem' }}>
                                  Changement d'heure demandé
                                </Badge>
                              )}
                            </td>
                            <td style={{ padding: '12px 8px' }}>{member.height} cm</td>
                            <td style={{ padding: '12px 8px' }}>
                              <Badge bg={member.gender === 'Homme' ? 'info' : 'danger'} pill>
                                {member.gender}
                              </Badge>
                            </td>
                            <td style={{ padding: '12px 8px' }}>{new Date(member.birthDate).toLocaleDateString('fr-FR')}</td>
                            {tabType === 'scheduled' && (
                              <>
                                <td style={{ padding: '12px 8px' }}>{member.auditionDate ? formatDate(member.auditionDate) : '—'}</td>
                                <td style={{ padding: '12px 8px' }}>
                                  {member.auditionStartTime && member.auditionEndTime && (
                                    <Badge bg="info" className="px-3">
                                      {member.auditionStartTime} - {member.auditionEndTime}
                                    </Badge>
                                  )}
                                </td>
                              </>
                            )}
                            {tabType === 'auditioned' && (
                              <td style={{ padding: '12px 8px' }}>
                                {member.evaluationData && (
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    onClick={() => openEvaluationModal(member.evaluationData)}
                                    title="Voir détails de l'évaluation"
                                  >
                                    <FaEye className="me-1" />
                                    Évaluation
                                  </Button>
                                )}
                              </td>
                            )}
                            <td style={{ padding: '12px 8px' }}>
                              <Badge bg={member.hasMusicalKnowledge ? 'warning' : 'secondary'}>
                                {member.hasMusicalKnowledge ? 'Oui' : 'Non'}
                              </Badge>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <Badge bg={member.isActiveInOtherChoir ? 'warning' : 'secondary'}>
                                {member.isActiveInOtherChoir ? 'Oui' : 'Non'}
                              </Badge>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <Button
                                variant={openDetails[member._id] ? 'outline-danger' : 'outline-primary'}
                                size="sm"
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
                            {tabType === 'auditioned' && (
                              <td style={{ padding: '12px 8px' }}>
                                <div className="d-flex gap-2">
                                  <Button variant="danger" size="sm" onClick={() => openRefuseModal(member._id)} title="Refuser">
                                    <FaTimes />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>

                          {/* Details Row */}
                          <tr className={openDetails[member._id] ? 'details-visible' : 'details-hidden'}>
                            <td colSpan={tabType === 'scheduled' ? 9 : tabType === 'auditioned' ? 9 : 7} className="p-0">
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
                                              <Badge bg={member.hasMusicalKnowledge ? 'warning' : 'secondary'}>
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
                                              <Badge bg={member.isActiveInOtherChoir ? 'warning' : 'secondary'}>
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
                                              <Badge bg={member.isSponsored ? 'success' : 'secondary'}>
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
                      );
                    })}
                  </tbody>
                  </Table>
                </div>

                {/* 📱 MOBILE CARD VIEW */}
                <div className="mobile-cards-container">
                  {paginatedData.map((member) => {
                    const fullName = `${member.firstName} ${member.lastName}`;
                    const isExpanded = !!openDetails[member._id];

                    return (
                      <div key={member._id} className={`candidate-mobile-card ${isExpanded ? 'is-expanded' : ''}`}>
                        <div className="candidate-card-header">
                          <h5 className="candidate-name" dangerouslySetInnerHTML={{ __html: filterText ? highlightSearchTerm(fullName, filterText) : fullName }} />
                          <Badge bg={member.gender === 'Homme' ? 'info' : 'danger'} pill>
                            {member.gender}
                          </Badge>
                        </div>

                        <div className="candidate-badges">
                          {tabType === 'scheduled' && member.auditionDate && (
                            <Badge bg="info" className="d-flex align-items-center gap-1">
                              <FaCalendarAlt size={10} /> {formatDate(member.auditionDate)}
                            </Badge>
                          )}
                          {member.convocationStatus === 'RescheduleRequested' && (
                            <Badge bg="warning" text="dark">Report (autre date)</Badge>
                          )}
                          {member.convocationStatus === 'RescheduledSameDay' && (
                            <Badge bg="info">Changement heure</Badge>
                          )}
                          {member.hasMusicalKnowledge && <Badge bg="warning">Musique ✓</Badge>}
                          {member.isActiveInOtherChoir && <Badge bg="warning">Autre chœur ✓</Badge>}
                        </div>

                        <div className="candidate-info-grid">
                          <div className="card-info-item">
                            <span className="card-info-label">Taille</span>
                            <span className="card-info-value">{member.height} cm</span>
                          </div>
                          <div className="card-info-item">
                            <span className="card-info-label">Âge</span>
                            <span className="card-info-value">
                              {Math.floor((new Date() - new Date(member.birthDate)) / (1000 * 60 * 60 * 24 * 365.25))} ans
                            </span>
                          </div>
                          {tabType === 'scheduled' && member.auditionStartTime && (
                            <div className="card-info-item">
                              <span className="card-info-label">Horaire</span>
                              <span className="card-info-value">
                                {member.auditionStartTime} - {member.auditionEndTime}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="candidate-card-actions">
                          <Button variant={isExpanded ? 'danger' : 'primary'} size="sm" onClick={() => toggleDetails(member._id)}>
                            {isExpanded ? 'Masquer' : 'Voir détails'}
                          </Button>
                          {tabType === 'auditioned' && member.evaluationData && (
                            <Button variant="outline-info" size="sm" onClick={() => openEvaluationModal(member.evaluationData)}>
                              Évaluation
                            </Button>
                          )}
                          {tabType === 'auditioned' && (
                            <Button variant="outline-danger" size="sm" onClick={() => openRefuseModal(member._id)}>
                              Refuser
                            </Button>
                          )}
                        </div>

                        {/* Mobile Expanded Details */}
                        {isExpanded && (
                          <div className="candidate-expanded-details mt-3 pt-3 border-top">
                            {/* Personal & Identity */}
                            <div className="details-section mb-3">
                              <div className="details-section-header">
                                <FaUser className="icon" />
                                <h6>Personnel & Identité</h6>
                              </div>
                              <div className="details-section-content">
                                <div className="info-item">
                                  <span className="info-label">Email</span>
                                  <span className="info-value text-break text-primary fw-500">{member.email}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Téléphone</span>
                                  <span className="info-value">
                                    {member.phoneCountryCode} {member.phone}
                                  </span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Date de naissance</span>
                                  <span className="info-value">{new Date(member.birthDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Identité</span>
                                  <span className="info-value">
                                    {member.identityType}: {member.identityNumber || '—'}
                                  </span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Nationalité</span>
                                  <span className="info-value">{member.nationality}</span>
                                </div>
                                <div className="info-item">
                                  <span className="info-label">Taille</span>
                                  <span className="info-value">{member.height} cm</span>
                                </div>
                              </div>
                            </div>

                            {/* Musical Info */}
                            <div className="details-section mb-3">
                              <div className="details-section-header">
                                <FaMusic className="icon" />
                                <h6>Musique</h6>
                              </div>
                              <div className="details-section-content">
                                <div className="info-item">
                                  <span className="info-label">Connaissances musicales</span>
                                  <Badge bg={member.hasMusicalKnowledge ? 'warning' : 'secondary'} className="w-fit">
                                    {member.hasMusicalKnowledge ? 'Oui' : 'Non'}
                                  </Badge>
                                </div>
                                {member.hasMusicalKnowledge && member.musicalExperience && (
                                  <div className="info-item mt-2">
                                    <span className="info-label">Expérience</span>
                                    <span className="info-value small fst-italic">{member.musicalExperience}</span>
                                  </div>
                                )}
                                <div className="info-item mt-2">
                                  <span className="info-label">Active dans un autre chœur</span>
                                  <Badge bg={member.isActiveInOtherChoir ? 'warning' : 'secondary'} className="w-fit">
                                    {member.isActiveInOtherChoir ? 'Oui' : 'Non'}
                                  </Badge>
                                </div>
                                {member.isActiveInOtherChoir && member.otherChoir && (
                                  <div className="info-item mt-2">
                                    <span className="info-label">Nom du chœur</span>
                                    <span className="info-value">{member.otherChoir}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Professional Info */}
                            <div className="details-section mb-3">
                              <div className="details-section-header">
                                <FaClock className="icon" />
                                <h6>Professionnel</h6>
                              </div>
                              <div className="details-section-content">
                                <div className="info-item">
                                  <span className="info-label">Situation professionnelle</span>
                                  <span className="info-value">{member.professionalSituation || 'Non spécifiée'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Sponsorship */}
                            <div className="details-section mb-3">
                              <div className="details-section-header">
                                <FaUserCheck className="icon" />
                                <h6>Parrainage</h6>
                              </div>
                              <div className="details-section-content">
                                <div className="info-item">
                                  <span className="info-label">Statut</span>
                                  <Badge bg={member.isSponsored ? 'success' : 'secondary'} className="w-fit">
                                    {member.isSponsored ? 'Parrainé' : 'Non parrainé'}
                                  </Badge>
                                </div>
                                {member.isSponsored && member.sponsorName && (
                                  <div className="info-item mt-2">
                                    <span className="info-label">Nom du parrain</span>
                                    <span className="info-value">{member.sponsorName}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Motivation */}
                            {member.motivation && (
                              <div className="motivation-section mb-3">
                                <div className="motivation-header">
                                  <FaQuoteLeft className="quote-icon" />
                                  <h6>Motivation</h6>
                                </div>
                                <div className="motivation-content">
                                  <p className="small fst-italic">{member.motivation}</p>
                                </div>
                              </div>
                            )}

                            {/* Rejection Reason (if any) */}
                            {member.rejectionReason && member.memberstatus === 'Refused' && (
                              <div className="details-section mb-3 border border-danger">
                                <div className="details-section-header bg-danger-subtle">
                                  <FaTimes className="text-danger me-2" />
                                  <h6 className="text-danger">Raison du refus</h6>
                                </div>
                                <div className="details-section-content">
                                  <p className="small text-danger fw-500 mb-0">{member.rejectionReason}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ✅ RESPONSIVE: Pagination */}
                {filteredMemberships.length > 0 && (
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
                    <div className="d-flex align-items-center order-2 order-md-1">
                      <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                        <span className="d-none d-sm-inline">Candidats par page:</span>
                        <span className="d-sm-none">Par page:</span>
                      </span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto', fontSize: '13px' }}
                        value={pagination.itemsPerPage}
                        onChange={(e) => handlePageSizeChange(tabType, Number(e.target.value))}
                      >
                        {pageSizeOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-muted order-1 order-md-2" style={{ fontSize: '13px' }}>
                      {startIndex}-{endIndex} sur {filteredMemberships.length}
                    </div>

                    <div className="d-flex align-items-center order-3">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(tabType, 0)}
                        disabled={isFirstPage}
                        className="me-1"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstPage ? '#6c757d' : '#495057',
                          padding: '4px 8px'
                        }}
                        title="Première page"
                      >
                        <FaAngleDoubleLeft size={12} />
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(tabType, pagination.currentPage - 1)}
                        disabled={isFirstPage}
                        className="me-2 me-md-3"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstPage ? '#6c757d' : '#495057',
                          padding: '4px 8px'
                        }}
                        title="Page précédente"
                      >
                        <FaChevronLeft size={12} />
                      </Button>

                      <span className="mx-2 mx-md-3 text-muted" style={{ fontSize: '13px' }}>
                        <span className="d-none d-sm-inline">Page </span>
                        {pagination.currentPage + 1}
                        <span className="d-none d-sm-inline"> sur {totalPages}</span>
                      </span>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(tabType, pagination.currentPage + 1)}
                        disabled={isLastPage}
                        className="ms-2 ms-md-3 me-1"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastPage ? '#6c757d' : '#495057',
                          padding: '4px 8px'
                        }}
                        title="Page suivante"
                      >
                        <FaChevronRight size={12} />
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(tabType, totalPages - 1)}
                        disabled={isLastPage}
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastPage ? '#6c757d' : '#495057',
                          padding: '4px 8px'
                        }}
                        title="Dernière page"
                      >
                        <FaAngleDoubleRight size={12} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <Container className="membership-container">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="text-white d-flex justify-content-between align-items-center">
          <div>
            <Badge bg="light" text="primary" pill className="me-2">
              En attente: {pendingMemberships.length}
            </Badge>
            <Badge bg="light" text="warning" pill className="me-2">
              Tests programmés: {scheduledMemberships.length}
            </Badge>
            <Badge bg="light" text="success" pill>
              Auditions effectuées: {auditionedMemberships.length}
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
                  <span className="d-none d-sm-inline">En attente d'audition</span>
                  <span className="d-sm-none">En attente</span>
                </span>
              }
            >
              {renderMembershipTable(pendingMemberships, isLoadingPending, filterTextPending, setFilterTextPending, 'pending')}
            </Tab>

            <Tab
              eventKey="scheduled"
              title={
                <span>
                  <Badge bg="warning" pill className="me-2">
                    {scheduledMemberships.length}
                  </Badge>
                  <span className="d-none d-sm-inline">Audition programmée</span>
                  <span className="d-sm-none">Programmée</span>
                </span>
              }
            >
              {renderMembershipTable(scheduledMemberships, isLoadingScheduled, filterTextScheduled, setFilterTextScheduled, 'scheduled')}
            </Tab>

            <Tab
              eventKey="auditioned"
              title={
                <span>
                  <Badge bg="success" pill className="me-2">
                    {auditionedMemberships.length}
                  </Badge>
                  <span className="d-none d-sm-inline">Audition effectuée</span>
                  <span className="d-sm-none">Effectuée</span>
                </span>
              }
            >
              {renderMembershipTable(
                auditionedMemberships,
                isLoadingAuditioned,
                filterTextAuditioned,
                setFilterTextAuditioned,
                'auditioned'
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Evaluation Details Modal */}
      <Modal show={showEvaluationModal} onHide={() => setShowEvaluationModal(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye className="me-2" />
            Détails de l'évaluation
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedEvaluationData && (
            <div className="evaluation-content">
              <Row>
                <Col md={6}>
                  <div className="details-section">
                    <div className="details-section-header">
                      <FaMusic className="icon" />
                      <h6>Évaluation</h6>
                    </div>
                    <div className="details-section-content">
                      <div className="info-item">
                        <span className="info-label">Tessiture</span>
                        <span className="info-value">{selectedEvaluationData.tessiture}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Note</span>
                        <Badge bg="primary">{selectedEvaluationData.note}</Badge>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Œuvre chantée</span>
                        <span className="info-value">{selectedEvaluationData.oeuvreChante}</span>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="details-section">
                    <div className="details-section-header">
                      <FaCheck className="icon" />
                      <h6>Décision</h6>
                    </div>
                    <div className="details-section-content">
                      <div className="info-item">
                        <span className="info-label">Statut</span>
                        <Badge
                          bg={
                            selectedEvaluationData.decision === 'Retenu'
                              ? 'success'
                              : selectedEvaluationData.decision === 'Non Retenu'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {selectedEvaluationData.decision}
                        </Badge>
                      </div>
                      {selectedEvaluationData.ordrePassage && (
                        <div className="info-item">
                          <span className="info-label">Ordre de passage</span>
                          <span className="info-value">{selectedEvaluationData.ordrePassage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>

              {selectedEvaluationData.remarque && (
                <div className="details-section mt-3">
                  <div className="details-section-header">
                    <FaQuoteLeft className="icon" />
                    <h6>Remarques</h6>
                  </div>
                  <div className="details-section-content">
                    <div className="info-item">
                      <span className="info-value">{selectedEvaluationData.remarque}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEvaluationModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

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
