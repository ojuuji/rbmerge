import Pagination from 'react-bootstrap/Pagination';

export default function InventoryPagination({pageNum, setPageNum, totalPages}) {
  const Sibling = (pageNum) => {
    return (
      pageNum >= 1 && pageNum <= totalPages
      ?
      <Pagination.Item onClick={() => setPageNum(pageNum)}>{pageNum}</Pagination.Item>
      :
      <></>
    );
  };

  return (
    <Pagination className='fixed-bottom ms-2'>
      {pageNum > 3 && Sibling(1)}
      {pageNum > 4 && <Pagination.Ellipsis />}
      {Sibling(pageNum - 2)}
      {Sibling(pageNum - 1)}
      <Pagination.Item active>{pageNum}</Pagination.Item>
      {Sibling(pageNum + 1)}
      {Sibling(pageNum + 2)}
      {pageNum + 3 < totalPages && <Pagination.Ellipsis />}
      {pageNum + 2 < totalPages && Sibling(totalPages)}
    </Pagination>
  );
}
