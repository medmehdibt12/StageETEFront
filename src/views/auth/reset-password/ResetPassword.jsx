import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { resetPassword } from '../../../services/auth.service';
import logo from '../../../assets/images/music.png';

const MySwal = withReactContent(Swal);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

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
              <div className="mb-4">
                <i className="feather icon-lock auth-icon" />
              </div>
              <h3 className="mb-4">Nouveau mot de passe</h3>

              {!token ? (
                <Alert variant="danger">
                  <p className="mb-0">Le lien de réinitialisation est invalide ou expiré.</p>
                </Alert>
              ) : (
                <Formik
                  initialValues={{ newPassword: '', confirmPassword: '', submit: null }}
                  validationSchema={Yup.object().shape({
                    newPassword: Yup.string().min(6, 'Doit contenir au moins 6 caractères').required('Mot de passe requis'),
                    confirmPassword: Yup.string()
                      .oneOf([Yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
                      .required('Veuillez confirmer le mot de passe')
                  })}
                  onSubmit={async (values, { setErrors, setSubmitting }) => {
                    try {
                      await resetPassword({
                        token,
                        newPassword: values.newPassword,
                        confirmPassword: values.confirmPassword
                      });
                      
                      MySwal.fire({
                        icon: 'success',
                        title: 'Réinitialisation réussie',
                        text: 'Votre mot de passe a bien été mis à jour.',
                        confirmButtonColor: '#2ecc71',
                        timer: 3000
                      }).then(() => {
                        navigate('/auth/signin');
                      });
                    } catch (error) {
                      const msg = error?.message || 'Ce lien de réinitialisation est invalide ou expiré.';
                      setErrors({ submit: msg });
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
                          placeholder="Nouveau mot de passe"
                          name="newPassword"
                          onBlur={handleBlur}
                          onChange={handleChange}
                          type="password"
                          value={values.newPassword}
                        />
                        {touched.newPassword && errors.newPassword && <small className="text-danger form-text text-start d-block">{errors.newPassword}</small>}
                      </div>

                      <div className="form-group mb-4">
                        <input
                          className="form-control"
                          placeholder="Confirmer le mot de passe"
                          name="confirmPassword"
                          onBlur={handleBlur}
                          onChange={handleChange}
                          type="password"
                          value={values.confirmPassword}
                        />
                        {touched.confirmPassword && errors.confirmPassword && <small className="text-danger form-text text-start d-block">{errors.confirmPassword}</small>}
                      </div>

                      {errors.submit && (
                        <Alert variant="danger" className="text-start">
                          {errors.submit}
                        </Alert>
                      )}

                      <Button className="btn-block mb-4 w-100" disabled={isSubmitting} type="submit" variant="primary">
                        {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
                      </Button>
                    </form>
                  )}
                </Formik>
              )}

              <p className="mb-0 text-muted mt-3">
                <Link to="/auth/signin">Retour à la connexion</Link>
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPassword;
