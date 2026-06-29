import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Table, Spinner, Modal, Form, Row, Col, Badge, InputGroup, ListGroup, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaTrash, FaPaperPlane, FaSearch, FaUser, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { 
  getSubgroupById, 
  addMembersToSubgroup, 
  removeMemberFromSubgroup, 
  sendSubgroupAnnouncement,
  getAllChoristes
} from '../../../services/subgroup.service';

const SubgroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subgroup, setSubgroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [allChoristes, setAllChoristes] = useState([]);
  const [selectedChoristes, setSelectedChoristes] = useState([]);
  const [announceMessage, setAnnounceMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await getSubgroupById(id);
      setSubgroup(response.data);
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les détails', 'error');
      navigate('/manager/subgroups');
    } finally {
      setLoading(false);
    }
  };

  const fetchChoristes = async () => {
    try {
      const response = await getAllChoristes();
      const options = response.map(c => ({
        value: c._id,
        label: `${c.firstName} ${c.lastName} (${c.pupitre})`
      }));
      setAllChoristes(options);
    } catch (error) {
      console.error('Error fetching choristes:', error);
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchChoristes();
  }, [id]);

  const handleAddMembers = async () => {
    if (selectedChoristes.length === 0) return;
    
    try {
      const userIds = selectedChoristes.map(c => c.value);
      await addMembersToSubgroup(id, userIds);
      Swal.fire('Succès', 'Membres ajoutés', 'success');
      setShowAddModal(false);
      setSelectedChoristes([]);
      fetchDetails();
    } catch (error) {
      Swal.fire('Erreur', 'Opération échouée', 'error');
    }
  };

  const handleRemoveMember = async (userId) => {
    const result = await Swal.fire({
      title: 'Retirer ce membre ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, retirer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await removeMemberFromSubgroup(id, userId);
        Swal.fire('Retiré', 'Le membre a été retiré du groupe.', 'success');
        fetchDetails();
      } catch (error) {
        Swal.fire('Erreur', 'Opération échouée', 'error');
      }
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announceMessage.trim()) return;
    
    setIsSending(true);
    try {
      await sendSubgroupAnnouncement(id, announceMessage);
      Swal.fire('Envoyé', "L'annonce est en cours d'envoi aux membres.", 'success');
      setShowAnnounceModal(false);
      setAnnounceMessage('');
    } catch (error) {
      Swal.fire('Erreur', "L'envoi a échoué", 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement des détails...</p>
      </div>
    );
  }

  return (
    <Container fluid className="p-4">
      <Button 
        variant="link" 
        className="text-muted p-0 mb-4 d-flex align-items-center gap-2" 
        onClick={() => navigate('/manager/subgroups')}
      >
        <FaArrowLeft /> Retour à la liste
      </Button>

      {subgroup.status === 'Archivé' && (
        <Alert variant="warning" className="mb-4 shadow-sm d-flex align-items-center gap-3">
          <FaInfoCircle size={20} />
          <div>
            <strong>Groupe Archivé :</strong> Ce groupe est en lecture seule car l'évènement est passé. Vous ne pouvez plus modifier les membres ni envoyer d'annonces.
          </div>
        </Alert>
      )}

      <Row>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-primary text-white py-3">
              <h5 className="mb-0">Informations du Groupe</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4 text-center">
                <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                  <FaInfoCircle size={40} className="text-primary" />
                </div>
                <h3 className="fw-bold">{subgroup.name}</h3>
                <Badge bg="info" className="px-3 py-2 rounded-pill">{subgroup.type}</Badge>
              </div>

              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between px-0 py-3">
                  <span className="text-muted">Statut</span>
                  <Badge bg={subgroup.status === 'Actif' ? 'success' : 'secondary'}>{subgroup.status}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-3">
                  <div className="text-muted mb-2 d-flex align-items-center gap-2">
                    <FaCalendarAlt size={14} /> Période
                  </div>
                  <div className="fw-bold small">
                    Du {new Date(subgroup.startDate).toLocaleDateString('fr-FR')} <br/>
                    Au {new Date(subgroup.endDate).toLocaleDateString('fr-FR')}
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-3">
                  <div className="text-muted mb-2">Description</div>
                  <p className="mb-0 small">{subgroup.description || 'Aucune description.'}</p>
                </ListGroup.Item>
              </ListGroup>

              <div className="mt-4">
                <Button 
                  variant="primary" 
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowAnnounceModal(true)}
                  disabled={subgroup.members?.length === 0 || subgroup.status === 'Archivé'}
                >
                  <FaPaperPlane /> Envoyer une Annonce
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Membres du Groupe ({subgroup.members?.length || 0})</h5>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => setShowAddModal(true)}
                disabled={subgroup.status === 'Archivé'}
              >
                <FaPlus className="me-2" /> Ajouter des Membres
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Membre</th>
                    <th>Pupitre</th>
                    <th>Email</th>
                    <th className="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subgroup.members?.length > 0 ? (
                    subgroup.members.map((member) => (
                      <tr key={member._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            {member.avatar ? (
                              <img src={member.avatar} alt="Avatar" className="rounded-circle" width="35" height="35" />
                            ) : (
                              <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>
                                <FaUser className="text-muted" />
                              </div>
                            )}
                            <div className="fw-bold">{member.firstName} {member.lastName}</div>
                          </div>
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border text-capitalize">
                            {member.pupitre}
                          </Badge>
                        </td>
                        <td className="text-muted small">{member.email}</td>
                        <td className="text-end pe-4">
                          <Button 
                            variant="link" 
                            className="text-danger p-0" 
                            onClick={() => handleRemoveMember(member._id)}
                            disabled={subgroup.status === 'Archivé'}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        Aucun membre dans ce groupe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal: Add Members */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter des Choristes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Sélectionner des membres</Form.Label>
            <Select
              isMulti
              options={allChoristes}
              value={selectedChoristes}
              onChange={setSelectedChoristes}
              placeholder="Rechercher des choristes..."
              className="basic-multi-select"
              classNamePrefix="select"
            />
            <Form.Text className="text-muted">
              Vous pouvez ajouter plusieurs choristes à la fois, quel que soit leur pupitre.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleAddMembers} disabled={selectedChoristes.length === 0}>
            Ajouter au Groupe
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: Send Announcement */}
      <Modal show={showAnnounceModal} onHide={() => setShowAnnounceModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Envoyer une Annonce au Groupe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Cette annonce sera envoyée par email à tous les membres du groupe <strong>{subgroup.name}</strong>.
          </Alert>
          <Form.Group>
            <Form.Label className="fw-bold">Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={announceMessage}
              onChange={(e) => setAnnounceMessage(e.target.value)}
              placeholder="Saisissez votre message ici..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAnnounceModal(false)}>Annuler</Button>
          <Button 
            variant="primary" 
            onClick={handleSendAnnouncement} 
            disabled={!announceMessage.trim() || isSending}
          >
            {isSending ? <><Spinner size="sm" className="me-2" /> Envoi en cours...</> : <><FaPaperPlane className="me-2" /> Envoyer l'Annonce</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SubgroupDetails;
