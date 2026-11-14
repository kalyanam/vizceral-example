import { flatten, map, sum, values } from 'lodash';
import numeral from 'numeral';
import { useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Column, SortDirection, Table } from 'react-virtualized';
import 'react-virtualized/styles.css';

import sortRows from './sortRows';

const HEADER_HEIGHT = 30;
const ROW_HEIGHT = 25;
const MAX_TABLE_HEIGHT = 300;

function nameRenderer ({ rowData }) {
  return <span className={rowData.className} title={rowData.name}>{rowData.name}</span>;
}

function errorRenderer ({ rowData }) {
  return (
    <span className={rowData.className} title={`${numeral(rowData.errors || 0).format('0.[00]')} / ${numeral(rowData.total || 0).format('0.[00]')}`}>
      {numeral(rowData.errorRate || 0).format('0.[00]%')}
    </span>
  );
}

function totalRenderer ({ rowData }) {
  return (
    <span className={rowData.className} title={numeral(rowData.total || 0).format('0.[00]')}>
      {numeral(rowData.totalPercent || 0).format('0.[00]%')}
    </span>
  );
}

function linkPopover (node, region) {
  const atlasBackend = region ? `&backend=http:%2F%2Fatlas-main.${region}.prod.netflix.net:7001` : '';
  const atlasLink = `http://atlasui.prod.netflix.net/ui/graph?g.q=nf.cluster,${node.name},:eq,name,RequestStats-all-requests-_Num,:re,:and,:sum,(,name,),:by&g.e=now-1m&g.s=e-3h&g.tz=US%2FPacific&mode=png&vsplit=520px&sel=expr.0.0${atlasBackend}`;
  const spinnakerRegion = region ? `&reg=${region}` : '';
  const spinnakerLink = `https://spinnaker.prod.netflix.net/#/applications/${node.app}/clusters?acct=prod&q=cluster:${node.name}${spinnakerRegion}`;
  return (
    <Popover id="links-popover">
      <Popover.Body>
        <div className="links-popover-title">OPEN IN</div>
        <div className="links-popover-link"><a href={atlasLink} target="_blank" rel="noopener noreferrer">Atlas UI</a></div>
        <div className="links-popover-link"><a href={spinnakerLink} target="_blank" rel="noopener noreferrer">Spinnaker</a></div>
      </Popover.Body>
    </Popover>
  );
}

export default function SubNodeList ({ nodes, region }) {
  const [sortBy, setSortBy] = useState('totalPercent');
  const [sortDirection, setSortDirection] = useState(SortDirection.ASC);

  const trafficTotal = sum(flatten(map(nodes, n => values(n.metrics))));
  const rows = map(nodes, (node) => {
    const total = sum(values(node.metrics));
    const errors = (node.metrics && node.metrics.danger) || 0;
    const errorRate = errors / total;
    let className = '';
    if (errorRate > 0.1) {
      className = 'color-danger';
    } else if (errorRate > 0.03) {
      className = 'color-warning';
    }

    return {
      name: node.name,
      errors,
      total,
      errorRate,
      totalPercent: total / trafficTotal,
      app: node.app,
      className
    };
  });
  sortRows(rows, sortBy, sortDirection);

  const linkRenderer = ({ rowData }) => (rowData.app
    ? (
      <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={linkPopover(rowData, region)}>
        <div className={rowData.className} style={{ display: 'inline-block', cursor: 'pointer' }}><span className="bi bi-box-arrow-up-right"></span></div>
      </OverlayTrigger>
    )
    : undefined);

  if (rows.length === 0) {
    return <span>None.</span>;
  }

  return (
    <div className="node-list">
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
        <Column label="Name" dataKey="name" cellRenderer={nameRenderer} width={220} />
        <Column label="Errors" dataKey="errorRate" cellRenderer={errorRenderer} width={82} />
        <Column label="Total" dataKey="totalPercent" cellRenderer={totalRenderer} width={70} />
        <Column label="" dataKey="app" disableSort cellRenderer={linkRenderer} width={50} />
      </Table>
    </div>
  );
}
