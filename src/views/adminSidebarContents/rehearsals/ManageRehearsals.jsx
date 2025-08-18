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
import { Button, Form, Modal, Table, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import { Search } from 'lucide-react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

const pupitreOptions = ['soprano', 'alto', 'ténor', 'basse'].map((p) => ({
  value: p,
  label: p.charAt(0).toUpperCase() + p.slice(1)
}));

// Fixed "Lieu" choices:
const lieuOptions = [
  { value: 'Boulevard des arts', label: 'Boulevard des arts' },
  { value: 'AMI Assurances', label: 'AMI Assurances' }
];

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
    <div className="p-4">
      <div className="d-flex justify-content-between mb-3">
        <InputGroup style={{ maxWidth: '300px' }}>
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
        >
          + Ajouter une répétition
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Table bordered hover responsive>
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
                  <td>
                    {Array.isArray(rep.pupitres) &&
                    rep.pupitres.length === 4 &&
                    ['soprano', 'alto', 'ténor', 'basse'].every((p) => rep.pupitres.includes(p))
                      ? 'Tout le chœur'
                      : rep.pupitres.join(', ')}
                  </td>
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
                    {/* <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handlePermanentDelete(rep._id)}
                    >
                      Supprimer
                    </Button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* ✅ PROFESSIONAL PAGINATION */}
          {getTotalPages() >= 0 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
              <div className="d-flex align-items-center">
                <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                  Répétitions par page:
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
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Modifier une répétition' : 'Ajouter une répétition'}</Modal.Title>
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
                d.setHours(d.getHours() + 2);
                return d.toTimeString().slice(0, 5);
              })(),
            // store "location" as a simple string
            location: editing?.location || '',
            // store "concert" as the concert._id string, or "" if none
            concert: editing?.concert?._id || '',
            pupitres: editing?.pupitres || []
          }}
          validationSchema={Yup.object({
            date: Yup.string().required('La date est requise'),
            startTime: Yup.string().required('Heure de début requise'),
            endTime: Yup.string()
              .required('Heure de fin requise')
              .test('is-after-start', "L'heure de fin doit être après l'heure de début.", function (endTime) {
                const { startTime, date } = this.parent;
                if (!startTime || !endTime || !date) return true;

                const [startH, startM] = startTime.split(':').map(Number);
                const [endH, endM] = endTime.split(':').map(Number);

                const start = new Date(date);
                start.setHours(startH, startM, 0, 0);

                const end = new Date(date);
                end.setHours(endH, endM, 0, 0);

                // Si "end" est avant (ou égal) "start", on le considère comme le jour suivant
                if (end <= start) {
                  end.setDate(end.getDate() + 1);
                }
                return end > start;
              }),
            // location doit valider l'une des deux chaînes
            location: Yup.string().oneOf(['Boulevard des arts', 'AMI Assurances'], 'Lieu invalide').required('Le lieu est requis')
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
              setCurrentPage(0); // ✅ Reset to first page
            } catch (err) {
              if (err.response?.status === 409) {
                await Swal.fire({
                  icon: 'error',
                  title: 'Erreur',
                  text: 'Une répétition à cette date existe déjà.'
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
              <Modal.Body>
                <Row className="mb-2">
                  <Col>
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
                  <Col>
                    <Form.Group>
                      <Form.Label>Heure début</Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={values.startTime}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          // si on est aujourd'hui, on n'accepte pas une heure antérieure à nowHM
                          if (values.date === todayString && newStart < nowHM) return;
                          handleChange(e);

                          // on avance "endTime" de 2h automatiquement
                          const [h, m] = newStart.split(':').map(Number);
                          const dt = new Date();
                          dt.setHours(h, m);
                          dt.setHours(dt.getHours() + 2);
                          setFieldValue('endTime', dt.toTimeString().slice(0, 5));
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.startTime && !!errors.startTime}
                        {...(values.date === todayString ? { min: nowHM } : {})}
                      />
                      <Form.Control.Feedback type="invalid">{errors.startTime}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Heure fin</Form.Label>
                      <Form.Control type="time" name="endTime" value={values.endTime} readOnly />
                    </Form.Group>
                  </Col>
                </Row>

                {/* === Lieu (sélection fixe) === */}
                <Form.Group className="mb-2">
                  <Form.Label>Lieu</Form.Label>
                  <Select
                    name="location"
                    options={lieuOptions}
                    value={values.location ? lieuOptions.find((opt) => opt.value === values.location) : null}
                    onChange={(opt) => setFieldValue('location', opt ? opt.value : '')}
                    onBlur={() => handleBlur({ target: { name: 'location' } })}
                    className={touched.location && errors.location ? 'is-invalid' : ''}
                  />
                  {touched.location && errors.location && <div className="invalid-feedback d-block">{errors.location}</div>}
                </Form.Group>

                {/* === Concert lié (sélecteur dynamique) === */}
                <Form.Group className="mb-2">
                  <Form.Label>Concert lié (optionnel)</Form.Label>
                  <Select
                    name="concert"
                    isClearable
                    options={concerts.map((c) => ({
                      value: c._id,
                      label: `${c.title} – ${new Date(c.dateHeure).toLocaleDateString('fr-FR')}`
                    }))}
                    /* ---------- CLÉ DU CORRECTIF ---------- */
                    /* On fournit directement un objet { value, label } ou null, et non une fonction */
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
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Pupitres concernés</Form.Label>
                  {pupitreOptions.map((p) => (
                    <Form.Check key={p.value} type="checkbox" label={p.label} checked disabled />
                  ))}
                </Form.Group>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting || !isValid || (editing && !dirty)}>
                  {editing ? 'Mettre à jour' : 'Créer'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
};

export default ManageRehearsals;
