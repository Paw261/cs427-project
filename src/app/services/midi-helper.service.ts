import { Injectable } from '@angular/core';
import { parseArrayBuffer } from 'midi-json-parser';
import { IMidiFile, TMidiEvent, IMidiSetTempoEvent, IMidiControlChangeEvent, IMidiNoteOnEvent, IMidiNoteOffEvent, IMidiTrackNameEvent } from 'midi-json-parser-worker';
import { Observable, BehaviorSubject } from 'rxjs';
import { MidiMessageService } from './midi-message.service';
import { keyMap } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class MidiHelperService {
  midiInstruments: BehaviorSubject<_Instrument[]>;
  midiTempo: BehaviorSubject<number>;
  midiDivision: BehaviorSubject<number>;

  private midiMessageService: MidiMessageService;

  constructor(midiMessageService: MidiMessageService) {
    this.midiInstruments = new BehaviorSubject<_Instrument[]>([]);
    this.midiTempo = new BehaviorSubject<number>(1);
    this.midiDivision = new BehaviorSubject<number>(1);

    this.midiMessageService = midiMessageService;
  }

  getInstruments(): Observable<_Instrument[]> {
    return this.midiInstruments.asObservable();
  }

  getTempo(): Observable<number> {
    return this.midiTempo.asObservable();
  }

  getDivision(): Observable<number> {
    return this.midiDivision.asObservable();
  }

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

  mapMidiToInstruments(rawJson: IMidiFile) {
    var tracks = rawJson.tracks;
    console.log(rawJson);
    this.midiDivision.next(rawJson.division);

    var tempSpatial = 0;
    var tempGain = 1;

    var instruments = [];

    for (var i = 0; i < tracks.length; i++) {
      var currentInstrument: _Instrument = {
        nodes: [],
        frequencyMap: [],
        name: "instrument " + i,
        spatial: tempSpatial,
        gain: tempGain
      }
      var currentTime = 0;
      for (var j = 0; j < tracks[i].length; j++) {
        currentTime += tracks[i][j].delta;
        this.mapMidiMeta(tracks[i][j], currentInstrument, currentTime);
      }

      if (currentInstrument.nodes.length != 0) {
        instruments.push(currentInstrument);
      }
    }
    //send to observable, so it can be picked up by subscribers
    this.midiInstruments.next(instruments);
  }

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

  mapMidiControlMeta(message: IMidiControlChangeEvent, instrument: _Instrument) {
    switch (message.controlChange.type) {
      case 7:
        instrument.gain = this.normalizeGain(message.controlChange.value);
        break;
      case 10:
        instrument.spatial = this.normalizeSpatial(message.controlChange.value);
        break;
      default:
        break;
    }
  }

  mapMidiFrequency(message: IMidiNoteOnEvent | IMidiNoteOffEvent, instrument: _Instrument, on: boolean, time: number) {
    if (on) {
      var node: _Node = {
        envelopeMaxAmplitude: (message as IMidiNoteOnEvent).noteOn.velocity,
        start: time,
        key: this.mapKey((message as IMidiNoteOnEvent).noteOn.noteNumber),
        instrument: instrument,
        waveType: "sine",
        envelope: [1, 1, 1, 1],
        filterFreq: -1,
        filterType: "",
        length: undefined
      };
      
      instrument.nodes.push(node);
    } else {
      var node = instrument.nodes.find(p => p.key == this.mapKey((message as IMidiNoteOffEvent).noteOff.noteNumber) && p.length == undefined);
      node.length = time - node.start;
    }
  }

  mapKey(noteNumber: number): string {
    var key = keyMap[noteNumber % 12];
    var octave = Math.floor(noteNumber / 12);
    return key + " " + octave;
  }

  normalizeGain(midiGain: number): number {
    return (midiGain / 127) * 100;
  }

  normalizeSpatial(midiSpatial: number): number {
    return ((midiSpatial / 127) * 2) - 1;
  }
  //returns tempo as beats per minute
  normalizeTempo(microsecondsPerBeat: number): number {
    return 60 / (microsecondsPerBeat * Math.pow(10, -6));
  }
}
