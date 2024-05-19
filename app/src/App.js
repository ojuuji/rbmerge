import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Header from './components/Header';
import DarkModeProvider from './contexts/DarkModeProvider';
import FilterOptionsProvider from './contexts/FilterOptionsProvider';
import InventoryProvider from './contexts/InventoryProvider';
import MergeOptionsProvider from './contexts/MergeOptionsProvider';
import TableOptionsProvider from './contexts/TableOptionsProvider';
import ImportPopup from './pages/ImportPopup';
import OptionsPopup from './pages/OptionsPopup';
import AboutPopup from './pages/AboutPopup';
import InventoryPage from './pages/InventoryPage';

function useWindowState() {
  const [show, setShow] = useState(false);
  const toggleShow = () => setShow(!show);

  return [show, toggleShow];
}

export default function App() {
  const [showImport, toggleShowImport] = useWindowState();
  const [showOptions, toggleShowOptions] = useWindowState();
  const [showAbout, toggleShowAbout] = useWindowState();

  return (
    <Container fluid className='App'>
      <DarkModeProvider>
        <TableOptionsProvider>
          <InventoryProvider>
            <MergeOptionsProvider>
              <FilterOptionsProvider>
                <Header toggleShowImport={toggleShowImport} toggleShowOptions={toggleShowOptions} toggleShowAbout={toggleShowAbout} />
                <ImportPopup show={showImport} handleClose={toggleShowImport} />
                <OptionsPopup show={showOptions} handleClose={toggleShowOptions} />
                <AboutPopup show={showAbout} handleClose={toggleShowAbout} />
                <InventoryPage />
              </FilterOptionsProvider>
            </MergeOptionsProvider>
          </InventoryProvider>
        </TableOptionsProvider>
      </DarkModeProvider>
    </Container>
  );
}
