import { Col, Row } from 'react-bootstrap';
import PartLink from './PartLink';

function ColorsCell(group) {
  let prevSortFactor = group[0].sortFactor;

  return group.map(part => {
    const addSeparator = prevSortFactor !== part.sortFactor;
    prevSortFactor = part.sortFactor;

    return (
      <div key={`${part.partNum}-${part.color}`}>
        {addSeparator && <hr className='m-0' />}

        <Row className='align-items-center'>
          <Col lg='auto' xl='auto' xxl='auto'>
            <img loading='lazy' alt="" src={part.img} width='85' height='85' />
          </Col>
          <Col>
            {part.count}&nbsp;{part.color}
          </Col>
        </Row>
      </div>
    )
  });
}

function DescriptionCell(countPerPartNum, refPartNum) {
  if (countPerPartNum.length === 1) {
    const {partNum, name} = countPerPartNum[0];
    return (
      <div key={partNum}>
        {partNum !== refPartNum && <>{'['}<PartLink partNum={partNum} />{']'} </>}
        {name}
      </div>
    );
  }

  return countPerPartNum.map(({partNum, count, name}) => (
    <div key={partNum}>
      {count} {'['}<PartLink partNum={partNum} />{']'} {name}
    </div>
  ));
}

export default function InventoryRow({group}) {
  let count = 0;
  let colorsUniq = new Set();
  let countPerPartNum = [];
  const refPartNum = group[0].refPartNum;

  for (let i = 0; i < group.length; i++) {
    const part = group[i];
    count += part.count;

    colorsUniq.add(part.color);

    if (countPerPartNum.at(-1)?.partNum !== part.partNum) {
      countPerPartNum.push({partNum: part.partNum, count: 0, name: part.name});
    }
    countPerPartNum.at(-1).count += part.count;
  }

  let total = `${count}`;
  if (colorsUniq.size > 1) {
    total += ` in ${colorsUniq.size} colors`;
  }

  return (
    <tr key={refPartNum}>
      <td><PartLink partNum={refPartNum}/></td>
      <td>{total}</td>
      <td>{ColorsCell(group)}</td>
      <td>{DescriptionCell(countPerPartNum, refPartNum)}</td>
    </tr>
  );
}
