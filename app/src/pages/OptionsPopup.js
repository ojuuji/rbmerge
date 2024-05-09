import { Form, Col, Row } from 'react-bootstrap';
import OptionCheckbox from '../components/OptionCheckbox';
import Popup from '../components/Popup';
import { useDarkMode } from '../contexts/DarkModeProvider';
import { useFilterOptions } from '../contexts/FilterOptionsProvider';
import { useMergeOptions } from '../contexts/MergeOptionsProvider';
import { useTableOptions } from '../contexts/TableOptionsProvider';

export default function OptionsPopup(props) {
  const options = {...useDarkMode(), ...useFilterOptions(), ...useMergeOptions(), ...useTableOptions()};

  return (
    <Popup title="Options" {...props}>
      <Form className='mb-4'>
        <fieldset>
          <OptionCheckbox label="Dark mode" checked={options.darkMode} onChange={options.setDarkMode} />
        </fieldset>
      </Form>
      <Form className='mb-4'>
        <fieldset>
          <legend>Table</legend>
          <OptionCheckbox label="Sticky header" checked={options.tableStickyHeader} onChange={options.setTableStickyHeader} />
        </fieldset>
      </Form>
      <Form className='mb-4'>
        <fieldset>
          <legend>Merge</legend>
          <Row>
            <Col><OptionCheckbox label="prints" checked={options.mergePrints} onChange={options.setMergePrints} /></Col>
            <Col><OptionCheckbox label="patterns" checked={options.mergePatterns} onChange={options.setMergePatterns} /></Col>
            <Col><OptionCheckbox label="molds" checked={options.mergeMolds} onChange={options.setMergeMolds} /></Col>
            <Col><OptionCheckbox label="alternates" checked={options.mergeAlternates} onChange={options.setMergeAlternates} /></Col>
            <Col><OptionCheckbox label="extra" checked={options.mergeExtra} onChange={options.setMergeExtra} /></Col>
          </Row>
        </fieldset>
      </Form>
      <Form className='mb-3'>
        <fieldset>
          <legend>Filter</legend>
          <OptionCheckbox label="Use smart matching" checked={options.filterSmart} onChange={options.setFilterSmart} />
          <OptionCheckbox label="Apply to groups instead of individual parts" checked={options.filterGroups} onChange={options.setFilterGroups} />
        </fieldset>
      </Form>
    </Popup>
  );
}
