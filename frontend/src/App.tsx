import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './screens/Landing';
import Cursor from './components/Cursor';
import { ThemeProvider } from './context/ThemeContext';
import SignIn from './screens/SignIn';
import Signup from './screens/Signup';
import Home from './screens/Home';

const App = () => {
  return (
    <ThemeProvider>
      <Cursor />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App