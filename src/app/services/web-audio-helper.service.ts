import { Injectable } from '@angular/core';
import { notes } from '../constants';
import { BehaviorSubject } from 'rxjs';
import { _Instrument, _Track, _Node, _AudioNodeData } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WebAudioHelperService {
  audioContext: AudioContext;
  trackLoaded: boolean = false;

  bpm: number = 100;
  ppq: number = 100;

  //init values
  initPlay = false;
  initVolume = 0.10;

  //web audio nodes
  overAllVolumeNode: GainNode;
  //Includes all the AudioNode data needed to udpate certain values without reloading the track. This is set while mapping the nodes into audiocontext
  //The values are edited in updateInstrumentValuesForAudioNode
  instrumentAudioNodes: _AudioNodeData[];

  //observables
  playingStatusObs: BehaviorSubject<string>;
  currentInstrumentObs: BehaviorSubject<_Instrument>;
  trackLoadedObs: BehaviorSubject<boolean>;

  //currents
  currentInstrument: _Instrument;
  currentTrack: _Track;

  constructor() {
    this.audioContext = new AudioContext();
    this.audioContext.suspend();
    this.playingStatusObs = new BehaviorSubject<string>("suspended");
    this.currentInstrumentObs = new BehaviorSubject<_Instrument>(this.currentInstrument);
    this.trackLoadedObs = new BehaviorSubject<boolean>(this.trackLoaded);
  }

  //sets up observables
  getTrackLoaded() {
    return this.trackLoadedObs.asObservable();
  }
  //sets up observables
  getStatus() {
    return this.playingStatusObs.asObservable();
  }

  getTime() {
    return this.audioContext.currentTime;
  }

  //sets up observables
  getCurrentInstrument() {
    return this.currentInstrumentObs.asObservable();
  }

  //sets the current instrument in the service and updates the observable
  setCurrentInstrument(instrument: _Instrument) {
    this.currentInstrument = instrument;
    this.currentInstrumentObs.next(instrument);
  }

  //is called when operating controls that can be modified without reloading the track
  updateInstrumentValuesForAudioNode(instrument: _Instrument, filterId = -1) {

    var audioNodes = this.instrumentAudioNodes.filter(data => data.modelId == instrument.id);

    //values to be updated while tune is playing
    for (var i = 0; i < audioNodes.length; i++) {
      switch (audioNodes[i].audioNodeName) {
        case "spatial":
          (audioNodes[i].audioNodeData as StereoPannerNode).pan.value = instrument.spatial;
          break;
        case "gain":
          (audioNodes[i].audioNodeData as GainNode).gain.value = instrument.gain * this.overAllVolumeNode.gain.value;
          break;
        case "wave":
          (audioNodes[i].audioNodeData as OscillatorNode).type = instrument.waveType;
          break;
        case "filter" + filterId:
          (audioNodes[i].audioNodeData as BiquadFilterNode).frequency.value = instrument.filterdata[filterId].filterFreq;
          (audioNodes[i].audioNodeData as BiquadFilterNode).type = instrument.filterdata[filterId].filterType;
          break;
        default:
          break;
      }
    }
  }

  //is called when the overall volume is changed and sets the volume of every instrument accordingly
  //the overall volume is connected to an overall gainNode, but isnt connected to the audiocontext. Its value is just used in the instrument gainNodes
  updateVolumeValuesForAudioNode() {
    for (var i = 0; i < this.instrumentAudioNodes.length; i++) {
      if (this.instrumentAudioNodes[i].audioNodeName == "gain") {
        var instrument = this.currentTrack.instruments.find(ins => ins.id == this.instrumentAudioNodes[i].modelId);
        (this.instrumentAudioNodes[i].audioNodeData as GainNode).gain.value = instrument.gain * this.overAllVolumeNode.gain.value;
      }
    }
  }

  //checks if the track is over
  isTrackOver() {
    if (!this.trackLoaded) {
      return false;
    }
    return (1000 * this.getTime()) / this.secsPerTick() > this.currentTrack.length;
  }

  //starts the audiocontext
  play() {
    if (!this.trackLoaded) {
      this.initPlay = true;
      return;
    }
    this.audioContext.resume();
    this.playingStatusObs.next("running");
  }

  //pauses the audiocontext
  pause() {
    if (!this.trackLoaded) {
      this.initPlay = false;
      return;
    }
    this.audioContext.suspend();
    this.playingStatusObs.next("suspended");
  }

  //updates the overall volume and is called when master volume is changed in control.component
  updateVolume(volume: number) {
    if (!this.trackLoaded) {
      this.initVolume = volume;
      return;
    }
    this.overAllVolumeNode.gain.value = volume;
    this.updateVolumeValuesForAudioNode();
  }

  //stops the track, closes the audio context, makes a new and loads the track again.
  //Is called when song is over, when it is stopped or when editing the track in ways that needs the song to be reloaded
  // (add/remove filter, add/remove nodes)
  stop() {
    if (!this.trackLoaded) {
      return;
    }
    this.audioContext.close();
    this.playingStatusObs.next("closed");
    this.audioContext = new AudioContext();
    this.audioContext.suspend();
    this.playingStatusObs.next("suspended");
    this.loadTrack(this.currentTrack);
  }

  //restarts the song, does the same as stop, but doesnt suspend the new audio context upon creation
  restart() {
    if (!this.trackLoaded) {
      return;
    }
    this.audioContext.close();
    this.playingStatusObs.next("closed");
    this.audioContext = new AudioContext();
    this.loadTrack(this.currentTrack);
    this.playingStatusObs.next("running");
  }


  removeOldTrack() {
    this.audioContext.close();
    this.playingStatusObs.next("closed");
    this.audioContext = new AudioContext();
    this.audioContext.suspend();
    this.playingStatusObs.next("suspended");
  }

  //loads the track Model into the audioContext
  loadTrack(track: _Track) {
    //save in service for later use
    this.currentTrack = track;
    this.instrumentAudioNodes = [];

    //sets overall volume control. tracknode is just symbolic, only the value of the gainNode is used
    var trackNodes = this.addTrack(track);

    this.bpm = track.tempo;
    this.ppq = track.division;

    for (var i = 0; i < track.instruments.length; i++) {

      var instrumentNodes = this.addInstrument(track.instruments[i], this.audioContext);

      for (var j = 0; j < track.instruments[i].nodes.length; j++) {
        var currentOscis = this.addOscillator(track.instruments[i].nodes[j], this.audioContext);
        //connect to the first audionode of instruments
        currentOscis[1].connect(instrumentNodes[0]);
      }

      //connect the last audionode of instruments to destination
      instrumentNodes[1].connect(this.audioContext.destination);
    }
    this.trackLoaded = true;
    this.trackLoadedObs.next(true);

    if (this.initPlay) {
      this.audioContext.resume();
      this.playingStatusObs.next("running");
    }
  }

  //each add method returns the first and the last node in the chain of connected Nodes for reference

  //adds a gainNode for the overall volume of the _Track, but it wont be connected to anything. The value is used however.
  addTrack(track: _Track): AudioNode[] {
    var gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.overAllVolumeNode != undefined ? this.overAllVolumeNode.gain.value : this.initVolume;

    this.overAllVolumeNode = gainNode;

    //return first and last nodes for reference
    return [gainNode, gainNode];
  }

  //adds a stereopannernode, a gainnode and some filters for each _Instrument
  addInstrument(instrument: _Instrument, audioContext: AudioContext): AudioNode[] {
    //spatial
    var spatialNode = audioContext.createStereoPanner();
    spatialNode.pan.value = instrument.spatial;

    this.instrumentAudioNodes.push({
      modelId: instrument.id,
      audioNodeName: "spatial",
      audioNodeData: spatialNode
    });

    //gain
    var gainNode = audioContext.createGain();
    gainNode.gain.value = instrument.gain * this.overAllVolumeNode.gain.value;

    this.instrumentAudioNodes.push({
      modelId: instrument.id,
      audioNodeName: "gain",
      audioNodeData: gainNode
    });

    //filter
    var previousNode = gainNode;
    for (var i = 0; i < instrument.filterdata.length; i++) {
      var filterNode = audioContext.createBiquadFilter();
      filterNode.type = instrument.filterdata[i].filterType;
      filterNode.frequency.value = instrument.filterdata[i].filterFreq;
      gainNode.connect(filterNode);
      previousNode = filterNode;

      this.instrumentAudioNodes.push({
        modelId: instrument.id,
        audioNodeName: "filter" + i,
        audioNodeData: filterNode
      });
    }

    previousNode.connect(spatialNode);

    //return first and last nodes for reference
    return [gainNode, spatialNode];
  }

  //adds an oscillatorNode for each _Node
  addOscillator(currentNode: _Node, audioContext: AudioContext): AudioNode[] {
    var oscillator = audioContext.createOscillator();
    var key = currentNode.key.split(" ");

    //for my own sake, in case of wrong midi mapping or that I needed to support more MIDI values (see constants.ts)
    if (notes[key[0]][key[1]] == null) {
      console.log(currentNode);
      console.log("map more midi notes");
    }
    //create oscillator
    oscillator.frequency.value = notes[key[0]][key[1]];
    oscillator.type = currentNode.instrument.waveType;
    if (audioContext !== this.audioContext) {
      oscillator.start();
      oscillator.stop(this.calcTempoTime(currentNode.length));
    } else {
      oscillator.start(this.calcTempoTime(currentNode.start));
      oscillator.stop(this.calcTempoTime(currentNode.start + currentNode.length));
    }

    this.instrumentAudioNodes.push({
      modelId: currentNode.instrument.id,
      audioNodeName: "wave",
      audioNodeData: oscillator
    });

    // //do envelope
    // var envelopeGain = this.addOscillatorEnvelope(currentNode, audioContext);

    // this.instrumentAudioNodes.push({
    //   modelId: currentNode.instrument.id,
    //   audioNodeName: "envelope",
    //   audioNodeData: envelopeGain
    // });

    // oscillator.connect(envelopeGain);

    //return first and last nodes for reference
    return [oscillator, oscillator];
  }

  //not implemented due to time and performance issues
  addOscillatorEnvelope(currentNode: _Node, audioContext: AudioContext): GainNode {
    var AEnvelope = currentNode.instrument.envelope[0];
    var DEnvelope = currentNode.instrument.envelope[1];
    var REnvelope = currentNode.instrument.envelope[2];
    var SEnvelope = currentNode.instrument.envelope[3];

    var normalizedEnvelope = 1 / (AEnvelope + DEnvelope + REnvelope + SEnvelope);

    //calculates the length of the different phases
    var attackPhaseLength = currentNode.length * (normalizedEnvelope * AEnvelope) * 1000;
    var decayPhaseLength = currentNode.length * (normalizedEnvelope * DEnvelope) * 1000;
    var sustainPhaseLength = currentNode.length * (normalizedEnvelope * SEnvelope) * 1000;
    var releasePhaseLength = currentNode.length * (normalizedEnvelope * REnvelope) * 1000;

    //detemines how often the gain should be updated
    var stepTime = 10;

    var envelopeGain = audioContext.createGain();
    envelopeGain.gain.value = 0;

    //envelope implementation
    setInterval(() => {
      //if the current oscillator is playing 
      if (currentNode.start < audioContext.currentTime && audioContext.currentTime < currentNode.start + currentNode.length) {
        //if the current envelope phase is commencing
        if(audioContext.currentTime < attackPhaseLength + currentNode.start){
          //attack
          console.log("A" + envelopeGain.gain.value);
          envelopeGain.gain.value += (currentNode.envelopeMaxAmplitude / (attackPhaseLength / stepTime));
        }else if(audioContext.currentTime < decayPhaseLength + attackPhaseLength + currentNode.start){
          //decay
          console.log("D" + envelopeGain.gain.value);
          envelopeGain.gain.value -= ((currentNode.envelopeMaxAmplitude - currentNode.instrument.gain) / (decayPhaseLength / stepTime));
        }else if(audioContext.currentTime < sustainPhaseLength + decayPhaseLength + attackPhaseLength + currentNode.start){
          //sustain
          console.log("S" + envelopeGain.gain.value);
        }else{
          //release
          console.log("R" + envelopeGain.gain.value);
          envelopeGain.gain.value -= (currentNode.instrument.gain / (releasePhaseLength / stepTime));
        }
      }
    }, stepTime);
    
    return envelopeGain;
  }

  calcTempoTime(ticks: number): number {
    var secsPerTick = this.secsPerTick();
    return ticks * secsPerTick / 1000;
  }

  secsPerTick(): number {
    return 60000 / (this.bpm * this.ppq);
  }

  //is called when a node.component is called. A new audiocontext is created and the sound of that node is played for a max of 3 seconds
  previewSound(node: _Node) {
    var temp = new AudioContext();

    var instrument = this.addInstrument(node.instrument, temp);

    var oscillators = this.addOscillator(node, temp);

    oscillators[1].connect(instrument[0]);

    instrument[1].connect(temp.destination);

    temp.resume();

    setTimeout(() => {
      temp.close();
    }, 3000);
  }
}
