/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Container, Card, Button, Table, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  listAuditionParameters,
  saveAuditionParameters,
  updateAuditionParameters,
  deleteAuditionParameters
} from '../../../services/auditions.service';

const ManageAuditions = () => {
  const [paramsList, setParamsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParam, setEditingParam] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      startDate: '',
      endDate: '',
      candidateCount: '',
      sessionStartTime: '',
      sessionEndTime: '',
      slotDurationMinutes: '',
      breakDurationMinutes: ''
    }
  });

  const watchAll = watch();
  const { startDate, endDate, sessionStartTime, sessionEndTime, slotDurationMinutes, breakDurationMinutes } = watchAll;

  const calculateMaxCapacity = () => {
    if (startDate && endDate && sessionStartTime && sessionEndTime && slotDurationMinutes && breakDurationMinutes != null) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const [hS, mS] = sessionStartTime.split(':').map(Number);
      const [hE, mE] = sessionEndTime.split(':').map(Number);
      const sessionMinutes = hE * 60 + mE - (hS * 60 + mS);
      const block = Number(slotDurationMinutes) + Number(breakDurationMinutes);
      const slotsPerDay = Math.floor(sessionMinutes / block);
      return slotsPerDay * dayCount;
    }
    return null;
  };

  const maxCapacity = calculateMaxCapacity();

  const fetchParams = async () => {
    setLoading(true);
    try {
      const sets = await listAuditionParameters();
      setParamsList(sets);
    } catch {
      Swal.fire('Erreur', 'Impossible de récupérer les paramètres.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const openCreate = () => {
    setEditingParam(null);
    reset({
      startDate: '',
      endDate: '',
      candidateCount: '',
      sessionStartTime: '',
      sessionEndTime: '',
      slotDurationMinutes: '',
      breakDurationMinutes: ''
    });
    setShowModal(true);
  };

  const openEdit = (param) => {
    setEditingParam(param);
    reset({
      startDate: param.startDate.slice(0, 10),
      endDate: param.endDate.slice(0, 10),
      candidateCount: String(param.candidateCount),
      sessionStartTime: param.sessionStartTime,
      sessionEndTime: param.sessionEndTime,
      slotDurationMinutes: String(param.slotDurationMinutes),
      breakDurationMinutes: String(param.breakDurationMinutes)
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Supprimer ce planning ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer'
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAuditionParameters(id);
      Swal.fire('Supprimé', 'Paramètre supprimé.', 'success');
      fetchParams();
    } catch {
      Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
    }
  };

  const onSubmit = async (data) => {
    if (maxCapacity && data.candidateCount > maxCapacity) {
      Swal.fire('Erreur', `Vous avez dépassé la capacité maximale: ${maxCapacity}`, 'warning');
      return;
    }

    const payload = {
      ...data,
      candidateCount: Number(data.candidateCount),
      slotDurationMinutes: Number(data.slotDurationMinutes),
      breakDurationMinutes: Number(data.breakDurationMinutes)
    };

    try {
      if (editingParam) {
        await updateAuditionParameters(editingParam._id, payload);
        Swal.fire('Mis à jour', 'Paramètres mis à jour.', 'success');
      } else {
        await saveAuditionParameters(payload);
        Swal.fire('Enregistré', 'Nouveau planning enregistré.', 'success');
      }
      setShowModal(false);
      fetchParams();
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Échec de la sauvegarde.', 'error');
    }
  };

  return (
    <Container style={{ marginTop: '2rem' }}>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Paramètres des Auditions</h5>
          <Button variant="primary" onClick={openCreate}>
            <FaPlus className="me-2" /> Nouveau
          </Button>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table bordered hover responsive>
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Nb candidats</th>
                  <th>Horaires</th>
                  <th>Durée</th>
                  <th>Pause</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paramsList.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {new Date(p.startDate).toLocaleDateString('fr-FR')} → {new Date(p.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td>{p.candidateCount}</td>
                    <td>
                      {p.sessionStartTime} – {p.sessionEndTime}
                    </td>
                    <td>{p.slotDurationMinutes} min</td>
                    <td>{p.breakDurationMinutes} min</td>
                    <td>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <Button size="sm" variant="outline-secondary" onClick={() => openEdit(p)} className="me-2">
                        <FaEdit />
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(p._id)}>
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
                {paramsList.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-3">
                      Aucun planning défini.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingParam ? 'Modifier Planning' : 'Nouveau Planning'}</Modal.Title>
        </Modal.Header>

        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="startDate">
                  <Form.Label>Date de début</Form.Label>
                  <Form.Control
                    type="date"
                    min={today}
                    {...register('startDate', { required: 'Date de début requise' })}
                    isInvalid={!!errors.startDate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="endDate">
                  <Form.Label>Date de fin</Form.Label>
                  <Form.Control
                    type="date"
                    min={watch('startDate') || today}
                    {...register('endDate', {
                      required: 'Date de fin requise',
                      validate: (val) => !watch('startDate') || val >= watch('startDate') || 'Doit être ≥ date de début'
                    })}
                    isInvalid={!!errors.endDate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.endDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="candidateCount">
                  <Form.Label>Nombre de candidats</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    {...register('candidateCount', {
                      required: 'Requis',
                      min: { value: 1, message: 'Minimum 1 candidat' },
                      validate: (val) => !maxCapacity || val <= maxCapacity || `Capacité maximale: ${maxCapacity}`
                    })}
                    isInvalid={!!errors.candidateCount}
                  />
                  <Form.Control.Feedback type="invalid">{errors.candidateCount?.message}</Form.Control.Feedback>
                  {maxCapacity && (
                    <small className="text-muted">
                      Capacité max: <strong>{maxCapacity}</strong> candidats.
                    </small>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="slotDurationMinutes">
                  <Form.Label>Durée audition (min)</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    {...register('slotDurationMinutes', { required: 'Requis' })}
                    isInvalid={!!errors.slotDurationMinutes}
                  />
                  <Form.Control.Feedback type="invalid">{errors.slotDurationMinutes?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="breakDurationMinutes">
                  <Form.Label>Pause entre chaque (min)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    {...register('breakDurationMinutes', { required: 'Requis' })}
                    isInvalid={!!errors.breakDurationMinutes}
                  />
                  <Form.Control.Feedback type="invalid">{errors.breakDurationMinutes?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="sessionStartTime">
                  <Form.Label>Début séance</Form.Label>
                  <Form.Control
                    type="time"
                    {...register('sessionStartTime', { required: 'Requis' })}
                    isInvalid={!!errors.sessionStartTime}
                  />
                  <Form.Control.Feedback type="invalid">{errors.sessionStartTime?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="sessionEndTime">
                  <Form.Label>Fin séance</Form.Label>
                  <Form.Control
                    type="time"
                    {...register('sessionEndTime', {
                      required: 'Requis',
                      validate: (val) => !watch('sessionStartTime') || val > watch('sessionStartTime') || 'Doit être après le début'
                    })}
                    isInvalid={!!errors.sessionEndTime}
                  />
                  <Form.Control.Feedback type="invalid">{errors.sessionEndTime?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Capacity Preview */}
            <div className="mt-3 px-3 py-3 bg-light border rounded">
              {(() => {
                const { startDate, endDate, sessionStartTime, sessionEndTime, slotDurationMinutes, breakDurationMinutes } = watch();

                if (startDate && endDate && sessionStartTime && sessionEndTime && slotDurationMinutes && breakDurationMinutes != null) {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

                  const [hS, mS] = sessionStartTime.split(':').map(Number);
                  const [hE, mE] = sessionEndTime.split(':').map(Number);
                  const sessionMinutes = hE * 60 + mE - (hS * 60 + mS);

                  const slotBlock = Number(slotDurationMinutes) + Number(breakDurationMinutes);
                  const slotsPerDay = Math.floor(sessionMinutes / slotBlock);
                  const total = slotsPerDay * dayCount;

                  return (
                    <strong>
                      Capacité: {slotsPerDay} candidats/jour → <span className="text-success">{total}</span> max sur la période.
                    </strong>
                  );
                }
              })()}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {editingParam ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManageAuditions;
