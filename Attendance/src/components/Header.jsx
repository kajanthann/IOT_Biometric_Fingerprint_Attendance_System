import React from 'react'
import { NavLink } from 'react-router-dom'

const Header = () => {
  return (
    <div className='flex justify-between items-center p-4' style={{ backgroundColor: '#02c986' }}>
  <NavLink to={'/'}>
    <div className="text-white text-4xl flex items-center">
      F <span className=''>O</span>C
      <span className="text-black text-xs ml-[-12px] mt-[2px] align-middle">Attendance</span>
    </div>
  </NavLink>

  <div className='flex space-x-10 text-white font-medium'>
    <NavLink to={'/'} className={({isActive}) => isActive ? 'font-bold underline' : ''}>Dashboard</NavLink>
    <NavLink to={'/students'} className={({isActive}) => isActive ? 'font-bold underline' : ''}>Students</NavLink>
    <NavLink to={'/attendance'} className={({isActive}) => isActive ? 'font-bold underline' : ''}>Attendance</NavLink>
    <NavLink to={'/modules'} className={({isActive}) => isActive ? 'font-bold underline' : ''}>Modules</NavLink>
    <NavLink to={'/time-table'} className={({isActive}) => isActive ? 'font-bold underline' : ''}>TimeTable</NavLink>
  </div>
</div>

  )
}

export default Header