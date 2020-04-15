import { Component, OnInit } from '@angular/core';
import { TrackService } from 'src/app/services/track.service';
import { _Track } from 'src/app/models';

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
    //subscribes to the loaded track
    this.trackService.getTrack().subscribe((track: _Track) => {
      this.track = track;
      this.adjustMainProperties(track);
    });
  }

  //sets the width of the visual view of the nodes, based on the loaded track
  adjustMainProperties(track: _Track) {
      var main = document.getElementById("main");
      main.style.width = `${track.length + 20}px`;
  }

}
