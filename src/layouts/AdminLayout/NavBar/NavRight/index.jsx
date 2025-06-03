/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { ListGroup, Dropdown, Form, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import ChatList from './ChatList';
import avatar1 from '../../../../assets/images/user/avatar-1.jpg';
import { logout } from '../../../../services/auth.service';
import { useAuth } from '../../../../contexts/AuthContext';
import { BACKEND_URL } from '../../../../utils/axiosInstance';
import { getConfig, updateSignupActive } from '../../../../services/config.service';

const NavRight = () => {
  const [listOpen, setListOpen] = useState(false);
  const { user, setUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isSignupActive, setIsSignupActive] = useState(false);

  useEffect(() => {
    refreshUser();
    getConfig()
      .then((data) => setIsSignupActive(data.signupActive))
      .catch((err) => console.error('Failed to fetch config:', err));
  }, []);

  const handleToggleSignup = async () => {
    try {
      await updateSignupActive(!isSignupActive);
      setIsSignupActive((prev) => !prev);
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    document.title = 'Bienvenue | CSO Plateforme';
    navigate('/auth/signin');
  };

  const styles = {
    menu: {
      width: '220px',
      borderRadius: '10px',
      padding: '15px',
      fontSize: '0.78rem',
      boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px'
    },
    avatar: {
      borderRadius: '50%',
      width: '65px',
      height: '65px',
      objectFit: 'cover'
    },
    userInfo: {
      marginLeft: '10px',
      lineHeight: '1.2'
    },
    name: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#1e3a5f',
      marginBottom: '2px'
    },
    logout: {
      marginLeft: 'auto',
      cursor: 'pointer',
      color: '#dc3545',
      fontSize: '1rem',
      marginTop: '3px'
    },
    link: {
      display: 'flex',
      alignItems: 'center',
      padding: '6px 10px',
      borderRadius: '6px',
      textDecoration: 'none',
      color: '#212529',
      backgroundColor: '#f8f9fa',
      marginBottom: '6px',
      fontSize: '0.78rem',
      transition: 'all 0.2s ease-in-out'
    },
    toggleContainer: {
      backgroundColor: '#f1f3f5',
      padding: '8px 10px',
      borderRadius: '8px',
      fontSize: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '4px',
      marginTop: '8px'
    },
    toggleRow: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    badge: {
      fontSize: '0.68rem',
      padding: '4px 8px',
      borderRadius: '8px',
      fontWeight: 500
    }
  };

  return (
    <>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto">
        <ListGroup.Item as="li" bsPrefix=" ">
          <Dropdown align="end" className="drp-user">
            <Dropdown.Toggle as={Link} variant="link" to="#">
              <i className="feather icon-settings" />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" style={styles.menu}>
              {/* Header */}
              <div style={styles.header}>
                <img src={user?.avatar ? `${BACKEND_URL}${user.avatar}` : avatar1} alt="avatar" style={styles.avatar} />
                <div style={styles.userInfo}>
                  <div style={styles.name}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <small className="text-muted text-capitalize">{user?.role || 'Utilisateur'}</small>
                </div>
                <i className="feather icon-log-out" title="Déconnexion" onClick={handleLogout} style={styles.logout} />
              </div>

              {/* Profile Link */}
              <Link to="/user/profile" style={styles.link}>
                <i className="feather icon-user me-2" style={{ color: '#1e3a5f' }} />
                Mon Profil
              </Link>

              {/* Admin Toggle */}
              {user?.role === 'admin' && (
                <div style={styles.toggleContainer}>
                  <div style={styles.toggleRow}>
                    <span style={{ fontWeight: 500 }}>Recrutements</span>
                    <Form.Check
                      type="switch"
                      id="toggle-signup"
                      checked={isSignupActive}
                      onChange={handleToggleSignup}
                      style={{
                        transform: 'scale(1.1)',
                        marginBottom: 0
                      }}
                    />
                  </div>
                  <Badge bg={isSignupActive ? 'success' : 'secondary'} style={styles.badge}>
                    {isSignupActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </ListGroup.Item>
      </ListGroup>

      <ChatList listOpen={listOpen} closed={() => setListOpen(false)} />
    </>
  );
};

export default NavRight;
