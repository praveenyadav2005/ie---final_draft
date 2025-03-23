// main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import LandingPage from './components/LandingPage.jsx';
import LearnMore from './components/LearnMore.jsx';
import Dashboard from './components/Dashboard.jsx';
import PassphraseEntry from './components/PassphraseEntry.jsx';
import {
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';

const router = createHashRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />}>
      <Route index element={<LandingPage />} /> {/* LandingPage is the default route */}
      <Route path='learnMore' element={<LearnMore />} /> 
      <Route path='dashboard' element={<Dashboard />} />
      <Route path='passphrase-entry' element={<PassphraseEntry />} />
    </Route>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);