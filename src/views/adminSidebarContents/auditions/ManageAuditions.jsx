/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Container, Card, Button, Table, Spinner, Modal, Form, Row, Col, Badge, Dropdown, Alert, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaCalendarAlt,
  FaEye,
  FaClock,
  FaUserCheck,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSearch,
  FaFilter,
  FaMicrophone,
  FaCheckCircle,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  listAuditionParameters,
  saveAuditionParameters,
  updateAuditionParameters,
  deleteAuditionParameters,
  generateAuditions,
  checkPlanningExists,
  getConfirmedCandidatesForAudition
} from '../../../services/auditions.service';

import {
  createAuditionEvaluation,
  updateAuditionEvaluation,
  getAuditionEvaluation,
  getTessitureOptions,
  getCandidateCharterStatus
} from '../../../services/evaluation.service';

import { getMembershipSubmissions } from '../../../services/accounts.service';

const ManageAuditions = () => {
  const [paramsList, setParamsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [editingParam, setEditingParam] = useState(null);
  const [selectedParam, setSelectedParam] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pauseError, setPauseError] = useState('');
  const [pendingCandidatesCount, setPendingCandidatesCount] = useState(0);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [planningStatus, setPlanningStatus] = useState({});
  const [planningDetails, setPlanningDetails] = useState(null);
  const [loadingPlanning, setLoadingPlanning] = useState(false);
  const [evaluations, setEvaluations] = useState({});
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);

  // Confirmed candidates count
  const [confirmedCounts, setConfirmedCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Evaluation modal states
  const [hasChanges, setHasChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [editingEvaluation, setEditingEvaluation] = useState(null);

  // ✅ NEW: Main table pagination (0-based like RescheduleCandidate)
  const [mainCurrentPage, setMainCurrentPage] = useState(0);
  const [mainItemsPerPage, setMainItemsPerPage] = useState(5);
  const [mainSearchQuery, setMainSearchQuery] = useState('');

  // Planning modal pagination and filter states
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHourFilter, setSelectedHourFilter] = useState('');
  const [selectedDecisionFilter, setSelectedDecisionFilter] = useState('');
  const [selectedPupitreFilter, setSelectedPupitreFilter] = useState('');

  const pageSizeOptions = [5, 10, 25, 50, 100];

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  // Form for planning parameters
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      saison: currentYear,
      startDate: '',
      endDate: '',
      candidateCount: '',
      sessionStartTime: '08:00',
      sessionEndTime: '18:00',
      debutPause: '',
      finPause: ''
    }
  });

  // Form for evaluation with enhanced functionality
  const {
    register: registerEval,
    handleSubmit: handleSubmitEval,
    reset: resetEval,
    watch: watchEval,
    setValue: setValueEval,
    getValues: getValuesEval,
    trigger: triggerEval,
    formState: { errors: errorsEval, isSubmitting }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      tessiture: '',
      oeuvreChante: '',
      remarque: '',
      note: '',
      ordrePassage: '',
      decision: ''
    }
  });

  const [tessitureOptions, setTessitureOptions] = useState([]);
  const [loadingTessiture, setLoadingTessiture] = useState(false);

  const watchAll = watch();
  const watchedEvalValues = watchEval();
  const { startDate, endDate, sessionStartTime, sessionEndTime, candidateCount, debutPause, finPause } = watchAll;

  // Note options for evaluation
  const noteOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A', label: 'A' },
    { value: 'B+', label: 'B+' },
    { value: 'B*', label: 'B*' },
    { value: 'B-', label: 'B-' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' }
  ];

  // Decision options for evaluation
  const decisionOptions = [
    { value: 'Retenu', label: 'Retenu' },
    { value: 'Non Retenu', label: 'Non Retenu' },
    { value: 'En Attente', label: 'En Attente' }
  ];

  // Filter options
  const decisionFilterOptions = [
    { value: '', label: 'Toutes les décisions' },
    { value: 'Retenu', label: 'Retenu' },
    { value: 'Non Retenu', label: 'Non Retenu' },
    { value: 'En Attente', label: 'En Attente' },
    { value: 'Non évalué', label: 'Non évalué' }
  ];

  const pupitreFilterOptions = [
    { value: '', label: 'Tous les pupitres' },
    { value: 'soprano', label: 'Soprano' },
    { value: 'alto', label: 'Alto' },
    { value: 'ténor', label: 'Ténor' },
    { value: 'basse', label: 'Basse' }
  ];

  // Validation rules for evaluation
  const validationRules = {
    tessiture: { required: 'Tessiture requise' },
    note: { required: 'Note requise' },
    oeuvreChante: { required: 'Œuvre chantée requise' },
    remarque: { required: 'Remarques requises' },
    decision: { required: 'Décision requise' }
  };

  // ✅ NEW: Main table filtering and pagination logic
  const getFilteredParams = () => {
    if (!mainSearchQuery.trim()) return paramsList;

    return paramsList.filter((param) => {
      const searchText = mainSearchQuery.toLowerCase();
      const saison = param.saison?.toString().toLowerCase() || '';
      const candidateCount = param.candidateCount?.toString().toLowerCase() || '';
      const startDate = new Date(param.startDate).toLocaleDateString('fr-FR').toLowerCase();
      const endDate = new Date(param.endDate).toLocaleDateString('fr-FR').toLowerCase();

      return saison.includes(searchText) || 
             candidateCount.includes(searchText) || 
             startDate.includes(searchText) || 
             endDate.includes(searchText);
    });
  };

  const getMainTotalItems = () => getFilteredParams().length;
  const getMainTotalPages = () => Math.ceil(getMainTotalItems() / mainItemsPerPage);
  const getMainStartIndex = () => (getMainTotalItems() === 0 ? 0 : mainCurrentPage * mainItemsPerPage + 1);
  const getMainEndIndex = () => Math.min((mainCurrentPage + 1) * mainItemsPerPage, getMainTotalItems());

  const getPaginatedParams = () => {
    const filteredParams = getFilteredParams();
    const startIndex = mainCurrentPage * mainItemsPerPage;
    const endIndex = startIndex + mainItemsPerPage;
    return filteredParams.slice(startIndex, endIndex);
  };

  const handleMainPageSizeChange = (newSize) => {
    setMainItemsPerPage(newSize);
    setMainCurrentPage(0);
  };

  const goToMainFirstPage = () => setMainCurrentPage(0);
  const goToMainPreviousPage = () => setMainCurrentPage(Math.max(0, mainCurrentPage - 1));
  const goToMainNextPage = () => setMainCurrentPage(Math.min(getMainTotalPages() - 1, mainCurrentPage + 1));
  const goToMainLastPage = () => setMainCurrentPage(getMainTotalPages() - 1);

  const isMainFirstPage = () => mainCurrentPage === 0;
  const isMainLastPage = () => mainCurrentPage >= getMainTotalPages() - 1;

  const handleMainSearchChange = (e) => {
    setMainSearchQuery(e.target.value);
    setMainCurrentPage(0);
  };

  const clearMainSearch = () => {
    setMainSearchQuery('');
    setMainCurrentPage(0);
  };

  // Search highlighting function
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #fff3cd; padding: 2px 4px; border-radius: 3px;">$1</mark>');
  };

  // Check confirmed candidates function
  const checkConfirmedCandidates = async (params) => {
    setLoadingCounts(true);
    const counts = {};

    try {
      for (const param of params) {
        try {
          const details = await getConfirmedCandidatesForAudition(param._id);
          counts[param._id] = details.totalCandidates || 0;
        } catch (error) {
          counts[param._id] = 0;
        }
      }
      setConfirmedCounts(counts);
    } catch (error) {
      // console.error('Error checking confirmed candidates:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Detect changes in evaluation form
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      const currentValues = getValuesEval();
      const hasChanged = Object.keys(initialValues).some((key) => {
        const initial = initialValues[key] || '';
        const current = currentValues[key] || '';
        return initial !== current;
      });
      setHasChanges(hasChanged);
    }
  }, [watchedEvalValues, initialValues, getValuesEval]);

  // Custom validation for Select fields
  const validateSelectField = async (fieldName, value) => {
    if (validationRules[fieldName]?.required && !value) {
      return false;
    }
    return true;
  };

  // Handle Select field changes with validation
  const handleSelectChange = async (fieldName, selectedOption) => {
    const value = selectedOption?.value || '';
    setValueEval(fieldName, value);
    await triggerEval(fieldName);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const values = getValuesEval();
    return values.tessiture && values.note && values.oeuvreChante && values.remarque && values.decision;
  };

  // Generate hour filter options based on selected planning parameters
  const getHourFilterOptions = () => {
    if (!selectedParam) return [];

    const startHour = parseInt(selectedParam.sessionStartTime.split(':')[0]);
    const endHour = parseInt(selectedParam.sessionEndTime.split(':')[0]);
    const pauseStart = selectedParam.debutPause ? parseInt(selectedParam.debutPause.split(':')[0]) : null;
    const pauseEnd = selectedParam.finPause ? parseInt(selectedParam.finPause.split(':')[0]) : null;

    const options = [];

    for (let hour = startHour; hour < endHour; hour++) {
      if (pauseStart && pauseEnd && hour >= pauseStart && hour < pauseEnd) {
        continue;
      }

      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      const nextHourStr = `${(hour + 1).toString().padStart(2, '0')}:00`;

      options.push({
        value: `${hour}-${hour + 1}`,
        label: `${hourStr} - ${nextHourStr}`,
        startHour: hour,
        endHour: hour + 1
      });
    }

    return options;
  };

  // Filter slots by hour range
  const filterSlotsByHour = (slots, hourFilter) => {
    if (!hourFilter) return slots;

    const [startHour, endHour] = hourFilter.split('-').map(Number);

    return slots.filter((slot) => {
      const slotHour = parseInt(slot.startTime.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  // Enhanced filtering function with all 4 filters
  // ✅ BEST FIX: Case-insensitive filtering function
  const getFilteredSlots = () => {
    if (!planningDetails?.slots) return [];

    let filteredSlots = planningDetails.slots;

    // Hour filter
    if (selectedHourFilter) {
      filteredSlots = filterSlotsByHour(filteredSlots, selectedHourFilter);
    }

    // Decision filter
    if (selectedDecisionFilter) {
      filteredSlots = filteredSlots.filter((slot) => {
        const evaluation = evaluations[slot._id];
        if (selectedDecisionFilter === 'Non évalué') {
          return !evaluation;
        }
        return evaluation && evaluation.decision === selectedDecisionFilter;
      });
    }

    // ✅ IMPROVED: Case-insensitive pupitre filter
    if (selectedPupitreFilter) {
      filteredSlots = filteredSlots.filter((slot) => {
        const evaluation = evaluations[slot._id];

        // Get pupitre from evaluation first, then candidate
        let pupitre = evaluation?.tessiture || slot.candidate?.pupitre || '';

        // ✅ Normalize both values for comparison (remove accents and lowercase)
        const normalizedPupitre = pupitre
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''); // Remove accents

        const normalizedFilter = selectedPupitreFilter
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''); // Remove accents

        return normalizedPupitre === normalizedFilter;
      });
    }

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredSlots = filteredSlots.filter((slot) => {
        const fullName = `${slot.candidate.firstName} ${slot.candidate.lastName}`.toLowerCase();
        return fullName.includes(query);
      });
    }

    return filteredSlots;
  };

  // Filter handlers
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(0);
  };

  const clearHourFilter = () => {
    setSelectedHourFilter('');
    setCurrentPage(0);
  };

  const clearDecisionFilter = () => {
    setSelectedDecisionFilter('');
    setCurrentPage(0);
  };

  const clearPupitreFilter = () => {
    setSelectedPupitreFilter('');
    setCurrentPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  const handleHourFilterChange = (hourFilter) => {
    setSelectedHourFilter(hourFilter);
    setCurrentPage(0);
  };

  const handleDecisionFilterChange = (decision) => {
    setSelectedDecisionFilter(decision);
    setCurrentPage(0);
  };

  const handlePupitreFilterChange = (pupitre) => {
    setSelectedPupitreFilter(pupitre);
    setCurrentPage(0);
  };

  // Load evaluations for current planning
  const loadEvaluations = async (planningId) => {
    if (!planningDetails?.slots) return;

    setLoadingEvaluations(true);
    const evaluationMap = {};

    try {
      for (const slot of planningDetails.slots) {
        try {
          const response = await getAuditionEvaluation(slot.candidate._id, slot._id);
          evaluationMap[slot._id] = response.evaluation;
        } catch (error) {
          evaluationMap[slot._id] = null;
        }
      }
      setEvaluations(evaluationMap);
    } catch (error) {
      // console.error('Error loading evaluations:', error);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  // Open evaluation modal
  const openEvaluationModal = async (slot) => {
    setSelectedSlot(slot);
    setEditingEvaluation(null);
    setSubmitError('');

    // ✅ NEW: Check fresh charter status
    try {
      const charterStatus = await getCandidateCharterStatus(slot.candidate._id);

      // Update selectedSlot with fresh charter data
      const updatedSlot = {
        ...slot,
        candidate: {
          ...slot.candidate,
          charterSigned: charterStatus.charterSigned || false,
          charterSignedAt: charterStatus.charterSignedAt
        }
      };
      setSelectedSlot(updatedSlot);

      // // ✅ Debug log
      // console.log('Charter Status Check:', {
      //   candidate: charterStatus.candidateName,
      //   charterSigned: charterStatus.charterSigned,
      //   buttonWillBeDisabled: charterStatus.charterSigned === true
      // });
    } catch (error) {
      console.warn('Could not fetch charter status, using cached data:', error);
    }

    // Load tessiture options based on candidate's gender
    setLoadingTessiture(true);
    try {
      const response = await getTessitureOptions(slot.candidate._id);
      setTessitureOptions(response.options);
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les options de tessiture.', 'error');
      return;
    } finally {
      setLoadingTessiture(false);
    }

    // Check if evaluation already exists
    const existingEvaluation = evaluations[slot._id];
    if (existingEvaluation) {
      setEditingEvaluation(existingEvaluation);
      const values = {
        tessiture: existingEvaluation.tessiture || '',
        note: existingEvaluation.note || '',
        oeuvreChante: existingEvaluation.oeuvreChante || '',
        ordrePassage: existingEvaluation.ordrePassage || '',
        remarque: existingEvaluation.remarque || '',
        decision: existingEvaluation.decision || ''
      };
      setInitialValues(values);
      resetEval(values);
      setHasChanges(false);
    } else {
      const emptyValues = {
        tessiture: '',
        note: '',
        oeuvreChante: '',
        ordrePassage: '',
        remarque: '',
        decision: ''
      };
      setInitialValues(emptyValues);
      resetEval(emptyValues);
      setHasChanges(false);
    }

    setShowEvaluationModal(true);
  };

  // Handle evaluation form submission
  const onSubmitEvaluation = async (data) => {
    if (!selectedSlot) return;

    try {
      setSubmitError('');

      // Validate Select fields manually
      const tessitureValid = await validateSelectField('tessiture', data.tessiture);
      const noteValid = await validateSelectField('note', data.note);
      const decisionValid = await validateSelectField('decision', data.decision);

      if (!tessitureValid || !noteValid || !decisionValid) {
        setSubmitError('Veuillez remplir tous les champs obligatoires.');
        return;
      }

      const evaluationData = {
        candidateId: selectedSlot.candidate._id,
        auditionSlotId: selectedSlot._id,
        tessiture: data.tessiture,
        oeuvreChante: data.oeuvreChante,
        remarque: data.remarque || '',
        note: data.note,
        ordrePassage: data.ordrePassage ? parseInt(data.ordrePassage) : null,
        decision: data.decision,
        evaluatedBy: 'aziizhasnaoui',
        evaluatedAt: new Date().toISOString()
      };

      let response;
      if (editingEvaluation) {
        response = await updateAuditionEvaluation(editingEvaluation._id, evaluationData);
        Swal.fire('Succès', 'Évaluation mise à jour avec succès!', 'success');
      } else {
        response = await createAuditionEvaluation(evaluationData);
        Swal.fire('Succès', 'Évaluation créée avec succès!', 'success');
      }

      // Update local evaluations state
      setEvaluations((prev) => ({
        ...prev,
        [selectedSlot._id]: response.evaluation
      }));

      setHasChanges(false);
      setShowEvaluationModal(false);
    } catch (error) {
      // console.error('Error saving evaluation:', error);
      setSubmitError("Erreur lors de l'enregistrement. Veuillez réessayer.");
    }
  };

  // Handle modal close with unsaved changes check
  const handleCloseEvaluationModal = async () => {
    if (hasChanges) {
      const result = await Swal.fire({
        title: 'Attention!',
        text: 'Vous avez des modifications non sauvegardées.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Fermer sans sauvegarder',
        cancelButtonText: "Continuer l'édition",
        confirmButtonColor: '#dc3545'
      });

      if (!result.isConfirmed) return;
    }

    setShowEvaluationModal(false);
    setHasChanges(false);
    setSubmitError('');
  };

  // Check if slot has evaluation
  const hasEvaluation = (slotId) => {
    return evaluations[slotId] !== null && evaluations[slotId] !== undefined;
  };

  // Get evaluation decision badge
  const getDecisionBadge = (slotId) => {
    const evaluation = evaluations[slotId];
    if (!evaluation) return null;

    const decisionColors = {
      Retenu: 'success',
      'Non Retenu': 'danger',
      'En Attente': 'warning'
    };

    return <Badge bg={decisionColors[evaluation.decision] || 'secondary'}>{evaluation.decision}</Badge>;
  };

  // Fetch pending candidates count
  const fetchPendingCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const pendingData = await getMembershipSubmissions('Pending');
      setPendingCandidatesCount(pendingData.length);
      return pendingData.length;
    } catch (error) {
      // console.error('Error fetching pending candidates:', error);
      setPendingCandidatesCount(0);
      return 0;
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Check planning status for all parameters
  const checkAllPlanningStatus = async (params) => {
    const statusMap = {};
    for (const param of params) {
      try {
        const exists = await checkPlanningExists(param._id);
        statusMap[param._id] = exists.exists;
      } catch (error) {
        statusMap[param._id] = false;
      }
    }
    setPlanningStatus(statusMap);
  };

  // Updated pagination logic to work with filtered data
  const getPaginatedSlots = () => {
    const filteredSlots = getFilteredSlots();
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSlots.slice(startIndex, endIndex);
  };

  const getTotalItems = () => getFilteredSlots().length;
  const getTotalPages = () => Math.ceil(getTotalItems() / itemsPerPage);
  const getStartIndex = () => (getTotalItems() === 0 ? 0 : currentPage * itemsPerPage + 1);
  const getEndIndex = () => Math.min((currentPage + 1) * itemsPerPage, getTotalItems());

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0);
  };

  const goToFirstPage = () => setCurrentPage(0);
  const goToPreviousPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(getTotalPages() - 1, currentPage + 1));
  const goToLastPage = () => setCurrentPage(getTotalPages() - 1);

  const isFirstPage = () => currentPage === 0;
  const isLastPage = () => currentPage >= getTotalPages() - 1;

  // Calculate remaining candidates logic
  const calculateRemainingCandidates = () => {
    const inputCount = parseInt(candidateCount) || 0;
    const remaining = pendingCandidatesCount - inputCount;

    return {
      inputCount,
      remaining,
      isValid: inputCount <= pendingCandidatesCount && inputCount > 0,
      isEmpty: inputCount === 0,
      isOverLimit: inputCount > pendingCandidatesCount,
      isExact: inputCount === pendingCandidatesCount
    };
  };

  const candidateCalc = calculateRemainingCandidates();

  // Clear pause error when user fixes the issue
  useEffect(() => {
    if ((debutPause && finPause) || (!debutPause && !finPause)) {
      setPauseError('');
    }
  }, [debutPause, finPause]);

  // Load evaluations when planning details change
  useEffect(() => {
    if (planningDetails && showPlanningModal) {
      loadEvaluations(selectedParam?._id);
    }
  }, [planningDetails, showPlanningModal]);

  const calculateCapacityInfo = () => {
    if (startDate && endDate && sessionStartTime && sessionEndTime && candidateCount) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dayCount = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const [hS, mS] = sessionStartTime.split(':').map(Number);
      const [hE, mE] = sessionEndTime.split(':').map(Number);
      let sessionMinutes = hE * 60 + mE - (hS * 60 + mS);

      if (debutPause && finPause) {
        const [hD, mD] = debutPause.split(':').map(Number);
        const [hF, mF] = finPause.split(':').map(Number);
        const breakMinutes = hF * 60 + mF - (hD * 60 + mD);
        sessionMinutes -= breakMinutes;
      }

      const totalAvailableMinutes = sessionMinutes * dayCount;
      const autoSlotDuration = Math.floor(totalAvailableMinutes / Number(candidateCount));
      const candidatesPerDay = Math.ceil(Number(candidateCount) / dayCount);

      return {
        totalAvailableMinutes,
        autoSlotDuration,
        candidatesPerDay,
        dayCount
      };
    }
    return null;
  };

  const fetchParams = async () => {
    setLoading(true);
    try {
      const sets = await listAuditionParameters();
      setParamsList(sets);
      await checkAllPlanningStatus(sets);
      await checkConfirmedCandidates(sets);
    } catch {
      Swal.fire('Erreur', 'Impossible de récupérer les paramètres.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const openCreate = async () => {
    setEditingParam(null);
    setPauseError('');
    await fetchPendingCandidates();
    reset({
      saison: currentYear,
      startDate: '',
      endDate: '',
      candidateCount: '',
      sessionStartTime: '08:00',
      sessionEndTime: '18:00',
      debutPause: '',
      finPause: ''
    });
    setShowModal(true);
  };

  const openEdit = (param) => {
    setEditingParam(param);
    setPauseError('');
    reset({
      saison: param.saison || currentYear,
      startDate: param.startDate ? param.startDate.slice(0, 10) : '',
      endDate: param.endDate ? param.endDate.slice(0, 10) : '',
      candidateCount: param.candidateCount ? String(param.candidateCount) : '',
      sessionStartTime: param.sessionStartTime || '08:00',
      sessionEndTime: param.sessionEndTime || '',
      debutPause: param.debutPause || '',
      finPause: param.finPause || ''
    });
    setShowModal(true);
  };

  const openGeneratePreview = async (param) => {
    setSelectedParam(param);
    setShowPreviewModal(true);

    setLoadingCandidates(true);
    try {
      const pendingData = await getMembershipSubmissions('Pending');
      setPendingCandidatesCount(pendingData.length);
    } catch (error) {
      setPendingCandidatesCount(0);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const openPlanningVisualization = async (param) => {
    setSelectedParam(param);
    setLoadingPlanning(true);
    setShowPlanningModal(true);
    setCurrentPage(0);
    setSearchQuery('');
    setSelectedHourFilter('');
    setSelectedDecisionFilter('');
    setSelectedPupitreFilter('');
    setEvaluations({});

    try {
      const details = await getConfirmedCandidatesForAudition(param._id);
      setPlanningDetails(details);
    } catch (error) {
      // console.error('Error fetching confirmed candidates:', error);
      Swal.fire('Erreur', 'Impossible de récupérer les candidats confirmés.', 'error');
      setShowPlanningModal(false);
    } finally {
      setLoadingPlanning(false);
    }
  };

  const handleGeneratePlanning = async () => {
    if (!selectedParam) return;

    try {
      // Start the loading dialog
      const loadingPromise = Swal.fire({
        title: 'Génération du planning...',
        text: "Création des créneaux d'audition...",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Wait for BOTH the operation AND minimum 2 seconds
      const [response] = await Promise.all([generateAuditions(selectedParam._id), new Promise((resolve) => setTimeout(resolve, 1500))]);

      // Close the loading dialog
      Swal.close();

      if (response.success) {
        setShowPreviewModal(false);
        await fetchParams();

        Swal.fire({
          icon: 'success',
          title: 'Succès !',
          text: 'Les convocations ont été envoyées avec succès.',
          timer: 3000,
          showConfirmButton: true
        });
      } else {
        throw new Error(response.message || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Error generating planning:', error);
      Swal.close();

      Swal.fire({
        icon: 'error',
        title: 'Erreur lors de la génération',
        text: error.message || 'Impossible de générer le planning. Veuillez réessayer.',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Supprimer ce planning ?',
      text: 'Cette action supprimera aussi toutes les convocations générées.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAuditionParameters(id);
      Swal.fire('Supprimé', 'Paramètre supprimé.', 'success');
      fetchParams();
    } catch {
      Swal.fire('Erreur', 'Impossible de supprimer.', 'error');
    }
  };

  const onSubmit = async (data) => {
    setPauseError('');

    if ((data.debutPause && !data.finPause) || (!data.debutPause && data.finPause)) {
      setPauseError('Veuillez renseigner les deux heures de pause');
      return;
    }

    const payload = {
      ...data,
      saison: Number(data.saison),
      candidateCount: Number(data.candidateCount),
      debutPause: data.debutPause || null,
      finPause: data.finPause || null
    };

    try {
      if (editingParam) {
        await updateAuditionParameters(editingParam._id, payload);
        Swal.fire('Mis à jour', 'Paramètres mis à jour.', 'success');
      } else {
        await saveAuditionParameters(payload);
        Swal.fire('Enregistré', 'Nouveau planning enregistré.', 'success');
      }
      setShowModal(false);
      fetchParams();
    } catch (err) {
      Swal.fire('Erreur', err.message || 'Échec de la sauvegarde.', 'error');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date helper for evaluation modal
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const capacityInfo = calculateCapacityInfo();

  return (
    <Container style={{ marginTop: '2rem' }}>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">Paramètres des Auditions</h5>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <FaPlus className="me-2" /> Nouveau
          </Button>
        </Card.Header>

        <Card.Body>
          {/* ✅ NEW: Search Bar */}
          <div className="mb-3 d-flex justify-content-start">
            <InputGroup style={{ maxWidth: '400px' }}>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Rechercher par saison, nb candidats, date..."
                value={mainSearchQuery}
                onChange={handleMainSearchChange}
              />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th>Période</th>
                    <th>Saison</th>
                    <th>Nb candidats</th>
                    <th>Horaires</th>
                    <th>Pause</th>
                    <th>Créé le</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedParams().map((p) => {
                    const isGenerated = planningStatus[p._id] || false;
                    const periode = `${new Date(p.startDate).toLocaleDateString('fr-FR')} → ${new Date(p.endDate).toLocaleDateString('fr-FR')}`;
                    const highlightedPeriode = mainSearchQuery ? highlightSearchTerm(periode, mainSearchQuery) : periode;
                    const highlightedSaison = mainSearchQuery ? highlightSearchTerm(p.saison?.toString() || '', mainSearchQuery) : (p.saison || currentYear);
                    const highlightedCandidateCount = mainSearchQuery ? highlightSearchTerm(p.candidateCount?.toString() || '', mainSearchQuery) : p.candidateCount;

                    return (
                      <tr key={p._id}>
                        <td>
                          <span dangerouslySetInnerHTML={{ __html: highlightedPeriode }} />
                        </td>
                        <td>
                          <span dangerouslySetInnerHTML={{ __html: highlightedSaison }} />
                        </td>
                        <td>
                          <span dangerouslySetInnerHTML={{ __html: highlightedCandidateCount }} />
                        </td>
                        <td>
                          {p.sessionStartTime} – {p.sessionEndTime}
                        </td>
                        <td>{p.debutPause && p.finPause ? `${p.debutPause} - ${p.finPause}` : 'Aucune'}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td>
                          {isGenerated ? (
                            <div className="d-flex flex-column align-items-start gap-1">
                              <Badge bg="success">
                                <FaUserCheck className="me-1" />
                                Généré
                              </Badge>
                            </div>
                          ) : (
                            <Badge bg="secondary">
                              <FaClock className="me-1" />
                              En attente
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => openEdit(p)}
                              disabled={isGenerated}
                              title={isGenerated ? 'Modification impossible après génération' : 'Modifier'}
                            >
                              <FaEdit />
                            </Button>

                            {isGenerated ? (
                              <Button
                                size="sm"
                                variant="outline-info"
                                onClick={() => openPlanningVisualization(p)}
                                title={
                                  loadingCounts
                                    ? 'Vérification...'
                                    : `Visualiser Planning (${confirmedCounts[p._id] || 0} confirmé${(confirmedCounts[p._id] || 0) > 1 ? 's' : ''})`
                                }
                              >
                                {loadingCounts ? <Spinner size="sm" /> : <FaEye />}
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline-success" onClick={() => openGeneratePreview(p)} title="Générer le planning">
                                <FaCalendarAlt />
                              </Button>
                            )}

                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(p._id)} title="Supprimer">
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {getMainTotalItems() === 0 && !loading && (
                    <tr>
                      <td colSpan="8" className="text-center py-3">
                        {mainSearchQuery ? `Aucun paramètre trouvé pour "${mainSearchQuery}"` : 'Aucun planning défini.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* ✅ NEW: RescheduleCandidate Style Pagination */}
              {getMainTotalItems() > 0 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                  <div className="d-flex align-items-center">
                    <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                      Auditions par page:
                    </span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={mainItemsPerPage}
                      onChange={(e) => handleMainPageSizeChange(Number(e.target.value))}
                    >
                      {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-muted" style={{ fontSize: '14px' }}>
                    {getMainStartIndex()}-{getMainEndIndex()} sur {getMainTotalItems()}
                  </div>

                  <div className="d-flex align-items-center">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToMainFirstPage}
                      disabled={isMainFirstPage()}
                      className="me-1"
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isMainFirstPage() ? '#6c757d' : '#495057'
                      }}
                      title="Première page"
                    >
                      <FaAngleDoubleLeft />
                    </Button>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToMainPreviousPage}
                      disabled={isMainFirstPage()}
                      className="me-3"
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isMainFirstPage() ? '#6c757d' : '#495057'
                      }}
                      title="Page précédente"
                    >
                      <FaChevronLeft />
                    </Button>

                    <span className="mx-3 text-muted" style={{ fontSize: '14px' }}>
                      Page {mainCurrentPage + 1} sur {getMainTotalPages()}
                    </span>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToMainNextPage}
                      disabled={isMainLastPage()}
                      className="ms-3 me-1"
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isMainLastPage() ? '#6c757d' : '#495057'
                      }}
                      title="Page suivante"
                    >
                      <FaChevronRight />
                    </Button>

                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={goToMainLastPage}
                      disabled={isMainLastPage()}
                      style={{
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: isMainLastPage() ? '#6c757d' : '#495057'
                      }}
                      title="Dernière page"
                    >
                      <FaAngleDoubleRight />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingParam ? 'Modifier Planning' : 'Nouveau Planning'}</Modal.Title>
        </Modal.Header>

        <Form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="saison">
                  <Form.Label>Saison</Form.Label>
                  <Form.Control type="number" {...register('saison')} readOnly className="bg-light" />
                  <Form.Text className="text-muted">
                    <small>Année en cours (lecture seule)</small>
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="startDate">
                  <Form.Label>Date de début</Form.Label>
                  <Form.Control
                    type="date"
                    min={today}
                    {...register('startDate', {
                      required: 'Date de début requise',
                      validate: (value) => {
                        const selectedDate = new Date(value);
                        const todayDate = new Date(today);
                        if (selectedDate < todayDate) {
                          return 'Date ne peut pas être dans le passé';
                        }
                        return true;
                      }
                    })}
                    isInvalid={!!errors.startDate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="endDate">
                  <Form.Label>Date de fin</Form.Label>
                  <Form.Control
                    type="date"
                    min={watch('startDate') || today}
                    {...register('endDate', {
                      required: 'Date de fin requise',
                      validate: (value) => {
                        const startDateValue = watch('startDate');
                        if (!startDateValue) return true;

                        const startDate = new Date(startDateValue);
                        const endDate = new Date(value);

                        if (endDate < startDate) {
                          return 'Date de fin doit être ≥ date de début';
                        }

                        const diffTime = endDate - startDate;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 30) {
                          return 'Période maximale: 30 jours';
                        }

                        return true;
                      }
                    })}
                    isInvalid={!!errors.endDate}
                  />
                  <Form.Control.Feedback type="invalid">{errors.endDate?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="candidateCount">
                  <Form.Label>Nombre de candidats</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={100}
                    {...register('candidateCount', {
                      required: 'Nombre de candidats requis',
                      min: { value: 1, message: 'Minimum 1 candidat' },
                      max: { value: 100, message: 'Maximum 100 candidats' }
                    })}
                    isInvalid={!!errors.candidateCount}
                  />
                  <Form.Control.Feedback type="invalid">{errors.candidateCount?.message}</Form.Control.Feedback>

                  {!editingParam && !loadingCandidates && (
                    <div className="mt-2">
                      <FaUsers className="text-primary me-2" />
                      <Badge bg="secondary">{pendingCandidatesCount} candidats en attente</Badge>
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="sessionStartTime">
                  <Form.Label>Heure début séance</Form.Label>
                  <Form.Control
                    type="time"
                    {...register('sessionStartTime', {
                      required: 'Heure de début requise'
                    })}
                    isInvalid={!!errors.sessionStartTime}
                  />
                  <Form.Control.Feedback type="invalid">{errors.sessionStartTime?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="sessionEndTime">
                  <Form.Label>Heure fin séance</Form.Label>
                  <Form.Control
                    type="time"
                    {...register('sessionEndTime', {
                      required: 'Heure de fin requise'
                    })}
                    isInvalid={!!errors.sessionEndTime}
                  />
                  <Form.Control.Feedback type="invalid">{errors.sessionEndTime?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="debutPause">
                  <Form.Label>Début pause (optionnel)</Form.Label>
                  <Form.Control type="time" {...register('debutPause')} />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="finPause">
                  <Form.Label>Fin pause (optionnel)</Form.Label>
                  <Form.Control type="time" {...register('finPause')} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              {editingParam ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Generate Planning Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCalendarAlt className="me-2 text-primary" />
            Aperçu du Planning d'Audition
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedParam && (
            <div>
              <div className="bg-light p-4 rounded mb-4">
                <Row>
                  <Col md={6}>
                    <h6 className="text-primary mb-3">📅 Informations Générales</h6>
                    <p>
                      <strong>Saison:</strong> {selectedParam.saison}
                    </p>
                    <p>
                      <strong>Période:</strong> {formatDate(selectedParam.startDate)} → {formatDate(selectedParam.endDate)}
                    </p>
                    <p>
                      <strong>Nombre de candidats:</strong> {selectedParam.candidateCount}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-success mb-3">⏰ Horaires</h6>
                    <p>
                      <strong>Séances:</strong> {selectedParam.sessionStartTime} - {selectedParam.sessionEndTime}
                    </p>
                    {selectedParam.debutPause && selectedParam.finPause && (
                      <p>
                        <strong>Pause:</strong> {selectedParam.debutPause} - {selectedParam.finPause}
                      </p>
                    )}
                  </Col>
                </Row>
              </div>

              <div className="alert alert-warning">
                <strong>⚠️ Attention:</strong> Une fois le planning généré, vous ne pourrez plus modifier ces paramètres.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleGeneratePlanning} disabled={pendingCandidatesCount === 0}>
            <FaUserCheck className="me-2" />
            Envoyer Convocations
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Planning Visualization Modal with All Filters */}
      <Modal show={showPlanningModal} onHide={() => setShowPlanningModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEye className="me-2 text-info" />
            Planning Généré - {selectedParam?.saison}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          {loadingPlanning ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement du planning...</p>
            </div>
          ) : planningDetails ? (
            <div>
              {/* Summary Statistics */}
              <Row className="mb-4">
                <Col xl={3} lg={6} md={6} sm={6}>
                  <Card className="text-center border-primary mb-2">
                    <Card.Body className="py-3">
                      <h4 className="text-primary mb-1">{planningDetails.totalCandidates}</h4>
                      <small>Candidats Confirmés</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} lg={6} md={6} sm={6}>
                  <Card className="text-center border-success mb-2">
                    <Card.Body className="py-3">
                      <h4 className="text-success mb-1">{planningDetails.totalDays}</h4>
                      <small>Jours d'Audition</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} lg={6} md={6} sm={6}>
                  <Card className="text-center border-info mb-2">
                    <Card.Body className="py-3">
                      <h4 className="text-info mb-1">{planningDetails.totalSlots}</h4>
                      <small>Blocs Horaires</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} lg={6} md={6} sm={6}>
                  <Card className="text-center border-warning mb-2">
                    <Card.Body className="py-3">
                      <h4 className="text-warning mb-1">{planningDetails.averagePerDay}</h4>
                      <small>Candidats/Jour</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Table Container */}
              <div className="border rounded">
                {/* Enhanced Responsive Search and Filter Header */}
                <div className="bg-light p-3 border-bottom">
                  {/* Filters Row */}
                  <Row className="g-3 mb-3">
                    {/* Search Filter */}
                    <Col xl={3} lg={6} md={6} sm={12}>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          placeholder="Rechercher par nom..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="pe-5"
                          style={{
                            borderRadius: '20px',
                            border: '1px solid #dee2e6',
                            paddingLeft: '40px',
                            fontSize: '0.9rem'
                          }}
                        />
                        <FaSearch
                          className="position-absolute text-muted"
                          style={{
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '14px'
                          }}
                        />
                        {searchQuery && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={clearSearch}
                            className="position-absolute p-0 text-muted"
                            style={{
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '18px',
                              lineHeight: 1,
                              textDecoration: 'none'
                            }}
                            title="Effacer la recherche"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </Col>

                    {/* Hour Filter */}
                    <Col xl={3} lg={6} md={6} sm={12}>
                      <div className="d-flex align-items-center">
                        <FaClock className="text-muted me-2 flex-shrink-0" style={{ fontSize: '14px' }} />
                        <Dropdown style={{ flex: 1 }}>
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            className="w-100 text-start d-flex justify-content-between align-items-center"
                            style={{
                              borderRadius: '20px',
                              border: '1px solid #dee2e6',
                              fontSize: '0.9rem',
                              paddingRight: '30px'
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {selectedHourFilter
                                ? getHourFilterOptions().find((opt) => opt.value === selectedHourFilter)?.label || 'Heure'
                                : 'Filtrer par heure'}
                            </span>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <Dropdown.Item onClick={() => clearHourFilter()} active={!selectedHourFilter}>
                              <FaClock className="me-2" />
                              Toutes les heures
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            {getHourFilterOptions().map((option) => (                              <Dropdown.Item
                                key={option.value}
                                onClick={() => handleHourFilterChange(option.value)}
                                active={selectedHourFilter === option.value}
                              >
                                <FaClock className="me-2" />
                                {option.label}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Col>

                    {/* Decision Filter */}
                    <Col xl={3} lg={6} md={6} sm={12}>
                      <div className="d-flex align-items-center">
                        <FaUserCheck className="text-muted me-2 flex-shrink-0" style={{ fontSize: '14px' }} />
                        <Dropdown style={{ flex: 1 }}>
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            className="w-100 text-start d-flex justify-content-between align-items-center"
                            style={{
                              borderRadius: '20px',
                              border: '1px solid #dee2e6',
                              fontSize: '0.9rem',
                              paddingRight: '30px'
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {selectedDecisionFilter
                                ? decisionFilterOptions.find((opt) => opt.value === selectedDecisionFilter)?.label || 'Décision'
                                : 'Filtrer par décision'}
                            </span>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <Dropdown.Item onClick={() => clearDecisionFilter()} active={!selectedDecisionFilter}>
                              <FaUserCheck className="me-2" />
                              Toutes les décisions
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            {decisionFilterOptions.slice(1).map((option) => (
                              <Dropdown.Item
                                key={option.value}
                                onClick={() => handleDecisionFilterChange(option.value)}
                                active={selectedDecisionFilter === option.value}
                              >
                                <FaUserCheck className="me-2" />
                                {option.label}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Col>

                    {/* Pupitre Filter */}
                    <Col xl={3} lg={6} md={6} sm={12}>
                      <div className="d-flex align-items-center">
                        <FaMicrophone className="text-muted me-2 flex-shrink-0" style={{ fontSize: '14px' }} />
                        <Dropdown style={{ flex: 1 }}>
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            className="w-100 text-start d-flex justify-content-between align-items-center"
                            style={{
                              borderRadius: '20px',
                              border: '1px solid #dee2e6',
                              fontSize: '0.9rem',
                              paddingRight: '30px'
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {selectedPupitreFilter
                                ? pupitreFilterOptions.find((opt) => opt.value === selectedPupitreFilter)?.label || 'Pupitre'
                                : 'Filtrer par pupitre'}
                            </span>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="w-100" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <Dropdown.Item onClick={() => clearPupitreFilter()} active={!selectedPupitreFilter}>
                              <FaMicrophone className="me-2" />
                              Tous les pupitres
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            {pupitreFilterOptions.slice(1).map((option) => (
                              <Dropdown.Item
                                key={option.value}
                                onClick={() => handlePupitreFilterChange(option.value)}
                                active={selectedPupitreFilter === option.value}
                              >
                                <FaMicrophone className="me-2" />
                                {option.label}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Col>
                  </Row>

                  {/* Results Counter */}
                  <Row>
                    <Col>
                      <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <h6 className="mb-0">
                          <FaUsers className="me-2" />
                          {searchQuery || selectedHourFilter || selectedDecisionFilter || selectedPupitreFilter ? (
                            <>
                              <Badge bg="primary" className="me-2">
                                {getTotalItems()} résultat{getTotalItems() > 1 ? 's' : ''}
                              </Badge>
                              <small className="text-muted d-none d-sm-inline">
                                trouvé{getTotalItems() > 1 ? 's' : ''} avec les filtres actifs
                              </small>
                            </>
                          ) : (
                            <>
                              Liste des Candidats
                              <Badge bg="secondary" className="ms-2">
                                {getTotalItems()} total
                              </Badge>
                            </>
                          )}
                        </h6>

                        {/* Active Filters Indicator */}
                        {(searchQuery || selectedHourFilter || selectedDecisionFilter || selectedPupitreFilter) && (
                          <div className="d-flex flex-wrap gap-1">
                            {searchQuery && (
                              <Badge bg="info" className="d-flex align-items-center">
                                <FaSearch className="me-1" style={{ fontSize: '10px' }} />
                                {searchQuery.length > 10 ? `${searchQuery.substring(0, 10)}...` : searchQuery}
                              </Badge>
                            )}
                            {selectedHourFilter && (
                              <Badge bg="warning" className="d-flex align-items-center">
                                <FaClock className="me-1" style={{ fontSize: '10px' }} />
                                {getHourFilterOptions()
                                  .find((opt) => opt.value === selectedHourFilter)
                                  ?.label.split(' - ')[0] || 'Heure'}
                              </Badge>
                            )}
                            {selectedDecisionFilter && (
                              <Badge bg="success" className="d-flex align-items-center">
                                <FaUserCheck className="me-1" style={{ fontSize: '10px' }} />
                                {selectedDecisionFilter}
                              </Badge>
                            )}
                            {selectedPupitreFilter && (
                              <Badge bg="danger" className="d-flex align-items-center">
                                <FaMicrophone className="me-1" style={{ fontSize: '10px' }} />
                                {selectedPupitreFilter}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Enhanced Responsive Table Content */}
                <div className="table-responsive">
                  <Table hover bordered className="mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="table-dark">
                      <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                        <th style={{ minWidth: '150px', textAlign: 'center' }}>Candidat</th>
                        <th style={{ minWidth: '120px', textAlign: 'center' }} className="d-none d-md-table-cell">
                          Date
                        </th>
                        <th style={{ minWidth: '100px', textAlign: 'center' }}>Heure</th>
                        <th style={{ minWidth: '80px', textAlign: 'center' }} className="d-none d-lg-table-cell">
                          Pupitre
                        </th>
                        <th style={{ minWidth: '100px', textAlign: 'center' }}>Décision</th>
                        <th style={{ minWidth: '120px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingEvaluations ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <Spinner animation="border" size="sm" /> Chargement des évaluations...
                          </td>
                        </tr>
                      ) : getPaginatedSlots().length > 0 ? (
                        getPaginatedSlots().map((slot, index) => {
                          const fullName = `${slot.candidate.firstName} ${slot.candidate.lastName}`;
                          const highlightedName = searchQuery ? highlightSearchTerm(fullName, searchQuery) : fullName;
                          const isEvaluated = hasEvaluation(slot._id);
                          const evaluation = evaluations[slot._id];
                          const pupitre = evaluation?.tessiture || slot.candidate?.pupitre || '-';

                          return (
                            <tr key={slot._id}>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{currentPage * itemsPerPage + index + 1}</td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <div className="d-flex flex-column align-items-center">
                                  <strong
                                    dangerouslySetInnerHTML={{ __html: highlightedName }}
                                    style={{ fontSize: '0.9rem', lineHeight: '1.2' }}
                                  />
                                  {/* Mobile: Show date on small screens */}
                                  <small className="text-muted d-md-none mt-1">{formatDate(slot.date)}</small>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }} className="d-none d-md-table-cell">
                                <div style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{formatDate(slot.date)}</div>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <Badge bg="info" className="px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                  <div>
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                </Badge>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }} className="d-none d-lg-table-cell">
                                {pupitre !== '-' ? (
                                  <Badge
                                    bg={
                                      pupitre === 'soprano'
                                        ? 'danger'
                                        : pupitre === 'alto'
                                          ? 'warning'
                                          : pupitre === 'ténor'
                                            ? 'success'
                                            : pupitre === 'basse'
                                              ? 'primary'
                                              : 'secondary'
                                    }
                                    className="px-2"
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    {pupitre.charAt(0).toUpperCase() + pupitre.slice(1)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                    -
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <div className="d-flex flex-column align-items-center gap-1">
                                  {getDecisionBadge(slot._id) || (
                                    <Badge bg="secondary" style={{ fontSize: '0.75rem' }}>
                                      Non évalué
                                    </Badge>
                                  )}
                                  {/* Mobile: Show pupitre on small screens */}
                                  {pupitre !== '-' && (
                                    <Badge
                                      bg={
                                        pupitre === 'soprano'
                                          ? 'danger'
                                          : pupitre === 'alto'
                                            ? 'warning'
                                            : pupitre === 'ténor'
                                              ? 'success'
                                              : pupitre === 'basse'
                                                ? 'primary'
                                                : 'secondary'
                                      }
                                      className="px-2 d-lg-none"
                                      style={{ fontSize: '0.7rem' }}
                                    >
                                      {pupitre.charAt(0).toUpperCase() + pupitre.slice(1)}
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <Button
                                  size="sm"
                                  variant={isEvaluated ? 'outline-success' : 'outline-primary'}
                                  onClick={() => openEvaluationModal(slot)}
                                  title={isEvaluated ? "Voir/Modifier l'évaluation" : 'Auditioner le candidat'}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.375rem 0.75rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {isEvaluated ? (
                                    <>
                                      <FaCheckCircle className="me-1" style={{ fontSize: '0.8rem' }} />
                                      <span className="d-none d-sm-inline">Voir/Modifier</span>
                                      <span className="d-sm-none">Voir</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaMicrophone className="me-1" style={{ fontSize: '0.8rem' }} />
                                      <span className="d-none d-sm-inline">Auditioner</span>
                                      <span className="d-sm-none">Éval</span>
                                    </>
                                  )}
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            <div className="d-flex flex-column align-items-center">
                              {searchQuery || selectedHourFilter || selectedDecisionFilter || selectedPupitreFilter ? (
                                <>
                                  <FaFilter className="mb-3" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
                                  <h6 className="mb-2">Aucun candidat trouvé</h6>
                                  <p className="mb-2">Aucun résultat ne correspond aux filtres sélectionnés</p>
                                  <small className="text-muted">Essayez de modifier ou supprimer certains filtres</small>
                                </>
                              ) : (
                                <>
                                  <FaUsers className="mb-3" style={{ fontSize: '2.5rem', opacity: 0.3 }} />
                                  <h6 className="mb-2">Aucun candidat confirmé</h6>
                                  <p className="mb-2">Aucun candidat n'a encore confirmé sa présence</p>
                                  <small className="text-muted">
                                    Le planning reste ouvert pour consultation et suivi des confirmations
                                  </small>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Enhanced Responsive Pagination */}
                {getTotalItems() > 0 && (
                  <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                    <div className="d-flex align-items-center">
                      <span className="me-2 text-muted" style={{ fontSize: '14px' }}>
                        Candidats par page:
                      </span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={itemsPerPage}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      >
                        {pageSizeOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-muted" style={{ fontSize: '14px' }}>
                      {getStartIndex()}-{getEndIndex()} sur {getTotalItems()}
                    </div>

                    <div className="d-flex align-items-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToFirstPage}
                        disabled={isFirstPage()}
                        className="me-1"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstPage() ? '#6c757d' : '#495057'
                        }}
                        title="Première page"
                      >
                        <FaAngleDoubleLeft />
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={isFirstPage()}
                        className="me-3"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isFirstPage() ? '#6c757d' : '#495057'
                        }}
                        title="Page précédente"
                      >
                        <FaChevronLeft />
                      </Button>

                      <span className="mx-3 text-muted" style={{ fontSize: '14px' }}>
                        Page {currentPage + 1} sur {getTotalPages()}
                      </span>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={isLastPage()}
                        className="ms-3 me-1"
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastPage() ? '#6c757d' : '#495057'
                        }}
                        title="Page suivante"
                      >
                        <FaChevronRight />
                      </Button>

                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={isLastPage()}
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: isLastPage() ? '#6c757d' : '#495057'
                        }}
                        title="Dernière page"
                      >
                        <FaAngleDoubleRight />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="d-flex flex-column align-items-center">
                <FaUsers className="mb-3 text-muted" style={{ fontSize: '3rem', opacity: 0.3 }} />
                <h5 className="text-muted">Aucun planning trouvé</h5>
                <p className="text-muted mb-0">Le planning n'a pas encore été généré ou aucune donnée n'est disponible.</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlanningModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enhanced Evaluation Modal */}
      <Modal show={showEvaluationModal} onHide={handleCloseEvaluationModal} size="lg" backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaMicrophone className="me-2 text-primary" />
            {editingEvaluation ? "Modifier l'Évaluation" : "Évaluation d'Audition"}
            {hasChanges && <span className="text-warning ms-2">●</span>}
          </Modal.Title>
        </Modal.Header>

        <Form noValidate onSubmit={handleSubmitEval(onSubmitEvaluation)}>
          <Modal.Body>
            {/* Error Alert */}
            {submitError && (
              <Alert variant="danger" className="mb-3">
                <FaTimes className="me-2" />
                {submitError}
              </Alert>
            )}

            {/* Candidate Information */}
            {selectedSlot && (
              <div className="bg-light p-3 rounded mb-4">
                <h6 className="text-primary mb-2">👤 Candidat</h6>
                <p className="mb-1">
                  <strong>
                    {selectedSlot.candidate.firstName} {selectedSlot.candidate.lastName}
                  </strong>
                </p>
                <p className="mb-1 text-muted">
                  📧 {selectedSlot.candidate.email} | 🚻 {selectedSlot.candidate.gender}
                </p>
                <p className="mb-1">
                  📅 {formatDate(selectedSlot.date)} à {selectedSlot.startTime} - {selectedSlot.endTime}
                </p>
              </div>
            )}

            {/* Tessiture and Note */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tessiture *</Form.Label>
                  {loadingTessiture ? (
                    <div className="d-flex align-items-center">
                      <Spinner size="sm" className="me-2" />
                      <span>Chargement...</span>
                    </div>
                  ) : (
                    <Select
                      options={tessitureOptions}
                      value={tessitureOptions.find((opt) => opt.value === watchEval('tessiture'))}
                      onChange={(selected) => handleSelectChange('tessiture', selected)}
                      placeholder="Sélectionner la tessiture..."
                      isClearable
                      isDisabled={isSubmitting}
                      className={!watchEval('tessiture') && errorsEval.tessiture ? 'is-invalid' : ''}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderColor: !watchEval('tessiture') && errorsEval.tessiture ? '#dc3545' : base.borderColor
                        })
                      }}
                    />
                  )}
                  {!watchEval('tessiture') && <div className="invalid-feedback d-block">Tessiture requise</div>}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Note *</Form.Label>
                  <Select
                    options={noteOptions}
                    value={noteOptions.find((opt) => opt.value === watchEval('note'))}
                    onChange={(selected) => handleSelectChange('note', selected)}
                    placeholder="Sélectionner la note..."
                    isClearable
                    isDisabled={isSubmitting}
                    className={!watchEval('note') && errorsEval.note ? 'is-invalid' : ''}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: !watchEval('note') && errorsEval.note ? '#dc3545' : base.borderColor
                      })
                    }}
                  />
                  {!watchEval('note') && <div className="invalid-feedback d-block">Note requise</div>}
                </Form.Group>
              </Col>
            </Row>

            {/* Œuvre Chantée and Ordre de Passage */}
            <Row className="mb-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Œuvre Chantée *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Titre de l'œuvre interprétée..."
                    disabled={isSubmitting}
                    {...registerEval('oeuvreChante', validationRules.oeuvreChante)}
                    isInvalid={!!errorsEval.oeuvreChante}
                  />
                  <Form.Control.Feedback type="invalid">{errorsEval.oeuvreChante?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Ordre de Passage</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="999"
                    placeholder="Optionnel"
                    disabled={isSubmitting}
                    {...registerEval('ordrePassage')}
                  />
                  <Form.Text className="text-muted">Champ optionnel</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Remarques */}
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Remarques *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Observations, commentaires sur la performance..."
                    disabled={isSubmitting}
                    {...registerEval('remarque', validationRules.remarque)}
                    isInvalid={!!errorsEval.remarque}
                  />
                  <Form.Control.Feedback type="invalid">{errorsEval.remarque?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {/* Décision */}
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Décision *</Form.Label>
                  <Select
                    options={decisionOptions}
                    value={decisionOptions.find((opt) => opt.value === watchEval('decision'))}
                    onChange={(selected) => handleSelectChange('decision', selected)}
                    placeholder="Prendre une décision..."
                    isClearable
                    isDisabled={isSubmitting}
                    className={!watchEval('decision') && errorsEval.decision ? 'is-invalid' : ''}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: !watchEval('decision') && errorsEval.decision ? '#dc3545' : base.borderColor
                      })
                    }}
                  />
                  {!watchEval('decision') && <div className="invalid-feedback d-block">Décision requise</div>}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseEvaluationModal} disabled={isSubmitting} className="me-2">
              <FaTimes className="me-2" />
              Annuler
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={
                isSubmitting ||
                (editingEvaluation && !hasChanges) ||
                (!editingEvaluation && !isFormValid()) ||
                selectedSlot?.candidate?.charterSigned === true
              }
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {editingEvaluation ? 'Mise à jour...' : 'Enregistrement...'}
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  {editingEvaluation ? 'Mettre à jour' : 'Enregistrer'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ManageAuditions;