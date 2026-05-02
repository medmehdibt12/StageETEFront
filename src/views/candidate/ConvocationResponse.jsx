/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import {
  getConvocationResponse,
  confirmConvocation,
  declineConvocation,
  rescheduleConvocationDifferentDay,
  rescheduleConvocationSameDay,
  getAvailableTimes
} from '../../services/convocation.service';

// 🎨 **STYLED COMPONENTS** (keeping all existing styles)
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
  max-width: 700px;
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
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const DeclinedDisplay = styled(motion.div)`
  text-align: center;
  padding: 3rem 0;
`;

const DeclinedTitle = styled.h2`
  color: #ef4444;
  margin-bottom: 1.5rem;
  font-size: 2.25rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
`;

const DeclinedMessage = styled.p`
  color: #4a5568;
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1rem;
`;

const InfoListItem = styled.li`
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  color: #4a5568;
  line-height: 1.5;
  font-weight: 500;

  svg {
    width: 20px;
    height: 20px;
    color: #3b82f6;
    margin-right: 0.75rem;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }
`;

const ProgressBar = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 0 0 32px 32px;
`;

// 🎨 **PERFECT MODAL DESIGN**
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled(motion.div)`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(25px);
  border-radius: 28px;
  max-width: 650px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    0 40px 80px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent);
  }
`;

const ModalHeader = styled.div`
  padding: 2.5rem 2.5rem 0 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(226, 232, 240, 0.4);
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #1a202c;
  font-size: 1.6rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CloseButton = styled.button`
  background: rgba(107, 114, 128, 0.15);
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(107, 114, 128, 0.25);
    color: #1a202c;
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

const ModalBody = styled.div`
  padding: 0 2.5rem;
`;

const ModalText = styled.p`
  margin-bottom: 2rem;
  color: #4a5568;
  line-height: 1.7;
  font-size: 1.2rem;
  font-weight: 500;
`;

const ModalFooter = styled.div`
  padding: 2.5rem;
  display: flex;
  gap: 1.25rem;
  justify-content: flex-end;
  border-top: 2px solid rgba(226, 232, 240, 0.4);
  margin-top: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// 🎨 **PERFECT RADIO COMPONENTS**
const RadioGroup = styled.div`
  display: grid;
  gap: 1.5rem;
  margin: 2rem 0;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 2rem;
  border: 3px solid rgba(226, 232, 240, 0.6);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.02), rgba(118, 75, 162, 0.02));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: rgba(102, 126, 234, 0.4);
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-3px);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);

    &::before {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.08));
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.25);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }
  }

  input[type='radio'] {
    width: 24px;
    height: 24px;
    accent-color: #667eea;
    margin: 0;
    flex-shrink: 0;
    margin-top: 3px;
  }
`;

const RadioContent = styled.div`
  flex: 1;
`;

const RadioTitle = styled.div`
  font-weight: 700;
  color: #1a202c;
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  letter-spacing: -0.01em;

  svg {
    width: 20px;
    height: 20px;
    color: #667eea;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
`;

const RadioDescription = styled.p`
  margin: 0;
  color: #718096;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const ReasonContainer = styled(motion.div)`
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
`;

const ReasonLabel = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  color: #4a5568;
  font-weight: 600;
  font-size: 1rem;
`;

const ReasonInput = styled.textarea`
  width: 100%;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid rgba(226, 232, 240, 0.8);
  background: white;
  color: #1a202c;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

// 🎨 **PERFECT TIME SELECTOR COMPONENTS**
const TimeSelector = styled(motion.div)`
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.06));
  border: 2px solid rgba(102, 126, 234, 0.25);
  border-radius: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
`;

const TimeSelectorLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1.5rem;
  font-size: 1.15rem;

  svg {
    width: 20px;
    height: 20px;
    color: #667eea;
  }
`;

const SessionInfoBox = styled(motion.div)`
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.08));
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  font-size: 0.95rem;
  color: #374151;
  font-weight: 600;

  .session-time {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .pause-time {
    font-size: 0.9rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
`;

const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const TimeSlot = styled(motion.button)`
  padding: 1.25rem 1rem;
  border: 2px solid ${(props) => (props.selected ? '#667eea' : 'rgba(226, 232, 240, 0.6)')};
  border-radius: 16px;
  background: ${(props) => (props.selected ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.9)')};
  color: ${(props) => (props.selected ? 'white' : '#374151')};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(10px);
  font-size: 1.05rem;
  box-shadow: ${(props) => (props.selected ? '0 8px 24px rgba(102, 126, 234, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)')};
  text-align: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
    border-color: #667eea;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f9fafb;
    color: #9ca3af;
    transform: none !important;
  }

  .time-range {
    display: block;
    line-height: 1.3;
  }

  .end-time {
    font-size: 0.85rem;
    opacity: 0.8;
    margin-top: 0.25rem;
    font-weight: 500;
  }
`;

const LoadingTimeSlots = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  font-style: italic;
  font-size: 1.1rem;
`;

const StatisticsBox = styled(motion.div)`
  margin-top: 1.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.08));
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 1rem;
  color: #1e40af;
  font-weight: 600;
  text-align: center;
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

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// 🎯 **MAIN COMPONENT**
const ConvocationResponse = () => {
  const { candidateId } = useParams();
  const [convocationData, setConvocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Reschedule form state
  const [rescheduleType, setRescheduleType] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  // 🎯 Helper function to calculate end time for display
  const calculateEndTimeForDisplay = (startTime) => {
    try {
      const [hour, minute] = startTime.split(':').map(Number);
      const endHour = hour + 1;
      return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    } catch (error) {
      return startTime;
    }
  };

  // 🔄 **Helper function to refresh data**
  const refreshConvocationData = async () => {
    try {
      setLoading(true);
      const data = await getConvocationResponse(candidateId);
      setConvocationData(data);

      // Clear any previous messages
      setError('');
      setSuccess('');

      // Set appropriate success message based on status
      if (data.status !== 'pending_response' && data.status !== 'expired') {
        setSuccess(data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch convocation data on component mount
  useEffect(() => {
    const fetchConvocationData = async () => {
      try {
        setLoading(true);
        const data = await getConvocationResponse(candidateId);
        setConvocationData(data);

        // Handle different statuses
        if (['confirmed', 'declined', 'rescheduled_different_day', 'rescheduled_same_day', 'expired_moved_pending', 'expired'].includes(data.status)) {
          if (data.status !== 'expired') {
            setSuccess(data.message);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) {
      fetchConvocationData();
    }
  }, [candidateId]);

  // 🎯 ENHANCED: Fetch available times when same_day is selected
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (rescheduleType === 'same_day' && showRescheduleModal) {
        try {
          setLoadingTimes(true);
          const data = await getAvailableTimes(candidateId);

          setAvailableTimes(data.availableSlots || []);
          setSessionInfo(data.sessionInfo || null);
        } catch (err) {
          console.error('Error fetching available times:', err);
          setAvailableTimes([]);
          setSessionInfo(null);

          if (err.response?.data?.error === 'PARAMS_NOT_FOUND') {
            setError("Aucune session d'audition trouvée pour cette date.");
          } else {
            setError('Impossible de charger les créneaux disponibles.');
          }
        } finally {
          setLoadingTimes(false);
        }
      }
    };

    fetchAvailableTimes();
  }, [rescheduleType, showRescheduleModal, candidateId]);

  // 🎯 **Handle confirm action**
  const handleConfirm = async () => {
    try {
      setResponding(true);
      setError('');
      const result = await confirmConvocation(candidateId);
      setSuccess(result.message);
      setConvocationData((prev) => ({ ...prev, status: 'confirmed' }));
    } catch (err) {
      if (err.response?.data?.alreadyResponded) {
        await refreshConvocationData();
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la confirmation.');
      }
    } finally {
      setResponding(false);
    }
  };

  // 🎯 **Handle decline action**
  const handleDecline = async () => {
    const result = await Swal.fire({
      title: '⚠️ Confirmation requise',
      html: `
        <div style="text-align: left; padding: 1rem 0;">
          <p style="font-size: 1.1rem; color: #4a5568; margin-bottom: 1rem; line-height: 1.6;">
            Êtes-vous sûr de vouloir <strong style="color: #dc2626;">décliner</strong> cette convocation ?
          </p>
          <div style="background: #fee2e2; padding: 1rem; border-radius: 8px; border-left: 4px solid #ef4444;">
            <p style="color: #991b1b; margin: 0; font-weight: 600;">
              ⚠️ <strong>ATTENTION :</strong> Cette action est <strong>irréversible</strong>
            </p>
            <p style="color: #991b1b; margin: 0.5rem 0 0 0; font-size: 0.95rem;">
              Votre candidature sera définitivement supprimée de notre système.
            </p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, décliner',
      cancelButtonText: 'Annuler',
      reverseButtons: true,
      customClass: {
        container: 'custom-swal-container',
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        confirmButton: 'custom-swal-confirm',
        cancelButton: 'custom-swal-cancel'
      },
      buttonsStyling: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      focusConfirm: false,
      focusCancel: true
    });

    if (result.isConfirmed) {
      try {
        setResponding(true);
        setError('');
        const declineResult = await declineConvocation(candidateId);
        setSuccess(declineResult.message);
        setConvocationData((prev) => ({ ...prev, status: 'declined' }));
      } catch (err) {
        if (err.response?.data?.alreadyResponded) {
          await refreshConvocationData();
        } else {
          setError(err.response?.data?.message || 'Erreur lors du refus.');
          await Swal.fire({
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la suppression de votre candidature.',
            icon: 'error',
            customClass: { popup: 'custom-swal-popup' }
          });
        }
      } finally {
        setResponding(false);
      }
    }
  };

  // 🎯 **Handle reschedule action**
  const handleReschedule = async () => {
    if (convocationData && convocationData.isClosed) {
      setError("Cette session d'audition est clôturée. Vous ne pouvez plus effectuer de modifications.");
      return;
    }

    if (!rescheduleType) {
      setError('Veuillez sélectionner une option de reprogrammation.');
      return;
    }

    if (rescheduleType === 'same_day' && !selectedTime) {
      setError('Veuillez sélectionner un horaire.');
      return;
    }

    try {
      setResponding(true);
      setError('');
      let result;

      if (rescheduleType === 'different_day') {
        result = await rescheduleConvocationDifferentDay(candidateId, rescheduleReason);
        setConvocationData((prev) => ({ ...prev, status: 'rescheduled_different_day' }));
      } else {
        result = await rescheduleConvocationSameDay(candidateId, selectedTime, rescheduleReason);
        setConvocationData((prev) => ({
          ...prev,
          status: 'rescheduled_same_day',
          auditionSlot: result.newSlot
        }));
      }

      setSuccess(result.message);
      setShowRescheduleModal(false);
      setRescheduleType('');
      setSelectedTime('');
      setSessionInfo(null);
    } catch (err) {
      if (err.response?.data?.alreadyResponded) {
        setShowRescheduleModal(false);
        await refreshConvocationData();
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la demande de reprogrammation.');
      }
    } finally {
      setResponding(false);
    }
  };

  // Reset modal state when closing
  const handleCloseModal = () => {
    setShowRescheduleModal(false);
    setRescheduleType('');
    setSelectedTime('');
    setRescheduleReason('');
    setAvailableTimes([]);
    setSessionInfo(null);
    setError('');
  };

  // Format date and time
  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return 'Non défini';
    const date = new Date(dateStr);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return `${date.toLocaleDateString('fr-FR', options)} à ${timeStr || 'heure non définie'}`;
  };

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
            <LoadingText>Chargement en cours</LoadingText>
            <ProgressBar initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} />
          </LoadingContainer>
        </Card>
      </PageContainer>
    );
  }

  return (
    <>
      {/* Custom SweetAlert2 Styles */}
      <style>{`
        .custom-swal-container { backdrop-filter: blur(15px); }
        .custom-swal-popup {
          border-radius: 24px !important;
          padding: 2.5rem !important;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(25px) !important;
        }
        .custom-swal-title {
          font-size: 1.75rem !important;
          font-weight: 800 !important;
          color: #1a202c !important;
          margin-bottom: 1.5rem !important;
        }
        .custom-swal-confirm, .custom-swal-cancel {
          border: none !important;
          padding: 1rem 2.5rem !important;
          border-radius: 16px !important;
          font-weight: 700 !important;
          font-size: 1.1rem !important;
          margin: 0 0.75rem !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        }
        .custom-swal-confirm {
          background: linear-gradient(135deg, #EF4444, #DC2626) !important;
          color: white !important;
        }
        .custom-swal-cancel {
          background: linear-gradient(135deg, #6B7280, #4B5563) !important;
          color: white !important;
        }
        .custom-swal-confirm:hover, .custom-swal-cancel:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>

      <PageContainer fluid>
        <AnimatePresence mode="wait">
          <Card
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Header */}
            <Header>
              <StatusIcon
                variant="info"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              >
                <MusicIcon />
              </StatusIcon>
              <Title initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
                Convocation Audition
              </Title>
              <Subtitle initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
                Carthage Symphony Orchestra
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

            <HeaderDivider
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            />

            {/* 🛑 NEW: Closed Session Alert */}
            <AnimatePresence>
              {convocationData && convocationData.isClosed && (
                <AlertBox
                  variant="warning"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ marginBottom: '2rem' }}
                >
                  <ClockIcon />
                  <div>
                    <strong>Session d'audition clôturée</strong>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                      La date limite ({new Date(convocationData.closingDate).toLocaleDateString('fr-FR')}) est passée. 
                      Vous ne pouvez plus modifier votre choix.
                    </div>
                  </div>
                </AlertBox>
              )}
            </AnimatePresence>

            {/* Main Content - Pending Response */}
            {convocationData && convocationData.status === 'pending_response' && (
              <ContentSection initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                {/* Candidate Info */}
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
                    Informations candidat
                  </SectionTitle>
                  <DetailGrid>
                    <DetailRow>
                      <DetailLabel>
                        <UserIcon />
                        Nom complet
                      </DetailLabel>
                      <DetailValue>
                        {convocationData.candidate.firstName} {convocationData.candidate.lastName}
                      </DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>
                        <MailIcon />
                        Adresse email
                      </DetailLabel>
                      <DetailValue>{convocationData.candidate.email}</DetailValue>
                    </DetailRow>
                  </DetailGrid>
                </InfoCard>

                {/* Audition Details */}
                {convocationData.auditionSlot && (
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
                        <CalendarIcon />
                      </IconWrapper>
                      Détails de votre audition
                    </SectionTitle>
                    <DetailGrid>
                      <DetailRow>
                        <DetailLabel color="#92400e">
                          <CalendarIcon />
                          Date et heure
                        </DetailLabel>
                        <DetailValue>
                          {formatDateTime(
                            convocationData.auditionSlot.date,
                            `${convocationData.auditionSlot.startTime} - ${convocationData.auditionSlot.endTime}`
                          )}
                        </DetailValue>
                      </DetailRow>
                    </DetailGrid>
                  </InfoCard>
                )}

                {/* Action Buttons - HIDDEN IF CLOSED */}
                {!convocationData.isClosed && (
                  <ButtonGroup>
                    <ActionButton
                      variant="warning"
                      onClick={() => setShowRescheduleModal(true)}
                      disabled={responding}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                    >
                      <RefreshIcon />
                      Modifier l'horaire ou la date
                    </ActionButton>
                  </ButtonGroup>
                )}

                {/* 🔧 UPDATED: Important Notes (removed 48h deadline reference) */}
                <InfoCard
                  bgColor="rgba(224, 242, 254, 0.8)"
                  border="1px solid rgba(2, 132, 199, 0.3)"
                  accent="linear-gradient(180deg, #0284c7, #0369a1)"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <SectionTitle color="#0c4a6e">
                    <IconWrapper bgColor="rgba(2, 132, 199, 0.1)" color="#0c4a6e">
                      <InfoIcon />
                    </IconWrapper>
                    Informations importantes
                  </SectionTitle>
                  <InfoList>
                    <InfoListItem>
                      <ClockIcon />
                      Arrivez 15 minutes avant votre créneau
                    </InfoListItem>
                    <InfoListItem>
                      <InfoIcon />
                      Nous vous rappellerons de répondre si nécessaire
                    </InfoListItem>
                  </InfoList>
                </InfoCard>
              </ContentSection>
            )}

            {/* ✅ Success Status (for confirmed status) */}
            {convocationData && (convocationData.status === 'confirmed' || convocationData.status === 'already_confirmed') && (
              <SuccessDisplay
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <StatusIcon
                  variant="success"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                >
                  <CheckIcon />
                </StatusIcon>
                <SuccessTitle>Présence confirmée!</SuccessTitle>
                <SuccessMessage>Nous vous attendons le jour de l'audition. Bonne chance!</SuccessMessage>
                {convocationData.auditionSlot && (
                  <InfoCard
                    bgColor="rgba(209, 250, 229, 0.8)"
                    border="1px solid rgba(16, 185, 129, 0.3)"
                    accent="linear-gradient(180deg, #10b981, #059669)"
                  >
                    <DetailRow>
                      <DetailLabel>
                        <IconWrapper bgColor="rgba(16, 185, 129, 0.1)" color="#059669">
                          <CalendarIcon />
                        </IconWrapper>
                        Date confirmée
                      </DetailLabel>
                      <DetailValue>
                        {formatDateTime(
                          convocationData.auditionSlot.date,
                          `${convocationData.auditionSlot.startTime} - ${convocationData.auditionSlot.endTime}`
                        )}
                      </DetailValue>
                    </DetailRow>
                  </InfoCard>
                )}
              </SuccessDisplay>
            )}

            {/* 🔄 Rescheduled Status */}
            {convocationData &&
              (convocationData.status === 'rescheduled_different_day' || convocationData.status === 'rescheduled_same_day') && (
                <SuccessDisplay
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <StatusIcon
                    variant="warning"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  >
                    <RefreshIcon />
                  </StatusIcon>
                  <SuccessTitle style={{ color: '#f59e0b' }}>
                    {convocationData.status === 'rescheduled_same_day' ? 'Nouveau créneau confirmé!' : 'Demande enregistrée!'}
                  </SuccessTitle>
                  <SuccessMessage>
                    {convocationData.status === 'rescheduled_same_day'
                      ? 'Votre nouveau créneau a été confirmé avec succès!'
                      : 'Votre demande de changement de jour a été enregistrée. Nous vous contacterons bientôt avec un nouveau créneau.'}
                  </SuccessMessage>

                  {/* Show new slot details for same day reschedule */}
                  {convocationData.status === 'rescheduled_same_day' && convocationData.auditionSlot && (
                    <InfoCard
                      bgColor="rgba(254, 243, 199, 0.8)"
                      border="1px solid rgba(245, 158, 11, 0.3)"
                      accent="linear-gradient(180deg, #f59e0b, #d97706)"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <DetailRow>
                        <DetailLabel>
                          <IconWrapper bgColor="rgba(245, 158, 11, 0.1)" color="#d97706">
                            <CalendarIcon />
                          </IconWrapper>
                          Nouveau créneau confirmé
                        </DetailLabel>
                        <DetailValue>
                          {formatDateTime(
                            convocationData.auditionSlot.date,
                            `${convocationData.auditionSlot.startTime} - ${convocationData.auditionSlot.endTime}`
                          )}
                        </DetailValue>
                      </DetailRow>
                    </InfoCard>
                  )}
                </SuccessDisplay>
              )}

                      {/* ⌛ Expired Status */}
            {convocationData && convocationData.status === 'expired' && (
              <SuccessDisplay
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <StatusIcon
                  variant="warning"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                >
                  <ClockIcon />
                </StatusIcon>
                <SuccessTitle style={{ color: '#f59e0b' }}>Session Clôturée</SuccessTitle>
                <SuccessMessage>
                  La date limite ({convocationData.closingDate ? new Date(convocationData.closingDate).toLocaleDateString('fr-FR') : 'dépassée'}) pour répondre à cette convocation est passée. 
                  L'audition est désormais clôturée et vous ne pouvez plus effectuer de modifications.
                </SuccessMessage>
                <InfoCard
                  bgColor="rgba(255, 251, 235, 0.8)"
                  border="1px solid rgba(245, 158, 11, 0.3)"
                  accent="linear-gradient(180deg, #f59e0b, #d97706)"
                >
                  <DetailRow>
                    <DetailLabel>
                      <IconWrapper bgColor="rgba(245, 158, 11, 0.1)" color="#d97706">
                        <InfoIcon />
                      </IconWrapper>
                      Statut de la session
                    </DetailLabel>
                    <DetailValue>Expiré / Clôturé</DetailValue>
                  </DetailRow>
                </InfoCard>
              </SuccessDisplay>
            )}

            {/* ❌ Declined Status */}
            {convocationData && convocationData.status === 'declined' && (
              <DeclinedDisplay
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <StatusIcon
                  variant="error"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                >
                  <XIcon />
                </StatusIcon>
                <DeclinedTitle>Candidature déclinée</DeclinedTitle>
                <DeclinedMessage>
                  Votre candidature a été supprimée de notre système. Merci pour votre intérêt et bonne continuation dans vos projets musicaux.
                </DeclinedMessage>
              </DeclinedDisplay>
            )}

            {/* 🔄 NEW: Expired/Moved to Pending Status */}
            {convocationData && convocationData.status === 'expired_moved_pending' && (
              <SuccessDisplay
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <StatusIcon
                  variant="info"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                >
                  <InfoIcon />
                </StatusIcon>
                <SuccessTitle style={{ color: '#3b82f6' }}>Remis en liste d'attente</SuccessTitle>
                <SuccessMessage>
                  Votre convocation a expiré et vous avez été automatiquement remis en liste d'attente pour une prochaine session d'audition.
                </SuccessMessage>
                <InfoCard
                  bgColor="rgba(224, 242, 254, 0.8)"
                  border="1px solid rgba(2, 132, 199, 0.3)"
                  accent="linear-gradient(180deg, #0284c7, #0369a1)"
                >
                  <DetailRow>
                    <DetailLabel>
                      <IconWrapper bgColor="rgba(2, 132, 199, 0.1)" color="#0369a1">
                        <InfoIcon />
                      </IconWrapper>
                      Statut actuel
                    </DetailLabel>
                    <DetailValue>En attente d'une nouvelle convocation</DetailValue>
                  </DetailRow>
                </InfoCard>
              </SuccessDisplay>
            )}
          </Card>
        </AnimatePresence>

        {/* ✨ RESCHEDULE MODAL WITH ENHANCED TIME SELECTION */}
        <AnimatePresence>
          {showRescheduleModal && (
            <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal}>
              <Modal
                initial={{ opacity: 0, scale: 0.8, y: 60 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 60 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <ModalHeader>
                  <ModalTitle>
                    <IconWrapper bgColor="rgba(245, 158, 11, 0.15)" color="#d97706">
                      <RefreshIcon />
                    </IconWrapper>
                    Demande de reprogrammation
                  </ModalTitle>
                  <CloseButton onClick={handleCloseModal}>
                    <XIcon />
                  </CloseButton>
                </ModalHeader>

                <ModalBody>
                  <ModalText>Choisissez votre option de reprogrammation:</ModalText>

                  <RadioGroup>
                    <RadioOption
                      className={rescheduleType === 'different_day' ? 'selected' : ''}
                      onClick={() => setRescheduleType('different_day')}
                    >
                      <input
                        type="radio"
                        name="rescheduleType"
                        value="different_day"
                        checked={rescheduleType === 'different_day'}
                        onChange={(e) => setRescheduleType(e.target.value)}
                      />
                      <RadioContent>
                        <RadioTitle>
                          <SunIcon />
                          Je veux changer de jour d'audition
                        </RadioTitle>
                        <RadioDescription>
                          Vous serez recontacté par notre équipe pour un nouveau jour d'audition dans les plus brefs délais
                        </RadioDescription>
                      </RadioContent>
                    </RadioOption>

                    <RadioOption className={rescheduleType === 'same_day' ? 'selected' : ''} onClick={() => setRescheduleType('same_day')}>
                      <input
                        type="radio"
                        name="rescheduleType"
                        value="same_day"
                        checked={rescheduleType === 'same_day'}
                        onChange={(e) => setRescheduleType(e.target.value)}
                      />
                      <RadioContent>
                        <RadioTitle>
                          <ClockIcon />
                          Même jour, mais autre heure
                        </RadioTitle>
                        <RadioDescription>
                          Choisissez immédiatement un nouveau créneau horaire disponible pour le même jour
                        </RadioDescription>
                      </RadioContent>
                    </RadioOption>
                  </RadioGroup>

                  <AnimatePresence>
                    {rescheduleType && (
                      <ReasonContainer
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <ReasonLabel>Pourquoi souhaitez-vous changer ? (Facultatif)</ReasonLabel>
                        <ReasonInput
                          placeholder="Ex: Travail, cours, empêchement familial..."
                          value={rescheduleReason}
                          onChange={(e) => setRescheduleReason(e.target.value)}
                        />
                      </ReasonContainer>
                    )}
                  </AnimatePresence>

                  {/* ✨ ENHANCED TIME SELECTOR WITH SESSION INFO */}
                  <AnimatePresence>
                    {rescheduleType === 'same_day' && (
                      <TimeSelector
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <TimeSelectorLabel>
                          <ClockIcon />
                          Sélectionnez votre nouveau créneau préféré:
                        </TimeSelectorLabel>

                        {/* Session Info Display */}
                        {sessionInfo && (
                          <SessionInfoBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <div className="session-time">
                              📅 <strong>Session d'audition:</strong> {sessionInfo.sessionStartTime} - {sessionInfo.sessionEndTime}
                            </div>
                            {sessionInfo.debutPause && sessionInfo.finPause && (
                              <div className="pause-time">
                                ⏸️ Pause: {sessionInfo.debutPause} - {sessionInfo.finPause}
                              </div>
                            )}
                          </SessionInfoBox>
                        )}

                        {loadingTimes ? (
                          <LoadingTimeSlots>
                            <LoadingSpinner
                              style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem' }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            />
                            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Chargement des créneaux disponibles...</div>
                          </LoadingTimeSlots>
                        ) : (
                          <TimeGrid>
                            {availableTimes.length > 0 ? (
                              availableTimes.map((time) => (
                                <TimeSlot
                                  key={time}
                                  selected={selectedTime === time}
                                  onClick={() => setSelectedTime(time)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <span className="time-range">
                                    {time}
                                    <div className="end-time">- {calculateEndTimeForDisplay(time)}</div>
                                  </span>
                                </TimeSlot>
                              ))
                            ) : (
                              <motion.div
                                style={{
                                  gridColumn: '1 / -1',
                                  textAlign: 'center',
                                  padding: '3rem 2rem',
                                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.08))',
                                  borderRadius: '16px',
                                  border: '2px solid rgba(239, 68, 68, 0.2)',
                                  color: '#dc2626',
                                  fontSize: '1.1rem',
                                  fontWeight: '600',
                                  lineHeight: '1.6'
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                              >
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>😔</div>
                                <div style={{ marginBottom: '0.5rem' }}>Aucun créneau disponible pour ce jour</div>
                                <div style={{ fontSize: '0.95rem', color: '#7f1d1d', fontWeight: '500' }}>
                                  Veuillez choisir "Changer de jour" à la place
                                </div>
                              </motion.div>
                            )}
                          </TimeGrid>
                        )}

                        {/* Enhanced Statistics Display */}
                        {availableTimes.length > 0 && (
                          <StatisticsBox
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                          >
                            ✨ <strong>{availableTimes.length} créneaux disponibles</strong> - Cliquez pour sélectionner
                          </StatisticsBox>
                        )}
                      </TimeSelector>
                    )}
                  </AnimatePresence>
                </ModalBody>

                <ModalFooter>
                  <ActionButton
                    variant="secondary"
                    onClick={handleCloseModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <XIcon />
                    Annuler
                  </ActionButton>
                  <ActionButton
                    variant="primary"
                    onClick={handleReschedule}
                    disabled={responding || !rescheduleType || (rescheduleType === 'same_day' && !selectedTime)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    {responding ? (
                      <ButtonSpinner animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    ) : (
                      <CheckIcon />
                    )}
                    {rescheduleType === 'different_day' ? 'Demander un nouveau jour' : 'Confirmer ce créneau'}
                  </ActionButton>
                </ModalFooter>
              </Modal>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </PageContainer>
    </>
  );
};

export default ConvocationResponse;
