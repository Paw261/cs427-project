import { Component, OnInit, Input, Output, destroyPlatform, EventEmitter } from '@angular/core';
import { keyMap } from '../../../../constants';
import { _Node, _Instrument } from 'src/app/models';
import { WebAudioHelperService } from 'src/app/services/web-audio-helper.service';

@Component({
  selector: 'app-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.less']
})
export class NodeComponent implements OnInit {

  @Input() node: _Node;
  selectedStatus: string;

  @Output() delete: EventEmitter<number> = new EventEmitter();
  constructor(private webAudioHelperService: WebAudioHelperService) { }

  ngOnInit() {
    this.webAudioHelperService.getCurrentInstrument().subscribe((instrument: _Instrument) => {
      if (instrument != undefined) {
        if (instrument.id == this.node.instrument.id) {
          this.setSelected();
        } else {
          this.setUnselected();
        }
      }else{
        this.setUnselected();
      }
    });
  }

  setSelected() {
    this.selectedStatus = "node-selected node";
  }

  setUnselected() {
    this.selectedStatus = "node";
  }

  getCss(): { [key: string]: string; } {
    var key = this.node.key.split(" ")[0];
    var octave = Number.parseInt(this.node.key.split(" ")[1]);

    var text = {}
    text["bottom.px"] = `${(((12 * octave) + keyMap.indexOf(key)) * 20) + 1}`;
    text["left.px"] = `${this.node.start}`;
    text["width.px"] = `${this.node.length}`;
    return text;
  }

  setCurrentInstrument(event) {
    this.webAudioHelperService.setCurrentInstrument(this.node.instrument);
    event.target.focus();
    this.webAudioHelperService.previewSound(this.node);
  }

  deleteNode(event) {
    //'d' button for delete
    if(event.keyCode == 100){
      this.node.instrument.nodes = this.node.instrument.nodes.filter(node => node.id != this.node.id);
      this.webAudioHelperService.stop();
      this.delete.emit(this.node.id);
    }
  }

}
