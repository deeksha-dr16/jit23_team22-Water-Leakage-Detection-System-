import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { ref, onValue, set } from "firebase/database";
import { db, auth } from "../../firebase/firebase";
import { Droplet, Power, AlertTriangle, Wifi, Gauge } from "lucide-react";

const COLORS = {
  flow: 0x00f0ff,
  flowGlow: 0x38bdf8,
  pipe: 0x3b5f7e,        // Vibrant metallic blue-grey pipe
  pipeGlow: 0x0f2942,    // Subtle pipe accent glow
  tank: 0x1e293b,
  tankLiquid: 0x0284c7,
  valveOpen: 0x06b6d4,   // Cyan
  valveClosed: 0xef4444, // Red
  leak: 0xf59e0b,        // Amber
};

// Builds a cylinder pipe mesh stretched + rotated to connect two points
function makePipe(p1, p2, radius, material) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const length = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, length, 16);
  const mesh = new THREE.Mesh(geo, material);
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return mesh;
}

// Creates crisp 3D text label sprite
function makeLabelSprite(text, color = "#38BDF8") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.font = "bold 34px 'Inter', monospace, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.6, 0.9, 1);
  return sprite;
}

export default function App() {
  const mountRef = useRef(null);
  const sceneObjs = useRef({});
  const [connected, setConnected] = useState(false);
  const [mainFlow, setMainFlow] = useState(0);
  const [mainTotalLitres, setMainTotalLitres] = useState(0);
  const [mainStatus, setMainStatus] = useState("");
  const [road1, setRoad1] = useState({ flowRate: 0, valveOpen: true, leakDetected: false, totalLitres: 0 });
  const [road2, setRoad2] = useState({ flowRate: 0, valveOpen: true, leakDetected: false, totalLitres: 0 });
  const [pumpOn, setPumpOn] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(false);

  const road1Ref = useRef(road1);
  const road2Ref = useRef(road2);
  const pumpOnRef = useRef(pumpOn);
  const mainFlowRef = useRef(mainFlow);

  useEffect(() => { road1Ref.current = road1; }, [road1]);
  useEffect(() => { road2Ref.current = road2; }, [road2]);
  useEffect(() => { pumpOnRef.current = pumpOn; }, [pumpOn]);
  useEffect(() => { mainFlowRef.current = mainFlow; }, [mainFlow]);

  // ---- Sign in, then listen to live Firebase data ----
  useEffect(() => {
    setConnected(!!auth.currentUser);
    const rootRef = ref(db, "WaterShield");
    const unsub = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setMainFlow(data.MainFlow?.FlowRate || 0);
      setMainTotalLitres(data.MainFlow?.TotalLitres || 0);
      setMainStatus(data.MainFlow?.Status || "");

      if (data.Road1) setRoad1({
        flowRate: data.Road1.FlowRate || 0,
        valveOpen: data.Road1.ValveStatus === "OPEN",
        leakDetected: data.Road1.LeakStatus !== "OK",
        totalLitres: data.Road1.TotalLitres || 0,
      });

      if (data.Road2) setRoad2({
        flowRate: data.Road2.FlowRate || 0,
        valveOpen: data.Road2.ValveStatus === "OPEN",
        leakDetected: data.Road2.LeakStatus !== "OK",
        totalLitres: data.Road2.TotalLitres || 0,
      });

      setPumpOn(data.System?.Pump === "ON");
      setDeviceOnline(data.System?.DeviceStatus === "ONLINE");
    });

    return () => unsub();
  }, []);

  function toggleValve(road) {
    const current = road === "road1" ? road1Ref.current : road2Ref.current;
    const newStatus = current.valveOpen ? "CLOSED" : "OPEN";
    const roadKey = road === "road1" ? "Road1" : "Road2";
    set(ref(db, `WaterShield/${roadKey}/ValveStatus`), newStatus);
  }

  function togglePump() {
    const newStatus = pumpOn ? "OFF" : "ON";
    set(ref(db, "WaterShield/System/Pump"), newStatus);
  }

  // ---------------- THREE.JS SCENE ----------------
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth, height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080d14);
    scene.fog = new THREE.FogExp2(0x080d14, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 6.5, 11.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ---- Enhanced Lighting ----
    scene.add(new THREE.AmbientLight(0x64748b, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(6, 10, 6);
    scene.add(key);
    
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const rim = new THREE.PointLight(COLORS.flow, 1.8, 30);
    rim.position.set(0, 4, -2);
    scene.add(rim);

    // ---- Vibrant Grid ----
    const grid = new THREE.GridHelper(24, 48, 0x334155, 0x1e293b);
    grid.position.y = -2.2;
    scene.add(grid);

    const root = new THREE.Group();
    scene.add(root);

    // ---- Pipe Material with Metallic & Emissive Glow ----
    const pipeMat = new THREE.MeshStandardMaterial({ 
      color: COLORS.pipe, 
      metalness: 0.85, 
      roughness: 0.25,
      emissive: COLORS.pipeGlow,
      emissiveIntensity: 0.5 
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.2
    });

    // ---- Key layout points ----
    const P = {
      tank: new THREE.Vector3(0, 4.2, -5),
      pump: new THREE.Vector3(0, 2.6, -5),
      mainSensor: new THREE.Vector3(0, 1.3, -5),
      tConnector: new THREE.Vector3(0, 0, -2.6),
      road1Valve: new THREE.Vector3(-3.2, 0, -0.4),
      road1Sensor: new THREE.Vector3(-4.6, 0, 1.6),
      road1Outlet: new THREE.Vector3(-5.6, 0, 3.4),
      road2Valve: new THREE.Vector3(3.2, 0, -0.4),
      road2Sensor: new THREE.Vector3(4.6, 0, 1.6),
      road2Outlet: new THREE.Vector3(5.6, 0, 3.4),
    };

    // ---- Main Tank ----
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 2.0, 24),
      new THREE.MeshStandardMaterial({ color: COLORS.tank, metalness: 0.4, roughness: 0.4, transparent: true, opacity: 0.9 })
    );
    tank.position.copy(P.tank);
    root.add(tank);
    const tankLabel = makeLabelSprite("MAIN TANK", "#0284C7");
    tankLabel.position.set(P.tank.x, P.tank.y + 1.5, P.tank.z);
    root.add(tankLabel);

    // ---- Pump ----
    const pump = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.75, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 })
    );
    pump.position.copy(P.pump);
    root.add(pump);
    root.add(makePipe(P.tank, P.pump, 0.20, pipeMat));

    // ---- Main flow sensor ----
    const mainSensorBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.65, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
    );
    mainSensorBox.position.copy(P.mainSensor);
    root.add(mainSensorBox);
    root.add(makePipe(P.pump, P.mainSensor, 0.20, pipeMat));

    // ---- Main pipe to T-connector ----
    root.add(makePipe(P.mainSensor, P.tConnector, 0.20, pipeMat));
    const tJoint = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), jointMat);
    tJoint.position.copy(P.tConnector);
    root.add(tJoint);

    // ---- Main Line Water Particles ----
    const mainParticles = [];
    const mainPath = [P.pump, P.mainSensor, P.tConnector];
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(0.08, 10, 10);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.flow,
        emissive: COLORS.flowGlow,
        emissiveIntensity: 2.2,
        transparent: true,
        opacity: 0.95,
      });
      const p = new THREE.Mesh(geo, mat);
      p.visible = false;
      root.add(p);
      mainParticles.push({ mesh: p, t: i / 12 });
    }

    // ---- Build Road Branch ----
    function buildRoad(prefix, valvePos, sensorPos, outletPos) {
      root.add(makePipe(P.tConnector, valvePos, 0.17, pipeMat));

      const valveBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 0.65, 20),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 })
      );
      valveBody.position.copy(valvePos);
      valveBody.lookAt(sensorPos);
      valveBody.rotateX(Math.PI / 2);
      root.add(valveBody);

      const statusRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.04, 12, 32),
        new THREE.MeshStandardMaterial({ color: COLORS.valveOpen, emissive: COLORS.valveOpen, emissiveIntensity: 1.2 })
      );
      statusRing.position.copy(valvePos);
      statusRing.lookAt(sensorPos);
      root.add(statusRing);

      root.add(makePipe(valvePos, sensorPos, 0.17, pipeMat));

      const sensorBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.45, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      sensorBox.position.copy(sensorPos);
      root.add(sensorBox);

      root.add(makePipe(sensorPos, outletPos, 0.17, pipeMat));

      const outlet = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.45, 16),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
      );
      outlet.position.copy(outletPos);
      outlet.rotation.x = Math.PI;
      root.add(outlet);

      // Flow particles along the road path
      const particles = [];
      const pathPoints = [P.tConnector, valvePos, sensorPos, outletPos];
      for (let i = 0; i < 14; i++) {
        const geo = new THREE.SphereGeometry(0.075, 10, 10);
        const mat = new THREE.MeshStandardMaterial({
          color: COLORS.flow,
          emissive: COLORS.flowGlow,
          emissiveIntensity: 2.2,
          transparent: true,
          opacity: 0.95,
        });
        const p = new THREE.Mesh(geo, mat);
        p.visible = false;
        root.add(p);
        particles.push({ mesh: p, t: i / 14 });
      }

      // Leak drip particles
      const drips = [];
      for (let i = 0; i < 6; i++) {
        const d = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 8, 8),
          new THREE.MeshStandardMaterial({ color: COLORS.leak, emissive: COLORS.leak, emissiveIntensity: 1.5 })
        );
        d.position.set(valvePos.x, valvePos.y - 0.3, valvePos.z);
        d.visible = false;
        root.add(d);
        drips.push({ mesh: d, y: valvePos.y - 0.3, baseY: valvePos.y - 0.3, speed: 0.012 + Math.random() * 0.015 });
      }

      return { statusRing, particles, pathPoints, drips, valvePos };
    }

    const roadObjs = {
      road1: buildRoad("road1", P.road1Valve, P.road1Sensor, P.road1Outlet),
      road2: buildRoad("road2", P.road2Valve, P.road2Sensor, P.road2Outlet),
    };
    sceneObjs.current.roadObjs = roadObjs;

    // ---- Rotation drag ----
    let isDragging = false, prevX = 0, rotY = 0.3;
    root.rotation.y = rotY;
    const onDown = (e) => { isDragging = true; prevX = e.clientX ?? e.touches?.[0]?.clientX; };
    const onMove = (e) => {
      if (!isDragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      rotY += (x - prevX) * 0.006;
      prevX = x;
    };
    const onUp = () => { isDragging = false; };
    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("touchstart", onDown);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);

    // ---- Animation Loop ----
    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (!isDragging) rotY += delta * 0.04;
      root.rotation.y = rotY;

      const isPumpOn = pumpOnRef.current;
      const r1State = road1Ref.current;
      const r2State = road2Ref.current;
      const mFlow = mainFlowRef.current;

      // Main flow is active when pump is ON and at least one branch is open or has flow
      const mainFlowActive = isPumpOn && (r1State.valveOpen || r2State.valveOpen || mFlow > 0);

      // Animate Main Pipe Flow Particles
      mainParticles.forEach((p) => {
        p.mesh.visible = mainFlowActive;
        if (mainFlowActive) {
          p.t += delta * 0.25;
          if (p.t > 1) p.t -= 1;
          const segT = p.t * (mainPath.length - 1);
          const idx = Math.min(Math.floor(segT), mainPath.length - 2);
          const localT = segT - idx;
          p.mesh.position.lerpVectors(mainPath[idx], mainPath[idx + 1], localT);
        }
      });

      // Animate Road Branch Particles
      ["road1", "road2"].forEach((key) => {
        const state = key === "road1" ? r1State : r2State;
        const obj = roadObjs[key];
        const open = state.valveOpen;
        const leaking = state.leakDetected;

        // Water flows ONLY when pump is ON and valve is OPEN
        const roadFlowActive = isPumpOn && open;

        const color = open ? COLORS.valveOpen : COLORS.valveClosed;
        obj.statusRing.material.color.setHex(color);
        obj.statusRing.material.emissive.setHex(color);

        obj.particles.forEach((p) => {
          p.mesh.visible = roadFlowActive;
          if (roadFlowActive) {
            p.t += delta * 0.22;
            if (p.t > 1) p.t -= 1;
            const pts = obj.pathPoints;
            const segT = p.t * (pts.length - 1);
            const idx = Math.min(Math.floor(segT), pts.length - 2);
            const localT = segT - idx;
            p.mesh.position.lerpVectors(pts[idx], pts[idx + 1], localT);
          }
        });

        obj.drips.forEach((d) => {
          const isDripping = leaking && (isPumpOn || open);
          d.mesh.visible = isDripping;
          if (isDripping) {
            d.y -= d.speed;
            if (d.y < d.baseY - 1.4) d.y = d.baseY;
            d.mesh.position.y = d.y;
          }
        });
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>DIGITAL TWIN — LIVE SYSTEM</div>
          <h1 style={styles.title}>WaterShield — Two-Road Layout</h1>
        </div>
        <div style={styles.connStatus}>
          <Wifi size={16} color={connected ? "#22D3EE" : "#94A3B8"} />
          <span style={{ color: connected ? "#22D3EE" : "#94A3B8" }}>
            {connected ? "CONNECTED" : "CONNECTING..."}
          </span>
        </div>
      </div>

      <div style={styles.body}>
        <div ref={mountRef} style={styles.canvasMount} />

        <div style={styles.sidebar}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}><Gauge size={15} /> MAIN FLOW</div>
            <div style={styles.metricValue}>{mainFlow.toFixed(1)} <span style={styles.unit}>L/min</span></div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6, marginBottom: 12, fontWeight: 500 }}>
              Total: <strong style={{ color: "#E2E8F0" }}>{mainTotalLitres.toFixed(2)} L</strong> · {mainStatus}
            </div>
            <button
              style={{
                ...styles.button,
                background: pumpOn ? "#EF4444" : "#0284C7",
                color: "#FFFFFF",
              }}
              onClick={togglePump}
            >
              <Power size={15} />
              PUMP: {pumpOn ? "ON — TURN OFF" : "OFF — TURN ON"}
            </button>
          </div>

          {[{ key: "road1", state: road1, label: "ROAD 1" }, { key: "road2", state: road2, label: "ROAD 2" }].map(
            ({ key, state, label }) => (
              <div key={key} style={styles.roadCard}>
                <div style={styles.roadTitle}>{label}</div>
                {state.leakDetected && (
                  <div style={styles.leakBanner}>
                    <AlertTriangle size={15} color="#F59E0B" /> Leak Detected
                  </div>
                )}
                <div style={styles.roadRow}>
                  <Droplet size={16} color="#38BDF8" />
                  <span>{state.flowRate.toFixed(1)} L/min</span>
                </div>
                <div style={styles.roadRow}>
                  <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 500 }}>Total Litres:</span>
                  <span style={{ color: "#F8FAFC" }}>{state.totalLitres.toFixed(2)} L</span>
                </div>
                <button
                  style={{
                    ...styles.button,
                    background: state.valveOpen ? "#EF4444" : "#0284C7",
                    color: "#FFFFFF",
                  }}
                  onClick={() => toggleValve(key)}
                >
                  <Power size={15} />
                  VALVE: {state.valveOpen ? "CLOSE" : "OPEN"}
                </button>
              </div>
            )
          )}

          <p style={styles.hint}>Drag to rotate 3D view. Live updates from Firebase Realtime Database.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { 
    width: "100%", 
    minHeight: 680, 
    background: "#080D14", 
    borderRadius: 12, 
    overflow: "hidden", 
    fontFamily: "'Inter', system-ui, sans-serif", 
    color: "#F8FAFC", 
    display: "flex", 
    flexDirection: "column" 
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "18px 24px", 
    borderBottom: "1px solid #1E293B",
    background: "#0F172A"
  },
  eyebrow: { 
    fontSize: 12, 
    letterSpacing: "0.14em", 
    color: "#38BDF8", 
    fontFamily: "monospace", 
    fontWeight: "600" 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 700, 
    margin: "4px 0 0 0",
    color: "#F8FAFC" 
  },
  connStatus: { 
    display: "flex", 
    alignItems: "center", 
    gap: 8, 
    fontSize: 13, 
    fontFamily: "monospace", 
    fontWeight: 600 
  },
  body: { 
    display: "flex", 
    flex: 1, 
    minHeight: 580 
  },
  canvasMount: { 
    flex: 1, 
    minWidth: 0, 
    cursor: "grab" 
  },
  sidebar: { 
    width: 290, 
    padding: 20, 
    display: "flex", 
    flexDirection: "column", 
    gap: 16, 
    borderLeft: "1px solid #1E293B", 
    background: "#0F172A" 
  },
  metricCard: { 
    background: "#1E293B", 
    border: "1px solid #334155", 
    borderRadius: 10, 
    padding: "14px 16px" 
  },
  metricLabel: { 
    fontSize: 12, 
    letterSpacing: "0.1em", 
    color: "#94A3B8", 
    display: "flex", 
    alignItems: "center", 
    gap: 6, 
    marginBottom: 6, 
    fontFamily: "monospace", 
    fontWeight: 600 
  },
  metricValue: { 
    fontSize: 28, 
    fontWeight: 700, 
    fontFamily: "monospace",
    color: "#38BDF8"
  },
  unit: { 
    fontSize: 14, 
    color: "#94A3B8", 
    fontWeight: 400 
  },
  roadCard: { 
    background: "#1E293B", 
    border: "1px solid #334155", 
    borderRadius: 10, 
    padding: "14px 16px", 
    display: "flex", 
    flexDirection: "column", 
    gap: 10 
  },
  roadTitle: { 
    fontSize: 13, 
    letterSpacing: "0.08em", 
    color: "#94A3B8", 
    fontFamily: "monospace",
    fontWeight: 700 
  },
  roadRow: { 
    display: "flex", 
    alignItems: "center", 
    gap: 8, 
    fontSize: 15, 
    fontFamily: "monospace",
    fontWeight: 600 
  },
  leakBanner: { 
    display: "flex", 
    alignItems: "center", 
    gap: 6, 
    fontSize: 12, 
    color: "#F59E0B", 
    fontWeight: 600,
    background: "rgba(245, 158, 11, 0.12)",
    padding: "4px 8px",
    borderRadius: 4
  },
  button: { 
    border: "none", 
    borderRadius: 8, 
    padding: "10px 14px", 
    fontSize: 13, 
    fontWeight: 700, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    cursor: "pointer",
    letterSpacing: "0.03em",
    transition: "background 0.2s ease"
  },
  hint: { 
    fontSize: 12, 
    color: "#64748B", 
    lineHeight: 1.6, 
    marginTop: "auto" 
  },
};