/* eslint-disable react/prop-types */
import React from 'react';
import { Navigate } from 'react-router-dom';

const RedirectIfAuth = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default RedirectIfAuth;
