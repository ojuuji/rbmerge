import { useRef, useState } from 'react';
import { Alert, Button, Form, Stack } from 'react-bootstrap';
import Popup from '../components/Popup';
import { useInventory } from '../contexts/InventoryProvider';
import importInventory from '../utils/importInventory';

export default function ImportPopup({show, handleClose}) {
  const {setInventory} = useInventory();
  const [finished, setFinished] = useState(false);
  const [finishedOk, setFinishedOk] = useState();
  const [finishedMessage, setFinishedMessage] = useState();

  const handleCloseAndFinish = () => {
    setFinished(false);
    handleClose();
  };

  const fileField = useRef();

  const onSubmit = async event => {
    event.preventDefault();

    try {
      const [file] = fileField.current.files;
      if (!file) {
        throw new Error("no file selected");
      }
      if (file.size > 50 << 20) {
        throw Error("50MB file size limit exceeded");
      }
      const data = await file.text();
      const inventory = await importInventory(data);
      setInventory(inventory);

      event.target.reset();
      setFinishedOk(true);
      setFinishedMessage("Inventory has been imported successfully.");
    }
    catch (e) {
      setFinishedOk(false);
      setFinishedMessage("Error: " + e.message);
    }
    setFinished(true);
  };

  return (
    <Popup title="Import" size='lg' show={show} handleClose={handleCloseAndFinish}>
      {finished && <Alert variant={finishedOk ? 'success' : 'danger'}>
        {finishedMessage}
      </Alert>}
      <Form onSubmit={onSubmit}>
        <Form.Group controlId='formFile'>
          <Form.Label >Select inventory HTML table</Form.Label>
          <Stack direction='horizontal' gap={1}>
            <Form.Control type='file' ref={fileField} />
            <Button variant='primary' type='submit'>Import</Button>
          </Stack>
        </Form.Group>
      </Form>
    </Popup>
  );
}
