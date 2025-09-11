import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { Toaster } from './../node_modules/react-hot-toast/src/components/toaster';

createRoot(document.getElementById('root')).render(
  //<StrictMode>
    <App />,
    <Toaster />
  //</StrictMode>
)