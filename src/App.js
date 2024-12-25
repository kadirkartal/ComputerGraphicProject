import { SceneManager } from "./SceneManager.js";
import { GeoMap } from "./GeoMap.js";
import { MarkerManager } from "./MarkerManager.js";
import { InteractionManager } from "./InteractionManager.js";

export default class App {
  constructor() {
    this.sceneManager = new SceneManager();
    this.geoMap = new GeoMap(this.sceneManager.scene, this.sceneManager.camera);
    this.markerManager = new MarkerManager(this.sceneManager.scene);
    this.interactionManager = new InteractionManager(this.sceneManager);

    // Etkileşimleri etkinleştir
    this.interactionManager.enableInteractions();
  }

  start() {
    this.sceneManager.animate();
  }
}
