#include "Timer.h"

#define ONE_WIRE_BUS 8
#include <DallasTemperature.h>
#include <SoftwareSerial.h>
OneWire oneWire(ONE_WIRE_BUS);

DallasTemperature sensors(&oneWire);
Timer t;

SoftwareSerial cSerial(9, 10); // RX, TX
SoftwareSerial mySerial(3, 11); // RX, TX
int Co2 = 0;

void readCo2() {
  char b[] = { 0x11, 0x01, 0x01, 0xED };
  byte r[40];
  int c;
  cSerial.write(b, 4);

  if ((c = cSerial.readBytes(r, 8)) < 8) {
    Serial.println("co2 error "+ String(c));
    return;
  }
  
  Co2 = (r[3] * 256) + r[4];
}

void repeat() {
  
  cSerial.listen();
  if(cSerial.isListening() > 0 && mySerial.isListening() == 0) {
    readCo2();
  }
  
  mySerial.listen();
  if(mySerial.isListening() > 0 && cSerial.isListening() == 0) {
    sensors.requestTemperatures();
    mySerial.println( "temp=" + String(sensors.getTempCByIndex(0)) + "&co2=" + String(Co2) );
    Serial.println("temp=" + String(sensors.getTempCByIndex(0)) + "&co2=" + String(Co2));
  }
}

void setup() {
  // Open serial communications and wait for port to open:
  pinMode(9, INPUT);
  pinMode(3, INPUT);
  pinMode(10, OUTPUT);
  pinMode(11, OUTPUT);
  
  Serial.begin(9600);
  cSerial.begin(9600);
  sensors.begin();
  mySerial.begin(9600);
  t.every(3000, repeat);
}

void loop() { // run over and over
  t.update();
  //while (mySerial.available()) Serial.print((char)mySerial.read());

}
