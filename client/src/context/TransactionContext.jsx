import { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

  return transactionContract;
}

export const TransactionProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [currentAccount, setCurrentAccount] = useState('');
  const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' });
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));

  const handleChange = (e, name) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: e.target.value
    }));
  }

  const getAllTransactions = async () => {
    try {
      if (!ethereum) {
        return alert('Please install metamask');
      }

      const transactionContract = getEthereumContract();
      const availableTransactions = await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map((transation) => ({
        addressTo: transation.receiver,
        addressFrom: transation.sender,
        timestamp: new Date(transation.timestamp.toNumber() * 1000).toLocaleString(),
        message: transation.message,
        keyword: transation.keyword,
        amount: parseInt(transation.amount._hex) / (10 ** 18),
      }));

      setTransactions(structuredTransactions);
    } catch (error) {
      console.error(error);

      throw new Error('You dont have any transactions.');
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) {
        return alert('Please install metamask');
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);

        getAllTransactions();
      } else {
        console.log('No accounts found.');
      }
    } catch (error) {
      console.error(error);

      throw new Error('No ethereum object.');
    }
  }

  const checkIfTransactionExists = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();

      window.localStorage.setItem('transactionCount', transactionCount);
    } catch (error) {
      console.error(error);

      throw new Error('No ethereum object.');
    }
  }

  const connectWallet = async () => {
    try {
      if (!ethereum) {
        return alert('Please install metamask');
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);

      throw new Error('No ethereum object.');
    }
  }

  const sendTransaction = async () => {
    try {
      if (!ethereum) {
        return alert('Please install metamask');
      }

      setIsLoading(true);

      const { addressTo, amount, keyword, message } = formData;
      const parsedAmount = ethers.utils.parseEther(amount);
      const transactionContract = getEthereumContract();

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: '0x5208', // 21000 GWEI === 0.000021 ETH
          value: parsedAmount._hex
        }]
      });

      const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

      await transactionHash.wait();

      const transactionCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionCount.toNumber());

      setIsLoading(false);

      window.location.reload();
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      throw new Error('No ethereum object.');
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionExists();
  }, []);

  return (
    <TransactionContext.Provider value={{
      formData,
      isLoading,
      transactions,
      handleChange,
      connectWallet,
      currentAccount,
      sendTransaction,
    }}>
      { children }
    </TransactionContext.Provider>
  );
}
