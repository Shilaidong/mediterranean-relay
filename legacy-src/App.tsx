import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Splash } from './pages/Splash';
import { Browse } from './pages/Browse';
import { Detail } from './pages/Detail';
import { Home } from './pages/Home';
import { Trade } from './pages/Trade';
import { Linking } from './pages/Linking';
import { Profile } from './pages/Profile';
import { Community } from './pages/Community';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BottomNav } from './components/BottomNav';

const NAV_PATHS = ['/home', '/browse', '/community', '/profile'];

export function App() {
  const location = useLocation();
  const showNav = NAV_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-paper">
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <Routes location={location}>
              <Route path="/" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/detail/:id" element={<Detail />} />
              <Route
                path="/trade/:id"
                element={
                  <ProtectedRoute>
                    <Trade />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/linking"
                element={
                  <ProtectedRoute>
                    <Linking />
                  </ProtectedRoute>
                }
              />
              <Route path="/community" element={<Community />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}

export default App;
