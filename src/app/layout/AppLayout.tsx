import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { useBootstrapSession } from '@/features/auth/useSession';
import { useLocalStorage } from '@/shared/lib/hooks';
import { useEffect } from 'react';
import { AddDiseaseDialog } from '@/features/catalog/AddDiseaseDialog';

export function AppLayout() {
  useBootstrapSession();
  const [view] = useLocalStorage<'simple' | 'expert'>('view', 'simple');
  useEffect(() => {
    document.body.dataset.view = view;
  }, [view]);
  return (
    <>
      <TopBar />
      <main className="page">
        <Outlet />
      </main>
      <AddDiseaseDialog />
    </>
  );
}
