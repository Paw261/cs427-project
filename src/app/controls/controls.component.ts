import { Component, OnInit, Input } from '@angular/core';
import { WebAudioHelperService } from '../services/web-audio-helper.service';
import { TrackService } from '../services/track.service';
import { _Track, _Node, _Instrument } from '../models';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.less']
})
export class ControlsComponent implements OnInit {

  playPauseValue: string = "Play";
  newInstrumentName: string = "";
  volumeValue: number = 0.1;
  trackLoaded: boolean;

  allInstruments: _Instrument[];
  currentinstrument: _Instrument;

  constructor(private webAudioHelperService: WebAudioHelperService, private trackService: TrackService) { }

  ngOnInit() {
    this.trackService.getTrack().subscribe((track: _Track) => {
      this.volumeValue = track.gain;
      this.allInstruments = track.instruments;
    });

    this.webAudioHelperService.getTrackLoaded().subscribe((loaded: boolean) => {
      this.trackLoaded = loaded;
      this.playPauseValue = "Play";
    });

    this.webAudioHelperService.getCurrentInstrument().subscribe((instrument: _Instrument) => {
      this.currentinstrument = instrument;
    });

    setInterval(() => {
      if(this.webAudioHelperService.isTrackOver()){
        this.stop();
      }
    }, 10);
  }

  playPause() {
    if(this.playPauseValue == "Play" || this.playPauseValue == "Resume"){
      this.webAudioHelperService.play();
      this.playPauseValue = "Pause";
    }else{
      this.webAudioHelperService.pause();
      this.playPauseValue = "Resume";
    }
  }

  stop() {
    this.webAudioHelperService.stop();
    this.playPauseValue = "Play";
  }

  restart() {
    this.webAudioHelperService.restart();
    this.playPauseValue = "Pause";
  }

  changeVolume(event) {
    this.volumeValue = event.target.value;
    this.webAudioHelperService.updateVolume(this.volumeValue);
  }

  //instrument changes
  pickWaveTypeInstrument(event) {
    this.currentinstrument.waveType = event.target.value;
    this.webAudioHelperService.updateInstrumentValuesForAudioNode(this.currentinstrument);
  }

  changeVolumeInstrument(event) {
    this.currentinstrument.gain = event.target.value;
    this.webAudioHelperService.updateInstrumentValuesForAudioNode(this.currentinstrument);
  }

  changeSpatialInstrument(event) {
    this.currentinstrument.spatial = event.target.value;
    this.webAudioHelperService.updateInstrumentValuesForAudioNode(this.currentinstrument);
  }

  addFilter() {
    this.currentinstrument.filterdata.push({
      filterFreq: 0,
      filterType: "lowpass"
    });
    this.webAudioHelperService.stop();
  }

  removeFilter(id) {
    this.currentinstrument.filterdata = this.currentinstrument.filterdata.filter((data, index) => index != id);
    this.webAudioHelperService.stop();
  }

  changeFilterType(event) {
    this.currentinstrument.filterdata[event.target.name].filterType = event.target.value;
    this.webAudioHelperService.updateInstrumentValuesForAudioNode(this.currentinstrument, event.target.name);
  }

  changeFilterFrequency(event) {
    this.currentinstrument.filterdata[event.target.name].filterFreq = event.target.value;
    this.webAudioHelperService.updateInstrumentValuesForAudioNode(this.currentinstrument, event.target.name);
  }

  addInstrument() {
    var newInstrument: _Instrument = {
        id: this.allInstruments.length + 1,
        nodes: [],
        frequencyMap: [],
        name: this.newInstrumentName,
        spatial: 0,
        gain: 1,
        waveType: "sine",
        envelope: [1, 1, 1, 1],
        filterdata: []
    };
    this.newInstrumentName = "";

    this.allInstruments.push(newInstrument);

    this.webAudioHelperService.stop();
  }

  attachPredefinedSetting(event) {
    //set event.target.values værdier til currentInstrument og kald update
    //select input
  }

  setCurrentInstrument(event) {
    var instrument = this.allInstruments.find(ins => ins.id == event.target.value);
    this.webAudioHelperService.setCurrentInstrument(instrument);
  }

}
