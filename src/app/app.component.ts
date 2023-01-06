import { AfterViewInit, Component, OnInit } from '@angular/core';
import { DrawService } from './services/draw.service';
import { Type as DrawType } from 'ol/geom/Geometry';
import { Observable } from 'rxjs';
import { DrawMode } from './draw-mode';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  drawMode$?: Observable<DrawMode>;

  constructor(
    private drawService: DrawService
  ) {}

  ngOnInit(): void {
      this.drawMode$ = this.drawService.currentDrawMode$
  }

  ngAfterViewInit(): void {
    this.drawService.initDraw('https://imgs.xkcd.com/comics/online_communities.png')
  }

  onChangeDrawMode(mode: DrawType, freehand?: boolean): void {
    this.drawService.changeDrawType(mode, freehand);
  }

  onEdit(): void {
    this.drawService.edit();
  }

  onDelete(): void {
    this.drawService.delete();
  }
}
