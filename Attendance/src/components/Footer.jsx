import React from "react";

const Footer = () => {
  return (
    <footer className="text-white text-center py-3 w-full fixed bottom-0 left-0" style={{ backgroundColor: '#02c986' }}>
      <p className="text-sm">
        © {new Date().getFullYear()} Faculty of Computing. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
