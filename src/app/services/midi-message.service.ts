import { Injectable } from '@angular/core';
import { IMidiSetTempoEvent, IMidiControlChangeEvent, TMidiEvent, IMidiNoteOnEvent, IMidiNoteOffEvent, IMidiTrackNameEvent, IMidiEndOfTrackEvent } from 'midi-json-parser-worker';

@Injectable({
  providedIn: 'root'
})
export class MidiMessageService {

  constructor() { }
  
  isSetTempoMessage(message: TMidiEvent): message is IMidiSetTempoEvent {
    return 'setTempo' in message;
  }

  isChangeControlMessage(message: TMidiEvent): message is IMidiControlChangeEvent {
    return 'controlChange' in message;
  }

  isNoteOnMessage(message: TMidiEvent): message is IMidiNoteOnEvent {
    return 'noteOn' in message;
  }

  isNoteOffMessage(message: TMidiEvent): message is IMidiNoteOffEvent {
    return 'noteOff' in message;
  }

  isTrackNameMessage(message: TMidiEvent): message is IMidiTrackNameEvent {
    return 'trackName' in message;
  }
}
