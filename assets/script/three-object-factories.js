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

  function createPlayerCar(type = "sports", color = 0x1e90ff) {
    const car = new THREE.Group();
    const paintMeshes = [];
    const wheels = [];
    const tintedWindowMaterial = new THREE.MeshStandardMaterial({
      color: 0x99c4ef,
      transparent: true,
      opacity: 0.84,
      roughness: 0.18,
      metalness: 0.28
    });
    const darkWindowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87b2d8,
      transparent: true,
      opacity: 0.78,
      roughness: 0.22,
      metalness: 0.24
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.92
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xb9c2ca,
      metalness: 0.65,
      roughness: 0.26
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x20252b,
      metalness: 0.45,
      roughness: 0.4
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xf7f9fb,
      metalness: 0.38,
      roughness: 0.35
    });

    function createPaintMesh(geometry, materialOptions = {}) {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color,
          metalness: 0.58,
          roughness: 0.28,
          ...materialOptions
        })
      );
      paintMeshes.push(mesh);
      return mesh;
    }

    function addWheel(x, y, z, radius, width) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, width, 14),
        wheelMat
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width + 0.02, 14),
        rimMat
      );
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      wheels.push(wheel);
      car.add(wheel);
      return wheel;
    }

    function addBackLights(width, y, z) {
      const backLightMaterial = new THREE.MeshBasicMaterial({
        color: 0xd62828,
        transparent: true,
        opacity: 0.92
      });
      const geo = new THREE.BoxGeometry(width, 0.14, 0.06);
      const left = new THREE.Mesh(geo, backLightMaterial);
      const right = new THREE.Mesh(geo, backLightMaterial);
      left.position.set(-0.42, y, z);
      right.position.set(0.42, y, z);
      car.add(left, right);
    }

    const builders = {
      sports() {
        const base = createPaintMesh(createRoundedBox(1.48, 0.42, 2.58, 0.12, 5), {
          metalness: 0.68,
          roughness: 0.2
        });
        base.position.y = 0.4;
        const fender = createPaintMesh(createRoundedBox(1.22, 0.22, 1.18, 0.08, 4), {
          metalness: 0.62,
          roughness: 0.24
        });
        fender.position.set(0, 0.58, 0.62);
        const cabin = new THREE.Mesh(
          createRoundedBox(1.02, 0.34, 1.02, 0.08, 4),
          tintedWindowMaterial
        );
        cabin.position.set(0, 0.82, -0.08);
        const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.24), trimMat);
        splitter.position.set(0, 0.14, -1.18);
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.24), trimMat);
        spoiler.position.set(0, 0.93, 1.08);
        car.add(base, fender, cabin, splitter, spoiler);
        addWheel(-0.67, 0.24, -0.84, 0.28, 0.2);
        addWheel(0.67, 0.24, -0.84, 0.28, 0.2);
        addWheel(-0.67, 0.24, 0.84, 0.28, 0.2);
        addWheel(0.67, 0.24, 0.84, 0.28, 0.2);
        addBackLights(0.24, 0.34, 1.28);
        return {
          body: base,
          hood: fender,
          roof: cabin,
          headlightX: 0.43,
          headlightY: 0.5,
          headlightZ: -1.18,
          beamX: 0.43,
          beamY: 0.22,
          beamZ: -1.08,
          beamRadius: 0.82,
          scale: 1
        };
      },
      bike() {
        const frameBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.05, 8), trimMat);
        frameBar.position.set(0, 0.64, 0.02);
        frameBar.rotation.x = Math.PI / 2;
        frameBar.rotation.z = 0.22;

        const lowerFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.88, 8), trimMat);
        lowerFrame.position.set(0, 0.46, 0.18);
        lowerFrame.rotation.x = Math.PI / 2;
        lowerFrame.rotation.z = -0.28;

        const tank = createPaintMesh(createRoundedBox(0.62, 0.34, 0.82, 0.08, 4), {
          metalness: 0.76,
          roughness: 0.16
        });
        tank.position.set(0, 0.84, -0.04);
        tank.rotation.x = -0.12;

        const frontFairing = createPaintMesh(createRoundedBox(0.56, 0.44, 0.54, 0.08, 4), {
          metalness: 0.72,
          roughness: 0.2
        });
        frontFairing.position.set(0, 0.92, -0.66);
        frontFairing.rotation.x = 0.18;

        const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.06), darkWindowMaterial);
        windshield.position.set(0, 1.16, -0.74);
        windshield.rotation.x = 0.48;

        const seat = new THREE.Mesh(createRoundedBox(0.38, 0.12, 0.64, 0.05, 3), trimMat);
        seat.position.set(0, 0.74, 0.42);
        seat.rotation.x = -0.08;

        const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.58), accentMat);
        seatBase.position.set(0, 0.64, 0.48);

        const tail = createPaintMesh(createRoundedBox(0.28, 0.18, 0.54, 0.05, 3), {
          metalness: 0.58,
          roughness: 0.24
        });
        tail.position.set(0, 0.82, 0.92);
        tail.rotation.x = -0.16;

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.08), accentMat);
        handle.position.set(0, 1.02, -0.56);
        const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10), trimMat);
        gripL.rotation.z = Math.PI / 2;
        gripL.position.set(-0.34, 1.02, -0.56);
        const gripR = gripL.clone();
        gripR.position.x = 0.34;

        const handGuardL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.18), accentMat);
        handGuardL.position.set(-0.4, 1.03, -0.58);
        handGuardL.rotation.z = -0.2;
        const handGuardR = handGuardL.clone();
        handGuardR.position.x = 0.4;
        handGuardR.rotation.z = 0.2;

        const mirrorStemL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6), trimMat);
        mirrorStemL.position.set(-0.24, 1.16, -0.66);
        mirrorStemL.rotation.z = -0.25;
        const mirrorStemR = mirrorStemL.clone();
        mirrorStemR.position.x = 0.24;
        mirrorStemR.rotation.z = 0.25;
        const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.03), darkWindowMaterial);
        mirrorL.position.set(-0.3, 1.26, -0.68);
        mirrorL.rotation.y = -0.25;
        const mirrorR = mirrorL.clone();
        mirrorR.position.x = 0.3;
        mirrorR.rotation.y = 0.25;

        const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.86, 8), accentMat);
        forkL.position.set(-0.12, 0.54, -0.78);
        forkL.rotation.z = 0.16;
        const forkR = forkL.clone();
        forkR.position.x = 0.12;

        const frontMudguard = createPaintMesh(createRoundedBox(0.24, 0.08, 0.42, 0.04, 3), {
          metalness: 0.68,
          roughness: 0.22
        });
        frontMudguard.position.set(0, 0.56, -1.02);
        frontMudguard.rotation.x = 0.08;

        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.56, 12), accentMat);
        exhaust.position.set(0.28, 0.48, 0.62);
        exhaust.rotation.x = Math.PI / 2;
        exhaust.rotation.z = 0.22;

        const engineBlock = new THREE.Mesh(createRoundedBox(0.34, 0.24, 0.42, 0.04, 3), trimMat);
        engineBlock.position.set(0, 0.5, 0.16);

        const sidePanelL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.46), accentMat);
        sidePanelL.position.set(-0.28, 0.66, 0.02);
        const sidePanelR = sidePanelL.clone();
        sidePanelR.position.x = 0.28;

        const roundHeadlight = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20),
          new THREE.MeshStandardMaterial({
            color: 0xf8f3d5,
            emissive: 0xffe39a,
            emissiveIntensity: 0.8,
            metalness: 0.35,
            roughness: 0.22
          })
        );
        roundHeadlight.rotation.x = Math.PI / 2;
        roundHeadlight.position.set(0, 0.94, -0.94);

        const tailSupport = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.24), trimMat);
        tailSupport.position.set(0, 0.72, 1.04);
        const rearLamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.1, 0.12),
          new THREE.MeshBasicMaterial({
            color: 0xd62828,
            transparent: true,
            opacity: 0.94
          })
        );
        rearLamp.position.set(0, 0.8, 1.16);

        car.add(
          frameBar,
          lowerFrame,
          tank,
          frontFairing,
          windshield,
          seat,
          seatBase,
          tail,
          handle,
          gripL,
          gripR,
          handGuardL,
          handGuardR,
          mirrorStemL,
          mirrorStemR,
          mirrorL,
          mirrorR,
          forkL,
          forkR,
          frontMudguard,
          exhaust,
          engineBlock,
          sidePanelL,
          sidePanelR,
          roundHeadlight,
          tailSupport,
          rearLamp
        );

        const frontWheel = addWheel(0, 0.3, -1.02, 0.36, 0.12);
        const rearWheel = addWheel(0, 0.3, 0.98, 0.34, 0.16);

        const discMat = new THREE.MeshStandardMaterial({
          color: 0xd5dbe2,
          metalness: 0.8,
          roughness: 0.22
        });
        const frontDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 18), discMat);
        frontDisc.rotation.z = Math.PI / 2;
        frontDisc.position.set(0, 0, 0.04);
        frontWheel.add(frontDisc);
        const rearDisc = frontDisc.clone();
        rearDisc.position.z = 0.05;
        rearWheel.add(rearDisc);

        return {
          body: frontFairing,
          hood: tank,
          roof: seat,
          headlightX: 0,
          headlightY: 0.94,
          headlightZ: -0.94,
          beamX: 0,
          beamY: 0.44,
          beamZ: -0.96,
          beamRadius: 0.8,
          headlightIntensity: 4.4,
          headlightDistance: 42,
          headlightAngle: 0.5,
          headlightPenumbra: 0.7,
          beamLength: 6.8,
          beamOpacity: 0.2,
          singleBeam: true,
          scale: 1.08
        };
      },
      truck() {
        const cab = createPaintMesh(createRoundedBox(1.28, 0.82, 1.18, 0.1, 4));
        cab.position.set(0, 0.66, -0.58);
        const cargo = createPaintMesh(createRoundedBox(1.6, 0.92, 1.6, 0.08, 3), {
          metalness: 0.38,
          roughness: 0.42
        });
        cargo.position.set(0, 0.74, 0.62);
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.42, 0.06), darkWindowMaterial);
        windshield.position.set(0, 0.84, -1.15);
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.18), trimMat);
        bumper.position.set(0, 0.22, -1.18);
        car.add(cab, cargo, windshield, bumper);
        addWheel(-0.62, 0.3, -0.88, 0.3, 0.18);
        addWheel(0.62, 0.3, -0.88, 0.3, 0.18);
        addWheel(-0.62, 0.3, 0.2, 0.3, 0.18);
        addWheel(0.62, 0.3, 0.2, 0.3, 0.18);
        addWheel(-0.62, 0.3, 1.02, 0.3, 0.18);
        addWheel(0.62, 0.3, 1.02, 0.3, 0.18);
        addBackLights(0.22, 0.46, 1.47);
        return {
          body: cargo,
          hood: cab,
          roof: windshield,
          headlightX: 0.42,
          headlightY: 0.54,
          headlightZ: -1.18,
          beamX: 0.42,
          beamY: 0.26,
          beamZ: -1.02,
          beamRadius: 0.8,
          scale: 0.98
        };
      },
      van() {
        const shell = createPaintMesh(createRoundedBox(1.46, 0.98, 2.6, 0.12, 5), {
          metalness: 0.5,
          roughness: 0.34
        });
        shell.position.set(0, 0.72, 0.04);
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.46, 0.06), darkWindowMaterial);
        windshield.position.set(0, 0.95, -1.18);
        const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.9), darkWindowMaterial);
        sideWindowL.position.set(-0.72, 0.88, -0.18);
        const sideWindowR = sideWindowL.clone();
        sideWindowR.position.x = 0.72;
        car.add(shell, windshield, sideWindowL, sideWindowR);
        addWheel(-0.68, 0.28, -0.9, 0.29, 0.18);
        addWheel(0.68, 0.28, -0.9, 0.29, 0.18);
        addWheel(-0.68, 0.28, 0.9, 0.29, 0.18);
        addWheel(0.68, 0.28, 0.9, 0.29, 0.18);
        addBackLights(0.22, 0.54, 1.34);
        return {
          body: shell,
          hood: shell,
          roof: windshield,
          headlightX: 0.45,
          headlightY: 0.54,
          headlightZ: -1.26,
          beamX: 0.45,
          beamY: 0.26,
          beamZ: -1.04,
          beamRadius: 0.84,
          scale: 1
        };
      },
      bus() {
        const shell = createPaintMesh(createRoundedBox(1.66, 1.08, 3.28, 0.1, 4), {
          metalness: 0.46,
          roughness: 0.38
        });
        shell.position.set(0, 0.86, 0.08);
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.54, 0.06), darkWindowMaterial);
        windshield.position.set(0, 1.02, -1.54);
        for (let i = -1; i <= 1; i++) {
          const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.54), darkWindowMaterial);
          sideWindowL.position.set(-0.84, 0.96, i * 0.72 + 0.18);
          const sideWindowR = sideWindowL.clone();
          sideWindowR.position.x = 0.84;
          car.add(sideWindowL, sideWindowR);
        }
        car.add(shell, windshield);
        addWheel(-0.76, 0.32, -1.16, 0.3, 0.18);
        addWheel(0.76, 0.32, -1.16, 0.3, 0.18);
        addWheel(-0.76, 0.32, 0.06, 0.3, 0.18);
        addWheel(0.76, 0.32, 0.06, 0.3, 0.18);
        addWheel(-0.76, 0.32, 1.22, 0.3, 0.18);
        addWheel(0.76, 0.32, 1.22, 0.3, 0.18);
        addBackLights(0.24, 0.62, 1.7);
        return {
          body: shell,
          hood: shell,
          roof: windshield,
          headlightX: 0.48,
          headlightY: 0.58,
          headlightZ: -1.54,
          beamX: 0.48,
          beamY: 0.28,
          beamZ: -1.28,
          beamRadius: 0.88,
          scale: 0.92
        };
      },
      auto() {
        const cabin = createPaintMesh(createRoundedBox(1.18, 0.72, 1.38, 0.1, 4), {
          metalness: 0.42,
          roughness: 0.36
        });
        cabin.position.set(0, 0.6, -0.08);
        const rear = createPaintMesh(createRoundedBox(1.08, 0.56, 0.9, 0.08, 3), {
          metalness: 0.44,
          roughness: 0.34
        });
        rear.position.set(0, 0.52, 0.72);
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.42, 1), darkWindowMaterial);
        canopy.position.set(0, 0.85, -0.18);
        const mudGuardL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 1.36), trimMat);
        mudGuardL.position.set(-0.58, 0.32, 0.06);
        const mudGuardR = mudGuardL.clone();
        mudGuardR.position.x = 0.58;
        car.add(cabin, rear, canopy, mudGuardL, mudGuardR);
        addWheel(-0.52, 0.24, -0.62, 0.26, 0.16);
        addWheel(0.52, 0.24, -0.62, 0.26, 0.16);
        addWheel(-0.52, 0.24, 0.82, 0.26, 0.16);
        addWheel(0.52, 0.24, 0.82, 0.26, 0.16);
        addBackLights(0.18, 0.42, 1.12);
        return {
          body: cabin,
          hood: rear,
          roof: canopy,
          headlightX: 0.34,
          headlightY: 0.48,
          headlightZ: -0.86,
          beamX: 0.34,
          beamY: 0.2,
          beamZ: -0.82,
          beamRadius: 0.68,
          scale: 1.03
        };
      }
    };

    const resolvedType = builders[type] ? type : "sports";
    const config = builders[resolvedType]();

    const headlightL = new THREE.SpotLight(
      0xffffff,
      config.headlightIntensity || 2.2,
      config.headlightDistance || 30,
      config.headlightAngle || 0.4,
      config.headlightPenumbra || 0.6,
      1
    );
    headlightL.position.set(-config.headlightX, config.headlightY, config.headlightZ);
    headlightL.target.position.set(-config.headlightX, 0.2, -12);
    car.add(headlightL, headlightL.target);

    const headlightR = new THREE.SpotLight(
      0xffffff,
      config.headlightIntensity || 2.2,
      config.headlightDistance || 30,
      config.headlightAngle || 0.4,
      config.headlightPenumbra || 0.6,
      1
    );
    headlightR.position.set(config.headlightX, config.headlightY, config.headlightZ);
    headlightR.target.position.set(config.headlightX, 0.2, -12);
    car.add(headlightR, headlightR.target);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: config.beamOpacity || 0.14,
      depthWrite: false
    });
    const beamGeo = new THREE.ConeGeometry(config.beamRadius || 0.8, config.beamLength || 4.5, 28, 1, true);
    const beamL = new THREE.Mesh(beamGeo, beamMat);
    beamL.rotation.x = Math.PI / 2;
    beamL.position.set(-config.beamX, config.beamY, config.beamZ);
    car.add(beamL);

    const beamR = config.singleBeam
      ? new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }))
      : new THREE.Mesh(beamGeo, beamMat.clone());
    if (!config.singleBeam) {
      beamR.rotation.x = Math.PI / 2;
      beamR.position.set(config.beamX, config.beamY, config.beamZ);
      car.add(beamR);
    }

    car.position.set(0, 0.1, 4);
    car.scale.setScalar(config.scale || 1);

    return {
      car,
      body: config.body,
      hood: config.hood,
      roof: config.roof,
      baseScale: config.scale || 1,
      paintMeshes,
      wheels,
      headlightL,
      headlightR,
      beamL,
      beamR,
      vehicleType: resolvedType
    };
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

  function getLandscapeX(side, minGrassX = 6.5, maxGrassX = 21.5) {
    let x = (side < 0 ? -1 : 1) * (minGrassX + Math.random() * (maxGrassX - minGrassX));
    if (side < 0) {
      const blockedTrackCenters = [-12, -17];
      const blockedHalfWidth = 2.1;
      let attempts = 0;
      while (attempts < 10 && blockedTrackCenters.some(cx => Math.abs(x - cx) < blockedHalfWidth)) {
        x = -1 * (minGrassX + Math.random() * (maxGrassX - minGrassX));
        attempts++;
      }
    }
    return x + (Math.random() - 0.5) * 0.9;
  }

  function createSunflower(side) {
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x4f8f31, roughness: 1 })
    );
    stem.position.y = 0.6;
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 })
    );
    center.position.y = 1.24;
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xf6c335, roughness: 0.7 });
    for (let i = 0; i < 8; i++) {
      const petal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.02), petalMat);
      const angle = (i / 8) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.16, 1.24 + Math.sin(angle) * 0.16, 0);
      petal.rotation.z = angle;
      flower.add(petal);
    }
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8b3d, roughness: 0.95, side: THREE.DoubleSide });
    const leafLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.14), leafMat);
    leafLeft.position.set(-0.12, 0.72, 0);
    leafLeft.rotation.z = -0.7;
    const leafRight = leafLeft.clone();
    leafRight.position.x = 0.12;
    leafRight.rotation.z = 0.7;
    flower.add(stem, center, leafLeft, leafRight);
    flower.position.set(getLandscapeX(side, 7, 18), 0, -220);
    flower.rotation.y = Math.random() * Math.PI * 2;
    return flower;
  }

  function createRoseBush(side) {
    const bush = new THREE.Group();
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x2f7a35, roughness: 1 })
    );
    mound.scale.set(1.25, 0.78, 1.1);
    mound.position.y = 0.38;
    bush.add(mound);

    const roseColors = [0xc62828, 0xd81b60, 0xff5a5f];
    for (let i = 0; i < 6; i++) {
      const rose = new THREE.Mesh(
        new THREE.SphereGeometry(0.11 + Math.random() * 0.03, 8, 8),
        new THREE.MeshStandardMaterial({
          color: roseColors[Math.floor(Math.random() * roseColors.length)],
          roughness: 0.7
        })
      );
      rose.position.set((Math.random() - 0.5) * 0.9, 0.54 + Math.random() * 0.28, (Math.random() - 0.5) * 0.7);
      bush.add(rose);
    }

    bush.position.set(getLandscapeX(side, 7, 18), 0, -220);
    bush.rotation.y = Math.random() * Math.PI * 2;
    return bush;
  }

  function createCoconutTree(side) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.19, 4.8, 10),
      new THREE.MeshStandardMaterial({ color: 0x7a5a39, roughness: 0.95 })
    );
    trunk.position.y = 2.3;
    trunk.rotation.z = side < 0 ? 0.08 : -0.08;
    tree.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2f8f46,
      roughness: 0.85,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < 6; i++) {
      const frond = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.34), leafMat);
      frond.position.set(0, 4.8, 0);
      frond.rotation.x = -Math.PI / 2.5;
      frond.rotation.z = (i / 6) * Math.PI * 2;
      frond.rotation.y = ((i % 2) * 0.2) - 0.1;
      tree.add(frond);
    }

    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1 });
    for (let i = 0; i < 3; i++) {
      const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), coconutMat);
      coconut.position.set((Math.random() - 0.5) * 0.3, 4.45 + Math.random() * 0.25, (Math.random() - 0.5) * 0.3);
      tree.add(coconut);
    }

    tree.position.set(getLandscapeX(side, 8, 20), 0, -235);
    tree.rotation.y = Math.random() * Math.PI * 2;
    return tree;
  }

  window.IKAThreeFactories = {
    createPlayerCar,
    createCloud,
    createTree,
    createSunflower,
    createRoseBush,
    createCoconutTree
  };
})();
