import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './screens/Landing';
import Cursor from './components/Cursor';
import { ThemeProvider } from './context/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      <Cursor />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App