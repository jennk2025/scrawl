import { useEffect } from 'react';
import { BrowserRouter, HashRouter, MemoryRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { usePlanner } from './store/plannerStore';
import { Header } from './components/Header';
import Library from './views/Library';
import MonthView from './views/MonthView';
import DayNote from './views/DayNote';
import WeekView from './views/WeekView';
import YearView from './views/YearView';
import ExamPlanner from './views/ExamPlanner';
import Habits from './views/Habits';
import Review from './views/Review';
import Settings from './views/Settings';
import Notebook from './views/Notebook';

function Root() {
  const theme = usePlanner((s) => s.theme);
  const carryMode = usePlanner((s) => s.carryMode);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  // 앱을 열 때와 다시 볼 때(다음 날 켜 둔 탭 포함) 미완료 할 일을 오늘로 이월
  useEffect(() => {
    const run = () => {
      if (usePlanner.getState().carryMode === 'auto') usePlanner.getState().runCarryOver();
    };
    run();
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [carryMode]);

  return <Outlet />;
}

function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <Header />
      <main key={pathname} className={`page ${pathname.startsWith('/day') ? 'flip-in' : 'fade-in'}`}>
        <Outlet />
      </main>
    </>
  );
}

// 파일을 더블클릭해서 열면(file://) # 주소를, 한 파일로 묶어 다른 곳(아티팩트 등)에 올리면 메모리 주소를 쓴다
const Router =
  window.location.protocol === 'file:'
    ? HashRouter
    : import.meta.env.MODE === 'file'
      ? MemoryRouter
      : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Root />}>
        <Route element={<Layout />}>
          <Route path="/year/:year?" element={<YearView />} />
          <Route path="/month/:ym?" element={<MonthView />} />
          <Route path="/week/:w?" element={<WeekView />} />
          <Route path="/day/:date?" element={<DayNote />} />
          <Route path="/exams" element={<ExamPlanner />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/review/:w?" element={<Review />} />
          <Route path="/notebook/:ym?" element={<Notebook />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Library />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
