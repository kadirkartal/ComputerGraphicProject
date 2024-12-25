import * as THREE from "three";
import * as d3 from "d3";

export class VoronoiDiagram {
  constructor(scene) {
    this.scene = scene;
    this.voronoiMeshes = [];
  }

  generateVoronoi(markers, mapScale) {
    console.log("Voronoi oluşturuluyor...");

    // Marker pozisyonlarını 2D koordinatlara dönüştür
    const points = markers.map((marker) => [
      marker.position.x,
      -marker.position.z,
    ]);

    // Harita sınırlarını hesapla
    const bounds = this.calculateBounds(points);

    // Sınırları biraz genişlet (harita kenarlarında düzgün hücreler için)
    const padding = mapScale * 0.1; // Harita ölçeğine göre padding
    const boundingBox = [
      bounds.minX - padding,
      bounds.minY - padding,
      bounds.maxX + padding,
      bounds.maxY + padding,
    ];

    // Delaunay üçgenlemesi oluştur
    const delaunay = d3.Delaunay.from(points);
    const voronoi = delaunay.voronoi(boundingBox);

    // Eski voronoi mesh'lerini temizle
    this.clearVoronoi();

    // İstanbul haritası mesh'ini bul
    const istanbulMesh = this.scene.children.find(
      (child) =>
        child.type === "Mesh" && child.geometry instanceof THREE.ExtrudeGeometry
    );

    if (!istanbulMesh) {
      console.error("İstanbul haritası mesh'i bulunamadı!");
      return;
    }

    // Her hücre için
    points.forEach((point, i) => {
      try {
        const cell = voronoi.cellPolygon(i);
        if (!cell) return;

        // Hücre şeklini oluştur
        const shape = new THREE.Shape();
        shape.moveTo(cell[0][0], cell[0][1]);
        for (let j = 1; j < cell.length; j++) {
          shape.lineTo(cell[j][0], cell[j][1]);
        }

        // Voronoi hücresi için materyal
        const cellMaterial = new THREE.MeshBasicMaterial({
          color: 0x156289,
          transparent: true,
          opacity: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
          stencilWrite: true,
          stencilRef: 1,
          stencilFunc: THREE.EqualStencilFunc,
          stencilFail: THREE.KeepStencilOp,
          stencilZFail: THREE.KeepStencilOp,
          stencilZPass: THREE.KeepStencilOp,
        });

        const geometry = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geometry, cellMaterial);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 1.2;
        this.scene.add(mesh);
        this.voronoiMeshes.push(mesh);

        // Hücre sınırları için çizgiler
        const lineGeometry = new THREE.BufferGeometry();
        const points3D = cell.map(
          (point) => new THREE.Vector3(point[0], point[1], 0)
        );
        points3D.push(points3D[0]);
        lineGeometry.setFromPoints(points3D);

        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xf2f2f2,
          transparent: true,
          opacity: 0.5,
        });

        // Stencil özelliklerini manuel olarak ayarla
        lineMaterial.stencilWrite = true;
        lineMaterial.stencilRef = 1;
        lineMaterial.stencilFunc = THREE.EqualStencilFunc;
        lineMaterial.stencilFail = THREE.KeepStencilOp;
        lineMaterial.stencilZFail = THREE.KeepStencilOp;
        lineMaterial.stencilZPass = THREE.KeepStencilOp;

        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.y = 1.2;
        this.scene.add(line);
        this.voronoiMeshes.push(line);
      } catch (error) {
        console.error(`Hücre ${i} oluşturulurken hata:`, error);
      }
    });

    console.log("Voronoi diyagramı oluşturuldu");
  }

  calculateBounds(points) {
    return points.reduce(
      (bounds, point) => {
        return {
          minX: Math.min(bounds.minX, point[0]),
          maxX: Math.max(bounds.maxX, point[0]),
          minY: Math.min(bounds.minY, point[1]),
          maxY: Math.max(bounds.maxY, point[1]),
        };
      },
      {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      }
    );
  }

  clearVoronoi() {
    this.voronoiMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.voronoiMeshes = [];
  }
}
