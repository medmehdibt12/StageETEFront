import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Spinner, Table, Row, Col, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
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

  // ✅ SIMPLIFIED ROLE OPTIONS (No Choriste)
  const roleOptions = [
    { value: 'manager', label: 'Manager de choeur' },
    { value: 'chef de choeur', label: 'Chef de choeur' }
  ];

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
      await deleteUserPermanent(id);
      fetchUsers();
      Swal.fire('Supprimé !', 'Le compte a été supprimé définitivement.', 'success');
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
      await lockUser(id);
      fetchUsers();
      Swal.fire('Verrouillé !', 'Le compte a été verrouillé.', 'success');
    }
  };

  const handleRestore = async (id) => {
    await restoreUser(id);
    fetchUsers();
    Swal.fire('Rétabli !', 'Le compte a été rétabli.', 'success');
  };

  // ✅ SIMPLIFIED FORM SUBMISSION (No Choriste Logic)
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Check for duplicate email
      if (editingUser) {
        const collision = users.find((u) => {
          return u.email === values.email && u._id !== editingUser._id;
        });
        if (collision) {
          Swal.fire('Erreur', 'Un utilisateur avec cet email existe déjà.', 'error');
          setSubmitting(false);
          return;
        }
      } else {
        const collision = users.find((u) => u.email === values.email);
        if (collision) {
          Swal.fire('Erreur', 'Un utilisateur avec cet email existe déjà.', 'error');
          setSubmitting(false);
          return;
        }
      }

      const currentUserId = localStorage.getItem('userId');

      if (editingUser) {
        // Update existing user
        const emailChanged = editingUser.email !== values.email;

        if (emailChanged) {
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

        if (emailChanged) {
          Swal.close();
        }

        Swal.fire(
          'Succès',
          emailChanged
            ? "L'utilisateur a été modifié avec succès. Les identifiants ont été renvoyés à la nouvelle adresse email."
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
        Swal.fire('Succès', "L'utilisateur a été créé avec succès. Les identifiants ont été envoyés par email.", 'success');
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
    <div className="p-4">
      <div className="mb-3">
        <div className="d-flex gap-4">
          <button className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-link text-primary'}`} onClick={() => setTab('active')}>
            Comptes Actifs
          </button>
          <button className={`btn ${tab === 'locked' ? 'btn-primary' : 'btn-link text-primary'}`} onClick={() => setTab('locked')}>
            Comptes Verrouillés
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <InputGroup style={{ maxWidth: '300px' }}>
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
          >
            + Ajouter un compte
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table bordered hover>
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
                    <td>{user.phone || '-'}</td>
                    <td>{user.role}</td>
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

          {/* ✅ PROFESSIONAL PAGINATION */}
          {getTotalPages() >= 0 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
              <div className="d-flex align-items-center">
                <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                  Comptes par page:
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
                  className="me-3"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                >
                  <FaChevronLeft />
                </Button>
                <span className="mx-3 text-muted" style={{ fontSize: '14px' }}>
                  Page {currentPage + 1} sur {getTotalPages()}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={isLastPage()}
                  className="ms-3 me-1"
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

      {/* ✅ SIMPLIFIED MODAL (No Choriste Fields) */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}</Modal.Title>
        </Modal.Header>

        <Formik
          initialValues={{
            firstName: editingUser?.firstName || '',
            lastName: editingUser?.lastName || '',
            email: editingUser?.email || '',
            phone: editingUser?.phone || '',
            role: editingUser?.role || ''
          }}
          validationSchema={Yup.object().shape({
            firstName: Yup.string().required('Le prénom est requis'),
            lastName: Yup.string().required('Le nom est requis'),
            email: Yup.string().email('Email invalide').required('Email requis'),
            phone: Yup.string().required('Téléphone requis'),
            role: Yup.string().required('Rôle requis')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, handleSubmit, isSubmitting, touched, errors, dirty, isValid, setFieldValue }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Modal.Body>
                <Row className="mb-2">
                  <Col>
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
                  <Col>
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

                <Form.Group className="mb-2">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    name="phone"
                    type="number"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.phone && !!errors.phone}
                  />
                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Rôle</Form.Label>
                  <Select
                    options={roleOptions}
                    name="role"
                    value={roleOptions.find((o) => o.value === values.role)}
                    onChange={(o) => setFieldValue('role', o.value)}
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
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting || !isValid || (editingUser && !dirty)}>
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
};

export default ManageAccounts;
