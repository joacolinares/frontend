import React from "react";
import Logo from "../logo.png";
import Eth from "../eth.svg";
import { Link } from "react-router-dom";

function Header(props) {

  const {address, isConnected, connect} = props;

  return (
    <header>
      <div className="leftH">
        <img style={{width:"150px"}} src={Logo} alt="logo" className="logo" />
      </div>
      <div className="rightH">
        <div className="headerItem">
          Mumbai
        </div>
       {/* <div className="connectButton" onClick={connect}>
          {isConnected ? (address.slice(0,4) +"..." +address.slice(38)) : "Connect"}
  </div>*/}
      </div>
    </header>
  );
}

export default Header;
