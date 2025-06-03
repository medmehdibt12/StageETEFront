/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Form, Button, Col, Row, Tabs, Tab } from 'react-bootstrap';
import Select from 'react-select';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import logoCSO from '../../../assets/images/music.png';

// Import your API call
import { applyForMembership } from '../../../services/auth.service'; // Adjust path if needed

const MySwal = withReactContent(Swal);

const genreOptions = [
  { value: 'Homme', label: 'Homme' },
  { value: 'Femme', label: 'Femme' }
];

const Formulaire = () => {
  const [step, setStep] = useState(0);

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
      professionalSituation: ''
    }
  });

  const hasMusicalKnowledge = watch('hasMusicalKnowledge');
  const isActiveInOtherChoir = watch('isActiveInOtherChoir');

  // Submit handler with API call
  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        gender: data.gender?.value || '', // extract string from react-select option
        height: Math.round(parseFloat(data.height) * 100)
      };
      // console.log('Submitting data:', formattedData); // Debug

      const response = await applyForMembership(formattedData);

      Swal.fire({
        title: response.message || 'Demande envoyée avec succès !',
        text: 'Veuillez patienter quelques heures pour recevoir une réponse.',
        icon: 'success',
        confirmButtonText: 'OK'
      });

      reset();
      setStep(0);
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'La demande a échoué.'
      });
    }
  };

  // Next button handler with validation only for current step fields
  const handleNext = async () => {
    // Define step-specific fields to validate
    let fieldsToValidate = [];
    if (step === 0) fieldsToValidate = ['firstName', 'lastName', 'email', 'phone', 'gender', 'birthDate', 'nationality'];
    else if (step === 1)
      fieldsToValidate = [
        'cin',
        'height',
        'hasMusicalKnowledge',
        ...(hasMusicalKnowledge ? ['musicalExperience'] : []),
        'isActiveInOtherChoir',
        ...(isActiveInOtherChoir ? ['otherChoir'] : []),
        'professionalSituation'
      ];
    else if (step === 2) fieldsToValidate = ['motivation'];

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <>
      <Form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 700, margin: 'auto', padding: '1rem' }}>
        <div
          style={{
            maxWidth: 700,
            margin: '1rem auto 2rem auto',
            padding: '1rem 1.5rem',

            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <img src={logoCSO} alt="CSO Logo" style={{ height: 70, width: 'auto', marginBottom: 12, objectFit: 'contain' }} />
          <h2
            style={{
              fontWeight: 600,
              fontSize: '2.0rem',
              color: '#222',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '0.03em'
            }}
          >
            Formulaire de candidature au CSO
          </h2>
        </div>

        <Tabs
          activeKey={step}
          className="mb-3"
          onSelect={(k) => {
            if (k < step) setStep(k);
          }}
          id="controlled-tab"
        >
          <Tab eventKey={0} title="Informations personnelles" disabled={step !== 0}>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="firstName">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Prénom"
                    {...register('firstName', { required: 'Prénom requis' })}
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
                    placeholder="Nom"
                    {...register('lastName', { required: 'Nom requis' })}
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
                  <Form.Control
                    type="email"
                    placeholder="email@example.com"
                    {...register('email', {
                      required: 'Email requis',
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Email invalide'
                      }
                    })}
                    isInvalid={!!errors.email}
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group controlId="phone">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="23 200 300"
                    {...register('phone', { required: 'Téléphone requis' })}
                    isInvalid={!!errors.phone}
                    size="sm"
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
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: 35,
                        fontSize: 14
                      }),
                      menu: (base) => ({ ...base, fontSize: 14 })
                    }}
                  />
                )}
              />
              {errors.gender && (
                <div className="text-danger mt-1" style={{ fontSize: 12 }}>
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
                    {...register('birthDate', { required: 'Date de naissance requise' })}
                    isInvalid={!!errors.birthDate}
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid">{errors.birthDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group controlId="nationality">
                  <Form.Label>Nationalité</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: Française"
                    {...register('nationality', { required: 'Nationalité requise' })}
                    isInvalid={!!errors.nationality}
                    size="sm"
                  />
                  <Form.Control.Feedback type="invalid">{errors.nationality?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button size="sm" variant="primary" onClick={handleNext}>
                Suivant
              </Button>
            </div>
          </Tab>

          <Tab eventKey={1} title="Détails supplémentaires" disabled={step !== 1}>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="cin">
                  <Form.Label>CIN</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="CIN"
                    {...register('cin', { required: 'CIN requis' })}
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
                      max: { value: 2.5, message: 'Taille trop grande' }
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
              <Form.Control
                type="text"
                placeholder="Votre situation professionnelle"
                {...register('professionalSituation', { required: 'Situation professional requis' })}
                isInvalid={!!errors.professionalSituation}
                size="sm"
              />
              <Form.Control.Feedback type="invalid">{errors.professionalSituation?.message}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="hasMusicalKnowledge" className="mb-3">
              <Form.Check
                type="checkbox"
                label="Avez-vous des connaissances musicales ?"
                {...register('hasMusicalKnowledge')}
                isInvalid={!!errors.hasMusicalKnowledge}
                size="sm"
              />
            </Form.Group>

            {hasMusicalKnowledge && (
              <Form.Group controlId="musicalExperience" className="mb-3">
                <Form.Label>Expérience musicale</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Décrivez votre expérience musicale"
                  {...register('musicalExperience', {
                    required: 'Expérience musicale requise'
                  })}
                  isInvalid={!!errors.musicalExperience}
                  size="sm"
                />
                <Form.Control.Feedback type="invalid">{errors.musicalExperience?.message}</Form.Control.Feedback>
              </Form.Group>
            )}

            <Form.Group controlId="isActiveInOtherChoir" className="mb-3">
              <Form.Check
                type="checkbox"
                label="Êtes-vous actif(ve) dans une autre chorale ?"
                {...register('isActiveInOtherChoir')}
                isInvalid={!!errors.isActiveInOtherChoir}
                size="sm"
              />
            </Form.Group>

            {isActiveInOtherChoir && (
              <Form.Group controlId="otherChoir" className="mb-3">
                <Form.Label>Nom de l'autre chorale</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nom de l'autre chorale"
                  {...register('otherChoir', {
                    required: "Le nom de l'autre chorale est requis"
                  })}
                  isInvalid={!!errors.otherChoir}
                  size="sm"
                />
                <Form.Control.Feedback type="invalid">{errors.otherChoir?.message}</Form.Control.Feedback>
              </Form.Group>
            )}

            <div className="d-flex justify-content-between">
              <Button size="sm" variant="secondary" onClick={() => setStep(0)}>
                Précédent
              </Button>
              <Button size="sm" variant="primary" onClick={handleNext}>
                Suivant
              </Button>
            </div>
          </Tab>

          <Tab eventKey={2} title="Motivation" disabled={step !== 2}>
            <Form.Group controlId="motivation" className="mb-3">
              <Form.Label>Motivation</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Expliquez votre motivation"
                {...register('motivation', { required: 'Motivation requise' })}
                isInvalid={!!errors.motivation}
                size="sm"
              />
              <Form.Control.Feedback type="invalid">{errors.motivation?.message}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button size="sm" variant="secondary" onClick={() => setStep(1)}>
                Précédent
              </Button>
              <Button size="sm" variant="success" type="submit">
                Envoyer
              </Button>
            </div>
          </Tab>
        </Tabs>
        <div className="text-center mt-4">
          <span>Déjà membre ? </span>
          <Button variant="link" className="f-w-400 p-0" onClick={() => (window.location.href = '/auth/signin')}>
            Connectez-vous
          </Button>
        </div>
      </Form>
    </>
  );
};

export default Formulaire;
