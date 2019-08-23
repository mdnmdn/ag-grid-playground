import React from 'react';

import {AgGridReact} from "ag-grid-react";

import "ag-grid-enterprise";

import { loadProjects, loadIssues } from 'api';

const l = console.log;

const formatTime = time => {
  if (!time) return null;
  return parseFloat((time / 3600).toFixed(1));

};

const columnDefs = [{
  headerName: "Project",
  field: "project_title",
  enableRowGroup: true,
  cellRenderer(params) {
    if (!params.data) return params.value;
    return `<a href="${params.data.project_url}" target="_blank">${params.value}</a>`
  }
},
{
  headerName: "Issue",
  field: "issue",
  cellRenderer(params) {
    if (!params.data) return params.value;
    return `<a href="${params.data.issue_url}" target="_blank">${params.value}</a>`
  },
  //aggFunc: "count",
},
{
  headerName: "Label",
  field: "labels",
  enableRowGroup: true,
},{
  headerName: "Status",
  field: "state",
  enableRowGroup: true,
},
{
  headerName: "Estimate (h)",
  field: "time_estimate",
  filter: 'agNumberColumnFilter',
  aggFunc: "sum",
},
{
  headerName: "Spent (h)",
  field: "total_time_spent",
  filter: 'agNumberColumnFilter',
  aggFunc: "sum",
}];

const Grid = () => {

  const gridInit = async grid => {
    
    const [issues, projects] = await Promise.all([
      loadIssues(),
      loadProjects(),
    ]);

    l('---------------------------------');
    l({ issues, projects});
    window.aa = { issues, projects};
    const data = issues.map(i => {

      const project = projects.find( p => p.id == i.project_id);
      const project_title = project ? project.name : '-';

      return {
        issue: i.title,
        id: i.id,
        iid: i.iid,
        state: i.state,
        created_at: i.created_at,
        updated_at: i.updated_at,
        project_id: i.project_id,
        project_title,
        issue_url: i.web_url,
        human_time_estimate: i.time_stats.human_time_estimate,
        human_total_time_spent: i.time_stats.human_total_time_spent,
        time_estimate: formatTime(i.time_stats.time_estimate),
        total_time_spent: formatTime(i.time_stats.total_time_spent),
        labels: i.labels,
        project_url: i.web_url,
      };
    });
    
    l({data});
    grid.api.setRowData(data);
    grid.api.autoSizeColumns();
  }

  return (<div
    className="ag-theme-balham"
    style={{
      height: '95vh',
      //width: '600px',
      width: '100%',
    }}
  >
    <AgGridReact
      onGridReady={gridInit}
      columnDefs={columnDefs}
      floatingFilter={true}
      enablePivot={true}
      sideBar={{
        toolPanels: [
            {
                id: 'columns',
                labelDefault: 'Columns',
                labelKey: 'columns',
                iconKey: 'columns',
                toolPanel: 'agColumnsToolPanel',
            },
            {
                id: 'filters',
                labelDefault: 'Filters',
                labelKey: 'filters',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
            }
        ],
        //defaultToolPanel: 'columns',
        hiddenByDefault: false,
    }}
      defaultColDef={{
        minWidth: 50,
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
        floatCell: true,
        enableRowGroup: true,
      }}
    >
    </AgGridReact>
  </div>);
};

export default Grid;
