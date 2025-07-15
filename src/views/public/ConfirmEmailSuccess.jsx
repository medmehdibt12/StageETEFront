import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { confirmEmailToken } from '../../services/auth.service';

const PageContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f6f9fc 0%, #ecf0f5 100%);
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const LoadingSpinner = styled(motion.div)`
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
`;

const StatusIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  background: ${(props) => (props.variant === 'success' ? '#10B981' : '#EF4444')};

  svg {
    width: 40px;
    height: 40px;
    color: white;
  }
`;

const Title = styled.h3`
  color: #1f2937;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.5rem;
`;

const Message = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const Button = styled(motion.button)`
  background: ${(props) => (props.variant === 'success' ? '#3B82F6' : '#6B7280')};
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    background: ${(props) => (props.variant === 'success' ? '#2563EB' : '#4B5563')};
  }
`;

const ProgressBar = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: #3b82f6;
`;

const ConfirmEmailSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Lien invalide ou manquant.');
      return;
    }

    const confirmEmail = async () => {
      try {
        const response = await confirmEmailToken(token);
        setStatus('success');
        setMessage(response || 'Email confirmé avec succès !');
      } catch (err) {
        console.error('Erreur de confirmation:', err);
        setStatus('error');
        setMessage('Erreur lors de la confirmation du mail. Le lien est peut-être expiré.');
      }
    };

    confirmEmail();
  }, [searchParams]);

  const renderIcon = () => {
    if (status === 'success') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  };

  return (
    <PageContainer fluid>
      <AnimatePresence mode="wait">
        <Card initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
          {status === 'loading' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingSpinner animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              <Title>Confirmation en cours</Title>
              <Message>Veuillez patienter pendant la vérification de votre email...</Message>
              <ProgressBar initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} />
            </motion.div>
          )}

          {(status === 'success' || status === 'error') && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <StatusIcon
                variant={status}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {renderIcon()}
              </StatusIcon>
              <Title>{status === 'success' ? 'Confirmation réussie' : 'Erreur de confirmation'}</Title>
              <Message>{message}</Message>
              <Button
                variant={status}
                onClick={() => navigate('/candidature/formulaire')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {status === 'success' ? 'Continuer vers le formulaire' : 'Retour au formulaire'}
              </Button>
            </motion.div>
          )}
        </Card>
      </AnimatePresence>
    </PageContainer>
  );
};

export default ConfirmEmailSuccess;
