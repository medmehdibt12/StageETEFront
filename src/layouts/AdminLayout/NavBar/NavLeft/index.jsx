/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { ListGroup, Dropdown, Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaBroadcastTower, FaUsers, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { sendManagerBroadcast, sendChefPupitreMessage } from '../../../../services/message.service';
import { useAuth } from '../../../../contexts/AuthContext';
import useWindowSize from '../../../../hooks/useWindowSize';

const NavLeft = () => {
  const windowSize = useWindowSize();
  const { user } = useAuth();

  // Modal states
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    messageContent: ''
  });
  const [errors, setErrors] = useState({});

  // Always show nav-item
  let navItemClass = ['nav-item'];

  // Check user permissions
  const canSendBroadcast = user?.role === 'manager';
  const canSendPupitreMessage = user?.role === 'choriste' && user?.isChefDePupitre;
  const showMessaging = canSendBroadcast || canSendPupitreMessage;

  const handleOpenModal = (type) => {
    setMessageType(type);
    setFormData({ messageContent: '' });
    setErrors({});
    setShowMessageModal(true);
  };

  const handleCloseModal = () => {
    setShowMessageModal(false);
    setMessageType('');
    setFormData({ messageContent: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.messageContent.trim()) {
      newErrors.messageContent = 'Le message est requis';
    } else if (formData.messageContent.length < 10) {
      newErrors.messageContent = 'Le message doit contenir au moins 10 caractères';
    } else if (formData.messageContent.length > 1000) {
      newErrors.messageContent = 'Le message ne peut pas dépasser 1000 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      let result;
      if (messageType === 'manager') {
        result = await sendManagerBroadcast(formData);
      } else {
        result = await sendChefPupitreMessage(formData);
      }

      Swal.fire({
        icon: 'success',
        title: 'Message envoyé !',
        text: result.message,
        timer: 4000
      });

      handleCloseModal();
    } catch (error) {
      Swal.fire({
        icon: 'warning',
        title: 'Action Interdite',
        text: error.response?.data?.message || "Erreur lors de l'envoi du message."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const styles = {
    menu: {
      width: '180px',
      borderRadius: '8px',
      padding: '8px',
      fontSize: '0.875rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    },
    link: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      borderRadius: '6px',
      textDecoration: 'none',
      color: '#495057',
      backgroundColor: 'transparent',
      marginBottom: '2px',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left'
    }
  };

  return (
    <React.Fragment>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav mr-auto">
        <ListGroup.Item as="li" bsPrefix=" " className={navItemClass.join(' ')}>
          {showMessaging ? (
            <Dropdown align="start">
              <Dropdown.Toggle as={Link} variant="link" to="#">
                <i className="feather icon-mail" />
              </Dropdown.Toggle>

              <Dropdown.Menu align="start" style={styles.menu}>
                {canSendBroadcast && (
                  <button
                    onClick={() => handleOpenModal('manager')}
                    style={styles.link}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                  >
                    <FaBroadcastTower className="me-2" style={{ color: '#dc3545' }} />
                    Envoyer Message
                  </button>
                )}

                {canSendPupitreMessage && (
                  <button
                    onClick={() => handleOpenModal('chef')}
                    style={styles.link}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                  >
                    <FaUsers className="me-2" style={{ color: '#28a745' }} />
                    Envoyer Message
                  </button>
                )}
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <div style={{ visibility: 'hidden' }}>
              <i className="feather icon-mail" />
            </div>
          )}
        </ListGroup.Item>
      </ListGroup>

      {/* Message Modal */}
      <Modal show={showMessageModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {messageType === 'manager' ? (
              <>
                <FaBroadcastTower className="me-2" style={{ color: '#dc3545' }} />
                Message Général
              </>
            ) : (
              <>
                <FaUsers className="me-2" style={{ color: '#28a745' }} />
                Message Pupitre
              </>
            )}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="mb-4">
              <FaExclamationTriangle className="me-2" />
              <strong>
                {messageType === 'manager'
                  ? 'Tous les choristes actifs recevront ce message par email.'
                  : `Tous les membres du pupitre ${user?.pupitre} recevront ce message par email.`}
              </strong>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="messageContent"
                value={formData.messageContent}
                onChange={handleInputChange}
                placeholder="Rédigez votre message ici..."
                isInvalid={!!errors.messageContent}
              />
              <Form.Control.Feedback type="invalid">{errors.messageContent}</Form.Control.Feedback>
              <Form.Text className="text-muted">{formData.messageContent.length}/1000 caractères</Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
              Annuler
            </Button>
            <Button variant={messageType === 'manager' ? 'danger' : 'success'} type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <FaPaperPlane className="me-2" />
                  Envoyer
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

export default NavLeft;
