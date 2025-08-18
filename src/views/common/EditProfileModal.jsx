/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-useless-escape */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Row, Col, Image } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { updateCurrentUser } from '../../services/auth.service';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { BACKEND_URL } from '../../utils/axiosInstance';
import { FiUpload, FiCamera, FiX } from 'react-icons/fi';
import Joi from 'joi';

const genderOptions = [
  { value: 'Homme', label: 'Homme' },
  { value: 'Femme', label: 'Femme' }
];

// ✅ COMPREHENSIVE COUNTRIES LIST
const countryOptions = [
  { value: 'Afghane', label: 'Afghanistan' },
  { value: 'Albanaise', label: 'Albanie' },
  { value: 'Algérienne', label: 'Algérie' },
  { value: 'Allemande', label: 'Allemagne' },
  { value: 'Américaine', label: 'États-Unis' },
  { value: 'Andorrane', label: 'Andorre' },
  { value: 'Angolaise', label: 'Angola' },
  { value: 'Antiguaise-et-Barbudienne', label: 'Antigua-et-Barbuda' },
  { value: 'Argentine', label: 'Argentine' },
  { value: 'Arménienne', label: 'Arménie' },
  { value: 'Australienne', label: 'Australie' },
  { value: 'Autrichienne', label: 'Autriche' },
  { value: 'Azerbaïdjanaise', label: 'Azerbaïdjan' },
  { value: 'Bahaméenne', label: 'Bahamas' },
  { value: 'Bahreïnienne', label: 'Bahreïn' },
  { value: 'Bangladaise', label: 'Bangladesh' },
  { value: 'Barbadienne', label: 'Barbade' },
  { value: 'Belge', label: 'Belgique' },
  { value: 'Bélizienne', label: 'Belize' },
  { value: 'Béninoise', label: 'Bénin' },
  { value: 'Bhoutanaise', label: 'Bhoutan' },
  { value: 'Biélorusse', label: 'Biélorussie' },
  { value: 'Birmane', label: 'Myanmar' },
  { value: 'Bolivienne', label: 'Bolivie' },
  { value: 'Bosnienne', label: 'Bosnie-Herzégovine' },
  { value: 'Botswanaise', label: 'Botswana' },
  { value: 'Brésilienne', label: 'Brésil' },
  { value: 'Britannique', label: 'Royaume-Uni' },
  { value: 'Brunéienne', label: 'Brunéi' },
  { value: 'Bulgare', label: 'Bulgarie' },
  { value: 'Burkinabè', label: 'Burkina Faso' },
  { value: 'Burundaise', label: 'Burundi' },
  { value: 'Cambodgienne', label: 'Cambodge' },
  { value: 'Camerounaise', label: 'Cameroun' },
  { value: 'Canadienne', label: 'Canada' },
  { value: 'Cap-verdienne', label: 'Cap-Vert' },
  { value: 'Centrafricaine', label: 'République centrafricaine' },
  { value: 'Chilienne', label: 'Chili' },
  { value: 'Chinoise', label: 'Chine' },
  { value: 'Chypriote', label: 'Chypre' },
  { value: 'Colombienne', label: 'Colombie' },
  { value: 'Comorienne', label: 'Comores' },
  { value: 'Congolaise', label: 'République du Congo' },
  { value: 'Congolaise (RDC)', label: 'République démocratique du Congo' },
  { value: 'Costaricienne', label: 'Costa Rica' },
  { value: 'Croate', label: 'Croatie' },
  { value: 'Cubaine', label: 'Cuba' },
  { value: 'Danoise', label: 'Danemark' },
  { value: 'Djiboutienne', label: 'Djibouti' },
  { value: 'Dominicaine', label: 'République dominicaine' },
  { value: 'Dominiquaise', label: 'Dominique' },
  { value: 'Égyptienne', label: 'Égypte' },
  { value: 'Émirienne', label: 'Émirats arabes unis' },
  { value: 'Équatorienne', label: 'Équateur' },
  { value: 'Érythréenne', label: 'Érythrée' },
  { value: 'Espagnole', label: 'Espagne' },
  { value: 'Estonienne', label: 'Estonie' },
  { value: 'Éthiopienne', label: 'Éthiopie' },
  { value: 'Fidjienne', label: 'Fidji' },
  { value: 'Finlandaise', label: 'Finlande' },
  { value: 'Française', label: 'France' },
  { value: 'Gabonaise', label: 'Gabon' },
  { value: 'Gambienne', label: 'Gambie' },
  { value: 'Géorgienne', label: 'Géorgie' },
  { value: 'Ghanéenne', label: 'Ghana' },
  { value: 'Grecque', label: 'Grèce' },
  { value: 'Grenadienne', label: 'Grenade' },
  { value: 'Guatémaltèque', label: 'Guatemala' },
  { value: 'Guinéenne', label: 'Guinée' },
  { value: 'Équato-guinéenne', label: 'Guinée équatoriale' },
  { value: 'Bissau-guinéenne', label: 'Guinée-Bissau' },
  { value: 'Guyanienne', label: 'Guyana' },
  { value: 'Haïtienne', label: 'Haïti' },
  { value: 'Hondurienne', label: 'Honduras' },
  { value: 'Hongroise', label: 'Hongrie' },
  { value: 'Indienne', label: 'Inde' },
  { value: 'Indonésienne', label: 'Indonésie' },
  { value: 'Irakienne', label: 'Irak' },
  { value: 'Iranienne', label: 'Iran' },
  { value: 'Irlandaise', label: 'Irlande' },
  { value: 'Islandaise', label: 'Islande' },
  { value: 'Italienne', label: 'Italie' },
  { value: 'Ivoirienne', label: 'Côte d\'Ivoire' },
  { value: 'Jamaïcaine', label: 'Jamaïque' },
  { value: 'Japonaise', label: 'Japon' },
  { value: 'Jordanienne', label: 'Jordanie' },
  { value: 'Kazakhe', label: 'Kazakhstan' },
  { value: 'Kényane', label: 'Kenya' },
  { value: 'Kirghize', label: 'Kirghizistan' },
  { value: 'Kiribatienne', label: 'Kiribati' },
  { value: 'Koweïtienne', label: 'Koweït' },
  { value: 'Laotienne', label: 'Laos' },
  { value: 'Lesothane', label: 'Lesotho' },
  { value: 'Lettone', label: 'Lettonie' },
  { value: 'Libanaise', label: 'Liban' },
  { value: 'Libérienne', label: 'Libéria' },
  { value: 'Libyenne', label: 'Libye' },
  { value: 'Liechtensteinoise', label: 'Liechtenstein' },
  { value: 'Lituanienne', label: 'Lituanie' },
  { value: 'Luxembourgeoise', label: 'Luxembourg' },
  { value: 'Macédonienne', label: 'Macédoine du Nord' },
  { value: 'Malgache', label: 'Madagascar' },
  { value: 'Malaisienne', label: 'Malaisie' },
  { value: 'Malawienne', label: 'Malawi' },
  { value: 'Maldivienne', label: 'Maldives' },
  { value: 'Malienne', label: 'Mali' },
  { value: 'Maltaise', label: 'Malte' },
  { value: 'Marocaine', label: 'Maroc' },
  { value: 'Marshallaise', label: 'Îles Marshall' },
  { value: 'Mauricienne', label: 'Maurice' },
  { value: 'Mauritanienne', label: 'Mauritanie' },
  { value: 'Mexicaine', label: 'Mexique' },
  { value: 'Micronésienne', label: 'Micronésie' },
  { value: 'Moldave', label: 'Moldavie' },
  { value: 'Monégasque', label: 'Monaco' },
  { value: 'Mongole', label: 'Mongolie' },
  { value: 'Monténégrine', label: 'Monténégro' },
  { value: 'Mozambicaine', label: 'Mozambique' },
  { value: 'Namibienne', label: 'Namibie' },
  { value: 'Nauruane', label: 'Nauru' },
  { value: 'Népalaise', label: 'Népal' },
  { value: 'Nicaraguayenne', label: 'Nicaragua' },
  { value: 'Nigérienne', label: 'Niger' },
  { value: 'Nigériane', label: 'Nigéria' },
  { value: 'Nord-coréenne', label: 'Corée du Nord' },
  { value: 'Norvégienne', label: 'Norvège' },
  { value: 'Néo-zélandaise', label: 'Nouvelle-Zélande' },
  { value: 'Omanaise', label: 'Oman' },
  { value: 'Ougandaise', label: 'Ouganda' },
  { value: 'Ouzbèke', label: 'Ouzbékistan' },
  { value: 'Pakistanaise', label: 'Pakistan' },
  { value: 'Palaosienne', label: 'Palaos' },
  { value: 'Palestinienne', label: 'Palestine' },
  { value: 'Panaméenne', label: 'Panama' },
  { value: 'Papouane-néo-guinéenne', label: 'Papouasie-Nouvelle-Guinée' },
  { value: 'Paraguayenne', label: 'Paraguay' },
  { value: 'Néerlandaise', label: 'Pays-Bas' },
  { value: 'Péruvienne', label: 'Pérou' },
  { value: 'Philippine', label: 'Philippines' },
  { value: 'Polonaise', label: 'Pologne' },
  { value: 'Portugaise', label: 'Portugal' },
  { value: 'Qatarienne', label: 'Qatar' },
  { value: 'Roumaine', label: 'Roumanie' },
  { value: 'Russe', label: 'Russie' },
  { value: 'Rwandaise', label: 'Rwanda' },
  { value: 'Saint-kittsienne-et-névicienne', label: 'Saint-Kitts-et-Nevis' },
  { value: 'Saint-lucienne', label: 'Sainte-Lucie' },
  { value: 'Saint-marinaise', label: 'Saint-Marin' },
  { value: 'Saint-vincentaise-et-grenadine', label: 'Saint-Vincent-et-les-Grenadines' },
  { value: 'Salomonaise', label: 'Îles Salomon' },
  { value: 'Salvadorienne', label: 'Salvador' },
  { value: 'Samoane', label: 'Samoa' },
  { value: 'São-toméenne', label: 'São Tomé-et-Principe' },
  { value: 'Saoudienne', label: 'Arabie saoudite' },
  { value: 'Sénégalaise', label: 'Sénégal' },
  { value: 'Serbe', label: 'Serbie' },
  { value: 'Seychelloise', label: 'Seychelles' },
  { value: 'Sierra-léonaise', label: 'Sierra Leone' },
  { value: 'Singapourienne', label: 'Singapour' },
  { value: 'Slovaque', label: 'Slovaquie' },
  { value: 'Slovène', label: 'Slovénie' },
  { value: 'Somalienne', label: 'Somalie' },
  { value: 'Soudanaise', label: 'Soudan' },
  { value: 'Sud-africaine', label: 'Afrique du Sud' },
  { value: 'Sud-coréenne', label: 'Corée du Sud' },
  { value: 'Sud-soudanaise', label: 'Soudan du Sud' },
  { value: 'Sri-lankaise', label: 'Sri Lanka' },
  { value: 'Suédoise', label: 'Suède' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Surinamaise', label: 'Suriname' },
  { value: 'Swazie', label: 'Eswatini' },
  { value: 'Syrienne', label: 'Syrie' },
  { value: 'Tadjike', label: 'Tadjikistan' },
  { value: 'Tanzanienne', label: 'Tanzanie' },
  { value: 'Tchadienne', label: 'Tchad' },
  { value: 'Tchèque', label: 'République tchèque' },
  { value: 'Thaïlandaise', label: 'Thaïlande' },
  { value: 'Timoraise', label: 'Timor oriental' },
  { value: 'Togolaise', label: 'Togo' },
  { value: 'Tongienne', label: 'Tonga' },
  { value: 'Trinidadienne', label: 'Trinité-et-Tobago' },
  { value: 'Tunisie', label: 'Tunisie' },
  { value: 'Turkmène', label: 'Turkménistan' },
  { value: 'Turque', label: 'Turquie' },
  { value: 'Tuvaluane', label: 'Tuvalu' },
  { value: 'Ukrainienne', label: 'Ukraine' },
  { value: 'Uruguayenne', label: 'Uruguay' },
  { value: 'Vanuatuane', label: 'Vanuatu' },
  { value: 'Vaticane', label: 'Vatican' },
  { value: 'Vénézuélienne', label: 'Venezuela' },
  { value: 'Vietnamienne', label: 'Viêt Nam' },
  { value: 'Yéménite', label: 'Yémen' },
  { value: 'Zambienne', label: 'Zambie' },
  { value: 'Zimbabwéenne', label: 'Zimbabwe' }
];

// ✅ COMPREHENSIVE JOI VALIDATION SCHEMA
const getValidationSchema = (userRole) => {
  const baseSchema = {
    firstName: Joi.string().trim().min(2).max(50).required().messages({
      'string.empty': 'Le prénom est requis',
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
      'any.required': 'Le prénom est requis'
    }),

    lastName: Joi.string().trim().min(2).max(50).required().messages({
      'string.empty': 'Le nom est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères',
      'any.required': 'Le nom est requis'
    })
  };

  // Add phone validation for manager and choriste
  if (userRole === 'manager' || userRole === 'choriste') {
    baseSchema.phone = Joi.string()
      .trim()
      .pattern(/^[\+]?[1-9][\d\s\-\(\)]{7,15}$/)
      .required()
      .messages({
        'string.empty': 'Le téléphone est requis',
        'string.pattern.base': 'Le format du téléphone est invalide',
        'any.required': 'Le téléphone est requis'
      });
  }

  // Add additional validations for choriste
  if (userRole === 'choriste') {
    baseSchema.gender = Joi.string().valid('Homme', 'Femme').required().messages({
      'string.empty': 'Le genre est requis',
      'any.only': 'Veuillez sélectionner un genre valide',
      'any.required': 'Le genre est requis'
    });

    baseSchema.nationality = Joi.string().required().messages({
      'string.empty': 'La nationalité est requise',
      'any.required': 'La nationalité est requise'
    });

    baseSchema.birthDate = Joi.date().max('now').required().messages({
      'date.base': 'La date de naissance est invalide',
      'date.max': 'La date de naissance ne peut pas être dans le futur',
      'any.required': 'La date de naissance est requise'
    });
  }

  return Joi.object(baseSchema);
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: '12px',
    border: state.isFocused ? '2px solid #1e3a5f' : '2px solid #e9ecef',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(30, 58, 95, 0.1)' : 'none',
    padding: '4px 8px',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: '#1e3a5f'
    }
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#1e3a5f' : state.isFocused ? '#f8f9fa' : 'white',
    color: state.isSelected ? 'white' : '#495057',
    padding: '12px 16px',
    cursor: 'pointer'
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: '200px'
  })
};

const EditProfileModal = ({ show, onHide }) => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({});
  const [originalForm, setOriginalForm] = useState({}); // ✅ TRACK ORIGINAL VALUES
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (user) {
      const initialForm = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        gender: user.gender || '',
        nationality: user.nationality || '',
        birthDate: user.birthDate ? user.birthDate.slice(0, 10) : ''
      };

      setForm(initialForm);
      setOriginalForm(initialForm); // ✅ STORE ORIGINAL VALUES
      setErrors({});
      setTouched({});

      if (user.avatar) {
        setPreview(user.avatar.startsWith('/uploads') ? `${BACKEND_URL}${user.avatar}` : `${BACKEND_URL}/uploads/avatars/${user.avatar}`);
      } else {
        setPreview(null);
      }
    }
  }, [user, show]);

  // ✅ CHECK IF FORM HAS CHANGED
  const hasFormChanged = () => {
    // Check if text fields have changed
    const textFieldsChanged = Object.keys(originalForm).some((key) => {
      return form[key] !== originalForm[key];
    });

    // Check if avatar has changed (new file uploaded)
    const avatarChanged = form.avatar instanceof File;

    return textFieldsChanged || avatarChanged;
  };

  // ✅ VALIDATE SINGLE FIELD
  const validateField = (name, value) => {
    const schema = getValidationSchema(user?.role);
    const fieldSchema = schema.extract(name);
    if (!fieldSchema) return null;

    const { error } = fieldSchema.validate(value);
    return error ? error.details[0].message : null;
  };

  // ✅ VALIDATE ALL FIELDS - ONLY CHECK REQUIRED FIELDS FOR USER'S ROLE
  const validateForm = () => {
    const schema = getValidationSchema(user?.role);

    // ✅ CREATE VALIDATION DATA BASED ON USER ROLE
    const validationData = {
      firstName: form.firstName,
      lastName: form.lastName
    };

    // Add role-specific fields
    if (user?.role === 'manager' || user?.role === 'choriste') {
      validationData.phone = form.phone;
    }

    if (user?.role === 'choriste') {
      validationData.gender = form.gender;
      validationData.nationality = form.nationality;
      validationData.birthDate = form.birthDate;
    }

    const { error } = schema.validate(validationData, { abortEarly: false });

    if (error) {
      const newErrors = {};
      error.details.forEach((detail) => {
        newErrors[detail.path[0]] = detail.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // ✅ CHECK IF FORM IS READY FOR SUBMISSION
  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName'];

    if (user?.role === 'manager' || user?.role === 'choriste') {
      requiredFields.push('phone');
    }

    if (user?.role === 'choriste') {
      requiredFields.push('gender', 'nationality', 'birthDate');
    }

    return requiredFields.every((field) => {
      const value = form[field];
      return value && value.toString().trim() !== '';
    });
  };

  // ✅ CHECK IF SUBMIT BUTTON SHOULD BE ENABLED
  const canSubmit = () => {
    return isFormValid() && hasFormChanged() && !isLoading;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Real-time validation ONLY if field was touched
    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, form[name]);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError
    }));
  };

  const handleSelectChange = (field, selected) => {
    const value = selected?.value || '';
    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const fieldError = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: fieldError
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'warning',
          title: 'Format non supporté',
          text: 'Veuillez sélectionner une photo au format JPG, PNG ou GIF.',
          confirmButtonColor: '#1e3a5f'
        });
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        Swal.fire({
          icon: 'warning',
          title: 'Fichier trop volumineux',
          text: 'La taille du fichier ne doit pas dépasser 5MB.',
          confirmButtonColor: '#1e3a5f'
        });
        e.target.value = '';
        return;
      }

      setForm((prev) => ({ ...prev, avatar: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VALIDATE ALL FIELDS ONLY ON SUBMIT
    if (!validateForm()) {
      // Mark all required fields as touched to show errors
      const requiredFields = ['firstName', 'lastName'];
      if (user?.role === 'manager' || user?.role === 'choriste') {
        requiredFields.push('phone');
      }
      if (user?.role === 'choriste') {
        requiredFields.push('gender', 'nationality', 'birthDate');
      }

      const newTouched = {};
      requiredFields.forEach((field) => {
        newTouched[field] = true;
      });
      setTouched(newTouched);

      Swal.fire({
        icon: 'warning',
        title: 'Données invalides',
        text: 'Veuillez remplir tous les champs requis correctement.',
        confirmButtonColor: '#1e3a5f'
      });
      return;
    }

    // ✅ CHECK IF ANYTHING CHANGED
    if (!hasFormChanged()) {
      Swal.fire({
        icon: 'info',
        title: 'Aucune modification',
        text: "Vous n'avez effectué aucune modification.",
        confirmButtonColor: '#1e3a5f'
      });
      return;
    }

    setIsLoading(true);

    try {
      await updateCurrentUser(form);
      await refreshUser();

      Swal.fire({
        icon: 'success',
        title: 'Profil mis à jour !',
        text: 'Vos informations ont été mises à jour avec succès.',
        timer: 2000,
        showConfirmButton: true,
        confirmButtonColor: '#1e3a5f'
      });

      onHide();
    } catch (err) {
      const errorData = err.response?.data;
      const errorType = errorData?.type;

      if (errorType === 'FILE_FORMAT_ERROR') {
        Swal.fire({
          icon: 'warning',
          title: 'Format non supporté',
          text: 'Veuillez sélectionner une photo au format JPG, PNG ou GIF.',
          confirmButtonColor: '#1e3a5f'
        });
      } else {
        const errorMessage = errorData?.message || err.message || 'Échec de la mise à jour du profil.';
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
          confirmButtonColor: '#1e3a5f'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isManagerOrChoriste = user?.role === 'manager' || user?.role === 'choriste';

  // ✅ ONLY SHOW ERRORS FOR TOUCHED FIELDS
  const visibleErrors = Object.keys(errors).filter((key) => touched[key] && errors[key]);
  const hasVisibleErrors = visibleErrors.length > 0;

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
        <div style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <Form onSubmit={handleSubmit}>
            {/* ✅ HEADER WITH WHITE CLOSE BUTTON */}
            <Modal.Header
              className="border-0 position-relative"
              style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #23395d 100%)',
                color: 'white',
                padding: '1.5rem 2rem'
              }}
            >
              <Modal.Title className="fw-bold fs-4">Modifier le Profil</Modal.Title>

              {/* ✅ CUSTOM WHITE CLOSE BUTTON */}
              <button
                type="button"
                className="position-absolute edit-modal-close-btn"
                onClick={onHide}
                style={{
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '50%',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <FiX size={20} />
              </button>
            </Modal.Header>

            {/* Body */}
            <Modal.Body className="p-4" style={{ background: '#f8f9fa' }}>
              {/* Avatar Section */}
              <div className="text-center mb-5">
                <div className="position-relative d-inline-block">
                  <div
                    className="avatar-wrapper position-relative"
                    style={{
                      width: '140px',
                      height: '140px',
                      margin: '0 auto',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e9ecef, #f8f9fa)',
                      padding: '4px',
                      boxShadow: '0 8px 25px rgba(30, 58, 95, 0.15)'
                    }}
                  >
                    <Image
                      src={preview || '/default-avatar.jpg'}
                      alt="Avatar"
                      roundedCircle
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        border: '4px solid white'
                      }}
                    />

                    <label
                      htmlFor="avatarUpload"
                      className="position-absolute d-flex align-items-center justify-content-center avatar-upload-btn"
                      style={{
                        bottom: '8px',
                        right: '8px',
                        width: '44px',
                        height: '44px',
                        background: 'linear-gradient(135deg, #1e3a5f, #23395d)',
                        color: 'white',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: '3px solid white',
                        boxShadow: '0 4px 15px rgba(30, 58, 95, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <FiCamera size={18} />
                    </label>
                  </div>

                  <Form.Control
                    id="avatarUpload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="mt-3">
                  <p className="text-muted mb-1 fw-medium" style={{ fontSize: '14px' }}>
                    Cliquez sur l'icône pour changer votre photo
                  </p>
                  <small className="text-muted">
                    <strong>Formats acceptés:</strong> JPG, PNG, GIF (max 5MB)
                  </small>
                </div>
              </div>

              {/* Form Fields */}
              <div
                className="form-section p-4 mb-4"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid rgba(30, 58, 95, 0.1)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}
              >
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-dark mb-2">
                        Prénom <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={form.firstName || ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur('firstName')}
                        isInvalid={touched.firstName && errors.firstName}
                        required
                        style={{
                          borderRadius: '12px',
                          border: touched.firstName && errors.firstName ? '2px solid #dc3545' : '2px solid #e9ecef',
                          padding: '12px 16px',
                          fontSize: '15px',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          if (!(touched.firstName && errors.firstName)) {
                            e.target.style.borderColor = '#1e3a5f';
                          }
                        }}
                      />
                      {touched.firstName && errors.firstName && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {errors.firstName}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-dark mb-2">
                        Nom <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={form.lastName || ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur('lastName')}
                        isInvalid={touched.lastName && errors.lastName}
                        required
                        style={{
                          borderRadius: '12px',
                          border: touched.lastName && errors.lastName ? '2px solid #dc3545' : '2px solid #e9ecef',
                          padding: '12px 16px',
                          fontSize: '15px',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          if (!(touched.lastName && errors.lastName)) {
                            e.target.style.borderColor = '#1e3a5f';
                          }
                        }}
                      />
                      {touched.lastName && errors.lastName && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {errors.lastName}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>

                  {isManagerOrChoriste && (
                    <Col md={12}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold text-dark mb-2">
                          Téléphone <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={form.phone || ''}
                          onChange={handleChange}
                          onBlur={() => handleBlur('phone')}
                          isInvalid={touched.phone && errors.phone}
                          placeholder="Ex: +33 6 12 34 56 78"
                          required
                          style={{
                            borderRadius: '12px',
                            border: touched.phone && errors.phone ? '2px solid #dc3545' : '2px solid #e9ecef',
                            padding: '12px 16px',
                            fontSize: '15px',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={(e) => {
                            if (!(touched.phone && errors.phone)) {
                              e.target.style.borderColor = '#1e3a5f';
                            }
                          }}
                        />
                        {touched.phone && errors.phone && (
                          <Form.Control.Feedback type="invalid" className="d-block">
                            {errors.phone}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  )}

                  {user?.role === 'choriste' && (
                    <>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold text-dark mb-2">
                            Genre <span className="text-danger">*</span>
                          </Form.Label>
                          <Select
                            options={genderOptions}
                            value={genderOptions.find((o) => o.value === form.gender) || null}
                            onChange={(opt) => handleSelectChange('gender', opt)}
                            onBlur={() => handleBlur('gender')}
                            placeholder="Sélectionner"
                            styles={customSelectStyles}
                            isSearchable={false}
                          />
                          {touched.gender && errors.gender && <div className="invalid-feedback d-block">{errors.gender}</div>}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold text-dark mb-2">
                            Nationalité <span className="text-danger">*</span>
                          </Form.Label>
                          <Select
                            options={countryOptions}
                            value={countryOptions.find((o) => o.value === form.nationality) || null}
                            onChange={(opt) => handleSelectChange('nationality', opt)}
                            onBlur={() => handleBlur('nationality')}
                            placeholder="Rechercher votre nationalité..."
                            styles={customSelectStyles}
                            isSearchable={true}
                            isClearable={true}
                            noOptionsMessage={() => 'Aucune nationalité trouvée'}
                          />
                          {touched.nationality && errors.nationality && (
                            <div className="invalid-feedback d-block">{errors.nationality}</div>
                          )}
                        </Form.Group>
                      </Col>

                      <Col xs={12}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold text-dark mb-2">
                            Date de naissance <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="birthDate"
                            value={form.birthDate || ''}
                            onChange={handleChange}
                            onBlur={() => handleBlur('birthDate')}
                            isInvalid={touched.birthDate && errors.birthDate}
                            max={new Date().toISOString().split('T')[0]}
                            required
                            style={{
                              borderRadius: '12px',
                              border: touched.birthDate && errors.birthDate ? '2px solid #dc3545' : '2px solid #e9ecef',
                              padding: '12px 16px',
                              fontSize: '15px',
                              transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                              if (!(touched.birthDate && errors.birthDate)) {
                                e.target.style.borderColor = '#1e3a5f';
                              }
                            }}
                          />
                          {touched.birthDate && errors.birthDate && (
                            <Form.Control.Feedback type="invalid" className="d-block">
                              {errors.birthDate}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </>
                  )}
                </Row>
              </div>

              {/* ✅ CHANGE INDICATOR */}
              {/* {hasFormChanged() && (
                <div className="alert alert-info mb-4 d-flex align-items-center change-indicator">
                  <div className="me-2">
                    <div 
                      className="pulse-dot"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#1e3a5f'
                      }}
                    />
                  </div>
                  <span className="fw-medium">Des modifications ont été détectées</span>
                </div>
              )} */}
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer className="border-0 px-4 pb-4" style={{ background: '#f8f9fa' }}>
              <Button
                variant="outline-secondary"
                onClick={onHide}
                disabled={isLoading}
                className="px-4 py-2 fw-semibold"
                style={{
                  borderRadius: '12px',
                  border: '2px solid #6c757d',
                  transition: 'all 0.2s ease'
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!canSubmit()}
                className="px-5 py-2 fw-semibold ms-2 submit-btn"
                style={{
                  background: !canSubmit() ? '#6c757d' : 'linear-gradient(135deg, #1e3a5f, #23395d)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: !canSubmit() ? 'none' : '0 4px 15px rgba(30, 58, 95, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: !canSubmit() ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (canSubmit()) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(30, 58, 95, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSubmit()) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(30, 58, 95, 0.3)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FiUpload className="me-2" size={16} />
                    Enregistrer
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </div>
      </Modal>

      {/* ✅ REGULAR CSS STYLES */}
      <style>{`
        .edit-modal-close-btn:hover {
          background-color: rgba(255,255,255,0.1) !important;
        }

        .avatar-upload-btn:hover {
          transform: scale(1.1);
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(30, 58, 95, 0.4);
        }

        .pulse-dot {
          animation: editModalPulse 2s infinite;
        }

        @keyframes editModalPulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }

        .change-indicator {
          border-left: 4px solid #1e3a5f;
          background-color: rgba(30, 58, 95, 0.05);
          border-color: rgba(30, 58, 95, 0.2);
        }

        @media (max-width: 768px) {
          .submit-btn {
            width: 100%;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </>
  );
};

EditProfileModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired
};

export default EditProfileModal;