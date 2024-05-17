import { Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { useDarkMode } from '../contexts/DarkModeProvider';
// import logo from '../logo.svg';

function makeOnClick(url) {
  return e => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener');
  };
}

export default function Header({toggleShowImport, toggleShowOptions, toggleShowAbout}) {
  const {darkMode} = useDarkMode();

  return (
    <Navbar bg={darkMode ? 'dark' : 'light'} className='Header'>
      <Container fluid>
        <Navbar.Brand>
          <img alt="Logo" src={process.env.PUBLIC_URL + '/logo.svg'} width='30' height='30' className='align-top'/>
          {' '}{process.env.REACT_APP_NAME}
        </Navbar.Brand>
        <Nav className='mx-2'>
          <Nav.Link onClick={toggleShowImport}>Import</Nav.Link>
          <Nav.Link onClick={toggleShowOptions}>Options</Nav.Link>
          <Dropdown as={Nav.Item} align='end'>
            <Dropdown.Toggle as={Nav.Link}>Help</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={makeOnClick('https://ojuuji.github.io/rbmerge/help/')}>Documentation</Dropdown.Item>
              <Dropdown.Item onClick={makeOnClick('https://github.com/ojuuji/rbmerge/issues')}>Report an Issue</Dropdown.Item>
              <Dropdown.Item onClick={toggleShowAbout}>About</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}
