/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { getActiveChoristes, updatePupitre } from '../../../services/accounts.service';
import { Container, Spinner, Badge, Pagination, Tabs, Tab, Table, Form, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import Select from 'react-select';
import withReactContent from 'sweetalert2-react-content';
import { FaUserAlt } from 'react-icons/fa';

const MySwal = withReactContent(Swal);

// Pour limiter à 5 lignes par page
const ITEMS_PER_PAGE = 5;

const PUPITRE_OPTIONS = [
  { value: 'soprano', label: 'Soprano' },
  { value: 'alto', label: 'Alto' },
  { value: 'ténor', label: 'Ténor' },
  { value: 'basse', label: 'Basse' }
];

/**
 * customStyles réduit la hauteur et les paddings du Select
 * pour qu'il s'intègre dans une cellule de tableau Bootstrap.
 */
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
    zIndex: 9999, // pour passer au-dessus des autres éléments
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

  // Page courante pour l’onglet actif
  const [currentPage, setCurrentPage] = useState(1);

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

  // Quand on change d'onglet, on remet la page à 1
  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
  };

  // Appeler l’API pour mettre à jour la tessiture
  const handlePupitreChange = async (userId, newPupitre) => {
    const selectedChoriste = choristes.find((c) => c._id === userId);
    const oldPupitre = selectedChoriste?.pupitre || '(non défini)';

    if (selectedChoriste.pupitre === newPupitre) return;

    const result = await MySwal.fire({
      title: 'Confirmer la modification',
      html: `
        <p><strong>Email :</strong> ${selectedChoriste.email}</p>
        <p><strong>Ancienne tessiture :</strong> ${oldPupitre}</p>
        <p><strong>Nouvelle tessiture :</strong> ${newPupitre}</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, modifier',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    setUpdating(userId);
    try {
      MySwal.fire({
        title: 'Mise à jour…',
        text: 'Veuillez patienter.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await updatePupitre(userId, newPupitre);

      setChoristes((prev) => prev.map((c) => (c._id === userId ? { ...c, pupitre: newPupitre } : c)));

      Swal.close();
      MySwal.fire({
        icon: 'success',
        title: 'Tessiture mise à jour',
        text: `La tessiture de ${selectedChoriste.email} a bien été modifiée.`,
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

  // Filtrer ensuite par nom
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

  // Appliquer la pagination : 5 éléments par page
  const getPaginatedChoristes = (list, page) => {
    const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
    const indexOfLast = page * ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
    const slice = list.slice(indexOfFirst, indexOfLast);
    return { slice, totalPages };
  };

  return (
    <Container className="py-4" style={{ maxWidth: '1140px' }}>
      {/* Champ de recherche par nom */}
      <Form.Group className="mb-3" style={{ maxWidth: 400 }}>
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </InputGroup>
      </Form.Group>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-4">
          {tessitureTabs.map((tabKey) => {
            // 1) Filtrer selon onglet + recherche par nom
            const filtered = getFilteredChoristes(tabKey);

            // 2) Calculer le nombre pour l'intitulé de l'onglet
            const count = filtered.length;

            // 3) Construire le texte de l’onglet : « Soprano (12) », etc.
            const title = tabKey === 'Toutes' ? `Toutes les tessitures (${count})` : `${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)} (${count})`;

            // 4) Pagination
            const { slice: currentChoristes, totalPages } = getPaginatedChoristes(filtered, currentPage);

            return (
              <Tab eventKey={tabKey} title={title} key={tabKey}>
                {filtered.length === 0 ? (
                  <p className="text-center text-muted py-4">Aucun choriste pour “{title}”.</p>
                ) : (
                  <>
                    <Table striped bordered hover responsive className="align-middle">
                      <thead>
                        <tr>
                          <th style={{ minWidth: '200px' }}>Nom</th>
                          <th style={{ minWidth: '150px' }}>Tessiture actuelle</th>
                          <th style={{ minWidth: '200px' }}>Changer la tessiture</th>
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
                                  <FaUserAlt className="me-2 text-secondary" />
                                  {choriste.firstName} {choriste.lastName}
                                </div>
                              </td>
                              <td>
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
                                    style={{ textTransform: 'capitalize' }}
                                  >
                                    {choriste.pupitre}
                                  </Badge>
                                ) : (
                                  'Non définie'
                                )}
                              </td>
                              <td style={{ width: '100%' }}>
                                <Select
                                  styles={customSelectStyles}
                                  options={optionsPourChoriste}
                                  value={choriste.pupitre ? optionsPourChoriste.find((opt) => opt.value === choriste.pupitre) : null}
                                  onChange={(selectedOption) => handlePupitreChange(choriste._id, selectedOption?.value || '')}
                                  isDisabled={updating === choriste._id}
                                  placeholder="Changer..."
                                  isClearable={true}
                                  menuPlacement="auto"
                                  menuPortalTarget={document.body}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>

                    {totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-3">
                        <Pagination>
                          <Pagination.Prev onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                          {[...Array(totalPages)].map((_, i) => (
                            <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                              {i + 1}
                            </Pagination.Item>
                          ))}
                          <Pagination.Next
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          />
                        </Pagination>
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
