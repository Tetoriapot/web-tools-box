import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { ToastProvider } from '../components/common/Toast';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
