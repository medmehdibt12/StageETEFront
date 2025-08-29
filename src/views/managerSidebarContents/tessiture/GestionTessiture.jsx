/* eslint-disable react/prop-types */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { getActiveChoristes, updatePupitre } from '../../../services/accounts.service';
import { Container, Spinner, Badge, Tabs, Tab, Table, Form, InputGroup, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import Select from 'react-select';
import withReactContent from 'sweetalert2-react-content';
import { FaUserAlt, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

const MySwal = withReactContent(Swal);

const PUPITRE_OPTIONS = [
  { value: 'soprano', label: 'Soprano' },
  { value: 'alto', label: 'Alto' },
  { value: 'ténor', label: 'Ténor' },
  { value: 'basse', label: 'Basse' }
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '30px',
    height: '30px',
    fontSize: '0.9rem',
    borderRadius: '4px',
    borderColor: state.isFocused ? '#2684FF' : '#ced4da',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(38, 132, 255, 0.25)' : null,
    '&:hover': {
      borderColor: '#2684FF'
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: '30px',
    padding: '0 8px'
  }),
  input: (provided) => ({
    ...provided,
    margin: '0px'
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '30px'
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: '0.9rem'
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: '2px 8px'
  }),
  clearIndicator: (provided) => ({
    ...provided,
    padding: '2px 8px'
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: '4px',
    marginTop: '2px',
    maxHeight: '180px',
    overflowY: 'auto'
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '0.9rem',
    padding: '6px 12px',
    backgroundColor: state.isFocused ? '#e9f5ff' : 'white',
    color: state.isSelected ? '#2684FF' : '#333'
  }),
  noOptionsMessage: (provided) => ({
    ...provided,
    fontSize: '0.9rem'
  })
};

function GestionTessiture() {
  const [choristes, setChoristes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  // Onglets pupitre
  const tessitureTabs = ['Toutes', 'soprano', 'alto', 'ténor', 'basse'];
  const [activeTab, setActiveTab] = useState('Toutes');

  // Angular Material style pagination (0-based like RescheduleCandidate)
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  // État pour la recherche par nom
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchChoristes = async () => {
      try {
        const data = await getActiveChoristes();
        setChoristes(data);
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChoristes();
  }, []);

  // Quand on change d'onglet, on remet la page à 0
  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(0);
  };

  // ✅ UPDATED: Handle pupitre change with chef validation and email notifications
  const handlePupitreChange = async (userId, newPupitre) => {
    const selectedChoriste = choristes.find((c) => c._id === userId);
    const oldPupitre = selectedChoriste?.pupitre || '(non défini)';

    // ✅ NEW: Check if choriste is chef de pupitre
    if (selectedChoriste.isChefDePupitre) {
      MySwal.fire({
        icon: 'warning',
        title: 'Modification impossible',
        html: `
        <div style="text-align: center; margin: 20px 0;">
          <p style="margin-bottom: 15px;"><strong>${selectedChoriste.firstName} ${selectedChoriste.lastName}</strong></p>
          <p style="margin-bottom: 15px; color: #dc3545; font-weight: bold;">
            ⚠️ Ce choriste est actuellement <strong>Chef de Pupitre ${selectedChoriste.pupitre}</strong>
          </p>
          <p style="color: #6c757d;">
            Vous devez d'abord retirer son statut de chef de pupitre avant de pouvoir modifier sa tessiture.
          </p>
        </div>
      `,
        confirmButtonText: 'Compris',
        confirmButtonColor: '#6c757d'
      });
      return;
    }

    // ✅ Handle clear/empty selection
    if (!newPupitre || newPupitre === '') {
      const result = await MySwal.fire({
        title: 'Supprimer la tessiture',
        html: `
        <div style="text-align: center; margin: 20px 0;">
          <p style="margin-bottom: 15px;"><strong>Choriste :</strong> ${selectedChoriste.firstName} ${selectedChoriste.lastName}</p>
          <p style="margin-bottom: 15px;"><strong>Tessiture actuelle :</strong> ${oldPupitre}</p>
          <p style="color: #dc3545; font-weight: bold;">⚠️ Voulez-vous vraiment supprimer la tessiture de ce choriste ?</p>
        </div>
      `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#dc3545'
      });

      if (!result.isConfirmed) return;
    } else {
      // Regular pupitre change
      if (selectedChoriste.pupitre === newPupitre) return;

      const result = await MySwal.fire({
        title: 'Confirmer la modification',
        html: `
        <div style="text-align: center; margin: 20px 0;">
          <p style="margin-bottom: 15px;"><strong>Choriste :</strong> ${selectedChoriste.firstName} ${selectedChoriste.lastName}</p>
          <p style="margin-bottom: 15px;"><strong>Ancienne tessiture :</strong> ${oldPupitre}</p>
          <p style="margin-bottom: 15px;"><strong>Nouvelle tessiture :</strong> ${newPupitre}</p>
        </div>
      `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, modifier',
        cancelButtonText: 'Annuler'
      });

      if (!result.isConfirmed) return;
    }

    setUpdating(userId);
    try {
      MySwal.fire({
        title: 'Mise à jour…',
        text: 'Veuillez patienter.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await updatePupitre(userId, newPupitre || '');

      setChoristes((prev) => prev.map((c) => (c._id === userId ? { ...c, pupitre: newPupitre || null } : c)));

      Swal.close();

      // ✅ Simple success message only
      MySwal.fire({
        icon: 'success',
        title: 'Tessiture mise à jour',
        text: newPupitre
          ? `La tessiture de ${selectedChoriste.firstName} ${selectedChoriste.lastName} a été modifiée vers ${newPupitre}.`
          : `La tessiture de ${selectedChoriste.firstName} ${selectedChoriste.lastName} a été supprimée.`,
        showConfirmButton: true
      });
    } catch (error) {
      Swal.close();
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message
      });
    } finally {
      setUpdating(null);
    }
  };

  // Filtrer la liste par onglet (tous / soprano / alto / ténor / basse)
  const getChoristesForTab = (tabKey) => {
    if (tabKey === 'Toutes') {
      return choristes;
    }
    return choristes.filter((c) => c.pupitre === tabKey);
  };

  // 🔍 Filter choristes based on search term AND tab
  const getFilteredChoristes = (tabKey) => {
    const byTab = getChoristesForTab(tabKey);
    if (!searchTerm.trim()) {
      return byTab;
    }
    const term = searchTerm.toLowerCase();
    return byTab.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return fullName.includes(term);
    });
  };

  // 🔍 Handle search change and reset pagination
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  // 🔍 Updated pagination logic with filtered data (0-based like RescheduleCandidate)
  const getTotalItems = (tabKey) => getFilteredChoristes(tabKey).length;
  const getTotalPages = (tabKey) => Math.ceil(getTotalItems(tabKey) / itemsPerPage);
  const getStartIndex = (tabKey) => (getTotalItems(tabKey) === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = (tabKey) => Math.min((currentPage + 1) * itemsPerPage, getTotalItems(tabKey));

  const getPaginatedChoristes = (tabKey) => {
    const filteredChoristes = getFilteredChoristes(tabKey);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredChoristes.slice(startIndex, endIndex);
  };

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0);
  };

  const goToFirstPage = () => setCurrentPage(0);
  const goToPreviousPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const goToNextPage = (tabKey) => setCurrentPage(Math.min(getTotalPages(tabKey) - 1, currentPage + 1));
  const goToLastPage = (tabKey) => setCurrentPage(getTotalPages(tabKey) - 1);

  const isFirstPage = () => currentPage === 0;
  const isLastPage = (tabKey) => currentPage >= getTotalPages(tabKey) - 1;

  return (
    <Container className="py-4" style={{ maxWidth: '1200px' }}>
      {/* Search */}
      <Form.Group className="mb-4" style={{ maxWidth: 400 }}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border-end-0"
          />
        </InputGroup>
      </Form.Group>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des choristes...</p>
        </div>
      ) : (
        <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-4">
          {tessitureTabs.map((tabKey) => {
            const filtered = getFilteredChoristes(tabKey);
            const count = filtered.length;
            const title = tabKey === 'Toutes' ? `Toutes (${count})` : `${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)} (${count})`;
            const currentChoristes = getPaginatedChoristes(tabKey);

            return (
              <Tab eventKey={tabKey} title={title} key={tabKey}>
                {filtered.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="text-muted">
                      <FaUserAlt size={50} className="mb-3 opacity-25" />
                      <p>{searchTerm ? `Aucun choriste trouvé pour "${searchTerm}"` : 'Aucun choriste trouvé pour cette tessiture'}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <Table bordered hover className="align-middle">
                        <thead>
                          <tr>
                            <th style={{ minWidth: '250px' }}>Choriste</th>
                            <th style={{ minWidth: '150px' }} className="text-center">
                              Tessiture actuelle
                            </th>
                            <th style={{ minWidth: '200px' }}>Modifier tessiture</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentChoristes.map((choriste) => {
                            const genre = choriste.gender?.toLowerCase();
                            let optionsPourChoriste = [];

                            if (genre === 'femme') {
                              optionsPourChoriste = PUPITRE_OPTIONS.filter((p) => p.value === 'soprano' || p.value === 'alto');
                            } else if (genre === 'homme') {
                              optionsPourChoriste = PUPITRE_OPTIONS.filter((p) => p.value === 'ténor' || p.value === 'basse');
                            } else {
                              optionsPourChoriste = [...PUPITRE_OPTIONS];
                            }

                            return (
                              <tr key={choriste._id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: choriste.gender === 'Femme' ? '#e8f4f8' : '#f0f8e8',
                                        color: choriste.gender === 'Femme' ? '#0c5460' : '#155724'
                                      }}
                                    >
                                      <FaUserAlt />
                                    </div>
                                    <div>
                                      <div className="fw-semibold">
                                        {choriste.firstName} {choriste.lastName}
                                      </div>
                                      <small className="text-muted">{choriste.email}</small>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">
                                  {choriste.pupitre ? (
                                    <Badge
                                      bg={
                                        choriste.pupitre === 'soprano'
                                          ? 'primary'
                                          : choriste.pupitre === 'alto'
                                            ? 'success'
                                            : choriste.pupitre === 'ténor'
                                              ? 'warning'
                                              : 'danger'
                                      }
                                      className="px-3 py-2"
                                      style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}
                                    >
                                      {choriste.pupitre}
                                    </Badge>
                                  ) : (
                                    <Badge bg="secondary" className="px-3 py-2">
                                      Non définie
                                    </Badge>
                                  )}
                                </td>
                                <td>
                                  <Select
                                    styles={customSelectStyles}
                                    options={optionsPourChoriste}
                                    value={choriste.pupitre ? optionsPourChoriste.find((opt) => opt.value === choriste.pupitre) : null}
                                    onChange={(selectedOption) => handlePupitreChange(choriste._id, selectedOption?.value || '')}
                                    isDisabled={updating === choriste._id}
                                    placeholder="Sélectionner..."
                                    isClearable={false}
                                    menuPlacement="auto"
                                    menuPortalTarget={document.body}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>

                    {/* ✅ RESPONSIVE: Pagination */}
                    {getTotalItems(tabKey) > 0 && (
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
                        <div className="d-flex align-items-center order-2 order-md-1">
                          <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                            <span className="d-none d-sm-inline">Choristes par page:</span>
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
                          {getStartIndex(tabKey)}-{getEndIndex(tabKey)} sur {getTotalItems(tabKey)}
                          {searchTerm && ` (${getChoristesForTab(tabKey).length} total)`}
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
                            <span className="d-none d-sm-inline"> sur {getTotalPages(tabKey)}</span>
                          </span>

                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => goToNextPage(tabKey)}
                            disabled={isLastPage(tabKey)}
                            className="ms-2 ms-md-3 me-1"
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: isLastPage(tabKey) ? '#6c757d' : '#495057',
                              padding: '4px 8px'
                            }}
                            title="Page suivante"
                          >
                            <FaChevronRight size={12} />
                          </Button>

                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => goToLastPage(tabKey)}
                            disabled={isLastPage(tabKey)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: isLastPage(tabKey) ? '#6c757d' : '#495057',
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
              </Tab>
            );
          })}
        </Tabs>
      )}
    </Container>
  );
}

export default GestionTessiture;
