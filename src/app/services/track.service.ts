import { Injectable } from '@angular/core';
import { MidiHelperService } from './midi-helper.service';
import { WebAudioHelperService } from './web-audio-helper.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { _Track, _Instrument } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TrackService {
  track: BehaviorSubject<_Track>;
  
  constructor(private midiHelperService: MidiHelperService, private webAudioHelperService: WebAudioHelperService) {
    
    this.track = new BehaviorSubject<_Track>({
      instruments: [],
      tempo: 1,
      division: 1,
      spatial: 0,
      gain: 0.10,
      length: 1
    });
    
    //subscribes for instruments generated by imported midi
    this.midiHelperService.getInstruments().subscribe((instruments: _Instrument[]) => {
      this.track.value.instruments = instruments;
      this.track.value.length = this.calcTrackLength(instruments);
      //if the midi generated model has any instruments web audio helper service. loadtrack is called, which maps the model to the Web audio api
      if(instruments.length != 0){
        this.webAudioHelperService.removeOldTrack();
        this.webAudioHelperService.loadTrack(this.track.value);
      }
      this.track.next(this.track.value);
    });

    //subscribes for tempo set by imported midi
    this.midiHelperService.getTempo().subscribe((tempo: number) => {
      this.track.value.tempo = tempo;
      this.track.next(this.track.value);
    });

    //subscribes for division set by imported midi
    this.midiHelperService.getDivision().subscribe((divison: number) => {
      this.track.value.division = divison;
      this.track.next(this.track.value);
    });
  }

  //a method for calculating the length of the track
  calcTrackLength(instruments: _Instrument[]){
    var trackLength = 0;
    for(var i = 0; i < instruments.length; i++){
      //looks at the last node of each instrument and finds the one that ends last, which is the length of the track
      var lastNode = instruments[i].nodes.pop();
      instruments[i].nodes.push(lastNode);
      if(lastNode.start + lastNode.length > trackLength){
        trackLength = lastNode.start + lastNode.length;
      }
    }
    return trackLength;
  }

  //can get the track as an observable
  getTrack(): Observable<_Track> {
    return this.track.asObservable();
  }
}
