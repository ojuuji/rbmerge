import { Button, Modal } from 'react-bootstrap';

export default function Popup({title, size, children, show, handleClose}) {
  return (
    <Modal show={show} onHide={handleClose} size={size} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
