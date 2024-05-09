import { Form } from 'react-bootstrap';
import Popup from '../components/Popup';

export default function AboutPopup(props) {
  return (
    <Popup title="About" {...props}>
      <Form.Label>{process.env.REACT_APP_NAME} {process.env.REACT_APP_VERSION}</Form.Label> 
    </Popup>
  );
}
