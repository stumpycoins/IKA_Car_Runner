(() => {
  function createRoundedBox(width, height, depth, radius, smoothness) {
    const shape = new THREE.Shape();
    const eps = 0.00001;
    const r = radius - eps;

    shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
    shape.absarc(eps, height - r * 2, eps, Math.PI, Math.PI / 2, true);
    shape.absarc(width - r * 2, height - r * 2, eps, Math.PI / 2, 0, true);
    shape.absarc(width - r * 2, eps, eps, 0, -Math.PI / 2, true);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth - radius * 2,
      bevelEnabled: true,
      bevelSegments: smoothness,
      steps: 1,
      bevelSize: radius,
      bevelThickness: radius,
      curveSegments: smoothness
    });

    geometry.center();
    return geometry;
  }

  function createPlayerCar(color = 0x1e90ff) {
    const car = new THREE.Group();

    const body = new THREE.Mesh(
      createRoundedBox(1.4, 0.45, 2.4, 0.12, 5),
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.6,
        roughness: 0.25
      })
    );
    body.position.y = 0.45;

    const hood = new THREE.Mesh(
      createRoundedBox(1.3, 0.3, 1.2, 0.08, 4),
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.5,
        roughness: 0.35
      })
    );
    hood.position.set(0, 0.65, 0.6);

    const roof = new THREE.Mesh(
      createRoundedBox(1.0, 0.35, 1.0, 0.08, 4),
      new THREE.MeshStandardMaterial({
        color: 0x90caf9,
        transparent: true,
        opacity: 0.85,
        roughness: 0.2,
        metalness: 0.3
      })
    );
    roof.position.set(0, 0.9, -0.1);

    const backLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa0000,
      transparent: true,
      opacity: 0.9
    });
    const backLightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const backLightLeft = new THREE.Mesh(backLightGeo, backLightMaterial);
    const backLightRight = new THREE.Mesh(backLightGeo, backLightMaterial);
    backLightLeft.position.set(-0.4, 0.35, 1.2);
    backLightRight.position.set(0.4, 0.35, 1.2);

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9
    });
    const wheels = [];

    for (const x of [-0.65, 0.65]) {
      for (const z of [-0.8, 0.8]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.18, 10),
          wheelMat
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.28, z);
        wheels.push(wheel);
        car.add(wheel);
      }
    }

    car.add(body, hood, roof, backLightLeft, backLightRight);

    const headlightL = new THREE.SpotLight(0xffffff, 2.2, 30, 0.4, 0.6, 1);
    headlightL.position.set(-0.42, 0.52, 1.2);
    headlightL.target.position.set(-0.42, 0.2, -12);
    car.add(headlightL, headlightL.target);

    const headlightR = new THREE.SpotLight(0xffffff, 2.2, 30, 0.4, 0.6, 1);
    headlightR.position.set(0.42, 0.52, 1.2);
    headlightR.target.position.set(0.42, 0.2, -12);
    car.add(headlightR, headlightR.target);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
      depthWrite: false
    });
    const beamGeo = new THREE.ConeGeometry(0.8, 4.5, 28, 1, true);

    const beamL = new THREE.Mesh(beamGeo, beamMat);
    beamL.rotation.x = Math.PI / 2;
    beamL.position.set(-0.42, 0.22, -1.05);
    car.add(beamL);

    const beamR = new THREE.Mesh(beamGeo, beamMat);
    beamR.rotation.x = Math.PI / 2;
    beamR.position.set(0.42, 0.22, -1.05);
    car.add(beamR);

    car.position.set(0, 0.1, 4);

    return { car, body, hood, roof, wheels, headlightL, headlightR, beamL, beamR };
  }

  function createCloud() {
    const cloud = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(Math.random() * 1.4 + 0.9, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95,
          roughness: 1
        })
      );
      puff.position.set(Math.random() * 3, Math.random() * 1.2, Math.random() * 1.2);
      cloud.add(puff);
    }
    cloud.position.set(-18 + Math.random() * 36, 16, -140);
    return cloud;
  }

  function createTree(side) {
    const sizeType = Math.random();
    let scale = 1;
    if (sizeType < 0.33) scale = 0.7;
    else if (sizeType < 0.66) scale = 1.0;
    else scale = 1.5;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14 * scale, 0.22 * scale, 1.6 * scale, 10),
      new THREE.MeshStandardMaterial({
        color: 0x6b4f2a,
        roughness: 0.9
      })
    );
    trunk.position.y = 0.8 * scale;

    const foliage = new THREE.Group();
    for (let i = 0; i < 2 + Math.floor(scale); i++) {
      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8 * scale, 0),
        new THREE.MeshStandardMaterial({
          color: 0x2e7d32,
          roughness: 0.7
        })
      );
      leaf.position.set(
        (Math.random() - 0.5) * 0.5 * scale,
        (1.5 + i * 0.35) * scale,
        (Math.random() - 0.5) * 0.5 * scale
      );
      foliage.add(leaf);
    }

    const tree = new THREE.Group();
    tree.add(trunk, foliage);

    const minGrassX = 6.2;
    const maxGrassX = 21.8;
    let treeX = (side < 0 ? -1 : 1) * (minGrassX + Math.random() * (maxGrassX - minGrassX));

    if (side < 0) {
      const blockedTrackCenters = [-12, -17];
      const blockedHalfWidth = 2.0;
      let attempts = 0;
      while (attempts < 10 && blockedTrackCenters.some(cx => Math.abs(treeX - cx) < blockedHalfWidth)) {
        treeX = -1 * (minGrassX + Math.random() * (maxGrassX - minGrassX));
        attempts++;
      }
    }

    tree.position.set(treeX + (Math.random() - 0.5) * 0.9, 0, -220);
    return tree;
  }

  window.IKAThreeFactories = {
    createPlayerCar,
    createCloud,
    createTree
  };
})();
