import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GeoMap } from "./GeoMap.js";

export class SceneManager {
  constructor() {
    try {
      console.log("SceneManager constructor başladı");

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x2a2a2a);

      // Camera
      this.camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      this.camera.position.set(0, 50, 100);
      this.camera.lookAt(0, 0, 0);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        stencil: true,
        alpha: true,
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;

      // GeoMap
      this.geoMap = new GeoMap(this.scene, this.camera);

      // Event Listeners
      window.addEventListener("resize", () => this.onWindowResize(), false);

      console.log("SceneManager constructor tamamlandı");
    } catch (error) {
      console.error("SceneManager constructor hatası:", error);
    }
  }

  init() {
    try {
      console.log("init başladı");

      // DOM'a renderer'ı ekle
      const appElement = document.getElementById("app");
      if (!appElement) {
        throw new Error("'app' elementi bulunamadı!");
      }
      appElement.appendChild(this.renderer.domElement);

      // GeoJSON yükle
      this.loadGeoJSON();

      // Animasyon döngüsünü başlat
      this.animate();

      console.log("init tamamlandı");
    } catch (error) {
      console.error("Init hatası:", error);
    }
  }

  loadGeoJSON() {
    console.log("loadGeoJSON başladı");

    fetch("/ilce_geojson.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("İlçe verileri yüklendi");
        if (!data || !data.features) {
          throw new Error("Geçersiz ilçe GeoJSON formatı");
        }
        this.renderMap(data);

        // Mahalle verilerini yükle
        return fetch("/mahalle_geojson.json");
      })
      .then((response) => response.json())
      .then((data) => {
        console.log("Mahalle verileri yüklendi");
        if (!data || !data.features) {
          throw new Error("Geçersiz mahalle GeoJSON formatı");
        }
        this.geoMap.createNeighborhoodsFromGeoJSON(data);

        // Okul verilerini yükle
        console.log("Okul verileri yükleniyor...");
        return fetch("/schools.geojson")
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Okul verisi yüklenemedi! Status: ${response.status}`
              );
            }
            return response.json();
          })
          .then((schoolData) => {
            console.log("Okul verileri başarıyla yüklendi:", schoolData);

            if (!this.markerManager) {
              throw new Error("MarkerManager bulunamadı!");
            }

            this.markerManager.createMarkersFromGeoJSON(
              schoolData,
              this.geoMap.mapCenterX,
              this.geoMap.mapCenterY,
              this.geoMap.mapScale
            );
          });
      })
      .catch((error) => {
        console.error("GeoJSON yükleme hatası:", error.message);
        console.error("Hata detayı:", error);
      });
  }

  renderMap(data) {
    try {
      console.log("renderMap başladı");
      this.geoMap.createMapFromGeoJSON(data);
      console.log("renderMap tamamlandı");
    } catch (error) {
      console.error("renderMap hatası:", error);
    }
  }

  animate() {
    try {
      requestAnimationFrame(() => this.animate());

      if (this.controls) {
        this.controls.update();
      }

      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error("Animasyon hatası:", error);
    }
  }

  onWindowResize() {
    try {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    } catch (error) {
      console.error("Pencere yeniden boyutlandırma hatası:", error);
    }
  }
}
