/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useEffect, useState } from 'react';
import {
  getConcerts,
  createConcert,
  updateConcert
  // deleteConcertPermanent,
} from '../../../services/concert.service';
import { Eye, Calendar, Music } from 'lucide-react';
import { getOeuvres } from '../../../services/oeuvre.service';
import { Button, Form, Modal, Table, Col, Row, Spinner, InputGroup, Container, Card } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { BACKEND_URL } from '../../../utils/axiosInstance';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { Search } from 'lucide-react';
import logo from '../../../assets/images/logo.svg';

const ManageConcerts = () => {
  const [concerts, setConcerts] = useState([]);
  const [oeuvres, setOeuvres] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // ✅ IMAGE FILE VALIDATION FUNCTION
  const validateImageFile = (file) => {
    if (!file) return true;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      Swal.fire({
        icon: 'warning',
        title: 'Format non supporté',
        text: 'Veuillez sélectionner une image au format JPG, PNG ou GIF.',
        confirmButtonColor: '#1e3a5f'
      });
      return false;
    }

    if (file.size > maxSize) {
      Swal.fire({
        icon: 'warning',
        title: 'Fichier trop volumineux',
        text: "La taille de l'image ne doit pas dépasser 5MB.",
        confirmButtonColor: '#1e3a5f'
      });
      return false;
    }

    return true;
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  // local YYYY-MM-DD
  const todayString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // local HH:MM
  const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const formatConcertDateFR = (isoString) => {
    return new Date(isoString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [activeConcerts, allOeuvres] = await Promise.all([getConcerts(), getOeuvres()]);
      setConcerts(activeConcerts);
      setOeuvres(allOeuvres);
      const uniqueLocations = [...new Set(activeConcerts.map((c) => c.location))].map((l) => ({ label: l, value: l }));
      setLocations(uniqueLocations);
    } catch (err) {
      console.error('Erreur de chargement:', err);
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

  const filtered = concerts.filter((c) => c.location.toLowerCase().includes(searchTerm.toLowerCase()));

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

  // ✅ ENHANCED SUBMIT WITH ERROR HANDLING
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // ✅ VALIDATE IMAGE FILE BEFORE SUBMISSION
    if (values.poster instanceof File && !validateImageFile(values.poster)) {
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    try {
      const fullDateTime = new Date(`${values.date}T${values.time}`);
      formData.append('title', values.title);
      formData.append('dateHeure', fullDateTime.toISOString());
      formData.append('location', values.location.value);
      formData.append('programme', JSON.stringify(values.programme.map((o) => o.value)));
      if (values.poster instanceof File) {
        formData.append('poster', values.poster);
      }

      if (editing) {
        await updateConcert(editing._id, formData);
        Swal.fire({
          icon: 'success',
          title: 'Mis à jour',
          text: 'Le concert a été modifié.',
          timer: 2000,
          showConfirmButton: true
        });
      } else {
        await createConcert(formData);
        Swal.fire({
          icon: 'success',
          title: 'Créé',
          text: 'Le concert a été ajouté.',
          timer: 2000,
          showConfirmButton: true
        });
      }

      await fetchAll();
      resetForm();
      setShowModal(false);
      setEditing(null);
      setCurrentPage(0);
    } catch (err) {
      console.error('Concert save error:', err);

      // ✅ HANDLE SPECIFIC POSTER ERROR FROM BACKEND
      const errorData = err.response?.data;
      const errorType = errorData?.type;

      if (errorType === 'FILE_FORMAT_ERROR' || err.code === 'INVALID_POSTER_FORMAT') {
        Swal.fire({
          icon: 'warning',
          title: 'Format non supporté',
          text: 'Veuillez sélectionner une affiche au format JPG, PNG ou GIF.',
          confirmButtonColor: '#1e3a5f'
        });
      } else {
        const errorMessage = errorData?.message || err.message || "Échec de l'opération.";
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonColor: '#1e3a5f'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProgramme = (programme, concertDate) => {
    const formattedDate = formatConcertDateFR(concertDate);

    const piecesHtml = programme
      .map((o) => {
        const composers = o.composers.join(', ');
        const arrangers = o.arrangers && o.arrangers.length ? o.arrangers.join(', ') : '—';

        return `
      <div class="prog-card">
        <div class="prog-card-header">
          <span>🎺</span>
          <span>${o.title}</span>
        </div>
        <div class="prog-card-body">
          <div>
            <strong style="font-size:16px; font-style: italic;">
              Compositeurs:
            </strong>
            ${composers}
          </div>
          <div style="margin-top:4px;">
            <strong style="font-size:16px; font-style: italic;">
              Arrangeurs:
            </strong>
            ${arrangers}
          </div>
        </div>
      </div>
    `;
      })
      .join('');

    Swal.fire({
      html: `
        <style>
         .prog-modal-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 820px;
    margin: auto;
    background: #f9fafb;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  }
          .prog-header {
            position: relative;
              background:rgb(76, 89, 104); /* Sidebar dark blue */
            color: #fff;
            text-align: center;
            padding: 20px 0;
          }
          .prog-header h1 {
            display: inline-block;
            margin: 0;
            font-family: 'Trebuchet MS', sans-serif;
            font-size: 24px;
            letter-spacing: 1px;
            color: #fff;
            
          }
          .prog-header .icon {
            font-size: 24px;
            margin: 0 12px;
            vertical-align: middle;
          }
         .prog-subheader {
    text-align: center;
    background: #ffffff;
    padding: 20px 0;
    border-bottom: 1px solid #e0e0e0;
  }
    .prog-subheader img {
            width: 100px;
            height: auto;
            margin-bottom: 12px;
          }
  .prog-subheader p {
    margin: 0;
    font-size: 18px;
    color: #26394E; /* Same sidebar color */
    font-weight: 500;
  }
      .prog-body {
    background: #ffffff;
    padding: 20px 30px;
    max-height: 380px;
    overflow-y: auto;
  }
        .prog-card {
    background: #ffffff;
    border-left: 4px solid #26394E; /* Sidebar blue accent */
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    transition: box-shadow .2s;
  }
          .prog-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .prog-card-header {
            display: flex;
            align-items: center;
            font-weight: 600;
            font-size: 1rem;
            color: #2c2c2c;
            margin-bottom: 8px;
          }
          .prog-card-header span:first-child {
            margin-right: 8px;
            font-size: 20px;
          }
          .prog-card-body {
            margin-left: 28px;
            font-size: 0.9rem;
            color: #444;
            text-align:left;

          }
          .prog-card-meta {
            margin-top: 6px;
            font-size: 0.82rem;
            color: #888;
            font-style: italic;
          }
          .prog-footer {
            background: #f1f5f9;
            text-align: center;
            font-size: 14px;
            color: #5e5043;
            font-style: italic;
            padding:20px 32px;
            
          }
          .swal2-programme-popup {
            background: transparent !important;
            box-shadow: none !important;
          }
        .swal2-programme-popup {
    background: transparent !important;
    box-shadow: none !important;
  }
  .prog-footer .arrangers-list {
    display: inline-block;
    margin-left: 6px;
    font-style: normal;
  }

  .swal2-programme-btn {
            background:rgb(76, 89, 104) !important;
            color: white !important;
            font-weight: 500;
            border-radius: 22px;
            padding: 8px 26px !important;
            font-size: 14px !important;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08) !important;
          }
        </style>
  
        <div class="prog-modal-container">
          <!-- Header -->
          <div class="prog-header">
            <span class="icon"></span>
            <h1>Carthage Symphony Orchestra</h1>
            <span class="icon"></span>
          </div>
  
          <!-- Logo & Date -->
        <div class="prog-subheader">
          <img src="${logo}" alt="CSO Logo" />
          <p>
            Programme du ${formattedDate}
          
          </p>
        </div>

  
          <!-- Pieces List -->
          <div class="prog-body">
            ${piecesHtml}
          </div>
  

          
          <!-- Footer -->
<div class="prog-footer" >
  
  <span class="arrangers-list">Carthage Symphony Orchestra</span>
</div>


        </div>
      `,
      customClass: {
        popup: 'swal2-programme-popup',
        confirmButton: 'swal2-programme-btn'
      },
      showConfirmButton: true,
      confirmButtonText: 'Fermer',
      width: '660px',
      padding: 0,
      background: 'transparent'
    });
  };

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '2rem', maxWidth: '1400px' }}>
      {/* ✅ RESPONSIVE: Header Section */}
      {/* <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 d-flex align-items-center">
              <Music className="me-2 me-md-3 text-primary" />
              <span className="d-none d-sm-inline">Gestion des Concerts</span>
              <span className="d-sm-none">Concerts</span>
            </h2>
            <p className="text-muted mb-0 d-none d-sm-block">Organisez et gérez vos concerts et programmes musicaux</p>
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
              <Calendar className="me-1 me-sm-2" size={14} />
              <span className="d-none d-sm-inline">Ajouter un concert</span>
              <span className="d-sm-none">Ajouter</span>
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des concerts...</p>
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
                    <th>Titre</th>
                    <th>Date &amp; Heure</th>
                    <th>Lieu</th>
                    <th>Programme</th>
                    <th>Affiche</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData().map((concert, idx) => (
                    <tr key={concert._id}>
                      <td>{getStartIndex() + idx}</td>
                      <td>{concert.title}</td>
                      <td>{formatDateTime(concert.dateHeure)}</td>
                      <td>{concert.location}</td>
                      <td className="text-center align-middle">
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                          <Button
                            className="p-0 text-primary"
                            variant="link"
                            onClick={() => handleViewProgramme(concert.programme, concert.dateHeure)}
                          >
                            <Eye size={20} />
                          </Button>
                        </div>
                      </td>

                      <td>
                        {concert.poster ? (
                          <img
                            src={`${BACKEND_URL}/uploads/posters/${concert.poster}`}
                            alt="Affiche"
                            style={{
                              width: 50,
                              cursor: 'zoom-in',
                              borderRadius: 4
                            }}
                            onClick={() =>
                              Swal.fire({
                                imageUrl: `${BACKEND_URL}/uploads/posters/${concert.poster}`,
                                imageAlt: 'Zoom affiche',
                                showCloseButton: true,
                                showConfirmButton: false,
                                background: '#fff'
                              })
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          className="me-2"
                          variant="warning"
                          onClick={() => {
                            const d = new Date(concert.dateHeure);
                            setEditing({
                              ...concert,
                              date: d.toISOString().substring(0, 10),
                              time: d.toTimeString().substring(0, 5),
                              location: {
                                label: concert.location,
                                value: concert.location
                              },
                              programme: concert.programme.map((o) => ({
                                value: o._id,
                                label: o.title
                              })),
                              previewPoster: concert.poster ? `${BACKEND_URL}/uploads/posters/${concert.poster}` : '',
                              poster: concert.poster || ''
                            });
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
                    <span className="d-none d-sm-inline">Concerts par page:</span>
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
            <Calendar className="me-2 text-primary" />
            <span className="d-none d-sm-inline">{editing ? 'Modifier un concert' : 'Ajouter un concert'}</span>
            <span className="d-sm-none">{editing ? 'Modifier' : 'Ajouter'}</span>
          </Modal.Title>
        </Modal.Header>

        <Formik
          initialValues={{
            date: editing?.date || todayString,
            time: editing?.time || nowHM,
            location: editing?.location || null,
            poster: editing?.poster || '',
            previewPoster: editing?.previewPoster || '',
            programme: editing?.programme || [],
            title: editing?.title || ''
          }}
          validationSchema={Yup.object({
            title: Yup.string().required('Le titre est requis'),
            date: Yup.string().required('Date requise'),
            time: Yup.string().required('Heure requise'),
            location: Yup.object().nullable().required('Lieu requis'),
            programme: Yup.array().min(1, 'Au moins une œuvre est requise')
          })}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ handleSubmit, handleChange, setFieldValue, values, errors, touched, handleBlur, isValid, dirty, isSubmitting }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body className="p-3 p-md-4">
                <Row className="mb-3">
                  <Col xs={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Titre du concert</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        placeholder="Ex: Concert de Printemps"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.title && !!errors.title}
                      />
                      <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={values.date}
                        min={todayString}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.date && !!errors.date}
                      />
                      <Form.Control.Feedback type="invalid">{errors.date}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Heure</Form.Label>
                      <Form.Control
                        type="time"
                        name="time"
                        value={values.time}
                        onChange={(e) => {
                          const newTime = e.target.value;
                          if (values.date === todayString && newTime < nowHM) return;
                          handleChange(e);
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.time && !!errors.time}
                        {...(values.date === todayString ? { min: nowHM } : {})}
                      />
                      <Form.Control.Feedback type="invalid">{errors.time}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Lieu</Form.Label>
                  <CreatableSelect
                    isClearable
                    options={locations}
                    value={values.location}
                    onChange={(val) => setFieldValue('location', val)}
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

                <Form.Group className="mb-3">
                  <Form.Label>Programme</Form.Label>
                  <Select
                    isMulti
                    options={oeuvres.map((o) => ({
                      label: o.title,
                      value: o._id
                    }))}
                    value={values.programme}
                    onChange={(val) => setFieldValue('programme', val)}
                    onBlur={() => handleBlur({ target: { name: 'programme' } })}
                    className={touched.programme && errors.programme ? 'is-invalid' : ''}
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
                  {touched.programme && errors.programme && <div className="invalid-feedback d-block">{errors.programme}</div>}
                </Form.Group>

                {/* ✅ ENHANCED POSTER UPLOAD WITH VALIDATION */}
                <Form.Group className="mb-2">
                  <Form.Label>Affiche (image) (optionnel)</Form.Label>
                  <Form.Control
                    type="file"
                    name="poster"
                    onChange={(e) => {
                      const file = e.currentTarget.files[0];
                      if (file && validateImageFile(file)) {
                        setFieldValue('poster', file);
                        setFieldValue('previewPoster', URL.createObjectURL(file));
                      } else {
                        e.target.value = '';
                        setFieldValue('poster', '');
                        setFieldValue('previewPoster', '');
                      }
                    }}
                    accept=".jpg,.jpeg,.png,.gif"
                  />
                  <Form.Text className="text-muted">Formats acceptés: JPG, PNG, GIF (max 5MB)</Form.Text>

                  {values.previewPoster && (
                    <div className="mt-3 d-flex flex-column align-items-center text-center">
                      <img
                        src={values.previewPoster}
                        alt="Affiche preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          boxShadow: '0 0 6px rgba(0,0,0,0.1)',
                          cursor: 'zoom-in'
                        }}
                        onClick={() =>
                          Swal.fire({
                            imageUrl: values.previewPoster,
                            imageAlt: 'Zoom affiche',
                            showCloseButton: true,
                            showConfirmButton: false
                          })
                        }
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setFieldValue('poster', '');
                          setFieldValue('previewPoster', '');
                        }}
                      >
                        <span className="d-none d-sm-inline">Supprimer l'affiche</span>
                        <span className="d-sm-none">Supprimer</span>
                      </Button>
                    </div>
                  )}
                </Form.Group>
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
                        <span className="d-none d-sm-inline">{editing ? 'Mise à jour...' : 'Création...'}</span>
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

export default ManageConcerts;
