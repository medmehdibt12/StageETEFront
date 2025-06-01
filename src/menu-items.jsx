import { useAuth } from './contexts/AuthContext';

const useMenuItems = () => {
  const { user } = useAuth();

  const adminPages = [
    {
      id: 'manage-accounts',
      title: 'Gérer les Comptes',
      type: 'item',
      url: '/admin/manage-accounts',
      icon: 'feather icon-users' // manage multiple user accounts
    },
    {
      id: 'manage-membership',
      title: 'Gérer les Adhésions',
      type: 'item',
      url: '/admin/manage-membership',
      icon: 'feather icon-user-check' // membership approvals
    },
    {
      id: 'manage-choriste',
      title: 'Liste des Choristes ',
      type: 'item',
      url: '/admin/manage-choriste',
      icon: 'feather icon-users' // list of users/groups
    },
    {
      id: 'manage-oeuvres',
      title: 'Gérer les Œuvres',
      type: 'item',
      url: '/admin/manage-oeuvres',
      icon: 'feather icon-music' // music works
    },
    {
      id: 'manage-concerts',
      title: 'Gérer les Concerts',
      type: 'item',
      url: '/admin/manage-concerts',
      icon: 'feather icon-calendar' // calendar events
    },
    {
      id: 'manage-rehearsals',
      title: 'Gérer les Répétitions',
      type: 'item',
      url: '/admin/manage-rehearsals',
      icon: 'feather icon-clock' // rehearsal times
    },
    {
      id: 'manage-eliminations',
      title: 'Gérer les Éliminations',
      type: 'item',
      url: '/admin/manage-eliminations',
      icon: 'feather icon-user-x' // removing users
    },
    {
      id: 'final-participants',
      title: 'Participants Finaux',
      type: 'item',
      url: '/admin/final-participants',
      icon: 'feather icon-award' // final participants / awards
    }
  ];

  const choristePages = [
    {
      id: 'season-programme',
      title: 'Programme de la Saison',
      type: 'item',
      icon: 'feather icon-calendar', // season program calendar
      url: '/choriste/season-programme'
    },
    {
      id: 'liste-repetitions',
      title: 'Liste des Répétitions',
      type: 'item',
      icon: 'feather icon-clock', // rehearsal list with times
      url: '/choriste/repetitions'
    },
    {
      id: 'liste-concerts',
      title: 'Disponibilité aux Concerts',
      type: 'item',
      icon: 'feather icon-music', // concerts related
      url: '/choriste/concerts'
    },
    {
      id: 'declare-conge',
      title: 'Déclarer un congé',
      type: 'item',
      icon: 'feather icon-file-text', // leave declaration form
      url: '/choriste/declare-conge'
    }
  ];

  const managerPages = [
    {
      id: 'seasons-programme',
      title: 'Programme de la Saison',
      type: 'item',
      icon: 'feather icon-calendar', // program calendar
      url: '/program/season-programme'
    },
    {
      id: 'gerer-conge',
      title: 'Gérer les Congés',
      type: 'item',
      icon: 'feather icon-check-square', // manage leave requests
      url: '/manager/manage-duty'
    },
    {
      id: 'gerer-tessitures',
      title: 'Gérer les Tessitures',
      type: 'item',
      icon: 'feather icon-sliders', // vocal range/settings
      url: '/manager/modify-tessiture'
    }
  ];

  const chefdechoeurPages = [
    {
      id: 'seasons-programme',
      title: 'Programme de la Saison',
      type: 'item',
      icon: 'feather icon-calendar', // season program calendar
      url: '/program/season-programme'
    }
  ];

  const role = user?.role;

  return {
    items: [
      {
        id: 'navigation',
        title: 'Navigation',
        type: 'group',
        icon: 'icon-navigation',
        children: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'item',
            icon: 'feather icon-home', // dashboard/home icon
            url: '/dashboard'
          }
        ]
      },
      {
        id: 'pages',
        title: 'Pages',
        type: 'group',
        icon: 'icon-pages',
        children:
          role === 'admin'
            ? adminPages
            : role === 'choriste'
              ? choristePages
              : role === 'manager'
                ? managerPages
                : role === 'chef de choeur'
                  ? chefdechoeurPages
                  : []
      }
    ]
  };
};

export default useMenuItems;
