import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { MainComponent } from './main/main.component';
import { ControlsComponent } from './controls/controls.component';
import { TrackComponent } from './main/track/track.component';
import { NodeComponent } from './main/track/instrument/node/node.component';
import { InstrumentComponent } from './main/track/instrument/instrument.component';
import { LazyForDirective } from './directives/lazyFor.directive';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MainComponent,
    ControlsComponent,
    TrackComponent,
    NodeComponent,
    InstrumentComponent,
    LazyForDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ScrollingModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
