import { Component, OnInit, Input, ViewChild, ViewContainerRef, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { _Instrument, _Node } from 'src/app/models';

@Component({
  selector: 'app-instrument',
  templateUrl: './instrument.component.html',
  styleUrls: ['./instrument.component.less']
})
export class InstrumentComponent implements OnInit, AfterViewInit {
  @Input() instrument: _Instrument;
  @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;
  @ViewChild('node', { read: TemplateRef }) template: TemplateRef<any>;

  renderedViewIds: number[] = [];

  constructor(private changeDetectRef: ChangeDetectorRef) {
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.loadNodesListener();
    this.destroyNodesListener();
    this.changeDetectRef.detectChanges();
  }

  private loadNodesListener() {
    setInterval(() => {
      var nodes = this.findNodesInView();
      for (var i = 0; i < nodes.length; i++) {
        if (this.renderedViewIds.includes(nodes[i].id)) {
          //do nothing
        } else {
          //render node
          this.container.createEmbeddedView(this.template, {
            node: nodes[i]
          });
          //add node id to array for comparison when adding elements
          this.renderedViewIds.push(nodes[i].id);
        }
      }
    }, 200);
  }

  private destroyNodesListener() {
    setInterval(() => {
      for (var i = 0; i < this.container.length; i++) {
        var node = this.container.get(i);
        if (!this.isNodeInView((node as any).context.node)) {
          node.destroy();
          this.renderedViewIds = this.renderedViewIds.filter(id => id != (node as any).context.node.id);
        }
      }
    }, 1000);
  }

  private isNodeInView(node: _Node): boolean {
    var main = document.getElementById("main-wrapper");
    var screenWidth = screen.width;
    var viewWidth = main.scrollLeft;
    if (viewWidth < node.start + node.length && node.start < viewWidth + screenWidth) {
      return true;
    }
    return false;
  }

  private findNodesInView(): _Node[] {
    var main = document.getElementById("main-wrapper");
    var screenWidth = screen.width;
    var viewWidth = main.scrollLeft;
    return this.instrument.nodes.filter(node => viewWidth < node.start + node.length && node.start < viewWidth + screenWidth);
  }

  deleteNode(nodeId){
    for(var i = 0; i < this.container.length; i++){
      var node = this.container.get(i);
      if((node as any).context.node.id == nodeId){
        node.destroy();
        this.renderedViewIds = this.renderedViewIds.filter(id => id != (node as any).context.node.id);
      }
    }
  }

}
