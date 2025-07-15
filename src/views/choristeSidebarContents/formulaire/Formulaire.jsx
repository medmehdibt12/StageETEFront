/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Form, Button, Col, Row, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import logoCSO from '../../../assets/images/music.png';

import { applyForMembership, sendConfirmationEmail, checkEmailConfirmed } from '../../../services/auth.service';
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
  color: white; // Add this line to make the title white

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

const professionalSituationOptions = [
  { value: 'Étudiant(e)', label: 'Étudiant(e)' },
  { value: 'Employé(e)', label: 'Employé(e)' },
  { value: 'Sans emploi', label: 'Sans emploi' },
  { value: 'Retraité(e)', label: 'Retraité(e)' },
  { value: 'Autre', label: 'Autre' }
];

const Formulaire = () => {
  const [step, setStep] = useState(0);
  const [signupActive, setSignupActive] = useState(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [emailConfirmLoading, setEmailConfirmLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      gender: null,
      birthDate: '',
      nationality: '',
      cin: '',
      height: '',
      phone: '',
      motivation: '',
      hasMusicalKnowledge: false,
      musicalExperience: '',
      isActiveInOtherChoir: false,
      otherChoir: '',
      professionalSituation: '',
      emailConfirmed: false
    }
  });

  const hasMusicalKnowledge = watch('hasMusicalKnowledge');
  const isActiveInOtherChoir = watch('isActiveInOtherChoir');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getConfig();
        setSignupActive(config.signupActive);
      } catch (err) {
        setSignupActive(false);
        // console.error('Error fetching config:', err);
      }
    };
    fetchConfig();
  }, []);

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
        icon: 'info',
        title: 'Email envoyé',
        text: 'Veuillez cliquer sur le lien de confirmation dans votre boîte mail.',
        confirmButtonColor: '#3498db'
      });

      setTimeout(() => checkEmail(), 4000);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Échec de l’envoi de l’email.';

      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
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
      // console.error('Erreur vérification email:', err);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        gender: data.gender?.value || '',
        professionalSituation: data.professionalSituation?.value || '',
        height: Math.round(parseFloat(data.height) * 100),
        submitted_at: new Date().toISOString(),
        submitted_by: 'AzizHasnaoui'
      };

      const response = await applyForMembership(formattedData);

      MySwal.fire({
        icon: 'success',
        title: response.message || 'Demande envoyée avec succès !',
        text: 'Veuillez patienter quelques heures pour recevoir une réponse.',
        confirmButtonColor: '#2ecc71',
        timer: 5000,
        timerProgressBar: true
      });

      reset();
      setStep(0);
      setEmailConfirmed(false);
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'La demande a échoué.',
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

      if (!emailConfirmed) {
        MySwal.fire({
          icon: 'warning',
          title: 'Email non confirmé',
          text: 'Veuillez confirmer votre adresse email avant de continuer.',
          confirmButtonColor: '#f39c12'
        });
        return;
      }

      setStep((s) => s + 1);
    } else if (step === 1) {
      fieldsToValidate = [
        'cin',
        'height',
        'hasMusicalKnowledge',
        ...(hasMusicalKnowledge ? ['musicalExperience'] : []),
        'isActiveInOtherChoir',
        ...(isActiveInOtherChoir ? ['otherChoir'] : []),
        'professionalSituation'
      ];
      const valid = await trigger(fieldsToValidate);
      if (valid) setStep((s) => s + 1);
    } else if (step === 2) {
      fieldsToValidate = ['motivation'];
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
            {/* {new Date().toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} */}
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
                              minLength: { value: 3, message: 'Minimum 3 caractères' },
                              pattern: {
                                value: /^[A-Za-zÀ-ÿ\s'-]+$/,
                                message: 'Le prénom ne doit contenir que des lettres'
                              }
                            })}
                            isInvalid={!!errors.firstName}
                            size="sm"
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
                              minLength: { value: 3, message: 'Minimum 3 caractères' },
                              pattern: {
                                value: /^[A-Za-zÀ-ÿ\s'-]+$/,
                                message: 'Le nom ne doit contenir que des lettres'
                              }
                            })}
                            isInvalid={!!errors.lastName}
                            size="sm"
                          />
                          <Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="email">
                          <Form.Label>Email</Form.Label>
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
                              disabled={emailConfirmed}
                              size="sm"
                            />
                            <EmailConfirmButton
                              size="sm"
                              variant={emailConfirmed ? 'success' : 'outline-primary'}
                              onClick={handleEmailConfirmation}
                              disabled={emailConfirmLoading || emailConfirmed}
                            >
                              {emailConfirmed ? 'Confirmé ✓' : emailConfirmLoading ? <Spinner size="sm" animation="border" /> : 'Confirmer'}
                            </EmailConfirmButton>
                          </InputGroup>
                          {errors.email && (
                            <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                              {errors.email.message}
                            </Form.Control.Feedback>
                          )}

                          {!emailConfirmed && (
                            <HelperText>
                              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                Un lien de confirmation sera envoyé à votre adresse.
                              </motion.span>
                            </HelperText>
                          )}

                          {!emailConfirmed && !emailConfirmLoading && (
                            <motion.div
                              className="mt-2"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <ActionButton size="sm" variant="outline-success" onClick={checkEmail} disabled={emailConfirmLoading}>
                                J'ai confirmé mon email
                              </ActionButton>
                            </motion.div>
                          )}

                          {emailConfirmed && (
                            <HelperText type="success">
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                              >
                                ✓
                              </motion.span>
                              Email confirmé avec succès
                            </HelperText>
                          )}
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group controlId="phone">
                          <Form.Label>Téléphone</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="23 200 300"
                            {...register('phone', {
                              required: 'Téléphone requis',
                              pattern: {
                                value: /^(5|9|2)[0-9]{7}$/,
                                message: 'Le numéro doit commencer par 5, 9 ou 2 et contenir 8 chiffres'
                              }
                            })}
                            isInvalid={!!errors.phone}
                            size="sm"
                          />
                          <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Continue with the remaining fields for step 0 */}
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
                                const today = new Date('2025-07-09'); // Using provided current date
                                const age = today.getFullYear() - birth.getFullYear();
                                const monthDiff = today.getMonth() - birth.getMonth();
                                const dayDiff = today.getDate() - birth.getDate();
                                const isOldEnough = age > 5 || (age === 5 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

                                return isOldEnough || 'L’âge minimum requis est de 5 ans';
                              }
                            })}
                            isInvalid={!!errors.birthDate}
                            size="sm"
                            max="2025-07-09" // Using provided current date
                          />
                          <Form.Control.Feedback type="invalid">{errors.birthDate?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="nationality">
                          <Form.Label>Nationalité</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Ex: Tunisienne"
                            {...register('nationality', {
                              required: 'Nationalité requise',
                              pattern: {
                                value: /^[A-Za-zÀ-ÿ\s'-]+$/,
                                message: 'La nationalité doit contenir uniquement des lettres'
                              }
                            })}
                            isInvalid={!!errors.nationality}
                            size="sm"
                          />
                          <Form.Control.Feedback type="invalid">{errors.nationality?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-between mt-4">
                      <div /> {/* Empty div for spacing */}
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
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="cin">
                          <Form.Label>CIN</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Numéro CIN"
                            {...register('cin', {
                              required: 'CIN requis',
                              pattern: {
                                value: /^[01][0-9]{7}$/,
                                message: 'Le CIN doit commencer par 0 ou 1 et contenir exactement 8 chiffres'
                              }
                            })}
                            isInvalid={!!errors.cin}
                            size="sm"
                          />
                          <Form.Control.Feedback type="invalid">{errors.cin?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="height">
                          <Form.Label>Taille (en mètre)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            placeholder="ex: 1.70"
                            {...register('height', {
                              required: 'Taille requise',
                              min: { value: 0.5, message: 'Taille trop petite' },
                              max: { value: 2.5, message: 'Taille trop grande' },
                              pattern: {
                                value: /^[0-9]+(\.[0-9]{1,2})?$/,
                                message: 'Format de taille invalide (ex: 1.70)'
                              }
                            })}
                            isInvalid={!!errors.height}
                            size="sm"
                          />
                          <Form.Control.Feedback type="invalid">{errors.height?.message}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group controlId="professionalSituation" className="mb-3">
                      <Form.Label>Situation professionnelle</Form.Label>
                      <Controller
                        name="professionalSituation"
                        control={control}
                        rules={{ required: 'Situation professionnelle requise' }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={professionalSituationOptions}
                            placeholder="Sélectionnez votre situation"
                            styles={customSelectStyles}
                            classNamePrefix="select"
                          />
                        )}
                      />
                      {errors.professionalSituation && (
                        <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                          {errors.professionalSituation.message}
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group controlId="hasMusicalKnowledge" className="mb-3">
                      <Form.Check type="checkbox" label="Avez-vous des connaissances musicales ?" {...register('hasMusicalKnowledge')} />
                    </Form.Group>

                    {hasMusicalKnowledge && (
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
                            rows={3}
                            placeholder="Décrivez votre expérience musicale..."
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
                      <Form.Check
                        type="checkbox"
                        label="Êtes-vous actif(ve) dans une autre chorale ?"
                        {...register('isActiveInOtherChoir')}
                      />
                    </Form.Group>

                    {isActiveInOtherChoir && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Form.Group controlId="otherChoir" className="mb-3">
                          <Form.Label>Nom de l'autre chorale</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Nom de la chorale"
                            {...register('otherChoir', {
                              required: "Le nom de l'autre chorale est requis"
                            })}
                            isInvalid={!!errors.otherChoir}
                          />
                          <Form.Control.Feedback type="invalid">{errors.otherChoir?.message}</Form.Control.Feedback>
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
                      <Form.Label>
                        Lettre de motivation
                        <span className="text-muted ms-2" style={{ fontSize: '0.875rem' }}>
                          (Pourquoi souhaitez-vous rejoindre le CSO ?)
                        </span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        placeholder="Décrivez vos motivations pour rejoindre notre chorale..."
                        {...register('motivation', {
                          required: 'La lettre de motivation est requise',
                          minLength: {
                            value: 50,
                            message: 'Veuillez écrire au moins 50 caractères'
                          }
                        })}
                        isInvalid={!!errors.motivation}
                      />
                      <Form.Control.Feedback type="invalid">{errors.motivation?.message}</Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Parlez-nous de votre passion pour la musique et de ce qui vous motive à rejoindre le CSO.
                      </Form.Text>
                    </Form.Group>

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
                        <div>{/* <strong>Candidat :</strong> {watch('firstName')} {watch('lastName')} */}</div>
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

          {/* Progress indicator */}
          <motion.div
            className="text-center mt-4 text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: '0.875rem' }}
          >
            Étape {step + 1} sur 3
          </motion.div>

          {/* Submission metadata */}
          <div
            className="text-center mt-3"
            style={{
              fontSize: '0.75rem',
              color: '#a0aec0'
            }}
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              {/* Formulaire mis à jour le{' '}
              {new Date('2025-07-09').toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} */}
              {/* <br />
              <span className="opacity-50">
                ID: {`CSO-${new Date('2025-07-09').getFullYear()}-${Math.random().toString(36).substr(2, 6)}`}
              </span> */}
            </motion.div>
          </div>
        </FormContent>
      </FormContainer>

      {/* Help text */}
      {/* <motion.div className="text-center mt-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          Vous avez des questions ? Contactez-nous à{' '}
          <a href="mailto:contact@cso.tn" className="text-primary text-decoration-none">
            contact@cso.tn
          </a>
        </p>
      </motion.div> */}
    </PageContainer>
  );
};

export default Formulaire;
