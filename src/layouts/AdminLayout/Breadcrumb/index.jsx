import { useLocation, useNavigate } from 'react-router-dom';
import { ListGroup } from 'react-bootstrap';
import { BASE_TITLE } from '../../../config/constant';

// 📌 Static path-title mapping
const titleMap = {
  '/dashboard': 'Dashboard',
  '/admin/manage-accounts': 'Gérer les comptes',
  '/admin/manage-oeuvres': 'Gérer les œuvres',
  '/admin/manage-concerts': 'Gérer les concerts',
  '/admin/manage-rehearsals': 'Gérer les répétitions',
  '/admin/manage-eliminations': 'Gérer les éliminations',
  '/admin/final-participants': 'Participants finaux aux concerts',

  '/user/profile': 'Mon profile',

  '/choriste/season-programme': 'Programme de la saison',
  '/choriste/repetitions': 'Liste des répétitions',
  '/choriste/concerts': 'Disponibilité aux concerts',
  '/choriste/declare-conge': 'Déclarer un congé',

  '/manager/manage-chef': 'Gérer les chefs de pupitre',
  '/manager/manage-duty': 'Liste déclaration des congés',
  '/manager/modify-tessiture': 'Modification des tessitures',
  '/manager/reschedule-requests': 'Gérer les demandes de reprogrammation',
  '/manager/manage-auditions': 'Gérer les auditions',
  '/manager/manage-membership': 'Listes des candidats',
  '/manager/absence-list': 'État des absences',
  '/manager/manage-rep-forpupitre': 'Gérer les répétitions',
  '/manager/manage-chart': 'Gérer les chartes',

  '/chef/list-choriste': 'Liste des choristes',

  '/chefpupitre/choriste-list-presence': 'Gérer les présences',
  '/chefpupitre/final-participants': 'Participants finaux aux concerts',

  '/program/season-programme': 'Programme de la saison',
};

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 🛑 Do not show breadcrumb on any /auth/* route
  if (pathname.startsWith('/auth')) return null;

  const title = titleMap[pathname] || 'Dashboard';
  document.title = `${title}${BASE_TITLE}`;

  return (
    <div className="page-header">
      <div className="page-block">
        <div className="row align-items-center">
          <div className="col-md-12">
            <div className="page-header-title">
              <h5 className="m-b-10" style={{ fontWeight: 'bold' }}>
                {title}
              </h5>
            </div>
            <ListGroup as="ul" bsPrefix=" " className="breadcrumb">
              <ListGroup.Item
                as="li"
                bsPrefix=" "
                className="breadcrumb-item"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/dashboard')}
              >
                <i className="feather icon-home" />
              </ListGroup.Item>
              <ListGroup.Item as="li" bsPrefix=" " className="breadcrumb-item active">
                {title}
              </ListGroup.Item>
            </ListGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
