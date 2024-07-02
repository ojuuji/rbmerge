import { useState } from 'react';
import { Alert, Button, Form, Stack } from 'react-bootstrap';
import Popup from '../components/Popup';
import { useInventory } from '../contexts/InventoryProvider';
import importInventory from '../utils/importInventory';

export default function ImportPopup({show, handleClose}) {
  const {setInventory} = useInventory();
  const [state, setState] = useState();

  const handleCloseAndFinish = () => {
    setState();
    handleClose();
  };

  const handleChange = event => {
    setState({file: event.currentTarget.files[0]});
  };

  const onSubmit = async event => {
    event.preventDefault();

    let success = true;
    let message = "Inventory has been imported successfully.";

    try {
      if (state.file.size > 50 << 20) {
        throw Error("50MB file size limit exceeded");
      }
      const data = await state.file.text();
      const inventory = await importInventory(data);
      setInventory(inventory);
    }
    catch (e) {
      success = false;
      message = "Error: " + e.message;
    }

    setState({finished: true, success, message, file: null});
    event.target.reset();
  };

  return (
    <Popup title="Import" size='lg' show={show} handleClose={handleCloseAndFinish}>
      {state?.finished && <Alert variant={state.success ? 'success' : 'danger'}>
        {state.message}
      </Alert>}
      <Form onSubmit={onSubmit}>
        <Form.Group controlId='formFile'>
          <Form.Label >Select inventory CSV or HTML table</Form.Label>
          <Stack direction='horizontal' gap={1}>
            <Form.Control type='file' onChange={handleChange} />
            <Button variant='primary' type='submit' disabled={!state?.file}>Import</Button>
          </Stack>
        </Form.Group>
      </Form>
    </Popup>
  );
}
