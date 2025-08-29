/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

import React, { useEffect, useState } from 'react';
import { getConcerts } from '../../../services/concert.service';
import { getOeuvreById } from '../../../services/oeuvre.service';
import { getRepetitionsByConcert } from '../../../services/repetition.service';
import { Spinner, Button, Card, Row, Col, Badge, Container, InputGroup, Form } from 'react-bootstrap';
import Select from 'react-select';
import Swal from 'sweetalert2';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMusic,
  FaClock,
  FaInfoCircle,
  FaImage,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from 'react-icons/fa';
import { Search } from 'lucide-react';

const SeasonProgramme = () => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState({ value: 'upcoming', label: 'À venir' });

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const pageSizeOptions = [6, 12, 18, 30];

  const statusOptions = [
    { value: 'upcoming', label: 'À venir' },
    { value: 'past', label: 'Passé' }
  ];

  useEffect(() => {
    fetchConcerts();
  }, []);

  // ✅ RESET PAGINATION WHEN FILTERS CHANGE
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterStatus]);

  const fetchConcerts = async () => {
    try {
      const data = await getConcerts();
      setConcerts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des concerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConcerts = concerts
    .filter((concert) => {
      const now = new Date();
      const concertDate = new Date(concert.dateHeure);
      const matchesStatus =
        (filterStatus.value === 'upcoming' && concertDate >= now) || (filterStatus.value === 'past' && concertDate < now);
      const matchesSearch = concert.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Sort upcoming concerts ascending, past concerts descending
      if (filterStatus.value === 'upcoming') {
        return new Date(a.dateHeure) - new Date(b.dateHeure);
      } else {
        return new Date(b.dateHeure) - new Date(a.dateHeure);
      }
    });

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const getTotalItems = () => filteredConcerts.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
    const start = currentPage * itemsPerPage;
    return filteredConcerts.slice(start, start + itemsPerPage);
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

  const formatFullDate = (iso) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

  const formatConcertDateFR = (isoString) => {
    return new Date(isoString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // ✅ CHECK IF CONCERT IS TODAY, TOMORROW, OR THIS WEEK
  const getConcertTimeBadge = (dateHeure) => {
    const now = new Date();
    const concertDate = new Date(dateHeure);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const concertDay = new Date(concertDate.getFullYear(), concertDate.getMonth(), concertDate.getDate());

    if (concertDay.getTime() === today.getTime()) {
      return (
        <Badge bg="danger" className="ms-2">
          Aujourd'hui
        </Badge>
      );
    } else if (concertDay.getTime() === tomorrow.getTime()) {
      return (
        <Badge bg="warning" className="ms-2">
          Demain
        </Badge>
      );
    } else if (concertDay <= nextWeek && concertDay > today) {
      return (
        <Badge bg="info" className="ms-2">
          Cette semaine
        </Badge>
      );
    }
    return null;
  };

  const handleShowDetails = async (concert) => {
    try {
      const programmeDetails = await Promise.all(
        (concert.programme || []).map((item) => getOeuvreById(typeof item === 'string' ? item : item._id))
      );

      const repetitions = await getRepetitionsByConcert(concert._id);
      const formattedDate = formatConcertDateFR(concert.dateHeure);

      const piecesHtml = programmeDetails
        .map((o) => {
          const composers = o.composers?.join(', ') || 'Aucun';
          const arrangers = o.arrangers?.length ? o.arrangers.join(', ') : '—';
          return `
            <div class="prog-card">
              <div class="prog-card-header">
                <span>🎺</span>
                <span>${o.title}</span>
              </div>
              <div class="prog-card-body">
                <div>
                  <strong style="font-size:16px; font-style: italic;">
                    Compositeurs:
                  </strong> ${composers}
                </div>
                <div style="margin-top:4px;">
                  <strong style="font-size:16px; font-style: italic;">
                    Arrangeurs:
                  </strong> ${arrangers}
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      Swal.fire({
        html: `
        <style>
          .prog-modal-container { font-family: 'Segoe UI'; max-width: 820px; margin: auto; background: #f9fafb; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
          .prog-header { background: rgb(76, 89, 104); color: #fff; text-align: center; padding: 20px 0; }
          .prog-header h1 { margin: 0; font-size: 24px; color: #fff; }
          .prog-subheader { text-align: center; background: #fff; padding: 20px 0; border-bottom: 1px solid #e0e0e0; }
          .prog-subheader img { width: 100px; margin-bottom: 12px; }
          .prog-body { background: #fff; padding: 20px 30px; max-height: 380px; overflow-y: auto; }
          .prog-card { background: #fff; border-left: 4px solid #26394E; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
          .prog-card-header { display: flex; align-items: center; font-weight: 600; font-size: 1rem; color: #2c2c2c; margin-bottom: 8px; }
          .prog-card-header span:first-child { margin-right: 8px; font-size: 20px; }
          .prog-card-body { margin-left: 28px; font-size: 0.9rem; color: #444; text-align: left; }
          .prog-footer { background: #f1f5f9; text-align: center; font-size: 14px; color: #5e5043; font-style: italic; padding: 20px 32px; }
          .swal2-programme-popup { background: transparent !important; box-shadow: none !important; }
          .swal2-programme-btn { background: rgb(76, 89, 104) !important; color: white !important; border-radius: 22px; padding: 8px 26px !important; font-size: 14px !important; }
        </style>
        <div class="prog-modal-container">
          <div class="prog-header"><h1>Carthage Symphony Orchestra</h1></div>
          <div class="prog-subheader">
            <img src="../../src/assets/images/music.png" alt="CSO Logo" />
            <p>Programme du ${formattedDate}</p>
          </div>
          <div class="prog-body">
            ${piecesHtml}
            <hr style="margin: 25px 0; border-color: #e5e7eb;" />
            <h4 style="margin-bottom: 12px; font-size: 17px;">📅 Répétitions liées</h4>
            ${
              repetitions.length
                ? repetitions
                    .map((r) => {
                      if (!r.date || !r.startTime || !r.endTime) return '';
                      const dateObj = new Date(r.date);
                      const [startH, startM] = r.startTime.split(':');
                      const [endH, endM] = r.endTime.split(':');
                      const start = new Date(dateObj);
                      start.setHours(+startH, +startM);
                      const end = new Date(dateObj);
                      end.setHours(+endH, +endM);
                      const date = start.toLocaleDateString('fr-FR');
                      const startTime = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const endTime = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      return `
                      <div class="prog-card" style="background:#fcfcfc;">
                        <div class="prog-card-header">📍 ${r.location || 'Lieu inconnu'}</div>
                        <div class="prog-card-body">
                          <div><strong>Date :</strong> ${date}</div>
                          <div><strong>Heure :</strong> ${startTime} → ${endTime}</div>
                        </div>
                      </div>
                    `;
                    })
                    .join('')
                : "<em style='color: gray;'>Aucune répétition prévue</em>"
            }
          </div>
          <div class="prog-footer">Carthage Symphony Orchestra</div>
        </div>
      `,
        customClass: {
          popup: 'swal2-programme-popup',
          confirmButton: 'swal2-programme-btn'
        },
        showConfirmButton: true,
        confirmButtonText: 'Fermer',
        width: '660px',
        padding: 0,
        background: 'transparent'
      });
    } catch (err) {
      console.error("Erreur lors de l'affichage des détails:", err);
      Swal.fire('Erreur', "Impossible d'afficher les détails.", 'error');
    }
  };

  return (
    <Container fluid className="p-4" style={{ maxWidth: '1400px' }}>
      {/* ✅ HEADER SECTION */}
      <div className="mb-4">
        {/* <h2 className="fw-bold text-dark mb-1">
          <FaMusic className="me-3 text-primary" />
          Programme de la Saison
        </h2>
        <p className="text-muted mb-4">Découvrez tous les concerts de l'</p> */}

        {/* ✅ FILTERS SECTION */}
        <Row className="align-items-center g-3">
          <Col md={3}>
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={setFilterStatus}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: 'none',
                  fontSize: '14px',
                  '&:hover': { borderColor: '#d1d5db' }
                }),
                option: (provided, state) => ({
                  ...provided,
                  fontSize: '14px'
                })
              }}
            />
          </Col>
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: '#f8f9fa', borderColor: '#e5e7eb' }}>
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Rechercher par nom de concert..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderColor: '#e5e7eb',
                  fontSize: '14px',
                  padding: '10px 16px'
                }}
              />
            </InputGroup>
          </Col>
          <Col md={5} className="text-end">
            <small className="text-muted">
              {getTotalItems()} concert(s) {filterStatus.label.toLowerCase()}
              {searchTerm && ` pour "${searchTerm}"`}
            </small>
          </Col>
        </Row>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des concerts...</p>
        </div>
      ) : getTotalItems() === 0 ? (
        <div className="text-center py-5">
          <FaMusic size={48} className="text-muted mb-3" />
          <h5 className="text-muted">Aucun concert trouvé</h5>
          <p className="text-muted">
            {searchTerm
              ? `Aucun concert ne correspond à "${searchTerm}"`
              : `Aucun concert ${filterStatus.label.toLowerCase()} pour le moment`}
          </p>
        </div>
      ) : (
        <>
          {/* ✅ CONCERTS GRID */}
          <Row className="g-4">
            {getPaginatedData().map((concert) => {
              const concertDate = new Date(concert.dateHeure);
              const isPast = concertDate < new Date();

              return (
                <Col key={concert._id} lg={6} xl={4}>
                  <Card
                    className="h-100 shadow-sm border-0"
                    style={{
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* ✅ CARD HEADER */}
                    <Card.Header
                      className="border-0 text-white d-flex align-items-center justify-content-between"
                      style={{
                        background: isPast
                          ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '0.375rem 0.375rem 0 0'
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-2" size={16} />
                        <span className="fw-semibold" style={{ fontSize: '15px' }}>
                          {concertDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {!isPast && getConcertTimeBadge(concert.dateHeure)}
                      {isPast && (
                        <Badge bg="light" text="dark">
                          Terminé
                        </Badge>
                      )}
                    </Card.Header>

                    {/* ✅ CARD BODY */}
                    <Card.Body className="p-4">
                      <h5 className="card-title fw-bold text-dark mb-3" style={{ fontSize: '18px', lineHeight: '1.3' }}>
                        {concert.title}
                      </h5>

                      <div className="concert-details">
                        <div className="d-flex align-items-center mb-2">
                          <FaClock className="text-warning me-2" size={14} />
                          <span className="text-muted" style={{ fontSize: '14px' }}>
                            {formatTime(concert.dateHeure)}
                          </span>
                        </div>

                        <div className="d-flex align-items-center mb-2">
                          <FaMapMarkerAlt className="text-success me-2" size={14} />
                          <span className="text-muted" style={{ fontSize: '14px' }}>
                            {concert.location}
                          </span>
                        </div>

                        {concert.poster && (
                          <div className="d-flex align-items-center mb-3">
                            <FaImage className="text-info me-2" size={14} />
                            <a
                              href={`${import.meta.env.VITE_BACKEND_URL}/uploads/posters/${concert.poster}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none"
                              style={{ fontSize: '14px' }}
                            >
                              Voir l'affiche
                            </a>
                          </div>
                        )}

                        <div className="text-muted mb-3" style={{ fontSize: '13px' }}>
                          <strong>{concert.programme?.length || 0}</strong> œuvre(s) au programme
                        </div>
                      </div>
                    </Card.Body>

                    {/* ✅ CARD FOOTER */}
                    <Card.Footer className="border-0 bg-white p-4 pt-0">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowDetails(concert)}
                        className="w-100 fw-semibold"
                        style={{
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaInfoCircle className="me-2" size={14} />
                        Voir le programme
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* ✅ RESPONSIVE: Professional Pagination */}
          {getTotalPages() > 1 && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 mt-4 border-top bg-light rounded gap-2">
              <div className="d-flex align-items-center order-2 order-md-1">
                <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                  <span className="d-none d-sm-inline">Concerts par page:</span>
                  <span className="d-sm-none">Par page:</span>
                </span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', fontSize: '13px' }}
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

              <div className="text-muted order-1 order-md-2" style={{ fontSize: '13px' }}>
                {getStartIndex()}-{getEndIndex()} sur {getTotalItems()}
              </div>

              <div className="d-flex align-items-center order-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={isFirstPage()}
                  className="me-1"
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: isFirstPage() ? '#6c757d' : '#495057',
                    padding: '4px 8px'
                  }}
                  title="Première page"
                >
                  <FaAngleDoubleLeft size={12} />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={isFirstPage()}
                  className="me-2 me-md-3"
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: isFirstPage() ? '#6c757d' : '#495057',
                    padding: '4px 8px'
                  }}
                  title="Page précédente"
                >
                  <FaChevronLeft size={12} />
                </Button>
                <span className="mx-2 mx-md-3 text-muted" style={{ fontSize: '13px' }}>
                  <span className="d-none d-sm-inline">Page </span>
                  {currentPage + 1}
                  <span className="d-none d-sm-inline"> sur {getTotalPages()}</span>
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={isLastPage()}
                  className="ms-2 ms-md-3 me-1"
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: isLastPage() ? '#6c757d' : '#495057',
                    padding: '4px 8px'
                  }}
                  title="Page suivante"
                >
                  <FaChevronRight size={12} />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={isLastPage()}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: isLastPage() ? '#6c757d' : '#495057',
                    padding: '4px 8px'
                  }}
                  title="Dernière page"
                >
                  <FaAngleDoubleRight size={12} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default SeasonProgramme;