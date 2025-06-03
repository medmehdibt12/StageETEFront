/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { Container, Spinner, Alert, Tabs, Tab, Table, Form, InputGroup } from 'react-bootstrap';
import { MdEmail } from 'react-icons/md';
import { FaGlobe, FaUserAlt } from 'react-icons/fa';

import { getConcerts, getFinalParticipantsForConcert } from '../../../services/concert.service';

const FinalParticipants = () => {
  const [concerts, setConcerts] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Onglet actif parmi : "Toutes", "soprano", "alto", "ténor", "basse"
  const [activeTab, setActiveTab] = useState('Toutes');

  // ** NOUVEAU : état pour la recherche par nom **
  const [searchTerm, setSearchTerm] = useState('');

  // Les valeurs “officielles” des pupitres
  const PUPITRE_VALUES = ['soprano', 'alto', 'ténor', 'basse'];

  // Charger la liste des concerts pour le sélecteur
  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const data = await getConcerts();
        const formatted = data.map((concert) => ({
          value: concert._id,
          label: `${concert.title} — ${new Date(concert.dateHeure).toLocaleDateString('fr-TN')}`
        }));
        setConcerts(formatted);
      } catch {
        setError('Erreur lors du chargement des concerts.');
      }
    };
    fetchConcerts();
  }, []);

  // Dès qu’un concert est sélectionné, charger ses participants
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedConcert) {
        setParticipants([]);
        return;
      }
      setLoading(true);
      try {
        const data = await getFinalParticipantsForConcert(selectedConcert.value);
        setParticipants(data);
        setError('');
        // Remettre l’onglet sur “Toutes” à chaque sélection de concert
        setActiveTab('Toutes');
      } catch {
        setError('Erreur lors du chargement des participants.');
        setParticipants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [selectedConcert]);

  // Grouper temporairement par pupitre pour calculer les totaux
  const countsByPupitre = PUPITRE_VALUES.reduce((acc, pup) => {
    acc[pup] = participants.filter((c) => c.pupitre?.toLowerCase() === pup.toLowerCase()).length;
    return acc;
  }, {});

  // Total de participants toutes catégories confondues
  const totalCount = participants.length;

  // ** NOUVELLE FONCTION : filtrer selon onglet + recherche par nom **
  const getFilteredList = () => {
    let filtered = [];
    if (activeTab === 'Toutes') {
      filtered = participants;
    } else {
      filtered = participants.filter((c) => c.pupitre?.toLowerCase() === activeTab.toLowerCase());
    }

    // Appliquer le filtre par nom si searchTerm n'est pas vide
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        return fullName.includes(term);
      });
    }

    return filtered;
  };

  return (
    <Container style={{ marginTop: '40px' }}>
      {/* Sélecteur de concert */}
      <div className="mb-4" style={{ maxWidth: 500, margin: '0 auto' }}>
        <label className="form-label fw-bold">Choisir un concert</label>
        <Select
          options={concerts}
          value={selectedConcert}
          onChange={(val) => setSelectedConcert(val)}
          placeholder="Sélectionnez un concert..."
          isClearable
          styles={{
            control: (base) => ({
              ...base,
              boxShadow: 'none'
            })
          }}
        />
      </div>

      {/* Si on charge les participants */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="secondary" />
        </div>
      )}

      {/* Si erreur */}
      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {/* Si aucun concert n'est sélectionné */}
      {!loading && !selectedConcert && <p className="text-center">Veuillez sélectionner un concert ci-dessus.</p>}

      {/* Si concert sélectionné mais pas de participants */}
      {!loading && selectedConcert && participants.length === 0 && (
        <p className="text-center">Aucun participant disponible pour ce concert.</p>
      )}

      {/* Si participants existants, afficher la zone de recherche + onglets */}
      {!loading && selectedConcert && participants.length > 0 && (
        <>
          {/* === NOUVEAU : Champ de recherche par nom === */}
          <Form.Group className="mb-3" style={{ maxWidth: 400 }}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Rechercher par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form.Group>

          {/* Onglets « Toutes (N) », « Soprano (n) », etc. */}
          <Tabs activeKey={activeTab} onSelect={(tabKey) => setActiveTab(tabKey)} className="mb-4">
            {/* Onglet "Toutes" */}
            <Tab eventKey="Toutes" title={`Toutes les tessitures (${totalCount})`} />

            {/* Onglet pour chaque pupitre */}
            {PUPITRE_VALUES.map((pup) => (
              <Tab key={pup} eventKey={pup} title={`${pup.charAt(0).toUpperCase() + pup.slice(1)} (${countsByPupitre[pup]})`} />
            ))}
          </Tabs>

          {/* Tableau du pupitre actif après filtres */}
          <Table striped bordered hover responsive className="align-middle">
            <thead>
              <tr>
                <th style={{ minWidth: '200px' }}>Nom</th>
                <th style={{ minWidth: '250px' }}>Email</th>
                <th style={{ minWidth: '200px' }}>Nationalité</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredList().map((choriste) => (
                <tr key={choriste._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaUserAlt className="me-2 text-secondary" />
                      {choriste.firstName} {choriste.lastName}
                    </div>
                  </td>
                  <td>
                    <MdEmail className="me-2 text-secondary" />
                    {choriste.email}
                  </td>
                  <td>
                    <FaGlobe className="me-2 text-secondary" />
                    {choriste.nationality || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </Container>
  );
};

export default FinalParticipants;
