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
import { ethers,BigNumber } from 'ethers';
import abiSwap from '../abis/abiSwap.json'
import {
  PERMIT2_ADDRESS,
  AllowanceTransfer,
  AllowanceProvider
} from'@uniswap/permit2-sdk'
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router'
import { CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core'
import erc20Abi from'../abis/ERC20.json'// assert { type: 'json' };
import { Token } from '@uniswap/sdk-core'



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
  const [priceToken, setPriceToken] = useState(0)
  const [txDetails, setTxDetails] = useState({
    to:null,
    data: null,
    value: null,
  }); 
  const [conectado, setConectado] = useState(false)
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

  const Moralis = require("moralis").default;
  console.log("MORALIS")
  console.log(Moralis)

  async function fetchPrices(one, two){

    const res = await axios.get(`https://beathard-backend.fly.dev/tokenPrice`, {
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
        setConectado(true)
    } catch (error) {
        console.error(error);
      //  setError("Error al conectar la wallet")
        setConectado(false)
    }
  } else {
    console.log('Ethereum object not found, install MetaMask.');
    setError("Instale Metamask")
    setConectado(false)
  }
}

async function putPrice() {
  const res = await axios.get(`https://beathard-backend.fly.dev/tokenPrice`, {
    params: {addressOne: "0xFA3c05C2023918A4324fDE7163591Fe6BEBd1692", addressTwo: "0xFA3c05C2023918A4324fDE7163591Fe6BEBd1692"}
  })
  setPriceToken(parseFloat(res.data.tokenOne).toFixed(4));


}




  useEffect(()=>{

    fetchPrices(tokenList[0].address, tokenList[1].address)

    connectWallet()
    putPrice()

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
  


////////Funcion swap///////////////////

// const ethersProvider = new ethers.providers.JsonRpcProvider(`https://polygon-mainnet.infura.io/v3/2DgMveozBqxPiVbdohUrkuJBEoS`)
// const owner = new ethers.Wallet(`71c2f48d8c6d3168766e001b658bf17675410abb3f595dae1a6f1667398e1838`, ethersProvider)

const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
const owner = ethersProvider.getSigner();
const chainId = 137
const uniswapRouterAddress = '0x643770E279d5D0733F21d6DC03A8efbABf3255B4'



async function approvePermit2Contract(erc20Address, amount) {
   console.log("test")
  const erc20 = new ethers.Contract(erc20Address, erc20Abi, owner);
  console.log("error")
  const approveTx = await erc20.approve(PERMIT2_ADDRESS, amount, {gasPrice:600000000000000});
  console.log('approve tx hash:', approveTx.hash);
  // wait for approve transaction confirmation
  const receipt = await approveTx.wait();
  if (receipt.status === 1) console.log('approve transaction confirmed');
  else throw new Error(receipt);
}

async function getAllowanceAmount(erc20TokenAddress, spender) {
  const erc20 = new ethers.Contract(erc20TokenAddress, erc20Abi, owner);
  const allowance = await erc20.allowance(owner.getAddress(), spender);
  return allowance;
}

async function getSwapRoute(
  sourceToken,
  destToken,
  amountInWei,
  permit,
  signature
) {
  const inputAmount = CurrencyAmount.fromRawAmount(
    sourceToken,
    amountInWei.toString()
  );

  const router = new AlphaRouter({ chainId, provider: ethersProvider });
  const route = await router.route(
    inputAmount,
    destToken,
    TradeType.EXACT_INPUT,
    {
      recipient: owner.getAddress(),
      slippageTolerance: new Percent(5, 1000),

      type: SwapType.UNIVERSAL_ROUTER,
      deadlineOrPreviousBlockhash: Math.floor(Date.now() / 1000 + 1800),

      inputTokenPermit: {
        ...permit,
        signature

      }
    }
  );
  console.log(`Quote Exact In: ${amountInWei}  -> ${route.quote.toExact()}`);
  return route;
}

async function executeSwap() {

  // -------------------------------> DINÁMICO

  const A = new Token(
    chainId,
    tokenOne.address,
    tokenOne.decimals,
    tokenOne.ticker,
    tokenOne.name
  );

  const B = new Token(
    chainId,
    tokenTwo.address,
    tokenTwo.decimals,
    tokenTwo.ticker,
    tokenTwo.name
  );

  const sourceToken = A;
  const destToken = B;
  const amount = 0.5;

  const amountInWei = ethers.utils.parseUnits(
    tokenOneAmount.toString(),
    sourceToken.decimals
  );

  // -------------------------------> DINÁMICO
  // expiry for permit & tx confirmation, 30 mins
  const expiry = Math.floor(Date.now() / 1000 + 1800);

  // check if we have approved enough amount
  // for PERMIT2 in source token contract
  const allowance = await getAllowanceAmount(
    sourceToken.address,
    PERMIT2_ADDRESS,
    owner
  );
  console.log('current allowance:', allowance.toString());

  if (allowance < amountInWei) {
    // approve permit2 contract for source token
    console.log('sending approve tx to add more allowance');
    await approvePermit2Contract(
      sourceToken.address,

      // Los dex le mandan el max uint256
      // ethers.constants.MaxInt256

      // -------------------------------> DINÁMICO
      ethers.constants.MaxInt256
    );
  }

  // allowance provider is part of permit2 sdk
  // using it to get nonce value of last permit
  // we signed for this source token
  const allowanceProvider = new AllowanceProvider(
    ethersProvider,
    PERMIT2_ADDRESS
  );

  // for allowance based transfer we can just use
  // next nonce value for permits.
  // for signature transfer probably it has to be
  // a prime number or something. checks uniswap docs.
  // NO --------------------------->>>>>>> const nonce = 1;
  const nonce = await allowanceProvider.getNonce(
    sourceToken.address,
    owner.getAddress(),
    uniswapRouterAddress
  );
  console.log('nonce value:', nonce);

  // create permit with AllowanceTransfer
  const permit = {
    details: {
      token: sourceToken.address,
      amount: amountInWei,
      expiration: expiry,
      nonce
    },
    spender: uniswapRouterAddress,
    sigDeadline: expiry
  };
  const { domain, types, values } = AllowanceTransfer.getPermitData(
    permit,
    PERMIT2_ADDRESS,
    chainId
  );

  // create signature for permit
  const signature = await owner._signTypedData(domain, types, values);
  console.log('signature: ', signature);

  // NOTE: optionally verify the signature
  const address = ethers.utils.verifyTypedData(
    domain,
    types,
    values,
    signature
  );

  if (address !== owner.getAddress())
    throw new Error('signature verification failed');
  else console.log(`signature verified, signed by: ${address}`);

  // get swap route for tokens
  const route = await getSwapRoute(
    sourceToken,
    destToken,
    amountInWei,
    permit,
    signature
  );

  console.log('route calldata:', route.methodParameters.calldata);

  // create transaction arguments for swap
  const txArguments = {
    data: route.methodParameters.calldata,
    to: uniswapRouterAddress,
    // value: BigNumber.from(route.methodParameters.value),
    from: owner.getAddress(),
    gasPrice: route.gasPriceWei,
    
    // -------------------------------> DINÁMICO
    gasLimit: BigNumber.from('1000000')
  };

  // send out swap transaction
  const transaction = await owner.sendTransaction(txArguments);
  console.log('Swap transaction hash: ', transaction.hash);
}



//////////////////Termina////////////






function handleSwap() {
  console.log("TEST")
  executeSwap();
}







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
     <center>     <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/16639.png" style={{display:"inline-block", width:"40px"}}></img> <h5 style={{display:"inline-block"}}>{priceToken} $</h5></center>
      <div className="tradeBoxHeader">
    
        </div>
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          {/*<h5>Balance de XCRE:</h5>*/}

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
          conectado
              ?
          <div className="swapButton" disabled={!tokenOneAmount } onClick={handleSwap}>Swap</div>
             
              
              :
              <div className="swapButton" onClick={connectWallet} >Conectar Billetera</div>
        }
       
      </div>
    </>
  );
}

export default Swap;
