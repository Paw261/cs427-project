import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
    //subscribes to get the current instrument chosen
    this.webAudioHelperService.getCurrentInstrument().subscribe((instrument: _Instrument) => {
      if (instrument != undefined) {
        //if the node is containes in the instrument it calls setselected else it calls set unselected
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

  //adds a class to the node which indicates that the node is chosen
  setSelected() {
    this.selectedStatus = "node-selected node";
  }
  //removes the class, which indicates that it isnt chosen
  setUnselected() {
    this.selectedStatus = "node";
  }

  //called in node.component.html and sets css for the specific component, based on the node properties.
  getCss(): { [key: string]: string; } {
    var key = this.node.key.split(" ")[0];
    var octave = Number.parseInt(this.node.key.split(" ")[1]);

    var text = {}
    text["bottom.px"] = `${(((12 * octave) + keyMap.indexOf(key)) * 20) + 1}`;
    text["left.px"] = `${this.node.start}`;
    text["width.px"] = `${this.node.length}`;
    return text;
  }

  //sets the current instrument to the instrument that the clicked node is contained in
  setCurrentInstrument(event) {
    this.webAudioHelperService.setCurrentInstrument(this.node.instrument);
    event.target.focus();
    this.webAudioHelperService.previewSound(this.node);
  }

  //deletes a node. Emits the id of the node component, which is caught in instrument.component, where it deletes it.
  deleteNode(event) {
    //'d' button for delete
    if(event.keyCode == 100){
      this.node.instrument.nodes = this.node.instrument.nodes.filter(node => node.id != this.node.id);
      this.webAudioHelperService.stop();
      this.delete.emit(this.node.id);
    }
  }

}
