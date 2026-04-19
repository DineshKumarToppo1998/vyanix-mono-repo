'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Edit, Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children: CategoryTree[];
}

const buildCategoryTree = (categories: any[]): CategoryTree[] => {
  const categoryMap = new Map<string, CategoryTree>();
  const roots: CategoryTree[] = [];

  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId,
      children: [],
    });
  });

  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id);
    if (node) {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
};

const CategoryRow = ({
  category,
  depth = 0,
  categories,
  onEdit,
  onDelete,
}: {
  category: CategoryTree;
  depth?: number;
  categories: any[];
  onEdit: (category: CategoryTree) => void;
  onDelete: (id: string) => void;
}) => {
  const parentNode = categories.find((c) => c.id === category.parentId);

  return (
    <>
      <TableRow>
        <TableCell style={{ paddingLeft: `${depth * 24}px` }}>
          <div className="flex items-center gap-2">
            {depth > 0 && <div className="h-4 w-4 border-l-2 border-muted" />}
            <span className="font-medium">{category.name}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{category.slug}</Badge>
        </TableCell>
        <TableCell>
          {parentNode ? (
            <span className="text-sm text-muted-foreground">{parentNode.name}</span>
          ) : (
            <span className="text-sm text-muted-foreground italic">None (Root)</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {category.children.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          depth={depth + 1}
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

export default function CategoriesPage() {
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<CategoryTree[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTree | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    slug: '',
    parentId: '' as string | undefined,
  });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminApi.getCategories(),
  });

  const isAuthError = error && typeof error === 'object' && 'status' in error && ((error as { status: number }).status === 401 || (error as { status: number }).status === 403);

  const createMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category created successfully',
        description: 'The new category has been added.',
        variant: 'default',
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error creating category',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      adminApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category updated successfully',
        description: 'The category has been updated.',
        variant: 'default',
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error updating category',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: 'Category deleted successfully',
        description: 'The category has been deleted.',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Error deleting category',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (data?.data) {
      setCategoriesData(data.data);
      setTreeData(buildCategoryTree(data.data));
    }
  }, [data]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const resetForm = () => {
    setFormState({
      name: '',
      slug: '',
      parentId: '' as string | undefined,
    });
    setSelectedCategory(null);
  };

  const handleCreate = () => {
    setFormState({
      name: '',
      slug: '',
      parentId: '' as string | undefined,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (category: CategoryTree) => {
    setSelectedCategory(category);
    setFormState({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Category name is required.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      name: formState.name,
      slug: formState.slug || generateSlug(formState.name),
      parentId: formState.parentId || undefined,
    };

    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormState((prev) => ({
      ...prev,
      name,
      slug: prev.slug && prev.name === name ? prev.slug : generateSlug(name),
    }));
  };

  const roots = treeData.filter((cat) => !cat.parentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 w-full bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {isAuthError ? (
              <>
                <p className="text-muted-foreground mb-4">Session expired. Please sign in again.</p>
                <Button asChild variant="outline">
                  <Link href="/account">Sign In</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">Failed to load categories. Please try again.</p>
                <Button onClick={() => refetch()} variant="outline">
                  Retry
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Categories</CardTitle>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No categories found. Click "Create Category" to add your first category.
                    </TableCell>
                  </TableRow>
                ) : (
                  roots.map((root) => (
                    <CategoryRow
                      key={root.id}
                      category={root}
                      categories={categoriesData}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isEditDialogOpen || isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditDialogOpen(false);
            setIsCreateDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Update the category details below.'
                : 'Enter the category details to create a new parent category.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Category Name *
              </label>
              <Input
                id="name"
                value={formState.name}
                onChange={handleNameChange}
                placeholder="Enter category name"
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Slug
              </label>
              <Input
                id="slug"
                value={formState.slug}
                onChange={(e) => setFormState((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="auto-generated"
                className="h-10 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="parentId" className="text-sm font-medium">
                Parent Category
              </label>
              <Select
                value={formState.parentId || 'none'}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, parentId: value === 'none' ? undefined : value }))}
              >
                <SelectTrigger id="parentId" className="h-10">
                  <SelectValue placeholder="Select parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Category)</SelectItem>
                  {categoriesData
                    .filter((c) => c.id !== selectedCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
