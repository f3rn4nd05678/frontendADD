import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='bg-red-700 w-[50rem] h-[10rem]'>
      </div>
      <h1 className='text-red-500'>Vite + React</h1>

    </>
  )
}

export default App
