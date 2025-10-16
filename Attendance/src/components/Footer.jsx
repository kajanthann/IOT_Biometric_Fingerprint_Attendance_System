import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const Footer = () => {
  const { darkMode } = useContext(AppContext);
  const primaryColor = "#01996f";

  const bgClass = darkMode ? "bg-gray-900" : "bg-white";
  const textClass = darkMode ? "text-white" : "text-black";

  return (
    <footer
      className={`${bgClass} ${textClass} text-center py-3 w-full shadow-lg border-t`}
      style={{ borderTopColor: primaryColor }}
    >
      <p className="text-sm">
        © {new Date().getFullYear()} Faculty of Computing. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
