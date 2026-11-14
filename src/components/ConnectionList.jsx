import { maxBy } from 'lodash';
import numeral from 'numeral';
import { useState } from 'react';
import { Column, SortDirection, Table } from 'react-virtualized';
import 'react-virtualized/styles.css';

import sortRows from './sortRows';

const HEADER_HEIGHT = 30;
const ROW_HEIGHT = 25;
const MAX_TABLE_HEIGHT = 300;

function nameRenderer ({ rowData, cellData }) {
  const mostSevereNotice = rowData.notices && rowData.notices.length > 0 && maxBy(rowData.notices, notice => notice.severity);
  const styles = {
    paddingLeft: '5px',
    opacity: rowData.disabled ? 0.3 : undefined
  };

  return (
    <span className={rowData.className} style={{ color: rowData.color }}>
      {cellData}
      {mostSevereNotice && <span style={styles} className={`bi bi-exclamation-triangle-fill severity${mostSevereNotice.severity}`} />}
    </span>
  );
}

function errorRenderer ({ rowData }) {
  return (
    <span className={rowData.className} data-error-rate={rowData.errorRate} style={{ color: rowData.color }} title={`${numeral(rowData.errors || 0).format('0.[00]')} / ${numeral(rowData.total || 0).format('0.[00]')}`}>
      {numeral(rowData.errorRate || 0).format('0.[00]%')}
    </span>
  );
}

export default function ConnectionList ({ connections, direction }) {
  const [sortBy, setSortBy] = useState('errorRate');
  const [sortDirection, setSortDirection] = useState(SortDirection.ASC);

  const rows = connections.map((connection) => {
    const errors = connection.getVolume('danger');
    const total = connection.getVolumeTotal();
    const disabled = !connection.isVisible();
    let className = '';
    if (disabled) {
      className = 'disabled';
    } else if (connection.class) {
      className = `color-${connection.class}`;
    }

    return {
      name: direction === 'incoming' ? connection.source.getName() : connection.target.getName(),
      errorRate: errors / total || 0,
      errors,
      total,
      className,
      disabled,
      notices: connection.notices
    };
  });
  sortRows(rows, sortBy, sortDirection);

  if (rows.length === 0) {
    return <span>None.</span>;
  }

  return (
    <div className="connection-list">
      <Table
        width={300}
        height={Math.min(MAX_TABLE_HEIGHT, (ROW_HEIGHT * rows.length) + HEADER_HEIGHT)}
        headerHeight={HEADER_HEIGHT}
        rowHeight={ROW_HEIGHT}
        rowCount={rows.length}
        rowGetter={({ index }) => rows[index]}
        sortBy={sortBy}
        sortDirection={sortDirection}
        sort={(sort) => { setSortBy(sort.sortBy); setSortDirection(sort.sortDirection); }}
      >
        <Column label="Sub Nodes" dataKey="name" cellRenderer={nameRenderer} width={220} />
        <Column label="Errors" dataKey="errorRate" cellRenderer={errorRenderer} width={70} />
      </Table>
    </div>
  );
}
