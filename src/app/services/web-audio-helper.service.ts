import { Injectable } from '@angular/core';
import { notes } from '../constants';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebAudioHelperService {
  audioContext: AudioContext;
  trackLoaded: boolean = false;
  currentTrack: _Track;
  playingStatus: BehaviorSubject<string>;
  bpm: number = 100;
  ppq: number = 100;

  //init values
  initPlay = false;
  initVolume = 0.10;

  //web audio nodes
  overAllVolumeNode: GainNode;
  constructor() {
    this.audioContext = new AudioContext();
    this.audioContext.suspend();
    this.playingStatus = new BehaviorSubject<string>("suspended");
  }

  getStatus() {
    return this.playingStatus.asObservable();
  }

  getTime() {
    return this.audioContext.currentTime;
  }

  isTrackOver() {
    if(!this.trackLoaded){
      return false;
    }
    return (1000 * this.getTime()) / this.secsPerTick() > this.currentTrack.length;
  }

  play() {
    if(!this.trackLoaded){
      this.initPlay = true;
      return;
    }
    this.audioContext.resume();
    this.playingStatus.next("running");
  }

  pause() {
    if(!this.trackLoaded){
      this.initPlay = false;
      return;
    }
    this.audioContext.suspend();
    this.playingStatus.next("suspended");
  }

  updateVolume(volume: number) {
    if(!this.trackLoaded){
      this.initVolume = volume;
      return;
    }
    this.overAllVolumeNode.gain.value = volume;
  }

  stop() {
    if(!this.trackLoaded){
      return;
    }
    this.audioContext.close();
    this.playingStatus.next("closed");
    this.audioContext = new AudioContext();
    this.audioContext.suspend();
    this.playingStatus.next("suspended");
    this.loadTrack(this.currentTrack);
  }

  restart() {
    if(!this.trackLoaded){
      return;
    }
    this.audioContext.close();
    this.audioContext = new AudioContext();
    this.loadTrack(this.currentTrack);
  }

  loadTrack(track: _Track) {
    //save in service for later use
    this.currentTrack = track;

    var trackNode = this.addTrack(track);
    this.overAllVolumeNode = trackNode as GainNode;
    this.bpm = track.tempo;
    this.ppq = track.division;

    for (var i = 0; i < track.instruments.length; i++) {

      var instrumentNode = this.addInstrument(track.instruments[i]);
      for (var j = 0; j < track.instruments[i].nodes.length; j++) {
        var currentOsci = this.addOscillator(track.instruments[i].nodes[j]);
        currentOsci.connect(instrumentNode);
      }
      instrumentNode.connect(trackNode);
    }
    trackNode.connect(this.audioContext.destination);
    this.trackLoaded = true;
    if(this.initPlay){
      this.audioContext.resume();
      this.playingStatus.next("running");
    }
  }


  addTrack(track: _Track): AudioNode {
    var gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.initVolume;

    return gainNode;
  }

  addInstrument(instrument: _Instrument): AudioNode{
    var gainNode = this.audioContext.createGain();
    gainNode.gain.value = instrument.gain;

    var spatialNode = this.audioContext.createStereoPanner();
    spatialNode.pan.value = instrument.spatial;

    gainNode.connect(spatialNode);

    return spatialNode;
  }

  addOscillator(currentNode: _Node): OscillatorNode {
    var oscillator = this.audioContext.createOscillator();
    var key = currentNode.key.split(" ");
    //finds the right frequency based on key and octave
    //incorporate instruments here?
    if(notes[key[0]][key[1]] == null){
      console.log(currentNode);
    }
    oscillator.frequency.value = notes[key[0]][key[1]];
    oscillator.type = currentNode.waveType as OscillatorType;
    oscillator.start(this.calcTempoTime(currentNode.start));
    oscillator.stop(this.calcTempoTime(currentNode.start + currentNode.length));

    return oscillator;
  }

  calcTempoTime(ticks: number): number {
    var secsPerTick = this.secsPerTick();
    return ticks * secsPerTick / 1000;
  }

  secsPerTick(): number {
    return 60000 / (this.bpm * this.ppq);
  }

  previewSound(node: _Node) {

  }
}
