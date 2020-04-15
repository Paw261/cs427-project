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
  // called after the view is created. Sets up intervals for creating and deleting node.components
  // couldnt be done automatically, due to performance issues. So I only render the components that are in the viewport
  ngAfterViewInit(): void {
    this.loadNodesListener();
    this.destroyNodesListener();
    this.changeDetectRef.detectChanges();
  }

  //interval that creates node.components in the viewport
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

  //interval that destroys node components that arnt in the viewport anymore
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
  
  //method that checks if node would be in the viewport, based on node.properties
  private isNodeInView(node: _Node): boolean {
    var main = document.getElementById("main-wrapper");
    var screenWidth = screen.width;
    var viewWidth = main.scrollLeft;
    if (viewWidth < node.start + node.length && node.start < viewWidth + screenWidth) {
      return true;
    }
    return false;
  }

  //same as the above, but looks at an array of nodes instead of only one
  private findNodesInView(): _Node[] {
    var main = document.getElementById("main-wrapper");
    var screenWidth = screen.width;
    var viewWidth = main.scrollLeft;
    return this.instrument.nodes.filter(node => viewWidth < node.start + node.length && node.start < viewWidth + screenWidth);
  }

  //captures an emitted node.id from a child component, and destroys that component.
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
