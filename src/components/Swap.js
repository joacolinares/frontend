import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";
import axios from "axios";
import { useContractWrite, usePrepareContractWrite, useSendTransaction, useWaitForTransaction } from "wagmi";
import { ethers } from 'ethers';
import abiSwap from '../abis/abiSwap.json'


function Swap(props) {
  const { address, isConnected } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to:null,
    data: null,
    value: null,
  }); 
  const [error, setError] = useState("")

  const {data, sendTransaction} = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    }
  })

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
    if(e.target.value && prices){
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2))
    }else{
      setTokenTwoAmount(null);
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i){
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address)
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address)
    }
    setIsOpen(false);
  }

  async function fetchPrices(one, two){

      const res = await axios.get(`http://localhost:3001/tokenPrice`, {
        params: {addressOne: one, addressTwo: two}
      })

      
      setPrices(res.data)
  }


  async function fetchDexSwap(){
       /* if (window.ethereum) {
          try {
              const provider = new ethers.providers.Web3Provider(window.ethereum);
              await provider.send("eth_requestAccounts", []);
              const signer = provider.getSigner();
              console.log("Account:", await signer.getAddress());
          } catch (error) {
              console.error(error);
          }
        } else {
          console.log('Ethereum object not found, install MetaMask.');
        }
      */

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contractToken = new ethers.Contract(
          tokenOne.address, [
            "function approve(address spender, uint256 amount) public returns (bool)"
          ], 
        signer);

        const contract = new ethers.Contract(
          "0x112D67F14f6C30c3725b7f9A08610bc24c8d5A84",abiSwap , 
        signer);




        try {
          const transaction = await contractToken.approve("0x112D67F14f6C30c3725b7f9A08610bc24c8d5A84", ethers.constants.MaxUint256);
      
          const receipt = await transaction.wait();
          if (receipt && receipt.status === 1) {
            const swapTransaction = await contract.swapDAIToUSDC(
              ethers.utils.parseUnits(tokenOneAmount.toString(), tokenOne.decimals).toString(),
              tokenOne.address,
              tokenTwo.address
            );
      
            await swapTransaction.wait();
          }
        } catch (error) {
          setError('Error en swap. Verifique su saldo y vuelva a intentar');
        }
  }

const connectWallet = async() =>{
  if (window.ethereum) {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        console.log("Account:", await signer.getAddress());
        setError("Luego de conectar la billetera debe recargar la pagina")
    } catch (error) {
        console.error(error);
    }
  } else {
    console.log('Ethereum object not found, install MetaMask.');
  }
}



  useEffect(()=>{

    fetchPrices(tokenList[0].address, tokenList[1].address)

  }, [])

  useEffect(()=>{

      if(txDetails.to && isConnected){
       // sendTransaction();
      }
  }, [txDetails])

  useEffect(()=>{

    messageApi.destroy();

    if(isLoading){
      messageApi.open({
        type: 'loading',
        content: 'Transaction is Pending...',
        duration: 0,
      })
    }    

  },[isLoading])

  useEffect(()=>{
    messageApi.destroy();
    if(isSuccess){
      messageApi.open({
        type: 'success',
        content: 'Transaction Successful',
        duration: 1.5,
      })
    }else if(txDetails.to){
      messageApi.open({
        type: 'error',
        content: 'Transaction Failed',
        duration: 1.50,
      })
    }


  },[isSuccess])

  console.log(isConnected)
  

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={e.img} alt={e.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.name}</div>
                  <div className="tokenTicker">{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
        {/*  <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
        </Popover>*/}
        </div>
        <div className="inputs">
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={changeAmount}
            disabled={!prices}
          />
          <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetOneLogo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
       <center> <p style={{color:"red"}}>{error}</p></center>
        </div>
        {
          isConnected
              ?
              <div className="swapButton" disabled={!tokenOneAmount || !isConnected} onClick={fetchDexSwap}>Swap</div>
              :
              <div className="swapButton" onClick={connectWallet} >Conectar Billetera</div>
        }
       
      </div>
    </>
  );
}

export default Swap;
