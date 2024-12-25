import * as THREE from "three";

export class GeoMap {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.mapScale = null;
    this.mapCenterX = null;
    this.mapCenterY = null;
  }

  createMapFromGeoJSON(geojsonData) {
    const material = new THREE.MeshPhongMaterial({
      color: 0x156289,
      side: THREE.DoubleSide,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilFail: THREE.KeepStencilOp,
      stencilZFail: THREE.KeepStencilOp,
      stencilZPass: THREE.ReplaceStencilOp,
    });

    const bounds = this.calculateBounds(geojsonData.features);
    this.mapCenterX = (bounds.minX + bounds.maxX) / 2;
    this.mapCenterY = (bounds.minY + bounds.maxY) / 2;
    const width = Math.abs(bounds.maxX - bounds.minX);
    const height = Math.abs(bounds.maxY - bounds.minY);
    this.mapScale = 50 / Math.max(width, height);

    geojsonData.features.forEach((feature, index) => {
      try {
        console.log(`İlçe işleniyor: ${feature.properties?.display_name}`);

        if (feature.geometry.type === "Polygon") {
          this.createPolygon(
            feature.geometry.coordinates[0],
            feature.properties,
            material
          );
        } else if (feature.geometry.type === "MultiPolygon") {
          // Her bir polygon parçasını ayrı ayrı işle
          feature.geometry.coordinates.forEach((polygonPart, partIndex) => {
            console.log(
              `MultiPolygon parçası işleniyor: ${
                feature.properties?.display_name
              } - Parça ${partIndex + 1}`
            );
            this.createPolygon(polygonPart[0], feature.properties, material);
          });
        }
      } catch (error) {
        console.error(
          `İlçe işlenirken hata (${feature.properties?.display_name}):`,
          error
        );
      }
    });

    // Işıklandırma ekle
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);
  }

  createPolygon(coordinates, properties, material) {
    const validCoords = coordinates.filter(
      (coord) =>
        Array.isArray(coord) &&
        coord.length >= 2 &&
        typeof coord[0] === "number" &&
        typeof coord[1] === "number" &&
        !isNaN(coord[0]) &&
        !isNaN(coord[1])
    );

    if (validCoords.length < 3) {
      console.warn(`Yetersiz geçerli koordinat: ${properties?.display_name}`);
      return;
    }

    const shape = new THREE.Shape();
    const firstPoint = validCoords[0];
    shape.moveTo(
      (firstPoint[0] - this.mapCenterX) * this.mapScale,
      (firstPoint[1] - this.mapCenterY) * this.mapScale
    );

    for (let i = 1; i < validCoords.length; i++) {
      const x = (validCoords[i][0] - this.mapCenterX) * this.mapScale;
      const y = (validCoords[i][1] - this.mapCenterY) * this.mapScale;
      if (!isNaN(x) && !isNaN(y)) {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 1,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // İlçe adını ayıkla
    let districtName = properties?.display_name;
    if (districtName) {
        // display_name içinden sadece ilçe adını al
        // Örnek: "Kadıköy, İstanbul, Türkiye" -> "Kadıköy"
        districtName = districtName.split(',')[0].trim();
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = districtName || `İlçe ${index + 1}`;
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);

    // İlçe etiketini ekle
    if (districtName) {
        this.addDistrictLabel(districtName, mesh);
    }

    // Sınır çizgilerini ekle
    this.createBorderLines(validCoords, districtName);
  }

  createBorderLines(coordinates, name) {
    const points = coordinates.map((coord) => {
      const x = (coord[0] - this.mapCenterX) * this.mapScale;
      const y = (coord[1] - this.mapCenterY) * this.mapScale;
      return new THREE.Vector3(x, y, 1.2);
    });
    points.push(points[0]); // Şekli kapatmak için

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.rotation.x = -Math.PI / 2;
    this.scene.add(line);
  }

  addDistrictLabel(name, mesh) {
    const label = document.createElement("div");
    label.className = "district-label";
    label.textContent = name;
    label.style.position = "absolute";
    label.style.color = "white";
    label.style.padding = "2px 6px";
    label.style.fontSize = "12px";
    label.style.pointerEvents = "none";
    label.style.userSelect = "none";
    label.style.zIndex = "1000";
    label.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    label.style.borderRadius = "4px";

    document.body.appendChild(label);

    const updatePosition = () => {
      if (mesh && this.camera) {
        const center = new THREE.Vector3();
        mesh.geometry.computeBoundingBox();
        mesh.geometry.boundingBox.getCenter(center);
        mesh.localToWorld(center);

        center.project(this.camera);

        const x = (center.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-center.y * 0.5 + 0.5) * window.innerHeight;

        label.style.transform = `translate(-50%, -50%)`;
        label.style.left = `${x}px`;
        label.style.top = `${y}px`;

        const isVisible = center.z < 1;
        label.style.display = isVisible ? "block" : "none";
      }
    };

    const animate = () => {
      updatePosition();
      requestAnimationFrame(animate);
    };
    animate();
  }

  calculateBounds(features) {
    let bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    features.forEach((feature) => {
      const coordinates = feature.geometry?.coordinates?.[0];
      if (coordinates && Array.isArray(coordinates)) {
        coordinates.forEach((coord) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            const [x, y] = coord;
            if (
              typeof x === "number" &&
              typeof y === "number" &&
              !isNaN(x) &&
              !isNaN(y)
            ) {
              bounds.minX = Math.min(bounds.minX, x);
              bounds.maxX = Math.max(bounds.maxX, x);
              bounds.minY = Math.min(bounds.minY, y);
              bounds.maxY = Math.max(bounds.maxY, y);
            }
          }
        });
      }
    });

    return bounds;
  }

  createNeighborhoodsFromGeoJSON(geojsonData) {
    if (!this.mapScale) {
      console.error("İlçe haritası henüz yüklenmemiş!");
      return;
    }

    geojsonData.features.forEach((feature, index) => {
      try {
        const coordinates = feature.geometry?.coordinates?.[0];
        if (!coordinates || !Array.isArray(coordinates)) return;

        const validCoords = coordinates.filter(
          (coord) =>
            Array.isArray(coord) &&
            coord.length >= 2 &&
            typeof coord[0] === "number" &&
            typeof coord[1] === "number" &&
            !isNaN(coord[0]) &&
            !isNaN(coord[1])
        );

        if (validCoords.length < 3) return;

        const borderPoints = validCoords.map((coord) => {
          const x = (coord[0] - this.mapCenterX) * this.mapScale;
          const y = (coord[1] - this.mapCenterY) * this.mapScale;
          return new THREE.Vector3(x, y, 1.2);
        });
        borderPoints.push(borderPoints[0]);

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(
          borderPoints
        );
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xff0000,
          linewidth: 1,
          transparent: true,
          opacity: 0.7,
        });
        const borderLine = new THREE.Line(lineGeometry, lineMaterial);
        borderLine.rotation.x = -Math.PI / 2;
        this.scene.add(borderLine);
      } catch (error) {
        console.error(`Mahalle işlenirken hata (${index}):`, error);
      }
    });
  }
}
