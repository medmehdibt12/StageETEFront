/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Spinner, Table, Row, Col, InputGroup, Container, Card, Badge } from 'react-bootstrap';
import Select from 'react-select';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Swal from 'sweetalert2';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight, FaUsers, FaUserPlus } from 'react-icons/fa';
import { Search } from 'lucide-react';

import {
  getUsers,
  getLockedUsers,
  createUser,
  updateUser,
  deleteUserPermanent,
  restoreUser,
  lockUser
} from '../../../services/accounts.service';
import { useAuth } from '../../../contexts/AuthContext';

const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [lockedUsers, setLockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [tab, setTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ PROFESSIONAL PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pageSizeOptions = [5, 10, 25, 50];

  const { refreshUser } = useAuth();

  // ✅ Role Options
  const roleOptions = [
    { value: 'manager', label: 'Manager de choeur' },
    { value: 'chef de choeur', label: 'Chef de choeur' },
    { value: 'choriste', label: 'Choriste' }
  ];

  // ✅ Gender Options
  const genderOptions = [
    { value: 'Homme', label: 'Homme' },
    { value: 'Femme', label: 'Femme' }
  ];

  const statusOptions = [
    { value: 'Junior', label: 'Junior' },
    { value: 'Sénior', label: 'Sénior' },
    { value: 'Vétéran', label: 'Vétéran' }
  ];

  // ✅ Identity Type Options
  const identityTypeOptions = [
    { value: 'CIN', label: 'CIN' },
    { value: 'Passeport', label: 'Passeport' }
  ];

  const countryOptions = [
    { value: 'Afghanistan', label: '🇦🇫 Afghanistan' },
    { value: 'Afrique du Sud', label: '🇿🇦 Afrique du Sud' },
    { value: 'Albanie', label: '🇦🇱 Albanie' },
    { value: 'Algérie', label: '🇩🇿 Algérie' },
    { value: 'Allemagne', label: '🇩🇪 Allemagne' },
    { value: 'Andorre', label: '🇦🇩 Andorre' },
    { value: 'Angola', label: '🇦🇴 Angola' },
    { value: 'Arabie Saoudite', label: '🇸🇦 Arabie Saoudite' },
    { value: 'Argentine', label: '🇦🇷 Argentine' },
    { value: 'Arménie', label: '🇦🇲 Arménie' },
    { value: 'Australie', label: '🇦🇺 Australie' },
    { value: 'Autriche', label: '🇦🇹 Autriche' },
    { value: 'Azerbaïdjan', label: '🇦🇿 Azerbaïdjan' },
    { value: 'Bahreïn', label: '🇧🇭 Bahreïn' },
    { value: 'Bangladesh', label: '🇧🇩 Bangladesh' },
    { value: 'Belgique', label: '🇧🇪 Belgique' },
    { value: 'Belize', label: '🇧🇿 Belize' },
    { value: 'Bénin', label: '🇧🇯 Bénin' },
    { value: 'Bolivie', label: '🇧🇴 Bolivie' },
    { value: 'Brésil', label: '🇧🇷 Brésil' },
    { value: 'Bulgarie', label: '🇧🇬 Bulgarie' },
    { value: 'Burkina Faso', label: '🇧🇫 Burkina Faso' },
    { value: 'Cameroun', label: '🇨🇲 Cameroun' },
    { value: 'Canada', label: '🇨🇦 Canada' },
    { value: 'Chili', label: '🇨🇱 Chili' },
    { value: 'Chine', label: '🇨🇳 Chine' },
    { value: 'Chypre', label: '🇨🇾 Chypre' },
    { value: 'Colombie', label: '🇨🇴 Colombie' },
    { value: 'Corée du Sud', label: '🇰🇷 Corée du Sud' },
    { value: 'Costa Rica', label: '🇨🇷 Costa Rica' },
    { value: 'Croatie', label: '🇭🇷 Croatie' },
    { value: 'Danemark', label: '🇩🇰 Danemark' },
    { value: 'Égypte', label: '🇪🇬 Égypte' },
    { value: 'Émirats Arabes Unis', label: '🇦🇪 Émirats Arabes Unis' },
    { value: 'Équateur', label: '🇪🇨 Équateur' },
    { value: 'Espagne', label: '🇪🇸 Espagne' },
    { value: 'Estonie', label: '🇪🇪 Estonie' },
    { value: 'États-Unis', label: '🇺🇸 États-Unis' },
    { value: 'Éthiopie', label: '🇪🇹 Éthiopie' },
    { value: 'Finlande', label: '🇫🇮 Finlande' },
    { value: 'France', label: '🇫🇷 France' },
    { value: 'Gabon', label: '🇬🇦 Gabon' },
    { value: 'Géorgie', label: '🇬🇪 Géorgie' },
    { value: 'Ghana', label: '🇬🇭 Ghana' },
    { value: 'Grèce', label: '🇬🇷 Grèce' },
    { value: 'Guatemala', label: '🇬🇹 Guatemala' },
    { value: 'Guinée', label: '🇬🇳 Guinée' },
    { value: 'Hongrie', label: '🇭🇺 Hongrie' },
    { value: 'Inde', label: '🇮🇳 Inde' },
    { value: 'Indonésie', label: '🇮🇩 Indonésie' },
    { value: 'Iran', label: '🇮🇷 Iran' },
    { value: 'Iraq', label: '🇮🇶 Iraq' },
    { value: 'Irlande', label: '🇮🇪 Irlande' },
    { value: 'Islande', label: '🇮🇸 Islande' },
    { value: 'Italie', label: '🇮🇹 Italie' },
    { value: 'Japon', label: '🇯🇵 Japon' },
    { value: 'Jordanie', label: '🇯🇴 Jordanie' },
    { value: 'Kazakhstan', label: '🇰🇿 Kazakhstan' },
    { value: 'Kenya', label: '🇰🇪 Kenya' },
    { value: 'Koweït', label: '🇰🇼 Koweït' },
    { value: 'Lettonie', label: '🇱🇻 Lettonie' },
    { value: 'Liban', label: '🇱🇧 Liban' },
    { value: 'Libéria', label: '🇱🇷 Libéria' },
    { value: 'Libye', label: '🇱🇾 Libye' },
    { value: 'Lituanie', label: '🇱🇹 Lituanie' },
    { value: 'Luxembourg', label: '🇱🇺 Luxembourg' },
    { value: 'Madagascar', label: '🇲🇬 Madagascar' },
    { value: 'Malaisie', label: '🇲🇾 Malaisie' },
    { value: 'Mali', label: '🇲🇱 Mali' },
    { value: 'Malte', label: '🇲🇹 Malte' },
    { value: 'Maroc', label: '🇲🇦 Maroc' },
    { value: 'Maurice', label: '🇲🇺 Maurice' },
    { value: 'Mauritanie', label: '🇲🇷 Mauritanie' },
    { value: 'Mexique', label: '🇲🇽 Mexique' },
    { value: 'Moldavie', label: '🇲🇩 Moldavie' },
    { value: 'Monaco', label: '🇲🇨 Monaco' },
    { value: 'Mongolie', label: '🇲🇳 Mongolie' },
    { value: 'Monténégro', label: '🇲🇪 Monténégro' },
    { value: 'Mozambique', label: '🇲🇿 Mozambique' },
    { value: 'Namibie', label: '🇳🇦 Namibie' },
    { value: 'Népal', label: '🇳🇵 Népal' },
    { value: 'Nicaragua', label: '🇳🇮 Nicaragua' },
    { value: 'Niger', label: '🇳🇪 Niger' },
    { value: 'Nigéria', label: '🇳🇬 Nigéria' },
    { value: 'Norvège', label: '🇳🇴 Norvège' },
    { value: 'Nouvelle-Zélande', label: '🇳🇿 Nouvelle-Zélande' },
    { value: 'Oman', label: '🇴🇲 Oman' },
    { value: 'Ouganda', label: '🇺🇬 Ouganda' },
    { value: 'Pakistan', label: '🇵🇰 Pakistan' },
    { value: 'Palestine', label: '🇵🇸 Palestine' },
    { value: 'Panama', label: '🇵🇦 Panama' },
    { value: 'Paraguay', label: '🇵🇾 Paraguay' },
    { value: 'Pays-Bas', label: '🇳🇱 Pays-Bas' },
    { value: 'Pérou', label: '🇵🇪 Pérou' },
    { value: 'Philippines', label: '🇵🇭 Philippines' },
    { value: 'Pologne', label: '🇵🇱 Pologne' },
    { value: 'Portugal', label: '🇵🇹 Portugal' },
    { value: 'Qatar', label: '🇶🇦 Qatar' },
    { value: 'République Tchèque', label: '🇨🇿 République Tchèque' },
    { value: 'Roumanie', label: '🇷🇴 Roumanie' },
    { value: 'Royaume-Uni', label: '🇬🇧 Royaume-Uni' },
    { value: 'Russie', label: '🇷🇺 Russie' },
    { value: 'Rwanda', label: '🇷🇼 Rwanda' },
    { value: 'Sénégal', label: '🇸🇳 Sénégal' },
    { value: 'Serbie', label: '🇷🇸 Serbie' },
    { value: 'Singapour', label: '🇸🇬 Singapour' },
    { value: 'Slovaquie', label: '🇸🇰 Slovaquie' },
    { value: 'Slovénie', label: '🇸🇮 Slovénie' },
    { value: 'Somalie', label: '🇸🇴 Somalie' },
    { value: 'Soudan', label: '🇸🇩 Soudan' },
    { value: 'Sri Lanka', label: '🇱🇰 Sri Lanka' },
    { value: 'Suède', label: '🇸🇪 Suède' },
    { value: 'Suisse', label: '🇨🇭 Suisse' },
    { value: 'Syrie', label: '🇸🇾 Syrie' },
    { value: 'Tadjikistan', label: '🇹🇯 Tadjikistan' },
    { value: 'Tanzanie', label: '🇹🇿 Tanzanie' },
    { value: 'Tchad', label: '🇹🇩 Tchad' },
    { value: 'Thaïlande', label: '🇹🇭 Thaïlande' },
    { value: 'Togo', label: '🇹🇬 Togo' },
    { value: 'Tunisie', label: '🇹🇳 Tunisie' },
    { value: 'Turkménistan', label: '🇹🇲 Turkménistan' },
    { value: 'Turquie', label: '🇹🇷 Turquie' },
    { value: 'Ukraine', label: '🇺🇦 Ukraine' },
    { value: 'Uruguay', label: '🇺🇾 Uruguay' },
    { value: 'Venezuela', label: '🇻🇪 Venezuela' },
    { value: 'Vietnam', label: '🇻🇳 Vietnam' },
    { value: 'Yémen', label: '🇾🇪 Yémen' },
    { value: 'Zambie', label: '🇿🇲 Zambie' },
    { value: 'Zimbabwe', label: '🇿🇼 Zimbabwe' }
  ];

  // ✅ Dynamic pupitre options based on gender
  const getPupitreOptions = (gender) => {
    if (gender === 'Homme') {
      return [
        { value: 'ténor', label: 'Ténor' },
        { value: 'basse', label: 'Basse' }
      ];
    } else if (gender === 'Femme') {
      return [
        { value: 'soprano', label: 'Soprano' },
        { value: 'alto', label: 'Alto' }
      ];
    }
    return [];
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const active = await getUsers();
      const locked = await getLockedUsers();
      setUsers(active);
      setLockedUsers(locked.lockedUsers);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ RESET PAGINATION WHEN TAB OR SEARCH CHANGES
  useEffect(() => {
    setCurrentPage(0);
  }, [tab, searchTerm]);

  const filtered = (tab === 'active' ? users : lockedUsers).filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // ✅ PROFESSIONAL PAGINATION FUNCTIONS
  const getTotalItems = () => filtered.length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const getPaginatedData = () => {
    const start = currentPage * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
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

  const handlePermanentDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Suppression définitive ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer définitivement !'
    });
    if (isConfirmed) {
      try {
        await deleteUserPermanent(id);
        fetchUsers();
        Swal.fire('Supprimé !', 'Le compte a été supprimé définitivement.', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        Swal.fire('Erreur', 'Échec de la suppression du compte.', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Voulez-vous verrouiller ce compte ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, verrouiller !'
    });
    if (confirm.isConfirmed) {
      try {
        await lockUser(id);
        fetchUsers();
        Swal.fire('Verrouillé !', 'Le compte a été verrouillé.', 'success');
      } catch (error) {
        console.error('Error locking user:', error);
        Swal.fire('Erreur', 'Échec du verrouillage du compte.', 'error');
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreUser(id);
      fetchUsers();
      Swal.fire('Rétabli !', 'Le compte a été rétabli.', 'success');
    } catch (error) {
      console.error('Error restoring user:', error);
      Swal.fire('Erreur', 'Échec de la restauration du compte.', 'error');
    }
  };

  // ✅ FORM SUBMISSION - LET YUP HANDLE ALL VALIDATION
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // 1) Vérifier doublon d'email OU d'identityNumber (si choriste)
      if (editingUser) {
        const collision = users.find((u) => {
          const sameEmail = u.email === values.email && u._id !== editingUser._id;
          const sameIdentity =
            values.role === 'choriste' &&
            (u.identityNumber === values.identityNumber || u.cin === values.identityNumber) &&
            u._id !== editingUser._id;
          return sameEmail || sameIdentity;
        });
        if (collision) {
          Swal.fire('Erreur', "Un utilisateur avec cet email ou ce numéro d'identité existe déjà.", 'error');
          setSubmitting(false);
          return;
        }
      } else {
        const collision = users.find((u) => {
          const sameEmail = u.email === values.email;
          const sameIdentity =
            values.role === 'choriste' && (u.identityNumber === values.identityNumber || u.cin === values.identityNumber);
          return sameEmail || sameIdentity;
        });
        if (collision) {
          Swal.fire('Erreur', "Un utilisateur avec cet email ou ce numéro d'identité existe déjà.", 'error');
          setSubmitting(false);
          return;
        }
      }

      const currentUserId = localStorage.getItem('userId');

      if (editingUser) {
        // Update existing user
        const emailChanged = editingUser.email !== values.email;
        const identityChanged =
          values.role === 'choriste' && (editingUser.identityNumber !== values.identityNumber || editingUser.cin !== values.identityNumber);

        if (emailChanged || identityChanged) {
          Swal.fire({
            title: 'Modification du compte…',
            text: "Veuillez patienter pendant l'envoi des identifiants.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading()
          });
        }

        await updateUser(editingUser._id, values);
        if (editingUser._id === currentUserId) {
          await refreshUser();
        }

        if (emailChanged || identityChanged) {
          Swal.close();
        }

        Swal.fire(
          'Utilisateur modifié avec succès',
          emailChanged || identityChanged
            ? 'Les identifiants ont été renvoyés à la nouvelle adresse email.'
            : "L'utilisateur a été modifié avec succès.",
          'success'
        );
      } else {
        // Create new user
        Swal.fire({
          title: 'Création du compte…',
          text: "Veuillez patienter pendant l'envoi des identifiants.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading()
        });
        await createUser(values);
        Swal.close();
        Swal.fire('Utilisateur créé avec succès', 'Les identifiants ont été envoyés par email.', 'success');
      }

      fetchUsers();
      resetForm();
      setShowModal(false);
      setEditingUser(null);
    } catch (err) {
      const message = err?.response?.data?.message || "Échec de l'opération.";
      Swal.fire('Erreur', message.includes('exists') ? 'Cet utilisateur existe déjà.' : message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="px-3 px-md-4" style={{ marginTop: '2rem', maxWidth: '1400px' }}>
      {/* ✅ RESPONSIVE: Header Section */}
      <div className="mb-4">
        {/* <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
          <div>
            <h2 className="fw-bold text-dark mb-1 d-flex align-items-center">
              <FaUsers className="me-2 me-md-3 text-primary" />
              <span className="d-none d-sm-inline">Gestion des Comptes</span>
              <span className="d-sm-none">Comptes</span>
            </h2>
            <p className="text-muted mb-0 d-none d-sm-block">Gérez les comptes utilisateurs et leurs permissions</p>
          </div>
        </div> */}

        {/* ✅ RESPONSIVE: Tabs */}
        <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-4 mb-3">
          <button
            className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-link text-primary'} px-3 py-2`}
            onClick={() => setTab('active')}
          >
            <span className="d-none d-sm-inline">Comptes Actifs</span>
            <span className="d-sm-none">Actifs</span>
          </button>
          <button
            className={`btn ${tab === 'locked' ? 'btn-primary' : 'btn-link text-primary'} px-3 py-2`}
            onClick={() => setTab('locked')}
          >
            <span className="d-none d-sm-inline">Comptes Verrouillés</span>
            <span className="d-sm-none">Verrouillés</span>
          </button>
        </div>
      </div>

      {/* ✅ RESPONSIVE: Controls Section */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <InputGroup style={{ maxWidth: '400px' }} className="flex-grow-1 flex-md-grow-0">
              <InputGroup.Text style={{ backgroundColor: '#f8f9fa', borderColor: '#e5e7eb' }}>
                <Search size={16} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Rechercher par nom complet"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderColor: '#e5e7eb',
                  fontSize: '14px'
                }}
              />
            </InputGroup>
            {tab === 'active' && (
              <Button
                variant="success"
                onClick={() => {
                  setEditingUser(null);
                  setShowModal(true);
                }}
                className="d-flex align-items-center px-3 py-2"
              >
                <FaUserPlus className="me-1 me-sm-2" size={14} />
                <span className="d-none d-sm-inline">Ajouter un compte</span>
                <span className="d-sm-none">Ajouter</span>
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Chargement des comptes...</p>
        </div>
      ) : (
        <>
          {/* ✅ RESPONSIVE: Table */}
          <Card className="shadow-sm border-0">
            <div className="table-responsive">
              <Table bordered hover className="mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom Complet</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedData().map((user, index) => (
                    <tr key={user._id}>
                      <td>{getStartIndex() + index}</td>
                      <td>
                        {user.firstName} {user.lastName}
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phoneCountryCode && user.phone ? `${user.phoneCountryCode} ${user.phone}` : user.phone || '-'}</td>
                      <td>
                        <Badge
                          bg={
                            user.role === 'manager'
                              ? 'info'
                              : user.role === 'chef de choeur'
                                ? 'primary'
                                : user.role === 'choriste'
                                  ? 'secondary'
                                  : 'secondary'
                          }
                          className="px-2 py-1"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        {tab === 'active' ? (
                          <>
                            <Button
                              size="sm"
                              className="me-2"
                              variant="warning"
                              onClick={() => {
                                setEditingUser(user);
                                setShowModal(true);
                              }}
                            >
                              Modifier
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(user._id)}>
                              Verrouiller
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="success" onClick={() => handleRestore(user._id)}>
                              Restaurer
                            </Button>
                            <Button size="sm" variant="danger" className="ms-2" onClick={() => handlePermanentDelete(user._id)}>
                              Supprimer
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* ✅ RESPONSIVE: Pagination */}
            {getTotalPages() > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-2 p-md-3 border-top bg-light gap-2">
                <div className="d-flex align-items-center order-2 order-md-1">
                  <span className="me-2 text-muted" style={{ fontSize: '13px' }}>
                    <span className="d-none d-sm-inline">Comptes par page:</span>
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
          </Card>
        </>
      )}

      {/* ✅ RESPONSIVE: Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="h5 fw-semibold">
            <FaUserPlus className="me-2 text-primary" />
            <span className="d-none d-sm-inline">{editingUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}</span>
            <span className="d-sm-none">{editingUser ? 'Modifier' : 'Ajouter'}</span>
          </Modal.Title>
        </Modal.Header>

        <Formik
          initialValues={{
            firstName: editingUser?.firstName || '',
            lastName: editingUser?.lastName || '',
            email: editingUser?.email || '',
            phone: editingUser?.phone || '',
            phoneCountryCode: editingUser?.phoneCountryCode || '+216',
            role: editingUser?.role || '',
            // ✅ CHORISTE FIELDS
            professionalSituation: editingUser?.professionalSituation || '',
            gender: editingUser?.gender || '',
            birthDate: editingUser?.birthDate ? editingUser.birthDate.split('T')[0] : '',
            nationality: editingUser?.nationality || '',
            identityType: editingUser?.identityType || (editingUser?.cin ? 'CIN' : ''),
            identityNumber: editingUser?.identityNumber || editingUser?.cin || '',
            height: editingUser?.height || '',
            // ✅ REQUIRED RADIO BUTTONS - NULL BY DEFAULT
            hasMusicalKnowledge: editingUser?.hasMusicalKnowledge !== undefined ? editingUser.hasMusicalKnowledge : null,
            musicalExperience: editingUser?.musicalExperience || '',
            isActiveInOtherChoir: editingUser?.isActiveInOtherChoir !== undefined ? editingUser.isActiveInOtherChoir : null,
            otherChoir: editingUser?.otherChoir || '',
            pupitre: editingUser?.pupitre || '',
            status: editingUser?.status || ''
          }}
          validationSchema={Yup.lazy((values) => {
            let shape = {
              firstName: Yup.string().required('Le prénom est requis'),
              lastName: Yup.string().required('Le nom est requis'),
              email: Yup.string().email('Email invalide').required('Email requis'),
              role: Yup.string().required('Rôle requis'),
              // ✅ PHONE REQUIRED FOR ALL ROLES
              phone: Yup.string().required('Téléphone requis'),
              phoneCountryCode: Yup.string().required('Code pays requis')
            };

            if (values.role === 'choriste') {
              shape = {
                ...shape,
                professionalSituation: Yup.string().required('Situation professionnelle requise'),
                gender: Yup.string().required('Genre requis'),
                birthDate: Yup.string().required('Date de naissance requise'),
                nationality: Yup.string().required('Nationalité requise'),
                identityType: Yup.string().required("Type d'identité requis"),
                identityNumber: Yup.string().when('identityType', {
                  is: (val) => val && val !== '',
                  then: (schema) => {
                    if (values.identityType === 'CIN') {
                      return schema
                        .required('Numéro CIN requis')
                        .matches(/^[01]\d{7}$/, 'Le CIN doit commencer par 0 ou 1 et contenir exactement 8 chiffres');
                    }
                    return schema.required('Numéro de passeport requis');
                  },
                  otherwise: (schema) => schema.notRequired()
                }),
                height: Yup.number().positive('La taille doit être positive').required('Taille requise'),
                pupitre: Yup.string().required('Pupitre requis'),
                status: Yup.string().oneOf(['Junior', 'Sénior', 'Vétéran'], 'Statut invalide').required('Statut requis'),

                // ✅ PERFECT VALIDATION - RADIO BUTTONS REQUIRED, CONDITIONAL FIELDS ONLY WHEN OUI
                hasMusicalKnowledge: Yup.boolean().nullable().required('Veuillez répondre à cette question'),
                musicalExperience: Yup.string().test('musical-experience-conditional', 'Expérience musicale requise', function (value) {
                  const { hasMusicalKnowledge } = this.parent;
                  if (hasMusicalKnowledge === true) {
                    return value && value.trim() !== '';
                  }
                  return true;
                }),

                isActiveInOtherChoir: Yup.boolean().nullable().required('Veuillez répondre à cette question'),
                otherChoir: Yup.string().test('other-choir-conditional', "Nom de l'autre choeur requis", function (value) {
                  const { isActiveInOtherChoir } = this.parent;
                  if (isActiveInOtherChoir === true) {
                    return value && value.trim() !== '';
                  }
                  return true;
                })
              };
            }

            return Yup.object().shape(shape);
          })}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            values,
            handleChange,
            handleBlur,
            handleSubmit,
            isSubmitting,
            touched,
            errors,
            setFieldValue,
            setFieldTouched,
            setFieldError
          }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body className="p-3 p-md-4">
                <Row className="mb-2">
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Prénom</Form.Label>
                      <Form.Control
                        name="firstName"
                        value={values.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.firstName && !!errors.firstName}
                      />
                      <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group>
                      <Form.Label>Nom</Form.Label>
                      <Form.Control
                        name="lastName"
                        value={values.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.lastName && !!errors.lastName}
                      />
                      <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.email && !!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>

                {/* ✅ PHONE REQUIRED FOR ALL ROLES */}
                <Form.Group className="mb-2">
                  <Form.Label>
                    Téléphone <span className="text-danger">*</span>
                  </Form.Label>
                  <PhoneInput
                    country={'tn'}
                    value={values.phone ? `${values.phoneCountryCode?.replace('+', '') || '216'}${values.phone}` : ''}
                    onChange={(fullPhone, country) => {
                      const dialCode = country.dialCode;
                      setFieldValue('phoneCountryCode', `+${dialCode}`);
                      const cleanPhone = fullPhone.replace(dialCode, '');
                      setFieldValue('phone', cleanPhone);
                    }}
                    enableSearch={true}
                    excludeCountries={['il']}
                    searchPlaceholder="Rechercher un pays"
                    inputStyle={{
                      width: '100%',
                      height: '42px',
                      borderRadius: '10px',
                      border: touched.phone && errors.phone ? '1px solid #dc3545' : '1px solid #e2e8f0',
                      fontSize: '0.875rem',
                      paddingLeft: '60px'
                    }}
                    containerStyle={{
                      width: '100%'
                    }}
                    buttonStyle={{
                      borderRadius: '10px 0 0 10px',
                      border: touched.phone && errors.phone ? '1px solid #dc3545' : '1px solid #e2e8f0',
                      backgroundColor: '#f8f9fa'
                    }}
                    dropdownStyle={{
                      borderRadius: '10px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  {touched.phone && errors.phone && (
                    <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                      {errors.phone}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Rôle</Form.Label>
                  <Select
                    options={roleOptions}
                    name="role"
                    value={roleOptions.find((o) => o.value === values.role)}
                    onChange={(o) => {
                      setFieldValue('role', o.value);
                      // ✅ Clear choriste fields when changing away from choriste
                      if (o.value !== 'choriste') {
                        setFieldValue('professionalSituation', '');
                        setFieldValue('gender', '');
                        setFieldValue('birthDate', '');
                        setFieldValue('nationality', '');
                        setFieldValue('identityType', '');
                        setFieldValue('identityNumber', '');
                        setFieldValue('height', '');
                        setFieldValue('pupitre', '');
                        setFieldValue('hasMusicalKnowledge', null);
                        setFieldValue('musicalExperience', '');
                        setFieldValue('isActiveInOtherChoir', null);
                        setFieldValue('otherChoir', '');
                      }
                    }}
                    onBlur={() => handleBlur({ target: { name: 'role' } })}
                    className={touched.role && errors.role ? 'is-invalid' : ''}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: '32px',
                        fontSize: '0.9rem'
                      }),
                      menu: (provided) => ({
                        ...provided,
                        fontSize: '0.9rem'
                      })
                    }}
                  />
                  {touched.role && errors.role && <div className="invalid-feedback d-block">{errors.role}</div>}
                </Form.Group>

                {/* ✅ CHORISTE-SPECIFIC FIELDS */}
                {values.role === 'choriste' && (
                  <>
                    <hr className="my-3" />
                    <h6 className="text-primary mb-3">Informations Choriste</h6>

                    {/* Professional Situation */}
                    <Form.Group className="mb-2">
                      <Form.Label>
                        Situation Professionnelle <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        name="professionalSituation"
                        value={values.professionalSituation}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.professionalSituation && !!errors.professionalSituation}
                        placeholder="Ex: Étudiant, Ingénieur, Professeur..."
                      />
                      <Form.Control.Feedback type="invalid">{errors.professionalSituation}</Form.Control.Feedback>
                    </Form.Group>

                    <Row className="mb-2">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>
                            Genre <span className="text-danger">*</span>
                          </Form.Label>
                          <Select
                            options={genderOptions}
                            name="gender"
                            value={genderOptions.find((o) => o.value === values.gender)}
                            onChange={(o) => {
                              setFieldValue('gender', o?.value || '');
                              setFieldValue('pupitre', '');
                            }}
                            onBlur={() => handleBlur({ target: { name: 'gender' } })}
                            className={touched.gender && errors.gender ? 'is-invalid' : ''}
                          />
                          {touched.gender && errors.gender && <div className="invalid-feedback d-block">{errors.gender}</div>}
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>
                            Date de naissance <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            name="birthDate"
                            type="date"
                            value={values.birthDate}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.birthDate && !!errors.birthDate}
                          />
                          <Form.Control.Feedback type="invalid">{errors.birthDate}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-2">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>
                            Nationalité <span className="text-danger">*</span>
                          </Form.Label>
                          <Select
                            options={countryOptions}
                            name="nationality"
                            value={countryOptions.find((o) => o.value === values.nationality)}
                            onChange={(o) => setFieldValue('nationality', o?.value || '')}
                            onBlur={() => handleBlur({ target: { name: 'nationality' } })}
                            className={touched.nationality && errors.nationality ? 'is-invalid' : ''}
                            placeholder="Sélectionner un pays..."
                            isSearchable
                          />
                          {touched.nationality && errors.nationality && (
                            <div className="invalid-feedback d-block">{errors.nationality}</div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label>
                            Taille (cm) <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            name="height"
                            type="number"
                            value={values.height}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.height && !!errors.height}
                            placeholder="Ex: 175"
                          />
                          <Form.Control.Feedback type="invalid">{errors.height}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* ✅ IDENTITY DOCUMENT WITH CIN VALIDATION */}
                    <Row className="mb-2">
                      <Col xs={12} md={4}>
                        <Form.Group>
                          <Form.Label>
                            Type d'identité <span className="text-danger">*</span>
                          </Form.Label>
                          <div className="d-flex gap-3 mt-2 flex-column flex-sm-row">
                            {identityTypeOptions.map((option) => (
                              <Form.Check
                                key={option.value}
                                type="radio"
                                name="identityType"
                                label={option.label}
                                value={option.value}
                                checked={values.identityType === option.value}
                                onChange={handleChange}
                                isInvalid={touched.identityType && !!errors.identityType}
                              />
                            ))}
                          </div>
                          {touched.identityType && errors.identityType && (
                            <div className="invalid-feedback d-block">{errors.identityType}</div>
                          )}
                        </Form.Group>
                      </Col>
                      {values.identityType && (
                        <Col xs={12} md={8}>
                          <Form.Group>
                            <Form.Label>
                              Numéro {values.identityType === 'CIN' ? 'CIN' : 'de passeport'} <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              name="identityNumber"
                              value={values.identityNumber}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.identityNumber && !!errors.identityNumber}
                              placeholder={
                                values.identityType === 'CIN'
                                  ? 'Ex: 01234567 (8 chiffres, commence par 0 ou 1)'
                                  : 'Entrer le numéro de passeport'
                              }
                            />
                            <Form.Control.Feedback type="invalid">{errors.identityNumber}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      )}
                    </Row>

                    {/* Pupitre */}
                    <Form.Group className="mb-2">
                      <Form.Label>
                        Pupitre <span className="text-danger">*</span>
                      </Form.Label>
                      <Select
                        options={getPupitreOptions(values.gender)}
                        name="pupitre"
                        value={getPupitreOptions(values.gender).find((o) => o.value === values.pupitre)}
                        onChange={(o) => setFieldValue('pupitre', o?.value || '')}
                        onBlur={() => handleBlur({ target: { name: 'pupitre' } })}
                        className={touched.pupitre && errors.pupitre ? 'is-invalid' : ''}
                        isDisabled={!values.gender}
                        placeholder={values.gender ? 'Sélectionner un pupitre' : "Sélectionner d'abord un genre"}
                      />
                      {touched.pupitre && errors.pupitre && <div className="invalid-feedback d-block">{errors.pupitre}</div>}
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label>
                        Statut <span className="text-danger">*</span>
                      </Form.Label>
                      <Select
                        options={statusOptions}
                        name="status"
                        value={statusOptions.find((o) => o.value === values.status)}
                        onChange={(o) => setFieldValue('status', o?.value || 'Junior')}
                        onBlur={() => handleBlur({ target: { name: 'status' } })}
                        className={touched.status && errors.status ? 'is-invalid' : ''}
                        placeholder="Sélectionner le statut"
                      />
                      {touched.status && errors.status && <div className="invalid-feedback d-block">{errors.status}</div>}
                    </Form.Group>
                    {/* ✅ PERFECT MUSICAL KNOWLEDGE - REQUIRED RADIO + CONDITIONAL INPUT */}
                    <Form.Group className="mb-2">
                      <Form.Label>
                        Avez-vous des connaissances musicales ? <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="d-flex gap-3 mt-2 flex-column flex-sm-row">
                        <Form.Check
                          type="radio"
                          name="hasMusicalKnowledge"
                          label="Oui"
                          value="true"
                          checked={values.hasMusicalKnowledge === true}
                          onChange={() => setFieldValue('hasMusicalKnowledge', true)}
                        />
                        <Form.Check
                          type="radio"
                          name="hasMusicalKnowledge"
                          label="Non"
                          value="false"
                          checked={values.hasMusicalKnowledge === false}
                          onChange={() => {
                            setFieldValue('hasMusicalKnowledge', false);
                            setFieldValue('musicalExperience', '');
                            setFieldTouched('musicalExperience', false);
                            setFieldError('musicalExperience', undefined);
                          }}
                        />
                      </div>
                      {touched.hasMusicalKnowledge && errors.hasMusicalKnowledge && (
                        <div className="invalid-feedback d-block">{errors.hasMusicalKnowledge}</div>
                      )}
                    </Form.Group>

                    {/* Conditional Musical Experience */}
                    {values.hasMusicalKnowledge === true && (
                      <Form.Group className="mb-2">
                        <Form.Label>
                          Expérience musicale <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="musicalExperience"
                          value={values.musicalExperience}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.musicalExperience && !!errors.musicalExperience}
                          placeholder="Décrivez votre expérience musicale..."
                        />
                        <Form.Control.Feedback type="invalid">{errors.musicalExperience}</Form.Control.Feedback>
                      </Form.Group>
                    )}

                    {/* ✅ PERFECT OTHER CHOIR - REQUIRED RADIO + CONDITIONAL INPUT */}
                    <Form.Group className="mb-2">
                      <Form.Label>
                        Êtes-vous actif dans un autre choeur ? <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="d-flex gap-3 mt-2 flex-column flex-sm-row">
                        <Form.Check
                          type="radio"
                          name="isActiveInOtherChoir"
                          label="Oui"
                          value="true"
                          checked={values.isActiveInOtherChoir === true}
                          onChange={() => setFieldValue('isActiveInOtherChoir', true)}
                        />
                        <Form.Check
                          type="radio"
                          name="isActiveInOtherChoir"
                          label="Non"
                          value="false"
                          checked={values.isActiveInOtherChoir === false}
                          onChange={() => {
                            setFieldValue('isActiveInOtherChoir', false);
                            setFieldValue('otherChoir', '');
                            setFieldTouched('otherChoir', false);
                            setFieldError('otherChoir', undefined);
                          }}
                        />
                      </div>
                      {touched.isActiveInOtherChoir && errors.isActiveInOtherChoir && (
                        <div className="invalid-feedback d-block">{errors.isActiveInOtherChoir}</div>
                      )}
                    </Form.Group>

                    {/* Conditional Other Choir */}
                    {values.isActiveInOtherChoir === true && (
                      <Form.Group className="mb-2">
                        <Form.Label>
                          Nom de l'autre choeur <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          name="otherChoir"
                          value={values.otherChoir}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.otherChoir && !!errors.otherChoir}
                          placeholder="Nom du choeur..."
                        />
                        <Form.Control.Feedback type="invalid">{errors.otherChoir}</Form.Control.Feedback>
                      </Form.Group>
                    )}
                  </>
                )}
              </Modal.Body>

              <Modal.Footer className="border-top bg-light px-3 px-md-4">
                <div className="d-flex gap-2 w-100 flex-column flex-sm-row justify-content-sm-end">
                  <Button variant="secondary" onClick={() => setShowModal(false)} className="order-2 order-sm-1 px-3 px-md-4">
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSubmitting} className="order-1 order-sm-2 px-3 px-md-4">
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        <span className="d-none d-sm-inline">En cours...</span>
                        <span className="d-sm-none">...</span>
                      </>
                    ) : (
                      <>
                        <span className="d-none d-sm-inline">{editingUser ? 'Mettre à jour' : 'Créer'}</span>
                        <span className="d-sm-none">{editingUser ? 'Modifier' : 'Créer'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Container>
  );
};

export default ManageAccounts;
