import { ICategory } from '../../models/category.model';
export declare class CategoryService {
    createCategory(data: Partial<ICategory>): Promise<ICategory>;
    getCategories(filters: {
        status?: string;
        keyword?: string;
        page?: number;
        limit?: number;
    }): Promise<any>;
    getCategoryById(id: string): Promise<ICategory>;
    updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory>;
    deleteCategory(id: string): Promise<ICategory>;
}
export declare const categoryService: CategoryService;
//# sourceMappingURL=category.service.d.ts.map