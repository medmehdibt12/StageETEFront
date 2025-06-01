import React, { useEffect, useState } from 'react';
import { getActiveChoristes, updatePupitre } from '../../../services/accounts.service';
import { Card, Container, Row, Col, Spinner, Badge, Pagination } from 'react-bootstrap';
import Swal from 'sweetalert2';
import Select from 'react-select';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const PUPITRE_OPTIONS = [
  { value: 'soprano', label: 'Soprano' },
  { value: 'alto', label: 'Alto' },
  { value: 'ténor', label: 'Ténor' },
  { value: 'basse', label: 'Basse' }
];

const ITEMS_PER_PAGE = 9;

function GestionTessiture() {
  const [choristes, setChoristes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterPupitre, setFilterPupitre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const handlePupitreChange = async (userId, newPupitre) => {
    const selectedChoriste = choristes.find((c) => c._id === userId);
    const oldPupitre = selectedChoriste?.pupitre || '(non défini)';

    if (selectedChoriste.pupitre === newPupitre) return;

    const result = await MySwal.fire({
      title: 'Confirmer la modification',
      html: `
        <p><strong>Email:</strong> ${selectedChoriste.email}</p>
        <p><strong>Ancienne tessiture:</strong> ${oldPupitre}</p>
        <p><strong>Nouvelle tessiture:</strong> ${newPupitre}</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, modifier',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    setUpdating(userId);
    try {
      MySwal.fire({
        title: 'Mise à jour...',
        text: 'Veuillez patienter.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await updatePupitre(userId, newPupitre);
      setChoristes((prev) => prev.map((c) => (c._id === userId ? { ...c, pupitre: newPupitre } : c)));

      MySwal.fire({
        icon: 'success',
        title: 'Tessiture mise à jour',
        text: `La tessiture de ${selectedChoriste.email} a été modifiée.`,
        showConfirmButton: true
      });
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message
      });
    } finally {
      setUpdating(null);
    }
  };

  const filteredChoristes = filterPupitre ? choristes.filter((c) => c.pupitre === filterPupitre) : choristes;

  const totalPages = Math.ceil(filteredChoristes.length / ITEMS_PER_PAGE);
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentChoristes = filteredChoristes.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleFilterChange = (selectedOption) => {
    setFilterPupitre(selectedOption?.value || '');
    setCurrentPage(1);
  };

  return (
    <Container className="py-4" style={{ maxWidth: '1140px' }}>
      <h2 className="mb-4 text-center fw-bold">Gestion des tessitures</h2>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div style={{ minWidth: '250px' }}>
          <Select
            options={[{ value: '', label: 'Toutes les tessitures' }, ...PUPITRE_OPTIONS]}
            value={filterPupitre ? PUPITRE_OPTIONS.find((o) => o.value === filterPupitre) : { value: '', label: 'Toutes les tessitures' }}
            onChange={handleFilterChange}
            isClearable={false}
            placeholder="Filtrer par tessiture"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {currentChoristes.length > 0 ? (
              currentChoristes.map((choriste) => (
                <Col key={choriste._id}>
                  <Card className="shadow-sm h-100">
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <div>
                        <p className="mb-2">
                          <strong>Email:</strong> {choriste.email}
                        </p>
                        <p className="mb-3">
                          <strong>Tessiture:</strong>{' '}
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
                              style={{
                                textTransform: 'capitalize',
                                fontSize: '0.75rem'
                              }}
                            >
                              {choriste.pupitre}
                            </Badge>
                          ) : (
                            'Non définie'
                          )}
                        </p>
                      </div>

                      <Select
                        options={PUPITRE_OPTIONS}
                        value={choriste.pupitre ? PUPITRE_OPTIONS.find((opt) => opt.value === choriste.pupitre) : null}
                        onChange={(selectedOption) => handlePupitreChange(choriste._id, selectedOption?.value || '')}
                        isDisabled={updating === choriste._id}
                        placeholder="Changer la tessiture"
                      />
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-center">Aucun choriste trouvé pour cette tessiture.</p>
              </Col>
            )}
          </Row>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default GestionTessiture;
