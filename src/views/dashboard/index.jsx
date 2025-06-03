/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Spinner, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminDashboard, getManagerDashboard } from '../../services/dashboard.service';
import { getParticipationThreshold, updateParticipationThreshold } from '../../services/config.service';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Formik, Form as FormikForm, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaCalendarCheck, FaCalendarAlt, FaUsers, FaFileAlt, FaClock } from 'react-icons/fa';

const Toast = withReactContent(Swal).mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true
});

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

const ParticipationThresholdCard = () => {
  const [threshold, setThreshold] = useState(null);
  const [savedValue, setSavedValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getParticipationThreshold()
      .then((value) => {
        setThreshold(value);
        setSavedValue(String(value));
      })
      .catch(() => {
        Toast.fire({ icon: 'error', title: 'Erreur de chargement du seuil.' });
      })
      .finally(() => setLoading(false));
  }, []);

  const validationSchema = Yup.object().shape({
    seuil: Yup.string()
      .required('Le seuil est requis')
      .test('is-number', 'Le seuil doit être un nombre valide', (value) => !isNaN(value))
      .test('is-in-range', 'Le seuil doit être entre 0 et 100', (value) => {
        const number = Number(value);
        return number >= 0 && number <= 100;
      })
  });

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await updateParticipationThreshold(Number(values.seuil));
      setSavedValue(values.seuil);
      Toast.fire({ icon: 'success', title: 'Seuil mis à jour !' });
    } catch {
      Toast.fire({ icon: 'error', title: 'Erreur lors de la mise à jour.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="mt-4">
        <Card.Header>Seuil de participation requis (%)</Card.Header>
        <Card.Body className="text-center">
          <Spinner animation="border" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <Card.Header>Seuil de participation requis (%)</Card.Header>
      <Card.Body>
        <Formik
          initialValues={{ seuil: String(threshold) }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
          enableReinitialize
        >
          {({ isSubmitting, errors, isValid, values }) => {
            const hasChangedSinceLastSave = values.seuil !== savedValue;
            const canSubmit = isValid && hasChangedSinceLastSave && !saving && !isSubmitting;

            return (
              <FormikForm>
                <Field name="seuil">
                  {({ field, form }) => (
                    <input
                      {...field}
                      type="text"
                      className={`form-control ${form.errors.seuil ? 'is-invalid' : ''}`}
                      inputMode="numeric"
                      onChange={(e) => {
                        form.setFieldValue('seuil', e.target.value);
                        form.setFieldTouched('seuil', true, true);
                      }}
                    />
                  )}
                </Field>
                <ErrorMessage name="seuil" component="div" className="text-danger mt-1" />
                <Button type="submit" className="mt-2" disabled={!canSubmit}>
                  {saving ? 'Mise à jour…' : 'Mettre à jour'}
                </Button>
              </FormikForm>
            );
          }}
        </Formik>
      </Card.Body>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'manager') {
      const fetchDashboard = async () => {
        try {
          const res = userRole === 'admin' ? await getAdminDashboard() : await getManagerDashboard();
          setData(res);
        } catch {
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

  if (!userRole || loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <div>Chargement…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5 text-danger">
        <h5>{error}</h5>
      </div>
    );
  }

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
            const label =
              {
                admin: 'Admins',
                manager: 'Managers',
                choriste: 'Choristes',
                'chef de choeur': 'Chef de chœur'
              }[roleKey] || roleKey;
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
          {count === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-muted">
                Aucune demande
              </td>
            </tr>
          ) : (
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

  return (
    <div style={{ padding: '20px' }}>
      {userRole === 'admin' && data && (
        <>
          <Row>
            <Col xl={3}>
              <SummaryCard icon={<FaCalendarCheck />} title="Concerts passés" value={data.concerts?.past || 0} variant="#1abc9c" />
            </Col>
            <Col xl={3}>
              <SummaryCard icon={<FaCalendarAlt />} title="Concerts à venir" value={data.concerts?.upcoming || 0} variant="#3498db" />
            </Col>
            <Col xl={3}>
              <SummaryCard icon={<FaUsers />} title="Choristes actifs" value={data.activeChoristesCount || 0} variant="#9b59b6" />
            </Col>
            <Col xl={3}>
              <SummaryCard icon={<FaCalendarAlt />} title="Répétitions à venir" value={data.repetitions?.upcoming || 0} variant="#e67e22" />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col xl={3}>
              <SummaryCard icon={<FaClock />} title="Répétitions passées" value={data.repetitions?.past || 0} variant="#2ecc71" />
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
          <Row>
            <Col>
              <ParticipationThresholdCard />
            </Col>
          </Row>
        </>
      )}
      {userRole === 'manager' && data && (
        <>
          <Row>
            <Col xl={6}>
              <SummaryCard icon={<FaFileAlt />} title="Demandes de congé" value={data.leaveRequestsCount || 0} variant="#d35400" />
            </Col>
            <Col xl={6}>
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
    </div>
  );
};

export default Dashboard;
