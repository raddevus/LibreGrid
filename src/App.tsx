import * as React from 'react';
import './style.css';
import { GridCrudR } from './GridCrudR';
import {DataLoader} from "./DataLoader";



export default function App() {
  return (
    <div>
     <DataLoader extra={new Map()} headers={[""]} fields={[""]}/>
    </div>
  );
}
