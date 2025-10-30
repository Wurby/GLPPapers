import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Timeline from './pages/Timeline';
import About from './pages/About';
import Viewer from './pages/Viewer';
import ComponentDemo from './pages/ComponentDemo';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/about" element={<About />} />
        <Route path="/viewer/:filePath" element={<Viewer />} />
        <Route path="/demo" element={<ComponentDemo />} />
      </Route>
    </Routes>
  );
}

export default App;
