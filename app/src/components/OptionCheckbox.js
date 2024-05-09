import { useId } from 'react';
import Form from 'react-bootstrap/Form';

export default function OptionCheckbox({label, checked, onChange}) {
  const id = useId();

  return (
    <Form.Check id={id} label={label} checked={checked} onChange={e => onChange(e.target.checked)} />
  );
}
