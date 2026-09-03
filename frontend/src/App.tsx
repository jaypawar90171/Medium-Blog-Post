import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './screens/Landing';
import Cursor from './components/Cursor';
import { ThemeProvider } from './context/ThemeContext';
import SignIn from './screens/SignIn';
import Signup from './screens/Signup';
import Home from './screens/Home';
import Search from './screens/Search';
import BlogDetail from './screens/BlogDetail';
import Profile from './screens/Profile';
import Library from './screens/Library';
import Toast from './components/Toast';

const Write = lazy(() => import('./screens/Write'));

const App = () => {
  return (
    <ThemeProvider>
      <Cursor />
      <Toast />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/search" element={<Search />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route
            path="/write"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen bg-paper flex items-center justify-center text-meta">
                    Loading editor…
                  </div>
                }
              >
                <Write />
              </Suspense>
            }
          />
          <Route
            path="/write/:id"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen bg-paper flex items-center justify-center text-meta">
                    Loading editor…
                  </div>
                }
              >
                <Write />
              </Suspense>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/author/:id" element={<Profile />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App