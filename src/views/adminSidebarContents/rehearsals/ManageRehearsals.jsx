/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useEffect, useState } from 'react';
import {
  getRepetitions,
  createRepetition,
  updateRepetition
  // deleteRepetitionPermanent,
} from '../../../services/repetition.service';
import { getConcerts } from '../../../services/concert.service';
import { Button, Form, Modal, Table, Row, Col, Spinner, InputGroup, Container, Card, Badge } from 'react-bootstrap';
import { Search, Users, Plus } from 'lucide-react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Swal from 'sweetalert2';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaCheck, FaMicrophone } from 'react-icons/fa';

// Fixed "Lieu" choices:
const lieuOptions = [
  { value: 'Boulevard des arts', label: 'Boulevard des arts' },
  { value: 'AMI Assurances', label: 'AMI Assurances' }
];

// ✅ BEAUTIFUL PUPITRE SELECTOR COMPONENT
const PupitreSelector = ({ selectedPupitres, onChange, touched, error }) => {
  const pupitreOptions = [
    { value: 'soprano', label: 'Soprano', color: '#e11d48' },
    { value: 'alto', label: 'Alto', color: '#f59e0b' },
    { value: 'ténor', label: 'Ténor', color: '#10b981' },
    { value: 'basse', label: 'Basse', color: '#3b82f6' }
  ];

  const togglePupitre = (pupitre) => {
    const newSelection = selectedPupitres.includes(pupitre)
      ? selectedPupitres.filter((p) => p !== pupitre)
      : [...selectedPupitres, pupitre];
    onChange(newSelection);
  };

  const selectAll = () => {
    onChange(['soprano', 'alto', 'ténor', 'basse']);
  };

  const selectNone = () => {
    onChange([]);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label className="fw-semibold">
        <FaMicrophone className="me-2 text-primary" />
        Pupitres concernés *
      </Form.Label>

      {/* ✅ INTERACTIVE PUPITRE BUTTONS */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {pupitreOptions.map((pupitre) => {
          const isSelected = selectedPupitres.includes(pupitre.value);
          return (
            <Button
              key={pupitre.value}
              variant={isSelected ? 'primary' : 'outline-secondary'}
              size="sm"
              onClick={() => togglePupitre(pupitre.value)}
              className="d-flex align-items-center px-3 py-2 position-relative"
              style={{
                backgroundColor: isSelected ? pupitre.color : 'transparent',
                borderColor: pupitre.color,
                color: isSelected ? 'white' : pupitre.color,
                borderRadius: '20px',
                transition: 'all 0.2s ease',
                fontWeight: '500',
                minWidth: '100px',
                justifyContent: 'center',
                boxShadow: isSelected ? `0 2px 8px ${pupitre.color}40` : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.target.style.backgroundColor = `${pupitre.color}15`;
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              <FaMicrophone className="me-2" size={12} />
              <span>{pupitre.label}</span>
              {isSelected && (
                <FaCheck
                  className="ms-2 position-absolute"
                  size={10}
                  style={{
                    top: '4px',
                    right: '8px',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    padding: '2px'
                  }}
                />
              )}
            </Button>
          );
        })}
      </div>

      {/* ✅ QUICK ACTION BUTTONS */}
      <div className="d-flex gap-2 mb-2">
        <Button
          variant="outline-info"
          size="sm"
          onClick={selectAll}
          disabled={selectedPupitres.length === 4}
          style={{
            fontSize: '11px',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: '500'
          }}
        >
          <FaCheck className="me-1" size={10} />
          Tout sélectionner
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={selectNone}
          disabled={selectedPupitres.length === 0}
          style={{
            fontSize: '11px',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: '500'
          }}
        >
          Tout désélectionner
        </Button>
      </div>

      {/* ✅ SELECTION SUMMARY */}
      <div className="d-flex align-items-center gap-2 mb-2">
        <small className="text-muted">
          <strong>{selectedPupitres.length}</strong> pupitre{selectedPupitres.length !== 1 ? 's' : ''} sélectionné
          {selectedPupitres.length !== 1 ? 's' : ''}
        </small>
        {selectedPupitres.length === 4 && (
          <Badge bg="success" className="px-2 py-1" style={{ fontSize: '10px' }}>
            Tout le chœur
          </Badge>
        )}
      </div>

      <Form.Text className="text-muted">Sélectionnez les pupitres qui participeront à cette répétition</Form.Text>

      {/* ✅ ERROR MESSAGE */}
      {touched && error && (
        <div className="text-danger mt-2" style={{ fontSize: '0.875rem' }}>
          <small>{error}</small>
        </div>
      )}
    </Form.Group>
  );
};

const ManageRehearsals = () => {
  const [repetitions, setRepetitions] = useState([]);
  const [concerts, setConcerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  // local YYYY-MM-DD
  const todayString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // local HH:MM
  const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // ✅ HELPER: Format pupitres display
  const formatPupitresDisplay = (pupitres) => {
    if (!Array.isArray(pupitres) || pupitres.length === 0) {
      return <em className="text-muted">Aucun pupitre</em>;
    }

    if (pupitres.length === 4 && ['soprano', 'alto', 'ténor', 'basse'].every((p) => pupitres.includes(p))) {
      return (
        <Badge bg="success" className="px-2 py-1">
          <FaMicrophone className="me-1" size={10} />
          Tout le chœur
        </Badge>
      );
    }

    const pupitreColors = {
      soprano: '#e11d48',
      alto: '#f59e0b',
      ténor: '#10b981',
      basse: '#3b82f6'
    };

    return (
      <div className="d-flex flex-wrap gap-1">
        {pupitres.map((pupitre, index) => (
          <Badge
            key={index}
            className="px-2 py-1"
            style={{
              backgroundColor: pupitreColors[pupitre] || '#6c757d',
              fontSize: '10px'
            }}
          >
            {pupitre.charAt(0).toUpperCase() + pupitre.slice(1)}
          </Badge>
        ))}
      </div>
    );
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [activeList, concertsList] = await Promise.all([getRepetitions(), getConcerts()]);
      setRepetitions(activeList);
      setConcerts(concertsList);
    } catch (err) {
      console.error('Erreur de chargement', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ✅ RESET PAGINATION WHEN SEARCH CHANGES
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filtered = repetitions.filter((r) => r.location.toLowerCase().includes(searchTerm.toLowerCase()));

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const getTotalItems = () => filtered.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
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

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '2rem', maxWidth: '1400px' }}>
      {/* ✅ RESPONSIVE: Header Section */}
      {/* <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 d-flex align-items-center">
              <Users className="me-2 me-md-3 text-primary" />
              <span className="d-none d-sm-inline">Gestion des Répétitions</span>
              <span className="d-sm-none">Répétitions</span>
            </h2>
            <p className="text-muted mb-0 d-none d-sm-block">Planifiez et organisez les répétitions du chœur</p>
          </div>
        </div>
      </div> */}

      {/* ✅ RESPONSIVE: Controls Section */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <InputGroup style={{ maxWidth: '400px' }} className="flex-grow-1 flex-md-grow-0">
              <InputGroup.Text style={{ backgroundColor: '#f8f9fa', borderColor: '#e5e7eb' }}>
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Rechercher par lieu"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderColor: '#e5e7eb',
                  fontSize: '14px'
                }}
              />
            </InputGroup>
            <Button
              variant="success"
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
              className="d-flex align-items-center px-3 py-2"
            >
              <Plus className="me-1 me-sm-2" size={14} />
              <span className="d-none d-sm-inline">Ajouter une répétition</span>
              <span className="d-sm-none">Ajouter</span>
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des répétitions...</p>
        </div>
      ) : (
        <>
          {/* ✅ RESPONSIVE: Table */}
          <Card className="shadow-sm border-0">
            <div className="table-responsive">
              <Table bordered hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Lieu</th>
                    <th>Pupitres</th>
                    <th>Concert lié</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData().map((rep, idx) => (
                    <tr key={rep._id}>
                      <td>{getStartIndex() + idx}</td>
                      <td>{formatDateTime(rep.date)}</td>
                      <td>
                        {rep.startTime} → {rep.endTime}
                      </td>
                      <td>{rep.location}</td>
                      <td>{formatPupitresDisplay(rep.pupitres)}</td>
                      <td>{rep.concert?.title || '-'}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="warning"
                          className="me-2"
                          onClick={() => {
                            setEditing(rep);
                            setShowModal(true);
                          }}
                        >
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* ✅ RESPONSIVE: Pagination */}
            {getTotalPages() > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
                <div className="d-flex align-items-center order-2 order-md-1">
                  <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                    <span className="d-none d-sm-inline">Répétitions par page:</span>
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
          </Card>
        </>
      )}

      {/* ✅ RESPONSIVE: Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="h5 fw-semibold">
            <Users className="me-2 text-primary" />
            <span className="d-none d-sm-inline">{editing ? 'Modifier une répétition' : 'Ajouter une répétition'}</span>
            <span className="d-sm-none">{editing ? 'Modifier' : 'Ajouter'}</span>
          </Modal.Title>
        </Modal.Header>

        <Formik
          enableReinitialize
          initialValues={{
            date: editing?.date?.substring(0, 10) || todayString,
            startTime: editing?.startTime || nowHM,
            endTime:
              editing?.endTime ||
              (() => {
                const d = new Date();
                d.setHours(d.getHours() + 2, d.getMinutes() + 30); // ✅ +2h30
                return d.toTimeString().slice(0, 5);
              })(),
            location: editing?.location || '',
            concert: editing?.concert?._id || '',
            pupitres: editing?.pupitres || ['soprano', 'alto', 'ténor', 'basse'] // ✅ Default all pupitres
          }}
          validationSchema={Yup.object({
            date: Yup.string()
              .required('La date est requise')
              .test('unique-date', 'Une répétition avec des pupitres en conflit existe déjà à cette date.', function (value) {
                if (!value) return true;

                const currentPupitres = this.parent.pupitres || [];

                // Check for overlapping pupitres on the same date
                const conflictingRepetition = repetitions.find((rep) => {
                  const repDate = new Date(rep.date).toISOString().split('T')[0];
                  const inputDate = value;

                  // Skip current repetition when editing
                  if (editing && rep._id === editing._id) return false;

                  // Check if dates match
                  if (repDate !== inputDate) return false;

                  // Check for pupitre overlap
                  return currentPupitres.some((pupitre) => rep.pupitres?.includes(pupitre));
                });

                return !conflictingRepetition;
              }),
            startTime: Yup.string().required('Heure de début requise'),
            endTime: Yup.string()
              .required('Heure de fin requise')
              .test('is-after-start', "L'heure de fin doit être après l'heure de début.", function (endTime) {
                const { startTime } = this.parent;
                if (!startTime || !endTime) return true;

                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);

                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;

                return endMinutes > startMinutes;
              })
              .test('not-same-time', "L'heure de fin ne peut pas être identique à l'heure de début.", function (endTime) {
                const { startTime } = this.parent;
                if (!startTime || !endTime) return true;
                return startTime !== endTime;
              }),
            location: Yup.string().required('Le lieu est requis'),
            // ✅ NEW: Pupitres validation
            pupitres: Yup.array()
              .min(1, 'Au moins un pupitre doit être sélectionné')
              .of(Yup.string().oneOf(['soprano', 'alto', 'ténor', 'basse'], 'Pupitre invalide'))
              .required('Les pupitres sont requis')
          })}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              const data = {
                ...values,
                concert: values.concert || null,
                location: values.location
              };

              if (editing) {
                await updateRepetition(editing._id, data);
                Swal.fire('Succès', 'Répétition modifiée avec succès.', 'success');
              } else {
                await createRepetition(data);
                Swal.fire('Succès', 'Répétition créée avec succès.', 'success');
              }

              fetchAll();
              resetForm();
              setEditing(null);
              setShowModal(false);
              setCurrentPage(0);
            } catch (err) {
              if (err.response?.status === 409) {
                await Swal.fire({
                  icon: 'error',
                  title: 'Conflit de répétition',
                  text: err.response?.data?.message || 'Une répétition avec des pupitres en conflit existe déjà à cette date.'
                });
              } else {
                Swal.fire('Erreur', err.response?.data?.message || 'Une erreur est survenue.', 'error');
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ handleSubmit, handleChange, setFieldValue, values, errors, touched, isSubmitting, isValid, dirty, handleBlur }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body className="p-3 p-md-4">
                <Row className="mb-3">
                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.date && !!errors.date}
                        min={todayString}
                      />
                      <Form.Control.Feedback type="invalid">{errors.date}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label>Heure début</Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={values.startTime}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          if (values.date === todayString && newStart < nowHM) return;
                          handleChange(e);

                          const [h, m] = newStart.split(':').map(Number);
                          const dt = new Date();
                          dt.setHours(h, m);
                          dt.setHours(dt.getHours() + 2, dt.getMinutes() + 30); // ✅ +2h30
                          setFieldValue('endTime', dt.toTimeString().slice(0, 5));
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.startTime && !!errors.startTime}
                        {...(values.date === todayString ? { min: nowHM } : {})}
                      />
                      <Form.Control.Feedback type="invalid">{errors.startTime}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label>Heure fin</Form.Label>
                      <Form.Control
                        type="time"
                        name="endTime"
                        value={values.endTime}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.endTime && !!errors.endTime}
                      />
                      <Form.Control.Feedback type="invalid">{errors.endTime}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* === Lieu (sélection fixe) === */}
                <Form.Group className="mb-3">
                  <Form.Label>Lieu</Form.Label>
                  <CreatableSelect
                    name="location"
                    options={lieuOptions}
                    value={values.location ? lieuOptions.find((opt) => opt.value === values.location) : null}
                    onChange={(opt) => setFieldValue('location', opt ? opt.value : '')}
                    onBlur={() => handleBlur({ target: { name: 'location' } })}
                    className={touched.location && errors.location ? 'is-invalid' : ''}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: '38px',
                        fontSize: '0.9rem'
                      }),
                      menu: (provided) => ({
                        ...provided,
                        fontSize: '0.9rem'
                      })
                    }}
                  />
                  {touched.location && errors.location && <div className="invalid-feedback d-block">{errors.location}</div>}
                </Form.Group>

                {/* === Concert lié (sélecteur dynamique) === */}
                <Form.Group className="mb-3">
                  <Form.Label>Concert lié (optionnel)</Form.Label>
                  <Select
                    name="concert"
                    isClearable
                    options={concerts.map((c) => ({
                      value: c._id,
                      label: `${c.title} – ${new Date(c.dateHeure).toLocaleDateString('fr-FR')}`
                    }))}
                    value={
                      values.concert
                        ? (() => {
                            const sel = concerts.find((c) => c._id.toString() === values.concert);
                            return sel
                              ? {
                                  value: sel._id,
                                  label: `${sel.title} – ${new Date(sel.dateHeure).toLocaleDateString('fr-FR')}`
                                }
                              : null;
                          })()
                        : null
                    }
                    onChange={(opt) => setFieldValue('concert', opt ? opt.value : '')}
                    onBlur={() => handleBlur({ target: { name: 'concert' } })}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: '38px',
                        fontSize: '0.9rem'
                      }),
                      menu: (provided) => ({
                        ...provided,
                        fontSize: '0.9rem'
                      })
                    }}
                  />
                </Form.Group>

                {/* ✅ NEW: BEAUTIFUL PUPITRE SELECTOR */}
                <PupitreSelector
                  selectedPupitres={values.pupitres}
                  onChange={(newPupitres) => setFieldValue('pupitres', newPupitres)}
                  touched={touched.pupitres}
                  error={errors.pupitres}
                />
              </Modal.Body>

              <Modal.Footer className="border-top bg-light px-3 px-md-4">
                <div className="d-flex gap-2 w-100 flex-column flex-sm-row justify-content-sm-end">
                  <Button variant="secondary" onClick={() => setShowModal(false)} className="order-2 order-sm-1 px-3 px-md-4">
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || !isValid || (editing && !dirty)}
                    className="order-1 order-sm-2 px-3 px-md-4"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        <span className="d-none d-sm-inline">En cours...</span>
                        <span className="d-sm-none">...</span>
                      </>
                    ) : (
                      <>
                        <span className="d-none d-sm-inline">{editing ? 'Mettre à jour' : 'Créer'}</span>
                        <span className="d-sm-none">{editing ? 'Modifier' : 'Créer'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Container>
  );
};

export default ManageRehearsals;
