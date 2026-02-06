import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import ErdPage from './pages/ErdPage';
const qc = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(QueryClientProvider, { client: qc, children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/workspaces/:wsId/instances/:instanceId/erd", element: _jsx(ErdPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/workspaces/default/instances/demo/erd", replace: true }) })] }) }) }) }));
