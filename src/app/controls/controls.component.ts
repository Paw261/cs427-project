import { Component, OnInit, Input } from '@angular/core';
import { WebAudioHelperService } from '../services/web-audio-helper.service';
import { TrackService } from '../services/track.service';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.less']
})
export class ControlsComponent implements OnInit {

  playPauseValue: string = "Play";
  stopValue: string = "Stop";
  volumeValue: number = 0.1;
  constructor(private webAudioHelperService: WebAudioHelperService, private trackService: TrackService) { }

  ngOnInit() {
    this.trackService.getTrack().subscribe((track: _Track) => {
      this.volumeValue = track.gain;
    });

    setInterval(() => {
      if(this.webAudioHelperService.isTrackOver()){
        this.stop();
      }
    }, 10);
  }

  playPause() {
    if(this.playPauseValue == "Play"){
      this.webAudioHelperService.play();
      this.playPauseValue = "Pause";
    }else{
      this.webAudioHelperService.pause();
      this.playPauseValue = "Play";
    }
  }

  stop() {
    this.webAudioHelperService.stop();
    this.playPauseValue = "Play";
  }

  changeVolume(event) {
    this.volumeValue = event.target.value;
    this.webAudioHelperService.updateVolume(this.volumeValue);
  }

}
