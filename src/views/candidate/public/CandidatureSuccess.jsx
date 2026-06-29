import React from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { CheckCircle } from 'lucide-react';

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
  padding: 4rem 2rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
  text-align: center;
  position: relative;
  overflow: hidden;
`;

const SuccessBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  background: linear-gradient(90deg, #2ecc71, #27ae60);
`;

const IconCircle = styled(motion.div)`
  width: 100px;
  height: 100px;
  background: #f0fff4;
  color: #2ecc71;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2.5rem;
  border: 2px solid #c6f6d5;
`;

const Title = styled.h1`
  color: #2d3748;
  font-weight: 800;
  font-size: 2.25rem;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
`;

const Message = styled.p`
  color: #4a5568;
  font-size: 1.2rem;
  line-height: 1.7;
  margin: 0 auto;
  max-width: 90%;
`;

const CandidatureSuccess = () => {
  return (
    <PageContainer fluid>
      <Card
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <SuccessBg />
        
        <IconCircle
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <CheckCircle size={56} strokeWidth={2.5} />
        </IconCircle>

        <Title>Félicitations !</Title>
        <Message>
          Votre candidature a été soumise avec succès.
        </Message>
      </Card>
    </PageContainer>
  );
};

export default CandidatureSuccess;
