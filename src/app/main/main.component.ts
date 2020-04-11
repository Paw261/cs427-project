import { Component, OnInit } from '@angular/core';
import { WebAudioHelperService } from '../services/web-audio-helper.service';
import { TrackService } from '../services/track.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {
  intervalId: number = -1;
  playingStatus: string;
  track: _Track;
  constructor(private webAudioHelperService: WebAudioHelperService) { }

  ngOnInit() {
    this.webAudioHelperService.getStatus().subscribe((status: string) => {
      this.playingStatus = status;
      if(status == "closed"){
        this.clearLine();
      }else if(this.intervalId == -1){
        this.moveLine();
      }
    });
  }

  moveLine() {
    var line = document.getElementById("music-line");
    var wrapper = document.getElementById("main-wrapper");
    var main = document.getElementById("main");
    this.intervalId = setInterval(() => {
      if(this.playingStatus == "running"){
        var movement = (1000 * this.webAudioHelperService.getTime()) / this.webAudioHelperService.secsPerTick();
        line.style.left = `${movement}px`;
        wrapper.scroll({left: movement - 50});
        if(Number.parseInt(line.style.left.split("px")[0]) > Number.parseInt(main.style.width.split("px")[0])){
          this.clearLine();
        }
      }
    }, 10);
  }

  clearLine() {
    var line = document.getElementById("music-line");
    var wrapper = document.getElementById("main-wrapper");
    line.style.left = "0px";
    wrapper.scroll({left: 0});
    clearInterval(this.intervalId);
    this.intervalId = -1;
  }
}
