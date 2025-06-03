import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Image, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import EditProfileModal from './EditProfileModal';
import { BACKEND_URL } from '../../utils/axiosInstance';
import {
  FiMail,
  FiPhone,
  FiUser,
  FiGlobe,
  FiCalendar,
  FiMusic,
  FiMapPin
} from 'react-icons/fi';

const iconColor = { color: '#1e3a5f' };

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isChoriste = user?.role === 'choriste';
  const isManager = user?.role === 'manager';
  const avatarUrl = user?.avatar ? `${BACKEND_URL}${user.avatar}` : '/default-avatar.jpg';

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <div className="d-flex justify-content-center align-items-start pt-5 pb-4 px-3">
      <Card className="shadow border-0 w-100" style={{ maxWidth: '700px', borderRadius: '20px' }}>
        <div
          className="text-white text-center py-4"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f, #23395d)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px'
          }}
        >
          <Image
            src={avatarUrl}
            roundedCircle
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              border: '4px solid white',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
          />
          <h4 className="mt-3 mb-0 fw-semibold text-capitalize text-light">
            {user?.firstName} {user?.lastName}
          </h4>
          <Badge bg="light" text="dark" className="text-uppercase mt-2">
            {user?.role}
          </Badge>
        </div>

        <Card.Body className="px-4 py-4">
          <Row className="mb-3">
            <Col md={4} className="fw-semibold d-flex align-items-center gap-2 text-secondary">
              <FiMail style={iconColor} /> <span>Email:</span>
            </Col>
            <Col className="text-dark">{user?.email}</Col>
          </Row>

          {(isManager || isChoriste) && (
            <Row className="mb-3">
              <Col md={4} className="fw-semibold d-flex align-items-center gap-2 text-secondary">
                <FiPhone style={iconColor} /> <span>Téléphone:</span>
              </Col>
              <Col className="text-dark">{user?.phone || '—'}</Col>
            </Row>
          )}

          {isChoriste && (
            <>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold d-flex align-items-center gap-2 text-secondary">
                  <FiUser style={iconColor} /> <span>Genre:</span>
                </Col>
                <Col className="text-dark">{user?.gender || '—'}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold d-flex align-items-center gap-2 text-secondary">
                  <FiGlobe style={iconColor} /> <span>Nationalité:</span>
                </Col>
                <Col className="text-dark">{user?.nationality || '—'}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold d-flex align-items-center gap-2 text-secondary">
                  <FiCalendar style={iconColor} /> <span>Date de naissance:</span>
                </Col>
                <Col className="text-dark">
                  {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : '—'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold d-flex align-items-center gap-2 text-secondary">
                  <FiMusic style={iconColor} /> <span>Pupitre:</span>
                </Col>
                <Col className="text-dark">{user?.pupitre || '—'}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-semibold d-flex align-items-center gap-2 text-secondary">
                  <FiMapPin style={iconColor} /> <span>Statut:</span>
                </Col>
                <Col className="text-dark">{user?.status || '—'}</Col>
              </Row>
            </>
          )}

          <div className="text-end mt-3">
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              style={{
                background: 'linear-gradient(135deg, #1e3a5f, #23395d)',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '500',
                padding: '10px 20px'
              }}
            >
              ✏️ Modifier le profil
            </Button>
          </div>
        </Card.Body>
      </Card>

      <EditProfileModal show={showModal} onHide={() => setShowModal(false)} />
    </div>
  );
};

export default ProfilePage;
