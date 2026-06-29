import React, { useState } from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useNavigate, Link } from 'react-router-dom';
import { loginUnified } from '../../../services/auth.service';
import { useAuth } from '../../../contexts/AuthContext';

const JWTLogin = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const { refreshUser } = useAuth(); // 🔁 use refreshUser instead of setUser

  return (
    <Formik
      initialValues={{ email: '', password: '', submit: null }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email('Adresse email invalide').required('Adresse email requise'),
        password: Yup.string().max(255).required('Mot de passe requis')
      })}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitError('');
        try {
          await loginUnified(values);
          await refreshUser(); // 🔁 get fresh user info after login
          navigate('/dashboard');
        } catch (error) {
          const msg = error?.message;

          if (msg?.includes('locked')) {
            setSubmitError('Ce compte est verrouillé. Veuillez contacter l’administrateur.');
          } else if (msg?.includes('Invalid credentials') || msg?.includes('Invalid password')) {
            setSubmitError('Email ou mot de passe incorrect.');
          } else {
            setSubmitError('Échec de la connexion');
          }
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <input
              className="form-control"
              placeholder="Adresse email"
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              type="email"
              value={values.email}
            />
            {touched.email && errors.email && <small className="text-danger form-text">{errors.email}</small>}
          </div>

          <div className="form-group mb-4">
            <input
              className="form-control"
              placeholder="Mot de passe"
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              type="password"
              value={values.password}
            />
            {touched.password && errors.password && <small className="text-danger form-text">{errors.password}</small>}
          </div>

          <div className="text-start mb-4 mt-2">
            <Link to="/forgot-password" style={{ fontSize: '0.9rem', fontWeight: 500, color: '#3f4d67' }}>
              Mot de passe oublié ?
            </Link>
          </div>

          {submitError && (
            <Col sm={12}>
              <Alert variant="danger">{submitError}</Alert>
            </Col>
          )}

          <Row>
            <Col>
              <Button className="btn-block mb-4" disabled={isSubmitting} type="submit" variant="primary">
                Se connecter
              </Button>
            </Col>
          </Row>
        </form>
      )}
    </Formik>
  );
};

export default JWTLogin;
