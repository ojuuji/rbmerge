import { Form, Stack } from 'react-bootstrap';
import Popup from '../components/Popup';

export default function AboutPopup(props) {
  return (
    <Popup title="About" {...props}>
      <Stack direction='horizontal' gap='3'>
        <img alt="Logo" src={process.env.PUBLIC_URL + '/logo.svg'} width='64' height='64'/>
        <Stack className='py-1'>
          <Form.Label>{process.env.REACT_APP_NAME}</Form.Label>
          <Form.Text className='mt-auto'>{`Version ${process.env.REACT_APP_VERSION}`}</Form.Text>
        </Stack>
      </Stack>
    </Popup>
  );
}
