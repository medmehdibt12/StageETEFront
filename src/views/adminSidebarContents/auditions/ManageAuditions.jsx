/* eslint-disable no-unused-vars */

/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Container, Card, Button, Table, Spinner, Modal, Form, Row, Col, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUsers } from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  listAuditionParameters,
  saveAuditionParameters,
  updateAuditionParameters,
  deleteAuditionParameters
} from '../../../services/auditions.service';
import { getMembershipSubmissions } from '../../../services/accounts.service';

const ManageAuditions = () => {
  const [paramsList, setParamsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParam, setEditingParam] = useState(null);
  const [pauseError, setPauseError] = useState('');
  const [pendingCandidatesCount, setPendingCandidatesCount] = useState(0);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      saison: currentYear,
      startDate: '',
      endDate: '',
      candidateCount: '',
      sessionStartTime: '08:00',
      sessionEndTime: '18:00',
      debutPause: '',
      finPause: ''
    }
  });

  const watchAll = watch();
  const { startDate, endDate, sessionStartTime, sessionEndTime, candidateCount, debutPause, finPause } = watchAll;

  // Fetch pending candidates count
  const fetchPendingCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const pendingData = await getMembershipSubmissions('Pending');
      setPendingCandidatesCount(pendingData.length);
      return pendingData.length;
    } catch (error) {
      console.error('Error fetching pending candidates:', error);
      setPendingCandidatesCount(0);
      return 0;
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Calculate remaining candidates logic
  const calculateRemainingCandidates = () => {
    const inputCount = parseInt(candidateCount) || 0;
    const remaining = pendingCandidatesCount - inputCount;

    return {
      inputCount,
      remaining,
      isValid: inputCount <= pendingCandidatesCount && inputCount > 0,
      isEmpty: inputCount === 0,
      isOverLimit: inputCount > pendingCandidatesCount,
      isExact: inputCount === pendingCandidatesCount
    };
  };

  const candidateCalc = calculateRemainingCandidates();

  // Clear pause error when user fixes the issue
  useEffect(() => {
    if ((debutPause && finPause) || (!debutPause && !finPause)) {
      setPauseError('');
    }
  }, [debutPause, finPause]);

  const calculateCapacityInfo = () => {
    if (startDate && endDate && sessionStartTime && sessionEndTime && candidateCount) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const [hS, mS] = sessionStartTime.split(':').map(Number);
      const [hE, mE] = sessionEndTime.split(':').map(Number);
      let sessionMinutes = hE * 60 + mE - (hS * 60 + mS);

      if (debutPause && finPause) {
        const [hD, mD] = debutPause.split(':').map(Number);
        const [hF, mF] = finPause.split(':').map(Number);
        const breakMinutes = hF * 60 + mF - (hD * 60 + mD);
        sessionMinutes -= breakMinutes;
      }

      const totalAvailableMinutes = sessionMinutes * dayCount;
      const autoSlotDuration = Math.floor(totalAvailableMinutes / Number(candidateCount));
      const candidatesPerDay = Math.ceil(Number(candidateCount) / dayCount);

      return {
        totalAvailableMinutes,
        autoSlotDuration,
        candidatesPerDay,
        dayCount
      };
    }
    return null;
  };

  const capacityInfo = calculateCapacityInfo();

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

  const openCreate = async () => {
    setEditingParam(null);
    setPauseError('');

    // Fetch current pending candidates count
    await fetchPendingCandidates();

    reset({
      saison: currentYear,
      startDate: '',
      endDate: '',
      candidateCount: '',
      sessionStartTime: '08:00',
      sessionEndTime: '18:00',
      debutPause: '',
      finPause: ''
    });
    setShowModal(true);
  };

  const openEdit = (param) => {
    setEditingParam(param);
    setPauseError('');
    reset({
      saison: param.saison || currentYear,
      startDate: param.startDate ? param.startDate.slice(0, 10) : '',
      endDate: param.endDate ? param.endDate.slice(0, 10) : '',
      candidateCount: param.candidateCount ? String(param.candidateCount) : '',
      sessionStartTime: param.sessionStartTime || '08:00',
      sessionEndTime: param.sessionEndTime || '',
      debutPause: param.debutPause || '',
      finPause: param.finPause || ''
    });
    setShowModal(true);
  };

  // const refreshCandidateCount = async () => {
  //   await fetchPendingCandidates();
  // };

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
    setPauseError('');

    if ((data.debutPause && !data.finPause) || (!data.debutPause && data.finPause)) {
      setPauseError('Veuillez renseigner les deux heures de pause');
      return;
    }

    const payload = {
      ...data,
      saison: Number(data.saison),
      candidateCount: Number(data.candidateCount),
      debutPause: data.debutPause || null,
      finPause: data.finPause || null
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
                  <th>Saison</th>
                  <th>Nb candidats</th>
                  <th>Horaires</th>
                  <th>Durée auto/audition</th>
                  <th>Pause</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paramsList.map((p) => {
                  const start = new Date(p.startDate);
                  const end = new Date(p.endDate);
                  const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  const [hS, mS] = p.sessionStartTime.split(':').map(Number);
                  const [hE, mE] = p.sessionEndTime.split(':').map(Number);
                  let sessionMinutes = hE * 60 + mE - (hS * 60 + mS);
                  if (p.debutPause && p.finPause) {
                    const [hD, mD] = p.debutPause.split(':').map(Number);
                    const [hF, mF] = p.finPause.split(':').map(Number);
                    sessionMinutes -= hF * 60 + mF - (hD * 60 + mD);
                  }
                  const totalMinutes = sessionMinutes * dayCount;
                  const autoDuration = Math.floor(totalMinutes / p.candidateCount);

                  return (
                    <tr key={p._id}>
                      <td>
                        {new Date(p.startDate).toLocaleDateString('fr-FR')} → {new Date(p.endDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td>{p.saison || currentYear}</td>
                      <td>{p.candidateCount}</td>
                      <td>
                        {p.sessionStartTime} – {p.sessionEndTime}
                      </td>
                      <td>{autoDuration} min</td>
                      <td>{p.debutPause && p.finPause ? `${p.debutPause} - ${p.finPause}` : 'Aucune'}</td>
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
                  );
                })}
                {paramsList.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-3">
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
              <Col md={4}>
                <Form.Group controlId="saison">
                  <Form.Label>Saison</Form.Label>
                  <Form.Control type="number" {...register('saison')} readOnly className="bg-light" />
                  <Form.Text className="text-muted">
                    <small>Année en cours (lecture seule)</small>
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="startDate">
                  <Form.Label>Date de début</Form.Label>
                  <Form.Control
                    type="date"
                    min={today}
                    {...register('startDate', {
                      required: 'Date de début requise',
                      validate: (value) => {
                        const selectedDate = new Date(value);
                        const todayDate = new Date(today);
                        if (selectedDate < todayDate) {
                          return 'Date ne peut pas être dans le passé';
                        }
                        return true;
                      }
                    })}
                    isInvalid={!!errors.startDate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="endDate">
                  <Form.Label>Date de fin</Form.Label>
                  <Form.Control
                    type="date"
                    min={watch('startDate') || today}
                    {...register('endDate', {
                      required: 'Date de fin requise',
                      validate: (value) => {
                        const startDateValue = watch('startDate');
                        if (!startDateValue) return true;

                        const startDate = new Date(startDateValue);
                        const endDate = new Date(value);

                        if (endDate < startDate) {
                          return 'Date de fin doit être ≥ date de début';
                        }

                        const diffTime = endDate - startDate;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 30) {
                          return 'Période maximale: 30 jours';
                        }

                        return true;
                      }
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
                  <div className="d-flex align-items-center justify-content-between">
                    <Form.Label>Nombre de candidats</Form.Label>
                    {/* {!editingParam && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={refreshCandidateCount}
                        disabled={loadingCandidates}
                        className="p-0 text-decoration-none"
                        title="Actualiser le nombre de candidats en attente"
                      >
                        {loadingCandidates ? <Spinner animation="border" size="sm" /> : <FaSync className="text-primary" />}
                      </Button>
                    )} */}
                  </div>
                  <Form.Control
                    type="number"
                    min={1}
                    max={100}
                    {...register('candidateCount', {
                      required: 'Nombre de candidats requis',
                      min: { value: 1, message: 'Minimum 1 candidat' },
                      max: { value: 100, message: 'Maximum 100 candidats' },
                      validate: (value) => {
                        const num = parseInt(value);
                        if (!Number.isInteger(num)) {
                          return 'Doit être un nombre entier';
                        }
                        return true;
                      }
                    })}
                    isInvalid={!!errors.candidateCount}
                  />
                  <Form.Control.Feedback type="invalid">{errors.candidateCount?.message}</Form.Control.Feedback>

                  {/* 🎯 SIMPLE DYNAMIC BADGE */}
                  {!editingParam && !loadingCandidates && (
                    <div className="mt-2">
                      <FaUsers className="text-primary me-2" />
                      {candidateCalc.isEmpty ? (
                        <Badge bg="secondary">{pendingCandidatesCount} candidats en attente</Badge>
                      ) : candidateCalc.isOverLimit ? (
                        <Badge bg="danger">
                          {pendingCandidatesCount} candidats → {Math.abs(candidateCalc.remaining)} manquants!
                        </Badge>
                      ) : candidateCalc.isExact ? (
                        <Badge bg="success">{pendingCandidatesCount} candidats → Tous programmés!</Badge>
                      ) : (
                        <Badge bg="primary">
                          {pendingCandidatesCount} candidats → {candidateCalc.remaining} restants
                        </Badge>
                      )}
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="sessionStartTime">
                  <Form.Label>Heure début séance</Form.Label>
                  <Form.Control
                    type="time"
                    {...register('sessionStartTime', {
                      required: 'Heure de début requise',
                      validate: (value) => {
                        const [hours, minutes] = value.split(':').map(Number);
                        const totalMinutes = hours * 60 + minutes;
                        const start8AM = 8 * 60;

                        if (totalMinutes < start8AM) {
                          return 'Heure de début doit être à partir de 08:00';
                        }
                        return true;
                      }
                    })}
                    isInvalid={!!errors.sessionStartTime}
                  />
                  <Form.Control.Feedback type="invalid">{errors.sessionStartTime?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="sessionEndTime">
                  <Form.Label>Heure fin séance</Form.Label>
                  <Form.Control
                    type="time"
                    {...register('sessionEndTime', {
                      required: 'Heure de fin requise',
                      validate: (value) => {
                        const startTime = watch('sessionStartTime');
                        if (!startTime) return true;

                        const [startHours, startMinutes] = startTime.split(':').map(Number);
                        const [endHours, endMinutes] = value.split(':').map(Number);

                        const startTotalMinutes = startHours * 60 + startMinutes;
                        const endTotalMinutes = endHours * 60 + endMinutes;

                        if (endTotalMinutes <= startTotalMinutes) {
                          return 'Heure de fin doit être après le début';
                        }

                        return true;
                      }
                    })}
                    isInvalid={!!errors.sessionEndTime}
                  />
                  <Form.Control.Feedback type="invalid">{errors.sessionEndTime?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="debutPause">
                  <Form.Label>Début pause (optionnel)</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="time"
                      min={
                        sessionStartTime
                          ? (() => {
                              const [h, m] = sessionStartTime.split(':').map(Number);
                              const totalMinutes = h * 60 + m + 1;
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            })()
                          : undefined
                      }
                      max={
                        sessionEndTime
                          ? (() => {
                              const [h, m] = sessionEndTime.split(':').map(Number);
                              const totalMinutes = h * 60 + m - 1;
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            })()
                          : undefined
                      }
                      {...register('debutPause')}
                      isInvalid={!!errors.debutPause || (pauseError && debutPause && !finPause)}
                    />
                    {watch('debutPause') && (
                      <Button
                        variant="link"
                        size="sm"
                        className="position-absolute text-muted p-0"
                        style={{
                          right: '50px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 3,
                          fontSize: '18px',
                          lineHeight: 1,
                          textDecoration: 'none'
                        }}
                        onClick={() => {
                          reset({
                            ...watch(),
                            debutPause: '',
                            finPause: ''
                          });
                          setPauseError('');
                        }}
                        title="Effacer la pause"
                      >
                        ×
                      </Button>
                    )}
                  </div>

                  {sessionStartTime && sessionEndTime && (
                    <Form.Text className="text-muted">
                      <small>
                        📅 Choisissez une heure entre {sessionStartTime} et {sessionEndTime}
                      </small>
                    </Form.Text>
                  )}

                  <Form.Control.Feedback type="invalid">{errors.debutPause?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="finPause">
                  <Form.Label>Fin pause (optionnel)</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="time"
                      min={
                        debutPause
                          ? (() => {
                              const [h, m] = debutPause.split(':').map(Number);
                              const totalMinutes = h * 60 + m + 15;
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            })()
                          : sessionStartTime
                            ? (() => {
                                const [h, m] = sessionStartTime.split(':').map(Number);
                                const totalMinutes = h * 60 + m + 1;
                                const hours = Math.floor(totalMinutes / 60);
                                const minutes = totalMinutes % 60;
                                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                              })()
                            : undefined
                      }
                      max={
                        sessionEndTime
                          ? (() => {
                              const [h, m] = sessionEndTime.split(':').map(Number);
                              const totalMinutes = h * 60 + m - 1;
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            })()
                          : undefined
                      }
                      {...register('finPause')}
                      isInvalid={!!errors.finPause || (pauseError && !debutPause && finPause)}
                    />
                    {watch('finPause') && (
                      <Button
                        variant="link"
                        size="sm"
                        className="position-absolute text-muted p-0"
                        style={{
                          right: '50px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 3,
                          fontSize: '18px',
                          lineHeight: 1,
                          textDecoration: 'none'
                        }}
                        onClick={() => {
                          reset({
                            ...watch(),
                            debutPause: '',
                            finPause: ''
                          });
                          setPauseError('');
                        }}
                        title="Effacer la pause"
                      >
                        ×
                      </Button>
                    )}
                  </div>

                  {sessionStartTime && sessionEndTime && (
                    <Form.Text className="text-muted">
                      <small>
                        Choisissez une heure entre {sessionStartTime} et {sessionEndTime}
                        {debutPause && ' (minimum 15 min après le début)'}
                      </small>
                    </Form.Text>
                  )}

                  <Form.Control.Feedback type="invalid">
                    {errors.finPause?.message ||
                      (pauseError && !debutPause && finPause && "Veuillez renseigner aussi l'heure de début de pause")}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {pauseError && (
              <Row className="mb-3">
                <Col>
                  <div className="invalid-feedback d-block">{pauseError}</div>
                </Col>
              </Row>
            )}

            {debutPause && finPause && (
              <Row className="mb-3">
                <Col>
                  <div className="alert alert-info py-2">
                    <small>
                      Pause prévue: {debutPause} → {finPause}
                      {(() => {
                        const [hD, mD] = debutPause.split(':').map(Number);
                        const [hF, mF] = finPause.split(':').map(Number);
                        const pauseMinutes = hF * 60 + mF - (hD * 60 + mD);
                        return pauseMinutes > 0 ? ` (${pauseMinutes} minutes)` : '';
                      })()}
                    </small>
                  </div>
                </Col>
              </Row>
            )}

            {capacityInfo && (
              <div className="mt-3 px-3 py-3 bg-light border rounded">
                <strong>
                  📊 Auto-calcul: <span className="text-primary">{capacityInfo.autoSlotDuration} minutes</span> par audition
                  <br />
                  📅 {capacityInfo.candidatesPerDay} candidats/jour sur {capacityInfo.dayCount} jour(s)
                  {debutPause && finPause && <span className="text-info"> (pause déduite)</span>}
                </strong>
              </div>
            )}
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
