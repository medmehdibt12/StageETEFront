import { useAuth } from './contexts/AuthContext';

const useMenuItems = () => {
  const { user } = useAuth();

  const adminPages = [
    {
      id: 'manage-accounts',
      title: 'Gérer les Comptes',
      type: 'item',
      url: '/admin/manage-accounts',
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
      id: 'final-participants',
      title: 'Participants Finaux aux Concerts',
      type: 'item',
      url: '/admin/final-participants',
      icon: 'feather icon-award'
    }
  ];

  // ✅ DYNAMIC: Base choriste pages + conditional chef de pupitre page
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
      icon: 'feather icon-clock',
      url: '/choriste/repetitions'
    },
    {
      id: 'liste-concerts',
      title: 'Disponibilité aux Concerts',
      type: 'item',
      icon: 'feather icon-music',
      url: '/choriste/concerts'
    },
    {
      id: 'declare-conge',
      title: 'Déclarer un congé',
      type: 'item',
      icon: 'feather icon-file-text',
      url: '/choriste/declare-conge'
    },
    // ✅ CONDITIONAL: Only show if choriste is ALSO chef de pupitre
    ...(user?.isChefDePupitre
      ? [
          {
            id: 'manage-presences',
            title: 'Gérer les présences',
            type: 'item',
            icon: 'feather icon-check-square',
            url: '/chefpupitre/choriste-list-presence'
          },
          {
            id: 'manage-repetitions',
            title: 'Gérer les Répétitions',
            type: 'item',
            url: '/chefpupitre/manage-rep-forpupitre',
            icon: 'feather icon-clock'
          }
        ]
      : [])
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
      title: 'Liste Declaration des Congés',
      type: 'item',
      icon: 'feather icon-check-square',
      url: '/manager/manage-duty'
    },
    {
      id: 'gerer-tessitures',
      title: 'Modification des tessitures',
      type: 'item',
      icon: 'feather icon-sliders',
      url: '/manager/modify-tessiture'
    },
    {
      id: 'absence-report',
      title: 'État des Absences',
      type: 'item',
      url: '/manager/absence-list',
      icon: 'feather icon-file-text'
    },

    {
      id: 'manage-chef',
      title: 'Gérer les Chefs de pupitre',
      type: 'item',
      url: '/manager/manage-chef',
      icon: 'feather icon-users'
    },
    {
      id: 'manage-auditions',
      title: 'Gérer les Auditions',
      type: 'item',
      url: '/manager/manage-auditions',
      icon: 'feather icon-mic'
    },
    {
      id: 'manage-membership',
      title: 'Listes des candidats',
      type: 'item',
      url: '/manager/manage-membership',
      icon: 'feather icon-user-check'
    },
    {
      id: 'reschedule-requests',
      title: 'Gérer les Demandes de Reprogrammation',
      type: 'item',
      url: '/manager/reschedule-requests',
      icon: 'feather icon-refresh-cw'
    }
  ];

  const chefdechoeurPages = [
    {
      id: 'seasons-programme',
      title: 'Programme de la Saison',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/program/season-programme'
    },
    {
      id: 'list-choriste',
      title: 'Liste des Choristes',
      type: 'item',
      url: '/chef/list-choriste',
      icon: 'feather icon-users'
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
