/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Row, Col, Image } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { updateCurrentUser } from '../../services/auth.service';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { BACKEND_URL } from '../../utils/axiosInstance';

const genderOptions = [
  { value: 'Homme', label: 'Homme' },
  { value: 'Femme', label: 'Femme' },
];

const pupitreOptions = [
  { value: 'soprano', label: 'Soprano' },
  { value: 'alto', label: 'Alto' },
  { value: 'ténor', label: 'Ténor' },
  { value: 'basse', label: 'Basse' },
];

const EditProfileModal = ({ show, onHide }) => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({});
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        gender: user.gender || '',
        nationality: user.nationality || '',
        birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
        pupitre: user.pupitre || '',
      });

      if (user.avatar) {
        setPreview(
          user.avatar.startsWith('/uploads')
            ? `${BACKEND_URL}${user.avatar}`
            : `${BACKEND_URL}/uploads/avatars/${user.avatar}`
        );
      } else {
        setPreview(null);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field, selected) => {
    setForm((prev) => ({ ...prev, [field]: selected?.value || '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, avatar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCurrentUser(form);
      await refreshUser();
      Swal.fire('Succès', 'Profil mis à jour avec succès.', 'success');
      onHide();
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Échec de la mise à jour.', 'error');
    }
  };

  const isManagerOrChoriste = user?.role === 'manager' || user?.role === 'choriste';

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier le Profil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12} className="text-center mb-3">
              <Image
                src={preview || '/default-avatar.jpg'}
                alt="Avatar"
                roundedCircle
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  border: '2px solid #ccc',
                }}
              />
              <Form.Group controlId="avatarUpload" className="mt-2">
                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            {isManagerOrChoriste && (
              <Col md={12} className="mt-2">
                <Form.Group>
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            )}

            {user?.role === 'choriste' && (
              <>
                <Col md={6} className="mt-2">
                  <Form.Group>
                    <Form.Label>Genre</Form.Label>
                    <Select
                      options={genderOptions}
                      value={genderOptions.find(o => o.value === form.gender)}
                      onChange={(opt) => handleSelectChange('gender', opt)}
                      placeholder="Sélectionner"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group>
                    <Form.Label>Nationalité</Form.Label>
                    <Form.Control
                      type="text"
                      name="nationality"
                      value={form.nationality}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group>
                    <Form.Label>Date de naissance</Form.Label>
                    <Form.Control
                      type="date"
                      name="birthDate"
                      value={form.birthDate}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mt-2">
                  <Form.Group>
                    <Form.Label>Pupitre</Form.Label>
                    <Select
                      options={pupitreOptions}
                      value={pupitreOptions.find(o => o.value === form.pupitre)}
                      onChange={(opt) => handleSelectChange('pupitre', opt)}
                      placeholder="Sélectionner"
                    />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button variant="primary" type="submit">
            Enregistrer
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

EditProfileModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
};

export default EditProfileModal;
