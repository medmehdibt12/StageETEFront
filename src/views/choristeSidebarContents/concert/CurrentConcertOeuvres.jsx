import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Row, Col, Spinner, Button, Badge, Form, Alert, Dropdown } from 'react-bootstrap';
import {
  Music,
  FileText,
  Video,
  PlayCircle,
  DownloadCloud,
  Eye,
  Calendar,
  MapPin,
  Music2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  Users,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { getCurrentConcertOeuvres } from '../../../services/concert.service';
import api, { BACKEND_URL } from '../../../utils/axiosInstance';

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str);

// Construit une URL de fichier sans doubler le "/" entre BACKEND_URL et le chemin,
// que BACKEND_URL se termine ou non par un slash (évite le bug "//uploads/media/...").
const buildFileUrl = (folder, filename) => {
  const base = (BACKEND_URL || '').replace(/\/+$/, '');
  return `${base}/uploads/${folder}/${filename}`;
};

// Formatte une date en "il y a X jours / la semaine dernière / il y a X sem." (style El Jem)
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 14) return 'la semaine dernière';
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
  return `il y a ${Math.floor(diffDays / 30)} mois`;
};

const MEDIA_LABELS = {
  partition: 'Partition',
  paroles: 'Paroles',
  audio: 'Enregistrement Sonore',
  video: 'Support Vidéo',
  choirRecording: 'Enregistrement Concert',
  choirVideo: 'Vidéo Concert'
};

const CurrentConcertOeuvres = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtre de pupitre actif ('all' = tout afficher, sinon une valeur d'enum comme 'tutti' ou 'basse')
  const [activePupitre, setActivePupitre] = useState('all');

  // Filtre de statut actif ('all' | 'chante' | 'sansChoeur') basé sur oeuvre.requiresChoir
  const [statusFilter, setStatusFilter] = useState('all');

  // IDs des œuvres cochées pour le téléchargement groupé
  const [selectedOeuvres, setSelectedOeuvres] = useState(new Set());
  const [downloading, setDownloading] = useState(false);

  // Œuvres actuellement dépliées dans la liste
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Si l'affiche du concert ne charge pas (fichier manquant, etc.), on bascule sur une icône locale
  const [posterError, setPosterError] = useState(false);

  // Réordonnancement (manager/admin uniquement — piloté par data.canReorder / data.isLocked
  // renvoyés par le backend, qui reste l'autorité finale sur qui peut réordonner et jusqu'à quand).
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCurrentConcertOeuvres();
      setData(res);
      setError(null);
      setPosterError(false);
    } catch (err) {
      console.error('Error fetching current concert oeuvres:', err);
      if (err.response && err.response.status === 404) {
        setError('Aucun concert à venir programmé pour le moment. Revenez bientôt !');
      } else {
        setError('Une erreur est survenue lors du chargement des données.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Déplace une œuvre d'une position (haut/bas) dans le programme, et persiste immédiatement
  // le nouvel ordre côté backend. Mise à jour optimiste avec rollback en cas d'erreur (ex: le
  // jour du concert est arrivé entre-temps → 403 "verrouillé").
  const moveOeuvre = async (oeuvreId, direction) => {
    if (!data || !data.canReorder || data.isLocked) return;

    const currentOrder = data.oeuvres.map((o) => o._id);
    const index = currentOrder.indexOf(oeuvreId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];

    const reorderedOeuvres = newOrder.map((id) => data.oeuvres.find((o) => o._id === id));
    const previousData = data;

    setReorderingId(oeuvreId);
    setData({ ...data, oeuvres: reorderedOeuvres }); // mise à jour optimiste

    try {
      await api.patch(`/concerts/${data.concert._id}/reorder-programme`, { programme: newOrder });
    } catch (err) {
      console.error('Erreur réordonnancement:', err);
      setData(previousData); // rollback
      const message = err.response?.data?.message || "Impossible de réordonner le programme.";
      Swal.fire('Erreur', message, 'error');
    } finally {
      setReorderingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non définie';
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch (e) {
      return dateString;
    }
  };

  // Filtre les médias d'une œuvre selon le pupitre actif.
  // "all" -> tous les médias reçus (déjà limités par le backend à tutti + mon pupitre).
  // Sinon -> uniquement les médias de la valeur d'enum choisie (ex. 'tutti' ou 'basse').
  const getFilteredMedia = (oeuvre) => {
    if (!oeuvre.pupitreMedia) return [];
    if (activePupitre === 'all') return oeuvre.pupitreMedia;
    return oeuvre.pupitreMedia.filter((m) => m.pupitre === activePupitre);
  };

  // Valeurs de pupitre réellement présentes dans les données reçues (ex. ['tutti', 'basse']).
  const availablePupitres = useMemo(() => {
    if (!data || !data.oeuvres) return [];
    const set = new Set();
    data.oeuvres.forEach((o) => (o.pupitreMedia || []).forEach((m) => set.add(m.pupitre)));
    return Array.from(set);
  }, [data]);

  // Sur "Tout" (activePupitre === 'all') : on affiche toutes les œuvres, même celles sans
  // média (badge "Pas de médias", non sélectionnables).
  // Sur un pupitre précis (ex. "soprano" ou "tutti") : on ne montre QUE les œuvres qui ont
  // effectivement un média pour ce pupitre exact — les autres sont masquées, pas juste grisées.
  const visibleOeuvres = useMemo(() => {
    if (!data || !data.oeuvres) return [];
    let list = data.oeuvres;
    if (activePupitre !== 'all') {
      list = list.filter((oeuvre) => (oeuvre.pupitreMedia || []).some((m) => m.pupitre === activePupitre));
    }
    if (statusFilter === 'chante') {
      list = list.filter((oeuvre) => oeuvre.requiresChoir);
    } else if (statusFilter === 'sansChoeur') {
      list = list.filter((oeuvre) => !oeuvre.requiresChoir);
    }
    return list;
  }, [data, activePupitre, statusFilter]);

  // Nombre de filtres actifs (pupitre + statut), affiché en badge sur le bouton "Filtres"
  const activeFilterCount = (activePupitre !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  // Sous-ensemble des œuvres réellement sélectionnables (celles qui ont au moins un média
  // pour le pupitre actif) — utilisé pour "Tout sélectionner" et le téléchargement groupé.
  const selectableOeuvres = useMemo(() => {
    return visibleOeuvres.filter((oeuvre) => getFilteredMedia(oeuvre).length > 0);
  }, [visibleOeuvres, activePupitre]);

  // Œuvres récemment créées ou mises à jour (< 30 jours), pour le bandeau "Dernières mises à jour"
  const recentUpdates = useMemo(() => {
    const items = visibleOeuvres
      .map((o) => {
        const created = o.createdAt ? new Date(o.createdAt) : null;
        const updated = o.updatedAt ? new Date(o.updatedAt) : null;
        if (!created && !updated) return null;
        const daysSinceCreated = created ? (Date.now() - created.getTime()) / 86400000 : Infinity;
        const daysSinceUpdated = updated ? (Date.now() - updated.getTime()) / 86400000 : Infinity;
        const isNew = daysSinceCreated < 14;
        const isUpdated = !isNew && daysSinceUpdated < 14;
        if (!isNew && !isUpdated) return null;
        return {
          id: o._id,
          title: o.title,
          isNew,
          date: isNew ? o.createdAt : o.updatedAt
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
    return items;
  }, [visibleOeuvres]);

  const toggleOeuvreSelection = (id) => {
    setSelectedOeuvres((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOeuvres.size === selectableOeuvres.length) {
      setSelectedOeuvres(new Set());
    } else {
      setSelectedOeuvres(new Set(selectableOeuvres.map((o) => o._id)));
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Le backend stocke les fichiers sous la forme "<timestamp>-<nomOriginal.ext>"
  // (voir uploadMediaMiddleware.js : `Date.now() + "-" + file.originalname`).
  // On retire ce préfixe pour retrouver le nom original tel qu'uploadé.
  const getOriginalFileName = (storedFilename) => {
    if (!storedFilename) return storedFilename;
    return storedFilename.replace(/^\d+-/, '');
  };

  // Déclenche un vrai téléchargement de fichier individuel.
  // Important : un simple <a download> ne force PAS le téléchargement quand le
  // fichier vient d'une autre origine (ex. backend sur :5000, front sur :3000) —
  // le navigateur ouvre juste le PDF au lieu de le sauvegarder. On récupère donc
  // le fichier via fetch() en blob, ce qui garantit le téléchargement dans tous les cas.
  // Le fichier est enregistré sous son nom d'origine (sans le préfixe timestamp).
  const triggerDownload = async (filename) => {
    try {
      const url = buildFileUrl('media', filename);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Échec du téléchargement (${response.status})`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = getOriginalFileName(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erreur téléchargement:', filename, err);
    }
  };

  // Télécharge chaque PDF (partition + paroles) des œuvres sélectionnées, séparément
  const handleDownloadSelection = async () => {
    if (selectedOeuvres.size === 0) return;
    setDownloading(true);
    try {
      const oeuvresToDownload = visibleOeuvres.filter((o) => selectedOeuvres.has(o._id));
      for (const oeuvre of oeuvresToDownload) {
        const medias = getFilteredMedia(oeuvre);
        for (const media of medias) {
          if (media.partition) {
            await triggerDownload(media.partition);
            await new Promise((r) => setTimeout(r, 300));
          }
          if (media.paroles) {
            await triggerDownload(media.paroles);
            await new Promise((r) => setTimeout(r, 300));
          }
          if (media.audio) {
            await triggerDownload(media.audio);
            await new Promise((r) => setTimeout(r, 300));
          }
          if (media.choirRecording) {
            await triggerDownload(media.choirRecording);
            await new Promise((r) => setTimeout(r, 300));
          }
          // video/choirVideo peuvent être des liens externes (YouTube, etc.) : on ne les
          // télécharge que si ce sont des fichiers hébergés localement.
          if (media.video && !media.video.startsWith('http')) {
            await triggerDownload(media.video);
            await new Promise((r) => setTimeout(r, 300));
          }
          if (media.choirVideo && !media.choirVideo.startsWith('http')) {
            await triggerDownload(media.choirVideo);
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-sm border-0 p-5 rounded-4 bg-white">
            <div className="bg-primary-subtle p-4 rounded-circle d-inline-flex mb-4 mx-auto">
              <Music2 size={64} className="text-primary" />
            </div>
            <h3 className="fw-bold text-dark mb-3">{error}</h3>
            <p className="text-muted fs-6">
              Votre carnet de chant sera disponible dès qu'un concert sera planifié pour votre pupitre.
            </p>
            <Button variant="outline-primary" className="mt-3 px-4 py-2 rounded-pill fw-bold mx-auto" onClick={fetchData}>
              Actualiser la page
            </Button>
          </Card>
        </motion.div>
      </Container>
    );
  }

  if (!data || !data.concert) return null;

  const { concert } = data;
  const allSelected = selectableOeuvres.length > 0 && selectedOeuvres.size === selectableOeuvres.length;

  return (
    <Container fluid className="px-3 px-md-4 py-4" style={{ maxWidth: '1400px' }}>
      {/* Header compact du concert */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <Card.Body className="p-4">
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill text-uppercase small fw-bold">
                  Prochain concert
                </Badge>
                <h2 className="fw-bold text-dark mb-0">{concert.title}</h2>
              </div>
              <div className="rounded-circle overflow-hidden flex-shrink-0" style={{ width: 56, height: 56 }}>
                {concert.poster && !posterError ? (
                  <img
                    src={buildFileUrl('posters', concert.poster)}
                    alt={concert.title}
                    className="w-100 h-100"
                    style={{ objectFit: 'cover' }}
                    onError={() => setPosterError(true)}
                  />
                ) : (
                  <div className="bg-primary-subtle d-flex align-items-center justify-content-center w-100 h-100">
                    <Music size={22} className="text-primary" />
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex flex-wrap gap-4 mt-2">
              <div className="d-flex align-items-center gap-2 text-muted">
                <Calendar size={18} className="text-primary" />
                <span className="fw-semibold text-dark">{formatDate(concert.dateHeure)}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted">
                <MapPin size={18} className="text-primary" />
                <span className="fw-semibold text-dark">{concert.location || 'Lieu non spécifié'}</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Bandeau manager : mode réordonnancement + statut de verrouillage le jour du concert */}
      {data.canReorder && (
        <Alert variant={data.isLocked ? 'secondary' : 'info'} className="d-flex align-items-center gap-2 rounded-4 mb-3">
          {data.isLocked ? <Lock size={16} className="flex-shrink-0" /> : <Users size={16} className="flex-shrink-0" />}
          <span className="small">
            {data.isLocked
              ? "Le jour du concert est arrivé : l'ordre du programme ne peut plus être modifié."
              : "Le numéro devant chaque œuvre indique son ordre de passage. Utilisez les flèches ↑ ↓ pour réordonner jusqu'au jour du concert."}
          </span>
        </Alert>
      )}

      {/* Bandeau "Dernières mises à jour", façon El Jem */}
      {recentUpdates.length > 0 && (
        <Card className="border-0 bg-light rounded-4 mb-4">
          <Card.Body className="p-3">
            <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold small text-uppercase">
              <Sparkles size={15} /> Dernières mises à jour
            </div>
            <div className="d-flex flex-column gap-2">
              {recentUpdates.map((u) => (
                <div key={u.id} className="d-flex align-items-center justify-content-between">
                  <span className="small fw-medium text-dark">{u.title}</span>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={u.isNew ? 'primary' : 'secondary'} className="rounded-pill small">
                      {u.isNew ? 'NOUVEAU' : 'MIS À JOUR'}
                    </Badge>
                    <span className="text-muted small">{formatRelativeTime(u.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Titre section + filtres + sélection globale */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
        <div className="d-flex align-items-center">
          <div className="bg-primary p-2 rounded-3 me-2 text-white">
            <Music size={18} />
          </div>
          <h5 className="fw-bold m-0 text-dark">Programme du Concert</h5>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Dropdown align="end" autoClose="outside">
            <Dropdown.Toggle
              as={Button}
              variant={activeFilterCount > 0 ? 'primary' : 'outline-secondary'}
              size="sm"
              className="rounded-pill px-3 fw-semibold d-flex align-items-center gap-2"
            >
              <SlidersHorizontal size={14} />
              Filtres
              {activeFilterCount > 0 && (
                <Badge bg="white" text="primary" pill className="fw-bold">
                  {activeFilterCount}
                </Badge>
              )}
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-3 shadow border-0 rounded-4" style={{ minWidth: 280 }}>
              {availablePupitres.length > 1 && (
                <>
                  <div className="text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem' }}>
                    Pupitre
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <Button
                      size="sm"
                      variant={activePupitre === 'all' ? 'primary' : 'outline-secondary'}
                      className="rounded-pill px-3 fw-semibold"
                      onClick={() => {
                        setActivePupitre('all');
                        setSelectedOeuvres(new Set());
                      }}
                    >
                      Tout
                    </Button>
                    {availablePupitres.map((tab) => (
                      <Button
                        key={tab}
                        size="sm"
                        variant={activePupitre === tab ? 'primary' : 'outline-secondary'}
                        className="rounded-pill px-3 fw-semibold"
                        onClick={() => {
                          setActivePupitre(tab);
                          setSelectedOeuvres(new Set());
                        }}
                      >
                        {tab === 'tutti' ? 'Tutti' : capitalize(tab)}
                      </Button>
                    ))}
                  </div>
                </>
              )}

              <div className="text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem' }}>
                Statut
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'primary' : 'outline-secondary'}
                  className="rounded-pill px-3 fw-semibold"
                  onClick={() => {
                    setStatusFilter('all');
                    setSelectedOeuvres(new Set());
                  }}
                >
                  Toutes
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'chante' ? 'primary' : 'outline-secondary'}
                  className="rounded-pill px-3 fw-semibold d-flex align-items-center gap-1"
                  onClick={() => {
                    setStatusFilter('chante');
                    setSelectedOeuvres(new Set());
                  }}
                >
                  <Users size={13} /> Chanté
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'sansChoeur' ? 'primary' : 'outline-secondary'}
                  className="rounded-pill px-3 fw-semibold"
                  onClick={() => {
                    setStatusFilter('sansChoeur');
                    setSelectedOeuvres(new Set());
                  }}
                >
                  Sans chœur
                </Button>
              </div>

              {activeFilterCount > 0 && (
                <div className="text-end mt-3 pt-2 border-top">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-decoration-none fw-semibold text-danger"
                    onClick={() => {
                      setActivePupitre('all');
                      setStatusFilter('all');
                      setSelectedOeuvres(new Set());
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </Dropdown.Menu>
          </Dropdown>

          {selectableOeuvres.length > 0 && (
            <Button variant="link" className="d-flex align-items-center text-decoration-none fw-semibold p-0" onClick={toggleSelectAll}>
              {allSelected ? <CheckSquare size={18} className="me-2" /> : <Square size={18} className="me-2" />}
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
          )}
        </div>
      </div>

      {/* Liste plate et numérotée des œuvres */}
      <AnimatePresence>
        <div className="d-flex flex-column gap-3 mb-5">
          {visibleOeuvres.length > 0 ? (
            visibleOeuvres.map((oeuvre, idx) => {
              const filteredMedia = getFilteredMedia(oeuvre);
              const hasMedia = filteredMedia.length > 0;
              const isChecked = selectedOeuvres.has(oeuvre._id);
              const isExpanded = expandedIds.has(oeuvre._id);

              return (
                <motion.div
                  key={oeuvre._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                >
                  <Card className={`border-0 shadow-sm rounded-4 overflow-hidden ${!hasMedia ? 'opacity-75' : ''}`}>
                    {/* Ligne d'en-tête cliquable */}
                    <div
                      className="d-flex align-items-center gap-3 p-3"
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleExpand(oeuvre._id)}
                    >
                      <Form.Check
                        type="checkbox"
                        checked={isChecked}
                        disabled={!hasMedia}
                        title={!hasMedia ? 'Aucun média disponible pour cette œuvre' : undefined}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => hasMedia && toggleOeuvreSelection(oeuvre._id)}
                      />
                      <div
                        className="bg-primary text-white fw-bold rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                        style={{ width: 34, height: 34, fontSize: '1rem' }}
                        title="Ordre de passage dans le programme"
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-grow-1 text-start">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {!hasMedia && (
                            <Badge bg="secondary-subtle" text="secondary" className="rounded-pill small fw-semibold">
                              Pas de médias
                            </Badge>
                          )}
                          <Badge
                            bg={oeuvre.requiresChoir ? 'primary-subtle' : 'light'}
                            text={oeuvre.requiresChoir ? 'primary' : 'dark'}
                            className="rounded-pill small fw-semibold border"
                          >
                            {oeuvre.requiresChoir ? 'Chanté' : 'Sans chœur'}
                          </Badge>
                          <div className="fw-bold text-dark">{oeuvre.title}</div>
                        </div>
                        <div className="text-primary small fst-italic">
                          {Array.isArray(oeuvre.composers) ? oeuvre.composers.join(', ') : oeuvre.composers || '-'}
                        </div>
                      </div>
                      {/* Flèches de réordonnancement (manager/admin, uniquement en vue non filtrée, avant le jour J) */}
                      {data.canReorder && !data.isLocked && activePupitre === 'all' && statusFilter === 'all' && (
                        <div
                          className="d-flex flex-column border rounded-3 overflow-hidden bg-white flex-shrink-0"
                          style={{ width: 30 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="light"
                            size="sm"
                            className="p-0 d-flex align-items-center justify-content-center border-0 rounded-0 text-primary"
                            style={{ width: '100%', height: 24 }}
                            disabled={idx === 0 || reorderingId !== null}
                            onClick={() => moveOeuvre(oeuvre._id, 'up')}
                            title="Monter dans le programme"
                          >
                            <ChevronUp size={16} strokeWidth={2.5} />
                          </Button>
                          <div className="border-top" />
                          <Button
                            variant="light"
                            size="sm"
                            className="p-0 d-flex align-items-center justify-content-center border-0 rounded-0 text-primary"
                            style={{ width: '100%', height: 24 }}
                            disabled={idx === visibleOeuvres.length - 1 || reorderingId !== null}
                            onClick={() => moveOeuvre(oeuvre._id, 'down')}
                            title="Descendre dans le programme"
                          >
                            <ChevronDown size={16} strokeWidth={2.5} />
                          </Button>
                        </div>
                      )}
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={20} className="text-muted" />
                      </motion.div>
                    </div>

                    {/* Contenu déplié : médias */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="border-top px-3 pb-3 pt-3">
                            {!hasMedia ? (
                              <p className="text-muted small fst-italic mb-0 text-center py-2">
                                Aucun média disponible pour cette œuvre
                                {activePupitre !== 'all' ? ` (pupitre ${activePupitre === 'tutti' ? 'Tutti' : capitalize(activePupitre)})` : ''}.
                              </p>
                            ) : (
                              <>
                            {/* Fichiers PDF, en lignes plates */}
                            <div className="d-flex flex-column gap-2 mb-2">
                              {filteredMedia.map((media, mIdx) =>
                                ['partition', 'paroles'].map((key) =>
                                  media[key] ? (
                                    <div
                                      key={`${oeuvre._id}-${mIdx}-${key}`}
                                      className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2"
                                    >
                                      <div className="d-flex align-items-center gap-2 text-start">
                                        <FileText size={16} className="text-primary flex-shrink-0" />
                                        <span className="fw-semibold small text-dark">{MEDIA_LABELS[key]}</span>
                                        <Badge bg="white" text="dark" className="border small text-uppercase" style={{ fontSize: '0.65rem' }}>
                                          {media.pupitre}
                                        </Badge>
                                      </div>
                                      <div className="d-flex align-items-center gap-1">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          className="d-flex align-items-center py-1"
                                          onClick={() => window.open(buildFileUrl('media', media[key]), '_blank')}
                                        >
                                          <Eye size={14} className="me-1" /> Aperçu
                                        </Button>
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          className="d-flex align-items-center py-1"
                                          onClick={() => triggerDownload(media[key])}
                                        >
                                          <DownloadCloud size={14} className="me-1" /> Télécharger
                                        </Button>
                                      </div>
                                    </div>
                                  ) : null
                                )
                              )}
                            </div>

                            {/* Audio / vidéo, gardés en cartes (nécessitent un lecteur) */}
                            <Row className="g-3">
                              {filteredMedia.map((media, mIdx) => (
                                <React.Fragment key={`${oeuvre._id}-player-${mIdx}`}>
                                  {media.audio && (
                                    <Col md={6}>
                                      <div className="bg-light rounded-3 p-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                          <Music size={16} className="text-success" />
                                          <span className="fw-semibold small text-dark">Enregistrement Sonore</span>
                                          <Badge bg="white" text="dark" className="border small text-uppercase" style={{ fontSize: '0.6rem' }}>
                                            {media.pupitre}
                                          </Badge>
                                        </div>
                                        <audio controls className="w-100" style={{ height: 36 }}>
                                          <source src={buildFileUrl('media', media.audio)} type="audio/mpeg" />
                                          Votre navigateur ne supporte pas l'élément audio.
                                        </audio>
                                      </div>
                                    </Col>
                                  )}
                                  {media.choirRecording && (
                                    <Col md={6}>
                                      <div className="bg-light rounded-3 p-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                          <Music size={16} style={{ color: '#8e44ad' }} />
                                          <span className="fw-semibold small text-dark">Enregistrement Concert</span>
                                          <Badge bg="white" text="dark" className="border small text-uppercase" style={{ fontSize: '0.6rem' }}>
                                            {media.pupitre}
                                          </Badge>
                                        </div>
                                        <audio controls className="w-100" style={{ height: 36 }}>
                                          <source src={buildFileUrl('media', media.choirRecording)} type="audio/mpeg" />
                                          Votre navigateur ne supporte pas l'élément audio.
                                        </audio>
                                      </div>
                                    </Col>
                                  )}
                                  {media.video && (
                                    <Col md={12}>
                                      <div className="bg-light rounded-3 p-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                          <Video size={16} className="text-warning" />
                                          <span className="fw-semibold small text-dark">Support Vidéo</span>
                                          <Badge bg="white" text="dark" className="border small text-uppercase" style={{ fontSize: '0.6rem' }}>
                                            {media.pupitre}
                                          </Badge>
                                        </div>
                                        {media.video.startsWith('http') ? (
                                          <Button
                                            variant="outline-primary"
                                            className="w-100 d-flex align-items-center justify-content-center fw-bold rounded-pill py-2"
                                            onClick={() => window.open(media.video, '_blank')}
                                          >
                                            <PlayCircle size={18} className="me-2" /> Visionner sur plateforme externe
                                          </Button>
                                        ) : (
                                          <div className="overflow-hidden rounded-3 bg-dark">
                                            <video controls className="w-100" style={{ maxHeight: '360px' }}>
                                              <source src={buildFileUrl('media', media.video)} type="video/mp4" />
                                              Votre navigateur ne supporte pas la balise vidéo.
                                            </video>
                                          </div>
                                        )}
                                      </div>
                                    </Col>
                                  )}
                                  {media.choirVideo && (
                                    <Col md={12}>
                                      <div className="bg-light rounded-3 p-3">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                          <Video size={16} className="text-danger" />
                                          <span className="fw-semibold small text-dark">Vidéo Concert Chœur</span>
                                          <Badge bg="white" text="dark" className="border small text-uppercase" style={{ fontSize: '0.6rem' }}>
                                            {media.pupitre}
                                          </Badge>
                                        </div>
                                        {media.choirVideo.startsWith('http') ? (
                                          <Button
                                            variant="outline-danger"
                                            className="w-100 d-flex align-items-center justify-content-center fw-bold rounded-pill py-2"
                                            onClick={() => window.open(media.choirVideo, '_blank')}
                                          >
                                            <PlayCircle size={18} className="me-2" /> Visionner le concert (Lien externe)
                                          </Button>
                                        ) : (
                                          <div className="overflow-hidden rounded-3 bg-dark">
                                            <video controls className="w-100" style={{ maxHeight: '360px' }}>
                                              <source src={buildFileUrl('media', media.choirVideo)} type="video/mp4" />
                                              Votre navigateur ne supporte pas la balise vidéo.
                                            </video>
                                          </div>
                                        )}
                                      </div>
                                    </Col>
                                  )}
                                </React.Fragment>
                              ))}
                            </Row>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-5 text-muted bg-white shadow-sm rounded-4">
              <Music2 size={48} className="mb-3 opacity-20" />
              <div className="fs-6 fw-semibold">
                Aucune œuvre n'est associée à ce concert
                {activePupitre !== 'all' ? ` pour la catégorie "${activePupitre === 'tutti' ? 'Tutti' : capitalize(activePupitre)}"` : ''}
                {statusFilter !== 'all' ? ` avec le statut "${statusFilter === 'chante' ? 'Chanté' : 'Sans chœur'}"` : ''}.
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      {/* Barre d'action fixe en bas, façon "Exporter en PDF" d'El Jem */}
      {visibleOeuvres.length > 0 && (
        <div
          className="position-sticky bottom-0 bg-white border-top py-3 px-2"
          style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}
        >
          <Button
            variant="primary"
            className="w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center py-3"
            disabled={selectedOeuvres.size === 0 || downloading}
            onClick={handleDownloadSelection}
          >
            {downloading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <DownloadCloud size={18} className="me-2" />
            )}
            Télécharger la sélection ({selectedOeuvres.size})
          </Button>
        </div>
      )}
    </Container>
  );
};

export default CurrentConcertOeuvres;
