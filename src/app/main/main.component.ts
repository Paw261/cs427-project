import { Component, OnInit } from '@angular/core';
import { WebAudioHelperService } from '../services/web-audio-helper.service';
import { _Track, _Instrument, _Node } from '../models';
import { MidiHelperService } from '../services/midi-helper.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {
  intervalId: number = -1;
  playingStatus: string;
  track: _Track;

  newNode: _Node;

  currentinstrument: _Instrument;

  mouseDown: boolean = false;
  constructor(private webAudioHelperService: WebAudioHelperService, private midiHelperService: MidiHelperService) { }

  ngOnInit() {
    this.webAudioHelperService.getStatus().subscribe((status: string) => {
      this.playingStatus = status;
      if(status == "closed"){
        this.clearLine();
      }else if(this.intervalId == -1){
        this.moveLine();
      }
    });

    this.webAudioHelperService.getCurrentInstrument().subscribe((instrument: _Instrument) => {
      this.currentinstrument = instrument;
    });
  }

  moveLine() {
    var line = document.getElementById("music-line");
    var wrapper = document.getElementById("main-wrapper");
    var main = document.getElementById("main");
    this.intervalId = setInterval(() => {
      if(this.playingStatus == "running"){
        var movement = (1000 * this.webAudioHelperService.getTime()) / this.webAudioHelperService.secsPerTick();
        line.style.left = `${movement}px`;
        wrapper.scroll({left: movement - (screen.width / 2)});
        if(Number.parseInt(line.style.left.split("px")[0]) > Number.parseInt(main.style.width.split("px")[0])){
          this.clearLine();
        }
      }
    }, 10);
  }

  clearLine() {
    var line = document.getElementById("music-line");
    var wrapper = document.getElementById("main-wrapper");
    line.style.left = "0px";
    //wrapper.scroll({left: 0});
    clearInterval(this.intervalId);
    this.intervalId = -1;
  }

  getKeyFromMidi(noteNumber: number): string{
    return this.midiHelperService.mapKey(noteNumber);
  }

  getKeyFromMousePos(position: number): string{
    return this.midiHelperService.mapKeyFromScreenPosition(position);
  }

  getSupportedMidiValues(): number[] {
    var array: number[] = [];
    for(var i = 119; i >= 12; i--){
      array.push(i);
    }
    return array;
  }

  addNode(event) {
    if(this.currentinstrument == undefined){
      return;
    }
    var background1 = document.getElementById("background-1");
    var background2 = document.getElementById("background-2");
    var backgroundMan = document.getElementById("background-man");
    if(!(event.target === background1 || event.target === background2 || event.target === backgroundMan)){
      return;
    }
    this.mouseDown = true;
    this.newNode = {
        id: this.currentinstrument.nodes.length + 1,
        envelopeMaxAmplitude: 100,
        start: event.offsetX,
        key: this.getKeyFromMousePos(2160 - event.offsetY),
        instrument: this.currentinstrument,
        length: 20
    }
    this.currentinstrument.nodes.push(this.newNode);
  }

  setNodeLength() {
    if(this.newNode == undefined){
      return;
    }
    this.mouseDown = false;

    this.webAudioHelperService.stop();
    this.newNode = undefined;
  }

  addNodeLength(event) {
    if(this.mouseDown){
      if(event.offsetX - this.newNode.start < 1){
        this.newNode.length = 1;
      }else{
        this.newNode.length = event.offsetX - this.newNode.start;
      }
    }
  }
}
