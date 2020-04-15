import { Injectable } from '@angular/core';
import { parseArrayBuffer } from 'midi-json-parser';
import { IMidiFile, TMidiEvent, IMidiSetTempoEvent, IMidiControlChangeEvent, IMidiNoteOnEvent, IMidiNoteOffEvent, IMidiTrackNameEvent } from 'midi-json-parser-worker';
import { Observable, BehaviorSubject } from 'rxjs';
import { MidiMessageService } from './midi-message.service';
import { keyMap } from '../constants';
import { _Instrument, _Node } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MidiHelperService {
  midiInstruments: BehaviorSubject<_Instrument[]>;
  midiTempo: BehaviorSubject<number>;
  midiDivision: BehaviorSubject<number>;

  nodeIndexer: number = 0;
  instrumentIndexer: number = 0;

  private midiMessageService: MidiMessageService;

  constructor(midiMessageService: MidiMessageService) {
    //inits observables for alot of properties to be picked up by subscribers
    this.midiInstruments = new BehaviorSubject<_Instrument[]>([]);
    this.midiTempo = new BehaviorSubject<number>(1);
    this.midiDivision = new BehaviorSubject<number>(1);

    this.midiMessageService = midiMessageService;
  }

  //sets up observables for alot of properties to be picked up by subscribers
  getInstruments(): Observable<_Instrument[]> {
    return this.midiInstruments.asObservable();
  }
  //sets up observables for alot of properties to be picked up by subscribers
  getTempo(): Observable<number> {
    return this.midiTempo.asObservable();
  }
  //sets up observables for alot of properties to be picked up by subscribers
  getDivision(): Observable<number> {
    return this.midiDivision.asObservable();
  }

  //is called when a midi file is uploaded
  loadMidiFile(midiFile: File) {
    //reads files from input field
    var fileReader = new FileReader();
    fileReader.readAsArrayBuffer(midiFile);

    var service = this;

    fileReader.onload = function (event: any) {
      //parses the file to a json object
      parseArrayBuffer(event.target.result as ArrayBuffer)
        .then((json: IMidiFile) => {
          service.mapMidiToInstruments(json);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  //takes the raw midi json data and maps to models from models.ts
  mapMidiToInstruments(rawJson: IMidiFile) {
    var tracks = rawJson.tracks;
    this.midiDivision.next(rawJson.division);

    var tempSpatial = 0;
    var tempGain = 1;

    var instruments = [];

    //creates _Instrument objects for each MIDI track
    for (var i = 0; i < tracks.length; i++) {
      var currentInstrument: _Instrument = {
        id: this.instrumentIndexer,
        nodes: [],
        frequencyMap: [],
        name: "instrument " + i,
        spatial: tempSpatial,
        gain: tempGain,
        waveType: "sine",
        envelope: [1, 1, 1, 1],
        filterdata: []
      }
      this.instrumentIndexer++;
      var currentTime = 0;
      //for each event in each track mapMidiMeta is called
      for (var j = 0; j < tracks[i].length; j++) {
        currentTime += tracks[i][j].delta;
        this.mapMidiMeta(tracks[i][j], currentInstrument, currentTime);
      }

      //if a track has no events, it is excluded
      if (currentInstrument.nodes.length != 0) {
        instruments.push(currentInstrument);
      }
    }
    //send to observable, so it can be picked up by subscribers
    this.midiInstruments.next(instruments);
  }

  //a switch for setting values based on any midi event
  mapMidiMeta(message: TMidiEvent, instrument: _Instrument, time: number) {
    switch (true) {
      case this.midiMessageService.isSetTempoMessage(message):
        this.midiTempo.next(this.normalizeTempo((message as IMidiSetTempoEvent).setTempo.microsecondsPerBeat));
        break;
      case this.midiMessageService.isChangeControlMessage(message):
        this.mapMidiControlMeta((message as IMidiControlChangeEvent), instrument);
        break;
      case this.midiMessageService.isNoteOnMessage(message):
        this.mapMidiFrequency((message as IMidiNoteOnEvent), instrument, true, time);
        break;
      case this.midiMessageService.isNoteOffMessage(message):
        this.mapMidiFrequency((message as IMidiNoteOffEvent), instrument, false, time);
        break;
      case this.midiMessageService.isTrackNameMessage(message):
        instrument.name = (message as IMidiTrackNameEvent).trackName;
        break;
      default:
        break;
    }
  }

  //a switch for setting values based on midi controlchange events
  mapMidiControlMeta(message: IMidiControlChangeEvent, instrument: _Instrument) {
    switch (message.controlChange.type) {
      case 7:
        instrument.gain = Number.parseFloat(this.normalizeGain(message.controlChange.value).toFixed(2));
        break;
      case 10:
        instrument.spatial = Number.parseFloat(this.normalizeSpatial(message.controlChange.value).toFixed(2));
        break;
      default:
        break;
    }
  }

  //creates a new node based on midi noteOn and noteOff events
  mapMidiFrequency(message: IMidiNoteOnEvent | IMidiNoteOffEvent, instrument: _Instrument, on: boolean, time: number) {
    if (on) {
      var node: _Node = {
        id: this.nodeIndexer,
        envelopeMaxAmplitude: this.normalizeGain((message as IMidiNoteOnEvent).noteOn.velocity),
        start: time,
        key: this.mapKey((message as IMidiNoteOnEvent).noteOn.noteNumber),
        instrument: instrument,
        length: undefined
      };
      this.nodeIndexer++;
      instrument.nodes.push(node);
    } else {
      var node = instrument.nodes.find(p => p.key == this.mapKey((message as IMidiNoteOffEvent).noteOff.noteNumber) && p.length == undefined);
      node.length = time - node.start;
    }
  }

  //based on midi number, returns the key and octave of node
  mapKey(noteNumber: number): string {
    var key = keyMap[noteNumber % 12];
    //-1 because the octaves start at -1
    var octave = Math.floor(noteNumber / 12) - 1;
    return key + " " + octave;
  }

  mapKeyFromScreenPosition(position: number): string {
    //20 is the height of each key
    var formattedData = Math.floor(position / 20) + 12;
    return this.mapKey(formattedData);
  }

  //returns gain as a value between 0 and 1
  normalizeGain(midiGain: number): number {
    return midiGain / 127.0;
  }

  //returns spatial as a value between -1 and 1
  normalizeSpatial(midiSpatial: number): number {
    return ((midiSpatial / 127) * 2) - 1;
  }
  //returns tempo as beats per minute
  normalizeTempo(microsecondsPerBeat: number): number {
    return 60 / (microsecondsPerBeat * Math.pow(10, -6));
  }
}
