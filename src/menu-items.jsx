import { useAuth } from './contexts/AuthContext';

const useMenuItems = () => {
  const { user } = useAuth();

  const adminPages = [
    {
      id: 'manage-accounts',
      title: 'Gérer les comptes',
      type: 'item',
      url: '/admin/manage-accounts',
      icon: 'feather icon-users'
    },
    {
      id: 'manage-oeuvres',
      title: 'Gérer les œuvres',
      type: 'item',
      url: '/admin/manage-oeuvres',
      icon: 'feather icon-music'
    },
    {
      id: 'media-oeuvres',
      title: 'Médias des Œuvres',
      type: 'item',
      icon: 'feather icon-play-circle',
      url: '/common/media-oeuvres'
    },
    {
      id: 'manage-concerts',
      title: 'Gérer les concerts',
      type: 'item',
      url: '/admin/manage-concerts',
      icon: 'feather icon-calendar'
    },
    {
      id: 'manage-rehearsals',
      title: 'Gérer les répétitions',
      type: 'item',
      url: '/admin/manage-rehearsals',
      icon: 'feather icon-clock'
    },
    {
      id: 'manage-eliminations',
      title: 'Gérer les éliminations',
      type: 'item',
      url: '/admin/manage-eliminations',
      icon: 'feather icon-user-x'
    },
    {
      id: 'final-participants',
      title: 'Participants finaux aux concerts',
      type: 'item',
      url: '/admin/final-participants',
      icon: 'feather icon-award'
    }
  ];

  const choristePages = [
    {
      id: 'season-programme',
      title: 'Programme de la saison',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/choriste/season-programme'
    },
    {
      id: 'liste-repetitions',
      title: 'Liste des répétitions',
      type: 'item',
      icon: 'feather icon-clock',
      url: '/choriste/repetitions'
    },
    {
      id: 'liste-concerts',
      title: 'Disponibilité aux concerts',
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
    ...(user?.isChefDePupitre
      ? [
        {
          id: 'media-oeuvres',
          title: 'Médias des Œuvres',
          type: 'item',
          icon: 'feather icon-play-circle',
          url: '/common/media-oeuvres'
        },
        {
          id: 'manage-presences',
          title: 'Gérer les présences',
          type: 'item',
          icon: 'feather icon-check-square',
          url: '/chefpupitre/choriste-list-presence'
        },
        {
          id: 'final-participant-pupitre',
          title: 'Participants finaux aux concerts',
          type: 'item',
          icon: 'feather icon-award',
          url: '/chefpupitre/final-participants'
        }
      ]
      : [])
  ];

  const managerPages = [
    {
      id: 'seasons-programme',
      title: 'Programme de la saison',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/program/season-programme'
    },
    {
      id: 'media-oeuvres',
      title: 'Médias des Œuvres',
      type: 'item',
      icon: 'feather icon-music',
      url: '/common/media-oeuvres'
    },
    {
      id: 'gerer-conge',
      title: 'Liste déclaration des congés',
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
      title: 'État des absences',
      type: 'item',
      url: '/manager/absence-list',
      icon: 'feather icon-file-text'
    },
    {
      id: 'manage-chef',
      title: 'Gérer les chefs de pupitre',
      type: 'item',
      url: '/manager/manage-chef',
      icon: 'feather icon-users'
    },
    {
      id: 'manage-repetitions',
      title: 'Gérer les répétitions',
      type: 'item',
      url: '/manager/manage-rep-forpupitre',
      icon: 'feather icon-clock'
    },
    {
      id: 'manage-chart',
      title: 'Gérer les chartes',
      type: 'item',
      url: '/manager/manage-chart',
      icon: 'feather icon-file-text'
    },
    {
      id: 'manage-auditions',
      title: 'Gérer les auditions',
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
      title: 'Gérer les demandes de reprogrammation',
      type: 'item',
      url: '/manager/reschedule-requests',
      icon: 'feather icon-refresh-cw'
    }
  ];

  const chefdechoeurPages = [
    {
      id: 'seasons-programme',
      title: 'Programme de la saison',
      type: 'item',
      icon: 'feather icon-calendar',
      url: '/program/season-programme'
    },
    {
      id: 'media-oeuvres',
      title: 'Médias des Œuvres',
      type: 'item',
      icon: 'feather icon-music',
      url: '/common/media-oeuvres'
    },
    {
      id: 'list-choriste',
      title: 'Liste des choristes',
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
