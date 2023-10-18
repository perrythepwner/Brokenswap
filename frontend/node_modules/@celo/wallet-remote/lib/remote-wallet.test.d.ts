export declare const PRIVATE_KEY1 = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
export declare const ACCOUNT_ADDRESS1: string;
export declare const CHAIN_ID = 44378;
export declare const TYPED_DATA: {
    types: {
        EIP712Domain: {
            name: string;
            type: string;
        }[];
        Person: {
            name: string;
            type: string;
        }[];
        Mail: {
            name: string;
            type: string;
        }[];
    };
    primaryType: string;
    domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: string;
    };
    message: {
        from: {
            name: string;
            wallet: string;
        };
        to: {
            name: string;
            wallet: string;
        };
        contents: string;
    };
};
