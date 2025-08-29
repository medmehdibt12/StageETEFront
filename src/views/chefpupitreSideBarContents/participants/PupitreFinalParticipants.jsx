/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Table, Spinner, Badge, InputGroup, Form, Row, Col, Modal, Alert } from 'react-bootstrap';
import Select from 'react-select';
import {
  FaUsers,
  FaSearch,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaMusic,
  FaCalendarAlt,
  FaMapPin,
  FaClock,
  FaUserTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import { FileSpreadsheet } from 'lucide-react'; // ✅ NEW: Excel export icon
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx'; // ✅ NEW: Excel export library
import {
  getConcertsForChefFinalParticipants,
  getFinalParticipantsForChef,
  removeFromFinalParticipantsAsChef
} from '../../../services/concert.service';
import { useAuth } from '../../../contexts/AuthContext';

const PupitreFinalParticipants = () => {
  const { user } = useAuth();

  // State management
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [participantsData, setParticipantsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // Load concerts on mount
  useEffect(() => {
    loadConcerts();
  }, []);

  const loadConcerts = async () => {
    try {
      setLoading(true);
      const response = await getConcertsForChefFinalParticipants();
      setConcerts(response.concerts || []);
    } catch (error) {
      console.error('Error loading concerts:', error);
      Swal.fire('Erreur', 'Impossible de charger les concerts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (concertId) => {
    try {
      setLoading(true);
      const response = await getFinalParticipantsForChef(concertId);
      setParticipantsData(response);
      setCurrentPage(0);
      setSearchTerm('');
    } catch (error) {
      console.error('Error loading participants:', error);
      Swal.fire('Erreur', 'Impossible de charger les participants.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Excel export function
  const handleExportExcel = () => {
    if (!participantsData?.finalParticipants || getTotalItems() === 0) return;

    const filteredParticipants = getFilteredParticipants();

    // Prepare data for Excel
    const excelData = filteredParticipants.map((p, index) => ({
      '#': index + 1,
      Nom: p.lastName || '',
      Prénom: p.firstName || '',
      Email: p.email || '',
      Pupitre: p.pupitre || '',
      Taille: p.height || 'Non spécifié'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 }, // #
      { wch: 20 }, // Nom
      { wch: 20 }, // Prénom
      { wch: 30 }, // Email
      { wch: 12 }, // Pupitre
      { wch: 15 } // Taille
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Participants ${participantsData.chefPupitre}`);

    // Generate filename
    const concertTitle = concerts.find((c) => c._id === selectedConcert)?.title || 'Concert';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Participants_${participantsData.chefPupitre}_${concertTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  // Format concert options for react-select
  const getConcertOptions = () => {
    return concerts.map((concert) => ({
      value: concert._id,
      label: `${concert.title} - ${formatDate(concert.dateHeure)} (${concert.participantsCount} participant${concert.participantsCount > 1 ? 's' : ''})`
    }));
  };

  // Handle concert selection
  const handleConcertChange = (selectedOption) => {
    const concertId = selectedOption?.value || null;
    setSelectedConcert(concertId);
    if (concertId) {
      loadParticipants(concertId);
    } else {
      setParticipantsData(null);
    }
  };

  // Remove participant (mark as no-show)
  const handleRemoveParticipant = async (choriste) => {
    const result = await Swal.fire({
      title: 'Retirer Participant',
      html: `
        <div class="text-start">
          <p><strong>Choriste:</strong> ${choriste.firstName} ${choriste.lastName}</p>
          <p><strong>Pupitre:</strong> ${choriste.pupitre}</p>
          <hr>
          <p class="text-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Cette action retirera ce choriste de la liste des participants finaux.
          </p>
          <p class="text-muted small">
            Utilisez cette fonction si le choriste ne s'est pas présenté le jour du concert.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Retirer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (result.isConfirmed) {
      try {
        setProcessing(true);

        Swal.fire({
          title: 'Traitement en cours...',
          text: 'Retrait du participant...',
          icon: 'info',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading()
        });

        await removeFromFinalParticipantsAsChef(selectedConcert, choriste._id);

        Swal.fire({
          title: 'Participant Retiré!',
          text: `${choriste.firstName} ${choriste.lastName} a été retiré de la liste des participants finaux.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Reload participants
        loadParticipants(selectedConcert);
        // Reload concerts to update participant counts
        loadConcerts();
      } catch (error) {
        Swal.fire({
          title: 'Action Interdite',
          text: error.response?.data?.message || 'Erreur lors du retrait du participant.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      } finally {
        setProcessing(false);
      }
    }
  };

  // Filter participants based on search term
  const getFilteredParticipants = () => {
    if (!participantsData?.finalParticipants) return [];

    if (!searchTerm.trim()) return participantsData.finalParticipants;

    return participantsData.finalParticipants.filter((participant) => {
      const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
      const email = participant.email?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      return fullName.includes(search) || email.includes(search);
    });
  };

  // Pagination functions
  const getTotalItems = () => getFilteredParticipants().length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedParticipants = () => {
    const filteredParticipants = getFilteredParticipants();
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredParticipants.slice(startIndex, endIndex);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if concert is in the past
  const isConcertPast = (dateHeure) => {
    return new Date(dateHeure) < new Date();
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : null,
      '&:hover': {
        borderColor: '#80bdff'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d'
    })
  };

  return (
    <Container style={{ marginTop: '2rem' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <FaUsers className="me-3 text-primary" size={24} />
                <div>
                  <h4 className="mb-1">Participants finaux - Mon pupitre</h4>
                  <small className="text-muted">
                    Gérez les participants finaux de votre pupitre: <strong>{user?.pupitre}</strong>
                  </small>
                </div>
              </div>

              {/* Concert Selection */}
              <Row>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Sélectionner un Concert</Form.Label>
                    <Select
                      options={getConcertOptions()}
                      value={getConcertOptions().find((option) => option.value === selectedConcert) || null}
                      onChange={handleConcertChange}
                      placeholder="-- Choisir un concert --"
                      isClearable
                      isSearchable
                      isDisabled={loading}
                      styles={selectStyles}
                      noOptionsMessage={() => 'Aucun concert avec des participants trouvé'}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Participants Results */}
      {participantsData && (
        <>
          {/* Participants Table */}
          <Card className="shadow-sm border-0">
            {/* ✅ UPDATED: Header with inline export button */}
            <Card.Header className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center bg-white gap-2">
              <h5 className="mb-0">Participants Finaux - Pupitre {participantsData.chefPupitre}</h5>
              {participantsData.totalParticipants > 0 && (
                <div className="d-flex align-items-center gap-3">
                  <Badge bg="info" className="px-3 py-2">
                    {getTotalItems()} participant{getTotalItems() > 1 ? 's' : ''}
                    {searchTerm && ` (filtré${getTotalItems() > 1 ? 's' : ''})`}
                  </Badge>
                  {/* ✅ NEW: Inline Excel export button */}
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={getTotalItems() === 0}
                    className="d-flex align-items-center"
                  >
                    <FileSpreadsheet size={14} className="me-2" />
                    Exporter Excel
                  </Button>
                </div>
              )}
            </Card.Header>

            <Card.Body className="p-0">
              {participantsData.totalParticipants === 0 ? (
                <div className="text-center py-5">
                  <FaUserTimes size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">Aucun participant final</h5>
                  <p className="text-muted">Aucun choriste de votre pupitre n'a été validé pour ce concert.</p>
                </div>
              ) : (
                <>
                  {/* Search Bar */}
                  <div className="p-3 border-bottom">
                    <InputGroup style={{ maxWidth: '400px' }}>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control type="text" placeholder="Rechercher par nom..." value={searchTerm} onChange={handleSearchChange} />
                    </InputGroup>
                  </div>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <>
                      {/* ✅ UPDATED: Added bordered to table */}
                      <Table hover responsive bordered className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Choriste</th>
                            <th>Email</th>
                            <th>Taille (cm)</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPaginatedParticipants().map((participant) => (
                            <tr key={participant._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="me-3">
                                    <div
                                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#3b82f6'
                                      }}
                                    >
                                      {participant.firstName.charAt(0)}
                                      {participant.lastName.charAt(0)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="fw-semibold">
                                      {participant.firstName} {participant.lastName}
                                    </div>
                                    <Badge bg="primary" className="mt-1">
                                      {participant.pupitre}
                                    </Badge>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-muted">{participant.email}</span>
                              </td>
                              <td>
                                <span className="text-muted">{participant.height || 'Non spécifiée'}</span>
                              </td>
                              <td className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleRemoveParticipant(participant)}
                                  disabled={processing}
                                  title="Retirer de la liste (absence le jour du concert)"
                                >
                                  <FaTrash size={12} className="me-1" />
                                  Supprimer
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {getTotalItems() === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center py-4">
                                {searchTerm ? `Aucun participant trouvé pour "${searchTerm}"` : 'Aucun participant trouvé.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>

                      {/* ✅ UPDATED: Responsive Pagination */}
                      {getTotalItems() > 0 && getTotalPages() > 0 && (
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top bg-light gap-2">
                          <div className="d-flex align-items-center">
                            <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                              <span className="d-none d-md-inline">Participants par page:</span>
                              <span className="d-md-none">Par page:</span>
                            </span>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: 'auto' }}
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

                          <div className="text-muted" style={{ fontSize: '14px' }}>
                            {getStartIndex()}-{getEndIndex()} sur {getTotalItems()}
                          </div>

                          <div className="d-flex align-items-center">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={goToFirstPage}
                              disabled={isFirstPage()}
                              className="me-1"
                              style={{ border: 'none', backgroundColor: 'transparent' }}
                            >
                              <FaAngleDoubleLeft />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={goToPreviousPage}
                              disabled={isFirstPage()}
                              className="me-2 me-md-3"
                              style={{ border: 'none', backgroundColor: 'transparent' }}
                            >
                              <FaChevronLeft />
                            </Button>
                            <span className="mx-2 mx-md-3 text-muted" style={{ fontSize: '14px' }}>
                              <span className="d-none d-md-inline">Page </span>
                              {currentPage + 1}
                              <span className="d-none d-md-inline"> sur {getTotalPages()}</span>
                            </span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={goToNextPage}
                              disabled={isLastPage()}
                              className="ms-2 ms-md-3 me-1"
                              style={{ border: 'none', backgroundColor: 'transparent' }}
                            >
                              <FaChevronRight />
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={goToLastPage}
                              disabled={isLastPage()}
                              style={{ border: 'none', backgroundColor: 'transparent' }}
                            >
                              <FaAngleDoubleRight />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default PupitreFinalParticipants;
