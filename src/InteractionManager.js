import * as THREE from "three";

// InteractionManager.js
export class InteractionManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.selectedCell = null; // Seçili hücreyi takip etmek için
  }

  enableInteractions() {
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("click", this.onMouseClick.bind(this));
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onMouseClick(event) {
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
    const intersects = this.raycaster.intersectObjects(
      this.sceneManager.scene.children
    );

    // Önceki seçili hücreyi eski rengine döndür
    if (this.selectedCell) {
      this.selectedCell.material.color.setHex(0x156289);
      this.selectedCell.material.opacity = 0.1;
    }

    // Tıklanan nesneyi bul
    for (let intersect of intersects) {
      // Sadece Voronoi hücrelerini (mesh'leri) seç
      if (
        intersect.object.type === "Mesh" &&
        intersect.object.geometry instanceof THREE.ShapeGeometry
      ) {
        const voronoiCell = intersect.object;

        // Yeni renk ve opaklık ayarla
        voronoiCell.material.color.setHex(0x1e90ff); // Daha parlak bir mavi tonu
        voronoiCell.material.opacity = 0.3;

        this.selectedCell = voronoiCell;
        break;
      }
    }
  }
}
