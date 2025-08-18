/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Spinner, Button, Container, Badge, Form, InputGroup, Tabs, Tab } from 'react-bootstrap';
import Select from 'react-select';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminDashboard, getManagerDashboard, getChoristeDashboard, getChefDeChoeurDashboard } from '../../services/dashboard.service';
import { getParticipationThreshold, updateParticipationThreshold } from '../../services/config.service';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  FaCalendarCheck,
  FaCalendarAlt,
  FaUsers,
  FaFileAlt,
  FaClock,
  FaHistory,
  FaMusic,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaFilter,
  FaCheck,
  FaTimes,
  FaClipboardList,
  FaCog,
  FaFileExport,
  FaEye
} from 'react-icons/fa';
import { Search, Calendar, Music } from 'lucide-react';

const Toast = withReactContent(Swal).mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true
});

// ✅ CUSTOM REACT-SELECT STYLES
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    boxShadow: 'none',
    minHeight: '42px',
    fontSize: '14px',
    '&:hover': {
      borderColor: '#d1d5db'
    },
    '&:focus-within': {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '14px',
    padding: '10px 16px',
    backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    '&:hover': {
      backgroundColor: state.isSelected ? '#3b82f6' : '#f3f4f6'
    }
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
    fontSize: '14px'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#374151',
    fontSize: '14px'
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  }),
  menuList: (provided) => ({
    ...provided,
    padding: '4px'
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': {
      color: '#6b7280'
    }
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': {
      color: '#6b7280'
    }
  })
};

const SummaryCard = ({ icon, title, value, variant, subtitle }) => (
  <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '12px' }}>
    <Card.Body>
      <Row className="align-items-center">
        <Col xs={3} className="text-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: '50px',
              height: '50px',
              backgroundColor: `${variant}20`,
              color: variant
            }}
          >
            {icon}
          </div>
        </Col>
        <Col xs={9}>
          <h6 className="text-muted mb-1 fw-semibold">{title}</h6>
          <h3 className="mb-0 fw-bold" style={{ color: variant }}>
            {value}
          </h3>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

const ParticipationThresholdCard = () => {
  const [threshold, setThreshold] = useState(null);
  const [savedValue, setSavedValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getParticipationThreshold()
      .then((value) => {
        setThreshold(value);
        setSavedValue(String(value));
      })
      .catch(() => {
        Toast.fire({ icon: 'error', title: 'Erreur de chargement du seuil.' });
      })
      .finally(() => setLoading(false));
  }, []);

  const validationSchema = Yup.object().shape({
    seuil: Yup.string()
      .required('Le seuil est requis')
      .test('is-number', 'Le seuil doit être un nombre valide', (value) => !isNaN(value))
      .test('is-in-range', 'Le seuil doit être entre 0 et 100', (value) => {
        const number = Number(value);
        return number >= 0 && number <= 100;
      })
  });

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await updateParticipationThreshold(Number(values.seuil));
      setSavedValue(values.seuil);
      Toast.fire({ icon: 'success', title: 'Seuil mis à jour !' });
    } catch {
      Toast.fire({ icon: 'error', title: 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="mt-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <Card.Header className="bg-white border-0 fw-semibold">Seuil de participation requis (%)</Card.Header>
        <Card.Body className="text-center">
          <Spinner animation="border" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <Card.Header className="bg-white border-0 fw-semibold">Seuil de participation requis (%)</Card.Header>
      <Card.Body>
        <Formik
          initialValues={{ seuil: String(threshold) }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
          enableReinitialize
        >
          {({ isSubmitting, errors, isValid, values }) => {
            const hasChangedSinceLastSave = values.seuil !== savedValue;
            const canSubmit = isValid && hasChangedSinceLastSave && !saving && !isSubmitting;

            return (
              <FormikForm>
                <Field name="seuil">
                  {({ field, form }) => (
                    <input
                      {...field}
                      type="text"
                      className={`form-control ${form.errors.seuil ? 'is-invalid' : ''}`}
                      inputMode="numeric"
                      style={{ borderRadius: '8px' }}
                      onChange={(e) => {
                        form.setFieldValue('seuil', e.target.value);
                        form.setFieldTouched('seuil', true, true);
                      }}
                    />
                  )}
                </Field>
                <ErrorMessage name="seuil" component="div" className="text-danger mt-1" />
                <Button type="submit" className="mt-2" disabled={!canSubmit} style={{ borderRadius: '8px' }}>
                  {saving ? 'Mise à jour…' : 'Mettre à jour'}
                </Button>
              </FormikForm>
            );
          }}
        </Formik>
      </Card.Body>
    </Card>
  );
};

// ✅ PROFESSIONAL PAGINATION COMPONENT WITH REACT-SELECT
const PaginationControls = ({ currentPage, itemsPerPage, totalItems, pageSizeOptions, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = totalItems === 0 ? 0 : currentPage * itemsPerPage + 1;
  const endIndex = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  const goToFirstPage = () => onPageChange(0);
  const goToPreviousPage = () => onPageChange(Math.max(0, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages - 1, currentPage + 1));
  const goToLastPage = () => onPageChange(totalPages - 1);

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  if (totalPages <= 1) return null;

  // ✅ PAGE SIZE OPTIONS FOR REACT-SELECT
  const pageSizeSelectOptions = pageSizeOptions.map((size) => ({
    value: size,
    label: size.toString()
  }));

  const selectedPageSize = { value: itemsPerPage, label: itemsPerPage.toString() };

  return (
    <div className="d-flex justify-content-between align-items-center p-3 mt-3 border-top bg-light rounded">
      <div className="d-flex align-items-center">
        <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
          Éléments par page:
        </span>
        <div style={{ minWidth: '80px' }}>
          <Select
            options={pageSizeSelectOptions}
            value={selectedPageSize}
            onChange={(option) => onPageSizeChange(option.value)}
            isSearchable={false}
            styles={{
              ...customSelectStyles,
              control: (provided) => ({
                ...provided,
                minHeight: '32px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '13px'
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: '13px',
                padding: '6px 12px'
              })
            }}
          />
        </div>
      </div>

      <div className="text-muted" style={{ fontSize: '14px' }}>
        {startIndex}-{endIndex} sur {totalItems}
      </div>

      <div className="d-flex align-items-center">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={goToFirstPage}
          disabled={isFirstPage}
          className="me-1"
          style={{ border: 'none', backgroundColor: 'transparent' }}
        >
          <FaAngleDoubleLeft />
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={goToPreviousPage}
          disabled={isFirstPage}
          className="me-3"
          style={{ border: 'none', backgroundColor: 'transparent' }}
        >
          <FaChevronLeft />
        </Button>
        <span className="mx-3 text-muted" style={{ fontSize: '14px' }}>
          Page {currentPage + 1} sur {totalPages}
        </span>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={goToNextPage}
          disabled={isLastPage}
          className="ms-3 me-1"
          style={{ border: 'none', backgroundColor: 'transparent' }}
        >
          <FaChevronRight />
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={goToLastPage}
          disabled={isLastPage}
          style={{ border: 'none', backgroundColor: 'transparent' }}
        >
          <FaAngleDoubleRight />
        </Button>
      </div>
    </div>
  );
};

// ✅ CHORISTE DASHBOARD COMPONENT
const ChoristeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ FILTERING STATES WITH REACT-SELECT FORMAT
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState({ value: 'all', label: 'Toutes les années' });
  const [selectedOeuvre, setSelectedOeuvre] = useState({ value: 'all', label: 'Toutes les œuvres' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ✅ PAGINATION STATE FOR CONCERTS
  const [concertsCurrentPage, setConcertsCurrentPage] = useState(0);
  const [concertsItemsPerPage, setConcertsItemsPerPage] = useState(10);
  const concertsPageSizeOptions = [5, 10, 25, 50];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getChoristeDashboard();
        setData(res);
      } catch (err) {
        setError("Impossible de charger votre historique d'activité.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // ✅ RESET PAGINATION WHEN FILTERS CHANGE
  useEffect(() => {
    setConcertsCurrentPage(0);
  }, [searchTerm, selectedYear, selectedOeuvre, startDate, endDate]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 text-muted">Chargement de votre activité...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-5">
        <h5 className="text-danger">{error}</h5>
      </Container>
    );
  }

  // ✅ PREPARE OPTIONS FOR REACT-SELECT
  const yearOptions = [
    { value: 'all', label: 'Toutes les années' },
    ...(data?.availableYears?.map((year) => ({
      value: year.toString(),
      label: year.toString()
    })) || [])
  ];

  const oeuvreOptions = [
    { value: 'all', label: 'Toutes les œuvres' },
    ...(data?.availableOeuvres?.map((oeuvre) => ({
      value: oeuvre._id,
      label: `${oeuvre.title} - ${oeuvre.composers?.join(', ')}`
    })) || [])
  ];

  // ✅ ADVANCED FILTERING FOR CONCERTS
  const filteredConcerts =
    data?.concertsParticipated?.filter((concert) => {
      // Filter by œuvre search term
      const matchesSearch =
        searchTerm === '' ||
        concert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        concert.programme?.some((oeuvre) => oeuvre.title.toLowerCase().includes(searchTerm.toLowerCase()));

      // Handle null values for selectedYear
      const matchesYear =
        !selectedYear || selectedYear.value === 'all' || new Date(concert.dateHeure).getFullYear().toString() === selectedYear.value;

      // Handle null values for selectedOeuvre
      const matchesOeuvre =
        !selectedOeuvre || selectedOeuvre.value === 'all' || concert.programme?.some((oeuvre) => oeuvre._id === selectedOeuvre.value);

      // Filter by date range
      const concertDate = new Date(concert.dateHeure);
      const matchesStartDate = startDate === '' || concertDate >= new Date(startDate);
      const matchesEndDate = endDate === '' || concertDate <= new Date(endDate);

      return matchesSearch && matchesYear && matchesOeuvre && matchesStartDate && matchesEndDate;
    }) || [];

  // ✅ PAGINATION FUNCTIONS FOR CONCERTS
  const getPaginatedConcerts = () => {
    const start = concertsCurrentPage * concertsItemsPerPage;
    return filteredConcerts.slice(start, start + concertsItemsPerPage);
  };

  const handleConcertsPageSizeChange = (newSize) => {
    setConcertsItemsPerPage(newSize);
    setConcertsCurrentPage(0);
  };

  // ✅ SAFE HANDLERS FOR REACT-SELECT CHANGES
  const handleYearChange = (selectedOption) => {
    setSelectedYear(selectedOption || { value: 'all', label: 'Toutes les années' });
  };

  const handleOeuvreChange = (selectedOption) => {
    setSelectedOeuvre(selectedOption || { value: 'all', label: 'Toutes les œuvres' });
  };

  return (
    <Container fluid className="py-4" style={{ maxWidth: '1400px' }}>
      {/* ✅ HEADER */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">
          <FaHistory className="me-3 text-primary" />
          Mon Historique d'Activité
        </h2>
        <p className="text-muted mb-0">Consultez votre participation aux concerts et répétitions</p>
      </div>

      {/* ✅ SIMPLIFIED STATISTICS */}
      <Row className="mb-4 g-4">
        <Col lg={6} md={6}>
          <SummaryCard
            icon={<FaMusic size={24} />}
            title="Concerts Participés"
            value={data?.statistics?.totalConcerts || 0}
            variant="#3b82f6"
            subtitle="Total de participations"
          />
        </Col>
        <Col lg={6} md={6}>
          <SummaryCard
            icon={<FaCalendarAlt size={24} />}
            title="Répétitions Assistées"
            value={data?.statistics?.totalRepetitions || 0}
            variant="#10b981"
            subtitle="Total de présences"
          />
        </Col>
      </Row>

      {/* ✅ ADVANCED FILTERS CARD */}
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
          <h5 className="fw-semibold mb-0">
            <FaFilter className="text-primary me-2" />
            Filtrer les concerts
          </h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-3">
            {/* Search by œuvre */}
            <Col md={6}>
              <label className="form-label fw-semibold mb-2">
                <Search size={16} className="me-2" />
                Rechercher par œuvre ou concert
              </label>
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
                  placeholder="Tapez le nom d'une œuvre ou d'un concert..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderColor: '#e5e7eb',
                    fontSize: '14px',
                    borderRadius: '0 12px 12px 0'
                  }}
                />
              </InputGroup>
            </Col>

            {/* Filter by specific œuvre with React-Select */}
            <Col md={3}>
              <label className="form-label fw-semibold mb-2">
                <Music size={16} className="me-2" />
                Œuvre spécifique
              </label>
              <Select
                options={oeuvreOptions}
                value={selectedOeuvre}
                onChange={handleOeuvreChange}
                placeholder="Sélectionner une œuvre..."
                isSearchable
                styles={customSelectStyles}
              />
            </Col>

            {/* Filter by year with React-Select */}
            <Col md={3}>
              <label className="form-label fw-semibold mb-2">
                <Calendar size={16} className="me-2" />
                Année
              </label>
              <Select
                options={yearOptions}
                value={selectedYear}
                onChange={handleYearChange}
                placeholder="Sélectionner une année..."
                isSearchable={false}
                styles={customSelectStyles}
              />
            </Col>

            {/* Date range filters */}
            <Col md={3}>
              <label className="form-label fw-semibold mb-2">Date de début</label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ borderRadius: '12px', borderColor: '#e5e7eb', fontSize: '14px' }}
              />
            </Col>

            <Col md={3}>
              <label className="form-label fw-semibold mb-2">Date de fin</label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ borderRadius: '12px', borderColor: '#e5e7eb', fontSize: '14px' }}
              />
            </Col>

            <Col md={6} className="d-flex align-items-end">
              <div>
                <small className="text-muted">
                  <strong>{filteredConcerts.length}</strong> concert(s) trouvé(s)
                  {searchTerm && ` pour "${searchTerm}"`}
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ✅ CONCERTS TABLE */}
      <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
        <Card.Header className="bg-white border-0 pt-4 px-4 pb-3">
          <h5 className="fw-semibold mb-0">
            <FaMusic className="text-primary me-2" />
            Mes Concerts ({data?.statistics?.totalConcerts || 0})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredConcerts.length === 0 ? (
            <div className="text-center py-5">
              <FaMusic size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Aucun concert trouvé</h5>
              <p className="text-muted">
                {searchTerm ||
                (selectedOeuvre && selectedOeuvre.value !== 'all') ||
                (selectedYear && selectedYear.value !== 'all') ||
                startDate ||
                endDate
                  ? 'Aucun concert ne correspond aux filtres sélectionnés'
                  : "Vous n'avez participé à aucun concert pour le moment"}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th className="border-0 py-3 px-4 fw-semibold">Concert</th>
                      <th className="border-0 py-3 px-4 fw-semibold">Date</th>
                      <th className="border-0 py-3 px-4 fw-semibold">Lieu</th>
                      <th className="border-0 py-3 px-4 fw-semibold">Œuvres Interprétées</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedConcerts().map((concert, index) => (
                      <tr key={concert._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td className="border-0 py-3 px-4">
                          <div className="fw-semibold text-dark">{concert.title}</div>
                        </td>
                        <td className="border-0 py-3 px-4">
                          <div className="d-flex align-items-center">
                            <Calendar size={16} className="text-primary me-2" />
                            <span style={{ fontSize: '14px' }}>
                              {new Date(concert.dateHeure).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="border-0 py-3 px-4">
                          <span style={{ fontSize: '14px' }}>{concert.location}</span>
                        </td>
                        <td className="border-0 py-3 px-4">
                          <div className="d-flex flex-wrap gap-1">
                            {concert.programme?.map((oeuvre, idx) => (
                              <Badge key={idx} bg="primary" className="me-1 mb-1" style={{ fontSize: '12px' }}>
                                <Music size={12} className="me-1" />
                                {oeuvre.title}
                              </Badge>
                            )) || <em className="text-muted">Aucune œuvre renseignée</em>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* ✅ CONCERTS PAGINATION */}
              <PaginationControls
                currentPage={concertsCurrentPage}
                itemsPerPage={concertsItemsPerPage}
                totalItems={filteredConcerts.length}
                pageSizeOptions={concertsPageSizeOptions}
                onPageChange={setConcertsCurrentPage}
                onPageSizeChange={handleConcertsPageSizeChange}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

// ✅ USERS BY ROLE TABLE
const UsersByRoleTable = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25];

  if (!data?.usersByRole) return null;

  const roles = Object.entries(data.usersByRole).map(([roleKey, count]) => {
    const label =
      {
        admin: 'Admins',
        manager: 'Managers',
        choriste: 'Choristes',
        'chef de choeur': 'Chef de chœur'
      }[roleKey] || roleKey;
    return { key: roleKey, label, count };
  });

  const getPaginatedRoles = () => {
    const start = currentPage * itemsPerPage;
    return roles.slice(start, start + itemsPerPage);
  };

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0);
  };

  return (
    <div>
      <div className="table-responsive">
        <Table bordered hover size="sm" className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Rôle</th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedRoles().map(({ key, label, count }) => (
              <tr key={key}>
                <td>{label}</td>
                <td>
                  <Badge bg="primary">{count}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={roles.length}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

// ✅ COMPLETE MANAGER LEAVE REQUESTS TABLE WITH REAL DATA
const ManagerTable = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const pageSizeOptions = [5, 10, 25, 50];

  // ✅ Choose which data to show
  const leaveRequests = showAllRequests ? data.allLeaveRequestsDetails || [] : data.pendingLeaveRequestsDetails || [];

  const count = leaveRequests.length;

  const getPaginatedRequests = () => {
    const start = currentPage * itemsPerPage;
    return leaveRequests.slice(start, start + itemsPerPage);
  };

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0);
  };

  const handleToggleView = () => {
    setShowAllRequests(!showAllRequests);
    setCurrentPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge bg="warning" text="dark">
            En attente
          </Badge>
        );
      case 'approved':
        return <Badge bg="success">Accepté</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejeté</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div>
      {/* ✅ Toggle View Button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          {showAllRequests ? 'Toutes les demandes' : 'Demandes en attente'}
          <Badge bg="info" className="ms-2">
            {count}
          </Badge>
        </h6>
        <Button variant="outline-primary" size="sm" onClick={handleToggleView} style={{ borderRadius: '8px' }}>
          {showAllRequests ? 'Voir en attente seulement' : 'Voir toutes les demandes'}
        </Button>
      </div>

      <div className="table-responsive">
        <Table hover size="sm" className="mb-0 align-middle">
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th className="border-0 py-3 fw-semibold">#</th>
              <th className="border-0 py-3 fw-semibold">Utilisateur</th>
              <th className="border-0 py-3 fw-semibold">Période</th>
              <th className="border-0 py-3 fw-semibold">Durée</th>
              <th className="border-0 py-3 fw-semibold">Raison</th>
              <th className="border-0 py-3 fw-semibold">Demandé le</th>
              <th className="border-0 py-3 fw-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  {showAllRequests ? 'Aucune demande de congé trouvée' : 'Aucune demande de congé en attente'}
                </td>
              </tr>
            ) : (
              getPaginatedRequests().map((request, index) => (
                <tr key={request._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="border-0 py-3">{currentPage * itemsPerPage + index + 1}</td>
                  <td className="border-0 py-3">
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: '14px' }}>
                        {request.user?.firstName} {request.user?.lastName}
                      </div>
                      <small className="text-muted">{request.user?.email}</small>
                    </div>
                  </td>
                  <td className="border-0 py-3">
                    <div style={{ fontSize: '13px' }}>
                      <div>
                        <strong>Du:</strong> {formatDate(request.startDate)}
                      </div>
                      <div>
                        <strong>Au:</strong> {formatDate(request.endDate)}
                      </div>
                    </div>
                  </td>
                  <td className="border-0 py-3">
                    <Badge bg="info" className="px-2">
                      {getDuration(request.startDate, request.endDate)} jour(s)
                    </Badge>
                  </td>
                  <td className="border-0 py-3">
                    <div style={{ fontSize: '13px', maxWidth: '200px' }}>
                      {request.reason ? <span>{request.reason}</span> : <em className="text-muted">Non spécifiée</em>}
                    </div>
                  </td>
                  <td className="border-0 py-3">
                    <small className="text-muted">{formatDateTime(request.createdAt)}</small>
                  </td>
                  <td className="border-0 py-3">{renderStatusBadge(request.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {count > 0 && (
        <PaginationControls
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={count}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
};

const ManagerDashboard = ({ data }) => {
  return (
    <div style={{ padding: '20px' }}>
      {/* ✅ SIMPLIFIED STATISTICS CARDS - ONLY 3 CARDS */}
      <Row className="mb-4">
        <Col xl={4} lg={6} md={6} className="mb-3">
          <SummaryCard
            icon={<FaFileAlt size={20} />}
            title="En Attente"
            value={data.leaveRequestsCount || 0}
            variant="#f59e0b"
            subtitle="À examiner"
          />
        </Col>
        <Col xl={4} lg={6} md={6} className="mb-3">
          <SummaryCard
            icon={<FaCheck size={20} />}
            title="Acceptées"
            value={data.approvedLeaveRequests || 0}
            variant="#10b981"
            subtitle="Approuvées"
          />
        </Col>
        <Col xl={4} lg={6} md={6} className="mb-3">
          <SummaryCard
            icon={<FaUsers size={20} />}
            title="Choristes Actifs"
            value={data.activeChoristesCount || 0}
            variant="#8b5cf6"
            subtitle="En activité"
          />
        </Col>
      </Row>

      {/* ✅ LEAVE REQUESTS TABLE */}
      <Row>
        <Col>
          <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="fw-semibold mb-1">
                    <FaClipboardList className="text-primary me-2" />
                    Gestion des Demandes de Congé
                  </h5>
                  <small className="text-muted">Gérez les demandes de congé des choristes</small>
                </div>
                <Badge bg="primary" className="px-3 py-2">
                  Total: {data.totalLeaveRequests || 0}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <ManagerTable data={data} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const ChefDeChoeurDashboard = ({ data }) => {
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ✅ HEADER SECTION */}
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">
          <FaMusic className="me-3 text-primary" />
          Tableau de Bord - Chef de Chœur
        </h2>
        <p className="text-muted mb-0">Vue d'ensemble des activités du chœur</p>
      </div>

      {/* ✅ OPTIMAL CARD LAYOUT: 5 cards in 2 rows with proper spacing */}
      <Row className="g-4 mb-5">
        {/* First Row - 3 cards */}
        <Col xl={4} lg={4} md={6} sm={12}>
          <SummaryCard
            icon={<FaCalendarCheck size={20} />}
            title="Concerts passés"
            value={data.concerts?.past || 0}
            variant="#10b981"
            subtitle="Événements terminés"
          />
        </Col>
        <Col xl={4} lg={4} md={6} sm={12}>
          <SummaryCard
            icon={<FaCalendarAlt size={20} />}
            title="Concerts à venir"
            value={data.concerts?.upcoming || 0}
            variant="#3b82f6"
            subtitle="Événements planifiés"
          />
        </Col>
        <Col xl={4} lg={4} md={6} sm={12}>
          <SummaryCard
            icon={<FaUsers size={20} />}
            title="Choristes actifs"
            value={data.activeChoristesCount || 0}
            variant="#8b5cf6"
            subtitle="Membres actifs"
          />
        </Col>
      </Row>

      {/* Second Row - 2 cards centered */}
      <Row className="g-4 mb-5 justify-content-center">
        <Col xl={4} lg={4} md={6} sm={12}>
          <SummaryCard
            icon={<FaHistory size={20} />}
            title="Répétitions à venir"
            value={data.repetitions?.upcoming || 0}
            variant="#f59e0b"
            subtitle="Sessions planifiées"
          />
        </Col>
        <Col xl={4} lg={4} md={6} sm={12}>
          <SummaryCard
            icon={<FaClock size={20} />}
            title="Répétitions passées"
            value={data.repetitions?.past || 0}
            variant="#ef4444"
            subtitle="Sessions terminées"
          />
        </Col>
      </Row>

      {/* ✅ USERS BY ROLE TABLE */}
      <Row>
        <Col>
          <Card className="shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <Card.Header className="bg-white border-0 pt-4 px-4 pb-3">
              <h5 className="fw-semibold mb-0">
                <FaUsers className="text-primary me-2" />
                Répartition des Utilisateurs
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <UsersByRoleTable data={data} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// ✅ MAIN DASHBOARD COMPONENT
const Dashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ✅ UPDATED: Include chef de choeur in data fetching
    if (userRole === 'admin' || userRole === 'manager' || userRole === 'chef de choeur') {
      const fetchDashboard = async () => {
        try {
          let res;
          if (userRole === 'admin') {
            res = await getAdminDashboard();
          } else if (userRole === 'manager') {
            res = await getManagerDashboard();
          } else if (userRole === 'chef de choeur') {
            res = await getChefDeChoeurDashboard(); // ✅ NEW: Fetch chef de chœur data
          }
          setData(res);
        } catch {
          setError('Impossible de charger le tableau de bord.');
        } finally {
          setLoading(false);
        }
      };
      fetchDashboard();
    } else if (userRole === 'choriste') {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userRole]);

  // ✅ CHORISTE DASHBOARD
  if (userRole === 'choriste') {
    return <ChoristeDashboard />;
  }

  if (!userRole || loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <div>Chargement…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5 text-danger">
        <h5>{error}</h5>
      </div>
    );
  }

  return (
    <div>
      {/* ✅ ADMIN DASHBOARD - WITH PARTICIPATION THRESHOLD */}
      {userRole === 'admin' && data && (
        <div style={{ padding: '20px' }}>
          <Row>
            <Col xl={3}>
              <SummaryCard icon={<FaCalendarCheck />} title="Concerts passés" value={data.concerts?.past || 0} variant="#1abc9c" />
            </Col>
            <Col xl={3}>
              <SummaryCard icon={<FaCalendarAlt />} title="Concerts à venir" value={data.concerts?.upcoming || 0} variant="#3498db" />
            </Col>
            <Col xl={3}>
              <SummaryCard icon={<FaUsers />} title="Choristes actifs" value={data.activeChoristesCount || 0} variant="#9b59b6" />
            </Col>
            <Col xl={3}>
              <SummaryCard icon={<FaCalendarAlt />} title="Répétitions à venir" value={data.repetitions?.upcoming || 0} variant="#e67e22" />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col xl={3}>
              <SummaryCard icon={<FaClock />} title="Répétitions passées" value={data.repetitions?.past || 0} variant="#2ecc71" />
            </Col>
          </Row>
          <Row className="mt-4">
            <Col>
              <Card className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white border-0 fw-semibold">Utilisateurs par rôle</Card.Header>
                <Card.Body>
                  <UsersByRoleTable data={data} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {/* ✅ PARTICIPATION THRESHOLD - ONLY FOR ADMIN */}
          <Row>
            <Col>
              <ParticipationThresholdCard />
            </Col>
          </Row>
        </div>
      )}

      {/* ✅ MANAGER DASHBOARD */}
      {userRole === 'manager' && data && <ManagerDashboard data={data} />}

      {/* ✅ CHEF DE CHŒUR DASHBOARD - WITHOUT PARTICIPATION THRESHOLD */}
      {userRole === 'chef de choeur' && data && <ChefDeChoeurDashboard data={data} />}
    </div>
  );
};

export default Dashboard;
