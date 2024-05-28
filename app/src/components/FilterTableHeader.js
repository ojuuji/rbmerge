import { useId } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

export default function FilterTableHeader({setFilter, value, name, className}) {
  const id = useId();

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setFilter('');
    }
  };
  const handleClear = () => {
    document.getElementById(id).focus();
    setFilter('');
  };

  return (
    <th className={`${className} p-0`}>
      <InputGroup className='p-0'>
        <Form.Control
          className='m-1 border-0'
          type='text'
          id={id}
          placeholder={name}
          value={value}
          onChange={e => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {value.length < 2 ? <></> :
          <Button onClick={handleClear} variant='outline-primary' className='border-0' title="Clear">✕</Button>
        }
      </InputGroup>
    </th>
  );
}
