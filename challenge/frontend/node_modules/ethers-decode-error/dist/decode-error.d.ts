import { Interface } from '@ethersproject/abi';
import { utils } from 'ethers';
import { DecodedError } from './types';
export declare const decodeError: <T extends Interface>(error: any, abiOrInterface?: string | T | readonly (string | utils.Fragment | import("@ethersproject/abi").JsonFragment)[]) => DecodedError;
