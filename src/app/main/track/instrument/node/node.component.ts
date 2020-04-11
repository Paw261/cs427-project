import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { keyMap } from '../../../../constants';
import { TrackService } from 'src/app/services/track.service';

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.less']
})
export class NodeComponent implements OnInit {

  @Input() node: _Node;
  constructor(private trackService: TrackService) { }

  ngOnInit() {

  }

  getCss(): {[key: string]: string;} {
    var key = this.node.key.split(" ")[0];
    var octave = Number.parseInt(this.node.key.split(" ")[1]);

    var text = {}
    text["bottom.px"] = `${(((12 * octave) + keyMap.indexOf(key)) * 20) + 1}`;
    text["left.px"] = `${this.node.start}`;
    text["width.px"] = `${this.node.length}`;
    return text;
  }

}
