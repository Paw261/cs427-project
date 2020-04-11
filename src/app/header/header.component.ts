import { Component, OnInit, Output } from '@angular/core';
import { MidiHelperService } from '../services/midi-helper.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent implements OnInit {

  private midiHelperService: MidiHelperService;

  trackName: string = "";

  constructor(midiHelperService: MidiHelperService) {
    this.midiHelperService = midiHelperService;
  }

  ngOnInit() {
  }

  onMidiUpload(event: any) {
    if(event.target.files[0] == null){
      return;
    }
    this.midiHelperService.loadMidiFile(event.target.files[0]);
    this.trackName = event.target.files[0].name.split(".mid")[0];
  }

  clickMidiUpload(event: any){
    document.getElementById('file-uploader').click();
  }

}
