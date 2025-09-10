import React from 'react'
import Header from './components/Header'
import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Footer from './components/Footer'
import Students from './pages/Students'
import Attendance from './pages/Attendance'
import TimeTable from './pages/TimeTable'
import ModuleCards from './pages/ModuleCards'
import ModuleDetails from './pages/ModuleDetails'

const App = () => {
  return (
    <div className=''>
      
      <Header />
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/students' element={<Students />} />
        <Route path='/attendance' element={<Attendance />} />
        <Route path='/time-table' element={<TimeTable />} />
        <Route path='/modules' element={<ModuleCards />} />
        <Route path="/modules/:moduleName" element={<ModuleDetails />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App