import { Injectable } from '@angular/core';
import { Map, View } from 'ol';
import { getCenter } from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
import Projection from 'ol/proj/Projection';
import Static from 'ol/source/ImageStatic';
import {
  Draw,
  Modify,
  Snap,
  Select
} from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Type as DrawType } from 'ol/geom/Geometry';
import { BehaviorSubject, Observable } from 'rxjs';
import GeoJSON from 'ol/format/GeoJSON'
import { FeatureCollection } from 'geojson'
import { DrawMode } from '../draw-mode';

@Injectable({
  providedIn: 'root'
})
export class DrawService {
  private map!: Map;
  private draw!: Draw;
  private modify!: Modify;
  private snap!: Snap;
  private select!: Select;
  private projection!: Projection;
  private source = new VectorSource({ wrapX: false });
  private vectorLayer = new VectorLayer({
    source: this.source
  });

  private _currentDrawMode$ = new BehaviorSubject<DrawMode>('LineString');
  currentDrawMode$: Observable<DrawMode> = this._currentDrawMode$.asObservable();

  constructor() { }

  initDraw(imageUri: string): void {
    const image = new Image()
    image.onload = () => {
      this.initMap(imageUri, image.width, image.height);
    }
    image.src = imageUri;
  }

  private initMap(imageUri: string, width: number, height: number) {
    const imageExtent = [0, 0, width, height];
    this.projection = new Projection({
      code: 'image',
      units: 'pixels',
      extent: imageExtent,
    });

    const imageLayer = new ImageLayer({
      source: new Static({
        url: imageUri,
        projection: this.projection,
        imageExtent,
      })
    });

    this.map = new Map({
      target: 'map',
      layers: [
        imageLayer,
        this.vectorLayer
      ],
      view: new View({
        projection: this.projection,
        center: getCenter(imageExtent),
        zoom: 2,
        maxZoom: 8,
      })
    });

    this.changeDrawType('LineString', true);

    this.draw.on('drawend', () => {
      const geojson = this.asGeoJSON(this.vectorLayer);
      console.log(geojson);
    });

  }

  changeDrawType(type: DrawType, freehand?: boolean): void {
    this._currentDrawMode$.next(type);

    this.removeInteractions();

    this.draw = new Draw({
      source: this.source,
      type,
      freehand
    });

    this.map.addInteraction(this.draw)
  }

  undo(): void {
    this.draw.removeLastPoint();
  }

  edit(): void {
    this._currentDrawMode$.next('Edit');
    this.removeInteractions();

    this.snap = new Snap({ source: this.source });
    this.map.addInteraction(this.snap);

    this.modify = new Modify({ source: this.source });
    this.map.addInteraction(this.modify);
  }

  delete(): void {
    this._currentDrawMode$.next('Delete');
    this.removeInteractions();

    this.select = new Select({ hitTolerance: 20 })
    this.map.addInteraction(this.select);
    this.select.on('select', (e) => {
      (this.vectorLayer.getSource() as VectorSource).removeFeature(e.target.getFeatures().array_[0])
    })
  }

  private removeInteractions(): void {
    this.map.removeInteraction(this.draw);
    this.map.removeInteraction(this.snap);
    this.map.removeInteraction(this.modify);
    this.map.removeInteraction(this.select);
  }

  private addGeoJSON(geojson: any): void {

  }

  private asGeoJSON(layer: VectorLayer<VectorSource>): FeatureCollection {
    const geojson = new GeoJSON().writeFeatures(
      (layer.getSource() as VectorSource).getFeatures()
    );

    return JSON.parse(geojson);
  }
}
