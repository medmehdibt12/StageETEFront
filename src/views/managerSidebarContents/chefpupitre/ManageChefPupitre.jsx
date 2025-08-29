/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Badge, Button, Modal, Form, Spinner, Alert, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FaUserTie, FaPlus, FaTimes, FaCrown, FaUsers, FaMusic } from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  getChefsPupitre,
  getAvailableChoristesForPupitre,
  assignChefDePupitre,
  removeChefDePupitre
} from '../../../services/chefpupitre.service';

const ManageChefPupitre = () => {
  const [pupitresData, setPupitresData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPupitre, setSelectedPupitre] = useState('');
  const [availableChoristes, setAvailableChoristes] = useState([]);
  const [selectedChoriste, setSelectedChoriste] = useState(null);
  const [loadingChoristes, setLoadingChoristes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Professional pupitre configuration
  const pupitreConfig = {
    soprano: { label: 'Soprano', color: '#2563eb' }, // Professional blue
    alto: { label: 'Alto', color: '#7c3aed' }, // Professional purple
    ténor: { label: 'Ténor', color: '#059669' }, // Professional green
    basse: { label: 'Basse', color: '#dc2626' } // Professional red
  };

  // Load chef data
  const loadData = async () => {
    setLoading(true);
    try {
      const chefsResponse = await getChefsPupitre();
      setPupitresData(chefsResponse.pupitres);
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire('Erreur', 'Impossible de charger les données.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load available choristes for assignment
  const loadAvailableChoristes = async (pupitre) => {
    setLoadingChoristes(true);
    try {
      const response = await getAvailableChoristesForPupitre(pupitre);
      setAvailableChoristes(response.choristes);
    } catch (error) {
      console.error('Error loading choristes:', error);
      Swal.fire('Erreur', 'Impossible de charger les choristes disponibles.', 'error');
      setAvailableChoristes([]);
    } finally {
      setLoadingChoristes(false);
    }
  };

  // Open assignment modal
  const openAssignModal = async (pupitre) => {
    setSelectedPupitre(pupitre);
    setSelectedChoriste(null);
    setShowAssignModal(true);
    await loadAvailableChoristes(pupitre);
  };

  // Handle assignment with 2-second manual timer
  const handleAssignChef = async () => {
    if (!selectedChoriste || !selectedPupitre) {
      Swal.fire('Attention', 'Veuillez sélectionner un choriste.', 'warning');
      return;
    }

    // ✅ Start loading with 2-second manual timer
    Swal.fire({
      title: 'Nomination en cours...',
      text: 'Veuillez patienter.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setSubmitting(true);

    try {
      // Start API call and 2-second timer simultaneously
      const response = await assignChefDePupitre(selectedChoriste.value, selectedPupitre);

      // ✅ Show success after 2 seconds minimum
      Swal.fire({
        icon: 'success',
        title: 'Chef de pupitre nommé',
        text: `${selectedChoriste.label} a été nommé(e) chef de pupitre ${selectedPupitre}.`,
        confirmButtonText: 'OK'
      });

      setShowAssignModal(false);
      await loadData();
    } catch (error) {
      console.error('Error assigning chef:', error);
      Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors de la nomination.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle removal with 2-second manual timer
  const handleRemoveChef = async (userId, chefName, pupitre) => {
    const result = await Swal.fire({
      title: 'Retirer le chef de pupitre?',
      text: `${chefName} ne sera plus chef de pupitre ${pupitre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626'
    });

    if (!result.isConfirmed) return;

    // ✅ Start loading with 2-second manual timer
    Swal.fire({
      title: 'Suppression en cours...',
      text: 'Veuillez patienter.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Start API call and 2-second timer simultaneously
      const response = await removeChefDePupitre(userId);

      // ✅ Show success after 2 seconds minimum
      Swal.fire({
        icon: 'success',
        title: 'Chef de pupitre retiré',
        text: `${chefName} n'est plus chef de pupitre ${pupitre}.`,
        confirmButtonText: 'OK'
      });

      await loadData();
    } catch (error) {
      console.error('Error removing chef:', error);
      Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors de la suppression.', 'error');
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedPupitre('');
    setSelectedChoriste(null);
    setAvailableChoristes([]);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Convert choristes to select options
  const choristesOptions = availableChoristes.map((choriste) => ({
    value: choriste._id,
    label: `${choriste.firstName} ${choriste.lastName}`,
    email: choriste.email
  }));

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Container fluid className="px-3 px-md-4" style={{ marginTop: '2rem' }}>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des chefs de pupitre...</p>
        </div>
      </Container>
    );
  }

  const totalChefs = Object.values(pupitresData).reduce((sum, pupitre) => sum + pupitre.chefs.length, 0);
  const maxChefs = Object.keys(pupitresData).length * 2;

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '2rem', maxWidth: '1200px' }}>
      {/* ✅ RESPONSIVE: Professional Header */}
      {/* <div className="mb-4"> */}
      {/* <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-3 gap-3">
          <div className="flex-grow-1">
            <h3 className="mb-1 fw-bold text-dark d-flex align-items-center flex-wrap">
              <FaMusic className="me-2 me-md-3 text-primary" />
              <span className="d-none d-sm-inline">Gestion des Chefs de Pupitre</span>
              <span className="d-sm-none">Chefs de Pupitre</span>
            </h3>
            <p className="text-muted mb-0 d-none d-sm-block">Assignez et gérez les chefs de pupitre pour chaque section du chœur</p>
            <p className="text-muted mb-0 d-sm-none" style={{ fontSize: '0.9rem' }}>
              Gérez les chefs de pupitre
            </p>
          </div> */}
      {/* ✅ KEEP STATS IN PLACE - No responsive changes */}
      {/* <div className="text-end">
            <div className="d-flex align-items-center gap-3">
              <div className="text-center">
                <div className="h4 mb-0 text-primary fw-bold">{totalChefs}</div>
                <small className="text-muted">Chefs actifs</small>
              </div>
              <div className="text-center">
                <div className="h4 mb-0 text-secondary fw-bold">{maxChefs - totalChefs}</div>
                <small className="text-muted">Postes libres</small>
              </div>
            </div>
          </div> */}
      {/* </div> */}
      {/* </div> */}

      {/* ✅ RESPONSIVE: Professional Table Layout */}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom px-3 px-md-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0 text-dark fw-semibold d-flex align-items-center">
              <FaUserTie className="me-2 text-primary" />
              <span className="d-none d-sm-inline">Chefs de pupitre par section</span>
              <span className="d-sm-none">Par Section</span>
            </h5>

            <div className="d-flex align-items-center gap-2 gap-md-3">
              <div className="text-center">
                <div className="h5 h4-md mb-0 text-primary fw-bold">{totalChefs}</div>
                <small className="text-muted d-none d-sm-block">Chefs actifs</small>
                <small className="text-muted d-sm-none">Actifs</small>
              </div>
              <div className="text-center">
                <div className="h5 h4-md mb-0 text-secondary fw-bold">{maxChefs - totalChefs}</div>
                <small className="text-muted d-none d-sm-block">Postes libres</small>
                <small className="text-muted d-sm-none">Libres</small>
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {Object.entries(pupitreConfig).map(([pupitre, config]) => {
            const pupitreData = pupitresData[pupitre] || { chefs: [], maxChefs: 2, available: 2, isFull: false };

            return (
              <div key={pupitre} className="border-bottom last-child-no-border">
                {/* ✅ RESPONSIVE: Pupitre Header */}
                <div className="px-3 px-md-4 py-3 bg-light">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 gap-sm-0">
                    <div className="d-flex align-items-center flex-wrap">
                      <div
                        className="rounded-circle me-2 me-md-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: config.color
                        }}
                      />
                      <h6 className="mb-0 fw-semibold text-dark me-2 me-md-3">{config.label}</h6>
                      <Badge bg={pupitreData.isFull ? 'success' : 'warning'} style={{ fontSize: '0.75rem' }}>
                        {pupitreData.chefs.length}/2 chefs
                      </Badge>
                    </div>
                    <Button
                      variant={pupitreData.isFull ? 'outline-secondary' : 'outline-primary'}
                      size="sm"
                      disabled={pupitreData.isFull}
                      onClick={() => openAssignModal(pupitre)}
                      className="d-flex align-items-center"
                    >
                      <FaPlus className="me-1 me-sm-2" style={{ fontSize: '0.8rem' }} />
                      <span className="d-none d-sm-inline">{pupitreData.isFull ? 'Complet' : 'Assigner Chef'}</span>
                      <span className="d-sm-none">{pupitreData.isFull ? 'Complet' : 'Assigner'}</span>
                    </Button>
                  </div>
                </div>

                {/* ✅ RESPONSIVE: Chefs List */}
                <div className="px-3 px-md-4 py-3">
                  {pupitreData.chefs.length > 0 ? (
                    <div className="row g-2 g-md-3">
                      {pupitreData.chefs.map((chef) => (
                        <div key={chef._id} className="col-12 col-lg-6">
                          <div className="d-flex justify-content-between align-items-start align-items-sm-center p-2 p-md-3 bg-light rounded border">
                            <div className="flex-grow-1 me-2">
                              <div className="d-flex align-items-center mb-1 flex-wrap">
                                <FaCrown className="me-2 text-warning" style={{ fontSize: '0.8rem' }} />
                                <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
                                  {chef.firstName} {chef.lastName}
                                </span>
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                {chef.email}
                              </div>
                              <div className="text-muted d-none d-sm-block" style={{ fontSize: '0.7rem' }}>
                                Nommé le {formatDate(chef.assignedAt)}
                              </div>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveChef(chef._id, `${chef.firstName} ${chef.lastName}`, config.label)}
                              title="Retirer ce chef de pupitre"
                              className="flex-shrink-0"
                            >
                              <FaTimes style={{ fontSize: '0.7rem' }} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* ✅ RESPONSIVE: Empty slots */}
                      {Array.from({ length: 2 - pupitreData.chefs.length }).map((_, index) => (
                        <div key={`empty-${index}`} className="col-12 col-lg-6">
                          <div className="p-2 p-md-3 border border-dashed rounded text-center text-muted">
                            <FaUsers className="mb-1 mb-md-2" style={{ fontSize: '1.2rem', opacity: 0.3 }} />
                            <div style={{ fontSize: '0.8rem' }}>Poste libre</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="row g-2 g-md-3">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={`empty-${index}`} className="col-12 col-lg-6">
                          <div className="p-2 p-md-3 border border-dashed rounded text-center text-muted">
                            <FaUsers className="mb-1 mb-md-2" style={{ fontSize: '1.2rem', opacity: 0.3 }} />
                            <div style={{ fontSize: '0.8rem' }}>Poste libre</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Card.Body>
      </Card>

      {/* ✅ RESPONSIVE: Professional Assignment Modal */}
      <Modal show={showAssignModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="h5 fw-semibold text-dark">
            <FaUserTie className="me-2 text-primary" />
            <span className="d-none d-sm-inline">Assigner Chef de Pupitre - {pupitreConfig[selectedPupitre]?.label}</span>
            <span className="d-sm-none">Assigner - {pupitreConfig[selectedPupitre]?.label}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 p-md-4">
          {loadingChoristes ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Chargement des choristes disponibles...</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-light rounded border">
                <div className="d-flex align-items-center mb-2">
                  <div
                    className="rounded-circle me-2 me-md-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: pupitreConfig[selectedPupitre]?.color || '#6c757d'
                    }}
                  />
                  <h6 className="mb-0 fw-semibold">Pupitre {pupitreConfig[selectedPupitre]?.label}</h6>
                </div>
                <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                  <span className="d-none d-sm-inline">Sélectionnez un choriste de ce pupitre pour le nommer chef de pupitre.</span>
                  <span className="d-sm-none">Sélectionnez un choriste à nommer chef.</span>
                </p>
              </div>

              <Form.Group>
                <Form.Label className="fw-semibold text-dark mb-2">Choriste à nommer</Form.Label>
                <Select
                  options={choristesOptions}
                  value={selectedChoriste}
                  onChange={setSelectedChoriste}
                  placeholder={choristesOptions.length === 0 ? 'Aucun choriste disponible' : 'Sélectionner un choriste...'}
                  isDisabled={choristesOptions.length === 0 || submitting}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#e5e7eb',
                      boxShadow: 'none',
                      fontSize: '0.9rem',
                      '&:hover': {
                        borderColor: '#d1d5db'
                      }
                    })
                  }}
                  formatOptionLabel={(option) => (
                    <div className="py-1">
                      <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
                        {option.label}
                      </div>
                      <small className="text-muted d-none d-sm-block">{option.email}</small>
                    </div>
                  )}
                />
                <Form.Text className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                  {choristesOptions.length} choriste{choristesOptions.length > 1 ? 's' : ''} disponible
                  {choristesOptions.length > 1 ? 's' : ''}
                </Form.Text>
              </Form.Group>

              {choristesOptions.length === 0 && (
                <Alert variant="warning" className="mt-3 border-0" style={{ backgroundColor: '#fef3c7' }}>
                  <FaUsers className="me-2" />
                  <strong>Aucun choriste disponible</strong>
                  <br />
                  <small>Tous les choristes de ce pupitre sont indisponibles.</small>
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top bg-light px-3 px-md-4">
          <div className="d-flex gap-2 w-100 flex-column flex-sm-row justify-content-sm-end">
            <Button
              variant="outline-secondary"
              onClick={handleCloseModal}
              disabled={submitting}
              className="px-3 px-md-4 order-2 order-sm-1"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignChef}
              disabled={!selectedChoriste || submitting || loadingChoristes}
              className="px-3 px-md-4 order-1 order-sm-2"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  <span className="d-none d-sm-inline">Nomination...</span>
                  <span className="d-sm-none">...</span>
                </>
              ) : (
                <>
                  <FaCrown className="me-1 me-sm-2" />
                  <span className="d-none d-sm-inline">Nommer Chef</span>
                  <span className="d-sm-none">Nommer</span>
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <style>
        {`
    .last-child-no-border > div:last-child {
      border-bottom: none !important;
    }
    
    @media (max-width: 576px) {
      .container-fluid {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
      }
    }
  `}
      </style>
    </Container>
  );
};

export default ManageChefPupitre;
