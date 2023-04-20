import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getContract } from '@wagmi/core';
import { contracts as contractInfos } from '../const/contracts';
import {
  PlayerContracts,
  PlayerInfos,
  getBabyjub,
  getContracts,
  getPlayerPksAndSks,
} from '../utils/newUtils';
import { Contract, ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { useZKContext } from './useZKContext';

export function useGame() {
  const router = useRouter();
  const { address } = useAccount();
  const [contract, setContract] = useState<Contract>();
  const [playerPksAndSks, setPlayerPksAndSks] = useState<PlayerInfos>();
  const [gameId, setGameId] = useState<number>();
  const [isJoined, setIsJoined] = useState(false);

  const zkContext = useZKContext();
  const owner = router?.query?.owner as string;
  const joiner = router?.query?.otherAddress as string;
  const playerAddresses = [owner, joiner];

  const handleGetBabyPk = async () => {
    try {
      const babyJubs = await getBabyjub(playerAddresses.length);

      const playerPksAndSks = getPlayerPksAndSks(
        babyJubs,
        playerAddresses as string[]
      );
      console.log('playerPksAndSks', playerPksAndSks);
      setPlayerPksAndSks(playerPksAndSks);
    } catch (error) {}
  };

  const handleGetContracts = () => {
    if (!contractInfos) return;
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    const signer = provider.getSigner();

    const contract = getContract({
      address: contractInfos.HiLo.address,
      abi: contractInfos.HiLo.abi,
      signerOrProvider: signer,
    });

    setContract(contract);
  };

  const handleQueryAggregatedPk = async () => {
    try {
      const keys = await contract?.queryAggregatedPk(gameId);
      const deck = await contract?.queryDeck(gameId);
      const aggregatedPk = [keys[0].toBigInt(), keys[1].toBigInt()];
      const data = await zkContext?.genShuffleProof(aggregatedPk, deck);
      console.log('data', data);
      //   await contract?.shuffle(proof, shuffleData, gameId, {
      //     gasLimit: 1000000,
      //   });
      //   console.log('keys', keys);
    } catch (error) {
      console.log(error);
    }
  };

  const getGameInfo = async () => {
    try {
      const games = await contract?.['games'](16);
    } catch (error) {}

    // console.log('games', games);
  };

  useEffect(() => {
    if (!router.isReady) return;
    handleGetContracts();
    handleGetBabyPk();
  }, [router.isReady]);

  //   useEffect(() => {
  //     getGameInfo();
  //   }, []);

  useEffect(() => {
    if (!gameId || !isJoined) return;
    handleQueryAggregatedPk();
  }, [gameId, isJoined]);

  useEffect(() => {
    if (!contract || !joiner) return;
    const GameCreatedListener = async (arg1: any, arg2: any, event: any) => {
      try {
        const gameId = Number(arg1);
        const creator = arg2;
        console.log('arg1', arg1);
        console.log('arg2', arg2);
        console.log('joiner === address', joiner === address, joiner, address);
        setGameId(gameId);

        console.log('playerPksAndSks?.[joiner]', playerPksAndSks?.[joiner]);
        if (creator === owner) {
          if (joiner === address) {
            console.log('feqfq,feqfqe');
            await contract?.['joinGame'](gameId, [
              playerPksAndSks?.[joiner]?.pk[0],
              playerPksAndSks?.[joiner]?.pk[1],
            ]);
          }
        }
      } catch (error) {
        console.log('error', error);
      }
    };

    contract?.on('GameCreated', GameCreatedListener);
    return () => {
      contract?.off('GameCreated', GameCreatedListener);
    };
  }, [address, contract, joiner, owner, playerPksAndSks]);

  useEffect(() => {
    if (!contract) return;

    const GameJoinedListener = async (arg1: any, arg2: any, event: any) => {
      try {
        const joinerAddress = arg2;
        if (joiner === joinerAddress) {
          setIsJoined(true);
        }
      } catch (error) {}
    };

    contract?.on('GameJoined', GameJoinedListener);
    return () => {
      contract?.off('GameJoined', GameJoinedListener);
    };
  }, [contract, joiner]);

  return {
    playerAddresses,
    contract,
    playerPksAndSks,
    owner,
    joiner,
    address,
    gameId,
    isJoined,
  };
}