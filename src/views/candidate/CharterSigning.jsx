/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import { getCharterForSigning, signCharter } from '../../services/accounts.service';

// 🎨 **STYLED COMPONENTS** (copied from ConvocationResponse)
const PageContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px;
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const HeaderDivider = styled(motion.div)`
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(102, 126, 234, 0.1) 10%,
    rgba(102, 126, 234, 0.3) 25%,
    rgba(102, 126, 234, 0.6) 45%,
    rgba(102, 126, 234, 0.8) 50%,
    rgba(102, 126, 234, 0.6) 55%,
    rgba(102, 126, 234, 0.3) 75%,
    rgba(102, 126, 234, 0.1) 90%,
    transparent 100%
  );
  margin: 2.5rem 0;
  position: relative;
  border-radius: 1px;
  box-shadow: 0 1px 3px rgba(102, 126, 234, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    border-radius: 2px;
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.9),
      0 0 8px rgba(102, 126, 234, 0.4),
      0 0 16px rgba(102, 126, 234, 0.2);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: translateX(-50%) rotate(45deg) scale(1);
    }
    50% {
      opacity: 0.8;
      transform: translateX(-50%) rotate(45deg) scale(1.1);
    }
  }
`;

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  padding: 3rem;
  width: 100%;
  max-width: 900px;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 2rem;
    margin: 10px;
    border-radius: 24px;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const LoadingSpinner = styled(motion.div)`
  width: 64px;
  height: 64px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  margin: 0 auto 2rem;
`;

const LoadingText = styled.h3`
  color: #4a5568;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
`;

const StatusIcon = styled(motion.div)`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  position: relative;
  background: ${(props) => {
    switch (props.variant) {
      case 'success':
        return 'linear-gradient(135deg, #10B981, #34D399)';
      case 'error':
        return 'linear-gradient(135deg, #EF4444, #F87171)';
      case 'warning':
        return 'linear-gradient(135deg, #F59E0B, #FBBF24)';
      case 'info':
        return 'linear-gradient(135deg, #3B82F6, #60A5FA)';
      case 'primary':
        return 'linear-gradient(135deg, #667eea, #764ba2)';
      default:
        return 'linear-gradient(135deg, #6B7280, #9CA3AF)';
    }
  }};
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.15),
    0 0 0 8px rgba(255, 255, 255, 0.1);

  svg {
    width: 48px;
    height: 48px;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
`;

const Title = styled(motion.h1)`
  color: #1a202c;
  margin-bottom: 0.75rem;
  font-weight: 700;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled(motion.p)`
  color: #4a5568;
  font-size: 1.125rem;
  margin: 0;
  font-weight: 500;
  opacity: 0.8;
`;

const AlertBox = styled(motion.div)`
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 500;
  position: relative;
  overflow: hidden;

  ${(props) =>
    props.variant === 'success' &&
    `
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    color: #065f46;
    border: 1px solid #a7f3d0;
  `}

  ${(props) =>
    props.variant === 'error' &&
    `
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    color: #991b1b;
    border: 1px solid #fca5a5;
  `}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    background: ${(props) => (props.variant === 'success' ? '#10b981' : '#ef4444')};
  }

  svg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
`;

const ContentSection = styled(motion.div)`
  margin-bottom: 2rem;
`;

const InfoCard = styled(motion.div)`
  background: ${(props) => props.bgColor || 'rgba(248, 250, 252, 0.8)'};
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 20px;
  margin-bottom: 1.5rem;
  border: ${(props) => props.border || '1px solid rgba(226, 232, 240, 0.8)'};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    background: ${(props) => props.accent || 'linear-gradient(180deg, #667eea, #764ba2)'};
    border-radius: 0 2px 2px 0;
  }
`;

const SectionTitle = styled.h3`
  color: ${(props) => props.color || '#1a202c'};
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.bgColor || 'rgba(102, 126, 234, 0.1)'};

  svg {
    width: 18px;
    height: 18px;
    color: ${(props) => props.color || '#667eea'};
  }
`;

const DetailGrid = styled.div`
  display: grid;
  gap: 1.25rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(226, 232, 240, 0.5);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const DetailLabel = styled.div`
  font-weight: 600;
  color: ${(props) => props.color || '#4a5568'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 140px;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const DetailValue = styled.div`
  color: #1a202c;
  font-weight: 500;
  text-align: right;
  flex: 1;

  @media (max-width: 768px) {
    text-align: left;
    margin-left: 22px;
  }
`;

const ButtonGroup = styled.div`
  display: grid;
  gap: 1rem;
  margin: 2.5rem 0;
`;

const ActionButton = styled(motion.button)`
  background: ${(props) => {
    switch (props.variant) {
      case 'success':
        return 'linear-gradient(135deg, #10B981, #059669)';
      case 'warning':
        return 'linear-gradient(135deg, #F59E0B, #D97706)';
      case 'danger':
        return 'linear-gradient(135deg, #EF4444, #DC2626)';
      case 'secondary':
        return 'linear-gradient(135deg, #6B7280, #4B5563)';
      case 'primary':
        return 'linear-gradient(135deg, #667eea, #764ba2)';
      default:
        return 'linear-gradient(135deg, #6B7280, #4B5563)';
    }
  }};
  color: white;
  border: none;
  padding: 1.25rem 2rem;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

const ButtonSpinner = styled(motion.div)`
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
`;

const CheckboxContainer = styled(motion.div)`
  padding: 2rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.06));
  border: 2px solid rgba(102, 126, 234, 0.25);
  border-radius: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  margin-bottom: 2rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.6;
  color: #374151;

  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    accent-color: #667eea;
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const SuccessDisplay = styled(motion.div)`
  text-align: center;
  padding: 3rem 0;
`;

const SuccessTitle = styled.h2`
  color: #10b981;
  margin-bottom: 1.5rem;
  font-size: 2.25rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
`;

const SuccessMessage = styled.p`
  color: #4a5568;
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const ProgressBar = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 0 0 32px 32px;
`;

// 🎨 **ICON COMPONENTS**
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="m22 13l-5-5l-5 5" />
    <path d="M17 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l5 5z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22 6 12 13 2 6" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22 6 12 13 2 6" />
  </svg>
);

const SignInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

// const HomeIcon = () => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
//     <polyline points="9 22 9 12 15 12 15 22" />
//   </svg>
// );

// 🎯 **MAIN COMPONENT**
const CharterSigning = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  // ✅ UPDATED: Simplified state management - removed hasReadCharter
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (token) {
      fetchCharter();
    } else {
      setError("Token manquant dans l'URL");
      setLoading(false);
    }
  }, [token]);

  const fetchCharter = async () => {
    try {
      const data = await getCharterForSigning(token);

      if (data.success) {
        setCandidate(data.candidate);
        document.title = `Charte - ${data.candidate.firstName} ${data.candidate.lastName} | CSO Plateforme`;
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError(error.message || 'Erreur lors du chargement de la charte.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Simplified validation - only check agreed
  const handleSignCharter = async () => {
    if (!agreed) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez confirmer votre engagement avant de signer.',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    setSubmitting(true);

    try {
      const data = await signCharter(token, true);

      if (data.success) {
        setSuccessData({
          candidateName: data.candidateName || `${candidate.firstName} ${candidate.lastName}`,
          email: candidate.email
        });
        document.title = 'Félicitations - Orchestre Symphonique de Carthage';
        setShowSuccess(true);

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Une erreur est survenue lors de la signature.',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Loading State
  if (loading) {
    return (
      <PageContainer fluid>
        <Card
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <LoadingContainer>
            <LoadingSpinner animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            <LoadingText>Chargement de la charte...</LoadingText>
            <ProgressBar initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} />
          </LoadingContainer>
        </Card>
      </PageContainer>
    );
  }

  // ✅ Error State
  if (error) {
    return (
      <PageContainer fluid>
        <Card
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Header>
            <StatusIcon
              variant="error"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            >
              <XIcon />
            </StatusIcon>
            <Title initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
              Erreur
            </Title>
            <Subtitle initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
              {error}
            </Subtitle>
          </Header>
          {/* 
          <ButtonGroup>
            <ActionButton
              variant="primary"
              onClick={() => (window.location.href = '/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <HomeIcon />
              Retour à l'accueil
            </ActionButton>
          </ButtonGroup> */}
        </Card>
      </PageContainer>
    );
  }

  // ✅ Success State
  if (showSuccess) {
    return (
      <PageContainer fluid>
        <Card
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <SuccessDisplay>
            <StatusIcon
              variant="success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            >
              <CheckIcon />
            </StatusIcon>
            <SuccessTitle>Félicitations !</SuccessTitle>
            <SuccessMessage>Bienvenue officiellement dans la famille de l'Orchestre Symphonique de Carthage !</SuccessMessage>

            {/* Status Cards */}
            <InfoCard
              bgColor="rgba(224, 242, 254, 0.8)"
              border="1px solid rgba(2, 132, 199, 0.3)"
              accent="linear-gradient(180deg, #0284c7, #0369a1)"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SectionTitle color="#0c4a6e">
                <IconWrapper bgColor="rgba(2, 132, 199, 0.1)" color="#0369a1">
                  <EnvelopeIcon />
                </IconWrapper>
                Vos identifiants envoyés
              </SectionTitle>
              <DetailGrid>
                <DetailRow>
                  <DetailLabel color="#0c4a6e">
                    <MailIcon />
                    Email
                  </DetailLabel>
                  <DetailValue>{successData?.email}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel color="#0c4a6e">
                    <CheckIcon />
                    Status
                  </DetailLabel>
                  <DetailValue>Choriste Junior activé</DetailValue>
                </DetailRow>
              </DetailGrid>
            </InfoCard>

            <InfoCard
              bgColor="rgba(254, 243, 199, 0.8)"
              border="1px solid rgba(245, 158, 11, 0.3)"
              accent="linear-gradient(180deg, #f59e0b, #d97706)"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <SectionTitle color="#92400e">
                <IconWrapper bgColor="rgba(245, 158, 11, 0.1)" color="#92400e">
                  <StarIcon />
                </IconWrapper>
                Prochaines étapes
              </SectionTitle>
              <div style={{ color: '#92400e', fontSize: '1rem', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>1.</strong> Vérifiez votre email
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>2.</strong> Connectez-vous à votre espace
                </div>
                <div>
                  <strong>3.</strong> Découvrez les répétitions à venir
                </div>
              </div>
            </InfoCard>

            <ButtonGroup>
              <ActionButton
                variant="success"
                onClick={() => navigate('/auth/signin')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <SignInIcon />
                Se connecter maintenant
              </ActionButton>
              {/* <ActionButton variant="secondary" onClick={() => navigate('/')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <HomeIcon />
                Retour à l'accueil
              </ActionButton> */}
            </ButtonGroup>
          </SuccessDisplay>
        </Card>
      </PageContainer>
    );
  }

  // ✅ Main Charter Signing Interface
  return (
    <PageContainer fluid>
      <Card
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header */}
        <Header>
          <StatusIcon
            variant="primary"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          >
            <FileIcon />
          </StatusIcon>
          <Title initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            Signature de la Charte
          </Title>
          <Subtitle initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            Orchestre Symphonique de Carthage
          </Subtitle>
        </Header>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <AlertBox
              variant="error"
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <XIcon />
              {error}
            </AlertBox>
          )}
        </AnimatePresence>

        {/* Header Divider */}
        <HeaderDivider initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.8, delay: 0.7 }} />

        <ContentSection initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          {/* Candidate Info */}
          {candidate && (
            <InfoCard
              bgColor="rgba(248, 250, 252, 0.8)"
              accent="linear-gradient(180deg, #667eea, #764ba2)"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SectionTitle>
                <IconWrapper bgColor="rgba(102, 126, 234, 0.1)" color="#667eea">
                  <UserIcon />
                </IconWrapper>
                Candidat sélectionné
              </SectionTitle>
              <DetailGrid>
                <DetailRow>
                  <DetailLabel>
                    <UserIcon />
                    Nom complet
                  </DetailLabel>
                  <DetailValue>
                    {candidate.firstName} {candidate.lastName}
                  </DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>
                    <MailIcon />
                    Adresse email
                  </DetailLabel>
                  <DetailValue>{candidate.email}</DetailValue>
                </DetailRow>
              </DetailGrid>
            </InfoCard>
          )}

          {/* ✅ UPDATED: Simplified Signature Section - no charter reading required */}
          <CheckboxContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <CheckboxLabel>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                <strong>Je m'engage à contribuer positivement à la vie de l'Orchestre Symphonique de Carthage.</strong>
              </span>
            </CheckboxLabel>
          </CheckboxContainer>

          {/* ✅ UPDATED: Fixed Action Button - only depends on agreed state */}
          <ButtonGroup>
            <ActionButton
              variant="success"
              onClick={handleSignCharter}
              disabled={!agreed || submitting}
              whileHover={!agreed || submitting ? {} : { scale: 1.02 }}
              whileTap={!agreed || submitting ? {} : { scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              {submitting ? (
                <ButtonSpinner animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              ) : (
                <CheckIcon />
              )}
              {submitting ? 'Signature en cours...' : 'Signer la charte'}
            </ActionButton>
          </ButtonGroup>
        </ContentSection>
      </Card>
    </PageContainer>
  );
};

export default CharterSigning;
