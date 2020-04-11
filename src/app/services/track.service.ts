import { Injectable } from '@angular/core';
import { MidiHelperService } from './midi-helper.service';
import { WebAudioHelperService } from './web-audio-helper.service';
import { BehaviorSubject, Observable } from 'rxjs';

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
      if(instruments.length != 0){
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

    //subscribe to much more + change stuff in webAudioHelper by user inputs
  }

  calcTrackLength(instruments: _Instrument[]){
    var trackLength = 0;
    for(var i = 0; i < instruments.length; i++){
      var lastNode = instruments[i].nodes.pop();
      if(lastNode.start + lastNode.length > trackLength){
        trackLength = lastNode.start + lastNode.length;
      }
    }
    return trackLength;
  }

  getTrack(): Observable<_Track> {
    return this.track.asObservable();
  }
}
