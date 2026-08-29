/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import { Badge, Spinner, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCalendarAlt, FaClock, FaMusic, FaCheckCircle, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { getChoristeActivityNotifications } from '../../../../services/dashboard.service';

const POLL_INTERVAL_MS = 30000;
const PREVIEW_COUNT = 2;
const NOTE_SPAWN_INTERVAL_MS = 220;
const NOTE_LIFETIME_MS = 900;
const NOTE_GLYPHS = ['♪', '♫', '♬', '♩'];

// 🎨 Même palette / même habillage "bulle" que CandidatureNotificationBell,
// juste des catégories et des couleurs adaptées au choriste.
const CATEGORY_CONFIG = {
  new_concert: {
    icon: FaCalendarAlt,
    color: '#2563eb',
    bg: '#eff6ff',
    label: 'Nouveaux concerts',
    route: '/choriste/concerts'
  },
  new_repetition: {
    icon: FaClock,
    color: '#0d9488',
    bg: '#f0fdfa',
    label: 'Nouvelles répétitions',
    route: '/choriste/repetitions'
  },
  carnet_update: {
    icon: FaMusic,
    color: '#db2777',
    bg: '#fdf2f8',
    label: 'Carnet de chant mis à jour',
    route: '/choriste/concert-actuel-medias'
  }
};

const NOTE_COLORS = ['#2563eb', '#0d9488', '#db2777', '#20c997'];

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} j`;
};

const playNotificationSound = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [880, 1108.73];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
    setTimeout(() => ctx.close(), 500);
  } catch (e) {
    /* environnement sans audio → on ignore */
  }
};

const groupByType = (notifications) => {
  const groups = {};
  notifications.forEach((item) => {
    if (!groups[item.type]) groups[item.type] = [];
    groups[item.type].push(item);
  });
  return Object.entries(groups)
    .map(([type, items]) => ({ type, items }))
    .sort((a, b) => new Date(b.items[0]?.date || 0) - new Date(a.items[0]?.date || 0));
};

const buildHoverSummary = (data) => {
  if (data.total === 0) return 'Tout est à jour ✨';
  const parts = [];
  if (data.counts.newConcerts) parts.push(`${data.counts.newConcerts} concert${data.counts.newConcerts > 1 ? 's' : ''}`);
  if (data.counts.newRepetitions) parts.push(`${data.counts.newRepetitions} répét.`);
  if (data.counts.carnetUpdates) parts.push(`${data.counts.carnetUpdates} carnet`);
  return `${data.total} nouveauté${data.total > 1 ? 's' : ''} — ${parts.join(' · ')}`;
};

const ChoristeActivityNotificationBell = () => {
  const [data, setData] = useState({ total: 0, counts: {}, notifications: [] });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [justIncreased, setJustIncreased] = useState(false);
  const [expandedType, setExpandedType] = useState(null);
  const [notes, setNotes] = useState([]);
  const [seen, setSeen] = useState(false);
  const [seenAtTotal, setSeenAtTotal] = useState(0);

  const previousTotal = useRef(null);
  const wrapperRef = useRef(null);
  const lastNoteSpawnRef = useRef(0);
  const noteIdRef = useRef(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const result = await getChoristeActivityNotifications();
      if (previousTotal.current !== null && result.total > previousTotal.current) {
        setJustIncreased(true);
        setTimeout(() => setJustIncreased(false), 1600);
      }
      if (result.total > seenAtTotal) setSeen(false);
      previousTotal.current = result.total;
      setData(result);
    } catch (err) {
      console.error("Erreur lors du chargement des notifications d'activité:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    const next = !open;
    setOpen(next);
    setHovering(false);
    setExpandedType(null);
    if (next) {
      playNotificationSound();
      setSeen(true);
      setSeenAtTotal(data.total);
    }
  };

  const handleMouseEnter = () => {
    if (!open) setHovering(true);
  };

  const handleMouseLeave = () => setHovering(false);

  const handleMouseMove = (e) => {
    if (open) return;
    const now = Date.now();
    if (now - lastNoteSpawnRef.current < NOTE_SPAWN_INTERVAL_MS) return;
    lastNoteSpawnRef.current = now;
    const id = noteIdRef.current++;
    const glyph = NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)];
    const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const drift = (Math.random() - 0.5) * 30;
    setNotes((prev) => [...prev, { id, x: e.clientX, y: e.clientY, glyph, color, drift }]);
    setTimeout(() => setNotes((prev) => prev.filter((n) => n.id !== id)), NOTE_LIFETIME_MS);
  };

  const goTo = (route) => {
    setOpen(false);
    navigate(route);
  };

  const hasNotifications = data.total > 0;
  const showBadge = hasNotifications && !seen;
  const groups = groupByType(data.notifications);

  return (
    <>
      <style>{`
        @keyframes choristeBellRing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-6deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes choristeBadgePulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.5); }
          70% { box-shadow: 0 0 0 9px rgba(220, 53, 69, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
        .choriste-bell-icon.ringing { animation: choristeBellRing 0.7s ease-in-out; }
        .choriste-bell-badge { animation: choristeBadgePulse 2s infinite; }
        .choriste-bell-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.15s ease;
        }
        .choriste-bell-btn:hover { background-color: #f1f3f5; }
        .choriste-bell-btn:active { transform: scale(0.92); }
        .choriste-row { cursor: pointer; transition: background-color 0.15s ease; }
        .choriste-row:hover { background-color: #f8f9fa; }
        .choriste-subrow { cursor: pointer; transition: background-color 0.15s ease; }
        .choriste-subrow:hover { background-color: #f1f3f5; }
      `}</style>

      <ListGroup.Item
        as="li"
        bsPrefix=" "
        ref={wrapperRef}
        style={{ position: 'relative' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <button type="button" className="choriste-bell-btn" onClick={handleBellClick} aria-label="Notifications">
          <FaBell
            size={17}
            className={`choriste-bell-icon ${justIncreased ? 'ringing' : ''}`}
            style={{ color: hasNotifications ? '#1e3a5f' : '#adb5bd' }}
          />
          {showBadge && (
            <Badge
              bg="danger"
              pill
              className="choriste-bell-badge"
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                fontSize: '0.6rem',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              {data.total > 9 ? '9+' : data.total}
            </Badge>
          )}
        </button>

        {/* 🎵 Notes de musique qui suivent le curseur pendant le survol */}
        <AnimatePresence>
          {notes.map((note) => (
            <motion.span
              key={note.id}
              initial={{ opacity: 0.9, scale: 0.6, x: note.x, y: note.y }}
              animate={{ opacity: 0, scale: 1.15, x: note.x + note.drift, y: note.y - 42 }}
              exit={{ opacity: 0 }}
              transition={{ duration: NOTE_LIFETIME_MS / 1000, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                fontSize: '15px',
                fontWeight: 700,
                color: note.color,
                zIndex: 2000
              }}
            >
              {note.glyph}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Infobulle de survol — résumé court */}
        <AnimatePresence>
          {hovering && !open && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                whiteSpace: 'nowrap',
                background: '#1e3a5f',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.25)',
                zIndex: 1040
              }}
            >
              {buildHoverSummary(data)}
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '14px',
                  width: '11px',
                  height: '11px',
                  background: '#1e3a5f',
                  transform: 'rotate(45deg)',
                  borderRadius: '3px'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panneau au clic — même habillage bulle que CandidatureNotificationBell */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: '14px',
                  width: '14px',
                  height: '14px',
                  background: '#fff',
                  transform: 'rotate(45deg)',
                  borderRadius: '4px',
                  boxShadow: '-2px -2px 4px rgba(15, 23, 42, 0.03)',
                  zIndex: 1049
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '320px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  borderRadius: '18px',
                  border: 'none',
                  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                  background: '#fff',
                  padding: '10px',
                  zIndex: 1050
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px 10px'
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1a2e' }}>Mon activité</span>
                  {hasNotifications && (
                    <span style={{ fontSize: '0.7rem', color: '#8a94a6', fontWeight: 600 }}>{data.total} nouveauté{data.total > 1 ? 's' : ''}</span>
                  )}
                </div>

                {loading ? (
                  <div style={{ padding: '30px', textAlign: 'center' }}>
                    <Spinner animation="border" size="sm" style={{ color: '#1e3a5f' }} />
                  </div>
                ) : !hasNotifications ? (
                  <div style={{ padding: '26px 14px', textAlign: 'center' }}>
                    <FaCheckCircle size={26} style={{ color: '#20c997', marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.82rem', color: '#6c757d' }}>Rien de nouveau pour le moment.</div>
                  </div>
                ) : (
                  groups.map((group) => {
                    const config = CATEGORY_CONFIG[group.type] || CATEGORY_CONFIG.new_concert;
                    const Icon = config.icon;
                    const isExpanded = expandedType === group.type;
                    const preview = group.items.slice(0, PREVIEW_COUNT);
                    const remaining = group.items.length - preview.length;

                    return (
                      <div key={group.type} style={{ marginBottom: '2px' }}>
                        <div
                          className="choriste-row"
                          onClick={() => setExpandedType(isExpanded ? null : group.type)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 8px',
                            borderRadius: '12px'
                          }}
                        >
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: config.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={14} style={{ color: config.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 500, color: '#1a1a2e' }}>{config.label}</div>
                          </div>
                          <Badge
                            bg="light"
                            text="dark"
                            pill
                            style={{ fontSize: '0.68rem', fontWeight: 700, border: '1px solid #eef0f2' }}
                          >
                            {group.items.length}
                          </Badge>
                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <FaChevronRight size={10} style={{ color: '#c1c7d0' }} />
                          </motion.div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              {preview.map((item) => (
                                <div
                                  key={item.id}
                                  className="choriste-subrow"
                                  onClick={() => goTo(config.route)}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 8px 8px 54px',
                                    borderRadius: '10px'
                                  }}
                                >
                                  <span style={{ fontSize: '0.78rem', color: '#3d4451', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                                    {item.title}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: '#adb5bd', flexShrink: 0 }}>{timeAgo(item.date)}</span>
                                </div>
                              ))}
                              {remaining > 0 && (
                                <div
                                  onClick={() => goTo(config.route)}
                                  style={{
                                    padding: '7px 8px 7px 54px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    color: config.color,
                                    cursor: 'pointer'
                                  }}
                                >
                                  + {remaining} autre{remaining > 1 ? 's' : ''}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}

                {hasNotifications && (
                  <div
                    className="choriste-row"
                    onClick={() => goTo('/choriste/concert-actuel-medias')}
                    style={{
                      textAlign: 'center',
                      padding: '10px 8px',
                      marginTop: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#1e3a5f',
                      borderRadius: '12px',
                      borderTop: '1px solid #f0f1f3'
                    }}
                  >
                    Consulter mon carnet de chant
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </ListGroup.Item>
    </>
  );
};

export default ChoristeActivityNotificationBell;
