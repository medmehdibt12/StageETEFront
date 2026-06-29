/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Col, Row, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import logoCSO from '../../../assets/images/logo.svg';
import { useSearchParams } from 'react-router-dom';
import {
  applyForMembership,
  sendConfirmationEmail,
  checkEmailConfirmed,
  verifyGoogleToken
} from '../../../services/auth.service';
import { getConfig } from '../../../services/config.service';

const MySwal = withReactContent(Swal);

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f9fc 0%, #ecf0f5 100%);
  padding: 2rem 1rem;
`;

const FormContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const FormHeader = styled.div`
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  padding: 2rem;
  text-align: center;
  color: white;
`;

const Logo = styled.img`
  height: 80px;
  margin-bottom: 1.5rem;
  filter: brightness(0) invert(1);
`;

const Title = styled.h2`
  font-weight: 600;
  font-size: 2rem;
  margin: 0;
  color: white;
  letter-spacing: 0.03em;
`;

const FormContent = styled.div`
  padding: 2rem;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  position: relative;
  padding: 0 2rem;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: #e2e8f0;
    z-index: 1;
  }
`;

const Step = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => (props.active ? '#3498db' : props.completed ? '#2ecc71' : '#e2e8f0')};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  box-shadow: ${(props) => (props.active ? '0 0 0 4px rgba(52, 152, 219, 0.2)' : 'none')};
  font-weight: 600;

  &::after {
    content: '${(props) => props.title}';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: ${(props) => (props.active ? '#3498db' : '#718096')};
    white-space: nowrap;
    font-weight: 500;

    /* Mobile: Show only "Informations" */
    @media (max-width: 768px) {
      content: '${(props) => (props.title === 'Informations personnelles' ? 'Informations' : props.title)}';
    }
  }
`;

const StyledForm = styled(Form)`
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    font-weight: 500;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .form-control {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    padding: 0.75rem 1rem;
    transition: all 0.2s;

    &:focus {
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }

    &.is-invalid {
      border-color: #dc3545;
      &:focus {
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
      }
    }
  }

  .form-control-sm {
    padding: 0.5rem 0.75rem;
  }

  .invalid-feedback {
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
`;

const ActionButton = styled(Button)`
  padding: ${(props) => (props.size === 'sm' ? '0.5rem 1.5rem' : '0.75rem 2rem')};
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    transform: none;
    box-shadow: none;
  }
`;

const EmailConfirmButton = styled(ActionButton)`
  min-width: 100px;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: start;

  .form-control {
    flex: 1;
  }
`;

const HelperText = styled.div`
  font-size: 0.85rem;
  color: ${(props) => (props.type === 'success' ? '#2ecc71' : '#718096')};
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CheckboxLabel = styled(Form.Check.Label)`
  font-size: 0.95rem;
  color: #2d3748;
`;

const HeightSliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const HeightSlider = styled.input`
  flex: 1;
  height: 8px;
  border-radius: 5px;
  background: #e2e8f0;
  outline: none;
  transition: all 0.2s;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3498db;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3498db;
    cursor: pointer;
    border: none;
  }
`;

const HeightDisplay = styled.div`
  min-width: 60px;
  text-align: center;
  font-weight: 500;
  color: #3498db;
`;

const VerificationDivider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #a0aec0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }

  &::before {
    margin-right: 1rem;
  }

  &::after {
    margin-left: 1rem;
  }

  span {
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const GoogleButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
`;

const EmailVerificationContainer = styled.div`
  padding: 3rem 2rem;
  text-align: center;
`;

const EmailVerificationTitle = styled.h3`
  color: #2d3748;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const EmailVerificationSubtitle = styled.p`
  color: #718096;
  margin-bottom: 2rem;
  font-size: 1.1rem;
`;

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '10px',
    borderColor: state.isFocused ? '#3498db' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(52, 152, 219, 0.2)' : base.boxShadow,
    minHeight: '42px',
    '&:hover': {
      borderColor: '#3498db'
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#3498db' : state.isFocused ? '#ebf8ff' : base.backgroundColor,
    '&:active': {
      backgroundColor: '#3498db'
    }
  }),
  placeholder: (base) => ({
    ...base,
    fontSize: '0.95rem'
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  })
};

const genreOptions = [
  { value: 'Homme', label: 'Homme' },
  { value: 'Femme', label: 'Femme' }
];

const countryOptions = [
  { value: 'Tunisie', label: '🇹🇳 Tunisie' },
  { value: 'Afghanistan', label: '🇦🇫 Afghanistan' },
  { value: 'Afrique du Sud', label: '🇿🇦 Afrique du Sud' },
  { value: 'Albanie', label: '🇦🇱 Albanie' },
  { value: 'Algérie', label: '🇩🇿 Algérie' },
  { value: 'Allemagne', label: '🇩🇪 Allemagne' },
  { value: 'Andorre', label: '🇦🇩 Andorre' },
  { value: 'Angola', label: '🇦🇴 Angola' },
  { value: 'Arabie Saoudite', label: '🇸🇦 Arabie Saoudite' },
  { value: 'Argentine', label: '🇦🇷 Argentine' },
  { value: 'Arménie', label: '🇦🇲 Arménie' },
  { value: 'Australie', label: '🇦🇺 Australie' },
  { value: 'Autriche', label: '🇦🇹 Autriche' },
  { value: 'Azerbaïdjan', label: '🇦🇿 Azerbaïdjan' },
  { value: 'Bahreïn', label: '🇧🇭 Bahreïn' },
  { value: 'Bangladesh', label: '🇧🇩 Bangladesh' },
  { value: 'Belgique', label: '🇧🇪 Belgique' },
  { value: 'Belize', label: '🇧🇿 Belize' },
  { value: 'Bénin', label: '🇧🇯 Bénin' },
  { value: 'Bolivie', label: '🇧🇴 Bolivie' },
  { value: 'Brésil', label: '🇧🇷 Brésil' },
  { value: 'Bulgarie', label: '🇧🇬 Bulgarie' },
  { value: 'Burkina Faso', label: '🇧🇫 Burkina Faso' },
  { value: 'Cameroun', label: '🇨🇲 Cameroun' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Chili', label: '🇨🇱 Chili' },
  { value: 'Chine', label: '🇨🇳 Chine' },
  { value: 'Chypre', label: '🇨🇾 Chypre' },
  { value: 'Colombie', label: '🇨🇴 Colombie' },
  { value: 'Corée du Sud', label: '🇰🇷 Corée du Sud' },
  { value: 'Costa Rica', label: '🇨🇷 Costa Rica' },
  { value: 'Croatie', label: '🇭🇷 Croatie' },
  { value: 'Danemark', label: '🇩🇰 Danemark' },
  { value: 'Égypte', label: '🇪🇬 Égypte' },
  { value: 'Émirats Arabes Unis', label: '🇦🇪 Émirats Arabes Unis' },
  { value: 'Équateur', label: '🇪🇨 Équateur' },
  { value: 'Espagne', label: '🇪🇸 Espagne' },
  { value: 'Estonie', label: '🇪🇪 Estonie' },
  { value: 'États-Unis', label: '🇺🇸 États-Unis' },
  { value: 'Éthiopie', label: '🇪🇹 Éthiopie' },
  { value: 'Finlande', label: '🇫🇮 Finlande' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Gabon', label: '🇬🇦 Gabon' },
  { value: 'Géorgie', label: '🇬🇪 Géorgie' },
  { value: 'Ghana', label: '🇬🇭 Ghana' },
  { value: 'Grèce', label: '🇬🇷 Grèce' },
  { value: 'Guatemala', label: '🇬🇹 Guatemala' },
  { value: 'Guinée', label: '🇬🇳 Guinée' },
  { value: 'Hongrie', label: '🇭🇺 Hongrie' },
  { value: 'Inde', label: '🇮🇳 Inde' },
  { value: 'Indonésie', label: '🇮🇩 Indonésie' },
  { value: 'Iran', label: '🇮🇷 Iran' },
  { value: 'Iraq', label: '🇮🇶 Iraq' },
  { value: 'Irlande', label: '🇮🇪 Irlande' },
  { value: 'Islande', label: '🇮🇸 Islande' },
  { value: 'Italie', label: '🇮🇹 Italie' },
  { value: 'Japon', label: '🇯🇵 Japon' },
  { value: 'Jordanie', label: '🇯🇴 Jordanie' },
  { value: 'Kazakhstan', label: '🇰🇿 Kazakhstan' },
  { value: 'Kenya', label: '🇰🇪 Kenya' },
  { value: 'Koweït', label: '🇰🇼 Koweït' },
  { value: 'Lettonie', label: '🇱🇻 Lettonie' },
  { value: 'Liban', label: '🇱🇧 Liban' },
  { value: 'Libéria', label: '🇱🇷 Libéria' },
  { value: 'Libye', label: '🇱🇾 Libye' },
  { value: 'Lituanie', label: '🇱🇹 Lituanie' },
  { value: 'Luxembourg', label: '🇱🇺 Luxembourg' },
  { value: 'Madagascar', label: '🇲🇬 Madagascar' },
  { value: 'Malaisie', label: '🇲🇾 Malaisie' },
  { value: 'Mali', label: '🇲🇱 Mali' },
  { value: 'Malte', label: '🇲🇹 Malte' },
  { value: 'Maroc', label: '🇲🇦 Maroc' },
  { value: 'Maurice', label: '🇲🇺 Maurice' },
  { value: 'Mauritanie', label: '🇲🇷 Mauritanie' },
  { value: 'Mexique', label: '🇲🇽 Mexique' },
  { value: 'Moldavie', label: '🇲🇩 Moldavie' },
  { value: 'Monaco', label: '🇲🇨 Monaco' },
  { value: 'Mongolie', label: '🇲🇳 Mongolie' },
  { value: 'Monténégro', label: '🇲🇪 Monténégro' },
  { value: 'Mozambique', label: '🇲🇿 Mozambique' },
  { value: 'Namibie', label: '🇳🇦 Namibie' },
  { value: 'Népal', label: '🇳🇵 Népal' },
  { value: 'Nicaragua', label: '🇳🇮 Nicaragua' },
  { value: 'Niger', label: '🇳🇪 Niger' },
  { value: 'Nigéria', label: '🇳🇬 Nigéria' },
  { value: 'Norvège', label: '🇳🇴 Norvège' },
  { value: 'Nouvelle-Zélande', label: '🇳🇿 Nouvelle-Zélande' },
  { value: 'Oman', label: '🇴🇲 Oman' },
  { value: 'Ouganda', label: '🇺🇬 Ouganda' },
  { value: 'Pakistan', label: '🇵🇰 Pakistan' },
  { value: 'Palestine', label: '🇵🇸 Palestine' },
  { value: 'Panama', label: '🇵🇦 Panama' },
  { value: 'Paraguay', label: '🇵🇾 Paraguay' },
  { value: 'Pays-Bas', label: '🇳🇱 Pays-Bas' },
  { value: 'Pérou', label: '🇵🇪 Pérou' },
  { value: 'Philippines', label: '🇵🇭 Philippines' },
  { value: 'Pologne', label: '🇵🇱 Pologne' },
  { value: 'Portugal', label: '🇵🇹 Portugal' },
  { value: 'Qatar', label: '🇶🇦 Qatar' },
  { value: 'République Tchèque', label: '🇨🇿 République Tchèque' },
  { value: 'Roumanie', label: '🇷🇴 Roumanie' },
  { value: 'Royaume-Uni', label: '🇬🇧 Royaume-Uni' },
  { value: 'Russie', label: '🇷🇺 Russie' },
  { value: 'Rwanda', label: '🇷🇼 Rwanda' },
  { value: 'Sénégal', label: '🇸🇳 Sénégal' },
  { value: 'Serbie', label: '🇷🇸 Serbie' },
  { value: 'Singapour', label: '🇸🇬 Singapour' },
  { value: 'Slovaquie', label: '🇸🇰 Slovaquie' },
  { value: 'Slovénie', label: '🇸🇮 Slovénie' },
  { value: 'Somalie', label: '🇸🇴 Somalie' },
  { value: 'Soudan', label: '🇸🇩 Soudan' },
  { value: 'Sri Lanka', label: '🇱🇰 Sri Lanka' },
  { value: 'Suède', label: '🇸🇪 Suède' },
  { value: 'Suisse', label: '🇨🇭 Suisse' },
  { value: 'Syrie', label: '🇸🇾 Syrie' },
  { value: 'Tadjikistan', label: '🇹🇯 Tadjikistan' },
  { value: 'Tanzanie', label: '🇹🇿 Tanzanie' },
  { value: 'Tchad', label: '🇹🇩 Tchad' },
  { value: 'Thaïlande', label: '🇹🇭 Thaïlande' },
  { value: 'Togo', label: '🇹🇬 Togo' },
  { value: 'Turkménistan', label: '🇹🇲 Turkménistan' },
  { value: 'Turquie', label: '🇹🇷 Turquie' },
  { value: 'Ukraine', label: '🇺🇦 Ukraine' },
  { value: 'Uruguay', label: '🇺🇾 Uruguay' },
  { value: 'Venezuela', label: '🇻🇪 Venezuela' },
  { value: 'Vietnam', label: '🇻🇳 Vietnam' },
  { value: 'Yémen', label: '🇾🇪 Yémen' },
  { value: 'Zambie', label: '🇿🇲 Zambie' },
  { value: 'Zimbabwe', label: '🇿🇼 Zimbabwe' }
];

const Formulaire = () => {
  const [step, setStep] = useState(0);
  const [signupActive, setSignupActive] = useState(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [emailConfirmLoading, setEmailConfirmLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [heightValue, setHeightValue] = useState(1.7);
  const [cinWarning, setCinWarning] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      gender: null,
      birthDate: '',
      nationality: { value: 'Tunisie', label: '🇹🇳 Tunisie' },
      identityType: '',
      identityNumber: '',
      height: 1.7,
      phone: '',
      phoneCountryCode: '',
      isSponsored: '',
      sponsorName: '',
      professionalSituation: '',
      hasMusicalKnowledge: false,
      musicalExperience: '',
      isActiveInOtherChoir: false,
      otherChoir: '',
      motivation: '',
      emailConfirmed: false
    }
  });

  // Update these lines at the top where you have the watch variables
  const hasMusicalKnowledge = watch('hasMusicalKnowledge');
  const isActiveInOtherChoir = watch('isActiveInOtherChoir');
  const identityType = watch('identityType');
  const isSponsored = watch('isSponsored');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Formulaire de Candidature | CSO';
  }, []);
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    const emailFromUrl = searchParams.get('email');

    if (confirmed === 'true' && emailFromUrl) {
      setValue('email', emailFromUrl);
      setEmailConfirmed(true); // ✅ Unlock the form immediately
    }
  }, [searchParams, setValue]);
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getConfig();
        setSignupActive(config.signupActive);
      } catch (err) {
        setSignupActive(false);
      }
    };
    fetchConfig();
  }, []);

  // Google One-Tap & Sign-In Initialization
  useEffect(() => {
    if (step === 0 && !emailConfirmed && !isGoogleLoading) {
      const loadGoogleScript = () => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID,
              callback: handleGoogleResponse,
              cancel_on_tap_outside: false
            });

            // Display One-Tap prompt
            window.google.accounts.id.prompt();

            // Render Sign-In button
            const buttonDiv = document.getElementById('google-signin-button');
            if (buttonDiv) {
              window.google.accounts.id.renderButton(buttonDiv, {
                theme: 'outline',
                size: 'large',
                width: buttonDiv.offsetWidth,
                text: 'continue_with',
                shape: 'pill'
              });
            }
          }
        };
        document.head.appendChild(script);
      };

      loadGoogleScript();
    }
  }, [step, emailConfirmed]);

  const handleGoogleResponse = async (response) => {
    try {
      setIsGoogleLoading(true);
      const res = await verifyGoogleToken(response.credential);

      if (res.success) {
        setValue('email', res.email);
        setEmailConfirmed(true);
        MySwal.fire({
          icon: 'success',
          title: 'Vérification réussie !',
          text: `Votre email ${res.email} a été vérifié avec succès via Google.`,
          confirmButtonColor: '#2ecc71',
          timer: 3000
        });
      }
    } catch (err) {
      console.error('Google verification error:', err);
      MySwal.fire({
        icon: 'error',
        title: 'Échec de la vérification',
        text: err.message || 'Une erreur est survenue lors de la vérification Google.',
        confirmButtonColor: '#e74c3c'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    setValue('height', heightValue);
  }, [heightValue, setValue]);

  const handleEmailConfirmation = async () => {
    const email = watch('email');

    if (!email || errors.email) {
      trigger('email');
      return;
    }

    try {
      setEmailConfirmLoading(true);

      await sendConfirmationEmail(email);

      MySwal.fire({
        icon: 'success',
        title: 'Email envoyé',
        text: 'Veuillez cliquer sur le lien de confirmation dans votre boîte mail.',
        confirmButtonColor: '#3498db'
      }).then(() => {
        // Redirect to success page
        navigate('/email-sent', { state: { email } });
      });
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Échec de l’envoi de l’email.';

      MySwal.fire({
        icon: 'warning',
        title: 'Envoi impossible',
        text: message,
        confirmButtonColor: '#3498db'
      });
    } finally {
      setEmailConfirmLoading(false);
    }
  };

  const checkEmail = async () => {
    const email = watch('email');
    if (!email) return;

    try {
      const res = await checkEmailConfirmed(email);
      if (res.emailConfirmed) {
        setEmailConfirmed(true);
        MySwal.fire({
          icon: 'success',
          title: 'Email confirmé !',
          text: 'Vous pouvez maintenant passer à l’étape suivante.',
          confirmButtonColor: '#2ecc71'
        });
      }
    } catch (err) {
      // ✅ NEW: Handle different application statuses
      if (err.response?.status === 409) {
        const responseData = err.response.data;

        // Check if this is an application status response
        if (responseData.applicationStatus) {
          const { message, applicationStatus, canReapply } = responseData;

          let icon = 'info';
          let confirmButtonColor = '#3498db';
          let title = '';

          switch (applicationStatus) {
            case 'Pending':
              icon = 'info';
              title = 'Candidature déjà soumise';
              confirmButtonColor = '#3498db';
              break;
            case 'TestScheduled':
              icon = 'info';
              title = 'Test programmé';
              confirmButtonColor = '#f39c12';
              break;
            case 'Accepted':
              icon = 'success';
              title = 'Candidature acceptée';
              confirmButtonColor = '#2ecc71';
              break;
            case 'Refused':
              icon = 'warning';
              title = 'Candidature précédente';
              confirmButtonColor = '#e74c3c';
              break;
            default:
              icon = 'info';
              title = 'Information';
              confirmButtonColor = '#3498db';
          }

          MySwal.fire({
            icon: icon,
            title: title,
            text: message,
            confirmButtonColor: confirmButtonColor,
            showCancelButton: canReapply,
            confirmButtonText: canReapply ? 'Nouvelle candidature' : 'Compris',
            cancelButtonText: canReapply ? 'Annuler' : undefined
          }).then((result) => {
            if (result.isConfirmed && canReapply) {
              // ✅ For refused applications, allow them to proceed
              setEmailConfirmed(true);
              MySwal.fire({
                icon: 'success',
                title: 'Nouvelle candidature',
                text: 'Vous pouvez maintenant soumettre une nouvelle candidature.',
                confirmButtonColor: '#2ecc71'
              });
            }
          });
        } else {
          // Handle other 409 errors
          MySwal.fire({
            icon: 'warning',
            title: 'Information',
            text: responseData.message || 'Une situation particulière a été détectée.',
            confirmButtonColor: '#3498db'
          });
        }
      } else {
        // Handle other types of errors (keep existing behavior)
        console.error('Erreur vérification email:', err);
        // Optionally show a generic error message
        // MySwal.fire({
        //   icon: 'error',
        //   title: 'Erreur',
        //   text: 'Erreur lors de la vérification de l\'email.',
        //   confirmButtonColor: '#e74c3c'
        // });
      }
    }
  };

  // Validation function for at least one sentence
  const validatePhrase = (value) => {
    if (!value || value.trim().length === 0) {
      return 'La motivation est requise';
    }

    const cleaned = value.trim();

    // 1. Minimum visual width (roughly 1 full-width sentence)
    if (cleaned.length < 50) {
      return 'Veuillez écrire une phrase complète (au moins 50 caractères).';
    }

    // 2. Check for immediate repeated words (e.g., "je je", "test test")
    const immediateRepeatPattern = /\b(\w+)\b\s+\1\b/i;
    if (immediateRepeatPattern.test(cleaned)) {
      return 'Veuillez éviter de répéter les mêmes mots consécutivement.';
    }

    // 3. Require at least 6 unique words (to avoid poor variety)
    const words = cleaned.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    if (uniqueWords.size < 6) {
      return 'Veuillez écrire une phrase plus riche avec des mots variés.';
    }

    return true;
  };

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        gender: data.gender?.value || '',
        nationality: data.nationality?.value || '',
        identityNumber: data.identityNumber,
        height: Math.round(parseFloat(data.height) * 100),
        submitted_at: new Date().toISOString()
      };

      const response = await applyForMembership(formattedData);

      MySwal.fire({
        icon: 'success',
        title: response.message || 'Votre candidature a bien été enregistrée.',
        text: 'Nous vous contacterons bientôt pour une audition !',
        confirmButtonColor: '#2ecc71',
        timer: 3000,
        timerProgressBar: true
      }).then(() => {
        // ✅ Redirect to success page instead of resetting to Step 0
        navigate('/candidature/success', { replace: true });
      });
    } catch (error) {
      let errorMessage = 'La demande a échoué.';

      if (error.response?.status === 409) {
        errorMessage = error.response.data.message || 'Vous avez déjà une candidature en cours.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      MySwal.fire({
        icon: 'warning',
        title: 'Envoi impossible',
        text: errorMessage,
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  const handleNext = async () => {
    let fieldsToValidate = [];

    if (step === 0) {
      fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'gender', 'birthDate', 'nationality'];

      const valid = await trigger(fieldsToValidate);

      if (!valid) return;

      setStep((s) => s + 1);
    } else if (step === 1) {
      fieldsToValidate = [
        'identityType',
        'identityNumber',
        'height',
        'professionalSituation',
        'isSponsored',
        ...(isSponsored === 'oui' ? ['sponsorName'] : [])
      ];
      const valid = await trigger(fieldsToValidate);
      if (valid) setStep((s) => s + 1);
    } else if (step === 2) {
      fieldsToValidate = [
        'motivation',
        'hasMusicalKnowledge',
        ...(hasMusicalKnowledge ? ['musicalExperience'] : []),
        'isActiveInOtherChoir',
        ...(isActiveInOtherChoir ? ['otherChoir'] : [])
      ];
      const valid = await trigger(fieldsToValidate);
      if (valid) setStep((s) => s + 1);
    }
  };

  // Loading state
  if (signupActive === null) {
    return (
      <PageContainer>
        <motion.div
          className="text-center"
          style={{ paddingTop: '20vh' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Spinner
            animation="border"
            style={{
              width: '3rem',
              height: '3rem',
              color: '#3498db'
            }}
          />
          <motion.p
            className="mt-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: '#718096' }}
          >
            Chargement du formulaire...
          </motion.p>
        </motion.div>
      </PageContainer>
    );
  }

  // Signups disabled
  if (!signupActive) {
    return (
      <PageContainer>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <FormContainer>
            <FormHeader>
              <Logo src={logoCSO} alt="CSO Logo" />
              <Title>Candidatures fermées</Title>
              <p
                style={{
                  marginTop: '1rem',
                  opacity: 0.9,
                  fontSize: '1.1rem'
                }}
              >
                Nous ne recrutons pas de nouveaux membres pour le moment.
                <br />
                Merci de votre intérêt pour le CSO !
              </p>
            </FormHeader>
          </FormContainer>
        </motion.div>
      </PageContainer>
    );
  }

  // Show email verification screen if email not confirmed
  if (!emailConfirmed) {
    return (
      <PageContainer>
        <FormContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <FormHeader>
            <Logo src={logoCSO} alt="CSO Logo" />
            <Title>Vérification de l'email</Title>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.3 }}
              style={{ marginTop: '1rem', fontSize: '1.1rem' }}
            >
              Veuillez d'abord confirmer votre adresse email pour accéder au formulaire de candidature
            </motion.p>
          </FormHeader>

          <EmailVerificationContainer>
            <EmailVerificationTitle>Confirmez votre adresse email</EmailVerificationTitle>
            <EmailVerificationSubtitle>
              Cette étape est nécessaire pour sécuriser votre candidature et vous permettre de recevoir nos communications.
            </EmailVerificationSubtitle>

            <Form.Group controlId="email" style={{ maxWidth: '500px', margin: '0 auto' }}>
              {/* <Form.Label>Adresse email</Form.Label> */}
              <InputGroup>
                <Form.Control
                  type="email"
                  placeholder="votre@email.com"
                  {...register('email', {
                    required: 'Email requis',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Email invalide'
                    }
                  })}
                  isInvalid={!!errors.email}
                  size="lg"
                />
                <EmailConfirmButton size="lg" variant="primary" onClick={handleEmailConfirmation} disabled={emailConfirmLoading}>
                  {emailConfirmLoading ? <Spinner size="sm" animation="border" /> : 'Confirmer'}
                </EmailConfirmButton>
              </InputGroup>

              {/* Move error message right below the input */}
              {errors.email && (
                <div className="text-danger mt-1" style={{ fontSize: '0.875rem', textAlign: 'left' }}>
                  {errors.email.message}
                </div>
              )}

              <HelperText style={{ textAlign: 'center', marginTop: '1rem' }}>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  Un lien de confirmation sera envoyé à votre adresse email
                </motion.span>
              </HelperText>

              {/* <motion.div
                className="mt-3 text-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ActionButton size="sm" variant="success" onClick={checkEmail} disabled={emailConfirmLoading} style={{ marginTop: '1rem' }}>
                  J'ai confirmé mon email
                </ActionButton>
              </motion.div> */}
            </Form.Group>
          </EmailVerificationContainer>
        </FormContainer>
      </PageContainer>
    );
  }

  // Show main form if email is confirmed
  return (
    <PageContainer>
      <FormContainer initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <FormHeader>
          <Logo src={logoCSO} alt="CSO Logo" />
          <Title>Formulaire de candidature au CSO</Title>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: '1rem', fontSize: '1.1rem' }}
          >
            Email confirmé ✓ - Vous pouvez maintenant compléter votre candidature
          </motion.p>
        </FormHeader>

        <FormContent>
          <StepIndicator>
            <Step active={step === 0 ? 'true' : undefined} completed={step > 0 ? 'true' : undefined} title="Informations personnelles">
              {step > 0 ? '✓' : '1'}
            </Step>

            <Step active={step === 1 ? 'true' : undefined} completed={step > 1 ? 'true' : undefined} title="Détails">
              {step > 1 ? '✓' : '2'}
            </Step>

            <Step active={step === 2 ? 'true' : undefined} completed={step > 2 ? 'true' : undefined} title="Motivation">
              {step > 2 ? '✓' : '3'}
            </Step>
          </StepIndicator>

          <StyledForm onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="firstName">
                          <Form.Label>Prénom</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Votre prénom"
                            {...register('firstName', {
                              required: 'Prénom requis',
                              pattern: {
                                value: /^[A-Za-zÀ-ÿ\s'-]+$/,
                                message: 'Le prénom ne doit contenir que des lettres'
                              }
                            })}
                            isInvalid={!!errors.firstName}
                            size="sm"
                            style={{ height: '40px' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="lastName">
                          <Form.Label>Nom</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Votre nom"
                            {...register('lastName', {
                              required: 'Nom requis',
                              pattern: {
                                value: /^[A-Za-zÀ-ÿ\s'-]+$/,
                                message: 'Le nom ne doit contenir que des lettres'
                              }
                            })}
                            isInvalid={!!errors.lastName}
                            size="sm"
                            style={{ height: '40px' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="emailDisplay">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={watch('email')}
                            disabled
                            size="sm"
                            style={{ backgroundColor: '#e8f5e8', color: '#2d5a2d', height: '40px' }}
                          />
                          <HelperText type="success" style={{ marginTop: '0.25rem' }}>
                            <span>✓</span>
                            Email confirmé
                          </HelperText>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group controlId="phone">
                          <Form.Label>Téléphone</Form.Label>
                          <Form.Control
                            type="tel"
                            placeholder="🇹🇳 +216 99 999 999"
                            {...register('phone', {
                              required: 'Téléphone requis',
                              pattern: {
                                value: /^\d{8}$/,
                                message: 'Le numéro doit contenir exactement 8 chiffres'
                              }
                            })}
                            onInput={(e) => {
                              // Ensure only digits, and max 8 characters
                              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
                            }}
                            isInvalid={!!errors.phone}
                            size="sm"
                            style={{ height: '40px' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group controlId="gender" className="mb-3">
                      <Form.Label>Genre</Form.Label>
                      <Controller
                        name="gender"
                        control={control}
                        rules={{ required: 'Genre requis' }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={genreOptions}
                            placeholder="Sélectionnez le genre"
                            isSearchable={false}
                            styles={customSelectStyles}
                            classNamePrefix="select"
                          />
                        )}
                      />
                      {errors.gender && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                          {errors.gender.message}
                        </div>
                      )}
                    </Form.Group>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="birthDate">
                          <Form.Label>Date de naissance</Form.Label>
                          <Form.Control
                            type="date"
                            {...register('birthDate', {
                              required: 'Date de naissance requise',
                              validate: (value) => {
                                const birth = new Date(value);
                                const today = new Date();
                                const age = today.getFullYear() - birth.getFullYear();
                                const monthDiff = today.getMonth() - birth.getMonth();
                                const dayDiff = today.getDate() - birth.getDate();
                                const isOldEnough = age > 14 || (age === 14 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

                                return isOldEnough || 'L’âge minimum requis est de 14 ans';
                              }
                            })}
                            isInvalid={!!errors.birthDate}
                            size="sm"
                            max={new Date().toISOString().split('T')[0]} // dynamic max date
                            style={{ height: '40px' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.birthDate?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                 {/* nationality */}
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="nationality">
                          <Form.Label>Nationalité</Form.Label>
                          <Controller
                            name="nationality"
                            control={control}
                            rules={{ required: 'Nationalité requise' }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                options={countryOptions}
                                placeholder="Sélectionnez votre nationalité"
                                isSearchable={true}
                                styles={customSelectStyles}
                                classNamePrefix="select"
                              />
                            )}
                          />
                          {errors.nationality && (
                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                              {errors.nationality.message}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-between mt-4">
                      <div />
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <ActionButton size="sm" variant="primary" onClick={handleNext} className="px-4">
                          Suivant
                          <span className="ms-2">→</span>
                        </ActionButton>
                      </motion.div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <Form.Group controlId="identityType" className="mb-3">
                      <Form.Label>Pièces d'identité</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          label="CIN"
                          name="identityType"
                          value="CIN"
                          {...register('identityType', { required: "Type de pièce d'identité requis" })}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Passeport"
                          name="identityType"
                          value="Passeport"
                          {...register('identityType', { required: "Type de pièce d'identité requis" })}
                        />
                      </div>
                      {errors.identityType && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                          {errors.identityType.message}
                        </div>
                      )}
                    </Form.Group>

                    {identityType === 'CIN' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form.Group controlId="identityNumberCIN" className="mb-3">
                          <Form.Label>Numéro de CIN</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Numéro CIN (8 chiffres)"
                            {...register('identityNumber', {
                              required: 'Numéro de CIN requis',
                              pattern: {
                                value: /^[01][0-9]{7}$/,
                                // message: 'Le CIN doit commencer par 0 ou 1 et contenir exactement 8 chiffres'
                              }
                            })}
                            onInput={(e) => {
                              const raw = e.target.value;
                              let val = raw.replace(/\D/g, '');
                              
                              if (raw !== val) {
                                setCinWarning("Les lettres ne sont pas autorisées.");
                              } else if (val.length > 0 && val[0] !== '0' && val[0] !== '1') {
                                setCinWarning("Le CIN doit commencer par 0 ou 1.");
                                val = '';
                              } else if (raw.length > 8) {
                                setCinWarning("Limité à 8 chiffres maximum.");
                              } else {
                                setCinWarning("");
                              }
                              
                              e.target.value = val.slice(0, 8);
                            }}
                            isInvalid={!!errors.identityNumber}
                            size="sm"
                            style={{ height: '40px' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.identityNumber?.message}</Form.Control.Feedback>
                          {cinWarning && (
                            <div className="text-warning mt-1" style={{ fontSize: '0.85rem' }}>
                              ⚠️ {cinWarning}
                            </div>
                          )}
                        </Form.Group>
                      </motion.div>
                    )}

                    {identityType === 'Passeport' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form.Group controlId="identityNumberPasseport" className="mb-3">
                          <Form.Label>Numéro de Passeport</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Numéro Passeport"
                            {...register('identityNumber', {
                              required: 'Numéro de Passeport requis',
                              pattern: {
                                value: /^[A-Za-z0-9]+$/,
                                message: 'Le passeport ne doit contenir que des lettres et des chiffres'
                              }
                            })}
                            isInvalid={!!errors.identityNumber}
                            size="sm"
                            style={{ height: '40px' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.identityNumber?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </motion.div>
                    )}

                    <Form.Group controlId="height" className="mb-3">
                      <Form.Label>Taille (en mètre)</Form.Label>

                      <Controller
                        name="height"
                        control={control}
                        rules={{
                          required: 'Taille requise',
                          min: { value: 0.5, message: 'Taille trop petite' },
                          max: { value: 2.5, message: 'Taille trop grande' }
                        }}
                        defaultValue={1.7}
                        render={({ field }) => (
                          <>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0.5"
                              max="2.5"
                              placeholder="ex: 1.70"
                              value={field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              onKeyPress={(e) => {
                                // Prevent typing but allow spinner arrows to work
                                e.preventDefault();
                              }}
                              onKeyDown={(e) => {
                                // Allow only Tab for navigation, block other keyboard input
                                if (e.key !== 'Tab') {
                                  e.preventDefault();
                                }
                              }}
                              isInvalid={!!errors.height}
                              size="sm"
                              style={{
                                height: '40px',
                                cursor: 'default'
                              }}
                            />

                            <HeightSliderContainer>
                              <span style={{ fontSize: '0.85rem', color: '#718096' }}>0.5m</span>
                              <HeightSlider
                                type="range"
                                min="0.5"
                                max="2.5"
                                step="0.01"
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                              <span style={{ fontSize: '0.85rem', color: '#718096' }}>2.5m</span>
                              <HeightDisplay>{field.value?.toFixed(2)}m</HeightDisplay>
                            </HeightSliderContainer>

                            <Form.Control.Feedback type="invalid">{errors.height?.message}</Form.Control.Feedback>
                          </>
                        )}
                      />
                    </Form.Group>

                    <Form.Group controlId="professionalSituation" className="mb-3">
                      <Form.Label>Situation professionnelle</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Votre situation professionnelle"
                        {...register('professionalSituation', {
                          required: 'Situation professionnelle requise',
                          pattern: {
                            value: /^[A-Za-zÀ-ÿ\s'-]+$/,
                            message: 'La situation professionnelle ne doit contenir que des lettres'
                          }
                        })}
                        isInvalid={!!errors.professionalSituation}
                        size="sm"
                        style={{ height: '40px' }}
                      />
                      <Form.Control.Feedback type="invalid">{errors.professionalSituation?.message}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="isSponsored" className="mb-3">
                      <Form.Label>Avez-vous été parrainé pour rejoindre le chœur du CSO ?</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          label="Oui"
                          name="isSponsored"
                          value="oui"
                          {...register('isSponsored', { required: 'Veuillez indiquer si vous avez été parrainé' })}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Non"
                          name="isSponsored"
                          value="non"
                          {...register('isSponsored', { required: 'Veuillez indiquer si vous avez été parrainé' })}
                        />
                      </div>
                      {errors.isSponsored && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                          {errors.isSponsored.message}
                        </div>
                      )}
                    </Form.Group>

                    {isSponsored === 'oui' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form.Group controlId="sponsorName" className="mb-3">
                          <Form.Label>Nom et prénom de parrain</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nom et prénom du parrain"
                            {...register('sponsorName', {
                              required: 'Le nom du parrain est requis',
                              pattern: {
                                value: /^[A-Za-zÀ-ÿ\s'-]+$/,
                                message: 'Le nom ne doit contenir que des lettres'
                              }
                            })}
                            isInvalid={!!errors.sponsorName}
                            size="sm"
                            style={{ height: '40px' }}
                          />
                          <Form.Control.Feedback type="invalid">{errors.sponsorName?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </motion.div>
                    )}

                    <div className="d-flex justify-content-between mt-4">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <ActionButton size="sm" variant="outline-secondary" onClick={() => setStep(0)}>
                          <span className="me-2">←</span>
                          Précédent
                        </ActionButton>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <ActionButton size="sm" variant="primary" onClick={handleNext} className="px-4">
                          Suivant
                          <span className="ms-2">→</span>
                        </ActionButton>
                      </motion.div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <Form.Group controlId="motivation" className="mb-4">
                      <Form.Label>Pourquoi souhaitez-vous rejoindre le CSO ?</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="Décrire vos motivations pour rejoindre notre choeur..."
                        {...register('motivation', {
                          validate: validatePhrase
                        })}
                        isInvalid={!!errors.motivation}
                      />
                      <Form.Control.Feedback type="invalid">{errors.motivation?.message}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="hasMusicalKnowledge" className="mb-3">
                      <Form.Label>Avez-vous des connaissances musicales ?</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          label="Oui"
                          name="hasMusicalKnowledge"
                          value="oui"
                          {...register('hasMusicalKnowledge', { required: 'Veuillez indiquer si vous avez des connaissances musicales' })}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Non"
                          name="hasMusicalKnowledge"
                          value="non"
                          {...register('hasMusicalKnowledge', { required: 'Veuillez indiquer si vous avez des connaissances musicales' })}
                        />
                      </div>
                      {errors.hasMusicalKnowledge && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                          {errors.hasMusicalKnowledge.message}
                        </div>
                      )}
                    </Form.Group>

                    {hasMusicalKnowledge === 'oui' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form.Group controlId="musicalExperience" className="mb-3">
                          <Form.Label>Expérience musicale</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={1}
                            placeholder="Décrire votre expérience musicale..."
                            {...register('musicalExperience', {
                              required: 'Veuillez décrire votre expérience musicale'
                            })}
                            isInvalid={!!errors.musicalExperience}
                          />
                          <Form.Control.Feedback type="invalid">{errors.musicalExperience?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </motion.div>
                    )}
                    <Form.Group controlId="isActiveInOtherChoir" className="mb-3">
                      <Form.Label>Êtes-vous/avez-vous été actif dans un autre chœur ?</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          label="Oui"
                          name="isActiveInOtherChoir"
                          value="oui"
                          {...register('isActiveInOtherChoir', {
                            required: 'Veuillez indiquer si vous avez été actif dans un autre chœur'
                          })}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Non"
                          name="isActiveInOtherChoir"
                          value="non"
                          {...register('isActiveInOtherChoir', {
                            required: 'Veuillez indiquer si vous avez été actif dans un autre chœur'
                          })}
                        />
                      </div>
                      {errors.isActiveInOtherChoir && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                          {errors.isActiveInOtherChoir.message}
                        </div>
                      )}
                    </Form.Group>

                    {isActiveInOtherChoir === 'oui' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form.Group controlId="otherChoir" className="mb-3">
                          <Form.Label>Nom du ou des chœur(s)</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nom du chœur"
                            {...register('otherChoir', {
                              required: "Le nom de l'autre chœur est requis"
                            })}
                            isInvalid={!!errors.otherChoir}
                          />
                          <Form.Control.Feedback type="invalid">{errors.otherChoir?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </motion.div>
                    )}

                    <div className="border-top pt-4 mt-4">
                      <div className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                        <div className="mb-2">
                          <strong>Date de soumission :</strong>{' '}
                          {new Date().toLocaleString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <ActionButton size="sm" variant="outline-secondary" onClick={() => setStep(1)}>
                            <span className="me-2">←</span>
                            Précédent
                          </ActionButton>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <ActionButton size="sm" variant="success" type="submit" className="px-4">
                            <span className="me-2">✓</span>
                            Envoyer ma candidature
                          </ActionButton>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </StyledForm>

          <motion.div
            className="text-center mt-4 text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: '0.875rem' }}
          >
            Étape {step + 1} sur 3
          </motion.div>

          <div
            className="text-center mt-3"
            style={{
              fontSize: '0.75rem',
              color: '#a0aec0'
            }}
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}></motion.div>
          </div>
        </FormContent>
      </FormContainer>
    </PageContainer>
  );
};

export default Formulaire;
