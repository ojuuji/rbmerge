import { useId } from 'react';
import Form from 'react-bootstrap/Form';

export default function FilterTableHeader({setFilter, value, name, ...attributes}) {
  const id = useId();

  return (
    <th {...attributes}>
      <Form.Control
        className='m-1 border-0'
        type='text'
        id={id}
        placeholder={name}
        value={value}
        onChange={e => setFilter(e.target.value)}
      />
    </th>
  );
}
