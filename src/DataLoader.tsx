import * as React from 'react';
import { LibreGrid } from './LibreGrid';
import { sw_people, sw_fields, sw_headers } from './data/starwars.js';
import {flintstones, fs_fields} from './data/flintstones'

interface LoaderProps {
  headers: string[];
  extra: Map<number, []>;
  fields: string[];
}

export class DataLoader extends React.Component<LoaderProps, {}> {
  state: any = {};
  data = 'test this';
  inputHeaders: string = "";
  dataIncludesId: boolean = false;
  constructor(props: LoaderProps) {
    super(props);
    this.state = {
      headers: JSON.stringify(['ID', 'First', 'Last']),
    };

    this.state.extra = this.convertObjectsToMap(
      [
        { id: 1, first: 'fred', last: 'flintstone' },
        { id: 2, first: 'wilma', last: 'flintstone' },
      ],
      fs_fields
    );
    this.state.fields = ['id', 'first', 'last'];
    this.state.editableIndexes = JSON.stringify([1,2]);
    this.state.searchableIndexes = JSON.stringify([0,1,2]);
    this.state.numSortIndexes = JSON.stringify([0]);

    this.loadData = this.loadData.bind(this);
    this.preventDefault = this.preventDefault.bind(this);
  }
  render() {
    return (
      <div onContextMenu={this.preventDefault} id="dataLoader">
        <h2>DataLoader</h2>
        <div>
          <div className="dataSource">
            <h3>Data Source</h3>
            <input
              id="data"
              type="text"
              placeholder="data (array of objects)"
            />
            <input id="dataFromHttp" type="text" placeholder="URL to API" />
            <div>
              <h3>Data Details</h3>
              <input
                id="fields"
                type="text"
                placeholder="fields (array of field names)"
              />

              <input
                id="dataName"
                type="text"
                placeholder="data name (for data from URL)"
              />
              <label htmlFor="dataIncludesId">Data Includes ID Column?</label>
              <input id="dataIncludesId" type="checkbox" />
            </div>
          </div>
        </div>
        <div className="extraData">
          <input id="headers" type="text" placeholder="column header text" />
          <input id="editableIdx" type="text" placeholder="editableIndexes" />
          <input
            id="searchableIdx"
            type="text"
            placeholder="searchableIndexes"
          />
          <input
            id="numSortIdx"
            type="text"
            placeholder="numericSortIndexes"
          />
        </div>
        <button onClick={this.loadData}>Load Data</button>

        <LibreGrid
          headers={JSON.parse(this.state.headers)}
          data={this.state.extra}
          fields={this.state.fields}
          numericSortIndexes={JSON.parse(this.state.numSortIndexes)}
          editableIndexes={JSON.parse(this.state.editableIndexes)} 
          searchableIndexes={JSON.parse(this.state.searchableIndexes)}
          useLocalData={this.state.useLocalData}
        />
      </div>
    );
  }

  preventDefault(e: any) {
    e.preventDefault();
  }
  // #### NOTE DATA IN TEXT BOXES HAS TO
  // USE DOUBLE QUOTES (not single)
  // ["ID","Name","birth_year","Height","Mass","Hair_color"]
  // ["id", "name","birth_year"]
  // ["id","first", "last"] // fields
  // ["ID","First Name", "Last Name"] //headers
  // [{ "first":"fred","last":"flintstone"}]
  // [] // searchableIndexes
  // [1] //numericSortIndexes
  loadData() {

    let url = (document.querySelector('#dataFromHttp') as HTMLInputElement)
      .value;

    this.inputHeaders = (document.querySelector('#headers') as HTMLInputElement)
      .value;
    
    if (this.inputHeaders !== ""){
      this.inputHeaders = this.inputHeaders.split("'").join("\"");
    }
    
    let inObjects = (document.querySelector('#data') as HTMLInputElement).value;
    // insures that even if user uses single-quotes it will work
    if (inObjects !== ""){
      inObjects = inObjects.split("'").join("\"");
    }
    console.log(inObjects);

    let inFields = (document.querySelector('#fields') as HTMLInputElement)
      .value;
    if (inFields !== ""){
      inFields = inFields.split("'").join("\"");
    }

    this.dataIncludesId = (document.querySelector("#dataIncludesId") as HTMLInputElement).checked;

    let editIdx = (document.querySelector('#editableIdx') as HTMLInputElement).value;

    let inSearchableIndexes = (document.querySelector('#searchableIdx') as HTMLInputElement)
    .value;

    let numSortIndexes = (document.querySelector('#numSortIdx') as HTMLInputElement).value;
    
    let mainData: Map<number, []>;

    switch (inObjects.toLowerCase()) {
      case '': {
        if (url == '') {
          mainData = this.convertObjectsToMap(
            flintstones,
            fs_fields
          );
          if (this.inputHeaders === '') {
            this.inputHeaders = JSON.stringify(['ID-X', 'First', 'Last']);
          }
          this.setState({
            fields: ["id", "first","last"],
          });
          console.log('done...');
        } else {
          // dataName must be "results" for StarWars API
          let dataName = (
            document.querySelector('#dataName') as HTMLInputElement
          ).value;

          if (dataName !== '') {
            fetch(url)
              .then((response) => response.json())
              .then((data) => this.processFetchedData(data[dataName], editIdx,
                 inSearchableIndexes,numSortIndexes));
          } else {
            fetch(url)
              .then((response) => response.json())
              .then((data) => this.processFetchedData(data, editIdx, 
                inSearchableIndexes,numSortIndexes));
          }
          return;
        }
        break;
      }
      case 'sw': {

        if (inFields === '') {
          console.log('in ELSE...');
          inFields = JSON.stringify( sw_fields); //["ID","Name","birth_year","Height","Mass","Hair_color"];
        } 
        mainData = this.convertObjectsToMap(sw_people, JSON.parse(inFields), false);
        this.inputHeaders = JSON.stringify(sw_headers);
        this.setState({
          fields: JSON.stringify(inFields),
        });
        break;
      }
      default: {
        console.log('IN DEFAULT...');

        mainData = this.convertObjectsToMap(
          JSON.parse(inObjects),
          JSON.parse(inFields),
          false
        );

        this.setState({
          fields: inFields !== "" ? JSON.parse(inFields) : "[]",
          headers: this.inputHeaders !== "" ? this.inputHeaders : "[]",
        });
      }
    }

    //[{ "id": 1, "first": "Albert", "last": "flintstone" },{ "id": 2, "first": "wilma", "last": "flintstone" },{ "id": 3, "first": "pebbles", "last": "flintstone" },{ "id": 4, "first": "barney", "last": "rubble" },{ "id": 5, "first": "betty", "last": "rubble" },{ "id": 6, "first": "bamm-bamm", "last": "rubble" }]

    this.setState({
      headers: this.inputHeaders !== "" ? this.inputHeaders : "[]",
      editableIndexes: editIdx !== "" ? editIdx : "[0]",
      searchableIndexes: inSearchableIndexes !== "" ? inSearchableIndexes: "[0]",
      numSortIndexes : numSortIndexes !== "" ? numSortIndexes: "[0]",
      extra: mainData,
      useLocalData: false,
    });

    this.state.extra.forEach((x: any) => console.log(`local data => ${x}`));
  }

  processFetchedData(data: [{}], editIdx: string, inSearchableIndexes: string, inNumSortIdx: string ) {
    let fetchedData;
    console.log(`processFetchedData...`);
    console.log(data);
    let localFields: any = (
      document.querySelector('#fields') as HTMLInputElement
    ).value;
    if (localFields !== '') {
      localFields = JSON.parse(localFields);
      console.log(localFields);
      //return;
    } else {
      localFields = sw_fields;
      console.log(`localFields : ${localFields}`);
    }
    fetchedData = this.convertObjectsToMap(data, localFields, this.dataIncludesId);
    if (this.inputHeaders === ""){
      this.inputHeaders = JSON.stringify(sw_headers);
    }

    let editableIndexes: number[] = [];
    
    console.log(`second.size : ${fetchedData.size}`);
    fetchedData.forEach((x: any) => console.log(`second ${x}`));
    
    this.setState({
      headers: this.inputHeaders !== "" ? this.inputHeaders : "[]",
      extra: fetchedData,
      fields: localFields,
      editableIndexes: editIdx !== "" ? editIdx : "[0]",
      searchableIndexes: inSearchableIndexes !== "" ? inSearchableIndexes: "[0]",
      numSortIndexes : inNumSortIdx !== "" ? inNumSortIdx: "[0]",
      useLocalData: false,
    });
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
      // only splice in the "id" field if there isn't
      // already an id field in fieldNames
      if (
        fieldNames.filter((fname: string) => {
          return (fname as string).toLowerCase() == 'id';
        }).length == 0
      ) {
        fieldNames.splice(0, 0, 'id');
      }
    }
    // console.log(fieldNames[0]);

    targetObject.map((x: any, colIdx: number) => {
      // next line insures all property names in incoming JSON
      // are lowercased so they can be matched.
      x = this.toLowerKeys(x);
      let row: any = [];
      if (!hasIdColumn) {
        row.push(counterAsIdx);
      }
      fieldNames.map((name: string) => {
        // insures that field names match even if case is different
        name = name.toLowerCase();
        // console.log(`fieldNames: name -> ${name}`);
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

  toLowerKeys(obj: any[]) {
    // got this method at: https://bobbyhadz.com/blog/javascript-lowercase-object-keys and altered it to work with array of objects
    return Object.keys(obj).reduce(
      (accumulator, key: any) => {
        accumulator[key.toLowerCase()] = obj[key];
        return accumulator as any;
      },
      [{}]
    );
  }
}