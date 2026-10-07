import { lazy, Suspense } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import { tools } from '../data/tools';
import { AppShell } from '../components/layout/AppShell';
import { ToolLayout } from '../components/layout/ToolLayout';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import AboutPage from '../pages/AboutPage';

const components = new Map(
  tools
    .filter((tool) => tool.load)
    .map((tool) => {
      const Tool = lazy(tool.load!);
      return [tool.id, <Tool key={tool.id} />];
    }),
);

function ToolRoute() {
  const { slug } = useParams();
  const tool = tools.find((entry) => entry.slug === slug);
  if (!tool) return <NotFoundPage />;
  const content = components.get(tool.id);
  return (
    <ToolLayout tool={tool}>
      <Suspense
        fallback={
          <p className="loading-state" role="status">
            ツールを読み込んでいます…
          </p>
        }
      >
        {tool.status !== 'planned' && content ? (
          content
        ) : (
          <section className="empty-state">
            <span className="planned-label">準備中</span>
            <h2>{tool.japaneseName}を準備しています</h2>
            <p>現在使えるツールは、ツール一覧からご利用いただけます。</p>
          </section>
        )}
      </Suspense>
    </ToolLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="tools/:slug" element={<ToolRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
