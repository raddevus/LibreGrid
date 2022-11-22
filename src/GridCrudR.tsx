import * as React from 'react';

interface PropsParams {
  headers: string[];
  data: Map<number, []>;
  fields: string[];
  numericSearchIndexes: number[];
  editableIndexes: number[];
  searchableIndexes: number[];
  useLocalData: boolean;
}

export class GridCrudR extends React.Component<PropsParams, {}> {
  useLocalData: boolean = true;
  state: any = {};
  allHeaders: any = [];
  // origData is the data that is unaltered data shown when user
  // loads the page -- it is only updated when RemotData is updated
  // This allows user to revert changes
  origData: Map<number, []>;
  // gridData is the data displayed in th e grid
  gridData: Map<number, []>;
  preSearchData: Map<number, []>;
  // will contain all rows of data which have been altered by user
  allChangedRows: Map<number, []> = new Map();

  // Column Offset is used since data doesn't contain a column
  // for the checkbox and since the checkbox becomes the first
  // column displayed
  columnOffset = 1;

  // contains all Selected rows which user wants to revert data to original
  allSelRevertDbIds: Map<number, number> = new Map();

  currentSelectedRowId: number = -1;

  constructor(props: PropsParams) {
    super(props);
    let counter = 0;
    this.useLocalData = props.useLocalData;
    //this.gridData = this.convertObjectsToValueArray(props.data, props.fields);
    // Save original data for use with tracking changes
    this.origData = this.props.data; //this.convertObjectsToMap(props.data, props.fields);
    // use spread to retrieve all rows from the Map
    this.gridData = this.origData;

    console.log(`ctor -> ${this.props.headers.length}`);
    console.log(this.props.headers);

    this.preSearchData = this.gridData;

    this.state = {
      headers: this.allHeaders,
      targetData: [...this.gridData.values()],
      fieldNames: props.fields,
      sortBy: 0, // sort first time by DB ID
      descending: true,
      edit: null,
      search: false,
      isLocal: false,
    };
    this.sort = this.sort.bind(this);
    this.addRow = this.addRow.bind(this);
    this.getJson = this.getJson.bind(this);
    this.preventDefault = this.preventDefault.bind(this);
    this.hideJsonDisplay = this.hideJsonDisplay.bind(this);
    this.clone = this.clone.bind(this);
    this.showEditor = this.showEditor.bind(this);
    this.save = this.save.bind(this);
    this.search = this.search.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.revertData = this.revertData.bind(this);
    this.escKeyHandler = this.escKeyHandler.bind(this);
    this.checkBoxChangeHandler = this.checkBoxChangeHandler.bind(this);
    this.setLocalData = this.setLocalData.bind(this);
  }

  render() {
    const searchRow = !this.state.search ? null : (
      <tr onChange={this.search}>
        {this.state.headers.map((_: any, idx: number) => {
          if (
            // if the filter matches (returned array length > 0)
            // it found the idx in the searchableIndexes
            this.props.searchableIndexes.filter(
              (x) => x + this.columnOffset === idx,
              console.log(`SUPER IDX => ${idx},`)
            ).length > 0
          ) {
            return (
              <td key={idx}>
                <input type="text" data-idx={idx} placeholder="search text" />
              </td>
            );
          } else {
            return <td key={idx}></td>;
          }
        })}
      </tr>
    );

    this.state.headers = [];
    this.state.headers.push(<th key="placeholdervalue"></th>);
    for (const idx in this.props.headers) {
      let title = this.props.headers[idx];
      if (this.state.sortBy == idx) {
        title += this.state.descending ? ' \u2191' : ' \u2193';
      }
      this.state.headers.push(<th key={idx}>{title}</th>);
    }

    if (!this.state.isLocal) {
      console.log('#####initializing...######');
      this.origData = this.props.data; //this.convertObjectsToMap(props.data, props.fields);
      // use spread to retrieve all rows from the Map
      this.gridData = this.origData;
      this.preSearchData = this.gridData;
      this.state.targetData = [...this.gridData.values()];
    }

    return (
      <div id="mainGrid" onKeyDown={this.escKeyHandler}>
        <hr />
        <div>
          <button className="toolbar" onClick={this.toggleSearch}>
            {this.state.search ? 'Hide search' : 'Show search'}
          </button>
          <button onClick={this.revertData}>Revert Change(s)</button>
          <button onClick={this.addRow}>Add Row</button>
          <button onClick={this.getJson}>Get JSON</button>
          <div
            className="hidden"
            id="jsondisplay"
            onMouseDown={this.hideJsonDisplay}
          >
            <textarea id="jsonoutput" rows={20} cols={80}>
              {' '}
            </textarea>
            <p>Right-click to close</p>
            <p>
              Use <code>CTRL-A</code> to Select All
            </p>
            <p>
              Use <code>CTRL-C</code> to Copy
            </p>
            <p>
              Use <code>CTRL-X</code> to Cut
            </p>
          </div>
          <label htmlFor="allowDataReset">Allow Data Reset</label>
          <input
            id="allowDataReset"
            type="checkbox"
            onChange={this.setLocalData}
            checked={!this.state.isLocal}
          />
          <table>
            <thead onClick={this.sort}>
              <tr>{this.state.headers}</tr>
            </thead>
            <tbody onDoubleClick={this.showEditor}>
              {searchRow}
              {[...this.state.targetData].map((row: any, rowidx: number) => (
                <tr
                  key={rowidx}
                  data-row={rowidx}
                  // row is entire row of data that matches array[][] row[0] is
                  // first data item in row.
                  data-dbid={row[0]}
                  className={
                    // data returned by filter is an array [] or
                    // ["1"] or ["1","5"]
                    // using spread to get array of all keys then we filter
                    [...this.allChangedRows.keys()].filter(
                      (x) => x === Number(row[0])
                    )[0] === Number(row[0])
                      ? 'dataHasChanged'
                      : 'none'
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      value={row[0]}
                      onChange={this.checkBoxChangeHandler}
                      className="revertCheckboxes"
                    />
                  </td>
                  {row.map((cell: any, colidx: number) => {
                    let edit = this.state.edit;
                    if (edit && edit.row === rowidx && edit.column === colidx) {
                      cell = (
                        <form onSubmit={this.save}>
                          <input id="editor" type="text" defaultValue={cell} />
                        </form>
                      );
                    }
                    return <td key={colidx}>{cell}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  clone(o: any) {
    return JSON.parse(JSON.stringify(o));
  }

  showEditor(e: any) {
    this.setState({
      isLocal: true,
    });
    console.log(`edit: ${this.state.edit}`);
    let selectedColumn: any = this.props.editableIndexes.filter((x) => {
      console.log(`x : ${x}`);
      if (x + this.columnOffset === e.target.cellIndex) {
        return true;
      } else {
        return false;
      }
    });
    console.log(`selcol: ${selectedColumn}`);

    if (selectedColumn <= 0) {
      return;
    }
    console.log(
      `e.target.parentNode.dataset ${e.target.parentNode.dataset.dbid}`
    );
    // when the editable item is clicked we need the dbid for later use
    this.currentSelectedRowId = e.target.parentNode.dataset.dbid;

    this.setState({
      edit: {
        row: parseInt(e.target.parentNode.dataset.row, 10),
        column: e.target.cellIndex - this.columnOffset,
      },
    });

    console.log(`edit: ${this.state.edit}`);
    console.log(this.state.edit);
  }

  setLocalData(e: any) {
    console.log(e.target.checked);
    this.setState({
      isLocal: !e.target.checked,
    });
    if (e.target.checked) {
      this.allChangedRows.clear();
    }
  }

  escKeyHandler(e: any) {
    // if user taps esc key then revert back
    if (e.keyCode == 27) {
      this.setState({
        edit: null,
      });
    }
  }

  save(e: any) {
    console.log('new save()...');
    e.preventDefault();
    let input = document.querySelector('#editor') as HTMLInputElement;
    // deep copy is necessary on Map to get completely new Map object
    let data: Map<number, []> = new Map(
      JSON.parse(JSON.stringify([...this.gridData]))
    );

    // get current row of data and it's id
    let id = Number(this.currentSelectedRowId);

    console.log(`id : ${id}`);
    let alteredRow: any[] = [];
    alteredRow.push(data.get(id));
    alteredRow[0][this.state.edit.column] = input!.value;
    console.log(alteredRow);
    data.set(id, alteredRow[0]);
    console.log('## memory check - origData ##');
    console.log(this.origData.get(id));

    if (this.allChangedRows.has(id)) {
      this.allChangedRows.delete(id);
    }
    this.allChangedRows.set(id, data.get(this.state.edit.row)!);

    for (const i of this.allChangedRows.values()) {
      console.log(i);
    }
    this.setState({
      edit: null,
      targetData: [...data.values()],
      // turn off (hide) search, if user has it on
      search: false,
    });
    this.gridData = data;
    this.preSearchData = this.gridData;
    // emptying out the temp data object to save memory?
    data = new Map();
  }

  search(e: any) {
    const needle = e.target.value.toLowerCase();
    if (!needle) {
      this.setState({ targetData: [...this.preSearchData.values()] });
      return;
    }
    const idx = e.target.dataset.idx - this.columnOffset;
    const searchdata = [...this.preSearchData.values()].filter((row: any) => {
      return row[idx].toString().toLowerCase().indexOf(needle) > -1;
    });
    this.setState({ targetData: searchdata });
  }

  toggleSearch() {
    let isSearchOn = !this.state.search;
    console.log(`this.state.search ${this.state.search}`);
    if (!isSearchOn) {
      this.preSearchData = this.gridData;
    }

    this.setState({
      isLocal: true,
    });

    this.setState({
      targetData: [...this.preSearchData.values()],
      search: isSearchOn,
    });
  }

  checkBoxChangeHandler(e: any) {
    console.log(
      `typeof value ${typeof e.target
        .value} -- checked: ${e.target.checked.toString()}`
    );
    if (
      this.allSelRevertDbIds.has(Number(e.target.value)) ||
      !e.target.checked
    ) {
      this.allSelRevertDbIds.delete(Number(e.target.value));
    } else {
      this.allSelRevertDbIds.set(
        Number(e.target.value),
        Number(e.target.value)
      );
    }
    console.log(this.allSelRevertDbIds.size);
  }

  hideJsonDisplay(e: any) {
    if (e.button != 2) {
      return;
    }
    (document.querySelector('#jsondisplay') as HTMLElement).classList.remove(
      'floatDoc'
    );
    (document.querySelector('#jsondisplay') as HTMLElement).classList.add(
      'hidden'
    );
    console.log('FIRED!');
  }

  preventDefault(e: any) {
    //      alert('Page will NOT reload');
    e.preventDefault();
  }

  getJson() {
    console.log(
      `in getJson() : targetData.size ${this.state.targetData.length}`
    );

    let rowCount = 0;
    let outData = `[`;
    this.state.targetData.forEach((value: any) => {
      let idx = 0;
      let fieldCount = 0;
      outData += `{`;
      this.props.fields.forEach((field) => {
        outData += `"${field}":"${value[idx++]}"`;
        if (++fieldCount != this.props.fields.length) {
          outData += `,`;
        }
      });
      outData += `}`;
      console.log(`value.length ${value.length}`);
      if (++rowCount < this.state.targetData.length) {
        outData += `,`;
      }
      if (rowCount == this.state.targetData.length) {
        outData += ']';
      }
      console.log(outData);
      (document.querySelector('#jsonoutput') as HTMLTextAreaElement).value =
        outData;

      (document.querySelector('#jsondisplay') as HTMLElement).classList.remove(
        'hidden'
      );
      (document.querySelector('#jsondisplay') as HTMLElement).classList.add(
        'floatDoc'
      );
      (document.querySelector('textarea') as HTMLElement).focus();
    });
  }

  addRow() {
    console.log('addRow...');

    //console.log(this.state.gridData.length);
    let maxKey: number = -1;
    this.gridData.forEach((x, key, map) => {
      maxKey = key;
    });
    console.log(`maxKey : ${maxKey}`);
    let newRow: any = [++maxKey, 'test2', 'test3'];

    this.gridData.set(maxKey, newRow);
    this.setState({
      targetData: [...this.gridData.values()],
    });
  }

  revertData() {
    // if there are no rows selected then return
    if (this.allSelRevertDbIds.size <= 0) {
      return;
    }
    this.allSelRevertDbIds.forEach((dbid) => {
      console.log(`dbid : ${dbid}`);
      console.log(`size => ${this.origData.size}`);
      this.gridData.set(dbid, this.origData.get(dbid) as []);
      console.log(`size => ${this.origData.size}`);
      console.log(this.origData.get(dbid));
      this.allSelRevertDbIds.delete(dbid);
      this.allChangedRows.delete(dbid);
    });

    this.setState({
      targetData: [...this.gridData.values()],
      // turn off (hide) search, if user has it on
      search: false,
    });

    this.clearAllCheckboxes();
  }

  clearAllCheckboxes() {
    console.log('clearing checkboxes...');
    let allRevertCheckboxes =
      document.querySelectorAll<HTMLInputElement>('.revertCheckboxes');
    allRevertCheckboxes.forEach((e) => (e.checked = false));
  }

  componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
    let editor: any = document.querySelector('#editor');
    console.log(`componentDidUpdate... ${editor}`);
    if (editor !== null) {
      editor.focus();
    }
  }

  sort(e: any) {
    // Do not allow user to sort while editing a record.
    if (this.state.edit !== null) {
      return;
    }

    this.setState({
      isLocal: true,
    });

    const columnIdx = e.target.cellIndex - this.columnOffset;
    const sortTarget = this.clone(this.state.targetData);

    console.log(sortTarget);
    const isDescending =
      this.state.sortBy === columnIdx && !this.state.descending;
    console.log(`you clicked, ${e.target.cellIndex}`);
    const { numericSearchIndexes } = this.props;
    let useNumberSort =
      numericSearchIndexes.filter((numidx) => numidx == columnIdx).length > 0;

    if (useNumberSort) {
      this.sortNumber(sortTarget, columnIdx, isDescending);
    } else {
      this.sortString(sortTarget, columnIdx, isDescending);
    }

    this.setState({
      targetData: sortTarget,
      sortBy: columnIdx,
      descending: isDescending,
    });
  }

  sortNumber(sortTarget: any, columnIdx: number, isDescending: boolean) {
    sortTarget.sort((a: any, b: any) => {
      if (Number(a[columnIdx]) === Number(b[columnIdx])) {
        return 0;
      }
      return isDescending
        ? Number(a[columnIdx]) > Number(b[columnIdx])
          ? 1
          : -1
        : Number(a[columnIdx]) < Number(b[columnIdx])
        ? 1
        : -1;
    });
  }

  sortString(sortTarget: any, columnIdx: number, isDescending: boolean) {
    sortTarget.sort((a: any, b: any) => {
      if (a[columnIdx] === b[columnIdx]) {
        return 0;
      }
      return isDescending
        ? a[columnIdx] > b[columnIdx]
          ? 1
          : -1
        : a[columnIdx] < b[columnIdx]
        ? 1
        : -1;
    });
  }

  convertObjectsToValueArray(targetObject: any, fieldNames: any) {
    let allRows: any = [];
    let counter: number = 0;

    targetObject.map((x: any, colIdx: number) => {
      let row: any = [];
      fieldNames.map((name: string) => {
        // Next line insures that if property contains
        // null then it is translated into a empty string
        x[name] = x[name] == null ? `` : x[name];
        row.push(x[name].toString());
      });
      allRows.push(row);
    });
    return allRows;
  }

  convertObjectsToMap(
    targetObject: any,
    fieldNames: any,
    hasIdColumn: boolean = true
  ) {
    // maps a DB ID to each row[]
    let allRows: Map<number, []> = new Map();
    let counterAsIdx: number = 0;
    // if data doesn't supply an ID column then
    // we need to do two things:
    // 1. add the id column
    // 2. use counterAsIdx as index value

    if (!hasIdColumn) {
      fieldNames.splice(0, 0, 'id');
    }
    console.log(fieldNames[0]);

    targetObject.map((x: any, colIdx: number) => {
      let row: any = [];
      if (!hasIdColumn) {
        row.push(counterAsIdx);
      }
      fieldNames.map((name: string) => {
        console.log(`fieldNames: name -> ${name}`);
        if (x[name] === undefined) {
          return;
        }
        // Next line insures that if property contains
        // null then it is translated into a empty string
        x[name] = x[name] == null ? `` : x[name];
        row.push(x[name].toString());
      });
      if (hasIdColumn === true) {
        allRows.set(Number(row[0]), row);
      } else {
        allRows.set(counterAsIdx++, row);
      }
    });
    return allRows;
  }
}