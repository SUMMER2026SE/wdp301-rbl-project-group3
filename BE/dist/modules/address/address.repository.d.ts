import { IUserAddress } from '../../models/userAddress.model';
export declare class AddressRepository {
    findAllByUserId(userId: string): Promise<IUserAddress[]>;
    findByIdAndUserId(addressId: string, userId: string): Promise<IUserAddress | null>;
    countByUserId(userId: string): Promise<number>;
    create(data: {
        userId: string;
        receiverName: string;
        phoneNumber: string;
        addressDetail: string;
        isDefault: boolean;
    }): Promise<IUserAddress>;
    update(addressId: string, data: Partial<Pick<IUserAddress, 'receiverName' | 'phoneNumber' | 'addressDetail'>>): Promise<IUserAddress | null>;
    delete(addressId: string): Promise<void>;
    setDefault(userId: string, addressId: string): Promise<IUserAddress | null>;
    setNewestAsDefault(userId: string): Promise<void>;
}
export declare const addressRepository: AddressRepository;
//# sourceMappingURL=address.repository.d.ts.map