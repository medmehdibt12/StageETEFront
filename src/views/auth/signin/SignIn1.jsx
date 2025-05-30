/* eslint-disable react/no-unescaped-entities */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { NavLink, Link } from 'react-router-dom';

import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';
import logo from '../../../assets/images/music.png';

import AuthLogin from './JWTLogin';

const Signin1 = () => {
  useEffect(() => {
    document.title = 'Bienvenue | CSO Plateforme';
  }, []);

  return (
    <React.Fragment>
      <Breadcrumb />
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
                <i className="feather icon-unlock auth-icon" />
              </div>
              <h3 className="mb-4">Se connecter</h3>
              <AuthLogin />
              {/* <p className="mb-2 text-muted">
                Forgot password?{' '}
                <NavLink to={'#'} className="f-w-400">
                  Reset
                </NavLink>
              </p> */}
              <p className="mb-0 text-muted">
                Vous n'êtes pas membre ?{' '}
                <Button
                  variant="link"
                  className="f-w-400 p-0"
                  onClick={() => window.location.href = '/choriste/formulaire'}
                >
                  Devenez membre
                </Button>
              </p>
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Signin1;