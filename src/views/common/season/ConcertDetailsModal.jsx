/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Spinner, Badge, Form, Row, Col } from 'react-bootstrap';
import {
  Music,
  FileText,
  Video,
  PlayCircle,
  DownloadCloud,
  Eye,
  Calendar,
  MapPin,
  CheckSquare,
  Square,
  ChevronDown,
  Headphones,
  ListMusic,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOeuvreById } from '../../../services/oeuvre.service';
import { getRepetitionsByConcert } from '../../../services/repetition.service';
import { useAuth } from '../../../contexts/AuthContext';
import { BACKEND_URL } from '../../../utils/axiosInstance';
import logo from '../../../assets/images/logo.svg';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Construit une URL de fichier sans doubler le "/" entre BACKEND_URL et le chemin.
const buildFileUrl = (folder, filename) => {
  const base = (BACKEND_URL || '').replace(/\/+$/, '');
  return `${base}/uploads/${folder}/${filename}`;
};

const MEDIA_LABELS = {
  partition: 'Partition',
  paroles: 'Paroles'
};

// Médias "écoutables" : ceux qu'on retrouve dans l'onglet Écouter (piste audio ou vidéo)
const LISTEN_MEDIA_LABELS = {
  audio: 'Enregistrement Sonore',
  video: 'Support Vidéo',
  choirRecording: 'Enregistrement Concert',
  choirVideo: 'Vidéo Concert'
};

const PUPITRE_LABELS = {
  tutti: 'Tutti',
  soprano: 'Soprano',
  alto: 'Alto',
  tenor: 'Ténor',
  basse: 'Basse'
};

const formatDateFR = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

const formatRepetitionRange = (r) => {
  if (!r.date || !r.startTime || !r.endTime) return null;
  const dateObj = new Date(r.date);
  const [startH, startM] = r.startTime.split(':');
  const [endH, endM] = r.endTime.split(':');
  const start = new Date(dateObj);
  start.setHours(+startH, +startM);
  const end = new Date(dateObj);
  end.setHours(+endH, +endM);
  return {
    date: start.toLocaleDateString('fr-FR'),
    startTime: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    endTime: end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  };
};

// Le backend stocke les fichiers sous la forme "<timestamp>-<nomOriginal.ext>"
// (voir uploadMediaMiddleware.js : `Date.now() + "-" + file.originalname`).
// On retire ce préfixe pour retrouver le nom original tel qu'uploadé.
const getOriginalFileName = (storedFilename) => {
  if (!storedFilename) return storedFilename;
  return storedFilename.replace(/^\d+-/, '');
};

// Déclenche un vrai téléchargement (fetch -> blob), fonctionne même en cross-origin.
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

const TABS = [
  { key: 'programme', label: 'Programme', icon: ListMusic },
  { key: 'calendrier', label: 'Calendrier', icon: Calendar },
  { key: 'ecouter', label: 'Écouter', icon: Headphones }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ConcertDetailsModal = ({ show, onHide, concert }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [oeuvres, setOeuvres] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [activeTab, setActiveTab] = useState('programme');

  const [selectedOeuvres, setSelectedOeuvres] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Filtre de pupitre utilisé uniquement dans l'onglet "Écouter" (façon "I'm a: Soprano/Alto/...")
  const [listenPupitre, setListenPupitre] = useState('all');

  // ⚠️ Un choriste ne doit voir/télécharger que les médias "tutti" + ceux de SON pupitre
  // (les managers/chefs de chœur voient tout). On adapte `user?.role`/`user?.pupitre` si vos
  // noms de champs diffèrent côté AuthContext.
  const restrictToOwnPupitre = user?.role === 'choriste';

  const filterOeuvreForCurrentUser = (oeuvre) => {
    if (!restrictToOwnPupitre) return oeuvre;
    return {
      ...oeuvre,
      pupitreMedia: (oeuvre.pupitreMedia || []).filter(
        (m) => m.pupitre === 'tutti' || m.pupitre === user?.pupitre
      )
    };
  };

  useEffect(() => {
    if (!show || !concert) return;

    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      setActiveTab('programme');
      setSelectedOeuvres(new Set());
      setExpandedIds(new Set());
      setListenPupitre('all');
      try {
        const [oeuvresDetails, repets] = await Promise.all([
          Promise.all((concert.programme || []).map((item) => getOeuvreById(typeof item === 'string' ? item : item._id))),
          getRepetitionsByConcert(concert._id)
        ]);
        if (cancelled) return;
        setOeuvres(oeuvresDetails.map(filterOeuvreForCurrentUser));
        setRepetitions(repets || []);
      } catch (err) {
        console.error('Erreur lors du chargement du détail du concert:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [show, concert]);

  // Pupitres réellement présents parmi les médias écoutables (audio/video/choirRecording/choirVideo)
  const availableListenPupitres = useMemo(() => {
    const set = new Set();
    oeuvres.forEach((o) =>
      (o.pupitreMedia || []).forEach((m) => {
        const hasListenable = m.audio || m.video || m.choirRecording || m.choirVideo;
        if (hasListenable && m.pupitre) set.add(m.pupitre);
      })
    );
    return Array.from(set);
  }, [oeuvres]);

  // Construit la liste des items "écoutables" d'une œuvre (un item par média audio/vidéo présent),
  // filtrés par pupitre sélectionné (le tutti reste toujours visible).
  const getListenItemsFor = (oeuvre) => {
    const medias = oeuvre.pupitreMedia || [];
    const items = [];
    medias.forEach((m) => {
      if (listenPupitre !== 'all' && m.pupitre !== 'tutti' && m.pupitre !== listenPupitre) return;
      Object.keys(LISTEN_MEDIA_LABELS).forEach((key) => {
        if (m[key]) {
          items.push({ type: key, pupitre: m.pupitre, value: m[key] });
        }
      });
    });
    return items;
  };

  // Répétitions à venir uniquement : à partir d'aujourd'hui, et si c'est aujourd'hui,
  // uniquement celles qui ne sont pas encore terminées. Triées par date croissante.
  const upcomingRepetitions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return repetitions
      .filter((r) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        const repDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (repDay < todayStart) return false;
        if (repDay.getTime() === todayStart.getTime() && r.endTime) {
          const [endH, endM] = r.endTime.split(':');
          const end = new Date(d);
          end.setHours(+endH, +endM);
          if (end < now) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [repetitions]);

  const toggleOeuvreSelection = (id) => {
    setSelectedOeuvres((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Œuvres réellement sélectionnables (celles qui ont au moins un média) — les œuvres
  // sans média sont affichées mais ne peuvent pas être cochées ni téléchargées.
  const selectableOeuvres = useMemo(() => oeuvres.filter((o) => (o.pupitreMedia || []).length > 0), [oeuvres]);

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

  const handleDownloadSelection = async () => {
    if (selectedOeuvres.size === 0) return;
    setDownloading(true);
    try {
      const toDownload = oeuvres.filter((o) => selectedOeuvres.has(o._id));
      for (const oeuvre of toDownload) {
        const medias = oeuvre.pupitreMedia || [];
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

  if (!concert) return null;

  const allSelected = selectableOeuvres.length > 0 && selectedOeuvres.size === selectableOeuvres.length;

  return (
    <Modal show={show} onHide={onHide} centered size="xl" scrollable contentClassName="border-0 rounded-4 overflow-hidden">
      {/* En-tête */}
      <div className="text-white text-center py-4" style={{ background: 'rgb(76, 89, 104)' }}>
        <h4 className="fw-bold mb-0">Carthage Symphony Orchestra</h4>
      </div>
      <div className="text-center bg-white py-3 border-bottom">
        <img src={logo} alt="CSO Logo" style={{ width: 70 }} className="mb-2" />
        <div className="fw-semibold text-dark">{concert.title}</div>
        {concert && (
          <div className="text-muted small mt-1">
            <Calendar size={13} className="me-1" />
            {formatDateFR(concert.dateHeure)}
            {concert.location && (
              <>
                {' · '}
                <MapPin size={13} className="me-1" />
                {concert.location}
              </>
            )}
          </div>
        )}
      </div>

      {/* Onglets façon El Jem (segmented control) */}
      <div className="px-3 pt-3 bg-white">
        <div className="d-flex bg-light rounded-pill p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex-fill border-0 d-flex align-items-center justify-content-center gap-2 fw-semibold py-2"
                style={{
                  borderRadius: '999px',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#26394E' : '#6b7280',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <Modal.Body className="bg-white pt-3" style={{ maxHeight: '55vh' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ---------------------------------------------------------- */}
            {/* Onglet PROGRAMME : œuvres + médias + sélection/téléchargement */}
            {/* ---------------------------------------------------------- */}
            {activeTab === 'programme' && (
              <motion.div key="programme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {oeuvres.length === 0 ? (
                  <p className="text-center text-muted py-4 fst-italic">Aucune œuvre au programme pour ce concert.</p>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small fw-semibold">{oeuvres.length} œuvre(s)</span>
                      {selectableOeuvres.length > 0 && (
                        <Button variant="link" size="sm" className="text-decoration-none fw-semibold p-0" onClick={toggleSelectAll}>
                          {allSelected ? <CheckSquare size={16} className="me-1" /> : <Square size={16} className="me-1" />}
                          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </Button>
                      )}
                    </div>

                    <div className="d-flex flex-column gap-2">
                      {oeuvres.map((oeuvre, idx) => {
                        const isChecked = selectedOeuvres.has(oeuvre._id);
                        const isExpanded = expandedIds.has(oeuvre._id);
                        const medias = oeuvre.pupitreMedia || [];
                        const hasMedia = medias.length > 0;

                        return (
                          <div key={oeuvre._id} className={`border rounded-4 overflow-hidden ${!hasMedia ? 'opacity-75' : ''}`}>
                            <div
                              className="d-flex align-items-center gap-3 p-3"
                              style={{ cursor: 'pointer', background: '#fafafa' }}
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
                                className="bg-primary text-white fw-bold rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: 30, height: 30, fontSize: '0.9rem' }}
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
                                  <div className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                                    {oeuvre.title}
                                  </div>
                                </div>
                                <div className="text-primary small fst-italic">
                                  {Array.isArray(oeuvre.composers) ? oeuvre.composers.join(', ') : oeuvre.composers || '—'}
                                </div>
                              </div>
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown size={18} className="text-muted" />
                              </motion.div>
                            </div>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div className="border-top px-3 py-3">
                                    {medias.length === 0 ? (
                                      <p className="text-muted small fst-italic mb-0">Aucun média disponible pour cette œuvre.</p>
                                    ) : (
                                      <>
                                        {/* PDF : partition / paroles */}
                                        <div className="d-flex flex-column gap-2 mb-2">
                                          {medias.map((media, mIdx) =>
                                            ['partition', 'paroles'].map((key) =>
                                              media[key] ? (
                                                <div
                                                  key={`${oeuvre._id}-${mIdx}-${key}`}
                                                  className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2"
                                                >
                                                  <div className="d-flex align-items-center gap-2">
                                                    <FileText size={15} className="text-primary" />
                                                    <span className="fw-semibold small text-dark">{MEDIA_LABELS[key]}</span>
                                                    <Badge bg="white" text="dark" className="border small text-uppercase" style={{ fontSize: '0.6rem' }}>
                                                      {PUPITRE_LABELS[media.pupitre] || media.pupitre}
                                                    </Badge>
                                                  </div>
                                                  <div className="d-flex align-items-center gap-1">
                                                    <Button
                                                      variant="outline-primary"
                                                      size="sm"
                                                      className="d-flex align-items-center py-1"
                                                      onClick={() => window.open(buildFileUrl('media', media[key]), '_blank')}
                                                    >
                                                      <Eye size={13} className="me-1" /> Aperçu
                                                    </Button>
                                                    <Button
                                                      variant="primary"
                                                      size="sm"
                                                      className="d-flex align-items-center py-1"
                                                      onClick={() => triggerDownload(media[key])}
                                                    >
                                                      <DownloadCloud size={13} className="me-1" /> Télécharger
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : null
                                            )
                                          )}
                                        </div>

                                        {/* Audio / vidéo intégrés */}
                                        <Row className="g-2">
                                          {medias.map((media, mIdx) => (
                                            <React.Fragment key={`${oeuvre._id}-player-${mIdx}`}>
                                              {media.audio && (
                                                <Col md={6}>
                                                  <div className="bg-light rounded-3 p-2">
                                                    <div className="small fw-semibold text-dark mb-1">Enregistrement sonore</div>
                                                    <audio controls className="w-100" style={{ height: 34 }}>
                                                      <source src={buildFileUrl('media', media.audio)} type="audio/mpeg" />
                                                    </audio>
                                                  </div>
                                                </Col>
                                              )}
                                              {media.video && (
                                                <Col md={6}>
                                                  <div className="bg-light rounded-3 p-2">
                                                    <div className="small fw-semibold text-dark mb-1">Support vidéo</div>
                                                    {media.video.startsWith('http') ? (
                                                      <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="w-100 d-flex align-items-center justify-content-center rounded-pill"
                                                        onClick={() => window.open(media.video, '_blank')}
                                                      >
                                                        <PlayCircle size={15} className="me-1" /> Visionner
                                                      </Button>
                                                    ) : (
                                                      <video controls className="w-100 rounded-2" style={{ maxHeight: 220 }}>
                                                        <source src={buildFileUrl('media', media.video)} type="video/mp4" />
                                                      </video>
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
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Onglet CALENDRIER : répétitions liées                       */}
            {/* ---------------------------------------------------------- */}
            {activeTab === 'calendrier' && (
              <motion.div key="calendrier" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {upcomingRepetitions.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <Calendar size={40} className="mb-2 opacity-25" />
                    <p className="mb-0 fw-semibold">Aucune répétition à venir</p>
                    <p className="small">Les prochaines répétitions liées à ce concert apparaîtront ici.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {upcomingRepetitions.map((r) => {
                      const range = formatRepetitionRange(r);
                      if (!range) return null;
                      return (
                        <div key={r._id} className="d-flex align-items-start gap-2 border rounded-4 p-3">
                          <MapPin size={16} className="text-danger mt-1 flex-shrink-0" />
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                              {r.location || 'Lieu inconnu'}
                            </div>
                            <div className="text-muted small">
                              Date : {range.date} · Heure : {range.startTime} → {range.endTime}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ---------------------------------------------------------- */}
            {/* Onglet ÉCOUTER : réutilise les médias existants             */}
            {/* (audio, video, choirRecording, choirVideo de pupitreMedia). */}
            {/* video/choirVideo peuvent être un lien externe (YouTube...)  */}
            {/* ou un fichier local uploadé.                                */}
            {/* ---------------------------------------------------------- */}
            {activeTab === 'ecouter' && (
              <motion.div key="ecouter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {availableListenPupitres.length > 1 && (
                  <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                    <span className="text-muted small fw-semibold me-1">Je suis :</span>
                    <Button
                      size="sm"
                      variant={listenPupitre === 'all' ? 'primary' : 'outline-secondary'}
                      className="rounded-pill px-3 fw-semibold"
                      onClick={() => setListenPupitre('all')}
                    >
                      Tout
                    </Button>
                    {availableListenPupitres.map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={listenPupitre === p ? 'primary' : 'outline-secondary'}
                        className="rounded-pill px-3 fw-semibold"
                        onClick={() => setListenPupitre(p)}
                      >
                        {PUPITRE_LABELS[p] || p}
                      </Button>
                    ))}
                  </div>
                )}

                {oeuvres.every((o) => getListenItemsFor(o).length === 0) ? (
                  <div className="text-center text-muted py-5">
                    <Headphones size={40} className="mb-2 opacity-25" />
                    <p className="mb-0 fw-semibold">Aucun média à écouter pour ce concert</p>
                    <p className="small">Les enregistrements et vidéos ajoutés pour chaque œuvre s'afficheront ici.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {oeuvres.map((oeuvre) => {
                      const items = getListenItemsFor(oeuvre);
                      if (items.length === 0) return null;
                      return (
                        <div key={oeuvre._id}>
                          <div className="fw-bold text-dark mb-2" style={{ fontSize: '15px' }}>
                            {oeuvre.title}
                          </div>
                          <div className="text-uppercase text-muted small fw-semibold mb-1">Écouter</div>
                          <div className="d-flex flex-wrap gap-2">
                            {items.map((item, i) => {
                              const isVideo = item.type === 'video' || item.type === 'choirVideo';
                              const isExternal = isVideo && item.value.startsWith('http');
                              const Icon = isVideo ? PlayCircle : Music;
                              const handleOpen = () => {
                                if (isExternal) {
                                  window.open(item.value, '_blank', 'noopener,noreferrer');
                                } else {
                                  window.open(buildFileUrl('media', item.value), '_blank', 'noopener,noreferrer');
                                }
                              };
                              return (
                                <Button
                                  key={i}
                                  variant="outline-dark"
                                  size="sm"
                                  className="rounded-pill d-flex align-items-center gap-2 px-3"
                                  onClick={handleOpen}
                                >
                                  <Icon size={13} />
                                  <span className="text-uppercase text-muted small">
                                    {PUPITRE_LABELS[item.pupitre] || item.pupitre}
                                  </span>
                                  <span>·</span>
                                  <span>{LISTEN_MEDIA_LABELS[item.type]}</span>
                                  {isExternal && <ExternalLink size={12} />}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </Modal.Body>

      {/* Barre d'action : téléchargement de la sélection, visible uniquement sur l'onglet Programme */}
      {activeTab === 'programme' && oeuvres.length > 0 && (
        <div className="border-top bg-white p-3">
          <Button
            variant="primary"
            className="w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center py-2"
            disabled={selectedOeuvres.size === 0 || downloading}
            onClick={handleDownloadSelection}
          >
            {downloading ? <Spinner animation="border" size="sm" className="me-2" /> : <DownloadCloud size={16} className="me-2" />}
            Télécharger la sélection ({selectedOeuvres.size})
          </Button>
        </div>
      )}

      <div className="text-center bg-light text-muted small fst-italic py-2 border-top">Carthage Symphony Orchestra</div>
    </Modal>
  );
};

export default ConcertDetailsModal;
