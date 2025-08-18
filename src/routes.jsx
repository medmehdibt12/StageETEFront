import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from './components/Loader/Loader';
import AdminLayout from './layouts/AdminLayout';
import { BASE_URL } from './config/constant';
import RequireAuth from './components/Auth/RequireAuth';
import RedirectIfAuth from './components/Auth/RedirectIfAuth';

// Render nested routes with guards/layouts
export const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loader />}>
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Element = route.element;

        return (
          <Route
            key={i}
            path={route.path}
            element={
              <Guard>
                <Layout>{route.routes ? renderRoutes(route.routes) : <Element props={true} />}</Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  </Suspense>
);

// Main route definitions
const routes = [
  {
    exact: 'true',
    path: '/',
    element: () => <Navigate to={localStorage.getItem('token') ? '/dashboard' : '/auth/signin'} />
  },
  {
    exact: 'true',
    path: '/auth/signin',
    guard: RedirectIfAuth,
    element: lazy(() => import('./views/auth/signin/SignIn1'))
  },
  {
    path: '/candidature/formulaire', // New route for Formulaire
    element: lazy(() => import('./views/choristeSidebarContents/formulaire/Formulaire'))
  },
  {
    path: '/confirm-email',
    element: lazy(() => import('./views/public/ConfirmEmailSuccess'))
  },
  // 🎯 NEW: Public convocation response route (no auth required)
  {
    path: '/convocation/response/:candidateId',
    element: lazy(() => import('./views/candidate/ConvocationResponse'))
  },
  {
    path: '/charter/sign/:token',
    element: lazy(() => import('./views/candidate/CharterSigning'))
  },
  {
    path: '*',
    guard: RequireAuth,
    layout: AdminLayout,
    routes: [
      {
        exact: 'true',
        path: '/dashboard',
        element: lazy(() => import('./views/dashboard'))
      },
      // 🔽 Admin Management Features
      {
        path: '/admin/manage-accounts',
        element: lazy(() => import('./views/adminSidebarContents/accounts/ManageAccounts'))
      },
      {
        path: '/admin/manage-eliminations',
        element: lazy(() => import('./views/adminSidebarContents/eliminations/ManageEliminations'))
      },
      {
        path: '/admin/manage-oeuvres',
        element: lazy(() => import('./views/adminSidebarContents/oeuvres/ManageOeuvres'))
      },

      {
        path: '/admin/manage-choriste',
        element: lazy(() => import('./views/adminSidebarContents/choriste/ManageChoriste'))
      },
      {
        path: '/admin/manage-concerts',
        element: lazy(() => import('./views/adminSidebarContents/concerts/ManageConcerts'))
      },
      {
        path: '/admin/manage-rehearsals',
        element: lazy(() => import('./views/adminSidebarContents/rehearsals/ManageRehearsals'))
      },

      {
        path: '/admin/final-participants',
        element: lazy(() => import('./views/adminSidebarContents/participants/FinalParticipants'))
      },

      // 🔽 Common
      {
        path: '/user/profile',
        element: lazy(() => import('./views/common/ProfilePage'))
      },

      // 🔽 Choriste Pages
      {
        path: '/choriste/season-programme',
        element: lazy(() => import('./views/choristeSidebarContents/season/SeasonProgramme'))
      },
      {
        path: '/choriste/declare-conge',
        element: lazy(() => import('./views/choristeSidebarContents/record/DeclareRecord'))
      },
      {
        path: '/choriste/repetitions',
        element: lazy(() => import('./views/choristeSidebarContents/rehearsals/RehearsalsList'))
      },
      {
        path: '/choriste/concerts',
        element: lazy(() => import('./views/choristeSidebarContents/concert/ConcertsAvailability'))
      },

      // 🔽 Manager Pages
      {
        path: '/program/season-programme',
        element: lazy(() => import('./views/choristeSidebarContents/season/SeasonProgramme'))
      },
      {
        path: '/manager/manage-duty',
        element: lazy(() => import('./views/managerSidebarContents/record/ManageLeave'))
      },
      {
        path: '/manager/modify-tessiture',
        element: lazy(() => import('./views/managerSidebarContents/tessiture/GestionTessiture'))
      },
      {
        path: 'manager/reschedule-requests',
        element: lazy(() => import('./views/managerSidebarContents/reschedule/RescheduleCandidate'))
      },
      {
        path: '/manager/manage-auditions',
        element: lazy(() => import('./views/adminSidebarContents/auditions/ManageAuditions'))
      },
      {
        path: '/manager/manage-membership',
        element: lazy(() => import('./views/adminSidebarContents/membership/ManageMembership'))
      },
      {
        path: '/manager/manage-chef',
        element: lazy(() => import('./views/managerSidebarContents/chefpupitre/ManageChefPupitre'))
      },
      {
        path: '/manager/absence-list',
        element: lazy(() => import('./views/managerSidebarContents/absencelist/AbsenceReport'))
      },

      // 🔽 Chef Choeur Pages
      {
        path: '/chef/list-choriste',
        element: lazy(() => import('./views/chefSidebarContents/choriste/ListChoriste'))
      },
      // 🔽 Chef Pupitre Pages
      {
        path: '/chefpupitre/choriste-list-presence',
        element: lazy(() => import('./views/chefpupitreSidebarContents/presence/PresenceList'))
      },
      {
        path: '/chefpupitre/manage-rep-forpupitre',
        element: lazy(() => import('./views/chefpupitreSidebarContents/notifhispupitre/ChefPupitreNotifications'))
      },
      {
        path: '*',
        exact: 'true',
        element: () => <Navigate to={BASE_URL} />
      }
    ]
  }
];

export default routes;
