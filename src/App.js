import './App.css';
import { Snippet } from './Renderer';
import React, { useState, useEffect} from 'react';

function App() {

  const [code, setCode] = useState('')

  useEffect(() => { 
    setCode([
      `basic.forever(function () {
      if (sonar.ping(
      DigitalPin.P0,
      DigitalPin.P0,
      PingUnit.Centimeters
      ) < 5 && tinkercademy.MoistureSensor(AnalogPin.P0) == 7) {
          tinkercademy.LED(DigitalPin.P0, OnOff.On)
      }
    })`, 
      `input.onGesture(Gesture.Shake, () => {
      basic.showNumber(randint(1, 6))
    })`,
      `basic.showString("Hello World")`,
      `basic.forever(() => {
        led.toggle(0, 2)
        led.toggle(4, 2)
        basic.pause(250)
        led.toggle(0, 3)
        led.toggle(4, 3)
     })`])
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <Snippet code={code[0]} packageId="_54gXiFU3h2bL" />
        <Snippet code={code[1]} packageId="_54gXiFU3h2bL"/>
        <Snippet code={code[2]} packageId="_54gXiFU3h2bL"/>
        <Snippet code={code[3]} packageId="_54gXiFU3h2bL"/>

      </header>
    </div>
  );
}

export default App;
