import { useAuth } from './contexts/AuthContext';

const useMenuItems = () => {
  const { user } = useAuth();

  const adminPages = [
    {
      id: 'manage-accounts',
      title: 'Gérer les Comptes',
      type: 'item',
      url: '/admin/manage-accounts',
      icon: 'feather icon-user-plus'
    },
    {
      id: 'manage-membership',
      title: 'Gérer les Adhésions',
      type: 'item',
      url: '/admin/manage-membership',
      icon: 'feather icon-user-plus'
    },
    {
      id: 'manage-choriste',
      title: 'Liste des Choristes ',
      type: 'item',
      url: '/admin/manage-choriste',
      icon: 'feather icon-users'
    },
    {
      id: 'manage-oeuvres',
      title: 'Gérer les Œuvres',
      type: 'item',
      url: '/admin/manage-oeuvres',
      icon: 'feather icon-music'
    },
    {
      id: 'manage-concerts',
      title: 'Gérer les Concerts',
      type: 'item',
      url: '/admin/manage-concerts',
      icon: 'feather icon-calendar'
    },
    {
      id: 'manage-rehearsals',
      title: 'Gérer les Répétitions',
      type: 'item',
      url: '/admin/manage-rehearsals',
      icon: 'feather icon-clock'
    },
    {
      id: 'manage-eliminations',
      title: 'Gérer les Éliminations',
      type: 'item',
      url: '/admin/manage-eliminations',
      icon: 'feather icon-user-x'
    },
    {
      id: 'final-participants',
      title: 'Participants Finaux',
      type: 'item',
      url: '/admin/final-participants',
      icon: 'feather icon-check-circle'
    }
  ];

  const choristePages = [
    {
      id: 'season-programme',
      title: 'Programme de la Saison',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/choriste/season-programme'
    },
    {
      id: 'liste-repetitions',
      title: 'Liste des Répétitions',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/choriste/repetitions'
    },
    {
      id: 'liste-concerts',
      title: 'Disponibilité aux Concerts',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/choriste/concerts'
    },
    {
      id: 'declare-conge',
      title: 'Déclarer un congé',
      type: 'item',
      icon: 'feather icon-pause-circle',
      url: '/choriste/declare-conge'
    }
  ];

  const managerPages = [
    {
      id: 'seasons-programme',
      title: 'Programme de la Saison',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/program/season-programme'
    },
    {
      id: 'gerer-conge',
      title: 'Gérer les congés',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/manager/manage-duty'
    }
  ]; // Add later if needed

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
            icon: 'feather icon-home',
            url: '/dashboard'
          }
        ]
      },
      {
        id: 'pages',
        title: 'Pages',
        type: 'group',
        icon: 'icon-pages',
        children: role === 'admin' ? adminPages : role === 'choriste' ? choristePages : role === 'manager' ? managerPages : []
      }
    ]
  };
};

export default useMenuItems;
