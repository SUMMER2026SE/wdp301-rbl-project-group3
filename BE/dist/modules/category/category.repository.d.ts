import { ICategory } from '../../models/category.model';
export declare class CategoryRepository {
    create(data: Partial<ICategory>): Promise<ICategory>;
    findAll(filters: {
        status?: string;
        keyword?: string;
    }): Promise<ICategory[]>;
    findById(id: string): Promise<ICategory | null>;
    findByCode(code: string): Promise<ICategory | null>;
    updateById(id: string, data: Partial<ICategory>): Promise<ICategory | null>;
}
export declare const categoryRepository: CategoryRepository;
//# sourceMappingURL=category.repository.d.ts.map