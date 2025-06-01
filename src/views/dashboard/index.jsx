/* eslint-disable react/prop-types */
// src/components/Dashboard/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, ProgressBar, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAdminDashboard,
  getManagerDashboard
  // Nous n’appelons plus getChoristeChefDashboard, car Choriste/Chef est statique
} from '../../services/dashboard.service';
import { FaCalendarCheck, FaCalendarAlt, FaUsers, FaUserSlash, FaFileAlt, FaClock, FaMusic } from 'react-icons/fa';

// Une carte réutilisable pour afficher une icône, un titre et une valeur
const SummaryCard = ({ icon, title, value, variant }) => (
  <Card className="mb-4 shadow-sm">
    <Card.Body>
      <Row className="align-items-center">
        <Col xs={3} className="text-center">
          <div style={{ fontSize: '2rem', color: variant || '#4a90e2' }}>{icon}</div>
        </Col>
        <Col xs={9}>
          <h6 className="text-muted mb-1">{title}</h6>
          <h3 className="mb-0">{value}</h3>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role; // “admin” | “manager” | “chef de choeur” | “choriste”

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Seuls admin/manager déclenchent un fetch. Choriste/Chef est statique.
    if (userRole === 'admin' || userRole === 'manager') {
      const fetchDashboard = async () => {
        try {
          let res = {};
          if (userRole === 'admin') {
            res = await getAdminDashboard();
          } else if (userRole === 'manager') {
            res = await getManagerDashboard();
          }
          setData(res);
        } catch (err) {
          console.error(err);
          setError('Impossible de charger le tableau de bord.');
        } finally {
          setLoading(false);
        }
      };
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [userRole]);

  // Si le rôle n'est pas encore défini, afficher un spinner
  if (!userRole) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <div>Chargement des informations utilisateur…</div>
      </div>
    );
  }

  // Spinner pendant le fetch pour admin/manager
  if (loading && (userRole === 'admin' || userRole === 'manager')) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status" />
        <div>Chargement du tableau de bord…</div>
      </div>
    );
  }

  // Message d'erreur pour admin/manager
  if (error && (userRole === 'admin' || userRole === 'manager')) {
    return (
      <div className="text-center mt-5 text-danger">
        <h5>{error}</h5>
      </div>
    );
  }

  // ======= FONCTIONS DE RENDU =======

  // Admin seulement : tableau Utilisateurs par rôle
  const renderUsersByRoleTable = () => {
    if (!data?.usersByRole) return null;
    return (
      <Table bordered hover size="sm" className="mt-3">
        <thead className="table-light">
          <tr>
            <th>Rôle</th>
            <th>Nombre</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.usersByRole).map(([roleKey, count]) => {
            let label = '';
            switch (roleKey) {
              case 'admin':
                label = 'Admins';
                break;
              case 'manager':
                label = 'Managers';
                break;
              case 'choriste':
                label = 'Choristes';
                break;
              case 'chef de choeur':
                label = 'Chef de chœur';
                break;
              default:
                label = roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
            }
            return (
              <tr key={roleKey}>
                <td>{label}</td>
                <td>{count}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  // Admin seulement : barre de progression des répétitions
  const renderRepetitionsProgress = () => {
    const past = data?.repetitions?.past || 0;
    const upcoming = data?.repetitions?.upcoming || 0;
    const total = past + upcoming;
    const ratio = total === 0 ? 0 : Math.round((past / total) * 100);

    return (
      <div className="mt-3">
        <div className="d-flex justify-content-between mb-2">
          <small>Passées : {past}</small>
          <small>À venir : {upcoming}</small>
        </div>
        <ProgressBar now={ratio} label={`${ratio}% passées`} />
      </div>
    );
  };

  // Manager seulement : tableau des demandes de congé
  const renderManagerTable = () => {
    const count = data.leaveRequestsCount || 0;
    return (
      <Table bordered hover size="sm" className="mt-3">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Utilisateur</th>
            <th>Date début</th>
            <th>Date fin</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {count === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-muted">
                Aucune demande de congé en attente
              </td>
            </tr>
          )}
          {count > 0 && (
            <tr>
              <td>1</td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>En attente</td>
            </tr>
          )}
        </tbody>
      </Table>
    );
  };

  // ==== JSX PRINCIPAL ====
  return (
    <div style={{ padding: '20px' }}>
      {/* === Vue Admin === */}
      {userRole === 'admin' && data && (
        <>
          <Row>
            <Col xl={3} md={6}>
              <SummaryCard icon={<FaCalendarCheck />} title="Concerts passés" value={data.concerts?.past || 0} variant="#1abc9c" />
            </Col>
            <Col xl={3} md={6}>
              <SummaryCard icon={<FaCalendarAlt />} title="Concerts à venir" value={data.concerts?.upcoming || 0} variant="#3498db" />
            </Col>
            <Col xl={3} md={6}>
              <SummaryCard icon={<FaUserSlash />} title="Éliminations" value={data.eliminationCount || 0} variant="#e74c3c" />
            </Col>
            <Col xl={3} md={6}>
              <SummaryCard icon={<FaUsers />} title="Choristes actifs" value={data.activeChoristesCount || 0} variant="#9b59b6" />
            </Col>
          </Row>

          <Row className="mt-3">
            <Col xl={3} md={6}>
              <SummaryCard
                icon={<FaFileAlt />}
                title="Demandes d’adhésion"
                value={data.membershipSubmissionsCount || 0}
                variant="#f39c12"
              />
            </Col>
            <Col xl={3} md={6}>
              <SummaryCard icon={<FaFileAlt />} title="Adhésions acceptées" value={data.acceptedMembershipsCount || 0} variant="#27ae60" />
            </Col>
            <Col xl={3} md={6}>
              <SummaryCard icon={<FaClock />} title="Répétitions" value={`${data.repetitions?.past || 0} passées`} variant="#2ecc71" />
            </Col>
            <Col xl={3} md={6}>
              <SummaryCard icon={<FaCalendarAlt />} title="Répétitions à venir" value={data.repetitions?.upcoming || 0} variant="#e67e22" />
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Utilisateurs par rôle</h5>
                </Card.Header>
                <Card.Body>{renderUsersByRoleTable()}</Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Avancement des répétitions</h5>
                </Card.Header>
                <Card.Body>{renderRepetitionsProgress()}</Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* === Vue Manager === */}
      {userRole === 'manager' && data && (
        <>
          <Row>
            <Col xl={6} md={6}>
              <SummaryCard icon={<FaFileAlt />} title="Demandes de congé" value={data.leaveRequestsCount || 0} variant="#d35400" />
            </Col>
            <Col xl={6} md={6}>
              <SummaryCard icon={<FaUsers />} title="Choristes actifs" value={data.activeChoristesCount || 0} variant="#27ae60" />
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header>
                  <h5 className="mb-0">Demandes de congé en attente</h5>
                </Card.Header>
                <Card.Body>{renderManagerTable()}</Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* === Vue Chef de chœur (Statique) === */}
      {userRole === 'chef de choeur' && (
        <div
          style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(52,152,219,0.1), rgba(236,240,241,0.1))'
          }}
        >
          <Row className="justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
            <Col md={8} lg={6}>
              <Card
                className="shadow-lg mx-auto border-0"
                style={{
                  maxWidth: '600px',
                  borderRadius: '1rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <Card.Body className="py-5 text-center">
                  <FaMusic size={64} className="text-primary mb-4" />
                  <h1 className="fw-bold mb-2" style={{ fontSize: '2.25rem', color: '#2c3e50' }}>
                    Bonjour, Chef de chœur !
                  </h1>
                  <p className="lead mb-0" style={{ fontSize: '1.125rem', color: '#7f8c8d' }}>
                    Bienvenue sur votre espace CSO
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* === Vue Choriste (Statique) === */}
      {userRole === 'choriste' && (
        <div
          style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(39,174,96,0.1), rgba(236,240,241,0.1))'
          }}
        >
          <Row className="justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
            <Col md={8} lg={6}>
              <Card
                className="shadow-lg mx-auto border-0"
                style={{
                  maxWidth: '600px',
                  borderRadius: '1rem',
                  backgroundColor: '#ffffff'
                }}
              >
                <Card.Body className="py-5 text-center">
                  <FaMusic size={64} className="text-success mb-4" />
                  <h1 className="fw-bold mb-2" style={{ fontSize: '2.25rem', color: '#2c3e50' }}>
                    Bonjour, Choriste !
                  </h1>
                  <p className="lead mb-0" style={{ fontSize: '1.125rem', color: '#7f8c8d' }}>
                    Bienvenue sur votre espace CSO
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
