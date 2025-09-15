import React from 'react'

const Hero = () => {

  const colors = [
    { name: "Main Theme", bg: "#02c986", text: "#ffffff" },
    { name: "Dark Variant", bg: "#01996f", text: "#ffffff" },
    { name: "Light Variant", bg: "#8ef4cc", text: "#000000" },
    { name: "Online LED", bg: "#00ff88", text: "#000000" },
    { name: "Offline LED", bg: "#ff5c5c", text: "#000000" },
    { name: "Offline Text", bg: "#e0f9f0", text: "#000000" },
  ];


  return (
    <div className="p-4 space-y-4">
      {colors.map((color) => (
        <div key={color.name} className="flex items-center gap-4">
          <div
            className="px-20 py-10 rounded shadow-lg"
            style={{ backgroundColor: color.bg }}
          ></div>
          <h1 style={{ color: color.text, fontWeight: "bold" }}>
            {color.name} ({color.bg})
          </h1>
        </div>
      ))}
    </div>
  )
}

export default Hero