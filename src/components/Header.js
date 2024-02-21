import React, { useState } from "react";
import Logo from "../logo.png";
import Eth from "../eth.svg";
import { Link } from "react-router-dom";

function Header(props) {
  const { address, isConnected, connect } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header>
      <div className="leftH">
        {
          isMenuOpen
              ?
              <></>
              :
              <img
          style={{ width: "220px" }}
          src={"https://kryzum.com/wp-content/uploads/2020/06/Logo200X40.png"}
          alt="logo"
          className="logo"
        />
        }
      </div>
      <div className="rightH">
        {/* Botón de hamburguesa solo visible en dispositivos móviles
        <div className="menuToggle" onClick={toggleMenu}>
          <span className="menuIcon">&#9776;</span>
        </div> */}
        {/* Menú de navegación */}
        <nav className={isMenuOpen ? "mobileMenu" : "desktopMenu"}>
          
        </nav>
        {/* Botón de conexión */}
        {/* <div className="connectButton" onClick={connect}>
          {isConnected ? address.slice(0, 4) + "..." + address.slice(38) : "Connect"}
        </div> */}
      </div>
    </header>
  );
}

export default Header;
