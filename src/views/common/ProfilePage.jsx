/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Image, Button, Badge, Container } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import EditProfileModal from './EditProfileModal';
import { BACKEND_URL } from '../../utils/axiosInstance';
import { FiMail, FiPhone, FiUser, FiGlobe, FiCalendar, FiMusic, FiMapPin, FiEdit3 } from 'react-icons/fi';
import avatar1 from '../../assets/images/user/avatar-1.jpg'; // ✅ Femme default
import avatar2 from '../../assets/images/user/avatar-2.jpg'; // ✅ Homme default

const iconColor = { color: '#1e3a5f' };

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const isChoriste = user?.role === 'choriste';
  const isManager = user?.role === 'manager';

  // ✅ GENDER-BASED AVATAR LOGIC
  const getDefaultAvatar = () => {
    if (user?.gender === 'Homme') return avatar2;
    if (user?.gender === 'Femme') return avatar1;
    return avatar1; // Default fallback for undefined gender
  };

  const avatarUrl = user?.avatar ? `${BACKEND_URL}${user.avatar}` : getDefaultAvatar();

  useEffect(() => {
    refreshUser();
  }, []);

  const InfoRow = ({ icon, label, value }) => (
    <Row className="mb-4 align-items-center">
      <Col md={4} className="d-flex align-items-center">
        <div
          className="icon-wrapper me-3 d-flex align-items-center justify-content-center"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            border: '1px solid rgba(30, 58, 95, 0.1)'
          }}
        >
          {React.cloneElement(icon, { style: { ...iconColor, fontSize: '18px' } })}
        </div>
        <span className="fw-semibold text-secondary" style={{ fontSize: '15px' }}>
          {label}
        </span>
      </Col>
      <Col md={8}>
        <span className="text-dark fw-medium" style={{ fontSize: '15px' }}>
          {value || '—'}
        </span>
      </Col>
    </Row>
  );

  return (
    <>
      <div
        className="min-vh-100 d-flex align-items-center py-5"
        style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
        }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col xl={8} lg={10}>
              <Card
                className="shadow-lg border-0 overflow-hidden"
                style={{
                  borderRadius: '24px',
                  background: '#ffffff',
                  boxShadow: '0 20px 60px rgba(30, 58, 95, 0.1)'
                }}
              >
                {/* Header Section */}
                <div
                  className="position-relative text-white text-center"
                  style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #23395d 50%, #2a4a6b 100%)',
                    padding: '3rem 2rem 2rem'
                  }}
                >
                  {/* Decorative Elements */}
                  <div
                    className="position-absolute"
                    style={{
                      top: '-50px',
                      right: '-50px',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)'
                    }}
                  />
                  <div
                    className="position-absolute"
                    style={{
                      bottom: '-30px',
                      left: '-30px',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                  />

                  {/* Avatar */}
                  <div className="position-relative d-inline-block mb-4">
                    <Image
                      src={avatarUrl}
                      roundedCircle
                      style={{
                        width: '140px',
                        height: '140px',
                        objectFit: 'cover',
                        border: '6px solid rgba(255,255,255,0.9)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        transition: 'transform 0.3s ease'
                      }}
                      className="profile-avatar"
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    />
                    <div
                      className="position-absolute bottom-0 end-0 bg-success rounded-circle"
                      style={{
                        width: '24px',
                        height: '24px',
                        border: '3px solid white'
                      }}
                    />
                  </div>

                  {/* User Info */}
                  <h2 className="mb-2 fw-bold text-white" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <Badge
                    className="px-4 py-2 text-uppercase fw-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      fontSize: '13px',
                      borderRadius: '20px',
                      letterSpacing: '0.5px',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {user?.role}
                  </Badge>
                </div>

                {/* Content Section */}
                <Card.Body className="p-5">
                  <div className="mb-5">
                    <h5 className="fw-bold mb-4" style={{ color: '#1e3a5f', fontSize: '1.3rem' }}>
                      Informations Personnelles
                    </h5>

                    <InfoRow icon={<FiMail />} label="Email" value={user?.email} />

                    {(isManager || isChoriste) && <InfoRow icon={<FiPhone />} label="Téléphone" value={user?.phone} />}

                    {isChoriste && (
                      <>
                        <InfoRow icon={<FiUser />} label="Genre" value={user?.gender} />
                        <InfoRow icon={<FiGlobe />} label="Nationalité" value={user?.nationality} />
                        <InfoRow
                          icon={<FiCalendar />}
                          label="Date de naissance"
                          value={user?.birthDate ? new Date(user.birthDate).toLocaleDateString('fr-FR') : null}
                        />
                        <InfoRow icon={<FiMusic />} label="Pupitre" value={user?.pupitre} />
                        <InfoRow icon={<FiMapPin />} label="Statut" value={user?.status} />
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="text-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setShowModal(true)}
                      className="px-5 py-3 fw-semibold d-inline-flex align-items-center gap-2 profile-edit-btn"
                      style={{
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #23395d 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '16px',
                        letterSpacing: '0.3px',
                        boxShadow: '0 8px 25px rgba(30, 58, 95, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 12px 35px rgba(30, 58, 95, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 8px 25px rgba(30, 58, 95, 0.3)';
                      }}
                    >
                      <FiEdit3 size={18} />
                      Modifier le profil
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

        <EditProfileModal show={showModal} onHide={() => setShowModal(false)} />
      </div>

      {/* ✅ REGULAR CSS STYLES */}
      <style>{`
        .profile-avatar {
          cursor: pointer;
        }
        
        .profile-edit-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 35px rgba(30, 58, 95, 0.4) !important;
        }

        .icon-wrapper {
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .profile-avatar {
            width: 120px !important;
            height: 120px !important;
          }
          
          .profile-edit-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default ProfilePage;
