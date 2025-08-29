/* eslint-disable react-hooks/exhaustive-deps */
import { BACKEND_URL } from '../../../utils/axiosInstance';
import React, { useEffect, useState } from 'react';
import { Eye, DownloadCloud, Music2, Plus } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import {
  getOeuvres,
  createOeuvre,
  updateOeuvre
  // deleteOeuvrePermanent,
} from '../../../services/oeuvre.service';
import { Button, Form, Modal, Table, Col, Row, Spinner, Badge, InputGroup, Container, Card } from 'react-bootstrap';
import { Search } from 'lucide-react';

import Swal from 'sweetalert2';
import { Formik } from 'formik';
import * as Yup from 'yup';

const ManageOeuvres = () => {
  const [oeuvres, setOeuvres] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [genres, setGenres] = useState([]);

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  const baseGenres = ['Classique', 'Gospel', 'Jazz'];
  const genreOptions = genres.map((g) => ({
    label: g,
    value: g
  }));

  // ✅ PDF FILE VALIDATION FUNCTION
  const validatePdfFile = (file) => {
    if (!file) return true;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      Swal.fire({
        icon: 'warning',
        title: 'Format non supporté',
        text: 'Veuillez sélectionner un fichier PDF valide.',
        confirmButtonColor: '#1e3a5f'
      });
      return false;
    }

    if (file.size > maxSize) {
      Swal.fire({
        icon: 'warning',
        title: 'Fichier trop volumineux',
        text: 'La taille du fichier PDF ne doit pas dépasser 10MB.',
        confirmButtonColor: '#1e3a5f'
      });
      return false;
    }

    return true;
  };

  const fetchOeuvres = async () => {
    setLoading(true);
    try {
      const data = await getOeuvres();
      setOeuvres(data);

      // ⤵️ Combine static + dynamic genres
      const fetchedGenres = data.map((o) => o.genre).filter(Boolean);
      const allGenres = [...baseGenres, ...fetchedGenres];
      const uniqueGenres = [...new Set(allGenres)];
      setGenres(uniqueGenres);
    } catch (err) {
      console.error('Erreur de chargement', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOeuvres();
  }, []);

  // ✅ RESET PAGINATION WHEN SEARCH CHANGES
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filtered = oeuvres.filter((o) => o.title.toLowerCase().includes(searchTerm.toLowerCase()));

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

  // opens the PDF in a SweetAlert iframe
  const handlePdfPreview = (filename) => {
    Swal.fire({
      title: 'Aperçu PDF',
      html: `<iframe
        src="${BACKEND_URL}/uploads/documents/${filename}"
        width="100%" height="600px" style="border:none;"
      ></iframe>`,
      width: 800,
      showCloseButton: true,
      showConfirmButton: false
    });
  };

  // opens the PDF in a new tab for download
  const handlePdfDownload = (filename) => {
    const url = `${BACKEND_URL}/uploads/documents/${filename}`;
    window.open(url, '_blank');
  };

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '2rem', maxWidth: '1400px' }}>
      {/* ✅ RESPONSIVE: Header Section */}
      {/* <div className="mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 d-flex align-items-center">
              <Music2 className="me-2 me-md-3 text-primary" />
              <span className="d-none d-sm-inline">Gestion des Œuvres</span>
              <span className="d-sm-none">Œuvres</span>
            </h2>
            <p className="text-muted mb-0 d-none d-sm-block">Gérez votre bibliothèque musicale et vos partitions</p>
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
                placeholder="Rechercher par titre"
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
              <span className="d-none d-sm-inline">Ajouter une œuvre</span>
              <span className="d-sm-none">Ajouter</span>
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des œuvres...</p>
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
                    <th>Compositeurs</th>
                    <th>Arrangeurs</th>
                    <th>Genre</th>
                    <th className="text-center">Chœur requis</th>
                    <th>Paroles (PDF)</th>
                    <th>Partition (PDF)</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {getPaginatedData().map((o, index) => (
                    <tr key={o._id}>
                      <td>{getStartIndex() + index}</td>
                      <td>{o.title}</td>
                      <td>{o.composers.join(', ')}</td>
                      <td>{o.arrangers.join(', ')}</td>
                      <td>{o.genre || '-'}</td>
                      <td className="text-center align-middle">
                        {o.requiresChoir ? <Badge bg="success">Oui</Badge> : <Badge bg="secondary">Non</Badge>}
                      </td>

                      <td className="text-center align-middle">
                        {o.lyrics ? (
                          <div className="d-inline-flex align-items-center justify-content-center gap-3">
                            <Button variant="link" className="p-0 text-primary" onClick={() => handlePdfPreview(o.lyrics)}>
                              <Eye size={20} />
                            </Button>
                            <Button variant="link" className="p-0 text-primary" onClick={() => handlePdfDownload(o.lyrics)}>
                              <DownloadCloud size={20} />
                            </Button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="text-center align-middle">
                        {o.partition ? (
                          <div className="d-inline-flex align-items-center justify-content-center gap-3">
                            <Button variant="link" className="p-0 text-primary" onClick={() => handlePdfPreview(o.partition)}>
                              <Eye size={20} />
                            </Button>
                            <Button variant="link" className="p-0 text-primary" onClick={() => handlePdfDownload(o.partition)}>
                              <DownloadCloud size={20} />
                            </Button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td>
                        <Button
                          size="sm"
                          variant="warning"
                          className="me-2"
                          onClick={() => {
                            setEditing(o);
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
                    <span className="d-none d-sm-inline">Œuvres par page:</span>
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
            <Music2 className="me-2 text-primary" />
            <span className="d-none d-sm-inline">{editing ? 'Modifier une œuvre' : 'Ajouter une œuvre'}</span>
            <span className="d-sm-none">{editing ? 'Modifier' : 'Ajouter'}</span>
          </Modal.Title>
        </Modal.Header>

        <Formik
          initialValues={{
            title: editing?.title || '',
            composers: editing?.composers?.join(', ') || '',
            arrangers: editing?.arrangers?.join(', ') || '',
            year: editing?.year || '',
            genre: editing?.genre || '',
            lyrics: null,
            partition: null,
            requiresChoir: editing?.requiresChoir || false
          }}
          validationSchema={Yup.object({
            title: Yup.string().required('Le titre est requis'),
            composers: Yup.string().required('Au moins un compositeur est requis'),
            arrangers: Yup.string().required('Au moins un arrangeur est requis'),
            year: Yup.number().typeError("L'année doit être un nombre").required("L'année est requise"),
            genre: Yup.string().required('Le genre est requis')
          })}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            // ✅ VALIDATE PDF FILES BEFORE SUBMISSION
            if (values.lyrics && !validatePdfFile(values.lyrics)) {
              setSubmitting(false);
              return;
            }
            if (values.partition && !validatePdfFile(values.partition)) {
              setSubmitting(false);
              return;
            }

            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('composers', values.composers);
            formData.append('arrangers', values.arrangers);
            formData.append('year', values.year);
            formData.append('genre', values.genre);
            formData.append('requiresChoir', values.requiresChoir);

            if (values.lyrics) {
              formData.append('lyrics', values.lyrics);
            }
            if (values.partition) {
              formData.append('partition', values.partition);
            }

            const save = async () => {
              try {
                if (editing) {
                  await updateOeuvre(editing._id, formData);
                  Swal.fire({
                    icon: 'success',
                    title: 'Modifiée',
                    text: "L'œuvre a été mise à jour.",
                    timer: 2000,
                    showConfirmButton: true
                  });
                } else {
                  await createOeuvre(formData);
                  Swal.fire({
                    icon: 'success',
                    title: 'Créée',
                    text: "L'œuvre a été ajoutée.",
                    timer: 2000,
                    showConfirmButton: true
                  });
                }

                fetchOeuvres();
                resetForm();
                setShowModal(false);
                setEditing(null);
              } catch (error) {
                console.error('Oeuvre save error:', error);

                // ✅ HANDLE SPECIFIC PDF ERROR FROM BACKEND
                const errorData = error.response?.data;
                const errorType = errorData?.type;

                if (errorType === 'FILE_FORMAT_ERROR' || error.code === 'INVALID_PDF_FORMAT') {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Format non supporté',
                    text: 'Veuillez sélectionner des fichiers PDF valides pour les paroles et partitions.',
                    confirmButtonColor: '#1e3a5f'
                  });
                } else {
                  const errorMessage = errorData?.message || error.message || "Échec de l'opération.";
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

            save();
          }}
          enableReinitialize
        >
          {({ handleSubmit, handleChange, handleBlur, values, touched, errors, isSubmitting, isValid, dirty, setFieldValue }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body className="p-3 p-md-4">
                <Row className="mb-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Titre</Form.Label>
                      <Form.Control
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.title && !!errors.title}
                      />
                      <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Année</Form.Label>
                      <Form.Control
                        name="year"
                        type="number"
                        value={values.year}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.year && !!errors.year}
                      />
                      <Form.Control.Feedback type="invalid">{errors.year}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Compositeurs (séparés par virgule)</Form.Label>
                      <Form.Control
                        name="composers"
                        value={values.composers}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.composers && !!errors.composers}
                      />
                      <Form.Control.Feedback type="invalid">{errors.composers}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Arrangeurs (séparés par virgule)</Form.Label>
                      <Form.Control
                        name="arrangers"
                        value={values.arrangers}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.arrangers && !!errors.arrangers}
                      />
                      <Form.Control.Feedback type="invalid">{errors.arrangers}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Genre</Form.Label>
                  <CreatableSelect
                    name="genre"
                    isClearable
                    options={genreOptions}
                    value={
                      genreOptions.find((o) => o.value === values.genre) ||
                      (values.genre ? { label: values.genre, value: values.genre } : null)
                    }
                    placeholder="Choisir ou écrire un genre..."
                    onChange={(option) => setFieldValue('genre', option?.value || '')}
                    onBlur={() => handleBlur({ target: { name: 'genre' } })}
                    className={touched.genre && errors.genre ? 'is-invalid' : ''}
                    createOptionPosition="first"
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
                  {touched.genre && errors.genre && <div className="invalid-feedback d-block">{errors.genre}</div>}
                </Form.Group>

                <Row className="mb-3">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Paroles (PDF)</Form.Label>
                      <Form.Control
                        name="lyrics"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.currentTarget.files[0];
                          if (file && validatePdfFile(file)) {
                            setFieldValue('lyrics', file);
                          } else {
                            e.target.value = '';
                            setFieldValue('lyrics', null);
                          }
                        }}
                      />
                      <Form.Text className="text-muted">Format: PDF uniquement (max 10MB)</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Partition (PDF)</Form.Label>
                      <Form.Control
                        name="partition"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.currentTarget.files[0];
                          if (file && validatePdfFile(file)) {
                            setFieldValue('partition', file);
                          } else {
                            e.target.value = '';
                            setFieldValue('partition', null);
                          }
                        }}
                      />
                      <Form.Text className="text-muted">Format: PDF uniquement (max 10MB)</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Check
                  className="mt-3"
                  name="requiresChoir"
                  type="checkbox"
                  label="Cette œuvre nécessite le chœur"
                  checked={values.requiresChoir}
                  onChange={handleChange}
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
                    disabled={isSubmitting || (!editing && !isValid) || (editing && !dirty)}
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

export default ManageOeuvres;
