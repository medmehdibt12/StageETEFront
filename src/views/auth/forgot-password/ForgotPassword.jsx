import React, { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { forgotPassword } from '../../../services/auth.service';
import logo from '../../../assets/images/music.png';

const MySwal = withReactContent(Swal);

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <React.Fragment>
      <div className="auth-wrapper">
        <div className="auth-content">
          <div className="auth-bg">
            <span className="r" />
            <span className="r s" />
            <span className="r s" />
            <span className="r" />
          </div>
          <Card className="borderless text-center">
            <Card.Body>
              <div className="mb-4">
                <img src={logo} alt="CSO Logo" style={{ maxWidth: '120px', height: 'auto' }} />
              </div>
              {isSubmitted ? (
                <div className="text-center">
                  <div className="mb-4">
                    <div style={{ width: '80px', height: '80px', background: '#2ecc71', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      <svg fill="none" stroke="white" viewBox="0 0 24 24" style={{ width: '40px', height: '40px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                  <h3 className="mb-3">Lien envoyé !</h3>
                  <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                    Si un compte existe avec cette adresse email, vous allez recevoir un e-mail contenant les instructions pour réinitialiser votre mot de passe.
                  </p>
                  <Link to="/auth/signin" className="btn btn-primary d-block w-100">
                    Retour à la connexion
                  </Link>
                </div>
              ) : (
                <React.Fragment>
                  <div className="mb-4">
                    <i className="feather icon-mail auth-icon" />
                  </div>
                  <h3 className="mb-4">Mot de passe oublié</h3>
                  <p className="text-muted mb-4">
                    Entrez votre adresse email. Si un compte existe, nous vous enverrons un lien de réinitialisation.
                  </p>

                  <Formik
                    initialValues={{ email: '', submit: null }}
                    validationSchema={Yup.object().shape({
                      email: Yup.string().email('Adresse email invalide').required('Adresse email requise')
                    })}
                    onSubmit={async (values, { setErrors, setSubmitting }) => {
                      try {
                        await forgotPassword(values.email);
                        setIsSubmitted(true);
                      } catch (error) {
                        const msg = error?.message || 'Une erreur est survenue';
                        setErrors({ submit: msg });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                      <form noValidate onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                          <input
                            className="form-control"
                            placeholder="Adresse email"
                            name="email"
                            onBlur={handleBlur}
                            onChange={handleChange}
                            type="email"
                            value={values.email}
                          />
                          {touched.email && errors.email && <small className="text-danger form-text text-start d-block">{errors.email}</small>}
                        </div>

                        {errors.submit && (
                          <Alert variant="danger" className="text-start">
                            {errors.submit}
                          </Alert>
                        )}

                        <Button className="btn-block mb-4 w-100" disabled={isSubmitting} type="submit" variant="primary">
                          {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}
                        </Button>
                      </form>
                    )}
                  </Formik>

                  <p className="mb-0 text-muted">
                    <Link to="/auth/signin">Retour à la connexion</Link>
                  </p>
                </React.Fragment>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ForgotPassword;
