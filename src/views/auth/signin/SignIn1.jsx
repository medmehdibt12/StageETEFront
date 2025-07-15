/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Card } from 'react-bootstrap';
import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';
import logo from '../../../assets/images/music.png';
import AuthLogin from './JWTLogin';
// import { getConfig } from '../../../services/config.service';

const Signin1 = () => {
  // const [signupActive, setSignupActive] = useState(false);

  // useEffect(() => {
  //   document.title = 'Bienvenue | CSO Plateforme';

  //   const fetchConfig = async () => {
  //     try {
  //       const config = await getConfig();
  //       if (config && typeof config.signupActive === 'boolean') {
  //         setSignupActive(config.signupActive);
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch config:', error);
  //     }
  //   };

  //   fetchConfig();
  // }, []);

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
            </Card.Body>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Signin1;
