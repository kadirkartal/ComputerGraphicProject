// MarkerManager.js
import * as THREE from "three";
import { VoronoiDiagram } from "./VoronoiDiagram.js";

export class MarkerManager {
  constructor(scene) {
    if (!scene) {
      throw new Error("Scene parametresi gerekli!");
    }
    this.scene = scene;
    this.markers = [];
    console.log("MarkerManager başlatıldı, scene:", scene);
    this.voronoiDiagram = new VoronoiDiagram(scene);
  }

  createMarkersFromGeoJSON(geojsonData, mapCenterX, mapCenterY, mapScale) {
    console.log("Marker oluşturma başladı");

    // Marker geometrisi ve materyalini bir kez oluştur
    const geometry = new THREE.SphereGeometry(0.01); // Boyutu küçülttük
    const material = new THREE.MeshPhongMaterial({
      color: 0xffff00, // Sarı renk
      emissive: 0xffff00, // Işıma rengi
      emissiveIntensity: 0.5, // Işıma yoğunluğu
      shininess: 100, // Parlaklık
      transparent: true, // Şeffaflık aktif
      opacity: 0.9, // Opaklık değeri
    });

    geojsonData.features.forEach((feature, index) => {
      try {
        if (feature.geometry?.type === "Polygon") {
          const center = this.calculatePolygonCenter(
            feature.geometry.coordinates
          );

          // Koordinatları harita ölçeğine dönüştür
          const x = (center[0] - mapCenterX) * mapScale;
          const y = (center[1] - mapCenterY) * mapScale;

          const marker = new THREE.Mesh(geometry, material);

          // Z pozisyonunu haritanın üzerine çıkar
          marker.position.set(x, 1.2, -y); // y koordinatını z'ye negatif olarak atıyoruz

          // Marker'ı düz tutmak için rotasyonu sıfırla
          marker.rotation.set(0, 0, 0);

          const schoolName = feature.properties?.name || `Okul ${index + 1}`;
          marker.name = schoolName;

          this.scene.add(marker);
          this.markers.push(marker);
          //console.log(`Marker eklendi: ${schoolName} at (${x}, 1.5, ${-y})`);
        }
      } catch (error) {
        console.error(`Marker oluşturma hatası (${index}):`, error);
      }
    });

    console.log(`Toplam ${this.markers.length} marker eklendi`);

    // Tüm marker'lar eklendikten sonra Voronoi diyagramını oluştur
    this.voronoiDiagram.generateVoronoi(this.markers, mapScale);
  }

  calculatePolygonCenter(coordinates) {
    let sumX = 0;
    let sumY = 0;
    const points = coordinates[0];

    points.forEach((point) => {
      sumX += point[0];
      sumY += point[1];
    });

    return [sumX / points.length, sumY / points.length];
  }

  clearMarkers() {
    this.markers.forEach((marker) => {
      this.scene.remove(marker);
    });
    this.markers = [];
  }
}
