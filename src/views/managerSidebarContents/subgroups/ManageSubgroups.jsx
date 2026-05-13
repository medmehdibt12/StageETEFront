import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Table, Spinner, Modal, Form, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getSubgroups, deleteSubgroup, createSubgroup, updateSubgroup } from '../../../services/subgroup.service';
import { useForm } from 'react-hook-form';

const ManageSubgroups = () => {
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubgroup, setEditingSubgroup] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchSubgroups = async () => {
    setLoading(true);
    try {
      const response = await getSubgroups(statusFilter);
      setSubgroups(response.data);
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les sous-groupes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubgroups();
  }, [statusFilter]);

  const handleShowModal = (subgroup = null) => {
    setEditingSubgroup(subgroup);
    if (subgroup) {
      setValue('name', subgroup.name);
      setValue('description', subgroup.description);
      setValue('type', subgroup.type);
      setValue('startDate', new Date(subgroup.startDate).toISOString().split('T')[0]);
      setValue('endDate', new Date(subgroup.endDate).toISOString().split('T')[0]);
      setValue('status', subgroup.status);
    } else {
      reset({
        name: '',
        description: '',
        type: 'Activité Commune',
        startDate: '',
        endDate: '',
        status: 'Actif'
      });
    }
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingSubgroup) {
        await updateSubgroup(editingSubgroup._id, data);
        Swal.fire('Succès', 'Sous-groupe mis à jour', 'success');
      } else {
        await createSubgroup(data);
        Swal.fire('Succès', 'Sous-groupe créé', 'success');
      }
      setShowModal(false);
      fetchSubgroups();
    } catch (error) {
      Swal.fire('Erreur', 'Opération échouée', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await deleteSubgroup(id);
        Swal.fire('Supprimé !', 'Le sous-groupe a été supprimé.', 'success');
        fetchSubgroups();
      } catch (error) {
        Swal.fire('Erreur', 'Suppression échouée', 'error');
      }
    }
  };

  const filteredSubgroups = subgroups.filter(sg => 
    sg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sg.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container fluid className="p-4">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0 text-primary fw-bold">Gestion des Sous-groupes</h4>
            <p className="text-muted small mb-0">Créez et gérez des groupes pour vos activités communes</p>
          </div>
          <Button variant="primary" onClick={() => handleShowModal()} className="d-flex align-items-center gap-2">
            <FaPlus /> Nouveau Groupe
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher par nom ou type..."
                  className="bg-light border-start-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-light"
              >
                <option value="">Tous les statuts</option>
                <option value="Actif">Actif</option>
                <option value="Archivé">Archivé</option>
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Chargement des groupes...</p>
            </div>
          ) : (
            <Table responsive hover className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Période</th>
                  <th>Membres</th>
                  <th>Statut</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubgroups.length > 0 ? (
                  filteredSubgroups.map((sg) => (
                    <tr key={sg._id}>
                      <td>
                        <div className="fw-bold">{sg.name}</div>
                        <div className="text-muted small text-truncate" style={{maxWidth: '200px'}}>{sg.description}</div>
                      </td>
                      <td>
                        <Badge bg="info" className="text-white px-3 py-2 rounded-pill">
                          {sg.type}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2 small">
                          <FaCalendarAlt className="text-muted" />
                          <span>
                            {new Date(sg.startDate).toLocaleDateString('fr-FR')} au {new Date(sg.endDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="border px-3 py-2">
                          <FaUsers className="me-2" />
                          {sg.members?.length || 0}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={sg.status === 'Actif' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill">
                          {sg.status}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Button variant="outline-primary" size="sm" onClick={() => navigate(`/manager/subgroups/${sg._id}`)}>
                            <FaEye />
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm" 
                            onClick={() => handleShowModal(sg)}
                            disabled={sg.status === 'Archivé'}
                          >
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(sg._id)}>
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      Aucun sous-groupe trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{editingSubgroup ? 'Modifier le Groupe' : 'Créer un Nouveau Groupe'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body className="p-4">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Nom du groupe</Form.Label>
                  <Form.Control
                    type="text"
                    {...register('name', { required: 'Le nom est requis' })}
                    isInvalid={!!errors.name}
                    placeholder="Ex: Voyage à Paris"
                  />
                  <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Type d'activité</Form.Label>
                  <Form.Select {...register('type', { required: 'Le type est requis' })}>
                    <option value="Voyage">Voyage</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Sortie">Sortie</option>
                    <option value="Activité Commune">Activité Commune</option>
                    <option value="Autre">Autre</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                {...register('description')}
                placeholder="Détails sur l'activité..."
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Date de début</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('startDate', { required: 'La date de début est requise' })}
                    isInvalid={!!errors.startDate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Date de fin</Form.Label>
                  <Form.Control
                    type="date"
                    {...register('endDate', { required: 'La date de fin est requise' })}
                    isInvalid={!!errors.endDate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.endDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {editingSubgroup && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Statut</Form.Label>
                <Form.Select {...register('status')}>
                  <option value="Actif">Actif</option>
                  <option value="Archivé">Archivé</option>
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit" className="px-4">
              {editingSubgroup ? 'Mettre à jour' : 'Créer le Groupe'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManageSubgroups;
