import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-instrument',
  templateUrl: './instrument.component.html',
  styleUrls: ['./instrument.component.less']
})
export class InstrumentComponent implements OnInit {
  @Input() instrument: _Instrument;
  constructor() { }

  ngOnInit() {
  }

}
