import { Component, OnInit } from '@angular/core';
import { TrackService } from 'src/app/services/track.service';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.less']
})
export class TrackComponent implements OnInit {

  track: _Track;
  constructor(private trackService: TrackService) {
  }

  ngOnInit() {
    this.trackService.getTrack().subscribe((track: _Track) => {
      this.track = track;
      this.adjustMainProperties(track);
    });
  }

  adjustMainProperties(track: _Track) {
      var main = document.getElementById("main");
      main.style.width = `${track.length + 20}px`;
  }

  addNode() {

  }

  removeNode() {
    
  }

}
