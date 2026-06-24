export declare class AddressService {
    getAddresses(userId: string): Promise<{
        addressId: string;
        receiverName: string;
        phoneNumber: string;
        addressDetail: string;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    addAddress(userId: string, data: {
        receiverName: string;
        phoneNumber: string;
        addressDetail: string;
        isDefault?: boolean;
    }): Promise<{
        addressId: string;
        receiverName: string;
        phoneNumber: string;
        addressDetail: string;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateAddress(userId: string, addressId: string, data: {
        receiverName?: string;
        phoneNumber?: string;
        addressDetail?: string;
    }): Promise<{
        addressId: string;
        receiverName: string;
        phoneNumber: string;
        addressDetail: string;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteAddress(userId: string, addressId: string): Promise<void>;
    setDefaultAddress(userId: string, addressId: string): Promise<{
        addressId: string;
        receiverName: string;
        phoneNumber: string;
        addressDetail: string;
        isDefault: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare const addressService: AddressService;
//# sourceMappingURL=address.service.d.ts.map