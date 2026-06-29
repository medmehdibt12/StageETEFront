import React, { useState, useEffect } from 'react';
import { Container, Card, Nav, Tab, Form, Button, Row, Col, Spinner, Badge, Table } from 'react-bootstrap';
import { Trash2, UploadCloud, Music, FileText, Video, PlayCircle, Eye, DownloadCloud, ArrowLeft, Settings } from 'lucide-react';
import { getOeuvres, uploadOeuvreMedia, deleteOeuvreMedia } from '../../../services/oeuvre.service';
import { useAuth } from '../../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { BACKEND_URL } from '../../../utils/axiosInstance';

const PUPITRES = ['Tutti', 'Soprano', 'Alto', 'Ténor', 'Basse'];

const MEDIA_TYPES = [
  { id: 'partition', label: 'Partition (PDF)', icon: <FileText size={18} className="me-2" />, accept: 'application/pdf' },
  { id: 'paroles', label: 'Paroles (PDF)', icon: <FileText size={18} className="me-2" />, accept: 'application/pdf' },
  { id: 'audio', label: 'Audio (MP3/WAV)', icon: <Music size={18} className="me-2" />, accept: 'audio/mp3, audio/wav, audio/mpeg' },
  { id: 'video', label: 'Vidéo (MP4 / Lien)', icon: <Video size={18} className="me-2" />, accept: 'video/mp4' },
  { id: 'choirRecording', label: 'Enregistrement Concert Chœur', icon: <PlayCircle size={18} className="me-2" />, accept: 'audio/mp3, audio/wav, audio/mpeg' },
  { id: 'choirVideo', label: 'Vidéo Concert Chœur (MP4/Lien)', icon: <Video size={18} className="me-2" />, accept: 'video/mp4' }
];

const OeuvreMediaManager = () => {
  const { user } = useAuth();
  const [oeuvres, setOeuvres] = useState([]);
  const [selectedOeuvre, setSelectedOeuvre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  const [uploadFiles, setUploadFiles] = useState({});
  const [videoLinks, setVideoLinks] = useState({});

  useEffect(() => {
    fetchOeuvres();
  }, []);

  useEffect(() => {
    if (selectedOeuvre) {
      if (canEditAll) {
        setActiveTab('Tutti');
      } else if (user?.isChefDePupitre && user?.pupitre) {
        const tabToSelect = PUPITRES.find(p => p.toLowerCase() === user.pupitre.toLowerCase() || p.replace('é', 'e').toLowerCase() === user.pupitre.toLowerCase());
        setActiveTab(tabToSelect || 'Tutti');
      } else {
        setActiveTab('Tutti');
      }
      setUploadFiles({});
      setVideoLinks({});
    }
  }, [selectedOeuvre, user]);

  const fetchOeuvres = async () => {
    setLoading(true);

    try {
      const response = await getOeuvres();

      let dataArray = [];
      if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response && Array.isArray(response.oeuvres)) {
        dataArray = response.oeuvres;
      }

      setOeuvres(dataArray);
    } catch (err) {
      console.error('Erreur de chargement des oeuvres', err);
      // Clean fallback in case of errors
      setOeuvres([]);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de récupérer la liste des œuvres.',
      });
    } finally {
      setLoading(false);
    }
  };

  const role = user?.role?.toLowerCase();
  const canEditAll = role === 'manager' || role === 'chef de choeur' || role === 'admin';
  const isChefPupitre = user?.isChefDePupitre;

  const canEditTab = (pupitreTab) => {
    if (canEditAll) return true;
    if (isChefPupitre && user?.pupitre) {
      const pTabNorm = pupitreTab.toLowerCase().replace('é', 'e');
      const uPupNorm = user.pupitre.toLowerCase().replace('é', 'e');
      return pTabNorm === uPupNorm;
    }
    return false;
  };

  const handleFileChange = (pupitre, mediaType, file) => {
    setUploadFiles(prev => ({
      ...prev,
      [`${pupitre}-${mediaType}`]: file
    }));
  };

  const handleLinkChange = (pupitre, mediaType, link) => {
    setVideoLinks(prev => ({
      ...prev,
      [`${pupitre}-${mediaType}`]: link
    }));
  };

  const handleSave = async (pupitre) => {
    const formData = new FormData();
    formData.append('pupitre', pupitre.toLowerCase());

    let hasData = false;

    MEDIA_TYPES.forEach(type => {
      const file = uploadFiles[`${pupitre}-${type.id}`];
      if (file) {
        formData.append(type.id, file);
        hasData = true;
      }
    });

    const vLink = videoLinks[`${pupitre}-video`];
    if (vLink && vLink.trim() !== '') {
      formData.append('videoLink', vLink); // Still use videoLink for backward compatibility if possible, but maybe better to specify?
      hasData = true;
    }
    
    const cvLink = videoLinks[`${pupitre}-choirVideo`];
    if (cvLink && cvLink.trim() !== '') {
      formData.append('choirVideoLink', cvLink); // New field for choir video link
      hasData = true;
    }

    if (!hasData) {
      Swal.fire('Info', 'Veuillez sélectionner au moins un fichier ou ajouter un lien.', 'info');
      return;
    }

    setActionLoading(true);
    try {
      const updatedOeuvre = await uploadOeuvreMedia(selectedOeuvre._id, formData);
      setSelectedOeuvre(updatedOeuvre);
      setOeuvres(prev => prev.map(o => o._id === updatedOeuvre._id ? updatedOeuvre : o));
      setUploadFiles({});
      setVideoLinks({});
      Swal.fire('Succès', 'Les médias ont été ajoutés avec succès.', 'success');
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du téléchargement des fichiers.';
      Swal.fire('Erreur', errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (pupitre, mediaType) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "La suppression de ce média est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        const updatedOeuvre = await deleteOeuvreMedia(selectedOeuvre._id, pupitre.toLowerCase(), mediaType);
        setSelectedOeuvre(updatedOeuvre);
        setOeuvres(prev => prev.map(o => o._id === updatedOeuvre._id ? updatedOeuvre : o));
        Swal.fire('Supprimé!', 'Le média a été supprimé.', 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Erreur', 'Erreur lors de la suppression.', 'error');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getPupitreMedia = (pupitre) => {
    if (!selectedOeuvre || !selectedOeuvre.pupitreMedia) return null;
    return selectedOeuvre.pupitreMedia.find(m => m.pupitre === pupitre.toLowerCase());
  };

  const renderMediaCard = (pupitre, mediaType, mediaData, canEdit) => {
    const existingMedia = mediaData ? mediaData[mediaType.id] : null;

    return (
      <Col md={6} xl={6} key={mediaType.id} className="mb-4">
        <Card className="h-100 shadow-sm border-0 bg-light">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center text-primary">
                {mediaType.icon} {mediaType.label}
              </h6>
              {existingMedia && <Badge bg="success">Fichier existant</Badge>}
            </div>

            {existingMedia ? (
              <div className="existing-media-preview">
                {mediaType.id === 'audio' ? (
                  <audio controls className="w-100 mt-2 mb-3">
                    <source src={`${BACKEND_URL}/uploads/media/${existingMedia}`} type="audio/mpeg" />
                    Votre navigateur ne supporte pas l'élément audio.
                  </audio>
                ) : mediaType.id === 'video' ? (
                  existingMedia.startsWith('http') ? (
                    <div className="mb-3">
                      <a href={existingMedia} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm w-100">
                        <PlayCircle size={16} className="me-2" />
                        Ouvrir le lien vidéo externe
                      </a>
                    </div>
                  ) : (
                    <video controls className="w-100 mt-2 mb-3" style={{ maxHeight: '200px', backgroundColor: '#000' }}>
                      <source src={`${BACKEND_URL}/uploads/media/${existingMedia}`} type="video/mp4" />
                      Votre navigateur ne supporte pas la balise vidéo.
                    </video>
                  )
                ) : (
                  <div className="d-flex gap-2 mb-3 mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => window.open(`${BACKEND_URL}/uploads/media/${existingMedia}`, '_blank')}
                      className="w-50"
                    >
                      <Eye size={16} className="me-2" /> Aperçu
                    </Button>
                    <a
                      href={`${BACKEND_URL}/uploads/media/${existingMedia}`}
                      download
                      className="btn btn-primary btn-sm w-50"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <DownloadCloud size={16} className="me-2" /> Télécharger
                    </a>
                  </div>
                )}

                {canEdit && (
                  <div className="text-end">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(pupitre, mediaType.id === 'video' && existingMedia.startsWith('http') ? 'videoLink' : mediaType.id)}>
                      <Trash2 size={14} className="me-1" /> Supprimer
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="upload-media-input">
                <Form.Group>
                  <Form.Label className="text-muted small">Ajouter un nouveau fichier</Form.Label>
                  <Form.Control
                    type="file"
                    accept={mediaType.accept}
                    disabled={!canEdit}
                    onChange={(e) => handleFileChange(pupitre, mediaType.id, e.target.files[0])}
                    title={!canEdit ? "Vous n'avez pas les droits pour modifier ce pupitre." : ""}
                  />
                </Form.Group>

                {(mediaType.id === 'video' || mediaType.id === 'choirVideo') && (
                  <>
                    <div className="text-center text-muted my-2 small">OU</div>
                    <Form.Group>
                      <Form.Label className="text-muted small">Ajouter un lien vidéo (ex: YouTube)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="https://..."
                        disabled={!canEdit}
                        value={videoLinks[`${pupitre}-${mediaType.id}`] || ''}
                        onChange={(e) => handleLinkChange(pupitre, mediaType.id, e.target.value)}
                      />
                    </Form.Group>
                  </>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '2rem', maxWidth: '1400px' }}>
      {!selectedOeuvre ? (
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center mb-4">
              <Music size={24} className="text-primary me-3" />
              <h4 className="fw-bold mb-0 text-dark">Gestion des Médias des Œuvres</h4>
            </div>
            <p className="text-muted">Sélectionnez une œuvre dans la liste ci-dessous pour gérer ses médias par pupitre (Pdf, Audio, Vidéo).</p>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Chargement des œuvres...</p>
              </div>
            ) : oeuvres.length === 0 ? (
              <div className="text-center py-5 bg-light rounded border border-dashed">
                <Music size={48} className="text-muted mb-3" opacity={0.5} />
                <h5 className="text-muted">Aucune œuvre trouvée</h5>
                <p className="small text-muted">Veuillez d'abord créer une œuvre dans la section d'administration.</p>
              </div>
            ) : (
              <Table bordered hover responsive className="mb-0 mt-3 align-middle bg-white shadow-sm rounded">
                <thead className="bg-light">
                  <tr>
                    <th>Titre de l'œuvre</th>
                    <th>Compositeurs</th>
                    <th>Statut Média</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {oeuvres.map(oeuvre => (
                    <tr key={oeuvre._id}>
                      <td className="fw-semibold">{oeuvre.title}</td>
                      <td>{oeuvre.composers?.join(', ') || '-'}</td>
                      <td>
                        <Badge bg={oeuvre.pupitreMedia?.length > 0 ? 'success' : 'secondary'}>
                          {oeuvre.pupitreMedia?.length > 0 ? 'Médias rattachés' : 'Vide'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setSelectedOeuvre(oeuvre)}
                          className="d-inline-flex align-items-center"
                        >
                          <Settings size={14} className="me-2" />
                          Gérer les médias
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <div className="d-flex align-items-center mb-4">
            <Button variant="link" className="text-decoration-none p-0 d-flex align-items-center text-secondary hover-primary" onClick={() => setSelectedOeuvre(null)}>
              <ArrowLeft size={20} className="me-2" /> Retour à la liste des œuvres
            </Button>
          </div>

          <Card className="shadow-sm border-0">
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Card.Header className="bg-white border-bottom pt-4 px-4 pb-0">
                <h4 className="fw-bold mb-1 text-primary">{selectedOeuvre.title}</h4>
                <p className="text-muted small mb-4">Gestion des 4 ressources : Partition, Paroles, Audio, Vidéo</p>

                <Nav variant="tabs" className="border-bottom-0 pb-2 flex-nowrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {PUPITRES.map(pupitre => {
                    const hasAccess = canEditTab(pupitre);
                    return (
                      <Nav.Item key={pupitre} className="me-2">
                        <Nav.Link
                          eventKey={pupitre}
                          className={`fw-semibold px-4 py-2 ${activeTab === pupitre ? 'border-primary border-bottom-2 text-primary' : 'text-muted'}`}
                          style={{
                            borderRadius: '8px 8px 0 0',
                            border: activeTab === pupitre ? '1px solid #dee2e6' : 'none',
                            borderBottom: activeTab === pupitre ? '3px solid #0d6efd' : 'none',
                            backgroundColor: activeTab === pupitre ? '#fff' : 'transparent',
                            opacity: hasAccess || activeTab === pupitre ? 1 : 0.7
                          }}
                        >
                          {pupitre}
                          {!hasAccess && <LockIcon size={12} className="ms-2 text-muted" />}
                        </Nav.Link>
                      </Nav.Item>
                    );
                  })}
                </Nav>
              </Card.Header>

              <Card.Body className="p-4 bg-light">
                <div className="bg-white p-4 border rounded shadow-sm">
                  <Tab.Content>
                    {PUPITRES.map(pupitre => {
                      const mediaData = getPupitreMedia(pupitre);
                      const canEdit = canEditTab(pupitre);
                      const hasFilesToUpload = Object.keys(uploadFiles).some(k => k.startsWith(pupitre)) || (videoLinks[pupitre] && videoLinks[pupitre].trim() !== '');

                      return (
                        <Tab.Pane eventKey={pupitre} key={pupitre}>
                          {!canEdit && (
                            <div className="alert alert-secondary d-flex align-items-center mb-4" role="alert">
                              <Eye size={18} className="me-2" />
                              <strong>Mode Lecture Seule :</strong>&nbsp;Vous n'avez pas les droits pour modifier les médias du pupitre {pupitre}.
                            </div>
                          )}

                          <Row>
                            {MEDIA_TYPES.map(mediaType => renderMediaCard(pupitre, mediaType, mediaData, canEdit))}
                          </Row>

                          {canEdit && (
                            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                              <Button
                                variant="primary"
                                size="lg"
                                className="px-4 fw-semibold shadow-sm d-flex align-items-center"
                                onClick={() => handleSave(pupitre)}
                                disabled={actionLoading || !hasFilesToUpload}
                              >
                                {actionLoading ? (
                                  <><Spinner size="sm" className="me-2" /> Enregistrement...</>
                                ) : (
                                  <><UploadCloud size={18} className="me-2" /> Enregistrer les ajouts/modifications ({pupitre})</>
                                )}
                              </Button>
                            </div>
                          )}
                        </Tab.Pane>
                      );
                    })}
                  </Tab.Content>
                </div>
              </Card.Body>
            </Tab.Container>
          </Card>
        </>
      )}
    </Container>
  );
};

const LockIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export default OeuvreMediaManager;
