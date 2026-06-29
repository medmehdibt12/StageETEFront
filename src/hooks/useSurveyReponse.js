/* eslint-disable prettier/prettier */
import { useState, useCallback } from 'react';
import { respondToSurvey, getMaReponse } from '../services/survey.service';

const useSurveyReponse = (surveyId) => {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReponse, setExistingReponse] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const buildReponses = () =>
    Object.entries(answers).map(([questionId, valeur]) => ({ questionId, valeur }));

  // Returns true if choriste has already answered
  const checkDejaRepondu = async () => {
    try {
      const data = await getMaReponse(surveyId);
      setExistingReponse(data);
      return true;
    } catch {
      return false;
    }
  };

  // Validate obligatoire questions
  const validate = (questions) => {
    const errors = {};
    questions.forEach((q) => {
      if (q.obligatoire) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[q.id] = 'Cette question est obligatoire';
        }
      }
    });
    return errors;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const reponses = buildReponses();
      await respondToSurvey(surveyId, reponses);
      setSubmitted(true);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    answers,
    handleChange,
    handleSubmit,
    submitting,
    submitted,
    checkDejaRepondu,
    existingReponse,
    error,
    validate
  };
};

export default useSurveyReponse;
