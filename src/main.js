// main.js
import { SceneManager } from "./SceneManager.js";
import { MarkerManager } from "./MarkerManager.js";
import { InteractionManager } from "./InteractionManager.js";

console.log("main.js başlatılıyor...");

class App {
  constructor() {
    this.init();
  }

  init() {
    try {
      document.addEventListener("DOMContentLoaded", () => {
        console.log("DOMContentLoaded event tetiklendi");

        const appDiv = document.getElementById("app");
        if (!appDiv) {
          throw new Error("'app' ID'li div bulunamadı!");
        }

        this.sceneManager = new SceneManager();
        console.log("SceneManager oluşturuldu");

        this.sceneManager.markerManager = new MarkerManager(
          this.sceneManager.scene
        );
        console.log("MarkerManager oluşturuldu");

        this.interactionManager = new InteractionManager(this.sceneManager);
        this.interactionManager.enableInteractions();
        console.log("InteractionManager oluşturuldu ve etkinleştirildi");

        this.sceneManager.init();
        console.log("SceneManager init çağrıldı");
      });
    } catch (error) {
      console.error("main.js hatası:", error);
    }
  }
}

// Uygulamayı başlat
new App();
