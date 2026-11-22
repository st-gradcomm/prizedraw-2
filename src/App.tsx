import { useHashRoute } from './hooks/useHashRoute';
import StagePage from './pages/StagePage';
import WinnersPage from './pages/WinnersPage';

export default function App() {
  const route = useHashRoute();
  return route === 'winners' ? <WinnersPage /> : <StagePage />;
}
