import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Mail, ArrowLeft, CheckCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import { sendConfirmationEmail } from '../../../services/auth.service';

const PageContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f6f9fc 0%, #ecf0f5 100%);
  padding: 2rem;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 3rem 2rem;
  width: 100%;
  max-width: 550px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
  text-align: center;
`;

const IconWrapper = styled(motion.div)`
  width: 80px;
  height: 80px;
  background: #ebf8ff;
  color: #3498db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  position: relative;
`;

const MiniCheck = styled(motion.div)`
  position: absolute;
  bottom: 0;
  right: 0;
  background: #2ecc71;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
`;

const Title = styled.h2`
  color: #2d3748;
  font-weight: 700;
  margin-bottom: 1rem;
  font-size: 1.75rem;
`;

const Message = styled.div`
  color: #718096;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;

  strong {
    color: #2d3748;
    word-break: break-all;
  }
`;

const ActionButton = styled(motion.button)`
  background: #3498db;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);

  &:hover {
    background: #2980b9;
  }
`;

const SecondaryLink = styled.button`
  background: none;
  border: none;
  color: #718096;
  font-size: 0.95rem;
  margin-top: 1.5rem;
  text-decoration: underline;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;

  &:hover:not(:disabled) {
    color: #2d3748;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    text-decoration: none;
  }
`;

const StatusMessage = styled(motion.div)`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  ${(props) =>
    props.variant === 'success'
      ? 'background: #f0fff4; color: #276749; border: 1px solid #c6f6d5;'
      : 'background: #fff5f5; color: #9b2c2c; border: 1px solid #fed7d7;'}
`;

const EmailSentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const [error, setError] = React.useState(null);

  const email = location.state?.email || 'votre adresse email';

  const handleResend = async () => {
    if (!location.state?.email) {
      setError("Email manquant. Veuillez retourner au début.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendConfirmationEmail(location.state.email);
      setResendSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer fluid>
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <IconWrapper
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        >
          <Mail size={40} />
          <MiniCheck
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <CheckCircle size={16} fill="currentColor" />
          </MiniCheck>
        </IconWrapper>

        <Title>Email de vérification envoyé</Title>
        <Message>
          Nous avons envoyé un lien de confirmation à l'adresse suivante :<br />
          <strong>{email}</strong>
          <br /><br />
          Veuillez cliquer sur ce lien pour finaliser la vérification et accéder au formulaire de candidature.
        </Message>

        <ActionButton
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/candidature/formulaire')}
        >
          <ArrowLeft size={18} />
          Retour
        </ActionButton>

        <SecondaryLink 
          onClick={handleResend} 
          disabled={loading || resendSuccess}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" />
              Envoi en cours...
            </>
          ) : resendSuccess ? (
            'Email renvoyé !'
          ) : (
            <>
              <RefreshCcw size={16} />
              Renvoyer l'email de confirmation
            </>
          )}
        </SecondaryLink>

        <AnimatePresence>
          {(resendSuccess || error) && (
            <StatusMessage
              variant={resendSuccess ? 'success' : 'error'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {resendSuccess ? (
                <>
                  <CheckCircle size={16} />
                  Un nouvel email a été envoyé.
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  {error}
                </>
              )}
            </StatusMessage>
          )}
        </AnimatePresence>
      </Card>
    </PageContainer>
  );
};

export default EmailSentSuccess;
