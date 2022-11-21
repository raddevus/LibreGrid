import * as React from 'react';
import { GridCrudR } from './GridCrudR';
import { sw_people, sw_fields, sw_headers } from './data/starwars.js';

interface LoaderProps {
  headers: string[];
  extra: Map<number, []>;
  fields: string[];
}

export class DataLoader extends React.Component<LoaderProps, {}> {
  state: any = {};
  data = 'test this';
  constructor(props: LoaderProps) {
    super(props);
    this.state = {
      headers: JSON.stringify(['ID', 'First', 'Last']),
      fields: JSON.stringify(['id', 'first', 'last']),
    };

    this.state.extra = this.convertObjectsToMap(
      [{ id: 2, first: 'wilma', last: 'flintstone' }],
      JSON.parse(this.state.fields)
    );

    console.log(`this.state.data.size : ${this.state.extra.size}`);

    this.loadData = this.loadData.bind(this);
  }
  render() {
    return (
      <div>
        <h2>DataLoader</h2>
        <button onClick={this.loadData}>Load Data</button>
        <input id="headers" type="text" placeholder="headers" />
        <p>
          <input id="data" type="text" placeholder="data (array of objects)" />
          <input id="dataFromHttp" type="text" placeholder="URL to API" />
          <input
            id="fields"
            type="text"
            placeholder="fields (array of field names)"
          />
        </p>
        <p>
          <input
            id="numericIdx"
            type="text"
            placeholder="numericSearchIndexes"
          />
          <input id="editableIdx" type="text" placeholder="editableIndexes" />
          <input
            id="searchableIdx"
            type="text"
            placeholder="searchableIndexes"
          />
        </p>
        <GridCrudR
          headers={JSON.parse(this.state.headers)}
          data={this.state.extra}
          fields={JSON.parse(this.state.fields)}
          numericSearchIndexes={JSON.parse('[0]')}
          editableIndexes={JSON.parse('[1,2]')}
          searchableIndexes={JSON.parse('[0,1,2]')}
          useLocalData={this.state.useLocalData}
        />
      </div>
    );
  }
  // #### NOTE DATA IN TEXT BOXES HAS TO
  // USE DOUBLE QUOTES (not single)
  // ["id", "name","birth_year"]
  // ["id","first", "last"] // fields
  // ["ID","First Name", "Last Name"] //headers
  // [{ "first":"fred","last":"flintstone"}]
  // [] // searchableIndexes
  // [1] //numericSearchIndexes
  loadData() {
    let url = (document.querySelector('#dataFromHttp') as HTMLInputElement)
      .value;

    console.log('clicked it!');
    let inputHeaders = ((
      document.querySelector('#headers') as HTMLInputElement
    ).value = JSON.stringify(['IDX', 'First Name', 'Last Name']));

    let inObjects = (document.querySelector('#data') as HTMLInputElement).value;
    console.log(inObjects);

    let inFields = (document.querySelector('#fields') as HTMLInputElement)
      .value;

    let second: Map<number, []>;

    switch (inObjects) {
      case '': {
        if (url == '') {
          second = this.convertObjectsToMap(
            [
              { id: 1, first: 'fred', last: 'flintstone' },
              { id: 2, first: 'wilma', last: 'flintstone' },
              { id: 3, first: 'pebbles', last: 'flintstone' },
              { id: 4, first: 'barney', last: 'rubble' },
              { id: 5, first: 'betty', last: 'rubble' },
              { id: 6, first: 'bamm-bamm', last: 'rubble' },
              { id: 7, first: 'dino', last: 'flintstone' },
              { id: 8, first: 'hoppy', last: 'rubble' },
              { id: 9, first: 'great', last: 'gazoo' },
              { id: 10, first: 'pearl', last: 'slaghoople' },
              { id: 11, first: 'tex', last: 'hardrock' },
              { id: 12, first: 'george', last: 'slate' },
              { id: 13, first: 'joe', last: 'rockhead' },
              { id: 14, first: 'jethro', last: 'hatrock' },
              { id: 15, first: 'zack', last: 'hatrock' },
              { id: 16, first: 'slab', last: 'hatrock' },
              { id: 17, first: 'granny', last: 'hatrock' },
              { id: 18, first: 'benji', last: 'hatrock' },
              { id: 19, first: 'percy', last: 'hatrock' },
              { id: 20, first: 'weirdly', last: 'gruesome' },
              { id: 21, first: 'creepella', last: 'gruesome' },
              { id: 22, first: 'gobby', last: 'gruesome' },
              { id: 23, first: 'ghastly', last: 'gruesome' },
              { id: 24, first: 'schneider', last: 'gruesome' },
              { id: 25, first: 'occy', last: 'gruesome' },
              { id: 26, first: 'sam', last: 'slagheap' },
            ],
            JSON.parse(this.state.fields)
          );
        } else {
          fetch(url)
            .then((response) => response.json())
            //.then((data) => console.log(data['results']))
            .then((data) => this.processFetchedData(data['results']));
          return;
        }
        break;
      }
      case 'sw': {
        let localFields: any = (
          document.querySelector('#fields') as HTMLInputElement
        ).value;
        if (localFields !== '') {
          localFields = JSON.parse(localFields);
          console.log(`localFields : ${localFields}`);
          //return;
        } else {
          localFields = sw_fields;
          console.log(`localFields : ${localFields}`);
        }
        second = this.convertObjectsToMap(sw_people, localFields, false);
        inputHeaders = JSON.stringify(sw_headers);
        break;
      }
      default: {
        second = this.convertObjectsToMap(
          JSON.parse(inObjects),
          JSON.parse(this.state.fields)
        );
      }
    }

    //[{ "id": 1, "first": "Albert", "last": "flintstone" },{ "id": 2, "first": "wilma", "last": "flintstone" },{ "id": 3, "first": "pebbles", "last": "flintstone" },{ "id": 4, "first": "barney", "last": "rubble" },{ "id": 5, "first": "betty", "last": "rubble" },{ "id": 6, "first": "bamm-bamm", "last": "rubble" }]

    console.log(`second.size : ${second.size}`);
    second.forEach((x: any) => console.log(`second ${x}`));
    this.setState({
      headers: inputHeaders,
      extra: second,
      useLocalData: false,
    });

    this.state.extra.forEach((x: any) => console.log(`local data => ${x}`));
  }

  processFetchedData(data: [{}]) {
    let second;
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
    second = this.convertObjectsToMap(data, localFields, false);
    let inputHeaders = JSON.stringify(sw_headers);
    console.log(`second.size : ${second.size}`);
    second.forEach((x: any) => console.log(`second ${x}`));
    this.setState({
      headers: inputHeaders,
      extra: second,
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
    console.log(`allRows.size ${allRows.size}`);
    console.log(`get id 2 ${allRows.get(2)}`);
    return allRows;
  }
}
