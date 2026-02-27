import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#0b1120] border-t border-sky-500/10 text-center py-6 w-full mt-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-sky-900/5 to-transparent pointer-events-none"></div>
      <p className="text-slate-500 text-sm font-medium relative z-10">
        © {new Date().getFullYear()}{" "}
        <span className="text-sky-400/80">Faculty of Computing</span>. All
        rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
