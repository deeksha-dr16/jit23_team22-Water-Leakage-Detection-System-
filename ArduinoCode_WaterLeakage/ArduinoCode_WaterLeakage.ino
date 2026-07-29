/* =========================================================
 *          WaterShield - Smart Leak Detection System
 *          ESP32 + 3 Flow Sensors + 2 Relays + Firebase RTDB
 *          VTU Major Project
 * =========================================================
 *
 * Architecture:
 *   - Main flow sensor measures total incoming flow
 *   - Road1 / Road2 flow sensors measure branch flow
 *   - Difference/threshold logic detects leaks per branch
 *   - Relays auto-close the leaking branch's valve
 *   - Firebase RTDB used for live monitoring + manual override
 *
 * Firebase RTDB structure:
 *   WaterShield/
 *     MainFlow/  { FlowRate, TotalLitres, Status }
 *     Road1/     { FlowRate, ValveStatus, LeakStatus, TotalLitres }
 *     Road2/     { FlowRate, ValveStatus, LeakStatus, TotalLitres }
 *     System/    { Pump, WiFi, Timestamp, DeviceStatus }
 * ========================================================= */

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ---------------- WiFi Credentials ----------------
#define WIFI_SSID "Airtel_savi_7995"
#define WIFI_PASSWORD "air82635"

// ---------------- Firebase Credentials ----------------
#define API_KEY "Enter_ your_ details"
#define DATABASE_URL  "Enter_ your_ details"

// ---------------- Firebase Objects ----------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ---------------- Pin Definitions ----------------
#define MAIN_FLOW_SENSOR  34
#define ROAD1_FLOW_SENSOR 35
#define ROAD2_FLOW_SENSOR 32
#define RELAY_ROAD1       26
#define RELAY_ROAD2       27

// ---------------- Pulse Counters (ISR variables) ----------------
volatile int pulseMain  = 0;
volatile int pulseRoad1 = 0;
volatile int pulseRoad2 = 0;

// ---------------- Flow Rate Variables (L/min) ----------------
float mainFlowRate  = 0;
float road1FlowRate = 0;
float road2FlowRate = 0;

// ---------------- Total Consumption (Litres) ----------------
float totalMainLitres  = 0;
float totalRoad1Litres = 0;
float totalRoad2Litres = 0;

// ---------------- Leak & Valve Status ----------------
bool leakRoad1  = false;
bool leakRoad2  = false;
bool systemLeak = false;
bool valveRoad1 = true;   // true = OPEN, false = CLOSED
bool valveRoad2 = true;
float leakPercentThreshold = 0.15;   // 15% mismatch tolerance
int leakConfirmCount = 3;             // must persist 3 cycles before flagging
int road1LeakCounter = 0;
int road2LeakCounter = 0;
int systemLeakCounter = 0;

// ---------------- Manual Override Flags ----------------
bool manualOverrideRoad1 = false;
bool manualOverrideRoad2 = false;

// ---------------- Timing ----------------
unsigned long previousMillis = 0;
const long interval = 1000;   // 1 second calculation/upload cycle

// ---------------- Calibration ----------------
float calibrationFactor = 7.5;   // pulses per litre (YF-S201 type sensors)


// ---------------- WiFi Reconnect Tracking ----------------
unsigned long lastWiFiCheck = 0;
const long wifiCheckInterval = 5000;

// ---------------- Function Prototypes ----------------
void IRAM_ATTR mainFlowCounter();
void IRAM_ATTR road1FlowCounter();
void IRAM_ATTR road2FlowCounter();
void calculateFlow();
void checkLeakage();
void openRoad1();
void closeRoad1();
void openRoad2();
void closeRoad2();
void uploadFirebase();
void checkManualOverride();
void printFlowData();
void connectWiFi();
void checkWiFiConnection();
void firebaseInit();


// =========================================================
//                  INTERRUPT SERVICE ROUTINES
// =========================================================

void IRAM_ATTR mainFlowCounter()
{
  pulseMain++;
}

void IRAM_ATTR road1FlowCounter()
{
  pulseRoad1++;
}

void IRAM_ATTR road2FlowCounter()
{
  pulseRoad2++;
}


// =========================================================
//                  FLOW RATE CALCULATION
// =========================================================

void calculateFlow()
{
  noInterrupts();
  int pulseMainCopy  = pulseMain;
  int pulseRoad1Copy = pulseRoad1;
  int pulseRoad2Copy = pulseRoad2;
  pulseMain  = 0;
  pulseRoad1 = 0;
  pulseRoad2 = 0;
  interrupts();

  mainFlowRate  = (float)pulseMainCopy  / calibrationFactor;
  road1FlowRate = (float)pulseRoad1Copy / calibrationFactor;
  road2FlowRate = (float)pulseRoad2Copy / calibrationFactor;

  // Noise filtering
  if (mainFlowRate  < 0.05) mainFlowRate  = 0;
  if (road1FlowRate < 0.05) road1FlowRate = 0;
  if (road2FlowRate < 0.05) road2FlowRate = 0;

  totalMainLitres  += mainFlowRate  / 60.0;
  totalRoad1Litres += road1FlowRate / 60.0;
  totalRoad2Litres += road2FlowRate / 60.0;
}


// =========================================================
//                  DEBUG / TESTING OUTPUT
// =========================================================

void printFlowData()
{
  Serial.println("--------------------------------------------------");
  Serial.print("Main  Flow : "); Serial.print(mainFlowRate, 2);  Serial.println(" L/min");
  Serial.print("Road1 Flow : "); Serial.print(road1FlowRate, 2); Serial.println(" L/min");
  Serial.print("Road2 Flow : "); Serial.print(road2FlowRate, 2); Serial.println(" L/min");
  Serial.println();
  Serial.print("Total Main  : "); Serial.print(totalMainLitres, 3);  Serial.println(" L");
  Serial.print("Total Road1 : "); Serial.print(totalRoad1Litres, 3); Serial.println(" L");
  Serial.print("Total Road2 : "); Serial.print(totalRoad2Litres, 3); Serial.println(" L");
  Serial.print("Leak Road1  : "); Serial.println(leakRoad1 ? "YES" : "no");
  Serial.print("Leak Road2  : "); Serial.println(leakRoad2 ? "YES" : "no");
  Serial.print("System Leak : "); Serial.println(systemLeak ? "YES" : "no");
  Serial.println("--------------------------------------------------");
}


// =========================================================
//                  RELAY / VALVE CONTROL
// =========================================================
// Active-LOW relay assumption: LOW = valve OPEN, HIGH = valve CLOSED.
// Swap LOW/HIGH below if your relay board is active-HIGH.

void openRoad1()
{
  digitalWrite(RELAY_ROAD1, LOW);
  valveRoad1 = true;
  Serial.println("Road1 Valve -> OPEN");
}

void closeRoad1()
{
  digitalWrite(RELAY_ROAD1, HIGH);
  valveRoad1 = false;
  Serial.println("Road1 Valve -> CLOSED");
}

void openRoad2()
{
  digitalWrite(RELAY_ROAD2, LOW);
  valveRoad2 = true;
  Serial.println("Road2 Valve -> OPEN");
}

void closeRoad2()
{
  digitalWrite(RELAY_ROAD2, HIGH);
  valveRoad2 = false;
  Serial.println("Road2 Valve -> CLOSED");
}


// =========================================================
//            THRESHOLD-BASED LEAK DETECTION
//            + AUTOMATIC VALVE CONTROL
// =========================================================

void checkLeakage()
{
  float expectedFlow = road1FlowRate + road2FlowRate;
  float difference    = mainFlowRate - expectedFlow;

  bool road1Suspect  = false;
  bool road2Suspect  = false;
  bool systemSuspect = false;

  // Percentage-based system check (only evaluated when there's real flow)
  if (mainFlowRate > 1.0)
  {
    float percentDiff = abs(difference) / mainFlowRate;
    if (percentDiff > leakPercentThreshold) systemSuspect = true;

    float roadDiff = road1FlowRate - road2FlowRate;
    float avgRoad = (road1FlowRate + road2FlowRate) / 2.0;
    if (avgRoad > 0.5)
    {
      float roadPercentDiff = roadDiff / avgRoad;
      if (roadPercentDiff > leakPercentThreshold) road1Suspect = true;
      else if (-roadPercentDiff > leakPercentThreshold) road2Suspect = true;
    }
  }

  // Closed-valve sanity check (unchanged, still instant — this one SHOULD be immediate)
  if (!valveRoad1 && road1FlowRate > 0.3) road1Suspect = true;
  if (!valveRoad2 && road2FlowRate > 0.3) road2Suspect = true;

  // Debounce counters
  road1LeakCounter  = road1Suspect  ? road1LeakCounter + 1  : 0;
  road2LeakCounter  = road2Suspect  ? road2LeakCounter + 1  : 0;
  systemLeakCounter = systemSuspect ? systemLeakCounter + 1 : 0;

  leakRoad1  = (road1LeakCounter  >= leakConfirmCount);
  leakRoad2  = (road2LeakCounter  >= leakConfirmCount);
  systemLeak = (systemLeakCounter >= leakConfirmCount);

  // Automatic valve control (unchanged)
  if (leakRoad1 && valveRoad1) closeRoad1();
  else if (!leakRoad1 && !valveRoad1 && !manualOverrideRoad1) openRoad1();

  if (leakRoad2 && valveRoad2) closeRoad2();
  else if (!leakRoad2 && !valveRoad2 && !manualOverrideRoad2) openRoad2();
}

// =========================================================
//                  WIFI CONNECT / RECONNECT
// =========================================================

void connectWiFi()
{
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40)
  {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println();
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.println();
    Serial.println("WiFi connection FAILED (will retry in loop).");
  }
}

void checkWiFiConnection()
{
  if (millis() - lastWiFiCheck >= wifiCheckInterval)
  {
    lastWiFiCheck = millis();
    if (WiFi.status() != WL_CONNECTED)
    {
      Serial.println("WiFi lost. Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
}


// =========================================================
//                  FIREBASE INITIALIZATION
// =========================================================

void firebaseInit()
{
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  // ---- Anonymous sign-in (required even for "open" rules) ----
  if (Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.println("Firebase anonymous sign-up successful.");
  }
  else
  {
    Serial.print("Firebase sign-up FAILED: ");
    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.print("Waiting for Firebase");
  unsigned long startWait = millis();
  while (!Firebase.ready() && (millis() - startWait < 10000))
  {
    Serial.print(".");
    delay(200);
  }

  if (Firebase.ready())
  {
    Serial.println("\nFirebase is ready.");
  }
  else
  {
    Serial.println("\nFirebase NOT ready after timeout — will keep retrying in loop().");
  }
}

// =========================================================
//                  FIREBASE STATUS UPLOAD
// =========================================================

void uploadFirebase()
{
  
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Upload skipped: WiFi not connected.");
    return;
  }
  Serial.print("WiFi status: "); Serial.println(WiFi.status());
  Serial.print("Firebase.ready(): "); Serial.println(Firebase.ready());
  if (!Firebase.ready())
  {
    Serial.println("Upload skipped: Firebase not ready.");
    return;
  }

  FirebaseJson json;

  json.set("MainFlow/FlowRate", mainFlowRate);
  json.set("MainFlow/TotalLitres", totalMainLitres);
  json.set("MainFlow/Status", systemLeak ? "LEAK DETECTED" : "NORMAL");

  json.set("Road1/FlowRate", road1FlowRate);
  json.set("Road1/TotalLitres", totalRoad1Litres);
  json.set("Road1/ValveStatus", valveRoad1 ? "OPEN" : "CLOSED");
  json.set("Road1/LeakStatus", leakRoad1 ? "LEAK" : "OK");

  json.set("Road2/FlowRate", road2FlowRate);
  json.set("Road2/TotalLitres", totalRoad2Litres);
  json.set("Road2/ValveStatus", valveRoad2 ? "OPEN" : "CLOSED");
  json.set("Road2/LeakStatus", leakRoad2 ? "LEAK" : "OK");

  json.set("System/Pump", "ON");
  json.set("System/WiFi", WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
  json.set("System/Timestamp", (double)millis());
  json.set("System/DeviceStatus", "ONLINE");

  if (Firebase.RTDB.updateNode(&fbdo, "/WaterShield", &json))
  {
    Serial.println("Firebase upload successful.");
  }
  else
  {
    Serial.print("Firebase upload FAILED: ");
    Serial.println(fbdo.errorReason());
  }
}


// =========================================================
//            MANUAL VALVE OVERRIDE (from Firebase)
// =========================================================

void checkManualOverride()
{
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) return;

  // ---- Road1 override ----
  if (Firebase.RTDB.getString(&fbdo, "/WaterShield/Road1/ValveStatus"))
  {
    String cmd = fbdo.stringData();
    if (cmd == "CLOSED" && valveRoad1)
    {
      closeRoad1();
      manualOverrideRoad1 = true;
    }
    else if (cmd == "OPEN" && !valveRoad1 && !leakRoad1)
    {
      openRoad1();
      manualOverrideRoad1 = false;
    }
  }
  else
  {
    Serial.print("Road1 override read failed: ");
    Serial.println(fbdo.errorReason());
  }

  // ---- Road2 override ----
  if (Firebase.RTDB.getString(&fbdo, "/WaterShield/Road2/ValveStatus"))
  {
    String cmd = fbdo.stringData();
    if (cmd == "CLOSED" && valveRoad2)
    {
      closeRoad2();
      manualOverrideRoad2 = true;
    }
    else if (cmd == "OPEN" && !valveRoad2 && !leakRoad2)
    {
      openRoad2();
      manualOverrideRoad2 = false;
    }
  }
  else
  {
    Serial.print("Road2 override read failed: ");
    Serial.println(fbdo.errorReason());
  }
}


// =========================================================
//                       setup()
// =========================================================

void setup()
{
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== WaterShield Leak Detection System ===");

  pinMode(MAIN_FLOW_SENSOR, INPUT_PULLUP);
  pinMode(ROAD1_FLOW_SENSOR, INPUT_PULLUP);
  pinMode(ROAD2_FLOW_SENSOR, INPUT_PULLUP);

  pinMode(RELAY_ROAD1, OUTPUT);
  pinMode(RELAY_ROAD2, OUTPUT);

  // Relay protection: force both valves to a known OPEN state at boot
  openRoad1();
  openRoad2();

  attachInterrupt(digitalPinToInterrupt(MAIN_FLOW_SENSOR), mainFlowCounter, FALLING);
  attachInterrupt(digitalPinToInterrupt(ROAD1_FLOW_SENSOR), road1FlowCounter, FALLING);
  attachInterrupt(digitalPinToInterrupt(ROAD2_FLOW_SENSOR), road2FlowCounter, FALLING);

  connectWiFi();
  firebaseInit();

  previousMillis = millis();
  Serial.println("System ready.\n");
}


// =========================================================
//                       loop()
// =========================================================

void loop()
{
  checkWiFiConnection();

  if (millis() - previousMillis >= interval)
  {
    previousMillis = millis();

    calculateFlow();
    checkLeakage();
    checkManualOverride();
    printFlowData();
    uploadFirebase();
  }
}
