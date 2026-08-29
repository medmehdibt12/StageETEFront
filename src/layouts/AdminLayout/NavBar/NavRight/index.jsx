/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { ListGroup, Dropdown, Form, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCopy, FiCheck } from 'react-icons/fi';
import ChatList from './ChatList';
import CandidatureNotificationBell from './CandidatureNotificationBell';
import ChoristeActivityNotificationBell from './ChoristeActivityNotificationBell';
import avatar1 from '../../../../assets/images/user/avatar-1.jpg';
import avatar2 from '../../../../assets/images/user/avatar-2.jpg';
import { logout } from '../../../../services/auth.service';
import { useAuth } from '../../../../contexts/AuthContext';
import { BACKEND_URL } from '../../../../utils/axiosInstance';
import { getConfig, updateSignupActive } from '../../../../services/config.service';

const NavRight = () => {
  const [listOpen, setListOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { user, setUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isSignupActive, setIsSignupActive] = useState(false);

  const FORM_LINK = `${window.location.origin}/candidature/formulaire`;

  const getDefaultAvatar = () => {
    if (user?.gender === 'Homme') return avatar2;
    if (user?.gender === 'Femme') return avatar1;
    return avatar1;
  };

  const avatarUrl = user?.avatar ? `${BACKEND_URL}${user.avatar}` : getDefaultAvatar();

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
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    document.title = 'Bienvenue | CSO Plateforme';
    navigate('/auth/signin');
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(FORM_LINK);
        showCopySuccess();
        return;
      }
      throw new Error('Using fallback method');
    } catch (err) {
      copyToClipboardFallback();
    }
  };

  const copyToClipboardFallback = () => {
    const textArea = document.createElement('textarea');
    textArea.value = FORM_LINK;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);

    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        showCopySuccess();
      } else {
        showCopyError();
      }
    } catch (err) {
      document.body.removeChild(textArea);
      console.error('Copy failed:', err);
      showCopyError();
    }
  };

  const showCopySuccess = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const showCopyError = () => {
    toast.error('Impossible de copier automatiquement', {
      position: 'top-right',
      autoClose: 4000
    });
    setTimeout(() => {
      prompt('Copiez ce lien manuellement (Ctrl+C):', FORM_LINK);
    }, 100);
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
      marginTop: '3px',
      transition: 'color 0.2s'
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
    },
    copyIcon: {
      cursor: 'pointer',
      color: isCopied ? '#28a745' : '#495057',
      transition: 'all 0.3s ease',
      transform: isCopied ? 'scale(1.15)' : 'scale(1)'
    }
  };

  return (
    <>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto">
        {['manager', 'admin', 'chef de choeur'].includes(user?.role) && <CandidatureNotificationBell />}
        {user?.role === 'choriste' && <ChoristeActivityNotificationBell />}
        <ListGroup.Item as="li" bsPrefix=" ">
          <Dropdown align="end" className="drp-user">
            <Dropdown.Toggle as={Link} variant="link" to="#">
              <i className="feather icon-settings" />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" style={styles.menu}>
              <div style={styles.header}>
                <img src={avatarUrl} alt="avatar" style={styles.avatar} />
                <div style={styles.userInfo}>
                  <div style={styles.name}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <small className="text-muted text-capitalize">{user?.role || 'Utilisateur'}</small>
                </div>
                <i className="feather icon-log-out" title="Déconnexion" onClick={handleLogout} style={styles.logout} />
              </div>

              <Link to="/user/profile" style={styles.link}>
                <i className="feather icon-user me-2" style={{ color: '#1e3a5f' }} />
                Mon Profil
              </Link>

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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
                    <Badge bg={isSignupActive ? 'success' : 'secondary'} style={styles.badge}>
                      {isSignupActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    {isCopied ? (
                      <FiCheck size={16} style={styles.copyIcon} title="Copié !" />
                    ) : (
                      <FiCopy size={16} style={styles.copyIcon} onClick={handleCopyLink} title="Copier le lien du formulaire" />
                    )}
                  </div>
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
